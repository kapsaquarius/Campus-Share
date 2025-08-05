from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import random
import string
from bson import ObjectId
from services.user_service.user_service import user_service
from services.email_service.email_service import EmailService
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

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset verification code to email"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        # Check if user exists
        user = user_service.get_user_by_email(email)
        if not user:
            return jsonify({"error": "The email address you entered does not exist."}), 404
        
        # Generate 6-digit verification code
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        # Store verification code with expiration (10 minutes)
        expiration = datetime.utcnow() + timedelta(minutes=10)
        user_service.store_password_reset_code(user['_id'], verification_code, expiration)
        
        # Send email with verification code
        email_service = EmailService()
        subject = "CampusShare - Password Reset Code"
        html_content = f"""
        <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>Hello {user['name']},</p>
            <p>You have requested to reset your password for your CampusShare account.</p>
            <p>Your verification code is: <strong style="font-size: 24px; color: #2563eb;">{verification_code}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The CampusShare Team</p>
        </body>
        </html>
        """
        
        email_sent = email_service.send_email(
            to_email=email,
            to_name=user['name'],
            subject=subject,
            html_content=html_content
        )
        
        if email_sent:
            return jsonify({
                "message": "A verification code has been sent to your email.",
                "email": email
            }), 200
        else:
            return jsonify({"error": "Failed to send verification code"}), 500
            
    except Exception as e:
        print(f"Forgot password error: {str(e)}")
        return jsonify({"error": "Failed to process password reset request"}), 500

@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """Verify password reset code"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        code = data.get('code', '').strip()
        
        if not email or not code:
            return jsonify({"error": "Email and verification code are required"}), 400
        
        # Get user by email
        user = user_service.get_user_by_email(email)
        if not user:
            return jsonify({"error": "Invalid request"}), 400
        
        # Verify the code
        is_valid = user_service.verify_password_reset_code(user['_id'], code)
        
        if is_valid:
            return jsonify({
                "message": "Code verified! Please set your new password.",
                "email": email
            }), 200
        else:
            return jsonify({"error": "The verification code is invalid or has expired. Please try again."}), 400
            
    except Exception as e:
        print(f"Verify reset code error: {str(e)}")
        return jsonify({"error": "Failed to verify code"}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with verified code"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        code = data.get('code', '').strip()
        new_password = data.get('newPassword', '')
        
        if not email or not code or not new_password:
            return jsonify({"error": "Email, verification code, and new password are required"}), 400
        
        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
        # Get user by email
        user = user_service.get_user_by_email(email)
        if not user:
            return jsonify({"error": "Invalid request"}), 400
        
        # Verify the code one more time and reset password
        result = user_service.reset_password_with_code(user['_id'], code, new_password)
        
        if result["success"]:
            return jsonify({
                "message": "Your password has been successfully updated. You can now log in with your new password."
            }), 200
        else:
            # Return specific error message
            if result["error"] == "New password must be different from your current password":
                return jsonify({"error": result["error"]}), 400
            else:
                return jsonify({"error": "The verification code is invalid or has expired. Please try again."}), 400
            
    except Exception as e:
        print(f"Reset password error: {str(e)}")
        return jsonify({"error": "Failed to reset password"}), 500

@auth_bp.route('/check-email', methods=['POST'])
def check_email():
    """Check if email already exists in database"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        # Check if email exists
        user = user_service.get_user_by_email(email)
        
        return jsonify({
            "exists": user is not None,
            "email": email
        }), 200
        
    except Exception as e:
        print(f"Check email error: {str(e)}")
        return jsonify({"error": "Failed to check email"}), 500

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