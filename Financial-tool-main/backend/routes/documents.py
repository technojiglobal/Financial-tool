from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, timezone
from db import db, next_id
from routes.auth import login_required, log_action, IST

documents_bp = Blueprint("documents", __name__)

DOC_TYPES = ["Proposal", "Agreement", "Invoice", "No due"]
VALID_STATUSES = ["Sent", "Not Sent"]

# Chain: what comes after each doc type
NEXT_DOC_TYPE = {
    "Proposal": "Agreement",
    "Agreement": "Invoice",
    "Invoice": "No due",
}


@documents_bp.route("/api/documents")
@login_required
def list_documents():
    docs = list(db.documents.find({}, {"_id": 0}).sort("id", -1))
    for doc in docs:
        actions = list(db.document_actions.find(
            {"document_id": doc["id"]}, {"_id": 0}
        ).sort("date", -1))
        doc["actions"] = actions
        # Calculate reminder status for ALL doc types (except No due)
        next_type = NEXT_DOC_TYPE.get(doc.get("doc_type"))
        if doc.get("status") == "Sent" and next_type:
            sent_date = doc.get("date", "")
            reminder_days = int(doc.get("reminder_days") or 0)
            if sent_date and reminder_days > 0:
                try:
                    sd = datetime.strptime(sent_date, "%Y-%m-%d")
                    days_since = (datetime.now(IST).replace(tzinfo=None) - sd).days
                    doc["reminder_due"] = days_since >= reminder_days
                    doc["days_since_sent"] = max(0, days_since)
                    doc["next_doc_type"] = next_type
                except Exception:
                    doc["reminder_due"] = False
                    doc["days_since_sent"] = 0
            else:
                doc["reminder_due"] = False
                doc["days_since_sent"] = 0
        else:
            doc["reminder_due"] = False
            doc["days_since_sent"] = 0
    return jsonify(docs)


@documents_bp.route("/api/documents", methods=["POST"])
@login_required
def create_document():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    client_name = (data.get("client_name") or "").strip()
    project_name = (data.get("project_name") or "").strip()
    doc_type = data.get("doc_type", "Proposal")
    status = data.get("status", "Not Sent")

    if not client_name:
        return jsonify({"error": "Client name is required"}), 400
    if not project_name:
        return jsonify({"error": "Project name is required"}), 400
    if doc_type not in DOC_TYPES:
        return jsonify({"error": f"Invalid document type. Must be one of: {', '.join(DOC_TYPES)}"}), 400
    if status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"}), 400

    did = next_id("documents")
    now = datetime.now(IST)
    doc = {
        "id": did,
        "client_name": client_name,
        "project_name": project_name,
        "date": data.get("date", now.strftime("%Y-%m-%d")),
        "doc_type": doc_type,
        "status": status,
        "reminder_days": int(data.get("reminder_days") or 0),
        "auto_reminder_sent": False,
        "created_at": now.strftime("%Y-%m-%d %I:%M %p"),
    }
    db.documents.insert_one(doc)

    aid = next_id("document_actions")
    db.document_actions.insert_one({
        "id": aid,
        "document_id": did,
        "action": f"{doc['doc_type']} created",
        "date": now.strftime("%Y-%m-%d %I:%M %p"),
        "user": getattr(request, "user", {}).get("username", "system"),
    })

    log_action("create", "document", did, f"{doc['doc_type']} for {client_name} - {project_name}")
    return jsonify({"message": "Document created", "id": did}), 201


