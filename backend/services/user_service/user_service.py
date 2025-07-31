import bcrypt
from bson import ObjectId
from typing import Optional, Dict
from datetime import datetime
from scripts.database import get_collection

class UserService:
    def __init__(self):
        self.users = get_collection('users')
    
    def create_user(self, username: str, email: str, password: str, name: str) -> Dict:
        """Create a new user with username/password"""
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
            "phone": "",
            "whatsapp": "",
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
            "createdAt": user["createdAt"].isoformat(),
            "updatedAt": user["updatedAt"].isoformat()
        }

# Global instance
user_service = UserService() 