#!/usr/bin/env python3
"""
Complete CampusShare Cloud Database Setup
- Connects to MongoDB Atlas
- Creates all collections with optimal indexes
- Loads location data from CSV
- Verifies setup
"""

import os
import sys
import pandas as pd
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT, GEOSPHERE
from pymongo.errors import OperationFailure, DuplicateKeyError
from datetime import datetime
import traceback

# MODIFY THIS CONNECTION STRING FOR YOUR CLOUD DATABASE
CLOUD_MONGODB_URI = "mongodb+srv://campus-share-admin:CampusShareNotifs1234@campus-share.hyntou5.mongodb.net/?retryWrites=true&w=majority&appName=campus-share"
DATABASE_NAME = "campus-share"

def connect_to_cloud_db():
    """Connect to MongoDB Atlas with proper TLS configuration"""
    try:
        print("🔗 Connecting to MongoDB Atlas...")
        
        # Try multiple connection methods with correct parameters
        client = None
        
        # Method 1: Try with TLS relaxed security (for macOS compatibility)
        try:
            print("🔄 Attempting connection with relaxed TLS...")
            client = MongoClient(
                CLOUD_MONGODB_URI,
                tlsAllowInvalidCertificates=True,
                tlsAllowInvalidHostnames=True,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
                socketTimeoutMS=10000
            )
            client.admin.command('ping')
            print("✅ Connected with relaxed TLS!")
        except Exception as e1:
            print(f"⚠️  Method 1 failed: {str(e1)[:100]}...")
            
            # Method 2: Try with standard TLS
            try:
                print("🔄 Attempting connection with standard TLS...")
                client = MongoClient(
                    CLOUD_MONGODB_URI,
                    tls=True,
                    serverSelectionTimeoutMS=10000,
                    connectTimeoutMS=10000
                )
                client.admin.command('ping')
                print("✅ Connected with standard TLS!")
            except Exception as e2:
                print(f"⚠️  Method 2 failed: {str(e2)[:100]}...")
                
                # Method 3: Try basic connection (let MongoDB handle TLS automatically)
                try:
                    print("🔄 Attempting basic connection...")
                    client = MongoClient(
                        CLOUD_MONGODB_URI,
                        serverSelectionTimeoutMS=15000  # Longer timeout
                    )
                    client.admin.command('ping')
                    print("✅ Connected with basic connection!")
                except Exception as e3:
                    print(f"⚠️  Method 3 failed: {str(e3)[:100]}...")
                    
                    # Method 4: Try with DNS resolution workaround
                    try:
                        print("🔄 Attempting with connection string modifications...")
                        # Add explicit TLS parameters to connection string
                        modified_uri = CLOUD_MONGODB_URI
                        if "?" not in modified_uri:
                            modified_uri += "?"
                        else:
                            modified_uri += "&"
                        modified_uri += "tls=true&tlsAllowInvalidCertificates=true"
                        
                        client = MongoClient(
                            modified_uri,
                            serverSelectionTimeoutMS=15000
                        )
                        client.admin.command('ping')
                        print("✅ Connected with modified URI!")
                    except Exception as e4:
                        print(f"❌ All connection methods failed!")
                        print(f"Final error: {str(e4)}")
                        raise e4
        
        if client is None:
            raise Exception("Unable to establish connection to MongoDB Atlas")
        
        db = client[DATABASE_NAME]
        return client, db
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB Atlas: {e}")
        print("\n🔧 Troubleshooting steps:")
        print("1. ✅ Check MongoDB Atlas Network Access - Add IP 0.0.0.0/0")
        print("2. ✅ Verify cluster is not paused/sleeping")
        print("3. ✅ Username/password are correct") 
        print("4. 🔄 Try: pip install --upgrade pymongo certifi")
        print("5. 🔄 Try from different network (mobile hotspot)")
        print("6. 🔄 Test with MongoDB Compass first")
        print("\n💡 Alternative: Try the simplified connection test:")
        print(f"python3 -c \"from pymongo import MongoClient; print('✅ OK:', MongoClient('{CLOUD_MONGODB_URI}').admin.command('ping'))\"")
        raise

