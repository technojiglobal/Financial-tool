import os
import certifi
from pymongo import MongoClient

# The new DB provided by user
uri = "mongodb+srv://kasanichittibabu1_db_user:Munna@cluster0.2ascdrs.mongodb.net/"

print("Testing connection to new DB...")
try:
    client = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    # The ismaster command is cheap and does not require auth
    client.admin.command('ismaster')
    print("✅ Successfully connected to cluster!")
    
    # Now try to access the db to test auth
    db = client['technoji']
    db.list_collection_names()
    print("✅ Successfully authenticated and accessed 'technoji' database!")

except Exception as e:
    print(f"❌ Connection or Authentication Failed: {e}")
