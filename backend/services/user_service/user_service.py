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
        
        # Check if email already exists
        if self.users.find_one({"email": email}):
            raise ValueError("Email already exists")
        
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
        updates.pop('email', None)
        
        updates['updatedAt'] = datetime.utcnow()
        
        result = self.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": updates}
        )
        
        if result.modified_count > 0:
            return self.get_user_by_id(user_id)
        return None
    
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