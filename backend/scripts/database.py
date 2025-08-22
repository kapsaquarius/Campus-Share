import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime

# Load environment variables
load_dotenv()


def get_db():
    """Get MongoDB database instance"""
    client = MongoClient(os.getenv("MONGODB_URI"))
    return client["campus-share"]


def get_collection(collection_name):
    """Get MongoDB collection instance"""
    db = get_db()
    return db[collection_name]


def format_object_id(obj):
    """Convert ObjectId to string for JSON serialization"""
    if not obj:
        return obj

    # Create a copy to avoid modifying the original
    formatted = obj.copy()

    # Convert all ObjectId fields to strings
    for key, value in formatted.items():
        if isinstance(value, ObjectId):
            formatted[key] = str(value)
        elif isinstance(value, datetime):
            # Also format datetime objects for consistency
            formatted[key] = value.isoformat() + "Z"
        elif isinstance(value, dict):
            # Recursively format nested objects
            formatted[key] = format_object_id(value)
        elif isinstance(value, list):
            # Format ObjectIds in arrays
            formatted[key] = [
                format_object_id(item)
                if isinstance(item, dict)
                else str(item)
                if isinstance(item, ObjectId)
                else item.isoformat() + "Z"
                if isinstance(item, datetime)
                else item
                for item in value
            ]

    return formatted
