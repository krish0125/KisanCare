"""
backend/utils/validation.py
----------------------------
Input validation helpers — extracted from the original app.py without any
behaviour changes so existing login/signup logic is preserved exactly.
"""

import re


def is_valid_email(email: str) -> bool:
    """
    Validate email: must have local part, @ symbol, domain with valid TLD.
    Accepts common Indian and international providers.
    """
    pattern = (
        r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+'
        r'\.(com|net|org|in|co\.in|edu|gov|io|gg|biz|info|me'
        r'|yahoo\.com|outlook\.com|hotmail\.com|gmail\.com|rediffmail\.com)$'
    )
    return bool(re.match(pattern, email.lower().strip()))


def is_strong_password(password: str):
    """
    Enforce password policy:
      - At least 8 characters
      - At least one uppercase letter (A-Z)
      - At least one lowercase letter (a-z)
      - At least one digit (0-9)
      - At least one special character

    Returns:
        (True, '')              if password passes
        (False, error_message)  if password fails
    """
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long.'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter (A-Z).'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter (a-z).'
    if not re.search(r'[0-9]', password):
        return False, 'Password must contain at least one digit (0-9).'
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-\[\]\\/+=~`]', password):
        return False, 'Password must contain at least one special character (!@#$%^&* etc.)'
    return True, ''
