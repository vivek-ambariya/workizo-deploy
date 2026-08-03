import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

logger = logging.getLogger('notifications.emails')

def send_html_email(subject, template_name, context, recipient_list, from_email=None):
    """
    Renders an HTML email template and sends it using Django's EmailMultiAlternatives.
    All exceptions are caught and logged, ensuring the application flow continues.
    """
    if not recipient_list:
        logger.warning("No recipients specified for email: %s", subject)
        return False

    if not from_email:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'webmaster@localhost')

    try:
        # Render HTML content
        html_content = render_to_string(template_name, context)
        
        # Create text content by stripping HTML tags
        text_content = strip_tags(html_content)

        # Create email message
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=recipient_list
        )
        msg.attach_alternative(html_content, "text/html")
        
        # Send email
        msg.send(fail_silently=False)
        print(f"\n[EMAIL SUCCESS] Sent '{subject}' to {recipient_list}\n")
        logger.info("Successfully sent email '%s' to %s", subject, recipient_list)
        return True

    except Exception as e:
        import sys
        print(f"\n[EMAIL FAILURE] Failed sending '{subject}' to {recipient_list}: {str(e)}\n", file=sys.stderr)
        logger.exception("Error sending email '%s' to %s: %s", subject, recipient_list, str(e))
        return False