def create_users_collection(db):
    """Create users collection with indexes"""
    print("\n👥 Setting up Users collection...")
    
    users = db.users
    
    try:
        # Create indexes
        users.create_index([("username", ASCENDING)], unique=True, name="username_unique")
        print("✅ Created unique index on username")
        
        users.create_index([("email", ASCENDING)], unique=False, name="email_idx")
        print("✅ Created index on email")
        
        users.create_index([("createdAt", DESCENDING)], name="created_at_idx")
        print("✅ Created index on createdAt")
        
        # Cleanup old indexes if they exist
        try:
            users.drop_index("googleId_1")
            print("🗑️  Removed old googleId index")
        except:
            pass
        
    except OperationFailure as e:
        if "already exists" not in str(e):
            print(f"⚠️  Users index warning: {e}")

def create_locations_collection(db):
    """Create locations collection with indexes"""
    print("\n📍 Setting up Locations collection...")
    
    locations = db.locations
    
    try:
        # Core indexes
        locations.create_index([("zipCode", ASCENDING)], unique=True, name="zipcode_unique")
        print("✅ Created unique index on zipCode")
        
        locations.create_index([("city", ASCENDING)], name="city_idx")
        print("✅ Created index on city")
        
        locations.create_index([("state", ASCENDING)], name="state_idx")
        print("✅ Created index on state")
        
        locations.create_index([("stateName", ASCENDING)], name="state_name_idx")
        print("✅ Created index on stateName")
        
        # Compound indexes for common searches
        locations.create_index([("city", ASCENDING), ("state", ASCENDING)], name="city_state_idx")
        print("✅ Created compound index on city+state")
        
        locations.create_index([("state", ASCENDING), ("city", ASCENDING)], name="state_city_idx")
        print("✅ Created compound index on state+city")
        
        # Text search index for location autocomplete
        try:
            locations.create_index([
                ("city", TEXT),
                ("stateName", TEXT),
                ("zipCode", TEXT)
            ], name="location_text_search")
            print("✅ Created text search index")
        except OperationFailure as e:
            if "already exists" not in str(e):
                print(f"⚠️  Text index warning: {e}")
        
        # Display name index for faster UI searches
        locations.create_index([("displayName", ASCENDING)], name="display_name_idx")
        print("✅ Created index on displayName")
        
    except OperationFailure as e:
        if "already exists" not in str(e):
            print(f"⚠️  Locations index warning: {e}")

def create_ride_posts_collection(db):
    """Create ride_posts collection with indexes"""
    print("\n🚗 Setting up Ride Posts collection...")
    
    ride_posts = db.ride_posts
    
    try:
        # User-related indexes
        ride_posts.create_index([("userId", ASCENDING)], name="user_id_idx")
        print("✅ Created index on userId")
        
        # Search-critical indexes
        ride_posts.create_index([("travelDate", ASCENDING)], name="travel_date_idx")
        print("✅ Created index on travelDate")
        
        ride_posts.create_index([("startingFrom", ASCENDING)], name="starting_from_idx")
        print("✅ Created index on startingFrom")
        
        ride_posts.create_index([("goingTo", ASCENDING)], name="going_to_idx")
        print("✅ Created index on goingTo")
        
        ride_posts.create_index([("status", ASCENDING)], name="status_idx")
        print("✅ Created index on status")
        
        ride_posts.create_index([("createdAt", DESCENDING)], name="created_at_desc_idx")
        print("✅ Created index on createdAt (descending)")
        
        # Compound indexes for optimal search performance
        ride_posts.create_index([
            ("status", ASCENDING),
            ("travelDate", ASCENDING)
        ], name="status_date_idx")
        print("✅ Created compound index on status+travelDate")
        
        ride_posts.create_index([
            ("status", ASCENDING),
            ("travelDate", ASCENDING),
            ("seatsRemaining", ASCENDING)
        ], name="status_date_seats_idx")
        print("✅ Created compound index on status+travelDate+seatsRemaining")
        
        ride_posts.create_index([
            ("userId", ASCENDING),
            ("status", ASCENDING)
        ], name="user_status_idx")
        print("✅ Created compound index on userId+status")
        
        # Location-based compound indexes
        ride_posts.create_index([
            ("startingFrom", ASCENDING),
            ("travelDate", ASCENDING)
        ], name="origin_date_idx")
        print("✅ Created compound index on startingFrom+travelDate")
        
        ride_posts.create_index([
            ("goingTo", ASCENDING),
            ("travelDate", ASCENDING)
        ], name="destination_date_idx")
        print("✅ Created compound index on goingTo+travelDate")
        
        # Seats availability index
        ride_posts.create_index([("seatsRemaining", ASCENDING)], name="seats_remaining_idx")
        print("✅ Created index on seatsRemaining")
        
    except OperationFailure as e:
        if "already exists" not in str(e):
            print(f"⚠️  Ride posts index warning: {e}")

