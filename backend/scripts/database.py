import os
import sys
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from pymongo.errors import OperationFailure
from dotenv import load_dotenv

# Add the parent directory to the path so we can import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import config

db = None

def init_db():
    """Initialize database connection and create indexes"""
    global db
    
    try:
        # Test connection
        client = MongoClient(config.MONGODB_URI)
        db = client.get_database()
        
        # Test the connection
        db.command('ping')
        print("Successfully connected to MongoDB!")
        
        # Create indexes
        create_indexes()
        
    except Exception as e:
        print(f"Database initialization error: {e}")
        raise

def get_db():
    """Get MongoDB database instance"""
    client = MongoClient(config.MONGODB_URI)
    return client.get_database()

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

def create_indexes():
    """Create database indexes for optimal performance"""
    db = get_db()
    
    try:
        # Users collection indexes
        users = db.users
        try:
            users.create_index([("username", ASCENDING)], unique=True)
        except OperationFailure as e:
            if "already exists" not in str(e):
                print(f"Warning: Could not create username index: {e}")
        
        try:
            users.create_index([("email", ASCENDING)], unique=True)
        except OperationFailure as e:
            if "already exists" not in str(e):
                print(f"Warning: Could not create email index: {e}")
        
        # Remove the googleId index since we're not using Google OAuth anymore
        try:
            users.drop_index("googleId_1")
        except:
            pass  # Index doesn't exist, which is fine
        
        # Ride posts collection indexes
        ride_posts = db.ride_posts
        try:
            ride_posts.create_index([("userId", ASCENDING)])
            ride_posts.create_index([("travelDate", ASCENDING)])
            ride_posts.create_index([("startingFrom", ASCENDING)])
            ride_posts.create_index([("goingTo", ASCENDING)])
            ride_posts.create_index([("status", ASCENDING)])
            ride_posts.create_index([("createdAt", DESCENDING)])
        except OperationFailure as e:
            print(f"Warning: Could not create ride_posts indexes: {e}")
        
        # Ride interests collection indexes
        ride_interests = db.ride_interests
        try:
            ride_interests.create_index([("rideId", ASCENDING)])
            ride_interests.create_index([("interestedUserId", ASCENDING)])
            ride_interests.create_index([("rideId", ASCENDING), ("interestedUserId", ASCENDING)], unique=True)
        except OperationFailure as e:
            print(f"Warning: Could not create ride_interests indexes: {e}")
        
        # Notifications collection indexes
        notifications = db.notifications
        try:
            notifications.create_index([("userId", ASCENDING)])
            notifications.create_index([("read", ASCENDING)])
            notifications.create_index([("createdAt", DESCENDING)])
        except OperationFailure as e:
            print(f"Warning: Could not create notifications indexes: {e}")
        
        # Locations collection indexes
        locations = db.locations
        try:
            locations.create_index([("zipCode", ASCENDING)])
            locations.create_index([("city", ASCENDING)])
            locations.create_index([("state", ASCENDING)])
            locations.create_index([("stateName", ASCENDING)])
            # Create a text index for search functionality
            locations.create_index([
                ("city", TEXT),
                ("stateName", TEXT),
                ("zipCode", TEXT)
            ])
        except OperationFailure as e:
            print(f"Warning: Could not create locations indexes: {e}")
        
        print("Database indexes created successfully!")
        
    except Exception as e:
        print(f"Error creating indexes: {e}")
        raise 