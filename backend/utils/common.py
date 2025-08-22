"""
Common utilities for reusable functionality across the application
"""

from functools import wraps
from flask import jsonify, request
from bson import ObjectId
from datetime import datetime
from typing import Dict, List, Any, Optional
from scripts.database import get_collection, format_object_id
from utils.auth_helpers import get_current_user_from_request


class ResponseFormatter:
    """Standardized response formatting utilities"""

    @staticmethod
    def success(data: Any = None, message: str = None, status_code: int = 200) -> tuple:
        """Format success response"""
        response = {}
        if message:
            response["message"] = message
        if data is not None:
            if isinstance(data, dict) and len(data) == 1:
                # If data is a single-key dict, use the key as the response key
                key, value = next(iter(data.items()))
                response[key] = value
            else:
                response.update(data) if isinstance(data, dict) else response.update(
                    {"data": data}
                )
        return jsonify(response), status_code

    @staticmethod
    def error(message: str, status_code: int = 400) -> tuple:
        """Format error response"""
        return jsonify({"error": message}), status_code

    @staticmethod
    def paginated_response(
        items: List[Any], total: int, page: int, per_page: int, items_key: str = "items"
    ) -> Dict[str, Any]:
        """Format paginated response"""
        return {
            items_key: items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }


class PaginationHelper:
    """Utilities for handling pagination"""

    @staticmethod
    def get_pagination_params(request_args) -> tuple:
        """Extract and validate pagination parameters from request"""
        page = int(request_args.get("page", 1))
        per_page = int(request_args.get("per_page", 10))

        # Ensure reasonable limits
        page = max(1, page)
        per_page = min(max(1, per_page), 100)  # Cap at 100 items per page

        return page, per_page

    @staticmethod
    def apply_pagination(items: List[Any], page: int, per_page: int) -> List[Any]:
        """Apply pagination to a list of items"""
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        return items[start_idx:end_idx]


class ValidationHelper:
    """Common validation utilities"""

    @staticmethod
    def validate_required_fields(
        data: Dict[str, Any], required_fields: List[str]
    ) -> Optional[str]:
        """Validate that all required fields are present"""
        if not data:
            return "Request body is required"

        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return f"Missing required fields: {', '.join(missing_fields)}"
        return None

    @staticmethod
    def validate_object_id(id_string: str) -> Optional[ObjectId]:
        """Validate and convert string to ObjectId"""
        try:
            return ObjectId(id_string)
        except Exception:
            return None


