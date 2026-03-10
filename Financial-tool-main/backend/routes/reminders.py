from flask import Blueprint, request, jsonify
from db import db, next_id
from routes.auth import login_required, log_action

reminders_bp = Blueprint("reminders", __name__)


@reminders_bp.route("/api/reminders")
@login_required
def list_reminders():
    reminders = list(db.reminders.find({}, {"_id": 0}).sort("date", 1))
    return jsonify(reminders)


@reminders_bp.route("/api/reminders", methods=["POST"])
@login_required
def create_reminder():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    description = (data.get("description") or "").strip()
    if not description:
        return jsonify({"error": "Description is required"}), 400

    if not data.get("date"):
        return jsonify({"error": "Date is required"}), 400

    rid = next_id("reminders")
    doc = {
        "id": rid,
        "description": description,
        "date": data.get("date", ""),
        "time": (data.get("time") or "").strip(),
        "email_sent": False,
    }
    db.reminders.insert_one(doc)
    log_action("create", "reminder", rid, f"Reminder: {description}")
    return jsonify({"message": "Reminder created", "id": rid}), 201


@reminders_bp.route("/api/reminders/<int:rid>", methods=["PUT"])
@login_required
def update_reminder(rid):
    old = db.reminders.find_one({"id": rid})
    if not old:
        return jsonify({"error": "Reminder not found"}), 404

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    description = (data.get("description") or "").strip()
    if not description:
        return jsonify({"error": "Description is required"}), 400

    update = {
        "description": description,
        "date": data.get("date", old.get("date", "")),
        "time": (data.get("time") or "").strip(),
    }

    # If date/time changed, reset email_sent so it can fire again
    if update["date"] != old.get("date") or update["time"] != old.get("time"):
        update["email_sent"] = False

    db.reminders.update_one({"id": rid}, {"$set": update})
    log_action("update", "reminder", rid, f"Updated reminder '{description}'")
    return jsonify({"message": "Reminder updated"})


@reminders_bp.route("/api/reminders/<int:rid>", methods=["DELETE"])
@login_required
def delete_reminder(rid):
    rem = db.reminders.find_one({"id": rid})
    if not rem:
        return jsonify({"error": "Reminder not found"}), 404
    db.reminders.delete_one({"id": rid})
    log_action("delete", "reminder", rid, f"Deleted reminder '{rem.get('description')}'")
    return jsonify({"message": "Reminder deleted"})
