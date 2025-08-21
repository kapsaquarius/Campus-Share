from datetime import datetime
import threading
from bson import ObjectId
import os
from dotenv import load_dotenv
from scripts.database import get_collection
from services.email_service.email_service import email_service, EmailTemplates
from utils.service_base import (
    DatabaseService,
    ServiceResult,
    ValidationException,
    service_method,
    ValidationHelper,
    track_service_call,
)

# Load environment variables
load_dotenv()


class NotificationService(DatabaseService):
    """Service for managing notifications"""

    def __init__(self):
        super().__init__("notification_service", "notifications")

    @service_method
    @track_service_call("create_notification")
    def create_notification(
        self, user_id, notification_type, title, message, related_id=None
    ) -> ServiceResult:
        """Create a new notification"""
        # Validate inputs
        if not user_id or not notification_type or not title or not message:
            raise ValidationException("user_id, type, title, and message are required")

        # Convert user_id to ObjectId if needed
        user_id_obj = (
            self._validate_object_id(user_id, "User ID")
            if isinstance(user_id, str)
            else user_id
        )
        related_id_obj = (
            self._validate_object_id(related_id, "Related ID") if related_id else None
        )

        notification_data = {
            "userId": user_id_obj,
            "type": ValidationHelper.sanitize_string(notification_type, 50),
            "title": ValidationHelper.sanitize_string(title, 200),
            "message": ValidationHelper.sanitize_string(message, 1000),
            "relatedId": related_id_obj,
            "read": False,
            "createdAt": datetime.utcnow(),
        }

        result = self.collection.insert_one(notification_data)
        notification_data["_id"] = result.inserted_id

        self.logger.info(f"Notification created for user {user_id}: {title}")
        return ServiceResult.ok(self._format_object_id(notification_data))


# Create global instance for backward compatibility
notification_service = NotificationService()


def create_notification(user_id, type, title, message, related_id=None):
    """Backward compatible function wrapper"""
    result = notification_service.create_notification(
        user_id, type, title, message, related_id
    )
    return result.success


# -----------------------------
# Internal helpers (no API change)
# -----------------------------


def _run_in_background(func):
    """Run a callable in a daemon thread; fallback to inline if threading fails."""
    try:
        threading.Thread(target=func, daemon=True).start()
    except Exception:
        func()


def _send_email_safe(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str,
    text_content: str | None = None,
):
    """Send email and swallow exceptions to avoid breaking request flow."""
    try:
        email_service.send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")


def _send_bulk_emails_async(recipients: list[dict], build_content):
    """Send a batch of templated emails asynchronously in one background task.

    recipients: list of { 'email': str, 'name': str }
    build_content: callable(recipient_dict) -> (subject, html_content, text_content)
    """
    if not recipients:
        return

    def _job():
        for recipient in recipients:
            try:
                subject, html_content, text_content = build_content(recipient)
                _send_email_safe(
                    to_email=recipient.get("email", ""),
                    to_name=recipient.get("name", ""),
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content,
                )
            except Exception as e:
                print(
                    f"Error preparing/sending email to {recipient.get('email', '')}: {e}"
                )

    _run_in_background(_job)


def create_ride_interest_notification(ride_id, interested_user_id, ride_details):
    """Create notification for ride interest"""
    users = get_collection("users")
    interested_user = users.find_one({"_id": ObjectId(interested_user_id)})

    # Create in-app notification
    notification_created = create_notification(
        user_id=ride_details["userId"],
        type="ride_interest",
        title="New Ride Interest",
        message=f"{interested_user['name']} is interested in your ride from {ride_details['startingFrom']} to {ride_details['goingTo']}",
        related_id=ride_id,
    )

    # Send email notification asynchronously
    if notification_created:
        ride_owner = users.find_one({"_id": ObjectId(ride_details["userId"])})
        if ride_owner and ride_owner.get("email"):
            recipients = [
                {"email": ride_owner["email"], "name": ride_owner.get("name", "")}
            ]

            def _build(_r):
                ride_email_details = {
                    "source": ride_details.get("startingFrom", ""),
                    "destination": ride_details.get("goingTo", ""),
                    "date": ride_details.get("travelDate", ""),
                    "time": f"{ride_details.get('departureStartTime', '')} - {ride_details.get('departureEndTime', '')}",
                    "availableSeats": ride_details.get("availableSeats", ""),
                    "seatsRemaining": ride_details.get("seatsRemaining", ""),
                    "contribution": (
                        f"{ride_details.get('suggestedContribution', 0)} USD"
                        if ride_details.get("suggestedContribution", 0)
                        else ""
                    ),
                    "additionalDetails": ride_details.get("additionalDetails", ""),
                }
                frontend_url = os.getenv("FRONTEND_URL")
                return EmailTemplates.ride_interest_notification(
                    interested_user.get("name", ""), ride_email_details, frontend_url
                )

            _send_bulk_emails_async(recipients, _build)

    return notification_created


