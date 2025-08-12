from flask import Blueprint, request, jsonify
from datetime import datetime, date, timedelta
from bson import ObjectId
from scripts.database import get_collection, format_object_id
from routes.auth import get_current_user
from services.roommate_service import search_roommates_with_scoring, get_roommate_with_details
from services.notification_service import (
    create_roommate_interest_notification,
    create_roommate_interest_removed_notification,
    create_roommate_update_notification,
    create_roommate_cancellation_notification,
)

roommates_bp = Blueprint('roommates', __name__)


def _serialize_mongo(obj):
    """Recursively convert Mongo types to JSON-serializable types."""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat() + 'Z'
    if isinstance(obj, date):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _serialize_mongo(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize_mongo(v) for v in obj]
    return obj

@roommates_bp.route('/search', methods=['GET'])
def search_roommates():
    try:
        current_user = get_current_user()
        user_id = current_user['_id'] if current_user else None

        # Extract filters
        params = request.args
        req_type = params.get('type')
        invert_type = None
        if req_type in ('offer', 'seek'):
            invert_type = 'seek' if req_type == 'offer' else 'offer'
        # Move-in hard filter window (defaults)
        move_in = params.get('moveIn')
        move_in_start = None
        move_in_end = None
        if move_in:
            try:
                base = datetime.strptime(move_in, '%Y-%m-%d').date()
                # symmetrical window ±21 days
                start = base - timedelta(days=21)
                end = base + timedelta(days=21)
                move_in_start = start.strftime('%Y-%m-%d')
                move_in_end = end.strftime('%Y-%m-%d')
            except Exception:
                move_in_start = None
                move_in_end = None

        criteria = {
            'type': invert_type if invert_type else None,
            'location': params.get('location'),
            'moveIn': params.get('moveIn'),
            'moveInStart': move_in_start,
            'moveInEnd': move_in_end,
            'budgetMin': int(params.get('budgetMin')) if params.get('budgetMin') else None,
            'budgetMax': int(params.get('budgetMax')) if params.get('budgetMax') else None,
            'roomType': params.get('roomType'),
            'furnished': params.get('furnished'),
            'pets': params.get('pets'),
            'smoking': params.get('smoking'),
            'dietary': params.get('dietary'),
            'sleep': params.get('sleep'),
            'guestsPerWeek': params.get('guestsPerWeek'),
        }

        results = search_roommates_with_scoring(criteria, user_id)

        # pagination (optional)
        page = int(params.get('page', 1))
        per_page = int(params.get('per_page', 20))
        start = (page - 1) * per_page
        end = start + per_page
        paged = results[start:end]

        # Enrich with poster details (parity with rides search detail lookup)
        formatted = []
        for doc in paged:
            try:
                detailed = get_roommate_with_details(doc['_id'])
                formatted.append(_serialize_mongo(detailed))
            except Exception:
                formatted.append(format_object_id(doc))
        return jsonify({
            'listings': formatted,
            'total': len(results),
            'page': page,
            'per_page': per_page,
            'total_pages': (len(results) + per_page - 1) // per_page,
        }), 200
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 400


@roommates_bp.route('/', methods=['POST'])
def create_roommate_post():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json() or {}
        post = {
            'userId': ObjectId(user['_id']),
            'type': data.get('type', 'offer'),
            'location': data.get('location', ''),
            'exactAddress': data.get('exactAddress'),
            'moveInEarliest': data.get('moveInEarliest'),
            'budgetMin': data.get('budgetMin', 0),
            'budgetMax': data.get('budgetMax', 0),
            'roomType': data.get('roomType'),
            'furnished': bool(data.get('furnished', False)),
            'petFriendly': bool(data.get('petFriendly', False)),
            'smokerOk': bool(data.get('smokerOk', False)),
            'dietaryPreference': data.get('dietaryPreference'),
            'sleepSchedule': data.get('sleepSchedule'),
            'guestsPerWeek': data.get('guestsPerWeek'),
            'additionalDetails': data.get('additionalDetails', ''),
            'status': 'active',
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
        }

        posts = get_collection('roommate_posts')
        res = posts.insert_one(post)
        created = posts.find_one({'_id': res.inserted_id})
        return jsonify({'message': 'Listing created', 'listing': format_object_id(created)}), 201
    except Exception as e:
        return jsonify({'error': f'Failed to create listing: {str(e)}'}), 400


