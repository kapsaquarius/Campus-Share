import smtplib
import ssl
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
import traceback
from dotenv import load_dotenv
from utils.service_base import BaseService, ValidationHelper, track_service_call


load_dotenv()


class EmailService(BaseService):
    """Gmail SMTP email service for CampusShare notifications"""

    def __init__(self):
        super().__init__("email_service")

    @track_service_call("send_email")
    def send_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_content: str,
        text_content: str = None,
    ) -> bool:
        """Send email using Gmail SMTP"""
        try:
            # Validate inputs
            if not ValidationHelper.validate_email(to_email):
                self.logger.error(f"Invalid email address: {to_email}")
                return False

            subject = ValidationHelper.sanitize_string(subject, 200)
            to_name = ValidationHelper.sanitize_string(to_name, 100)

            if not subject or not html_content:
                self.logger.error("Subject and HTML content are required")
                return False

            email_enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
            if not email_enabled:
                self.logger.info(
                    f"Email disabled - would send: {subject} to {to_email}"
                )
                return True

            return self._send_via_smtp(
                to_email, to_name, subject, html_content, text_content
            )
        except Exception as e:
            self.logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False

    def _send_via_smtp(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_content: str,
        text_content: str = None,
    ) -> bool:
        """Send email via Gmail SMTP"""
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_APP_PASSWORD")

        if not smtp_username or not smtp_password:
            print("Gmail SMTP credentials not configured")
            return False

        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            from_name = os.getenv("FROM_NAME")
            from_email = os.getenv("FROM_EMAIL")
            message["From"] = f"{from_name} <{from_email}>"
            message["To"] = f"{to_name} <{to_email}>"

            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)

            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

            context = ssl.create_default_context()
            smtp_server = os.getenv("SMTP_SERVER")
            smtp_port = int(os.getenv("SMTP_PORT"))
            smtp_use_tls = os.getenv("SMTP_USE_TLS").lower() == "true"

            with smtplib.SMTP(smtp_server, smtp_port) as server:
                if smtp_use_tls:
                    server.starttls(context=context)

                print("🔐 SMTP Login Attempt:")
                print(f"   Username: '{smtp_username}'")

                server.login(smtp_username, smtp_password)
                server.sendmail(from_email, to_email, message.as_string())

            print(f"Gmail SMTP email sent to {to_email}")
            return True
        except Exception as e:
            print(f"Gmail SMTP error: {e}")
            traceback.print_exc()
            return False


