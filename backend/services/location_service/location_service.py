from scripts.database import get_collection
from bson import ObjectId
from typing import List, Dict, Optional

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
        """Get a location by ID - needed for ride/sublease references"""
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

# Global instance
location_service = LocationService() 