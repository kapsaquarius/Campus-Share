from flask import Blueprint, request
from datetime import datetime, timedelta
import random
import string
from services.user_service.user_service import user_service
from services.email_service.email_service import EmailService
from utils.auth_helpers import create_jwt_token
from utils.common import (
    ResponseFormatter,
    ValidationHelper,
    handle_exceptions,
    require_auth,
)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
@handle_exceptions
def register():
    """Register a new user"""
    data = request.get_json()

    required_fields = ["username", "email", "password", "name", "phone", "whatsapp"]
    validation_error = ValidationHelper.validate_required_fields(data, required_fields)
    if validation_error:
        return ResponseFormatter.error(validation_error, 400)

    user = user_service.create_user(
        username=data["username"],
        email=data["email"],
        password=data["password"],
        name=data["name"],
        phone=data["phone"],
        whatsapp=data["whatsapp"],
    )

    token = create_jwt_token(user["_id"], expires_in_minutes=30)

    return ResponseFormatter.success(
        {"message": "User registered successfully", "user": user, "token": token},
        status_code=201,
    )


@auth_bp.route("/login", methods=["POST"])
@handle_exceptions
def login():
    """Login with username and password"""
    data = request.get_json()

    required_fields = ["username", "password"]
    validation_error = ValidationHelper.validate_required_fields(data, required_fields)
    if validation_error:
        return ResponseFormatter.error(validation_error, 400)

    user = user_service.authenticate_user(data["username"], data["password"])

    if not user:
        return ResponseFormatter.error("Invalid username or password", 401)

    token = create_jwt_token(user["_id"], expires_in_minutes=30)

    return ResponseFormatter.success(
        {"message": "Login successful", "user": user, "token": token}
    )


@auth_bp.route("/profile", methods=["GET"])
@require_auth
@handle_exceptions
def get_profile(user):
    """Get current user profile"""
    return ResponseFormatter.success({"user": user})


@auth_bp.route("/profile", methods=["PUT"])
@require_auth
@handle_exceptions
def update_profile(user):
    """Update current user profile"""

    data = request.get_json()
    if not data:
        return ResponseFormatter.error("Request body is required", 400)

    allowed_updates = ["name", "phone", "whatsapp", "email"]

    updates = {}
    for field in allowed_updates:
        if field in data:
            updates[field] = data[field]

    # Handle alternative field names for compatibility
    if "phoneNumber" in data:
        updates["phone"] = data["phoneNumber"]
    if "whatsappNumber" in data:
        updates["whatsapp"] = data["whatsappNumber"]

    if not updates:
        return ResponseFormatter.error("No valid fields to update", 400)

    updated_user = user_service.update_user(user["_id"], updates)

    if updated_user:
        return ResponseFormatter.success(
            {"message": "Profile updated successfully", "user": updated_user}
        )
    else:
        return ResponseFormatter.error("Failed to update profile", 500)


@auth_bp.route("/delete-account", methods=["DELETE"])
@require_auth
@handle_exceptions
def delete_account(user):
    """Delete current user account and all associated data"""

    user_id = user["_id"]

    success = user_service.delete_user_and_all_data(user_id)

    if success:
        return ResponseFormatter.success(
            {"message": "Account and all associated data deleted successfully"}
        )
    else:
        return ResponseFormatter.error("Failed to delete account", 500)


@auth_bp.route("/forgot-password", methods=["POST"])
@handle_exceptions
def forgot_password():
    """Send password reset verification code to email"""
    data = request.get_json()

    required_fields = ["email"]
    validation_error = ValidationHelper.validate_required_fields(data, required_fields)
    if validation_error:
        return ResponseFormatter.error(validation_error, 400)

    email = data.get("email", "").strip().lower()

    user = user_service.get_user_by_email(email)
    if not user:
        return ResponseFormatter.error(
            "The email address you entered does not exist.", 404
        )

    verification_code = "".join(random.choices(string.digits, k=6))

    expiration = datetime.utcnow() + timedelta(minutes=10)
    user_service.store_password_reset_code(user["_id"], verification_code, expiration)

    email_service = EmailService()
    subject = "CampusShare - Password Reset Code"
    html_content = f"""
    <html>
    <body>
        <h2>Password Reset Request</h2>
        <p>Hello {user["name"]},</p>
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
        to_email=email, to_name=user["name"], subject=subject, html_content=html_content
    )

    if email_sent:
        return ResponseFormatter.success(
            {
                "message": "A verification code has been sent to your email.",
                "email": email,
            }
        )
    else:
        return ResponseFormatter.error("Failed to send verification code", 500)


@auth_bp.route("/verify-reset-code", methods=["POST"])
@handle_exceptions
def verify_reset_code():
    """Verify password reset code"""
    data = request.get_json()

    required_fields = ["email", "code"]
    validation_error = ValidationHelper.validate_required_fields(data, required_fields)
    if validation_error:
        return ResponseFormatter.error(validation_error, 400)

    email = data.get("email", "").strip().lower()
    code = data.get("code", "").strip()

    user = user_service.get_user_by_email(email)
    if not user:
        return ResponseFormatter.error("Invalid request", 400)

    is_valid = user_service.verify_password_reset_code(user["_id"], code)

    if is_valid:
        return ResponseFormatter.success(
            {"message": "Code verified! Please set your new password.", "email": email}
        )
    else:
        return ResponseFormatter.error(
            "The verification code is invalid or has expired. Please try again.", 400
        )


@auth_bp.route("/reset-password", methods=["POST"])
@handle_exceptions
def reset_password():
    """Reset password with verified code"""
    data = request.get_json()

    required_fields = ["email", "code", "newPassword"]
    validation_error = ValidationHelper.validate_required_fields(data, required_fields)
    if validation_error:
        return ResponseFormatter.error(validation_error, 400)

    email = data.get("email", "").strip().lower()
    code = data.get("code", "").strip()
    new_password = data.get("newPassword", "")

    if len(new_password) < 6:
        return ResponseFormatter.error(
            "Password must be at least 6 characters long", 400
        )

    user = user_service.get_user_by_email(email)
    if not user:
        return ResponseFormatter.error("Invalid request", 400)

    result = user_service.reset_password_with_code(user["_id"], code, new_password)

    if result["success"]:
        return ResponseFormatter.success(
            {
                "message": "Your password has been successfully updated. You can now log in with your new password."
            }
        )
    else:
        # Handle specific error cases
        if (
            result["error"]
            == "New password must be different from your current password"
        ):
            return ResponseFormatter.error(result["error"], 400)
        else:
            return ResponseFormatter.error(
                "The verification code is invalid or has expired. Please try again.",
                400,
            )


@auth_bp.route("/check-email", methods=["POST"])
@handle_exceptions
def check_email():
    """Check if email already exists in database"""
    data = request.get_json()

    required_fields = ["email"]
    validation_error = ValidationHelper.validate_required_fields(data, required_fields)
    if validation_error:
        return ResponseFormatter.error(validation_error, 400)

    email = data.get("email", "").strip().lower()

    user = user_service.get_user_by_email(email)

    return ResponseFormatter.success({"exists": user is not None, "email": email})
