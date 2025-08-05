from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
from bson import ObjectId
from services.user_service.user_service import user_service
from utils.auth_helpers import create_jwt_token, verify_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'name', 'phone', 'whatsapp']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
        
        # Create user
        user = user_service.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            name=data['name'],
            phone=data['phone'],
            whatsapp=data['whatsapp']
        )
        
        # Create JWT token
        token = create_jwt_token(user['_id'])
        
        return jsonify({
            "message": "User registered successfully",
            "user": user,
            "token": token
        }), 201
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Registration error: {str(e)}")  # Add debugging
        return jsonify({"error": "Registration failed"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with username and password"""
    try:
        data = request.get_json()
        
        # Authenticate user
        user = user_service.authenticate_user(data['username'], data['password'])
        
        if not user:
            return jsonify({"error": "Invalid username or password"}), 401
        
        # Create JWT token
        token = create_jwt_token(user['_id'])
        
        return jsonify({
            "message": "Login successful",
            "user": user,
            "token": token
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Login failed"}), 500

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get current user profile"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        return jsonify({"user": user}), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to get profile"}), 500

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update current user profile"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        data = request.get_json()
        allowed_updates = ['name', 'phone', 'whatsapp', 'email']
        
        updates = {}
        for field in allowed_updates:
            if field in data:
                updates[field] = data[field]
        
        # Handle frontend field names
        if 'phoneNumber' in data:
            updates['phone'] = data['phoneNumber']
        if 'whatsappNumber' in data:
            updates['whatsapp'] = data['whatsappNumber']
        

        
        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400
        
        updated_user = user_service.update_user(user['_id'], updates)
        
        if updated_user:
            return jsonify({
                "message": "Profile updated successfully",
                "user": updated_user
            }), 200
        else:
            return jsonify({"error": "Failed to update profile"}), 500
            
    except Exception as e:
        return jsonify({"error": "Failed to update profile"}), 500

@auth_bp.route('/delete-account', methods=['DELETE'])
def delete_account():
    """Delete current user account and all associated data"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = user['_id']
        
        # Delete all user data
        success = user_service.delete_user_and_all_data(user_id)
        
        if success:
            return jsonify({
                "message": "Account and all associated data deleted successfully"
            }), 200
        else:
            return jsonify({"error": "Failed to delete account"}), 500
            
    except Exception as e:
        print(f"Delete account error: {str(e)}")
        return jsonify({"error": "Failed to delete account"}), 500

def get_current_user():
    """Get current user from request headers"""
    return get_current_user_from_request(request)

def get_current_user_from_request(request):
    """Extract user from request headers"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    
    if user_id:
        return user_service.get_user_by_id(user_id)
    return None

def verify_token(token):
    """Verify JWT token and return user ID"""
    try:
        from utils.auth_helpers import verify_token as verify_jwt_token
        return verify_jwt_token(token)
    except Exception:
        return None 
