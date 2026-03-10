from flask import Blueprint, request, jsonify
from db import db, next_id
from routes.auth import login_required

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/api/notifications")
@login_required
def list_notifications():
    """Get all notifications, newest first."""
    notifs = list(db.notifications.find({}, {"_id": 0}).sort("id", -1).limit(50))
    unread_count = db.notifications.count_documents({"read": False})
    return jsonify({"notifications": notifs, "unread_count": unread_count})


@notifications_bp.route("/api/notifications/<int:nid>/read", methods=["PUT"])
@login_required
def mark_read(nid):
    result = db.notifications.update_one({"id": nid}, {"$set": {"read": True}})
    if result.matched_count == 0:
        return jsonify({"error": "Notification not found"}), 404
    return jsonify({"message": "Marked as read"})


@notifications_bp.route("/api/notifications/read-all", methods=["PUT"])
@login_required
def mark_all_read():
    db.notifications.update_many({"read": False}, {"$set": {"read": True}})
    return jsonify({"message": "All notifications marked as read"})