def create_ride_interest_removed_notification(ride_id, removed_user_id, ride_details):
    """Create notification when someone removes their interest from a ride"""
    users = get_collection("users")
    removed_user = users.find_one({"_id": ObjectId(removed_user_id)})

    # Create in-app notification
    notification_created = create_notification(
        user_id=ride_details["userId"],
        type="ride_interest_removed",
        title="Interest Removed",
        message=f"{removed_user['name']} is no longer interested in your ride from {ride_details['startingFrom']} to {ride_details['goingTo']}",
        related_id=ride_id,
    )

    # Send email notification asynchronously
    if notification_created:
        ride_owner = users.find_one({"_id": ObjectId(ride_details["userId"])})
        if ride_owner and ride_owner.get("email"):
            recipients = [
                {"email": ride_owner["email"], "name": ride_owner.get("name", "")}
            ]

            def _build(_r):
                ride_email_details = {
                    "source": ride_details.get("startingFrom", ""),
                    "destination": ride_details.get("goingTo", ""),
                    "date": ride_details.get("travelDate", ""),
                    "time": f"{ride_details.get('departureStartTime', '')} - {ride_details.get('departureEndTime', '')}",
                    "availableSeats": ride_details.get("availableSeats", ""),
                    "seatsRemaining": ride_details.get("seatsRemaining", ""),
                    "contribution": (
                        f"{ride_details.get('suggestedContribution', 0)} USD"
                        if ride_details.get("suggestedContribution", 0)
                        else ""
                    ),
                    "additionalDetails": ride_details.get("additionalDetails", ""),
                }
                frontend_url = os.getenv("FRONTEND_URL")
                return EmailTemplates.interest_removed_notification(
                    removed_user.get("name", ""), ride_email_details, frontend_url
                )

            _send_bulk_emails_async(recipients, _build)

    return notification_created


def create_roommate_interest_notification(post_id, interested_user_id, listing_details):
    """Create notification for roommate listing interest"""
    users = get_collection("users")
    interested_user = users.find_one({"_id": ObjectId(interested_user_id)})
    # Create in-app notification
    notification_created = create_notification(
        user_id=listing_details["userId"],
        type="roommate_interest",
        title="New Roommate Interest",
        message=f"{interested_user['name']} is interested in your roommate listing in {listing_details.get('location', '')}",
        related_id=post_id,
    )
    # Send email notification to listing owner using consistent template
    listing_owner = users.find_one({"_id": ObjectId(listing_details["userId"])})
    if listing_owner and listing_owner.get("email"):
        recipients = [
            {"email": listing_owner["email"], "name": listing_owner.get("name", "")}
        ]

        def _build(_r):
            frontend_url = os.getenv("FRONTEND_URL") or ""
            listing_info = {
                "type": listing_details.get("type", ""),
                "location": listing_details.get("location", ""),
                "exactAddress": listing_details.get("exactAddress", ""),
                "moveIn": listing_details.get("moveInEarliest", ""),
                "budgetMin": listing_details.get("budgetMin", ""),
                "budgetMax": listing_details.get("budgetMax", ""),
                "roomType": listing_details.get("roomType", ""),
                "furnished": bool(listing_details.get("furnished", False)),
                "petFriendly": bool(listing_details.get("petFriendly", False)),
                "smokerOk": bool(listing_details.get("smokerOk", False)),
                "dietaryPreference": listing_details.get("dietaryPreference", ""),
                "sleepSchedule": listing_details.get("sleepSchedule", ""),
                "guestsPerWeek": listing_details.get("guestsPerWeek", ""),
                "additionalDetails": listing_details.get("additionalDetails", ""),
            }
            return EmailTemplates.roommate_interest_notification(
                interested_user.get("name", "A student"), listing_info, frontend_url
            )

        _send_bulk_emails_async(recipients, _build)

    return notification_created


