from flask import Blueprint
from bson import ObjectId
from scripts.database import get_collection
from utils.common import (
    ResponseFormatter,
    ValidationHelper,
    require_auth,
    handle_exceptions,
)

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/", methods=["GET"])
@require_auth
@handle_exceptions
def get_notifications(user):
    """Get all notifications for the current user"""
    notifications = get_collection("notifications")
    user_notifications = list(
        notifications.find({"userId": ObjectId(user["_id"])}).sort("createdAt", -1)
    )

    formatted_notifications = []
    for notif in user_notifications:
        formatted_notif = {
            "_id": str(notif["_id"]),
            "type": notif["type"],
            "title": notif["title"],
            "message": notif["message"],
            "read": notif.get("read", False),
            "createdAt": notif["createdAt"].isoformat() + "Z"
            if hasattr(notif["createdAt"], "isoformat")
            else str(notif["createdAt"]),
            "relatedId": str(notif["relatedId"]) if notif.get("relatedId") else None,
        }
        formatted_notifications.append(formatted_notif)

    return ResponseFormatter.success({"notifications": formatted_notifications})


@notifications_bp.route("/unread-count", methods=["GET"])
@require_auth
@handle_exceptions
def get_unread_count(user):
    """Get count of unread notifications"""
    notifications = get_collection("notifications")
    unread_count = notifications.count_documents(
        {"userId": ObjectId(user["_id"]), "read": False}
    )

    return ResponseFormatter.success({"unreadCount": unread_count})


@notifications_bp.route("/<notification_id>/read", methods=["PUT"])
@require_auth
@handle_exceptions
def mark_as_read(user, notification_id):
    """Mark a notification as read"""
    notification_id_obj = ValidationHelper.validate_object_id(notification_id)
    if not notification_id_obj:
        return ResponseFormatter.error("Invalid notification ID", 400)

    notifications = get_collection("notifications")

    result = notifications.update_one(
        {"_id": notification_id_obj, "userId": ObjectId(user["_id"])},
        {"$set": {"read": True}},
    )

    if result.matched_count == 0:
        return ResponseFormatter.error("Notification not found", 404)

    return ResponseFormatter.success({"message": "Notification marked as read"})


@notifications_bp.route("/mark-all-read", methods=["PUT"])
@require_auth
@handle_exceptions
def mark_all_as_read(user):
    """Mark all notifications as read"""
    notifications = get_collection("notifications")

    result = notifications.update_many(
        {"userId": ObjectId(user["_id"]), "read": False}, {"$set": {"read": True}}
    )

    return ResponseFormatter.success(
        {"message": f"Marked {result.modified_count} notifications as read"}
    )
