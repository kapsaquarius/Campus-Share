import bcrypt
from bson import ObjectId
from typing import Optional, Dict
from datetime import datetime
from scripts.database import get_collection

class UserService:
    def __init__(self):
        self.users = get_collection('users')
    
    def create_user(self, username: str, email: str, password: str, name: str, phone: str, whatsapp: str) -> Dict:
        """Create a new user with username/password and required contact info"""
        # Validate required fields
        if not phone or not phone.strip():
            raise ValueError("Phone number is required")
        
        if not whatsapp or not whatsapp.strip():
            raise ValueError("WhatsApp number is required")
        
        # Enhanced phone number validation for international format
        import re
        # Must start with + followed by country code and number
        phone_pattern = r'^\+[\d\s\-\(\)]{7,}$'
        
        if not re.match(phone_pattern, phone.strip()):
            raise ValueError("Please enter a valid phone number with country code (e.g., +1 234 567 8900)")
        
        if not re.match(phone_pattern, whatsapp.strip()):
            raise ValueError("Please enter a valid WhatsApp number with country code (e.g., +1 234 567 8900)")
        
        # Check minimum digits count
        phone_digits = re.sub(r'[^\d]', '', phone)
        whatsapp_digits = re.sub(r'[^\d]', '', whatsapp)
        
        if len(phone_digits) < 7:
            raise ValueError("Phone number is too short")
            
        if len(whatsapp_digits) < 7:
            raise ValueError("WhatsApp number is too short")
        
        # Check if username already exists
        if self.users.find_one({"username": username}):
            raise ValueError("Username already exists")
        

        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user = {
            "username": username,
            "email": email,
            "name": name,
            "password": hashed_password.decode('utf-8'),
            "phone": phone.strip(),
            "whatsapp": whatsapp.strip(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = self.users.insert_one(user)
        user['_id'] = result.inserted_id
        return self._format_user(user)
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user with username and password"""
        user = self.users.find_one({"username": username})
        if not user:
            return None
        
        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return self._format_user(user)
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        user = self.users.find_one({"_id": ObjectId(user_id)})
        return self._format_user(user) if user else None
    
    def update_user(self, user_id: str, updates: Dict) -> Optional[Dict]:
        """Update user profile"""
        # Remove sensitive fields from updates
        updates.pop('password', None)
        updates.pop('username', None)
        
        updates['updatedAt'] = datetime.utcnow()
        
        result = self.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": updates}
        )
        
        if result.modified_count > 0:
            return self.get_user_by_id(user_id)
        return None
    
    def delete_user_and_all_data(self, user_id: str) -> bool:
        """Delete user and all associated data (rides, interests, notifications)"""
        try:
            user_object_id = ObjectId(user_id)
            
            # Get references to all collections
            ride_posts = get_collection('ride_posts')
            ride_interests = get_collection('ride_interests')
            notifications = get_collection('notifications')
            
            # Delete all ride posts created by this user
            ride_posts.delete_many({"userId": user_object_id})
            
            # Delete all ride interests by this user
            ride_interests.delete_many({"userId": user_object_id})
            
            # Delete all notifications for this user
            notifications.delete_many({"userId": user_object_id})
            
            # Delete all notifications created because of this user's actions
            notifications.delete_many({"triggeredBy": user_object_id})
            
            # Finally, delete the user account
            result = self.users.delete_one({"_id": user_object_id})
            
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"Error deleting user data: {str(e)}")
            return False
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email address"""
        user = self.users.find_one({"email": email.lower()})
        return self._format_user(user) if user else None
    
    def store_password_reset_code(self, user_id: str, code: str, expiration: datetime) -> bool:
        """Store password reset verification code"""
        try:
            result = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "passwordResetCode": code,
                    "passwordResetExpiration": expiration,
                    "updatedAt": datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error storing password reset code: {str(e)}")
            return False
    
    def verify_password_reset_code(self, user_id: str, code: str) -> bool:
        """Verify password reset code and check expiration"""
        try:
            user = self.users.find_one({
                "_id": ObjectId(user_id),
                "passwordResetCode": code,
                "passwordResetExpiration": {"$gt": datetime.utcnow()}
            })
            return user is not None
        except Exception as e:
            print(f"Error verifying password reset code: {str(e)}")
            return False
    
    def reset_password_with_code(self, user_id: str, code: str, new_password: str) -> Dict:
        """Reset password after verifying code"""
        try:
            # First verify the code is still valid
            if not self.verify_password_reset_code(user_id, code):
                return {"success": False, "error": "Invalid or expired verification code"}
            
            # Get current user to check existing password
            user = self.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                return {"success": False, "error": "User not found"}
            
            # Check if new password is same as current password
            if bcrypt.checkpw(new_password.encode('utf-8'), user['password'].encode('utf-8')):
                return {"success": False, "error": "New password must be different from your current password"}
            
            # Hash the new password
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
            
            # Update password and clear reset code
            result = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "password": hashed_password.decode('utf-8'),
                    "updatedAt": datetime.utcnow()
                },
                "$unset": {
                    "passwordResetCode": "",
                    "passwordResetExpiration": ""
                }}
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
        
        return {
            "_id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "name": user["name"],
            "phoneNumber": user.get("phone", ""),
            "whatsappNumber": user.get("whatsapp", ""),
            "createdAt": user["createdAt"].isoformat() + 'Z',
            "updatedAt": user["updatedAt"].isoformat() + 'Z'
        }

# Global instance
user_service = UserService() 