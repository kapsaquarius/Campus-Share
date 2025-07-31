from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from scripts.database import get_collection, format_object_id, format_object_id_list
from routes.auth import get_current_user

reviews_bp = Blueprint('reviews', __name__)

@reviews_bp.route('/', methods=['POST'])
def create_review():
    """Create a review for a ride"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        
        # Frontend handles all validations, proceed directly
        # Check if user has already reviewed this ride - this is the only necessary check
        reviews = get_collection('reviews')
        existing_review = reviews.find_one({
            'reviewerId': ObjectId(user['_id']),
            'rideId': ObjectId(data['rideId'])
        })
        
        if existing_review:
            return jsonify({'error': 'You have already reviewed this ride'}), 400
        
        # Create review
        review_data = {
            'reviewerId': ObjectId(user['_id']),
            'reviewedUserId': ObjectId(data['reviewedUserId']),
            'rideId': ObjectId(data['rideId']),
            'rating': data['rating'],
            'review': data.get('review', ''),
            'createdAt': datetime.utcnow()
        }
        
        result = reviews.insert_one(review_data)
        
        return jsonify({
            'message': 'Review created successfully',
            'reviewId': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create review: {str(e)}'}), 400

@reviews_bp.route('/user/<user_id>', methods=['GET'])
def get_user_reviews(user_id):
    """Get reviews for a specific user"""
    try:
        # Frontend handles validation, proceed directly
        reviews = get_collection('reviews')
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Get reviews for the user
        query = {'reviewedUserId': ObjectId(user_id)}
        total_count = reviews.count_documents(query)
        
        # Get paginated reviews
        skip = (page - 1) * per_page
        user_reviews = list(
            reviews.find(query)
            .sort('createdAt', -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Get reviewer information for each review
        users = get_collection('users')
        formatted_reviews = []
        
        for review in user_reviews:
            reviewer = users.find_one({'_id': review['reviewerId']})
            formatted_review = format_object_id(review)
            formatted_review['reviewer'] = {
                'name': reviewer['name'],
                'profilePicture': reviewer.get('profilePicture', '')
            }
            formatted_reviews.append(formatted_review)
        
        # Calculate average rating
        avg_rating = 0
        if total_count > 0:
            pipeline = [
                {'$match': {'reviewedUserId': ObjectId(user_id)}},
                {'$group': {'_id': None, 'avgRating': {'$avg': '$rating'}}}
            ]
            result = list(reviews.aggregate(pipeline))
            if result:
                avg_rating = round(result[0]['avgRating'], 1)
        
        return jsonify({
            'reviews': formatted_reviews,
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page,
            'averageRating': avg_rating
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get reviews: {str(e)}'}), 400

@reviews_bp.route('/my-reviews', methods=['GET'])
def get_my_reviews():
    """Get current user's reviews"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        reviews = get_collection('reviews')
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Get reviews by the user
        query = {'reviewerId': ObjectId(user['_id'])}
        total_count = reviews.count_documents(query)
        
        # Get paginated reviews
        skip = (page - 1) * per_page
        my_reviews = list(
            reviews.find(query)
            .sort('createdAt', -1)
            .skip(skip)
            .limit(per_page)
        )
        
        # Get reviewed user information for each review
        users = get_collection('users')
        formatted_reviews = []
        
        for review in my_reviews:
            reviewed_user = users.find_one({'_id': review['reviewedUserId']})
            formatted_review = format_object_id(review)
            formatted_review['reviewedUser'] = {
                'name': reviewed_user['name'],
                'profilePicture': reviewed_user.get('profilePicture', '')
            }
            formatted_reviews.append(formatted_review)
        
        return jsonify({
            'reviews': formatted_reviews,
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get reviews: {str(e)}'}), 400

@reviews_bp.route('/<review_id>', methods=['PUT'])
def update_review():
    """Update a review"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        review_id = ObjectId(request.view_args['review_id'])
        data = request.get_json()
        
        reviews = get_collection('reviews')
        
        # Check if review belongs to user
        review = reviews.find_one({
            '_id': review_id,
            'reviewerId': ObjectId(user['_id'])
        })
        
        if not review:
            return jsonify({'error': 'Review not found'}), 404
        
        # Update review
        update_data = {}
        
        if 'rating' in data:
            update_data['rating'] = data['rating']
        
        if 'review' in data:
            update_data['review'] = data['review']
        
        if update_data:
            reviews.update_one(
                {'_id': review_id},
                {'$set': update_data}
            )
        
        return jsonify({'message': 'Review updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update review: {str(e)}'}), 400

@reviews_bp.route('/<review_id>', methods=['DELETE'])
def delete_review():
    """Delete a review"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        review_id = ObjectId(request.view_args['review_id'])
        
        reviews = get_collection('reviews')
        
        # Check if review belongs to user
        review = reviews.find_one({
            '_id': review_id,
            'reviewerId': ObjectId(user['_id'])
        })
        
        if not review:
            return jsonify({'error': 'Review not found'}), 404
        
        # Delete review
        reviews.delete_one({'_id': review_id})
        
        return jsonify({'message': 'Review deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete review: {str(e)}'}), 400 