from flask import Blueprint, request, jsonify
from db import db, next_id
from routes.auth import login_required, log_action
from datetime import datetime

debts_bp = Blueprint("debts", __name__)


def _compute_status(total, paid, due_date):
    pending = max(0, total - paid)
    if pending == 0:
        return "Paid"
    today = datetime.today().strftime("%Y-%m-%d")
    if due_date and due_date < today:
        return "Overdue"
    if paid > 0:
        return "Partial"
    return "Pending"


@debts_bp.route("/api/debts")
@login_required
def list_debts():
    debts = list(db.debts.find({}, {"_id": 0}).sort("id", -1))
    for d in debts:
        payments = list(db.debt_payments.find({"debt_id": d["id"]}, {"_id": 0}).sort("date", -1))
        d["payments"] = payments
        paid = sum(p.get("amount", 0) for p in payments)
        total = d.get("total_amount", 0)
        d["paid_amount"] = paid
        d["pending_amount"] = max(0, total - paid)
        d["status"] = _compute_status(total, paid, d.get("due_date", ""))
    return jsonify(debts)


@debts_bp.route("/api/debts", methods=["POST"])
@login_required
def create_debt():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    pay_to = (data.get("pay_to") or "").strip()
    if not pay_to:
        return jsonify({"error": "Pay To is required"}), 400
    try:
        total = float(data.get("total_amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid total amount"}), 400
    if total <= 0:
        return jsonify({"error": "Total amount must be greater than zero"}), 400

    did = next_id("debts")
    doc = {
        "id": did,
        "pay_to": pay_to,
        "email": (data.get("email") or "").strip(),
        "phone": (data.get("phone") or "").strip(),
        "reason": (data.get("reason") or "").strip(),
        "description": (data.get("description") or "").strip(),
        "total_amount": total,
        "interest": float(data.get("interest", 0) or 0),
        "date": (data.get("date") or "").strip(),
        "due_date": (data.get("due_date") or "").strip(),
    }
    db.debts.insert_one(doc)
    log_action("create", "debt", did, f"Created debt for '{pay_to}' ₹{total}")
    return jsonify({"message": "Debt created", "id": did}), 201


@debts_bp.route("/api/debts/<int:did>", methods=["PUT"])
@login_required
def update_debt(did):
    debt = db.debts.find_one({"id": did})
    if not debt:
        return jsonify({"error": "Debt not found"}), 404
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    pay_to = (data.get("pay_to") or "").strip()
    if not pay_to:
        return jsonify({"error": "Pay To is required"}), 400
    try:
        total = float(data.get("total_amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid total amount"}), 400
    if total <= 0:
        return jsonify({"error": "Total amount must be greater than zero"}), 400

    update = {
        "pay_to": pay_to,
        "email": (data.get("email") or "").strip(),
        "phone": (data.get("phone") or "").strip(),
        "reason": (data.get("reason") or "").strip(),
        "description": (data.get("description") or "").strip(),
        "total_amount": total,
        "interest": float(data.get("interest", 0) or 0),
        "date": (data.get("date") or "").strip(),
        "due_date": (data.get("due_date") or "").strip(),
    }
    db.debts.update_one({"id": did}, {"$set": update})
    log_action("update", "debt", did, f"Updated debt for '{pay_to}'")
    return jsonify({"message": "Debt updated"})


@debts_bp.route("/api/debts/<int:did>", methods=["DELETE"])
@login_required
def delete_debt(did):
    debt = db.debts.find_one({"id": did})
    if not debt:
        return jsonify({"error": "Debt not found"}), 404
    db.debt_payments.delete_many({"debt_id": did})
    db.debts.delete_one({"id": did})
    log_action("delete", "debt", did, f"Deleted debt for '{debt.get('pay_to')}'")
    return jsonify({"message": "Debt deleted"})


@debts_bp.route("/api/debts/<int:did>/payments", methods=["POST"])
@login_required
def add_debt_payment(did):
    debt = db.debts.find_one({"id": did})
    if not debt:
        return jsonify({"error": "Debt not found"}), 404
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    try:
        amount = float(data.get("amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400
    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    pid = next_id("debt_payments")
    doc = {
        "id": pid,
        "debt_id": did,
        "amount": amount,
        "date": (data.get("date") or "").strip(),
        "due_date": (data.get("due_date") or "").strip(),
        "interest": float(data.get("interest", 0) or 0),
        "description": (data.get("description") or "").strip(),
    }
    db.debt_payments.insert_one(doc)
    log_action("create", "debt_payment", pid, f"Payment ₹{amount} for debt {did}")
    return jsonify({"message": "Payment added", "id": pid}), 201


@debts_bp.route("/api/debt-payments/<int:pid>", methods=["DELETE"])
@login_required
def delete_debt_payment(pid):
    p = db.debt_payments.find_one({"id": pid})
    if not p:
        return jsonify({"error": "Payment not found"}), 404
    db.debt_payments.delete_one({"id": pid})
    log_action("delete", "debt_payment", pid, f"Deleted debt payment ₹{p.get('amount', 0)}")
    return jsonify({"message": "Payment deleted"})
