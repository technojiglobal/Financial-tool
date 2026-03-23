from flask import Blueprint, request, jsonify
from db import db, next_id
from routes.auth import login_required, log_action

payments_bp = Blueprint("payments", __name__)


@payments_bp.route("/api/projects")
@login_required
def list_projects():
    projects = list(db.projects.find({}, {"_id": 0}).sort("id", -1))
    for p in projects:
        payments = list(db.payments.find({"project_id": p["id"]}, {"_id": 0}).sort("date", -1))
        p["payments"] = payments
        p["total_paid"] = sum(pay.get("paid_amount", 0) for pay in payments)
        p["balance"] = p.get("total_amount", 0) - p["total_paid"]
    return jsonify(projects)


@payments_bp.route("/api/projects", methods=["POST"])
@login_required
def create_project():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    client_name = (data.get("client_name") or "").strip()
    project_name = (data.get("project_name") or "").strip()

    if not client_name:
        return jsonify({"error": "Client name is required"}), 400
    if not project_name:
        return jsonify({"error": "Project name is required"}), 400

    try:
        total_amount = float(data.get("total_amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid total amount"}), 400

    if total_amount < 0:
        return jsonify({"error": "Total amount cannot be negative"}), 400

    pid = next_id("projects")
    doc = {
        "id": pid,
        "client_name": client_name,
        "project_name": project_name,
        "total_amount": total_amount,
        "amc_amount": float(data.get("amc_amount", 0) or 0),
        "email": (data.get("email") or "").strip(),
        "phone": (data.get("phone") or "").strip(),
        "notes": (data.get("notes") or "").strip(),
    }
    db.projects.insert_one(doc)
    log_action("create", "project", pid, f"Created project '{project_name}' for {client_name}")
    return jsonify({"message": "Project created", "id": pid}), 201


@payments_bp.route("/api/projects/<int:pid>", methods=["PUT"])
@login_required
def update_project(pid):
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    old = db.projects.find_one({"id": pid})
    if not old:
        return jsonify({"error": "Project not found"}), 404

    client_name = (data.get("client_name") or "").strip()
    project_name = (data.get("project_name") or "").strip()

    if not client_name:
        return jsonify({"error": "Client name is required"}), 400
    if not project_name:
        return jsonify({"error": "Project name is required"}), 400

    try:
        total_amount = float(data.get("total_amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid total amount"}), 400

    if total_amount < 0:
        return jsonify({"error": "Total amount cannot be negative"}), 400

    update = {
        "client_name": client_name,
        "project_name": project_name,
        "total_amount": total_amount,
        "amc_amount": float(data.get("amc_amount", 0) or 0),
        "email": (data.get("email") or "").strip(),
        "phone": (data.get("phone") or "").strip(),
        "notes": (data.get("notes") or "").strip(),
    }
    db.projects.update_one({"id": pid}, {"$set": update})
    log_action("update", "project", pid, f"Updated project '{project_name}'")
    return jsonify({"message": "Project updated"})


@payments_bp.route("/api/projects/<int:pid>", methods=["DELETE"])
@login_required
def delete_project(pid):
    project = db.projects.find_one({"id": pid})
    if not project:
        return jsonify({"error": "Project not found"}), 404
    db.payments.delete_many({"project_id": pid})
    db.projects.delete_one({"id": pid})
    log_action("delete", "project", pid, f"Deleted project '{project.get('project_name')}'")
    return jsonify({"message": "Project deleted"})


@payments_bp.route("/api/projects/<int:pid>/payments", methods=["POST"])
@login_required
def add_payment(pid):
    project = db.projects.find_one({"id": pid})
    if not project:
        return jsonify({"error": "Project not found"}), 404

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        paid_amount = float(data.get("paid_amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid payment amount"}), 400

    if paid_amount <= 0:
        return jsonify({"error": "Payment amount must be greater than zero"}), 400

    if not data.get("date"):
        return jsonify({"error": "Payment date is required"}), 400

    # Removed the 150% overpayment limit as per user request

    pay_id = next_id("payments")
    doc = {
        "id": pay_id,
        "project_id": pid,
        "date": data.get("date", ""),
        "paid_amount": paid_amount,
        "note": (data.get("note") or "").strip(),
    }
    db.payments.insert_one(doc)
    log_action("create", "payment", pay_id, f"Payment ₹{paid_amount} for '{project.get('project_name', pid)}'")
    return jsonify({"message": "Payment recorded", "id": pay_id}), 201


@payments_bp.route("/api/payments/<int:pay_id>", methods=["DELETE"])
@login_required
def delete_payment(pay_id):
    payment = db.payments.find_one({"id": pay_id})
    if not payment:
        return jsonify({"error": "Payment not found"}), 404
    db.payments.delete_one({"id": pay_id})
    log_action("delete", "payment", pay_id, f"Deleted payment ₹{payment.get('paid_amount', 0)}")
    return jsonify({"message": "Payment deleted"})


@payments_bp.route("/api/payments/<int:pay_id>", methods=["PUT"])
@login_required
def update_payment(pay_id):
    payment = db.payments.find_one({"id": pay_id})
    if not payment:
        return jsonify({"error": "Payment not found"}), 404

    data = request.get_json() or {}
    try:
        paid_amount = float(data.get("paid_amount", payment.get("paid_amount", 0)))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    if paid_amount <= 0:
        return jsonify({"error": "Amount must be positive"}), 400

    update = {
        "date": data.get("date", payment.get("date", "")),
        "paid_amount": paid_amount,
        "note": (data.get("note") or "").strip(),
    }
    db.payments.update_one({"id": pay_id}, {"$set": update})
    log_action("update", "payment", pay_id, f"Updated payment to ₹{paid_amount}")
    return jsonify({"message": "Payment updated"})