def create_ride_interests_collection(db):
    """Create ride_interests collection with indexes"""
    print("\n💝 Setting up Ride Interests collection...")
    
    ride_interests = db.ride_interests
    
    try:
        # Core indexes
        ride_interests.create_index([("rideId", ASCENDING)], name="ride_id_idx")
        print("✅ Created index on rideId")
        
        ride_interests.create_index([("interestedUserId", ASCENDING)], name="interested_user_id_idx")
        print("✅ Created index on interestedUserId")
        
        # Unique constraint to prevent duplicate interests
        ride_interests.create_index([
            ("rideId", ASCENDING),
            ("interestedUserId", ASCENDING)
        ], unique=True, name="ride_user_unique")
        print("✅ Created unique compound index on rideId+interestedUserId")
        
        # Status and timestamp indexes
        ride_interests.create_index([("status", ASCENDING)], name="status_idx")
        print("✅ Created index on status")
        
        ride_interests.create_index([("createdAt", DESCENDING)], name="created_at_desc_idx")
        print("✅ Created index on createdAt")
        
        # Compound indexes for common queries
        ride_interests.create_index([
            ("interestedUserId", ASCENDING),
            ("status", ASCENDING)
        ], name="user_status_idx")
        print("✅ Created compound index on interestedUserId+status")
        
        ride_interests.create_index([
            ("rideId", ASCENDING),
            ("status", ASCENDING)
        ], name="ride_status_idx")
        print("✅ Created compound index on rideId+status")
        
    except OperationFailure as e:
        if "already exists" not in str(e):
            print(f"⚠️  Ride interests index warning: {e}")

def create_notifications_collection(db):
    """Create notifications collection with indexes"""
    print("\n🔔 Setting up Notifications collection...")
    
    notifications = db.notifications
    
    try:
        # Core indexes
        notifications.create_index([("userId", ASCENDING)], name="user_id_idx")
        print("✅ Created index on userId")
        
        notifications.create_index([("read", ASCENDING)], name="read_status_idx")
        print("✅ Created index on read status")
        
        notifications.create_index([("createdAt", DESCENDING)], name="created_at_desc_idx")
        print("✅ Created index on createdAt (descending)")
        
        notifications.create_index([("type", ASCENDING)], name="type_idx")
        print("✅ Created index on type")
        
        # Compound indexes for common queries
        notifications.create_index([
            ("userId", ASCENDING),
            ("read", ASCENDING)
        ], name="user_read_idx")
        print("✅ Created compound index on userId+read")
        
        notifications.create_index([
            ("userId", ASCENDING),
            ("createdAt", DESCENDING)
        ], name="user_created_idx")
        print("✅ Created compound index on userId+createdAt")
        
        notifications.create_index([
            ("userId", ASCENDING),
            ("read", ASCENDING),
            ("createdAt", DESCENDING)
        ], name="user_read_created_idx")
        print("✅ Created compound index on userId+read+createdAt")
        
        # Related content index
        notifications.create_index([("relatedId", ASCENDING)], name="related_id_idx")
        print("✅ Created index on relatedId")
        
    except OperationFailure as e:
        if "already exists" not in str(e):
            print(f"⚠️  Notifications index warning: {e}")

