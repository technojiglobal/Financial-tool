import requests

print("Testing login API...")
try:
    response = requests.post(
        "https://expense-1-45gj.onrender.com/api/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    print("Status Code:", response.status_code)
    print("Response text:", response.text)
except Exception as e:
    print("Client Error:", e)
