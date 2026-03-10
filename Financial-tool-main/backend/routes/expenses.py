from flask import Blueprint, request, jsonify
from db import db, next_id
from routes.auth import login_required, log_action

expenses_bp = Blueprint("expenses", __name__)


@expenses_bp.route("/api/expenses")
@login_required
def list_expenses():
    query = {}
    category = request.args.get("category")
    if category:
        query["category"] = category
    expenses = list(db.expenses.find(query, {"_id": 0}).sort("date", -1))
    return jsonify(expenses)


@expenses_bp.route("/api/expenses/categories")
@login_required
def get_categories():
    cats = db.expenses.distinct("category")
    return jsonify(cats)


@expenses_bp.route("/api/expenses", methods=["POST"])
@login_required
def create_expense():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    description = (data.get("description") or "").strip()
    if not description:
        return jsonify({"error": "Description is required"}), 400

    if not data.get("date"):
        return jsonify({"error": "Date is required"}), 400

    try:
        amount = float(data.get("amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    eid = next_id("expenses")
    doc = {
        "id": eid,
        "date": data.get("date", ""),
        "description": description,
        "category": (data.get("category") or "Other").strip(),
        "amount": amount,
        "notes": (data.get("notes") or "").strip(),
    }
    db.expenses.insert_one(doc)
    log_action("create", "expense", eid, f"Expense ₹{amount} — {description}")
    return jsonify({"message": "Expense created", "id": eid}), 201


@expenses_bp.route("/api/expenses/<int:eid>", methods=["PUT"])
@login_required
def update_expense(eid):
    old = db.expenses.find_one({"id": eid})
    if not old:
        return jsonify({"error": "Expense not found"}), 404

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    description = (data.get("description") or "").strip()
    if not description:
        return jsonify({"error": "Description is required"}), 400

    try:
        amount = float(data.get("amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    update = {
        "date": data.get("date", old.get("date", "")),
        "description": description,
        "category": (data.get("category") or "Other").strip(),
        "amount": amount,
        "notes": (data.get("notes") or "").strip(),
    }
    db.expenses.update_one({"id": eid}, {"$set": update})
    log_action("update", "expense", eid, f"Updated expense '{description}'")
    return jsonify({"message": "Expense updated"})


@expenses_bp.route("/api/expenses/<int:eid>", methods=["DELETE"])
@login_required
def delete_expense(eid):
    exp = db.expenses.find_one({"id": eid})
    if not exp:
        return jsonify({"error": "Expense not found"}), 404
    db.expenses.delete_one({"id": eid})
    log_action("delete", "expense", eid, f"Deleted expense '{exp.get('description')}'")
    return jsonify({"message": "Expense deleted"})