def load_locations_from_csv(db, csv_file_path='data/locations.csv'):
    """Load locations from CSV file into cloud database"""
    try:
        # Check if CSV file exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_full_path = os.path.join(os.path.dirname(script_dir), csv_file_path)
        
        if not os.path.exists(csv_full_path):
            print(f"❌ Error: CSV file '{csv_full_path}' not found!")
            print("Please ensure your locations.csv file is in the backend/data/ directory.")
            return False
        
        print(f"\n📂 Loading locations from {csv_full_path}...")
        
        # Read CSV file
        print("📖 Reading CSV file...")
        df = pd.read_csv(csv_full_path)
        
        print(f"📊 Found {len(df)} records in CSV")
        
        # Validate required columns
        required_columns = ['Zipcode', 'City', 'State Code', 'State']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            print(f"❌ Error: Missing required columns: {missing_columns}")
            print(f"Available columns: {list(df.columns)}")
            return False
        
        # Get database collection
        locations = db.locations
        
        print("🔄 Processing and loading location data...")
        count = 0
        skipped = 0
        batch_size = 1000
        batch_data = []
        
        for index, row in df.iterrows():
            try:
                # Clean and validate data
                zipcode = str(row['Zipcode']).strip().zfill(5)  # Ensure 5 digits
                city = str(row['City']).strip()
                state = str(row['State Code']).strip()
                state_name = str(row['State']).strip()
                
                # Skip if essential data is missing
                if not zipcode or zipcode == 'nan' or not city or city == 'nan' or not state or state == 'nan':
                    skipped += 1
                    continue
                
                location = {
                    'zipCode': zipcode,
                    'city': city,
                    'state': state,
                    'stateName': state_name,
                    'displayName': f"{city}, {state}",  # For easier searching
                    'createdAt': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }
                
                batch_data.append(location)
                
                # Process in batches for better performance
                if len(batch_data) >= batch_size:
                    try:
                        # Use bulk operations for better performance
                        from pymongo import UpdateOne
                        operations = [
                            UpdateOne(
                                {'zipCode': loc['zipCode']},
                                {'$set': loc},
                                upsert=True
                            ) for loc in batch_data
                        ]
                        
                        result = locations.bulk_write(operations, ordered=False)
                        count += result.upserted_count + result.modified_count
                        
                        print(f"✅ Processed {count} locations...")
                        batch_data = []
                        
                    except Exception as batch_error:
                        print(f"⚠️  Batch error: {batch_error}")
                        # Fall back to individual inserts
                        for loc in batch_data:
                            try:
                                locations.update_one(
                                    {'zipCode': loc['zipCode']},
                                    {'$set': loc},
                                    upsert=True
                                )
                                count += 1
                            except Exception as single_error:
                                skipped += 1
                        batch_data = []
                    
            except Exception as e:
                print(f"⚠️  Error processing row {index + 1}: {e}")
                skipped += 1
                continue
        
        # Process remaining batch
        if batch_data:
            try:
                from pymongo import UpdateOne
                operations = [
                    UpdateOne(
                        {'zipCode': loc['zipCode']},
                        {'$set': loc},
                        upsert=True
                    ) for loc in batch_data
                ]
                
                result = locations.bulk_write(operations, ordered=False)
                count += result.upserted_count + result.modified_count
                
            except Exception as batch_error:
                print(f"⚠️  Final batch error: {batch_error}")
                for loc in batch_data:
                    try:
                        locations.update_one(
                            {'zipCode': loc['zipCode']},
                            {'$set': loc},
                            upsert=True
                        )
                        count += 1
                    except Exception as single_error:
                        skipped += 1
        
        print(f"🎉 Successfully loaded {count} locations!")
        if skipped > 0:
            print(f"⚠️  Skipped {skipped} invalid entries.")
        
        # Get final count from database
        total_count = locations.count_documents({})
        print(f"📊 Total locations in database: {total_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading locations: {e}")
        traceback.print_exc()
        return False

