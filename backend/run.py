#!/usr/bin/env python3
"""
CampusShare Backend - All-in-One Runner
Handles setup, database initialization, and running the app
"""

import subprocess
import sys
import os
import time
from pathlib import Path

def install_requirements():
    """Install required packages"""
    print("📦 Installing requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def check_mongodb():
    """Check if MongoDB is running"""
    print("🔍 Checking MongoDB connection...")
    try:
        import pymongo
        from dotenv import load_dotenv
        import os
        
        load_dotenv()
        
        # Use the MongoDB URI from environment variables
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/campus_share')
        client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        print("✅ MongoDB is running!")
        return True
    except Exception as e:
        print(f"❌ MongoDB not running: {e}")
        print("💡 Please start MongoDB with: mongod")
        return False

def load_location_data():
    """Load location data from CSV if available and not already loaded"""
    csv_path = Path('data/locations.csv')
    if csv_path.exists():
        try:
            # Add current directory to path for imports
            sys.path.insert(0, os.getcwd())
            
            from scripts.database import get_collection
            
            # Check if locations are already loaded
            locations = get_collection('locations')
            existing_count = locations.count_documents({})
            
            if existing_count > 0:
                print(f"✅ Location data already loaded ({existing_count} locations found)")
                print("💡 Skipping location data loading to avoid duplicates")
                return True
            
            print("🗺️ Loading location data from data/locations.csv...")
            from scripts.load_locations import main as load_locations
            load_locations()
            print("✅ Location data loaded successfully!")
            return True
        except Exception as e:
            print(f"⚠️ Failed to load location data: {e}")
            print("💡 You can load it manually later with: python scripts/load_locations.py")
            return False
    else:
        print("ℹ️ No locations.csv found - skipping location data loading")
        print("💡 Place a locations.csv file in the backend directory to load location data")
        return True

def test_imports():
    """Test if all modules can be imported"""
    print("🧪 Testing imports...")
    try:
        # Test basic imports
        import flask
        import pymongo
        print("✅ Basic imports successful!")
        
        # Test our modules
        from scripts.database import init_db
        from config import config
        print("✅ Local imports successful!")
        
        return True
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def initialize_database():
    """Initialize database and create indexes"""
    print("🗄️ Initializing database...")
    try:
        from scripts.database import init_db
        init_db()
        print("✅ Database initialized successfully!")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def run_app():
    """Run the Flask application"""
    print("🚀 Starting CampusShare Backend...")
    print("📍 API will be available at: http://localhost:5000")
    print("🔗 Health check: http://localhost:5000/api/health")
    print("⏹️ Press Ctrl+C to stop")
    print("-" * 50)
    
    try:
        from app import app
        app.run(debug=False, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n👋 Shutting down CampusShare Backend...")
    except Exception as e:
        print(f"❌ Failed to start app: {e}")

def main():
    print("🎓 CampusShare Backend")
    print("=" * 50)
    
    # Step 1: Install requirements
    if not install_requirements():
        print("❌ Setup failed at requirements installation")
        return False
    
    # Step 2: Test imports
    if not test_imports():
        print("❌ Setup failed at import testing")
        return False
    
    # Step 3: Check MongoDB
    if not check_mongodb():
        print("❌ Setup failed - MongoDB not running")
        print("💡 Please start MongoDB with: mongod")
        return False
    
    # Step 4: Initialize database
    if not initialize_database():
        print("❌ Setup failed at database initialization")
        return False
    
    # Step 5: Load location data (optional)
    load_location_data()
    
    print("\n🎉 Setup completed successfully!")
    print("=" * 50)
    
    # Step 6: Run the app
    run_app()
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1) 