@documents_bp.route("/api/documents/<int:did>", methods=["PUT"])
@login_required
def update_document(did):
    data = request.json
    old = db.documents.find_one({"id": did})
    if not old:
        return jsonify({"error": "Document not found"}), 404

    if not data:
        return jsonify({"error": "No data provided"}), 400

    doc_type = data.get("doc_type", old.get("doc_type", ""))
    status = data.get("status", old.get("status", ""))
    if doc_type and doc_type not in DOC_TYPES:
        return jsonify({"error": f"Invalid document type"}), 400
    if status and status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status"}), 400

    now = datetime.now(IST)
    update = {
        "client_name": (data.get("client_name") or old.get("client_name", "")).strip(),
        "project_name": (data.get("project_name") or old.get("project_name", "")).strip(),
        "date": data.get("date", old.get("date", "")),
        "doc_type": doc_type,
        "status": status,
        "reminder_days": int(data.get("reminder_days") or old.get("reminder_days", 0)),
    }

    if not update["client_name"]:
        return jsonify({"error": "Client name cannot be empty"}), 400

    # Reset auto_reminder_sent if status, date, doc_type, or reminder_days changed
    if (old.get("status") != update["status"] or
        old.get("date") != update["date"] or
        old.get("doc_type") != update["doc_type"] or
        old.get("reminder_days") != update["reminder_days"]):
        update["auto_reminder_sent"] = False

    db.documents.update_one({"id": did}, {"$set": update})

    # Log changes
    changes = []
    if old.get("status") != update["status"]:
        changes.append(f"Status changed to {update['status']}")
    if old.get("doc_type") != update["doc_type"]:
        changes.append(f"Type changed to {update['doc_type']}")
    if old.get("client_name") != update["client_name"]:
        changes.append(f"Client changed to {update['client_name']}")
    if old.get("project_name") != update["project_name"]:
        changes.append(f"Project changed to {update['project_name']}")
    if old.get("date") != update["date"]:
        changes.append(f"Date changed to {update['date']}")
    if old.get("reminder_days") != update["reminder_days"]:
        changes.append(f"Reminder days changed to {update['reminder_days']}")

    if changes:
        aid = next_id("document_actions")
        db.document_actions.insert_one({
            "id": aid,
            "document_id": did,
            "action": "; ".join(changes),
            "date": now.strftime("%Y-%m-%d %I:%M %p"),
            "user": getattr(request, "user", {}).get("username", "system"),
        })

    log_action("update", "document", did, f"Updated document for {update['client_name']}")
    return jsonify({"message": "Document updated"})


@documents_bp.route("/api/documents/<int:did>", methods=["DELETE"])
@login_required
def delete_document(did):
    doc = db.documents.find_one({"id": did})
    if not doc:
        return jsonify({"error": "Document not found"}), 404
    db.document_actions.delete_many({"document_id": did})
    db.documents.delete_one({"id": did})
    log_action("delete", "document", did, f"Deleted document for {doc.get('client_name')}")
    return jsonify({"message": "Document deleted"})


@documents_bp.route("/api/documents/<int:did>/actions")
@login_required
def get_actions(did):
    actions = list(db.document_actions.find(
        {"document_id": did}, {"_id": 0}
    ).sort("date", -1))
    return jsonify(actions)


@documents_bp.route("/api/documents/types")
@login_required
def get_types():
    return jsonify(DOC_TYPES)


@documents_bp.route("/api/documents/stats")
@login_required
def document_stats():
    total = db.documents.count_documents({})
    sent = db.documents.count_documents({"status": "Sent"})
    not_sent = db.documents.count_documents({"status": "Not Sent"})

    # Count overdue across ALL types (where reminder_days is set)
    overdue = 0
    sent_docs = list(db.documents.find({
        "status": "Sent",
        "reminder_days": {"$gt": 0},
        "auto_reminder_sent": {"$ne": True},
    }, {"_id": 0}))
    for doc in sent_docs:
        next_type = NEXT_DOC_TYPE.get(doc.get("doc_type"))
        if not next_type:
            continue
        try:
            sd = datetime.strptime(doc.get("date", ""), "%Y-%m-%d")
            days = (datetime.now() - sd).days
            if days >= int(doc.get("reminder_days", 0)):
                overdue += 1
        except Exception:
            continue

    return jsonify({
        "total": total,
        "sent": sent,
        "not_sent": not_sent,
        "overdue": overdue,
    })