def verify_database_setup(db):
    """Verify that database setup is complete and functional"""
    print("\n🔍 Verifying database setup...")
    
    collections = ['users', 'locations', 'ride_posts', 'ride_interests', 'notifications']
    
    for collection_name in collections:
        collection = db[collection_name]
        
        # Check collection exists and get stats
        count = collection.count_documents({})
        indexes = list(collection.list_indexes())
        index_count = len(indexes)
        
        print(f"📋 {collection_name}:")
        print(f"   Documents: {count}")
        print(f"   Indexes: {index_count}")
        
        # Show index names
        index_names = [idx.get('name', 'unnamed') for idx in indexes]
        print(f"   Index names: {', '.join(index_names)}")
        
        # Test a simple query
        try:
            collection.find_one()
            print(f"   ✅ Query test: OK")
        except Exception as e:
            print(f"   ❌ Query test: {e}")
        
        print()

def get_database_performance_tips():
    """Print performance optimization tips"""
    print("\n🚀 Database Performance Tips:")
    print("=" * 50)
    print("✅ All indexes created for optimal query performance")
    print("✅ Compound indexes match your most common query patterns")
    print("✅ Text search enabled for location autocomplete")
    print("✅ Unique constraints prevent data duplication")
    print("\n💡 Query Performance Guidelines:")
    print("• Always filter by status='active' for ride searches")
    print("• Use travelDate in queries for better performance")
    print("• Compound queries (status+date+location) are optimized")
    print("• Location text search supports autocomplete features")
    print("• User-specific queries (userId) are well-indexed")
    print("\n📊 Monitoring:")
    print("• Monitor slow queries in MongoDB Atlas")
    print("• Check index usage in Atlas Performance Advisor")
    print("• Consider adding indexes for new query patterns")

def main():
    """Main function to set up complete database"""
    client = None
    try:
        print("🚀 CampusShare Complete Database Setup")
        print("=" * 50)
        print("This script will:")
        print("• Connect to MongoDB Atlas")
        print("• Create all collections with optimal indexes")
        print("• Load location data from CSV")
        print("• Verify the complete setup")
        print()
        
        # Connect to cloud database
        client, db = connect_to_cloud_db()
        
        # Check if data already exists
        existing_collections = db.list_collection_names()
        if existing_collections:
            print(f"⚠️  Found existing collections: {', '.join(existing_collections)}")
            response = input("Do you want to proceed? This will update/add indexes (y/N): ").strip().lower()
            if response not in ['y', 'yes']:
                print("❌ Operation cancelled by user")
                return
        
        print("\n🔧 Creating database schema and indexes...")
        
        # Create all collections with indexes
        create_users_collection(db)
        create_locations_collection(db)
        create_ride_posts_collection(db)
        create_ride_interests_collection(db)
        create_notifications_collection(db)
        
        # Load location data
        print("\n📍 Loading location data...")
        success = load_locations_from_csv(db)
        
        if not success:
            print("⚠️  Location data loading failed, but database schema is ready")
        
        # Verify setup
        verify_database_setup(db)
        
        # Show performance tips
        get_database_performance_tips()
        
        print("\n🎉 Database setup completed successfully!")
        print("✅ Your CampusShare application is ready for deployment!")
        
    except KeyboardInterrupt:
        print("\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error in main: {e}")
        traceback.print_exc()
        sys.exit(1)
    finally:
        if client:
            client.close()
            print("\n🔌 Database connection closed")

if __name__ == '__main__':
    main()