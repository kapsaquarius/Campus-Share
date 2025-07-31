#!/usr/bin/env python3
"""
Simple Location Data Loader from CSV
Loads ZIP codes, cities, state codes, and state names from locations.csv
"""

import sys
import os
import pandas as pd
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .database import init_db, get_collection

def load_locations_from_csv(csv_file_path: str = 'data/locations.csv'):
    """Load locations from CSV file"""
    try:
        # Check if CSV file exists
        if not os.path.exists(csv_file_path):
            print(f"Error: CSV file '{csv_file_path}' not found!")
            print("Please place your locations.csv file in the backend directory.")
            return False
        
        print(f"Loading locations from {csv_file_path}...")
        
        # Read CSV file
        df = pd.read_csv(csv_file_path)
        
        # Validate required columns
        required_columns = ['Zipcode', 'City', 'State Code', 'State']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            print(f"Error: Missing required columns: {missing_columns}")
            print(f"Available columns: {list(df.columns)}")
            return False
        
        # Get database collection
        locations = get_collection('locations')
        
        print("Processing and loading location data...")
        count = 0
        skipped = 0
        
        for _, row in df.iterrows():
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
                    'createdAt': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }
                
                # Insert or update
                locations.update_one(
                    {'zipCode': location['zipCode']},
                    {'$set': location},
                    upsert=True
                )
                count += 1
                
                if count % 1000 == 0:
                    print(f"Processed {count} locations...")
                    
            except Exception as e:
                print(f"Error processing row {count + 1}: {e}")
                skipped += 1
                continue
        
        print(f"Successfully loaded {count} locations!")
        if skipped > 0:
            print(f"Skipped {skipped} invalid entries.")
        
        return True
        
    except Exception as e:
        print(f"Error loading locations: {e}")
        return False

def create_location_indexes():
    """Create indexes for locations collection"""
    try:
        from .database import get_db
        db = get_db()
        
        # Create indexes for fast searching
        db.locations.create_index("zipCode", unique=True)
        db.locations.create_index("city")
        db.locations.create_index("state")
        db.locations.create_index([("city", 1), ("state", 1)])
        
        print("Location indexes created successfully!")
        
    except Exception as e:
        print(f"Error creating indexes: {e}")
        raise

def main():
    """Main function to load location data"""
    try:
        print("Initializing database...")
        init_db()
        
        print("Creating location indexes...")
        create_location_indexes()
        
        # Load data from CSV
        success = load_locations_from_csv()
        
        if success:
            print("\nLocation data loading completed successfully!")
        else:
            print("\nLocation data loading failed!")
            sys.exit(1)
        
    except Exception as e:
        print(f"Error in main: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 