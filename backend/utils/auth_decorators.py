"""
backend/utils/auth_decorators.py
--------------------------------
Provides decorators for role-based access control.
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request

def admin_required():
    """
    A decorator to protect endpoints that require the 'admin' role.
    It verifies the JWT and checks the 'role' claim.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
