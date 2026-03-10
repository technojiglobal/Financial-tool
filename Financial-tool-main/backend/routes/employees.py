from flask import Blueprint, request, jsonify
from db import db, next_id
from routes.auth import login_required, log_action

employees_bp = Blueprint("employees", __name__)


@employees_bp.route("/api/employees")
@login_required
def list_employees():
    employees = list(db.employees.find({}, {"_id": 0}).sort("id", -1))
    for emp in employees:
        sps = list(db.salary_payments.find({"employee_id": emp["id"]}, {"_id": 0}).sort("date", -1))
        emp["salary_payments"] = sps
        emp["total_paid"] = sum(sp.get("amount_paid", 0) for sp in sps)
    return jsonify(employees)


@employees_bp.route("/api/employees/<int:eid>")
@login_required
def get_employee(eid):
    emp = db.employees.find_one({"id": eid}, {"_id": 0})
    if not emp:
        return jsonify({"error": "Employee not found"}), 404
    sps = list(db.salary_payments.find({"employee_id": eid}, {"_id": 0}).sort("date", -1))
    emp["salary_payments"] = sps
    emp["total_paid"] = sum(sp.get("amount_paid", 0) for sp in sps)
    return jsonify(emp)


@employees_bp.route("/api/employees", methods=["POST"])
@login_required
def create_employee():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Employee name is required"}), 400

    try:
        salary = float(data.get("salary_per_month", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid salary amount"}), 400

    if salary < 0:
        return jsonify({"error": "Salary cannot be negative"}), 400

    # Check for duplicate employee code
    emp_code = (data.get("employee_code") or "").strip()
    if emp_code and db.employees.find_one({"employee_code": emp_code}):
        return jsonify({"error": f"Employee code '{emp_code}' already exists"}), 400

    eid = next_id("employees")
    doc = {
        "id": eid,
        "name": name,
        "employee_code": emp_code,
        "department": (data.get("department") or "").strip(),
        "salary_per_month": salary,
        "email": (data.get("email") or "").strip(),
        "phone": (data.get("phone") or "").strip(),
        "role": (data.get("role") or "").strip(),
        "employee_type": (data.get("employee_type") or "full-time").strip(),
        "date_joined": (data.get("date_joined") or "").strip(),
        "monthly_leaves": max(0, int(float(data.get("monthly_leaves", 0) or 0))),
        "yearly_leaves": max(0, int(float(data.get("yearly_leaves", 0) or 0))),
        "working_days": max(1, min(31, int(float(data.get("working_days", 22) or 22)))),
        "salary_breakdown": (data.get("salary_breakdown") or "").strip(),
    }
    db.employees.insert_one(doc)
    log_action("create", "employee", eid, f"Created employee '{name}'")
    return jsonify({"message": "Employee created", "id": eid}), 201


@employees_bp.route("/api/employees/<int:eid>", methods=["PUT"])
@login_required
def update_employee(eid):
    old = db.employees.find_one({"id": eid})
    if not old:
        return jsonify({"error": "Employee not found"}), 404

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Employee name is required"}), 400

    try:
        salary = float(data.get("salary_per_month", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid salary amount"}), 400

    if salary < 0:
        return jsonify({"error": "Salary cannot be negative"}), 400

    # Check duplicate employee code (skip own)
    emp_code = (data.get("employee_code") or "").strip()
    if emp_code:
        dup = db.employees.find_one({"employee_code": emp_code, "id": {"$ne": eid}})
        if dup:
            return jsonify({"error": f"Employee code '{emp_code}' already exists"}), 400

    update = {
        "name": name,
        "employee_code": emp_code,
        "department": (data.get("department") or "").strip(),
        "salary_per_month": salary,
        "email": (data.get("email") or "").strip(),
        "phone": (data.get("phone") or "").strip(),
        "role": (data.get("role") or "").strip(),
        "employee_type": (data.get("employee_type") or "full-time").strip(),
        "date_joined": (data.get("date_joined") or "").strip(),
        "monthly_leaves": max(0, int(float(data.get("monthly_leaves", 0) or 0))),
        "yearly_leaves": max(0, int(float(data.get("yearly_leaves", 0) or 0))),
        "working_days": max(1, min(31, int(float(data.get("working_days", 22) or 22)))),
        "salary_breakdown": (data.get("salary_breakdown") or "").strip(),
    }
    db.employees.update_one({"id": eid}, {"$set": update})
    log_action("update", "employee", eid, f"Updated employee '{name}'")
    return jsonify({"message": "Employee updated"})


@employees_bp.route("/api/employees/<int:eid>", methods=["DELETE"])
@login_required
def delete_employee(eid):
    emp = db.employees.find_one({"id": eid})
    if not emp:
        return jsonify({"error": "Employee not found"}), 404
    db.salary_payments.delete_many({"employee_id": eid})
    db.employees.delete_one({"id": eid})
    log_action("delete", "employee", eid, f"Deleted employee '{emp.get('name')}'")
    return jsonify({"message": "Employee deleted"})


@employees_bp.route("/api/employees/<int:eid>/salary-payments", methods=["POST"])
@login_required
def add_salary_payment(eid):
    emp = db.employees.find_one({"id": eid})
    if not emp:
        return jsonify({"error": "Employee not found"}), 404

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        amount = float(data.get("amount_paid", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    if not data.get("date") and not data.get("payment_date"):
        return jsonify({"error": "Payment date is required"}), 400

    sid = next_id("salary_payments")
    payment_date = data.get("payment_date", data.get("date", ""))
    doc = {
        "id": sid,
        "employee_id": eid,
        "salary_month": data.get("salary_month", data.get("month", "")),
        "payment_date": payment_date,
        "date": payment_date,  # Used by profit/dashboard queries
        "amount_paid": amount,
        "month": data.get("salary_month", data.get("month", "")),
        "status": data.get("status", "paid"),
        "note": (data.get("note") or "").strip(),
    }
    db.salary_payments.insert_one(doc)
    log_action("create", "salary_payment", sid, f"Salary ₹{amount} for '{emp.get('name', eid)}'")
    return jsonify({"message": "Salary payment recorded", "id": sid}), 201


@employees_bp.route("/api/salary-payments/<int:sid>", methods=["PUT"])
@login_required
def update_salary_payment(sid):
    sp = db.salary_payments.find_one({"id": sid})
    if not sp:
        return jsonify({"error": "Salary payment not found"}), 404

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        amount = float(data.get("amount_paid", sp.get("amount_paid", 0)))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    update = {}
    if "amount_paid" in data:
        update["amount_paid"] = amount
    if "payment_date" in data or "date" in data:
        payment_date = data.get("payment_date", data.get("date", sp.get("payment_date", "")))
        update["payment_date"] = payment_date
        update["date"] = payment_date
    if "salary_month" in data or "month" in data:
        month_val = data.get("salary_month", data.get("month", sp.get("salary_month", "")))
        update["salary_month"] = month_val
        update["month"] = month_val
    if "note" in data:
        update["note"] = (data.get("note") or "").strip()
    if "status" in data:
        update["status"] = data.get("status", "paid")

    if update:
        db.salary_payments.update_one({"id": sid}, {"$set": update})
    log_action("update", "salary_payment", sid, f"Updated salary payment ₹{amount}")
    return jsonify({"message": "Salary payment updated"})


@employees_bp.route("/api/salary-payments/<int:sid>", methods=["DELETE"])
@login_required
def delete_salary_payment(sid):
    sp = db.salary_payments.find_one({"id": sid})
    if not sp:
        return jsonify({"error": "Salary payment not found"}), 404
    db.salary_payments.delete_one({"id": sid})
    log_action("delete", "salary_payment", sid, f"Deleted salary payment ₹{sp.get('amount_paid', 0)}")
    return jsonify({"message": "Salary payment deleted"})
