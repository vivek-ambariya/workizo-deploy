from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from accounts.google_auth import verify_google_id_token

from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse

from accounts.serializers import (
    RegisterSerializer, UserSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer
)
from customers.models import CustomerProfile
from customers.serializers import CustomerProfileSerializer
from workers.models import WorkerProfile
from workers.serializers import WorkerProfileSerializer
from notifications.email_service import EmailNotificationService
from validations import (
    validate_role,
    validate_email,
    validate_verification_token
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            profile_data = None
            # Create corresponding empty profile
            if user.role == 'customer':
                cp = CustomerProfile.objects.create(user=user)
                profile_data = CustomerProfileSerializer(cp).data
                # Send welcome and email verification
                EmailNotificationService.send_welcome_verification_email(user, request)
            elif user.role == 'worker':
                wp = WorkerProfile.objects.create(user=user)
                profile_data = WorkerProfileSerializer(wp).data
                # Send welcome and email verification to captain
                EmailNotificationService.send_captain_welcome_verification_email(user, request)
                
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            user_data['profile'] = profile_data
            
            access_token = str(refresh.access_token)
            print(f"\n================ [DEBUG] ACCESS TOKEN ({user.email}) ================")
            print(access_token)
            print("========================================================================\n")
            
            return Response({
                'user': user_data,
                'refresh': str(refresh),
                'access': access_token,
                'message': 'Registration successful'
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"detail": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": "Invalid token or already logged out"}, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        user = request.user
        user_data = UserSerializer(user).data
        
        # Attach profile details
        profile_data = None
        if user.role == 'customer':
            try:
                profile = user.customer_profile
                profile_data = CustomerProfileSerializer(profile).data
            except CustomerProfile.DoesNotExist:
                profile_data = None
        elif user.role == 'worker':
            try:
                profile = user.worker_profile
                profile_data = WorkerProfileSerializer(profile).data
            except WorkerProfile.DoesNotExist:
                profile_data = None
                
        return Response({
            'user': user_data,
            'profile': profile_data
        })

class UpdateProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def put(self, request):
        user = request.user
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        
        if not user_serializer.is_valid():
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        user_serializer.save()
        
        # If user has profile details to update
        profile_data = None
        if user.role == 'customer':
            try:
                profile = user.customer_profile
                profile_serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
                if profile_serializer.is_valid():
                    profile_serializer.save()
                    profile_data = profile_serializer.data
                else:
                    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except CustomerProfile.DoesNotExist:
                pass
        elif user.role == 'worker':
            try:
                profile = user.worker_profile
                profile_serializer = WorkerProfileSerializer(profile, data=request.data, partial=True)
                if profile_serializer.is_valid():
                    profile_serializer.save()
                    profile_data = profile_serializer.data
                else:
                    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except WorkerProfile.DoesNotExist:
                pass
                
        return Response({
            'user': user_serializer.data,
            'profile': profile_data,
            'message': 'Profile updated successfully'
        })

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
                
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get('credential')
        role = request.data.get('role', 'customer')

        if not token:
            return Response({"detail": "Google credential token is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify Google Token
        id_info = verify_google_id_token(token)
        if not id_info:
            return Response({"detail": "Invalid or expired Google credential token"}, status=status.HTTP_400_BAD_REQUEST)

        google_id = id_info.get('sub')
        email = id_info.get('email')
        full_name = id_info.get('name', '')
        profile_picture = id_info.get('picture', '')

        # Try to find user by google_id or email
        user = None
        try:
            user = User.objects.get(google_id=google_id)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=email)
                # Link account
                if not user.google_id:
                    user.google_id = google_id
                if not user.profile_picture:
                    user.profile_picture = profile_picture
                user.is_email_verified = True
                user.save()
            except User.DoesNotExist:
                user = None

        is_new_user = False
        if not user:
            is_new_user = True
            try:
                validate_role(role, allowed_roles=['customer', 'worker'])
            except Exception:
                return Response({"detail": "Invalid role specified"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.create_user(
                    email=email,
                    full_name=full_name,
                    role=role,
                    auth_provider='GOOGLE',
                    google_id=google_id,
                    profile_picture=profile_picture,
                    is_email_verified=True
                )
                
                # Create corresponding profile
                if role == 'customer':
                    CustomerProfile.objects.create(user=user)
                elif role == 'worker':
                    WorkerProfile.objects.create(user=user)

            except Exception as e:
                return Response({"detail": f"Failed to create user account: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['email'] = user.email
        refresh['full_name'] = user.full_name

        user_data = UserSerializer(user).data
        profile_data = None
        if user.role == 'customer':
            try:
                profile = getattr(user, 'customer_profile', None)
                if profile:
                    profile_data = CustomerProfileSerializer(profile).data
            except Exception:
                pass
        elif user.role == 'worker':
            try:
                profile = getattr(user, 'worker_profile', None)
                if profile:
                    profile_data = WorkerProfileSerializer(profile).data
            except Exception:
                pass
        user_data['profile'] = profile_data

        access_token = str(refresh.access_token)
        print(f"\n================ [DEBUG] ACCESS TOKEN ({user.email}) ================")
        print(access_token)
        print("========================================================================\n")

        return Response({
            'user': user_data,
            'refresh': str(refresh),
            'access': access_token,
            'message': 'Login successful',
            'is_new': is_new_user
        }, status=status.HTTP_200_OK if not is_new_user else status.HTTP_201_CREATED)


# Helper function to render a beautiful responsive HTML page for email flows
def render_html_response(title, message, is_success=True, action_url=None, action_text=None):
    primary_color = "#1A73E8" if is_success else "#DC2626"
    button_html = f'<div style="text-align: center; margin-top: 32px;"><a href="{action_url}" style="background-color: {primary_color}; color: #FFFFFF; padding: 12px 30px; text-decoration: none; font-weight: 700; font-size: 15px; border-radius: 8px; display: inline-block;">{action_text}</a></div>' if action_url else ''
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #F4F6F9; margin: 0; padding: 40px 20px; color: #1F2937; text-align: center; }}
            .card {{ max-width: 500px; margin: 0 auto; background: #FFFFFF; padding: 40px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06); text-align: left; }}
            h1 {{ font-size: 24px; font-weight: 800; color: #0F0F14; margin-top: 0; margin-bottom: 16px; text-align: center; }}
            p {{ font-size: 15px; color: #4B5563; line-height: 1.6; margin-bottom: 24px; text-align: center; }}
            .logo {{ font-size: 28px; font-weight: 800; color: #0F0F14; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; font-family: 'Inter', sans-serif; text-align: center; }}
            .form-group {{ margin-bottom: 20px; }}
            .form-group label {{ display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px; }}
            .form-control {{ width: 100%; padding: 10px 12px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 6px; box-sizing: border-box; }}
            .btn-submit {{ width: 100%; background-color: #1A73E8; color: #FFFFFF; padding: 12px; font-size: 15px; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; margin-top: 10px; }}
            .btn-submit:hover {{ background-color: #1557B0; }}
            .error-message {{ color: #DC2626; font-size: 14px; font-weight: 600; margin-bottom: 15px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="logo">WORKIZO</div>
        <div class="card">
            <h1>{title}</h1>
            <p>{message}</p>
            {button_html}
        </div>
    </body>
    </html>
    """


class VerifyEmailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        token = request.query_params.get('token')
        try:
            validate_verification_token(token)
        except Exception:
            html = render_html_response("Verification Failed", "The verification link is missing a token.", is_success=False)
            return HttpResponse(html, content_type='text/html', status=400)

        signer = TimestampSigner()
        try:
            # Token expires after 24 hours (86400 seconds)
            user_id = signer.unsign(token, max_age=86400)
            user = User.objects.get(pk=user_id)
            
            from django.conf import settings
            frontend_url = settings.CORS_ALLOWED_ORIGINS[0] if getattr(settings, 'CORS_ALLOWED_ORIGINS', None) else "http://localhost:5174"
            if not frontend_url.endswith('/'):
                frontend_url += '/'

            if user.is_email_verified:
                html = render_html_response(
                    "Already Verified", 
                    "Your email address has already been verified.", 
                    is_success=True,
                    action_url=frontend_url,
                    action_text="Go to Login"
                )
                return HttpResponse(html, content_type='text/html')
                
            user.is_email_verified = True
            user.save()
            
            html = render_html_response(
                "Email Verified", 
                "Your email has been successfully verified! You can now log in to the WORKIZO application.", 
                is_success=True,
                action_url=frontend_url,
                action_text="Log In to WORKIZO"
            )
            return HttpResponse(html, content_type='text/html')

        except SignatureExpired:
            html = render_html_response("Verification Expired", "The verification link has expired. Please register again or request a new verification link.", is_success=False)
            return HttpResponse(html, content_type='text/html', status=400)
        except (BadSignature, User.DoesNotExist):
            html = render_html_response("Invalid Link", "The verification link is invalid or corrupted.", is_success=False)
            return HttpResponse(html, content_type='text/html', status=400)


class ForgotPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        try:
            email = validate_email(email)
        except Exception:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        # For security reasons, we do not reveal whether the user exists or not.
        user = User.objects.filter(email=email).first()
        if user:
            EmailNotificationService.send_password_reset_email(user, request)
            
        return Response({
            "message": "If the email is associated with an account, a password reset link has been sent."
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class ResetPasswordConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def _render_form(self, title, message, error_msg=None):
        error_html = f'<div class="error-message">{error_msg}</div>' if error_msg else ''
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #F4F6F9; margin: 0; padding: 40px 20px; color: #1F2937; text-align: center; }}
                .card {{ max-width: 450px; margin: 0 auto; background: #FFFFFF; padding: 40px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06); text-align: left; }}
                h1 {{ font-size: 24px; font-weight: 800; color: #0F0F14; margin-top: 0; margin-bottom: 12px; text-align: center; }}
                p {{ font-size: 14px; color: #6B7280; line-height: 1.5; margin-bottom: 24px; text-align: center; }}
                .logo {{ font-size: 28px; font-weight: 800; color: #0F0F14; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; text-align: center; }}
                .form-group {{ margin-bottom: 20px; }}
                .form-group label {{ display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px; }}
                .form-control {{ width: 100%; padding: 12px 14px; font-size: 14px; border: 1px solid #D1D5DB; border-radius: 8px; box-sizing: border-box; }}
                .form-control:focus {{ outline: none; border-color: #1A73E8; box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.15); }}
                .btn-submit {{ width: 100%; background-color: #1A73E8; color: #FFFFFF; padding: 12px; font-size: 15px; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; margin-top: 10px; }}
                .btn-submit:hover {{ background-color: #1557B0; }}
                .error-message {{ color: #DC2626; font-size: 14px; font-weight: 600; margin-bottom: 15px; text-align: center; background-color: #FDE8E8; padding: 10px; border-radius: 6px; }}
            </style>
        </head>
        <body>
            <div class="logo">WORKIZO</div>
            <div class="card">
                <h1>{title}</h1>
                <p>{message}</p>
                {error_html}
                <form method="POST" action="">
                    <div class="form-group">
                        <label for="password">New Password</label>
                        <input type="password" id="password" name="password" class="form-control" placeholder="Enter new password" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="confirm_password">Confirm Password</label>
                        <input type="password" id="confirm_password" name="confirm_password" class="form-control" placeholder="Confirm new password" required minlength="6">
                    </div>
                    <button type="submit" class="btn-submit">Reset Password</button>
                </form>
            </div>
        </body>
        </html>
        """

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            html = self._render_form("Reset Password", "Please choose a strong new password for your WORKIZO customer account.")
            return HttpResponse(html, content_type='text/html')
        else:
            html = render_html_response("Invalid or Expired Link", "The password reset link is invalid or has expired. Please request another one.", is_success=False)
            return HttpResponse(html, content_type='text/html', status=400)

    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is None or not default_token_generator.check_token(user, token):
            html = render_html_response("Invalid or Expired Link", "The password reset link is invalid or has expired. Please request another one.", is_success=False)
            return HttpResponse(html, content_type='text/html', status=400)

        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')

        if not password or not confirm_password:
            html = self._render_form("Reset Password", "Please fill in all password fields.", error_msg="All fields are required.")
            return HttpResponse(html, content_type='text/html', status=400)

        if password != confirm_password:
            html = self._render_form("Reset Password", "Ensure both fields are identical.", error_msg="Passwords do not match.")
            return HttpResponse(html, content_type='text/html', status=400)

        if len(password) < 6:
            html = self._render_form("Reset Password", "Password must be at least 6 characters.", error_msg="Password is too short.")
            return HttpResponse(html, content_type='text/html', status=400)

        user.set_password(password)
        # Verify email if they reset password (shows they own the email)
        user.is_email_verified = True
        user.save()

        from django.conf import settings
        frontend_url = settings.CORS_ALLOWED_ORIGINS[0] if getattr(settings, 'CORS_ALLOWED_ORIGINS', None) else "http://localhost:5174"
        if not frontend_url.endswith('/'):
            frontend_url += '/'

        html = render_html_response(
            "Password Reset Successful", 
            "Your password has been successfully updated! You can now log in to the WORKIZO application with your new password.", 
            is_success=True,
            action_url=frontend_url,
            action_text="Go to Login"
        )
        return HttpResponse(html, content_type='text/html')