@roommates_bp.route('/my-listings', methods=['GET'])
def my_roommate_listings():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        posts = get_collection('roommate_posts')
        interests = get_collection('roommate_interests')
        docs = list(posts.find({'userId': ObjectId(user['_id'])}).sort('createdAt', -1))
        # Aggregate for accurate counts
        ids = [d['_id'] for d in docs]
        counts_map = {str(_id): 0 for _id in ids}
        try:
            pipeline = [
                {'$match': {'postId': {'$in': ids}, 'status': 'interested'}},
                {'$group': {'_id': '$postId', 'count': {'$sum': 1}}}
            ]
            for c in interests.aggregate(pipeline):
                counts_map[str(c['_id'])] = c['count']
        except Exception:
            pass
        formatted = []
        for d in docs:
            f = format_object_id(d)
            f['interestCount'] = counts_map.get(str(d['_id']), 0)
            formatted.append(f)
        return jsonify({'listings': formatted}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to load listings: {str(e)}'}), 400


@roommates_bp.route('/my-matches', methods=['GET'])
def my_roommate_matches():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        # Basic heuristic: return top matches for default criteria using user's latest post, else fallback to general
        posts = get_collection('roommate_posts')
        last = posts.find_one({'userId': ObjectId(user['_id'])}, sort=[('createdAt', -1)])
        criteria = {}
        if last:
            criteria = {
                'type': 'offer' if last.get('type') == 'seek' else 'seek',
                'location': last.get('location'),
                'budgetMin': last.get('budgetMin'),
                'budgetMax': last.get('budgetMax'),
                'moveIn': last.get('moveInEarliest'),
                'roomType': last.get('roomType'),
                'furnished': 'yes' if last.get('furnished') else 'no',
                'pets': 'ok' if last.get('petFriendly') else 'no',
                'smoking': 'ok' if last.get('smokerOk') else 'no',
                'dietary': last.get('dietaryPreference'),
                'sleep': last.get('sleepSchedule'),
                'guestsPerWeek': last.get('guestsPerWeek'),
            }
        matches = search_roommates_with_scoring(criteria, user['_id'])[:50]
        return jsonify({'matches': [format_object_id(m) for m in matches]}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to load matches: {str(e)}'}), 400


@roommates_bp.route('/my-interested', methods=['GET'])
def get_my_interested_roommates():
    """Get roommate listings that the current user has expressed interest in"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        interests = get_collection('roommate_interests')
        posts = get_collection('roommate_posts')
        users = get_collection('users')

        pipeline = [
            {'$match': {'interestedUserId': ObjectId(user['_id']), 'status': 'interested'}},
            {'$lookup': {
                'from': 'roommate_posts',
                'localField': 'postId',
                'foreignField': '_id',
                'as': 'post'
            }},
            {'$unwind': '$post'},
            {'$lookup': {
                'from': 'users',
                'localField': 'post.userId',
                'foreignField': '_id',
                'as': 'poster'
            }},
            {'$unwind': '$poster'},
            {'$project': {
                '_id': {'$toString': '$_id'},
                'interestedAt': '$createdAt',
                'listing': {
                    '_id': {'$toString': '$post._id'},
                    'type': '$post.type',
                    'location': '$post.location',
                    'exactAddress': '$post.exactAddress',
                    'moveInEarliest': '$post.moveInEarliest',
                    'budgetMin': '$post.budgetMin',
                    'budgetMax': '$post.budgetMax',
                    'roomType': '$post.roomType',
                    'furnished': '$post.furnished',
                    'petFriendly': '$post.petFriendly',
                    'smokerOk': '$post.smokerOk',
                    'dietaryPreference': '$post.dietaryPreference',
                    'sleepSchedule': '$post.sleepSchedule',
                    'guestsPerWeek': '$post.guestsPerWeek',
                    'status': '$post.status',
                    'createdAt': '$post.createdAt',
                    'additionalDetails': '$post.additionalDetails'
                },
                'poster': {
                    'name': '$poster.name',
                    'username': '$poster.username',
                    'phoneNumber': '$poster.phone',
                    'whatsappNumber': '$poster.whatsapp'
                }
            }},
            {'$sort': {'interestedAt': -1}}
        ]

        docs = list(interests.aggregate(pipeline))
        return jsonify({'interestedListings': docs, 'totalCount': len(docs)}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get interested listings: {str(e)}'}), 400

@roommates_bp.route('/<post_id>', methods=['GET'])
def get_roommate_post(post_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        post_id = ObjectId(post_id)
        doc = get_roommate_with_details(post_id)
        if not doc:
            return jsonify({'error': 'Not found'}), 404
        # Ensure nested ObjectIds and datetimes are serialized
        return jsonify(_serialize_mongo(doc)), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get listing: {str(e)}'}), 400


@roommates_bp.route('/<post_id>', methods=['PUT'])
def update_roommate_post(post_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        post_id_obj = ObjectId(post_id)
        data = request.get_json() or {}
        posts = get_collection('roommate_posts')
        existing = posts.find_one({'_id': post_id_obj})
        if not existing:
            return jsonify({'error': 'Listing not found'}), 404
        if str(existing['userId']) != str(user['_id']):
            return jsonify({'error': 'Forbidden'}), 403

        updates = {}
        # Map allowed fields
        if 'type' in data:
            updates['type'] = data['type']
        if 'location' in data:
            updates['location'] = data['location']
        if 'exactAddress' in data:
            updates['exactAddress'] = data['exactAddress']
        if 'moveInEarliest' in data:
            updates['moveInEarliest'] = data['moveInEarliest']
        if 'budgetMin' in data:
            updates['budgetMin'] = data['budgetMin']
        if 'budgetMax' in data:
            updates['budgetMax'] = data['budgetMax']
        if 'roomType' in data:
            updates['roomType'] = data['roomType']
        if 'furnished' in data:
            updates['furnished'] = bool(data['furnished'])
        if 'petFriendly' in data:
            updates['petFriendly'] = bool(data['petFriendly'])
        if 'smokerOk' in data:
            updates['smokerOk'] = bool(data['smokerOk'])
        if 'dietaryPreference' in data:
            updates['dietaryPreference'] = data['dietaryPreference']
        if 'sleepSchedule' in data:
            updates['sleepSchedule'] = data['sleepSchedule']
        if 'guestsPerWeek' in data:
            updates['guestsPerWeek'] = data['guestsPerWeek']
        if 'additionalDetails' in data:
            updates['additionalDetails'] = data['additionalDetails']

        updates['updatedAt'] = datetime.utcnow()

        # Ownership-safe update (include userId in filter for parity with rides)
        posts.update_one({'_id': post_id_obj, 'userId': ObjectId(user['_id'])}, {'$set': updates})
        updated = posts.find_one({'_id': post_id_obj})
        # Notify interested users similar to rides
        try:
            create_roommate_update_notification(post_id_obj, updated)
        except Exception as e:
            print(f"Roommate update notification error: {e}")
        return jsonify({'message': 'Listing updated', 'listing': format_object_id(updated)}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to update listing: {str(e)}'}), 400


@roommates_bp.route('/<post_id>', methods=['DELETE'])
def delete_roommate_post(post_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        post_id_obj = ObjectId(post_id)
        posts = get_collection('roommate_posts')
        existing = posts.find_one({'_id': post_id_obj})
        if not existing:
            return jsonify({'error': 'Listing not found'}), 404
        if str(existing['userId']) != str(user['_id']):
            return jsonify({'error': 'Forbidden'}), 403

        # Notify interested users before deleting (parity with rides)
        try:
            create_roommate_cancellation_notification(post_id_obj, existing)
        except Exception as e:
            print(f"Roommate cancellation notification error: {e}")

        posts.delete_one({'_id': post_id_obj})
        # Cascade delete interests
        interests = get_collection('roommate_interests')
        interests.delete_many({'postId': post_id_obj})
        return jsonify({'message': 'Listing deleted'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to delete listing: {str(e)}'}), 400

@roommates_bp.route('/<post_id>/interest', methods=['POST'])
def express_interest(post_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        post_id = ObjectId(post_id)
        posts = get_collection('roommate_posts')
        users = get_collection('users')
        interests = get_collection('roommate_interests')

        # Fetch listing and poster in one aggregation (parity with rides flow)
        pipeline = [
            {'$match': {'_id': post_id, 'status': 'active'}},
            {'$lookup': {
                'from': 'users',
                'localField': 'userId',
                'foreignField': '_id',
                'as': 'poster'
            }},
            {'$unwind': '$poster'}
        ]
        listing_with_poster = list(posts.aggregate(pipeline))
        if not listing_with_poster:
            return jsonify({'error': 'Listing not found'}), 404

        listing = listing_with_poster[0]

        # Prevent self-interest
        if str(listing['userId']) == str(user['_id']):
            return jsonify({'error': 'You cannot express interest in your own listing'}), 400

        # Prevent duplicates
        existing = interests.find_one({'postId': post_id, 'interestedUserId': ObjectId(user['_id'])})
        if existing:
            return jsonify({'error': 'Already expressed interest'}), 400

        # Create interest
        interests.insert_one({
            'postId': post_id,
            'interestedUserId': ObjectId(user['_id']),
            'status': 'interested',
            'createdAt': datetime.utcnow(),
        })

        # Notification to listing owner (email may be sent async inside service)
        create_roommate_interest_notification(post_id, user['_id'], listing)

        # Return poster contact details similar to rides
        poster = listing.get('poster', {})
        return jsonify({
            'message': 'Interest expressed successfully',
            'poster': {
                'name': poster.get('name', ''),
                'phoneNumber': poster.get('phone', ''),
                'whatsappNumber': poster.get('whatsapp', ''),
            }
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to express interest: {str(e)}'}), 400


@roommates_bp.route('/<post_id>/interested-users', methods=['GET'])
def get_roommate_interested_users(post_id):
    """Get list of users interested in a specific roommate listing"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        post_id = ObjectId(post_id)
        posts = get_collection('roommate_posts')
        post = posts.find_one({'_id': post_id, 'userId': ObjectId(user['_id'])})
        if not post:
            return jsonify({'error': 'Listing not found or you do not own this listing'}), 404

        interests = get_collection('roommate_interests')
        pipeline = [
            {'$match': {'postId': post_id, 'status': 'interested'}},
            {'$lookup': {
                'from': 'users',
                'localField': 'interestedUserId',
                'foreignField': '_id',
                'as': 'user'
            }},
            {'$unwind': '$user'},
            {'$project': {
                '_id': {'$toString': '$_id'},
                'createdAt': 1,
                'user': {
                    '_id': {'$toString': '$user._id'},
                    'name': '$user.name',
                    'username': '$user.username',
                    'email': '$user.email',
                    'phoneNumber': '$user.phone',
                    'whatsappNumber': '$user.whatsapp'
                }
            }},
            {'$sort': {'createdAt': -1}}
        ]
        docs = list(interests.aggregate(pipeline))
        return jsonify({'interestedUsers': docs, 'totalCount': len(docs)}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get interested users: {str(e)}'}), 400


@roommates_bp.route('/<post_id>/interest', methods=['DELETE'])
def remove_roommate_interest(post_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        post_id_obj = ObjectId(post_id)
        posts = get_collection('roommate_posts')
        post = posts.find_one({'_id': post_id_obj})
        if not post:
            return jsonify({'error': 'Listing not found'}), 404
        interests = get_collection('roommate_interests')
        existing = interests.find_one({'postId': post_id_obj, 'interestedUserId': ObjectId(user['_id']), 'status': 'interested'})
        if not existing:
            return jsonify({'error': 'You have not expressed interest in this listing'}), 400
        interests.delete_one({'_id': existing['_id']})
        create_roommate_interest_removed_notification(post_id_obj, user['_id'], post)
        return jsonify({'message': 'Interest removed successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to remove interest: {str(e)}'}), 400

