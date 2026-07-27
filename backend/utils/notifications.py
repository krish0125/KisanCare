"""
backend/utils/notifications.py
------------------------------
Generic interface for sending notifications.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.models.notification_log import log_notification

def send_notification(db, user_id: str, email_address: str, channel: str, trigger_type: str, subject: str, message: str) -> bool:
    """
    Send a notification via the specified channel.
    Currently only 'email' is implemented end-to-end.
    """
    
    if channel == "sms" or channel == "whatsapp":
        error_msg = f"Adding {channel} requires a real provider (e.g. Twilio) and credentials. See Phase 7 documentation."
        log_notification(db, user_id, channel, trigger_type, message, status=f"not_sent_{channel}_not_implemented")
        raise NotImplementedError(error_msg)
        
    if channel != "email":
        return False
        
    smtp_server = os.environ.get('SMTP_SERVER')
    smtp_port = os.environ.get('SMTP_PORT', 587)
    smtp_username = os.environ.get('SMTP_USERNAME')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    # Check if we have credentials
    if not smtp_server or not smtp_username or not smtp_password or smtp_username == 'your_email@gmail.com':
        print(f"[Notifications] Would send email to {email_address} (Subject: {subject}), but no SMTP credentials configured.")
        log_notification(db, user_id, channel, trigger_type, message, status="not_sent_no_credentials")
        return True # Return true to indicate we processed it as best we could without failing the scheduler
        
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = email_address
        msg['Subject'] = subject
        msg.attach(MIMEText(message, 'plain', 'utf-8'))
        
        server = smtplib.SMTP(smtp_server, int(smtp_port))
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        
        log_notification(db, user_id, channel, trigger_type, message, status="sent")
        return True
    except Exception as e:
        print(f"[Notifications] Failed to send email to {email_address}: {e}")
        log_notification(db, user_id, channel, trigger_type, message, status=f"error_{type(e).__name__}")
        return False
