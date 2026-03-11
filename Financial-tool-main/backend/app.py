import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Ensure backend directory is in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
if not app.config["SECRET_KEY"]:
    import warnings
    warnings.warn("SECRET_KEY not set — using fallback. Set it in production!")
    app.config["SECRET_KEY"] = "change-me-in-production"

# Restrict CORS to known origins
ALLOWED_ORIGINS = [
    "https://financial-tool-five.vercel.app",
    "https://financial-tool-7dhn.onrender.com",
    "http://localhost:5173",
]
CORS(app, origins=ALLOWED_ORIGINS)



# Register blueprints
from routes.auth import auth_bp
from routes.payments import payments_bp
from routes.employees import employees_bp
from routes.expenses import expenses_bp
from routes.reminders import reminders_bp
from routes.dashboard import dashboard_bp
from routes.profit import profit_bp
from routes.admin import admin_bp
from routes.documents import documents_bp
from routes.cron import cron_bp
from routes.notifications import notifications_bp
from routes.debts import debts_bp

app.register_blueprint(auth_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(employees_bp)
app.register_blueprint(expenses_bp)
app.register_blueprint(reminders_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(profit_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(documents_bp)
app.register_blueprint(cron_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(debts_bp)


# Health check / keep-alive endpoint
@app.route("/health")
def health():
    return jsonify({"status": "ok"})


# ── APScheduler: check reminders every 60 seconds ──
def start_scheduler():
    from apscheduler.schedulers.background import BackgroundScheduler
    from routes.cron import _process_reminders, _process_document_reminders

    def check_reminders():
        with app.app_context():
            r = _process_reminders()
            d = _process_document_reminders()
            if r or d:
                print(f"[SCHEDULER] Sent {r} reminders, {d} document follow-ups")

    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(check_reminders, "interval", seconds=60, id="reminder_check")
    scheduler.start()
    print("[SCHEDULER] ✅ Background reminder checker started (every 60s)")


# Start scheduler on Render
if os.environ.get("RENDER") or os.environ.get("START_SCHEDULER"):
    start_scheduler()

if __name__ == "__main__":
    start_scheduler()
    app.run(debug=True, port=5000)
