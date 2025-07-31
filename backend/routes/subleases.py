from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from scripts.database import get_collection, format_object_id, format_object_id_list
from routes.auth import get_current_user
from services.sublease_service import search_subleases_with_scoring, get_sublease_with_details

subleases_bp = Blueprint('subleases', __name__)

@subleases_bp.route('/search', methods=['POST'])
def search_subleases():
    """Smart sublease search with intelligent filtering and ranking"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['startDate', 'endDate', 'maxRent', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse dates
        start_date = datetime.strptime(data['startDate'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
        
        # Use the service layer for search
        search_criteria = {
            'startDate': start_date,
            'endDate': end_date,
            'maxRent': data['maxRent'],
            'location': data['location'],
            'requiredAmenities': data.get('requiredAmenities', []),
            'minBedrooms': data.get('minBedrooms'),
            'minBathrooms': data.get('minBathrooms'),
            'preferredMoveInTime': data.get('preferredMoveInTime', '09:00'),
            'preferredMoveOutTime': data.get('preferredMoveOutTime', '17:00')
        }
        
        scored_subleases = search_subleases_with_scoring(search_criteria)
        
        if not scored_subleases:
            return jsonify({
                'subleases': [],
                'total': 0,
                'message': 'No subleases found for your criteria'
            }), 200
        
        # Pagination
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        paginated_subleases = scored_subleases[start_idx:end_idx]
        
        # Format subleases for response
        formatted_subleases = []
        for sublease in paginated_subleases:
            sublease_with_details = get_sublease_with_details(sublease['_id'])
            if sublease_with_details:
                formatted_sublease = format_object_id(sublease_with_details)
                formatted_subleases.append(formatted_sublease)
        
        return jsonify({
            'subleases': formatted_subleases,
            'total': len(scored_subleases),
            'page': page,
            'per_page': per_page,
            'total_pages': (len(scored_subleases) + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 400

@subleases_bp.route('/', methods=['GET', 'POST'])
def subleases():
    """Get all subleases or create a new sublease posting"""
    if request.method == 'GET':
        """Get all subleases"""
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        try:
            sublease_posts = get_collection('sublease_posts')
            subleases = list(sublease_posts.find({'status': 'active'}).sort('createdAt', -1))
            
            # Format subleases for response
            formatted_subleases = []
            for sublease in subleases:
                formatted_sublease = format_object_id(sublease)
                formatted_subleases.append(formatted_sublease)
            
            return jsonify({
                'subleases': formatted_subleases,
                'total': len(formatted_subleases)
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to get subleases: {str(e)}'}), 500
    
    elif request.method == 'POST':
        """Create a new sublease posting"""
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        try:
            data = request.get_json()
            
            # Frontend handles all validations, proceed directly
            sublease_data = {
                'userId': ObjectId(user['_id']),
                'location': data['location'],
                'address': data.get('address', ''),
                'monthlyRent': data['monthlyRent'],
                'startDate': datetime.strptime(data['startDate'], '%Y-%m-%d').strftime('%Y-%m-%d'),
                'endDate': datetime.strptime(data['endDate'], '%Y-%m-%d').strftime('%Y-%m-%d'),
                'moveInTime': data.get('moveInTime', '09:00'),  # Default to 9 AM
                'moveOutTime': data.get('moveOutTime', '17:00'),  # Default to 5 PM
                'bedrooms': data['bedrooms'],
                'bathrooms': data['bathrooms'],
                'propertyType': data['propertyType'],
                'amenities': data['amenities'],
                'description': data.get('description', ''),
                'photos': data.get('photos', []),
                'proximityToCampus': data['proximityToCampus'],
                'status': 'active',
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            sublease_posts = get_collection('sublease_posts')
            result = sublease_posts.insert_one(sublease_data)
            
            return jsonify({
                'message': 'Sublease posted successfully',
                'subleaseId': str(result.inserted_id)
            }), 201
            
        except Exception as e:
            return jsonify({'error': f'Failed to create sublease: {str(e)}'}), 400

@subleases_bp.route('/my-subleases', methods=['GET'])
def get_my_subleases():
    """Get current user's sublease postings"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        sublease_posts = get_collection('sublease_posts')
        subleases = list(sublease_posts.find({'userId': ObjectId(user['_id'])}).sort('createdAt', -1))
        
        return jsonify({'subleases': format_object_id_list(subleases)}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get subleases: {str(e)}'}), 400

@subleases_bp.route('/<sublease_id>', methods=['PUT'])
def update_sublease():
    """Update sublease posting"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        sublease_id = ObjectId(request.view_args['sublease_id'])
        data = request.get_json()
        
        # Update sublease directly - frontend already validated ownership
        sublease_posts = get_collection('sublease_posts')
        
        # Update sublease
        update_data = {
            'updatedAt': datetime.utcnow()
        }
        
        fields_to_update = [
            'location', 'address', 'monthlyRent', 'startDate', 'endDate',
            'bedrooms', 'bathrooms', 'propertyType', 'amenities',
            'description', 'photos', 'proximityToCampus', 'moveInTime', 'moveOutTime'
        ]
        
        for field in fields_to_update:
            if field in data:
                if field in ['startDate', 'endDate']:
                    update_data[field] = datetime.strptime(data[field], '%Y-%m-%d').date()
                else:
                    update_data[field] = data[field]
        
        result = sublease_posts.update_one(
            {'_id': sublease_id, 'userId': ObjectId(user['_id'])}, 
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Sublease not found or not owned by user'}), 404
        
        return jsonify({'message': 'Sublease updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update sublease: {str(e)}'}), 400

@subleases_bp.route('/<sublease_id>', methods=['DELETE'])
def delete_sublease():
    """Delete sublease posting"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        sublease_id = ObjectId(request.view_args['sublease_id'])
        
        # Mark as cancelled directly - frontend already validated ownership
        sublease_posts = get_collection('sublease_posts')
        
        result = sublease_posts.update_one(
            {'_id': sublease_id, 'userId': ObjectId(user['_id'])},
            {'$set': {'status': 'cancelled', 'updatedAt': datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Sublease not found or not owned by user'}), 404
        
        return jsonify({'message': 'Sublease cancelled successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to cancel sublease: {str(e)}'}), 400 