class EmailTemplates:
    """Email templates for various notifications"""

    @staticmethod
    def _get_base_html_template() -> Template:
        """Base HTML template for all emails"""
        return Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{ title }} - CampusShare</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, {{ header_color_start }} 0%, {{ header_color_end }} 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">{{ emoji }} CampusShare</h1>
                    <p style="margin: 10px 0 0 0; color: {{ header_subtitle_color }}; font-size: 16px;">{{ subtitle }}</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    {{ content }}
                </div>
                
                <!-- Footer -->
                <div style="background-color: #1e293b; padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                        {{ footer_message }}<br>
                        <strong style="color: #e2e8f0;">CampusShare Team</strong>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """)

    @staticmethod
    def _get_base_text_template() -> Template:
        """Base text template for all emails"""
        return Template("""
        CampusShare - {{ title }} {{ emoji }}
        
        {{ content }}
        
        {{ footer_message }}
        CampusShare Team
        """)

    @staticmethod
    def _render_email_template(
        template_type: str, data: dict, frontend_url: str
    ) -> tuple:
        """Render email template with common structure"""
        template_configs = {
            "ride_interest": {
                "emoji": "🚗",
                "header_color_start": "#667eea",
                "header_color_end": "#764ba2",
                "header_subtitle_color": "#e2e8f0",
                "subtitle": "Someone wants to join your ride!",
                "title": f"New Interest in Your Ride to {data.get('destination', 'destination')}",
                "footer_message": "Happy sharing! 🚗",
            },
            "interest_removed": {
                "emoji": "📤",
                "header_color_start": "#f59e0b",
                "header_color_end": "#d97706",
                "header_subtitle_color": "#fef3c7",
                "subtitle": "Ride interest update",
                "title": f"Ride Interest Removed - {data.get('destination', 'destination')}",
                "footer_message": "Keep sharing!",
            },
            "ride_updated": {
                "emoji": "📝",
                "header_color_start": "#10b981",
                "header_color_end": "#059669",
                "header_subtitle_color": "#d1fae5",
                "subtitle": "Ride update notification",
                "title": f"Ride Updated - {data.get('destination', 'destination')}",
                "footer_message": "Stay updated!",
            },
            "ride_cancelled": {
                "emoji": "❌",
                "header_color_start": "#ef4444",
                "header_color_end": "#dc2626",
                "header_subtitle_color": "#fecaca",
                "subtitle": "Ride cancellation notice",
                "title": f"Ride Cancelled - {data.get('destination', 'destination')}",
                "footer_message": "Don't worry! There are always more rides available.",
            },
            "roommate_interest": {
                "emoji": "🏠",
                "header_color_start": "#667eea",
                "header_color_end": "#764ba2",
                "header_subtitle_color": "#e2e8f0",
                "subtitle": "Someone is interested in your listing!",
                "title": "New Interest in Your Roommate Listing",
                "footer_message": "Happy sharing! 🏠",
            },
            "roommate_interest_removed": {
                "emoji": "📤",
                "header_color_start": "#f59e0b",
                "header_color_end": "#d97706",
                "header_subtitle_color": "#fef3c7",
                "subtitle": "Roommate interest update",
                "title": "Roommate Interest Removed",
                "footer_message": "Keep sharing!",
            },
            "roommate_updated": {
                "emoji": "📝",
                "header_color_start": "#10b981",
                "header_color_end": "#059669",
                "header_subtitle_color": "#d1fae5",
                "subtitle": "Roommate listing updated",
                "title": "Roommate Listing Updated",
                "footer_message": "Stay updated!",
            },
            "roommate_cancelled": {
                "emoji": "❌",
                "header_color_start": "#ef4444",
                "header_color_end": "#dc2626",
                "header_subtitle_color": "#fecaca",
                "subtitle": "Roommate listing cancellation notice",
                "title": "Roommate Listing Cancelled",
                "footer_message": "Don't worry! There are always more listings available.",
            },
        }

        config = template_configs.get(template_type, template_configs["ride_interest"])

        # Generate content based on template type
        if "ride" in template_type:
            content = EmailTemplates._generate_ride_content(
                template_type, data, frontend_url
            )
        else:
            content = EmailTemplates._generate_roommate_content(
                template_type, data, frontend_url
            )

        # Render templates
        html_template = EmailTemplates._get_base_html_template()
        text_template = EmailTemplates._get_base_text_template()

        template_data = {**config, "content": content, "frontend_url": frontend_url}

        subject = f"CampusShare - {config['title']}"
        html_content = html_template.render(**template_data)
        text_content = text_template.render(**template_data)

        return subject, html_content, text_content

    @staticmethod
    def _generate_ride_content(
        template_type: str, data: dict, frontend_url: str
    ) -> str:
        """Generate ride-specific content"""
        # This would contain the ride-specific content generation logic
        # For now, keeping it simple
        return f"<p>Ride content for {template_type}</p>"

    @staticmethod
    def _generate_roommate_content(
        template_type: str, data: dict, frontend_url: str
    ) -> str:
        """Generate roommate-specific content"""
        # This would contain the roommate-specific content generation logic
        # For now, keeping it simple
        return f"<p>Roommate content for {template_type}</p>"

    @staticmethod
    def ride_interest_notification(
        rider_name: str, ride_details: dict, frontend_url: str
    ) -> tuple:
        """Template for when someone shows interest in a ride"""
        subject = f"CampusShare - 🚗 New Interest in Your Ride to {ride_details.get('destination', 'destination')}"

        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Ride Interest - CampusShare</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">🚗 CampusShare</h1>
                    <p style="margin: 10px 0 0 0; color: #e2e8f0; font-size: 16px;">Someone wants to join your ride!</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
                        <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 20px;">🎉 Great News!</h2>
                        <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.6;">
                            <strong>{{ rider_name }}</strong> is interested in joining your ride to <strong>{{ ride_details.destination }}</strong>.
                        </p>
                    </div>
                    
                    <!-- Ride Details -->
                    <div style="background-color: #fefefe; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">📋 Ride Details</h3>
                        <div style="display: grid; gap: 12px;">
                            <div style="display: flex; align-items: center;">
                                <span style="color: #64748b; font-weight: 500; width: 100px; display: inline-block;">📍 From:</span>
                                <span style="color: #374151;">{{ ride_details.source }}</span>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <span style="color: #64748b; font-weight: 500; width: 100px; display: inline-block;">🎯 To:</span>
                                <span style="color: #374151;">{{ ride_details.destination }}</span>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <span style="color: #64748b; font-weight: 500; width: 100px; display: inline-block;">📅 Date:</span>
                                <span style="color: #374151;">{{ ride_details.date }}</span>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <span style="color: #64748b; font-weight: 500; width: 100px; display: inline-block;">⏰ Time:</span>
                                <span style="color: #374151;">{{ ride_details.time }}</span>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <span style="color: #64748b; font-weight: 500; width: 100px; display: inline-block;">🧑‍🤝‍🧑 Seats:</span>
                                <span style="color: #374151;">{{ ride_details.seatsRemaining }} / {{ ride_details.availableSeats }}</span>
                            </div>
                            {% if ride_details.contribution %}
                            <div style="display: flex; align-items: center;">
                                <span style="color: #64748b; font-weight: 500; width: 100px; display: inline-block;">💵 Cost:</span>
                                <span style="color: #374151;">{{ ride_details.contribution }}</span>
                            </div>
                            {% endif %}
                            {% if ride_details.additionalDetails %}
                            <div style="display: flex; align-items: flex-start;">
                                <span style="color: #64748b; font-weight: 500; width: 100px; display: inline-block;">📝 Notes:</span>
                                <span style="color: #374151;">{{ ride_details.additionalDetails }}</span>
                            </div>
                            {% endif %}
                        </div>
                    </div>
                    
                    <!-- Action Button -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="{{ frontend_url }}/rides/my-rides" 
                           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                                  color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; 
                                  font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3); 
                                  transition: all 0.3s ease;">
                            📱 View Your Rides
                        </a>
                    </div>
                    
                    <!-- Footer Message -->
                    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center;">
                        <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                            💡 <strong>Next Step:</strong> Check your ride details and contact {{ rider_name }} to coordinate the pickup!
                        </p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #1e293b; padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                        Happy sharing! 🚗<br>
                        <strong style="color: #e2e8f0;">CampusShare Team</strong>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """)

        text_template = Template("""
        CampusShare - New Ride Interest! 🚗
        
        Great news! {{ rider_name }} is interested in joining your ride.
        
        Ride Details:
        From: {{ ride_details.source }}
        To: {{ ride_details.destination }}
        Date: {{ ride_details.date }}
        Time: {{ ride_details.time }}
        
        View your rides: {{ frontend_url }}/rides/my-rides
        
        Happy sharing!
        CampusShare Team
        """)

        html_content = html_template.render(
            rider_name=rider_name, ride_details=ride_details, frontend_url=frontend_url
        )
        text_content = text_template.render(
            rider_name=rider_name, ride_details=ride_details, frontend_url=frontend_url
        )

        return subject, html_content, text_content

    @staticmethod
    def interest_removed_notification(
        rider_name: str, ride_details: dict, frontend_url: str
    ) -> tuple:
        """Template for when someone removes interest from a ride"""
        subject = f"CampusShare - 📤 Ride Interest Removed - {ride_details.get('destination', 'destination')}"

        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px;">🚗 CampusShare</h1>
                    <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 16px;">Ride interest update</p>
                </div>
                
                <div style="padding: 40px 30px;">
                    <h2 style="color: #92400e;">📤 Interest Removed</h2>
                    <p><strong>{{ rider_name }}</strong> is no longer interested in your ride to <strong>{{ ride_details.destination }}</strong>.</p>
                    
                    <div style="background-color: #fefefe; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 20px 0;">
                        <h3>📋 Ride Details</h3>
                        <p><strong>From:</strong> {{ ride_details.source }}</p>
                        <p><strong>To:</strong> {{ ride_details.destination }}</p>
                        <p><strong>Date:</strong> {{ ride_details.date }}</p>
                        <p><strong>Time:</strong> {{ ride_details.time }}</p>
                        <p><strong>Seats:</strong> {{ ride_details.seatsRemaining }} / {{ ride_details.availableSeats }}</p>
                        {% if ride_details.contribution %}
                        <p><strong>Cost:</strong> {{ ride_details.contribution }}</p>
                        {% endif %}
                        {% if ride_details.additionalDetails %}
                        <p><strong>Notes:</strong> {{ ride_details.additionalDetails }}</p>
                        {% endif %}
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ frontend_url }}/rides/my-rides" 
                           style="background: #6b7280; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                            📱 View Your Rides
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """)

        text_template = Template("""
        CampusShare - Interest Removed 📤
        
        {{ rider_name }} is no longer interested in your ride.
        
        Ride Details:
        From: {{ ride_details.source }}
        To: {{ ride_details.destination }}
        Date: {{ ride_details.date }}
        Time: {{ ride_details.time }}
        
        View your rides: {{ frontend_url }}/rides/my-rides
        
        Keep sharing!
        CampusShare Team
        """)

        html_content = html_template.render(
            rider_name=rider_name, ride_details=ride_details, frontend_url=frontend_url
        )
        text_content = text_template.render(
            rider_name=rider_name, ride_details=ride_details, frontend_url=frontend_url
        )

        return subject, html_content, text_content

    @staticmethod
    def ride_updated_notification(
        rider_name: str, ride_details: dict, updated_fields: list, frontend_url: str
    ) -> tuple:
        """Template for when a ride is updated"""
        subject = f"CampusShare - 📝 Ride Updated - {ride_details.get('destination', 'destination')}"

        updated_text = ", ".join(updated_fields)

        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px;">🚗 CampusShare</h1>
                    <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 16px;">Ride update notification</p>
                </div>
                
                <div style="padding: 40px 30px;">
                    <h2 style="color: #065f46;">📝 Ride Updated</h2>
                    <p>The ride to <strong>{{ ride_details.destination }}</strong> you're interested in has been updated.</p>
                    
                    <div style="background-color: #fefefe; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 20px 0;">
                        <h3>📋 Current Ride Details</h3>
                        <p><strong>From:</strong> {{ ride_details.source }}</p>
                        <p><strong>To:</strong> {{ ride_details.destination }}</p>
                        <p><strong>Date:</strong> {{ ride_details.date }}</p>
                        <p><strong>Time:</strong> {{ ride_details.time }}</p>
                        <p><strong>Seats:</strong> {{ ride_details.seatsRemaining }} / {{ ride_details.availableSeats }}</p>
                        {% if ride_details.contribution %}
                        <p><strong>Cost:</strong> {{ ride_details.contribution }}</p>
                        {% endif %}
                        {% if ride_details.additionalDetails %}
                        <p><strong>Notes:</strong> {{ ride_details.additionalDetails }}</p>
                        {% endif %}
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ frontend_url }}/rides/my-interested" 
                           style="background: #10b981; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                            📱 View Updated Ride
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """)

        text_template = Template("""
        CampusShare - Ride Updated 📝
        
        The ride to {{ ride_details.destination }} you're interested in has been updated.
        
        Updated: {{ updated_text }}
        
        Current Ride Details:
        From: {{ ride_details.source }}
        To: {{ ride_details.destination }}
        Date: {{ ride_details.date }}
        Time: {{ ride_details.time }}
        
        View updated ride: {{ frontend_url }}/rides/my-interested
        
        Stay updated!
        CampusShare Team
        """)

        html_content = html_template.render(
            ride_details=ride_details,
            updated_text=updated_text,
            frontend_url=frontend_url,
        )
        text_content = text_template.render(
            ride_details=ride_details,
            updated_text=updated_text,
            frontend_url=frontend_url,
        )

        return subject, html_content, text_content

    @staticmethod
    def ride_cancelled_notification(
        rider_name: str, ride_details: dict, frontend_url: str
    ) -> tuple:
        """Template for when a ride is cancelled"""
        subject = f"CampusShare - ❌ Ride Cancelled - {ride_details.get('destination', 'destination')}"

        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px;">🚗 CampusShare</h1>
                    <p style="margin: 10px 0 0 0; color: #fecaca; font-size: 16px;">Ride cancellation notice</p>
                </div>
                
                <div style="padding: 40px 30px;">
                    <h2 style="color: #991b1b;">❌ Ride Cancelled</h2>
                    <p>Unfortunately, the ride to <strong>{{ ride_details.destination }}</strong> you were interested in has been cancelled.</p>
                    
                    <div style="background-color: #fefefe; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 20px 0;">
                        <h3>📋 Cancelled Ride Details</h3>
                        <p><strong>From:</strong> {{ ride_details.source }}</p>
                        <p><strong>To:</strong> {{ ride_details.destination }}</p>
                        <p><strong>Date:</strong> {{ ride_details.date }}</p>
                        <p><strong>Time:</strong> {{ ride_details.time }}</p>
                        <p><strong>Seats:</strong> {{ ride_details.seatsRemaining }} / {{ ride_details.availableSeats }}</p>
                        {% if ride_details.contribution %}
                        <p><strong>Cost:</strong> {{ ride_details.contribution }}</p>
                        {% endif %}
                        {% if ride_details.additionalDetails %}
                        <p><strong>Notes:</strong> {{ ride_details.additionalDetails }}</p>
                        {% endif %}
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ frontend_url }}/rides" 
                           style="background: #3b82f6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                            🔍 Find Another Ride
                        </a>
                    </div>
                    
                    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; margin-top: 20px;">
                        <p style="margin: 0; color: #64748b; font-size: 14px;">
                            💡 <strong>Don't worry!</strong> There are always more rides available, or you can create your own.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """)

        text_template = Template("""
        CampusShare - Ride Cancelled ❌
        
        Unfortunately, the ride to {{ ride_details.destination }} you were interested in has been cancelled.
        
        Cancelled Ride Details:
        From: {{ ride_details.source }}
        To: {{ ride_details.destination }}
        Date: {{ ride_details.date }}
        Time: {{ ride_details.time }}
        
        Find another ride: {{ frontend_url }}/rides
        
        Don't worry! There are always more rides available.
        
        Keep sharing!
        CampusShare Team
        """)

        html_content = html_template.render(
            ride_details=ride_details, frontend_url=frontend_url
        )
        text_content = text_template.render(
            ride_details=ride_details, frontend_url=frontend_url
        )

        return subject, html_content, text_content

    @staticmethod
    def roommate_interest_notification(
        student_name: str, listing_details: dict, frontend_url: str
    ) -> tuple:
        subject = "CampusShare - 🏠 New Interest in Your Roommate Listing"
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;font-family:Arial, sans-serif;background-color:#f8fafc;">
          <div style="max-width:600px;margin:0 auto;background-color:white;">
            <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px 20px;text-align:center;">
              <h1 style="margin:0;color:white;font-size:28px;">🏠 CampusShare</h1>
              <p style="margin:10px 0 0 0;color:#e2e8f0;font-size:16px;">Someone is interested in your listing!</p>
            </div>
            <div style="padding:40px 30px;">
              <div style="background-color:#f1f5f9;border-left:4px solid #3b82f6;padding:20px;margin-bottom:30px;border-radius:0 8px 8px 0;">
                <h2 style="margin:0 0 10px 0;color:#1e293b;font-size:20px;">🎉 Great News!</h2>
                <p style="margin:0;color:#475569;font-size:16px;line-height:1.6;">
                  <strong>{{ student_name }}</strong> is interested in your roommate listing.
                </p>
              </div>
              <div style="background-color:#fefefe;border:1px solid #e2e8f0;border-radius:8px;padding:25px;margin-bottom:30px;">
                <h3 style="margin:0 0 20px 0;color:#1e293b;font-size:18px;border-bottom:2px solid #f1f5f9;padding-bottom:10px;">📋 Listing Details</h3>
                <p style="margin:0;color:#374151;">Type: {{ listing_details.type == 'offer' and 'Offering a room' or 'Looking for a room' }}</p>
                <p style="margin:0;color:#374151;">Location: {{ listing_details.location }}</p>
                {% if listing_details.exactAddress %}<p style="margin:0;color:#374151;">Exact address: {{ listing_details.exactAddress }}</p>{% endif %}
                <p style="margin:0;color:#374151;">Move-in: {{ listing_details.moveIn }}</p>
                <p style="margin:0;color:#374151;">Budget: {{ listing_details.budgetMin }} - {{ listing_details.budgetMax }} USD/mo</p>
                {% if listing_details.roomType %}<p style="margin:0;color:#374151;">Room type: {{ listing_details.roomType }}</p>{% endif %}
                <p style="margin:0;color:#374151;">Furnished: {{ listing_details.furnished and 'Yes' or 'No' }}</p>
                <p style="margin:0;color:#374151;">Pets: {{ listing_details.petFriendly and 'OK' or 'No' }}</p>
                <p style="margin:0;color:#374151;">Smoking: {{ listing_details.smokerOk and 'OK' or 'No' }}</p>
                {% if listing_details.dietaryPreference %}<p style="margin:0;color:#374151;">Dietary: {{ listing_details.dietaryPreference }}</p>{% endif %}
                {% if listing_details.sleepSchedule %}<p style="margin:0;color:#374151;">Sleep: {{ listing_details.sleepSchedule }}</p>{% endif %}
                {% if listing_details.guestsPerWeek %}<p style="margin:0;color:#374151;">Guests/week: {{ listing_details.guestsPerWeek }}</p>{% endif %}
                {% if listing_details.additionalDetails %}<p style="margin:0;color:#374151;">Notes: {{ listing_details.additionalDetails }}</p>{% endif %}
              </div>
              <div style="text-align:center;margin-bottom:30px;">
                <a href="{{ frontend_url }}/roommates/my-listings" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">📱 View Your Listings</a>
              </div>
            </div>
            <div style="background-color:#1e293b;padding:20px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:14px;">Happy sharing! 🏠<br><strong style="color:#e2e8f0;">CampusShare Team</strong></p>
            </div>
          </div>
        </body>
        </html>
        """)
        text_template = Template("""
        CampusShare - New Roommate Interest 🏠

        Great news! {{ student_name }} is interested in your roommate listing.

        Location: {{ listing_details.location }}
        Move-in: {{ listing_details.moveIn }}
        Budget: {{ listing_details.budget }}

        View your listings: {{ frontend_url }}/roommates/my-listings

        Happy sharing!
        CampusShare Team
        """)
        html_content = html_template.render(
            student_name=student_name,
            listing_details=listing_details,
            frontend_url=frontend_url,
        )
        text_content = text_template.render(
            student_name=student_name,
            listing_details=listing_details,
            frontend_url=frontend_url,
        )
        return subject, html_content, text_content

    @staticmethod
    def roommate_interest_removed_notification(
        student_name: str, listing_details: dict, frontend_url: str
    ) -> tuple:
        subject = "CampusShare - 📤 Roommate Interest Removed"
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;font-family:Arial, sans-serif;background-color:#f8fafc;">
          <div style="max-width:600px;margin:0 auto;background-color:white;">
            <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:30px 20px;text-align:center;">
              <h1 style="margin:0;color:white;font-size:28px;">🏠 CampusShare</h1>
              <p style="margin:10px 0 0 0;color:#fef3c7;font-size:16px;">Roommate interest update</p>
            </div>
            <div style="padding:40px 30px;">
              <h2 style="color:#92400e;">📤 Interest Removed</h2>
              <p><strong>{{ student_name }}</strong> is no longer interested in your roommate listing.</p>
              <div style="background-color:#fefefe;border:1px solid #e2e8f0;border-radius:8px;padding:25px;margin:20px 0;">
                <h3>📋 Listing Details</h3>
                <p><strong>Type:</strong> {{ listing_details.type == 'offer' and 'Offering a room' or 'Looking for a room' }}</p>
                <p><strong>Location:</strong> {{ listing_details.location }}</p>
                {% if listing_details.exactAddress %}<p><strong>Exact address:</strong> {{ listing_details.exactAddress }}</p>{% endif %}
                <p><strong>Move-in:</strong> {{ listing_details.moveIn }}</p>
                <p><strong>Budget:</strong> {{ listing_details.budgetMin }} - {{ listing_details.budgetMax }} USD/mo</p>
                {% if listing_details.roomType %}<p><strong>Room type:</strong> {{ listing_details.roomType }}</p>{% endif %}
                <p><strong>Furnished:</strong> {{ listing_details.furnished and 'Yes' or 'No' }}</p>
                <p><strong>Pets:</strong> {{ listing_details.petFriendly and 'OK' or 'No' }}</p>
                <p><strong>Smoking:</strong> {{ listing_details.smokerOk and 'OK' or 'No' }}</p>
                {% if listing_details.dietaryPreference %}<p><strong>Dietary:</strong> {{ listing_details.dietaryPreference }}</p>{% endif %}
                {% if listing_details.sleepSchedule %}<p><strong>Sleep:</strong> {{ listing_details.sleepSchedule }}</p>{% endif %}
                {% if listing_details.guestsPerWeek %}<p><strong>Guests/week:</strong> {{ listing_details.guestsPerWeek }}</p>{% endif %}
                {% if listing_details.additionalDetails %}<p><strong>Notes:</strong> {{ listing_details.additionalDetails }}</p>{% endif %}
              </div>
              <div style="text-align:center;margin:30px 0;">
                <a href="{{ frontend_url }}/roommates/my-listings" 
                   style="background:#6b7280;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">
                  📱 View Your Listings
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
        """)
        text_template = Template("""
        CampusShare - Roommate Interest Removed 📤

        {{ student_name }} is no longer interested in your roommate listing.

        Location: {{ listing_details.location }}
        Move-in: {{ listing_details.moveIn }}
        Budget: {{ listing_details.budget }}

        View your listings: {{ frontend_url }}/roommates/my-listings

        Keep sharing!
        CampusShare Team
        """)
        html_content = html_template.render(
            student_name=student_name,
            listing_details=listing_details,
            frontend_url=frontend_url,
        )
        text_content = text_template.render(
            student_name=student_name,
            listing_details=listing_details,
            frontend_url=frontend_url,
        )
        return subject, html_content, text_content

    @staticmethod
    def roommate_updated_notification(
        listing_details: dict, frontend_url: str
    ) -> tuple:
        subject = "CampusShare - 📝 Roommate Listing Updated"
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;font-family:Arial, sans-serif;background-color:#f8fafc;">
          <div style="max-width:600px;margin:0 auto;background-color:white;">
            <div style="background:linear-gradient(135deg,#10b981 0%, #059669 100%);padding:30px 20px;text-align:center;">
              <h1 style="margin:0;color:white;font-size:28px;">🏠 CampusShare</h1>
              <p style="margin:10px 0 0 0;color:#d1fae5;font-size:16px;">Roommate listing updated</p>
            </div>
            <div style="padding:40px 30px;">
              <h2 style="color:#065f46;">📝 Listing Updated</h2>
              <p>A roommate listing you are interested in has been updated.</p>
              <div style="background-color:#fefefe;border:1px solid #e2e8f0;border-radius:8px;padding:25px;margin:20px 0;">
                <h3>📋 Current Listing Details</h3>
                <p><strong>Type:</strong> {{ listing_details.type == 'offer' and 'Offering a room' or 'Looking for a room' }}</p>
                <p><strong>Location:</strong> {{ listing_details.location }}</p>
                {% if listing_details.exactAddress %}<p><strong>Exact address:</strong> {{ listing_details.exactAddress }}</p>{% endif %}
                <p><strong>Move-in:</strong> {{ listing_details.moveIn }}</p>
                <p><strong>Budget:</strong> {{ listing_details.budgetMin }} - {{ listing_details.budgetMax }} USD/mo</p>
                {% if listing_details.roomType %}<p><strong>Room type:</strong> {{ listing_details.roomType }}</p>{% endif %}
                <p><strong>Furnished:</strong> {{ listing_details.furnished and 'Yes' or 'No' }}</p>
                <p><strong>Pets:</strong> {{ listing_details.petFriendly and 'OK' or 'No' }}</p>
                <p><strong>Smoking:</strong> {{ listing_details.smokerOk and 'OK' or 'No' }}</p>
                {% if listing_details.dietaryPreference %}<p><strong>Dietary:</strong> {{ listing_details.dietaryPreference }}</p>{% endif %}
                {% if listing_details.sleepSchedule %}<p><strong>Sleep:</strong> {{ listing_details.sleepSchedule }}</p>{% endif %}
                {% if listing_details.guestsPerWeek %}<p><strong>Guests/week:</strong> {{ listing_details.guestsPerWeek }}</p>{% endif %}
              </div>
              <div style="text-align:center;margin:30px 0;">
                <a href="{{ frontend_url }}/roommates/my-interests"
                   style="background:#10b981;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">
                  📱 View Updated Listing
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
        """)
        text_template = Template("""
        CampusShare - Roommate Listing Updated 📝

        A roommate listing you are interested in has been updated.

        Location: {{ listing_details.location }}
        Move-in: {{ listing_details.moveIn }}
        Budget: {{ listing_details.budget }}

        View updated listing: {{ frontend_url }}/roommates/my-interests
        """)
        html_content = html_template.render(
            listing_details=listing_details, frontend_url=frontend_url
        )
        text_content = text_template.render(
            listing_details=listing_details, frontend_url=frontend_url
        )
        return subject, html_content, text_content

    @staticmethod
    def roommate_cancelled_notification(
        student_name: str, listing_details: dict, frontend_url: str
    ) -> tuple:
        subject = "CampusShare - ❌ Roommate Listing Cancelled"
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;font-family:Arial, sans-serif;background-color:#f8fafc;">
          <div style="max-width:600px;margin:0 auto;background-color:white;">
            <div style="background:linear-gradient(135deg,#ef4444 0%, #dc2626 100%);padding:30px 20px;text-align:center;">
              <h1 style="margin:0;color:white;font-size:28px;">🏠 CampusShare</h1>
              <p style="margin:10px 0 0 0;color:#fecaca;font-size:16px;">Roommate listing cancellation notice</p>
            </div>
            <div style="padding:40px 30px;">
              <h2 style="color:#991b1b;">❌ Listing Cancelled</h2>
              <p>Unfortunately, a roommate listing you were interested in has been cancelled.</p>
              <div style="background-color:#fefefe;border:1px solid #e2e8f0;border-radius:8px;padding:25px;margin:20px 0;">
                <h3>📋 Cancelled Listing Details</h3>
                <p><strong>Type:</strong> {{ listing_details.type == 'offer' and 'Offering a room' or 'Looking for a room' }}</p>
                <p><strong>Location:</strong> {{ listing_details.location }}</p>
                {% if listing_details.exactAddress %}<p><strong>Exact address:</strong> {{ listing_details.exactAddress }}</p>{% endif %}
                <p><strong>Move-in:</strong> {{ listing_details.moveIn }}</p>
                <p><strong>Budget:</strong> {{ listing_details.budgetMin }} - {{ listing_details.budgetMax }} USD/mo</p>
                {% if listing_details.roomType %}<p><strong>Room type:</strong> {{ listing_details.roomType }}</p>{% endif %}
                <p><strong>Furnished:</strong> {{ listing_details.furnished and 'Yes' or 'No' }}</p>
                <p><strong>Pets:</strong> {{ listing_details.petFriendly and 'OK' or 'No' }}</p>
                <p><strong>Smoking:</strong> {{ listing_details.smokerOk and 'OK' or 'No' }}</p>
                {% if listing_details.dietaryPreference %}<p><strong>Dietary:</strong> {{ listing_details.dietaryPreference }}</p>{% endif %}
                {% if listing_details.sleepSchedule %}<p><strong>Sleep:</strong> {{ listing_details.sleepSchedule }}</p>{% endif %}
                {% if listing_details.guestsPerWeek %}<p><strong>Guests/week:</strong> {{ listing_details.guestsPerWeek }}</p>{% endif %}
              </div>
              <div style="text-align:center;margin:30px 0;">
                <a href="{{ frontend_url }}/roommates" 
                   style="background:#3b82f6;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">
                  🔍 Find Another Listing
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
        """)
        text_template = Template("""
        CampusShare - Roommate Listing Cancelled ❌

        A roommate listing you were interested in has been cancelled.

        Location: {{ listing_details.location }}
        Move-in: {{ listing_details.moveIn }}
        Budget: {{ listing_details.budget }}

        Find another listing: {{ frontend_url }}/roommates
        """)
        html_content = html_template.render(
            listing_details=listing_details, frontend_url=frontend_url
        )
        text_content = text_template.render(
            listing_details=listing_details, frontend_url=frontend_url
        )
        return subject, html_content, text_content


email_service = EmailService()