class InterestManager:
    """Common interest management operations for both rides and roommates"""

    def __init__(
        self,
        collection_name: str,
        interest_collection: str,
        id_field: str,
        user_id_field: str = "interestedUserId",
    ):
        self.collection_name = collection_name
        self.interest_collection = interest_collection
        self.id_field = id_field  # 'rideId' or 'postId'
        self.user_id_field = user_id_field

    def express_interest(
        self, item_id: ObjectId, user_id: str, notification_func=None
    ) -> tuple:
        """Express interest in an item"""
        try:
            # Get the item and verify it exists
            items_collection = get_collection(self.collection_name)

            # Build aggregation pipeline to get item with poster info
            pipeline = [
                {"$match": {"_id": item_id, "status": "active"}},
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "userId",
                        "foreignField": "_id",
                        "as": "poster",
                    }
                },
                {"$unwind": "$poster"},
            ]

            item_with_poster = list(items_collection.aggregate(pipeline))
            if not item_with_poster:
                return ResponseFormatter.error("Item not found", 404)

            item = item_with_poster[0]

            # Check if user is trying to express interest in their own item
            if str(item["userId"]) == str(user_id):
                return ResponseFormatter.error(
                    "You cannot express interest in your own item", 400
                )

            # Check if user has already expressed interest
            interests_collection = get_collection(self.interest_collection)
            existing_interest = interests_collection.find_one(
                {self.id_field: item_id, self.user_id_field: ObjectId(user_id)}
            )

            if existing_interest:
                return ResponseFormatter.error("Already expressed interest", 400)

            # Create interest record
            interest_data = {
                self.id_field: item_id,
                self.user_id_field: ObjectId(user_id),
                "status": "interested",
                "createdAt": datetime.utcnow(),
            }
            interests_collection.insert_one(interest_data)

            # Send notification if function provided
            if notification_func:
                try:
                    notification_func(item_id, user_id, item)
                except Exception as e:
                    print(f"Notification error: {e}")

            # Return success with poster info
            poster = item.get("poster", {})
            return ResponseFormatter.success(
                {
                    "message": "Interest expressed successfully",
                    "poster": {
                        "name": poster.get("name", ""),
                        "phoneNumber": poster.get("phone", ""),
                        "whatsappNumber": poster.get("whatsapp", ""),
                    },
                }
            )

        except Exception as e:
            return ResponseFormatter.error(f"Failed to express interest: {str(e)}", 400)

    def remove_interest(
        self, item_id: ObjectId, user_id: str, notification_func=None
    ) -> tuple:
        """Remove interest from an item"""
        try:
            # Verify item exists
            items_collection = get_collection(self.collection_name)
            item = items_collection.find_one({"_id": item_id})

            if not item:
                return ResponseFormatter.error("Item not found", 404)

            # Check if user has expressed interest
            interests_collection = get_collection(self.interest_collection)
            existing_interest = interests_collection.find_one(
                {
                    self.id_field: item_id,
                    self.user_id_field: ObjectId(user_id),
                    "status": "interested",
                }
            )

            if not existing_interest:
                return ResponseFormatter.error(
                    "You have not expressed interest in this item", 400
                )

            # Remove interest
            result = interests_collection.delete_one(
                {self.id_field: item_id, self.user_id_field: ObjectId(user_id)}
            )

            if result.deleted_count == 0:
                return ResponseFormatter.error("Failed to remove interest", 400)

            # Send notification if function provided
            if notification_func:
                try:
                    notification_func(item_id, user_id, item)
                except Exception as e:
                    print(f"Notification error: {e}")

            return ResponseFormatter.success(
                {"message": "Interest removed successfully"}
            )

        except Exception as e:
            return ResponseFormatter.error(f"Failed to remove interest: {str(e)}", 400)

    def get_interested_users(self, item_id: ObjectId, owner_user_id: str) -> tuple:
        """Get list of users interested in an item"""
        try:
            # Verify ownership
            items_collection = get_collection(self.collection_name)
            item = items_collection.find_one(
                {"_id": item_id, "userId": ObjectId(owner_user_id)}
            )

            if not item:
                return ResponseFormatter.error(
                    "Item not found or you do not own this item", 404
                )

            # Get interested users
            interests_collection = get_collection(self.interest_collection)
            pipeline = [
                {"$match": {self.id_field: item_id, "status": "interested"}},
                {
                    "$lookup": {
                        "from": "users",
                        "localField": self.user_id_field,
                        "foreignField": "_id",
                        "as": "user",
                    }
                },
                {"$unwind": "$user"},
                {
                    "$project": {
                        "_id": {"$toString": "$_id"},
                        "createdAt": 1,
                        "user": {
                            "_id": {"$toString": "$user._id"},
                            "name": "$user.name",
                            "username": "$user.username",
                            "email": "$user.email",
                            "phoneNumber": "$user.phone",
                            "whatsappNumber": "$user.whatsapp",
                        },
                    }
                },
                {"$sort": {"createdAt": -1}},
            ]

            interested_users = list(interests_collection.aggregate(pipeline))

            return ResponseFormatter.success(
                {
                    "interestedUsers": interested_users,
                    "totalCount": len(interested_users),
                }
            )

        except Exception as e:
            return ResponseFormatter.error(
                f"Failed to get interested users: {str(e)}", 400
            )


def require_auth(f):
    """Decorator to require authentication"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user_from_request(request)
        if not user:
            return ResponseFormatter.error("Unauthorized", 401)
        return f(user, *args, **kwargs)

    return decorated_function


def handle_exceptions(f):
    """Decorator to handle common exceptions"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            return ResponseFormatter.error(str(e), 400)
        except Exception as e:
            print(f"Unexpected error in {f.__name__}: {str(e)}")
            return ResponseFormatter.error(f"Operation failed: {str(e)}", 500)

    return decorated_function


