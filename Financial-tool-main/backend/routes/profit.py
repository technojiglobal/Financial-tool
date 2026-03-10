from flask import Blueprint, request, jsonify
from datetime import datetime
from db import db
from routes.auth import login_required

profit_bp = Blueprint("profit", __name__)

MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

QUARTER_LABELS = {1: "Q1 (Jan–Mar)", 2: "Q2 (Apr–Jun)", 3: "Q3 (Jul–Sep)", 4: "Q4 (Oct–Dec)"}


@profit_bp.route("/api/profit")
@login_required
def profit():
    period = request.args.get("period", "monthly")
    try:
        year = int(request.args.get("year", datetime.now().year))
        if year < 1 or year > 9999:
            year = datetime.now().year
    except (ValueError, TypeError):
        year = datetime.now().year
    year_str = str(year)

    # Fetch all data for the year
    all_payments = list(db.payments.find(
        {"date": {"$gte": f"{year_str}-01-01", "$lte": f"{year_str}-12-31"}},
        {"_id": 0}
    ))
    all_salaries = list(db.salary_payments.find(
        {"date": {"$gte": f"{year_str}-01-01", "$lte": f"{year_str}-12-31"}},
        {"_id": 0}
    ))
    all_expenses = list(db.expenses.find(
        {"date": {"$gte": f"{year_str}-01-01", "$lte": f"{year_str}-12-31"}},
        {"_id": 0}
    ))

    if period == "monthly":
        rows = []
        for m in range(1, 13):
            prefix = f"{year_str}-{m:02d}"
            income = sum(p.get("paid_amount", 0) for p in all_payments if p.get("date", "").startswith(prefix))
            salaries = sum(s.get("amount_paid", 0) for s in all_salaries if s.get("date", "").startswith(prefix))
            expenses = sum(e.get("amount", 0) for e in all_expenses if e.get("date", "").startswith(prefix))
            net = income - salaries - expenses
            margin = round((net / income * 100), 1) if income > 0 else 0
            rows.append({
                "label": f"{MONTH_NAMES[m]} {year_str}",
                "total_income": income,
                "total_salaries": salaries,
                "total_expenses": expenses,
                "net_profit": net,
                "profit_margin": margin,
            })
    else:  # quarterly
        rows = []
        for q in range(1, 5):
            months = range((q - 1) * 3 + 1, q * 3 + 1)
            prefixes = [f"{year_str}-{m:02d}" for m in months]
            income = sum(p.get("paid_amount", 0) for p in all_payments if any(p.get("date", "").startswith(pf) for pf in prefixes))
            salaries = sum(s.get("amount_paid", 0) for s in all_salaries if any(s.get("date", "").startswith(pf) for pf in prefixes))
            expenses = sum(e.get("amount", 0) for e in all_expenses if any(e.get("date", "").startswith(pf) for pf in prefixes))
            net = income - salaries - expenses
            margin = round((net / income * 100), 1) if income > 0 else 0
            rows.append({
                "label": QUARTER_LABELS[q],
                "total_income": income,
                "total_salaries": salaries,
                "total_expenses": expenses,
                "net_profit": net,
                "profit_margin": margin,
            })

    return jsonify({"data": rows})
