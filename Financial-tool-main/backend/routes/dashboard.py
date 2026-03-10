from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
import calendar
from db import db
from routes.auth import login_required, IST

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard")
@login_required
def dashboard():
    now = datetime.now(IST)

    # Accept optional month/year params for the profit section
    try:
        req_year = int(request.args.get("year", now.year))
        req_month = int(request.args.get("month", now.month))
        if req_month < 1 or req_month > 12:
            req_month = now.month
        if req_year < 1 or req_year > 9999:
            req_year = now.year
    except (ValueError, TypeError):
        req_year = now.year
        req_month = now.month

    last_day = calendar.monthrange(req_year, req_month)[1]
    month_start = f"{req_year}-{req_month:02d}-01"
    month_end = f"{req_year}-{req_month:02d}-{last_day:02d}"

    # Month revenue (payments received this month)
    month_payments = list(db.payments.find({
        "date": {"$gte": month_start, "$lte": month_end}
    }, {"_id": 0}))
    month_revenue = sum(p.get("paid_amount", 0) for p in month_payments)

    # Month salaries
    month_salaries_list = list(db.salary_payments.find({
        "date": {"$gte": month_start, "$lte": month_end}
    }, {"_id": 0}))
    month_salaries = sum(sp.get("amount_paid", 0) for sp in month_salaries_list)

    # Month expenses
    month_expenses_list = list(db.expenses.find({
        "date": {"$gte": month_start, "$lte": month_end}
    }, {"_id": 0}))
    month_expenses = sum(e.get("amount", 0) for e in month_expenses_list)

    month_net_profit = month_revenue - month_salaries - month_expenses
    month_margin = round((month_net_profit / month_revenue * 100), 1) if month_revenue > 0 else 0

    # Active projects count
    active_projects = db.projects.count_documents({})

    # Total outstanding
    total_outstanding = 0
    for proj in db.projects.find({}, {"_id": 0, "id": 1, "total_amount": 1}):
        paid = sum(p.get("paid_amount", 0) for p in db.payments.find({"project_id": proj["id"]}, {"paid_amount": 1}))
        balance = proj.get("total_amount", 0) - paid
        if balance > 0:
            total_outstanding += balance

    # Recent payments (last 5)
    recent_payments = []
    for pay in db.payments.find({}, {"_id": 0}).sort("date", -1).limit(5):
        proj = db.projects.find_one({"id": pay["project_id"]}, {"_id": 0})
        recent_payments.append({
            "id": pay["id"],
            "client_name": proj["client_name"] if proj else "Unknown",
            "project_name": proj["project_name"] if proj else "Unknown",
            "paid_amount": pay.get("paid_amount", 0),
            "date": pay.get("date", ""),
        })

    # Recent expenses (last 5)
    recent_expenses = list(db.expenses.find({}, {"_id": 0}).sort("date", -1).limit(5))

    # Upcoming reminders (future, not sent)
    today = now.strftime("%Y-%m-%d")
    upcoming_reminders = list(db.reminders.find(
        {"date": {"$gte": today}, "email_sent": {"$ne": True}},
        {"_id": 0}
    ).sort("date", 1).limit(5))

    # Overdue documents (any type where reminder_days has passed)
    overdue_docs = 0
    NEXT_DOC_TYPE = {"Proposal": "Agreement", "Agreement": "Invoice", "Invoice": "No due"}
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
            days = (now.replace(tzinfo=None) - sd).days
            if days >= int(doc.get("reminder_days", 0)):
                overdue_docs += 1
        except Exception:
            continue

    # Employee stats for dashboard
    all_employees = list(db.employees.find({}, {"_id": 0, "id": 1, "salary_per_month": 1}))
    total_employees = len(all_employees)
    total_monthly_salaries = sum(e.get("salary_per_month", 0) for e in all_employees)

    # Employees paid this month
    emp_ids_paid = set()
    for sp in month_salaries_list:
        eid = sp.get("employee_id")
        if eid:
            emp_ids_paid.add(eid)
    employees_paid_this_month = len(emp_ids_paid)

    return jsonify({
        "selected_year": req_year,
        "selected_month": req_month,
        "month_revenue": month_revenue,
        "month_net_profit": month_net_profit,
        "month_salaries": month_salaries,
        "month_expenses": month_expenses,
        "month_margin": month_margin,
        "active_projects": active_projects,
        "total_outstanding": total_outstanding,
        "recent_payments": recent_payments,
        "recent_expenses": recent_expenses,
        "upcoming_reminders": upcoming_reminders,
        "overdue_documents": overdue_docs,
        "total_employees": total_employees,
        "total_monthly_salaries": total_monthly_salaries,
        "employees_paid_this_month": employees_paid_this_month,
    })
