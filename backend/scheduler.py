"""
backend/scheduler.py
--------------------
APScheduler setup for background jobs.
"""

import time
import requests
import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from backend.models.scheme import get_all_schemes
from backend.utils.eligibility_matcher import check_eligibility
from backend.utils.notifications import send_notification
from backend.config import Config

# We can reuse the database connection from the blueprint or connect directly
def check_and_notify_all_farmers(app, db):
    """
    Daily job to check conditions and send notifications.
    """
    print(f"[{datetime.datetime.now()}] [Scheduler] Running check_and_notify_all_farmers...")
    
    # 1. Fetch all farmers with notifications enabled
    profiles = list(db.profiles.find({}, {'_id': 0}))
    
    # 2. Get active schemes
    schemes = get_all_schemes(db)
    
    for profile in profiles:
        email = profile.get('email')
        if not email:
            continue
            
        prefs = profile.get('notification_preferences', {})
        if not prefs.get('email_enabled', True):
            continue # Farmer opted out of email
            
        name = profile.get('name', 'Farmer')
        city = profile.get('district') or profile.get('village') or profile.get('state')
        preferred_crops = profile.get('farm', {}).get('preferred_crops', [])
        
        # --- Scheme Alerts ---
        if prefs.get('scheme_alerts', True):
            for scheme in schemes:
                if not check_eligibility(profile, scheme):
                    continue
                
                deadline_str = scheme.get('last_date')
                if deadline_str:
                    try:
                        deadline = datetime.datetime.strptime(deadline_str, '%Y-%m-%d')
                        days_left = (deadline - datetime.datetime.now()).days
                        # Alert if deadline is approaching (e.g. exactly 14, 7, or 3 days)
                        # For testing/demo, we'll alert if days_left <= 14 and we haven't already
                        if 0 <= days_left <= 14:
                            # Note: in a real app, we'd check if we already sent this specific reminder
                            subject = f"Deadline Approaching: {scheme['name']}"
                            msg = f"Hello {name},\n\nThe deadline for {scheme['name']} is approaching on {deadline_str} (in {days_left} days).\nYou may be eligible based on your profile.\n\nBenefits: {scheme.get('benefits', '')}\nMore info: {scheme.get('application_guidance_url', '')}"
                            send_notification(db, email, email, 'email', 'scheme_deadline', subject, msg)
                    except ValueError:
                        pass
        
        # --- Weather Alerts ---
        if prefs.get('weather_alerts', True) and city:
            try:
                # Call our own API (must use port 5001 or whatever Config says)
                resp = requests.get(f"http://localhost:5001/api/weather?city={city}")
                if resp.status_code == 200:
                    data = resp.json()
                    advisory = data.get('advisory', {})
                    flags = advisory.get('flags', [])
                    
                    if flags:
                        subject = f"Weather Alert for {city}"
                        msg = f"Hello {name},\n\nWe have detected important weather conditions for your area:\n\n"
                        msg += "\n".join([f"- {f.replace('_', ' ').title()}" for f in flags])
                        msg += f"\n\nAdvice: {advisory.get('overall_advice', '')}"
                        send_notification(db, email, email, 'email', 'weather_alert', subject, msg)
            except Exception as e:
                print(f"[Scheduler] Failed to check weather for {city}: {e}")
                
        # --- Pest Alerts ---
        if prefs.get('pest_alerts', True) and city and preferred_crops:
            # We'll just check the first preferred crop for demo purposes
            crop = preferred_crops[0]
            try:
                payload = {"crop": crop, "city": city}
                resp = requests.post("http://localhost:5001/api/pest-risk", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    risk = data.get('risk_level', '').lower()
                    if risk in ['high', 'severe']:
                        subject = f"High Pest Risk Warning: {crop.title()}"
                        msg = f"Hello {name},\n\nThere is a {risk} pest risk for {crop} in your area ({city}).\n\nConditions: {data.get('reasoning', '')}\n\nPlease monitor your crops closely."
                        send_notification(db, email, email, 'email', 'pest_alert', subject, msg)
            except Exception as e:
                print(f"[Scheduler] Failed to check pest risk for {city}: {e}")

def init_scheduler(app, db):
    scheduler = BackgroundScheduler()
    # For demo purposes, we can run it every 24 hours.
    # But to make it verifiable immediately, we'll run it 10 seconds after startup, then daily.
    # In production, we'd use a cron trigger.
    
    # Passing app and db to the job using args
    scheduler.add_job(
        func=check_and_notify_all_farmers,
        trigger='interval',
        days=1,
        args=[app, db],
        id='daily_farmer_check',
        replace_existing=True,
        next_run_time=datetime.datetime.now() + datetime.timedelta(seconds=15) # Run 15s after startup for demo
    )
    
    scheduler.start()
    print("[OK] APScheduler started.")
    return scheduler
