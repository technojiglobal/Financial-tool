import os
import certifi
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URI = os.environ.get("MONGODB_URI")
DB_NAME = os.environ.get("DB_NAME", "technoji")

if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is not set. Please configure it in the .env file.")

client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
db = client[DB_NAME]


def next_id(collection_name):
    """Auto-increment integer ID using a counters collection."""
    result = db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return result["seq"]
