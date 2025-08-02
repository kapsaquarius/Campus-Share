from datetime import datetime
from bson import ObjectId
from scripts.database import get_collection

def create_notification(user_id, type, title, message, related_id=None):
    """Create a new notification"""
    try:
        notifications = get_collection('notifications')
        
        notification_data = {
            'userId': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'type': type,
            'title': title,
            'message': message,
            'relatedId': ObjectId(related_id) if related_id else None,
            'read': False,
            'createdAt': datetime.utcnow()
        }
        
        notifications.insert_one(notification_data)
        return True
    except Exception as e:
        print(f"Error creating notification: {e}")
        return False

def create_ride_interest_notification(ride_id, interested_user_id, ride_details):
    """Create notification for ride interest"""
    users = get_collection('users')
    interested_user = users.find_one({'_id': ObjectId(interested_user_id)})
    
    return create_notification(
        user_id=ride_details['userId'],
        type='ride_interest',
        title='New Ride Interest',
        message=f"{interested_user['name']} is interested in your ride from {ride_details['startingFrom']} to {ride_details['goingTo']}",
        related_id=ride_id
    )

def create_ride_interest_removed_notification(ride_id, removed_user_id, ride_details):
    """Create notification when someone removes their interest from a ride"""
    users = get_collection('users')
    removed_user = users.find_one({'_id': ObjectId(removed_user_id)})
    
    return create_notification(
        user_id=ride_details['userId'],
        type='ride_interest_removed',
        title='Interest Removed',
        message=f"{removed_user['name']} is no longer interested in your ride from {ride_details['startingFrom']} to {ride_details['goingTo']}",
        related_id=ride_id
    )

def create_ride_update_notification(ride_id, ride_details):
    """Create notification for ride updates"""
    ride_interests = get_collection('ride_interests')
    interested_users = ride_interests.find({'rideId': ride_id})
    
    notifications_created = 0
    for interest in interested_users:
        success = create_notification(
            user_id=interest['interestedUserId'],
            type='ride_update',
            title='Ride Updated',
            message=f"Your interested ride from {ride_details['startingFrom']} to {ride_details['goingTo']} has been updated",
            related_id=ride_id
        )
        if success:
            notifications_created += 1
    
    return notifications_created

def create_ride_cancellation_notifications(ride_id, ride_details):
    """Create notifications for ride cancellation"""
    ride_interests = get_collection('ride_interests')
    interested_users = ride_interests.find({'rideId': ride_id})
    
    notifications_created = 0
    for interest in interested_users:
        success = create_notification(
            user_id=interest['interestedUserId'],
            type='ride_cancelled',
            title='Ride Cancelled',
            message=f"Your interested ride from {ride_details['startingFrom']} to {ride_details['goingTo']} has been cancelled",
            related_id=ride_id
        )
        if success:
            notifications_created += 1
    
    return notifications_created

def get_user_notifications(user_id, page=1, per_page=20, unread_only=False):
    """Get paginated notifications for a user"""
    notifications = get_collection('notifications')
    
    # Build query
    query = {'userId': ObjectId(user_id)}
    if unread_only:
        query['read'] = False
    
    # Get total count
    total_count = notifications.count_documents(query)
    
    # Get paginated notifications
    skip = (page - 1) * per_page
    user_notifications = list(
        notifications.find(query)
        .sort('createdAt', -1)
        .skip(skip)
        .limit(per_page)
    )
    
    return user_notifications, total_count

def get_unread_count(user_id):
    """Get count of unread notifications for a user"""
    notifications = get_collection('notifications')
    return notifications.count_documents({
        'userId': ObjectId(user_id),
        'read': False
    })

def mark_notification_as_read(notification_id, user_id):
    """Mark a specific notification as read"""
    notifications = get_collection('notifications')
    
    result = notifications.update_one(
        {
            '_id': ObjectId(notification_id),
            'userId': ObjectId(user_id)
        },
        {'$set': {'read': True}}
    )
    
    return result.modified_count > 0

def mark_all_notifications_as_read(user_id):
    """Mark all user's unread notifications as read"""
    notifications = get_collection('notifications')
    
    result = notifications.update_many(
        {
            'userId': ObjectId(user_id),
            'read': False
        },
        {'$set': {'read': True}}
    )
    
    return result.modified_count

def delete_notification(notification_id, user_id):
    """Delete a notification"""
    notifications = get_collection('notifications')
    
    result = notifications.delete_one({
        '_id': ObjectId(notification_id),
        'userId': ObjectId(user_id)
    })
    
    return result.deleted_count > 0 