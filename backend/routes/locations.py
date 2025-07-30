from flask import Blueprint, request, jsonify
from routes.auth import get_current_user
from services.location_service import location_service

locations_bp = Blueprint('locations', __name__)

@locations_bp.route('/search', methods=['GET'])
def search_locations():
    """Search locations - this is what users need for ride/sublease search"""
    try:
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 10))
        
        if not query:
            return jsonify({'error': 'Query parameter "q" is required'}), 400
        
        locations = location_service.search_locations(query, limit)
        
        return jsonify({
            'locations': locations,
            'total': len(locations),
            'query': query
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@locations_bp.route('/<location_id>', methods=['GET'])
def get_location(location_id):
    """Get a specific location by ID - needed for ride/sublease references"""
    try:
        location = location_service.get_location_by_id(location_id)
        
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        
        return jsonify(location), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 