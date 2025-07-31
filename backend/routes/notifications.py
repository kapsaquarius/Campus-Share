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
        
        formatted_notifications = format_object_id_list(user_notifications)
        
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
def mark_as_read():
    """Mark a notification as read"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        notification_id = ObjectId(request.view_args['notification_id'])
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

@notifications_bp.route('/<notification_id>', methods=['DELETE'])
def delete_notification():
    """Delete a notification"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        notification_id = ObjectId(request.view_args['notification_id'])
        notifications = get_collection('notifications')
        
        result = notifications.delete_one({
            '_id': notification_id,
            'userId': ObjectId(user['_id'])
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify({'message': 'Notification deleted'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete notification: {str(e)}'}), 400 