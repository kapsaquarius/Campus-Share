from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from scripts.database import get_collection, format_object_id, format_object_id_list
from routes.auth import get_current_user

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
def get_notifications():
    """Get all notifications for the current user"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        notifications = get_collection('notifications')
        user_notifications = list(notifications.find({'userId': ObjectId(user['_id'])}).sort('createdAt', -1))
        
        # Format notifications manually to handle ObjectId serialization
        formatted_notifications = []
        for notif in user_notifications:
            formatted_notif = {
                '_id': str(notif['_id']),
                'type': notif['type'],
                'title': notif['title'], 
                'message': notif['message'],
                'read': notif.get('read', False),
                'createdAt': notif['createdAt'].isoformat() if hasattr(notif['createdAt'], 'isoformat') else str(notif['createdAt']),
                'relatedId': str(notif['relatedId']) if notif.get('relatedId') else None
            }
            formatted_notifications.append(formatted_notif)
        
        return jsonify({'notifications': formatted_notifications}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get notifications: {str(e)}'}), 400

@notifications_bp.route('/unread-count', methods=['GET'])
def get_unread_count():
    """Get count of unread notifications"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        notifications = get_collection('notifications')
        unread_count = notifications.count_documents({
            'userId': ObjectId(user['_id']),
            'read': False
        })
        
        return jsonify({'unreadCount': unread_count}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get unread count: {str(e)}'}), 400

@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
def mark_as_read(notification_id):
    """Mark a notification as read"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        notification_id = ObjectId(notification_id)
        notifications = get_collection('notifications')
        
        result = notifications.update_one(
            {'_id': notification_id, 'userId': ObjectId(user['_id'])},
            {'$set': {'read': True}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to mark notification as read: {str(e)}'}), 400

@notifications_bp.route('/mark-all-read', methods=['PUT'])
def mark_all_as_read():
    """Mark all notifications as read"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        notifications = get_collection('notifications')
        
        result = notifications.update_many(
            {'userId': ObjectId(user['_id']), 'read': False},
            {'$set': {'read': True}}
        )
        
        return jsonify({'message': f'Marked {result.modified_count} notifications as read'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to mark notifications as read: {str(e)}'}), 400

# Delete notification endpoint removed - notifications are hidden when read 