def create_roommate_interest_removed_notification(
    post_id, removed_user_id, listing_details
):
    """Create notification when someone removes interest from a roommate listing"""
    users = get_collection("users")
    removed_user = users.find_one({"_id": ObjectId(removed_user_id)})
    # In-app notification
    success = create_notification(
        user_id=listing_details["userId"],
        type="roommate_interest_removed",
        title="Roommate Interest Removed",
        message=f"{removed_user['name']} is no longer interested in your roommate listing",
        related_id=post_id,
    )
    # Email (async)
    if success:
        listing_owner = users.find_one({"_id": ObjectId(listing_details["userId"])})
        if listing_owner and listing_owner.get("email"):
            recipients = [
                {"email": listing_owner["email"], "name": listing_owner.get("name", "")}
            ]

            def _build(_r):
                frontend_url = os.getenv("FRONTEND_URL") or ""
                details = {
                    "type": listing_details.get("type", ""),
                    "location": listing_details.get("location", "N/A"),
                    "exactAddress": listing_details.get("exactAddress", ""),
                    "moveIn": listing_details.get("moveInEarliest", "N/A"),
                    "budgetMin": listing_details.get("budgetMin", ""),
                    "budgetMax": listing_details.get("budgetMax", ""),
                    "roomType": listing_details.get("roomType", ""),
                    "furnished": bool(listing_details.get("furnished", False)),
                    "petFriendly": bool(listing_details.get("petFriendly", False)),
                    "smokerOk": bool(listing_details.get("smokerOk", False)),
                    "dietaryPreference": listing_details.get("dietaryPreference", ""),
                    "sleepSchedule": listing_details.get("sleepSchedule", ""),
                    "guestsPerWeek": listing_details.get("guestsPerWeek", ""),
                    "additionalDetails": listing_details.get("additionalDetails", ""),
                }
                return EmailTemplates.roommate_interest_removed_notification(
                    removed_user.get("name", "A student"), details, frontend_url
                )

            _send_bulk_emails_async(recipients, _build)

    return success


def create_roommate_update_notification(post_id, listing_details):
    """Notify all interested users that a roommate listing has been updated"""
    interests = get_collection("roommate_interests")
    users = get_collection("users")
    notifications_created = 0
    recipients = []
    for interest in interests.find({"postId": post_id, "status": "interested"}):
        # In-app
        ok = create_notification(
            user_id=interest["interestedUserId"],
            type="roommate_update",
            title="Roommate Listing Updated",
            message="A roommate listing you are interested in has been updated",
            related_id=post_id,
        )
        if ok:
            notifications_created += 1
            # Collect recipient for async email
            try:
                u = users.find_one({"_id": ObjectId(interest["interestedUserId"])})
                if u and u.get("email"):
                    recipients.append({"email": u["email"], "name": u.get("name", "")})
            except Exception as e:
                print(f"Error preparing roommate update email: {e}")
    # Send emails asynchronously in one background job
    if recipients:

        def _build(r):
            frontend_url = os.getenv("FRONTEND_URL") or ""
            details = {
                "type": listing_details.get("type", ""),
                "location": listing_details.get("location", ""),
                "exactAddress": listing_details.get("exactAddress", ""),
                "moveIn": listing_details.get("moveInEarliest", ""),
                "budgetMin": listing_details.get("budgetMin", ""),
                "budgetMax": listing_details.get("budgetMax", ""),
                "roomType": listing_details.get("roomType", ""),
                "furnished": bool(listing_details.get("furnished", False)),
                "petFriendly": bool(listing_details.get("petFriendly", False)),
                "smokerOk": bool(listing_details.get("smokerOk", False)),
                "dietaryPreference": listing_details.get("dietaryPreference", ""),
                "sleepSchedule": listing_details.get("sleepSchedule", ""),
                "guestsPerWeek": listing_details.get("guestsPerWeek", ""),
                "additionalDetails": listing_details.get("additionalDetails", ""),
            }
            return EmailTemplates.roommate_updated_notification(details, frontend_url)

        _send_bulk_emails_async(recipients, _build)
    return notifications_created


def create_ride_update_notification(ride_id, ride_details):
    """Create notification for ride updates"""
    ride_interests = get_collection("ride_interests")
    interested_users = ride_interests.find({"rideId": ride_id})
    users = get_collection("users")

    notifications_created = 0
    recipients = []
    for interest in interested_users:
        # Create in-app notification
        success = create_notification(
            user_id=interest["interestedUserId"],
            type="ride_update",
            title="Ride Updated",
            message=f"Your interested ride from {ride_details['startingFrom']} to {ride_details['goingTo']} has been updated",
            related_id=ride_id,
        )

        if success:
            notifications_created += 1
            # Collect recipient for async email
            try:
                interested_user = users.find_one(
                    {"_id": ObjectId(interest["interestedUserId"])}
                )
                if interested_user and interested_user.get("email"):
                    recipients.append(
                        {
                            "email": interested_user["email"],
                            "name": interested_user.get("name", ""),
                        }
                    )
            except Exception as e:
                print(
                    f"Error preparing ride update email for {interest['interestedUserId']}: {e}"
                )
    if recipients:

        def _build(r):
            ride_email_details = {
                "source": ride_details.get("startingFrom", ""),
                "destination": ride_details.get("goingTo", ""),
                "date": ride_details.get("travelDate", ""),
                "time": f"{ride_details.get('departureStartTime', '')} - {ride_details.get('departureEndTime', '')}",
                "availableSeats": ride_details.get("availableSeats", ""),
                "seatsRemaining": ride_details.get("seatsRemaining", ""),
                "contribution": (
                    f"{ride_details.get('suggestedContribution', 0)} USD"
                    if ride_details.get("suggestedContribution", 0)
                    else ""
                ),
                "additionalDetails": ride_details.get("additionalDetails", ""),
            }
            updated_fields = ["ride details"]
            frontend_url = os.getenv("FRONTEND_URL")
            return EmailTemplates.ride_updated_notification(
                r.get("name", ""), ride_email_details, updated_fields, frontend_url
            )

        _send_bulk_emails_async(recipients, _build)

    return notifications_created


