from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from datetime import datetime

# Global database connection
db = None

def init_db():
    """Initialize database connection and create indexes"""
    global db
    
    try:
        # Get MongoDB URI from environment or use default
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/campus_share')
        
        # Connect to MongoDB
        client = MongoClient(mongodb_uri)
        
        # Test the connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        
        # Get database
        db = client.get_database()
        
        # Create indexes for better performance
        create_indexes()
        
    except ConnectionFailure as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise

def get_db():
    """Get database instance"""
    if db is None:
        init_db()
    return db

def create_indexes():
    """Create database indexes for optimal performance"""
    try:
        # Users collection indexes
        db.users.create_index("googleId", unique=True)
        db.users.create_index("email", unique=True)
        
        # Locations collection indexes (NEW)
        db.locations.create_index("zipCode", unique=True)
        db.locations.create_index("city")
        db.locations.create_index("state")
        db.locations.create_index([("city", 1), ("state", 1)])
        
        # Ride posts indexes (UPDATED)
        db.ride_posts.create_index("userId")
        db.ride_posts.create_index("travelDate")
        db.ride_posts.create_index("startingFrom")  # Reference to locations
        db.ride_posts.create_index("goingTo")       # Reference to locations
        db.ride_posts.create_index("status")
        
        # Ride interests indexes
        db.ride_interests.create_index("rideId")
        db.ride_interests.create_index("interestedUserId")
        db.ride_interests.create_index([("rideId", 1), ("interestedUserId", 1)], unique=True)
        
        # Roommate requests indexes
        db.roommate_requests.create_index("userId")
        db.roommate_requests.create_index("dietaryPreference")
        db.roommate_requests.create_index("status")
        
        # Sublease posts indexes (UPDATED)
        db.sublease_posts.create_index("userId")
        db.sublease_posts.create_index("location")  # Reference to locations
        db.sublease_posts.create_index("startDate")
        db.sublease_posts.create_index("endDate")
        db.sublease_posts.create_index("rent")
        db.sublease_posts.create_index("status")
        
        # Reviews indexes
        db.reviews.create_index("reviewedUserId")
        db.reviews.create_index("rideId")
        
        # Notifications indexes
        db.notifications.create_index("userId")
        db.notifications.create_index("read")
        db.notifications.create_index("createdAt")
        
        print("Database indexes created successfully!")
        
    except Exception as e:
        print(f"Error creating indexes: {e}")
        raise

def get_collection(collection_name):
    """Get a specific collection from the database"""
    return get_db()[collection_name]

def format_object_id(obj):
    """Convert ObjectId to string for JSON serialization"""
    if obj and '_id' in obj:
        obj['_id'] = str(obj['_id'])
    return obj

def format_object_ids_list(obj_list):
    """Convert ObjectIds to strings for a list of objects"""
    return [format_object_id(obj) for obj in obj_list] 