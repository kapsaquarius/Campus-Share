from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from scripts.database import get_collection, format_object_id, format_object_ids_list
from routes.auth import get_current_user
from services.notification_service import (
    get_user_notifications, get_unread_count, mark_notification_as_read,
    mark_all_notifications_as_read, delete_notification
)

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
def get_notifications():
    """Get current user's notifications"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Use the service layer
        user_notifications, total_count = get_user_notifications(
            user['_id'], page, per_page, unread_only
        )
        
        formatted_notifications = format_object_ids_list(user_notifications)
        
        return jsonify({
            'notifications': formatted_notifications,
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get notifications: {str(e)}'}), 400

@notifications_bp.route('/unread-count', methods=['GET'])
def get_unread_count():
    """Get count of unread notifications"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        unread_count = get_unread_count(user['_id'])
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
        notification_id = request.view_args['notification_id']
        
        success = mark_notification_as_read(notification_id, user['_id'])
        
        if not success:
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
        modified_count = mark_all_notifications_as_read(user['_id'])
        
        return jsonify({
            'message': f'Marked {modified_count} notifications as read'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to mark notifications as read: {str(e)}'}), 400

@notifications_bp.route('/<notification_id>', methods=['DELETE'])
def delete_notification():
    """Delete a notification"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        notification_id = request.view_args['notification_id']
        
        success = delete_notification(notification_id, user['_id'])
        
        if not success:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify({'message': 'Notification deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete notification: {str(e)}'}), 400 