import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

@database_sync_to_async
def get_worker_category_info(user):
    try:
        # Re-fetch user in db context to avoid stale cache/lazy load issues
        u = User.objects.get(id=user.id)
        profile = getattr(u, 'worker_profile', None)
        if profile and profile.approval_status == 'approved' and profile.online_status and profile.service_category:
            return profile.service_category.id, profile.service_category.name
    except Exception as e:
        logger.error(f"[WS Category Fetch Error] {e}")
    return None

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        logger.info(f"[WS Connect Attempt] User: {self.user}")
        if self.user and self.user.is_authenticated:
            # Join legacy user group for backwards compatibility
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            logger.debug(f"[WS Group Add] Joined legacy group: {self.group_name}")

            # Specific role group assignments (STEP 3)
            if self.user.role == 'customer':
                self.role_group = f"customer_{self.user.id}"
                await self.channel_layer.group_add(
                    self.role_group,
                    self.channel_name
                )
                logger.debug(f"[WS Group Add] Customer joined: {self.role_group}")

            elif self.user.role == 'worker':
                self.role_group = f"captain_{self.user.id}"
                await self.channel_layer.group_add(
                    self.role_group,
                    self.channel_name
                )
                logger.debug(f"[WS Group Add] Captain joined: {self.role_group}")

                # Join category group (STEP 4)
                category_info = await get_worker_category_info(self.user)
                if category_info:
                    category_id, category_name = category_info
                    self.category_group = f"category_{category_id}"
                    self.category_slug_group = category_name.lower().replace(' ', '_')
                    
                    await self.channel_layer.group_add(
                        self.category_group,
                        self.channel_name
                    )
                    await self.channel_layer.group_add(
                        self.category_slug_group,
                        self.channel_name
                    )
                    logger.debug(f"[WS Group Add] Captain joined category groups: {self.category_group}, {self.category_slug_group}")

            # Admin groups
            if self.user.role == 'admin' or self.user.is_staff:
                self.admin_group = "admin"
                await self.channel_layer.group_add(
                    self.admin_group,
                    self.channel_name
                )
                await self.channel_layer.group_add(
                    "admin_updates",
                    self.channel_name
                )
                logger.debug(f"[WS Group Add] Admin joined groups: admin, admin_updates")
                    
            await self.accept()
            logger.info(f"[WS Accept] Connection accepted for {self.user.email}")
        else:
            logger.warning("[WS Reject] Anonymous or unauthenticated connection attempt. Closing with code 4003.")
            await self.close(code=4003)

    async def disconnect(self, code):
        logger.info(f"[WS Disconnect] Connection closed for {self.user} with code {code}")
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        if hasattr(self, "role_group"):
            await self.channel_layer.group_discard(
                self.role_group,
                self.channel_name
            )
        if hasattr(self, "category_group"):
            await self.channel_layer.group_discard(
                self.category_group,
                self.channel_name
            )
        if hasattr(self, "category_slug_group"):
            await self.channel_layer.group_discard(
                self.category_slug_group,
                self.channel_name
            )
        if hasattr(self, "admin_group"):
            await self.channel_layer.group_discard(
                self.admin_group,
                self.channel_name
            )
        if self.user and (self.user.role == 'admin' or self.user.is_staff):
            await self.channel_layer.group_discard(
                "admin_updates",
                self.channel_name
            )
        logger.debug(f"[WS Discard] Removed {self.user} from all channel groups.")

    async def receive(self, text_data=None, bytes_data=None):
        logger.debug(f"[WS Receive] Message from client: {text_data}")
        if text_data is None:
            return
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception:
            pass

    async def send_notification(self, event):
        try:
            logger.debug(f"[WS Send] Sending event to {self.user}: {event}")
            await self.send(text_data=json.dumps(event["data"]))
        except Exception as e:
            logger.error(f"[WS Send Error] Failed to send: {e}")


