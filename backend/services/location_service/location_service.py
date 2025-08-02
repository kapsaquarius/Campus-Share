from scripts.database import get_collection
from bson import ObjectId
from typing import List, Dict, Optional
import re

class LocationService:
    def __init__(self):
        self.locations = get_collection('locations')
    
    def search_locations(self, query: str, limit: int = 10) -> List[Dict]:
        """Search locations by ZIP code, city, or state - this is what users need"""
        # Create search query
        search_query = {
            '$or': [
                {'zipCode': {'$regex': query, '$options': 'i'}},
                {'city': {'$regex': query, '$options': 'i'}},
                {'state': {'$regex': query, '$options': 'i'}},
                {'stateName': {'$regex': query, '$options': 'i'}}
            ]
        }
        
        # Find locations
        locations = list(self.locations.find(search_query).sort([
            ('city', 1),
            ('state', 1)
        ]).limit(limit))
        
        return self._format_locations(locations)
    
    def _get_word_conditions(self, query: str) -> List[Dict]:
        """Generate word-based search conditions for multi-word queries"""
        words = [word.strip() for word in query.split() if word.strip() and len(word.strip()) >= 2]
        conditions = []
        
        for word in words:
            conditions.extend([
                {'displayName': {'$regex': word, '$options': 'i'}},
                {'city': {'$regex': word, '$options': 'i'}},
                {'stateName': {'$regex': word, '$options': 'i'}}
            ])
        
        return conditions
    
    def get_location_by_id(self, location_id: str) -> Optional[Dict]:
        """Get a location by ID - needed for ride references"""
        location = self.locations.find_one({'_id': ObjectId(location_id)})
        return self._format_location(location) if location else None
    
    def _format_location(self, location: Dict) -> Dict:
        """Format a single location for API response"""
        if not location:
            return None
        
        return {
            '_id': str(location['_id']),
            'zipCode': location['zipCode'],
            'city': location['city'],
            'state': location['state'],
            'stateName': location['stateName'],
            'displayName': f"{location['city']}, {location['stateName']} {location['zipCode']}"
        }
    
    def _format_locations(self, locations: List[Dict]) -> List[Dict]:
        """Format multiple locations for API response"""
        return [self._format_location(location) for location in locations]

    def get_all_city_locations(self, city: str, state: str) -> List[Dict]:
        """Get all zip codes for a given city and state"""
        query = {
            'city': {'$regex': f'^{re.escape(city)}$', '$options': 'i'},
            'state': {'$regex': f'^{re.escape(state)}$', '$options': 'i'}
        }
        
        locations = list(self.locations.find(query).sort('zipCode', 1))
        return self._format_locations(locations)
    
    def get_all_city_display_names(self, city: str, state_name: str) -> List[str]:
        """Get all possible display name variations for a city"""
        query = {
            'city': {'$regex': f'^{re.escape(city)}$', '$options': 'i'},
            'stateName': {'$regex': f'^{re.escape(state_name)}$', '$options': 'i'}
        }
        
        locations = list(self.locations.find(query).sort('zipCode', 1))
        display_names = []
        
        for location in locations:
            # Add both general city format and specific zip code format
            general_name = f"{location['city']}, {location['stateName']}"
            specific_name = f"{location['city']}, {location['stateName']} {location['zipCode']}"
            
            if general_name not in display_names:
                display_names.append(general_name)
            display_names.append(specific_name)
        
        return display_names
    
    def parse_location_string(self, location_string: str) -> Dict:
        """Parse a location string to extract city, state, and zip code"""
        import re
        
        # Handle format: "City, State" or "City, State ZipCode"
        pattern = r'^(.+?),\s*(.+?)(?:\s+(\d{5}))?$'
        match = re.match(pattern, location_string.strip())
        
        if match:
            city = match.group(1).strip()
            state_part = match.group(2).strip()
            zip_code = match.group(3)
            
            # If state_part contains zip code, extract it
            if not zip_code and ' ' in state_part:
                parts = state_part.rsplit(' ', 1)
                if len(parts) == 2 and parts[1].isdigit() and len(parts[1]) == 5:
                    state_part = parts[0]
                    zip_code = parts[1]
            
            return {
                'city': city,
                'state': state_part,
                'zipCode': zip_code
            }
        
        return None

# Global instance
location_service = LocationService() 