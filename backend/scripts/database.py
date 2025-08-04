import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db():
    """Get MongoDB database instance"""
    client = MongoClient(os.getenv('MONGODB_URI'))
    return client['campus-share']

def get_collection(collection_name):
    """Get MongoDB collection instance"""
    db = get_db()
    return db[collection_name]

def format_object_id(obj):
    """Convert ObjectId to string for JSON serialization"""
    if obj and '_id' in obj:
        obj['_id'] = str(obj['_id'])
    
    if obj and 'userId' in obj:
        obj['userId'] = str(obj['userId'])
    
    return obj

def format_object_id_list(obj_list):
    """Convert ObjectIds to strings for a list of objects"""
    return [format_object_id(obj) for obj in obj_list] 

 