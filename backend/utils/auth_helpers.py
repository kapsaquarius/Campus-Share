import jwt
from datetime import datetime, timedelta
from flask import current_app
from bson import ObjectId
from scripts.database import get_collection, format_object_id

def create_jwt_token(user_id):
    """Create JWT token for user"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user_from_request(request):
    """Get current user from request headers"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    if not user_id:
        return None
    
    users = get_collection('users')
    user = users.find_one({'_id': ObjectId(user_id)})
    return format_object_id(user) if user else None 