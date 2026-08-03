import logging
from django.conf import settings
import sys

logger = logging.getLogger(__name__)

def verify_google_id_token(token):
    """
    Verify the Google ID Token securely using Google's official oauth library.
    Supports a mock fallback for testing in development when settings.DEBUG = True
    and the token starts with 'mock_token_'.
    """
    # 1. Check for mock token in DEBUG or test mode
    is_testing = 'test' in sys.argv or getattr(settings, 'TESTING', False)
    if (settings.DEBUG or is_testing) and token and token.startswith('mock_token_'):
        logger.info("Using mock Google token verification (development/test mode)")
        # Expected format: mock_token_<role>_<email>_<full_name_dashed>
        parts = token.split('_')
        role = parts[2] if len(parts) > 2 else 'customer'
        email = parts[3] if len(parts) > 3 else 'mockuser@example.com'
        raw_name = parts[4] if len(parts) > 4 else 'Mock User'
        full_name = raw_name.replace('-', ' ')
        
        return {
            'sub': f'mock_google_id_{email}',
            'email': email,
            'name': full_name,
            'picture': 'https://example.com/mock-profile-photo.png',
            'email_verified': True
        }

    # 2. Secure Google OAuth verification
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        
        # Verify token using google-auth library
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)

        # Validate issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Invalid token issuer')

        # Check if email is verified
        if not idinfo.get('email_verified'):
            raise ValueError('Google account email is not verified')

        return idinfo
    except Exception as e:
        logger.error(f"Google ID token verification failed: {e}")
        return None
