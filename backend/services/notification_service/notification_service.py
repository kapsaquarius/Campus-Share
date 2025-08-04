from datetime import datetime
from bson import ObjectId
import os
from dotenv import load_dotenv
from scripts.database import get_collection
from services.email_service.email_service import email_service, EmailTemplates

# Load environment variables
load_dotenv()

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
    
    # Create in-app notification
    notification_created = create_notification(
        user_id=ride_details['userId'],
        type='ride_interest',
        title='New Ride Interest',
        message=f"{interested_user['name']} is interested in your ride from {ride_details['startingFrom']} to {ride_details['goingTo']}",
        related_id=ride_id
    )
    
    # Send email notification
    if notification_created:
        try:
            # Get ride owner's email
            ride_owner = users.find_one({'_id': ObjectId(ride_details['userId'])})
            if ride_owner and ride_owner.get('email'):
                # Prepare ride details for email
                ride_email_details = {
                    'source': ride_details.get('startingFrom', ''),
                    'destination': ride_details.get('goingTo', ''),
                    'date': ride_details.get('travelDate', ''),
                    'time': f"{ride_details.get('departureStartTime', '')} - {ride_details.get('departureEndTime', '')}"
                }
                
                frontend_url = os.getenv('FRONTEND_URL')
                subject, html_content, text_content = EmailTemplates.ride_interest_notification(
                    interested_user['name'], 
                    ride_email_details,
                    frontend_url
                )
                email_service.send_email(
                    to_email=ride_owner['email'],
                    to_name=ride_owner['name'],
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content
                )
        except Exception as e:
            print(f"Error sending ride interest email: {e}")
    
    return notification_created

def create_ride_interest_removed_notification(ride_id, removed_user_id, ride_details):
    """Create notification when someone removes their interest from a ride"""
    users = get_collection('users')
    removed_user = users.find_one({'_id': ObjectId(removed_user_id)})
    
    # Create in-app notification
    notification_created = create_notification(
        user_id=ride_details['userId'],
        type='ride_interest_removed',
        title='Interest Removed',
        message=f"{removed_user['name']} is no longer interested in your ride from {ride_details['startingFrom']} to {ride_details['goingTo']}",
        related_id=ride_id
    )
    
    # Send email notification
    if notification_created:
        try:
            # Get ride owner's email
            ride_owner = users.find_one({'_id': ObjectId(ride_details['userId'])})
            if ride_owner and ride_owner.get('email'):
                # Prepare ride details for email
                ride_email_details = {
                    'source': ride_details.get('startingFrom', ''),
                    'destination': ride_details.get('goingTo', ''),
                    'date': ride_details.get('travelDate', ''),
                    'time': f"{ride_details.get('departureStartTime', '')} - {ride_details.get('departureEndTime', '')}"
                }
                
                frontend_url = os.getenv('FRONTEND_URL')
                subject, html_content, text_content = EmailTemplates.interest_removed_notification(
                    removed_user['name'], 
                    ride_email_details,
                    frontend_url
                )
                email_service.send_email(
                    to_email=ride_owner['email'],
                    to_name=ride_owner['name'],
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content
                )
        except Exception as e:
            print(f"Error sending interest removed email: {e}")
    
    return notification_created

def create_ride_update_notification(ride_id, ride_details):
    """Create notification for ride updates"""
    ride_interests = get_collection('ride_interests')
    interested_users = ride_interests.find({'rideId': ride_id})
    users = get_collection('users')
    
    notifications_created = 0
    for interest in interested_users:
        # Create in-app notification
        success = create_notification(
            user_id=interest['interestedUserId'],
            type='ride_update',
            title='Ride Updated',
            message=f"Your interested ride from {ride_details['startingFrom']} to {ride_details['goingTo']} has been updated",
            related_id=ride_id
        )
        
        if success:
            notifications_created += 1
            
            # Send email notification
            try:
                interested_user = users.find_one({'_id': ObjectId(interest['interestedUserId'])})
                if interested_user and interested_user.get('email'):
                    # Prepare ride details for email
                    ride_email_details = {
                        'source': ride_details.get('startingFrom', ''),
                        'destination': ride_details.get('goingTo', ''),
                        'date': ride_details.get('travelDate', ''),
                        'time': f"{ride_details.get('departureStartTime', '')} - {ride_details.get('departureEndTime', '')}"
                    }
                    
                    # For ride updates, we need to determine which fields were updated
                    updated_fields = ['ride details']  # Generic for now - could be more specific
                    
                    frontend_url = os.getenv('FRONTEND_URL')
                    subject, html_content, text_content = EmailTemplates.ride_updated_notification(
                        interested_user['name'], 
                        ride_email_details,
                        updated_fields,
                        frontend_url
                    )
                    email_service.send_email(
                        to_email=interested_user['email'],
                        to_name=interested_user['name'],
                        subject=subject,
                        html_content=html_content,
                        text_content=text_content
                    )
            except Exception as e:
                print(f"Error sending ride update email to {interest['interestedUserId']}: {e}")
    
    return notifications_created

def create_ride_cancellation_notifications(ride_id, ride_details):
    """Create notifications for ride cancellation"""
    ride_interests = get_collection('ride_interests')
    interested_users = ride_interests.find({'rideId': ride_id})
    users = get_collection('users')
    
    notifications_created = 0
    for interest in interested_users:
        # Create in-app notification
        success = create_notification(
            user_id=interest['interestedUserId'],
            type='ride_cancelled',
            title='Ride Cancelled',
            message=f"Your interested ride from {ride_details['startingFrom']} to {ride_details['goingTo']} has been cancelled",
            related_id=ride_id
        )
        
        if success:
            notifications_created += 1
            
            # Send email notification
            try:
                interested_user = users.find_one({'_id': ObjectId(interest['interestedUserId'])})
                if interested_user and interested_user.get('email'):
                    # Prepare ride details for email
                    ride_email_details = {
                        'source': ride_details.get('startingFrom', ''),
                        'destination': ride_details.get('goingTo', ''),
                        'date': ride_details.get('travelDate', ''),
                        'time': f"{ride_details.get('departureStartTime', '')} - {ride_details.get('departureEndTime', '')}"
                    }
                    
                    frontend_url = os.getenv('FRONTEND_URL')
                    subject, html_content, text_content = EmailTemplates.ride_cancelled_notification(
                        interested_user['name'], 
                        ride_email_details,
                        frontend_url
                    )
                    email_service.send_email(
                        to_email=interested_user['email'],
                        to_name=interested_user['name'],
                        subject=subject,
                        html_content=html_content,
                        text_content=text_content
                    )
            except Exception as e:
                print(f"Error sending ride cancellation email to {interest['interestedUserId']}: {e}")
    
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