def create_ride_cancellation_notifications(ride_id, ride_details):
    """Create notifications for ride cancellation"""
    ride_interests = get_collection("ride_interests")
    interested_users = ride_interests.find({"rideId": ride_id})
    users = get_collection("users")

    notifications_created = 0
    recipients = []
    for interest in interested_users:
        # Create in-app notification
        success = create_notification(
            user_id=interest["interestedUserId"],
            type="ride_cancelled",
            title="Ride Cancelled",
            message=f"Your interested ride from {ride_details['startingFrom']} to {ride_details['goingTo']} has been cancelled",
            related_id=ride_id,
        )

        if success:
            notifications_created += 1
            # Collect recipient for async email
            try:
                interested_user = users.find_one(
                    {"_id": ObjectId(interest["interestedUserId"])}
                )
                if interested_user and interested_user.get("email"):
                    recipients.append(
                        {
                            "email": interested_user["email"],
                            "name": interested_user.get("name", ""),
                        }
                    )
            except Exception as e:
                print(
                    f"Error preparing ride cancellation email for {interest['interestedUserId']}: {e}"
                )
    if recipients:

        def _build(r):
            ride_email_details = {
                "source": ride_details.get("startingFrom", ""),
                "destination": ride_details.get("goingTo", ""),
                "date": ride_details.get("travelDate", ""),
                "time": f"{ride_details.get('departureStartTime', '')} - {ride_details.get('departureEndTime', '')}",
                "availableSeats": ride_details.get("availableSeats", ""),
                "seatsRemaining": ride_details.get("seatsRemaining", ""),
                "contribution": (
                    f"{ride_details.get('suggestedContribution', 0)} USD"
                    if ride_details.get("suggestedContribution", 0)
                    else ""
                ),
                "additionalDetails": ride_details.get("additionalDetails", ""),
            }
            frontend_url = os.getenv("FRONTEND_URL")
            return EmailTemplates.ride_cancelled_notification(
                r.get("name", ""), ride_email_details, frontend_url
            )

        _send_bulk_emails_async(recipients, _build)

    return notifications_created


def create_roommate_cancellation_notification(post_id, listing_details):
    """Create notifications for roommate listing cancellation (parity with rides)."""
    interests = get_collection("roommate_interests")
    users = get_collection("users")
    notifications_created = 0

    recipients = []
    for interest in interests.find({"postId": post_id, "status": "interested"}):
        # In-app notification
        success = create_notification(
            user_id=interest["interestedUserId"],
            type="roommate_cancelled",
            title="Roommate Listing Cancelled",
            message="A roommate listing you were interested in has been cancelled",
            related_id=post_id,
        )
        if success:
            notifications_created += 1
            try:
                u = users.find_one({"_id": ObjectId(interest["interestedUserId"])})
                if u and u.get("email"):
                    recipients.append({"email": u["email"], "name": u.get("name", "")})
            except Exception as e:
                print(f"Error preparing roommate cancellation email: {e}")

    # Send emails asynchronously in one background job
    if recipients:

        def _build(r):
            frontend_url = os.getenv("FRONTEND_URL") or ""
            details = {
                "type": listing_details.get("type", ""),
                "location": listing_details.get("location", ""),
                "exactAddress": listing_details.get("exactAddress", ""),
                "moveIn": listing_details.get("moveInEarliest", ""),
                "budgetMin": listing_details.get("budgetMin", ""),
                "budgetMax": listing_details.get("budgetMax", ""),
                "roomType": listing_details.get("roomType", ""),
                "furnished": bool(listing_details.get("furnished", False)),
                "petFriendly": bool(listing_details.get("petFriendly", False)),
                "smokerOk": bool(listing_details.get("smokerOk", False)),
                "dietaryPreference": listing_details.get("dietaryPreference", ""),
                "sleepSchedule": listing_details.get("sleepSchedule", ""),
                "guestsPerWeek": listing_details.get("guestsPerWeek", ""),
                "additionalDetails": listing_details.get("additionalDetails", ""),
            }
            return EmailTemplates.roommate_cancelled_notification(
                "", details, frontend_url
            )

        _send_bulk_emails_async(recipients, _build)

    return notifications_created
