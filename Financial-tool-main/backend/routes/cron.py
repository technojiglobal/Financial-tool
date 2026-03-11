from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, timezone
from db import db, next_id
from routes.auth import IST, login_required
import os

cron_bp = Blueprint("cron", __name__)

CRON_SECRET = os.environ.get("CRON_SECRET", "")

# Document chain: what comes after each type
NEXT_DOC_TYPE = {
    "Proposal": "Agreement",
    "Agreement": "Invoice",
    "Invoice": "No due",
}


def _process_reminders():
    """Send emails for all reminders where date+time <= now and email_sent == False."""
    now = datetime.now(IST)
    today_str = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")
    sent_count = 0
    from email_utils import send_general_reminder

    due_reminders = list(db.reminders.find({
        "email_sent": {"$ne": True},
        "date": {"$lte": today_str}
    }))

    for rem in due_reminders:
        try:
            rem_time = rem.get("time", "")
            if rem_time and rem.get("date") == today_str:
                if current_time < rem_time:
                    continue



            if send_general_reminder(rem):
                db.reminders.update_one({"id": rem["id"]}, {"$set": {"email_sent": True}})
                sent_count += 1

                db.notifications.insert_one({
                    "id": next_id("notifications"),
                    "type": "reminder",
                    "title": "Reminder Sent",
                    "message": f"Email sent for: {rem.get('description', 'Reminder')}",
                    "read": False,
                    "created_at": now.strftime("%Y-%m-%d %I:%M %p"),
                })
        except Exception as e:
            print(f"[CRON ERROR] Reminder failed for id {rem.get('id')}: {e}")
            continue

    return sent_count


def _process_document_reminders():
    """Auto-send reminders for ALL document types based on their reminder_days."""
    now = datetime.now(IST)
    sent_count = 0
    from email_utils import send_document_reminder

    # Find all sent documents with reminder_days set and not yet reminded
    docs = list(db.documents.find({
        "status": "Sent",
        "reminder_days": {"$gt": 0},
        "auto_reminder_sent": {"$ne": True},
    }))

    for doc in docs:
        doc_type = doc.get("doc_type", "")
        next_type = NEXT_DOC_TYPE.get(doc_type)
        if not next_type:
            continue  # No due has no next step

        reminder_days = int(doc.get("reminder_days", 0))
        if reminder_days <= 0:
            continue

        try:
            sd = datetime.strptime(doc.get("date", ""), "%Y-%m-%d")
            days = (now.replace(tzinfo=None) - sd).days
            if days < reminder_days:
                continue  # Not yet time

            doc["days_since_sent"] = days
            doc["next_doc_type"] = next_type

            if send_document_reminder(doc):
                db.documents.update_one(
                    {"id": doc["id"]},
                    {"$set": {"auto_reminder_sent": True}}
                )

                aid = next_id("document_actions")
                db.document_actions.insert_one({
                    "id": aid,
                    "document_id": doc["id"],
                    "action": f"Auto-reminder sent: {doc_type} overdue by {days} days — follow up with {next_type}",
                    "date": now.strftime("%Y-%m-%d %I:%M %p"),
                    "user": "system",
                })

                db.notifications.insert_one({
                    "id": next_id("notifications"),
                    "type": "document_overdue",
                    "title": f"{doc_type} Follow-up Due",
                    "message": f"{doc.get('client_name')} - {doc.get('project_name')}: {doc_type} sent {days} days ago. Time to send {next_type}.",
                    "read": False,
                    "created_at": now.strftime("%Y-%m-%d %I:%M %p"),
                })

                sent_count += 1
        except Exception as e:
            print(f"[CRON ERROR] Document reminder failed for doc {doc.get('id')}: {e}")
            continue

    return sent_count


@cron_bp.route("/api/cron/process", methods=["POST"])
def process_cron():
    """Cron endpoint to process timed reminders and document follow-ups."""
    secret = request.headers.get("X-Cron-Secret", "")
    if secret != CRON_SECRET:
        auth = request.headers.get("Authorization", "")
        if f"Bearer {CRON_SECRET}" not in auth:
            return jsonify({"error": "Unauthorized"}), 401

    reminder_count = _process_reminders()
    doc_count = _process_document_reminders()

    return jsonify({
        "message": f"Processed: {reminder_count} reminders, {doc_count} document follow-ups",
        "reminders_sent": reminder_count,
        "documents_reminded": doc_count,
    })


@cron_bp.route("/api/cron/trigger", methods=["POST"])
@login_required
def trigger_reminders():
    """Manual trigger for reminders — accessible from the UI by logged-in users."""
    reminder_count = _process_reminders()
    doc_count = _process_document_reminders()

    return jsonify({
        "message": f"Sent {reminder_count} reminders, {doc_count} document follow-ups",
        "reminders_sent": reminder_count,
        "documents_reminded": doc_count,
    })


@cron_bp.route("/api/cron/test-email", methods=["POST"])
def test_email():
    """Quick test to check if email works on this server."""
    secret = request.headers.get("X-Cron-Secret", "")
    if secret != CRON_SECRET:
        return jsonify({"error": "Unauthorized"}), 401

    from email_utils import send_email, RESEND_API_KEY, ADMIN_EMAIL
    result = {
        "has_api_key": bool(RESEND_API_KEY),
        "admin_email": ADMIN_EMAIL,
    }

    success = send_email(ADMIN_EMAIL, "🧪 Test Email from Technoji", "<h2>Email test passed!</h2><p>Resend API is working on Render.</p>")
    result["email_sent"] = success
    return jsonify(result)