class BaseCRUDManager:
    """Base class for common CRUD operations"""

    def __init__(self, collection_name: str, item_name: str):
        self.collection_name = collection_name
        self.item_name = item_name  # 'ride', 'listing', etc.

    def get_user_items(
        self,
        user_id: str,
        status_filter: str = "all",
        include_interest_count: bool = True,
        interest_collection: str = None,
        interest_id_field: str = None,
    ) -> tuple:
        """Get items owned by a user"""
        try:
            collection = get_collection(self.collection_name)

            # Build query
            query = {"userId": ObjectId(user_id)}
            if status_filter != "all":
                query["status"] = status_filter

            items = list(collection.find(query).sort("createdAt", -1))

            # Add interest counts if requested
            if include_interest_count and interest_collection and interest_id_field:
                items = self._add_interest_counts(
                    items, interest_collection, interest_id_field
                )

            formatted_items = [format_object_id(item) for item in items]

            # Use appropriate plural form based on item name
            if self.item_name == "listing":
                key = "listings"
            else:
                key = f"{self.item_name}s"

            return ResponseFormatter.success({key: formatted_items})

        except Exception as e:
            return ResponseFormatter.error(
                f"Failed to get {self.item_name}s: {str(e)}", 400
            )

    def get_item_by_id(
        self, item_id: ObjectId, user_id: str = None, get_details_func=None
    ) -> tuple:
        """Get a specific item by ID"""
        try:
            if get_details_func:
                item = get_details_func(item_id)
                # Ensure ObjectIds are formatted even when using detail functions
                if item:
                    item = format_object_id(item)
            else:
                collection = get_collection(self.collection_name)
                item = collection.find_one({"_id": item_id})
                if item:
                    item = format_object_id(item)

            if not item:
                return ResponseFormatter.error(
                    f"{self.item_name.title()} not found", 404
                )

            return ResponseFormatter.success(item)

        except Exception as e:
            return ResponseFormatter.error(
                f"Failed to get {self.item_name}: {str(e)}", 400
            )

    def update_item(
        self,
        item_id: ObjectId,
        user_id: str,
        update_data: Dict[str, Any],
        notification_func=None,
    ) -> tuple:
        """Update an item"""
        try:
            collection = get_collection(self.collection_name)

            # Add timestamp
            update_data["updatedAt"] = datetime.utcnow()

            # Update item
            result = collection.update_one(
                {"_id": item_id, "userId": ObjectId(user_id)}, {"$set": update_data}
            )

            if result.matched_count == 0:
                return ResponseFormatter.error(
                    f"{self.item_name.title()} not found or not owned by user", 404
                )

            # Get updated item
            updated_item = collection.find_one({"_id": item_id})

            # Send notification if function provided
            if notification_func:
                try:
                    notification_func(item_id, updated_item)
                except Exception as e:
                    print(f"Update notification error: {e}")

            # Use appropriate key based on item name
            item_key = "listing" if self.item_name == "listing" else self.item_name

            return ResponseFormatter.success(
                {
                    "message": f"{self.item_name.title()} updated successfully",
                    item_key: format_object_id(updated_item),
                }
            )

        except Exception as e:
            return ResponseFormatter.error(
                f"Failed to update {self.item_name}: {str(e)}", 400
            )

    def delete_item(
        self,
        item_id: ObjectId,
        user_id: str,
        related_collections: List[Dict[str, str]] = None,
        notification_func=None,
    ) -> tuple:
        """Delete an item and related data"""
        try:
            collection = get_collection(self.collection_name)

            # Verify ownership
            item = collection.find_one({"_id": item_id, "userId": ObjectId(user_id)})
            if not item:
                return ResponseFormatter.error(
                    f"{self.item_name.title()} not found or not owned by user", 404
                )

            # Send notification before deletion if function provided
            if notification_func:
                try:
                    notification_func(item_id, item)
                except Exception as e:
                    print(f"Deletion notification error: {e}")

            # Delete main item
            collection.delete_one({"_id": item_id})

            # Delete related data
            if related_collections:
                for rel_config in related_collections:
                    rel_collection = get_collection(rel_config["collection"])
                    rel_collection.delete_many({rel_config["field"]: item_id})

            return ResponseFormatter.success(
                {"message": f"{self.item_name.title()} deleted successfully"}
            )

        except Exception as e:
            return ResponseFormatter.error(
                f"Failed to delete {self.item_name}: {str(e)}", 400
            )

    def _add_interest_counts(
        self, items: List[Dict], interest_collection: str, interest_id_field: str
    ) -> List[Dict]:
        """Add interest counts to items"""
        if not items:
            return items

        try:
            item_ids = [item["_id"] for item in items]
            interests = get_collection(interest_collection)

            pipeline = [
                {
                    "$match": {
                        interest_id_field: {"$in": item_ids},
                        "status": "interested",
                    }
                },
                {"$group": {"_id": f"${interest_id_field}", "count": {"$sum": 1}}},
            ]

            counts = list(interests.aggregate(pipeline))
            counts_map = {str(c["_id"]): c["count"] for c in counts}

            for item in items:
                item["interestCount"] = counts_map.get(str(item["_id"]), 0)
        except Exception:
            # If count calculation fails, set all counts to 0
            for item in items:
                item["interestCount"] = 0

        return items
