import bcrypt
from bson import ObjectId
from typing import Optional, Dict
from datetime import datetime
from scripts.database import get_collection
from utils.service_base import (
    DatabaseService,
    ServiceResult,
    ValidationException,
    NotFoundError,
    service_method,
    ValidationHelper,
    track_service_call,
)


class UserService(DatabaseService):
    def __init__(self):
        super().__init__("user_service", "users")
        self.users = self.collection  # Backward compatibility

    @track_service_call("create_user")
    def create_user(
        self,
        username: str,
        email: str,
        password: str,
        name: str,
        phone: str,
        whatsapp: str,
    ) -> Dict:
        """Create a new user (backward compatible)"""
        result = self._create_user_internal(
            username, email, password, name, phone, whatsapp
        )
        if result.success:
            return result.data
        else:
            # For backward compatibility, raise ValueError like the old method
            raise ValueError(result.error)

    @service_method
    def _create_user_internal(
        self,
        username: str,
        email: str,
        password: str,
        name: str,
        phone: str,
        whatsapp: str,
    ) -> ServiceResult:
        """Create a new user with username/password and required contact info"""

        # Validate required fields
        user_data = {
            "username": username,
            "email": email,
            "password": password,
            "name": name,
            "phone": phone,
            "whatsapp": whatsapp,
        }
        self._validate_required_fields(
            user_data, ["username", "email", "password", "name", "phone", "whatsapp"]
        )

        # Validate email format
        if not ValidationHelper.validate_email(email):
            raise ValidationException("Please enter a valid email address")

        # Validate phone numbers
        phone = ValidationHelper.sanitize_string(phone)
        whatsapp = ValidationHelper.sanitize_string(whatsapp)

        if not ValidationHelper.validate_phone(phone):
            raise ValidationException(
                "Please enter a valid phone number with country code (e.g., +1 234 567 8900)"
            )

        if not ValidationHelper.validate_phone(whatsapp):
            raise ValidationException(
                "Please enter a valid WhatsApp number with country code (e.g., +1 234 567 8900)"
            )

        # Check for existing username
        if self.users.find_one({"username": username}):
            raise ValidationException("Username already exists")

        # Check for existing email
        if self.users.find_one({"email": email.lower()}):
            raise ValidationException("Email address already exists")

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        user = {
            "username": username,
            "email": email.lower(),
            "name": ValidationHelper.sanitize_string(name, 100),
            "password": hashed_password.decode("utf-8"),
            "phone": phone,
            "whatsapp": whatsapp,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        result = self.users.insert_one(user)
        user["_id"] = result.inserted_id

        formatted_user = self._format_user(user)
        self.logger.info(f"User created successfully: {username}")
        return ServiceResult.ok(formatted_user)

    @track_service_call("authenticate_user")
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user with username and password (backward compatible)"""
        try:
            result = self._authenticate_user_internal(username, password)
            return result.data if result.success else None
        except Exception:
            return None

    @service_method
    def _authenticate_user_internal(
        self, username: str, password: str
    ) -> ServiceResult:
        """Internal authenticate method with new patterns"""
        if not username or not password:
            raise ValidationException("Username and password are required")

        user = self.users.find_one({"username": username})
        if not user:
            self.logger.warning(f"Authentication failed: User not found - {username}")
            raise ValidationException("Invalid username or password")

        if bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
            formatted_user = self._format_user(user)
            self.logger.info(f"User authenticated successfully: {username}")
            return ServiceResult.ok(formatted_user)
        else:
            self.logger.warning(f"Authentication failed: Invalid password - {username}")
            raise ValidationException("Invalid username or password")

    @track_service_call("get_user_by_id")
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID (backward compatible)"""
        try:
            result = self._get_user_by_id_internal(user_id)
            return result.data if result.success else None
        except Exception:
            return None

    @service_method
    def _get_user_by_id_internal(self, user_id: str) -> ServiceResult:
        """Internal get user method with new patterns"""
        user_id_obj = self._validate_object_id(user_id, "User ID")

        user = self.users.find_one({"_id": user_id_obj})
        if not user:
            raise NotFoundError("User not found")

        return ServiceResult.ok(self._format_user(user))

    def update_user(self, user_id: str, updates: Dict) -> Optional[Dict]:
        """Update user profile"""
        updates.pop("password", None)
        updates.pop("username", None)

        updates["updatedAt"] = datetime.utcnow()

        result = self.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})

        if result.modified_count > 0:
            return self.get_user_by_id(user_id)
        return None

    def delete_user_and_all_data(self, user_id: str) -> bool:
        """Delete user and all associated data (rides, roommates, interests, notifications)"""
        try:
            user_object_id = ObjectId(user_id)

            ride_posts = get_collection("ride_posts")
            ride_interests = get_collection("ride_interests")
            roommate_posts = get_collection("roommate_posts")
            roommate_interests = get_collection("roommate_interests")
            notifications = get_collection("notifications")

            ride_post_ids = [
                doc["_id"]
                for doc in ride_posts.find({"userId": user_object_id}, {"_id": 1})
            ]
            if ride_post_ids:
                ride_interests.delete_many({"rideId": {"$in": ride_post_ids}})
            ride_posts.delete_many({"userId": user_object_id})

            ride_interests.delete_many({"interestedUserId": user_object_id})

            rm_post_ids = [
                doc["_id"]
                for doc in roommate_posts.find({"userId": user_object_id}, {"_id": 1})
            ]
            if rm_post_ids:
                roommate_interests.delete_many({"postId": {"$in": rm_post_ids}})
            roommate_posts.delete_many({"userId": user_object_id})

            roommate_interests.delete_many({"interestedUserId": user_object_id})

            notifications.delete_many({"userId": user_object_id})

            notifications.delete_many({"triggeredBy": user_object_id})

            result = self.users.delete_one({"_id": user_object_id})

            return result.deleted_count > 0

        except Exception as e:
            print(f"Error deleting user data: {str(e)}")
            return False

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email address"""
        user = self.users.find_one({"email": email.lower()})
        return self._format_user(user) if user else None

    def store_password_reset_code(
        self, user_id: str, code: str, expiration: datetime
    ) -> bool:
        """Store password reset verification code"""
        try:
            result = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "passwordResetCode": code,
                        "passwordResetExpiration": expiration,
                        "updatedAt": datetime.utcnow(),
                    }
                },
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error storing password reset code: {str(e)}")
            return False

    def verify_password_reset_code(self, user_id: str, code: str) -> bool:
        """Verify password reset code and check expiration"""
        try:
            user = self.users.find_one(
                {
                    "_id": ObjectId(user_id),
                    "passwordResetCode": code,
                    "passwordResetExpiration": {"$gt": datetime.utcnow()},
                }
            )
            return user is not None
        except Exception as e:
            print(f"Error verifying password reset code: {str(e)}")
            return False

    def reset_password_with_code(
        self, user_id: str, code: str, new_password: str
    ) -> Dict:
        """Reset password after verifying code"""
        try:
            if not self.verify_password_reset_code(user_id, code):
                return {
                    "success": False,
                    "error": "Invalid or expired verification code",
                }

            user = self.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                return {"success": False, "error": "User not found"}

            if bcrypt.checkpw(
                new_password.encode("utf-8"), user["password"].encode("utf-8")
            ):
                return {
                    "success": False,
                    "error": "New password must be different from your current password",
                }

            hashed_password = bcrypt.hashpw(
                new_password.encode("utf-8"), bcrypt.gensalt()
            )

            result = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "password": hashed_password.decode("utf-8"),
                        "updatedAt": datetime.utcnow(),
                    },
                    "$unset": {"passwordResetCode": "", "passwordResetExpiration": ""},
                },
            )

            if result.modified_count > 0:
                return {"success": True}
            else:
                return {"success": False, "error": "Failed to update password"}

        except Exception as e:
            print(f"Error resetting password: {str(e)}")
            return {"success": False, "error": "Failed to reset password"}

    def _format_user(self, user: Dict) -> Dict:
        """Format user for API response"""
        if not user:
            return None

        # Use base class formatting for ObjectId and timestamps
        formatted = self._format_object_id(user)

        # Add user-specific formatting
        return {
            "_id": formatted["_id"],
            "username": formatted["username"],
            "email": formatted["email"],
            "name": formatted["name"],
            "phoneNumber": formatted.get("phone", ""),
            "whatsappNumber": formatted.get("whatsapp", ""),
            "createdAt": formatted["createdAt"],
            "updatedAt": formatted["updatedAt"],
        }


user_service = UserService()
