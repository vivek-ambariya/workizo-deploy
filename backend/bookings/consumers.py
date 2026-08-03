import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from bookings.models import Booking
from validations import validate_socket_booking

@database_sync_to_async
def is_authorized_for_booking(user, booking_id):
    try:
        validate_socket_booking(booking_id, user)
        return True
    except Exception:
        return False

class BookingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4003)
            return

        self.booking_id = self.scope['url_route']['kwargs']['booking_id']  # type: ignore
        
        # Check security authorization
        authorized = await is_authorized_for_booking(user, self.booking_id)
        if not authorized:
            await self.close(code=4003)
            return

        self.group_name = f"booking_{self.booking_id}"

        # Join booking group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, code):
        # Leave booking group
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        if text_data is None:
            return
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception:
            pass

    async def booking_update(self, event):
        # Send update details to client
        await self.send(text_data=json.dumps(event["data"]))


# ─── REAL-TIME CHAT CONSUMER ──────────────────────────────────────────────
from bookings.models import ChatMessage

@database_sync_to_async
def get_booking(booking_id):
    try:
        return Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return None

@database_sync_to_async
def is_authorized_for_chat(user, booking):
    if not booking:
        return False
    if not booking.worker_id:
        return False
    if booking.status in ['searching', 'cancelled']:
        return False
    if booking.customer_id == user.id or booking.worker_id == user.id:
        return True
    return False

@database_sync_to_async
def save_chat_message(booking_id, sender_id, message_text):
    try:
        booking = Booking.objects.get(id=booking_id)
        # Determine the receiver
        if booking.customer_id == sender_id:
            receiver_id = booking.worker_id
        else:
            receiver_id = booking.customer_id
        
        if not receiver_id:
            return None
            
        msg = ChatMessage.objects.create(
            booking=booking,
            sender_id=sender_id,
            receiver_id=receiver_id,
            message=message_text,
            is_read=False
        )
        return {
            'id': msg.id,
            'booking_id': booking.id,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'message': msg.message,
            'created_at': msg.created_at.isoformat(),
            'is_read': msg.is_read,
            'message_type': msg.message_type
        }
    except Exception as e:
        print("Error saving message:", e)
        return None

@database_sync_to_async
def mark_messages_as_read(booking_id, user_id):
    try:
        updated = ChatMessage.objects.filter(booking_id=booking_id, receiver_id=user_id, is_read=False).update(is_read=True)
        return updated > 0
    except Exception as e:
        print("Error marking messages read:", e)
        return False

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4003)
            return

        self.booking_id = self.scope['url_route']['kwargs']['booking_id']
        booking = await get_booking(self.booking_id)
        
        # Check security authorization
        authorized = await is_authorized_for_chat(user, booking)
        if not authorized:
            await self.close(code=4003)
            return

        self.room_group_name = f"chat_booking_{self.booking_id}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        
        # Auto-mark existing messages as read upon connection
        await mark_messages_as_read(self.booking_id, user.id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_messages_read",
                "reader_id": user.id
            }
        )

    async def disconnect(self, code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        if text_data is None:
            return
        
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            return
            
        try:
            data = json.loads(text_data)
            action_type = data.get('type')
            
            if action_type == 'message':
                message_text = data.get('message', '').strip()
                if not message_text:
                    return
                
                # Save message to DB
                saved_msg = await save_chat_message(self.booking_id, user.id, message_text)
                if saved_msg:
                    # Broadcast message to room group
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "chat_message",
                            "message": saved_msg
                        }
                    )
                    
                    # Also notify via booking status group so dashboards show unread badges
                    await self.channel_layer.group_send(
                        f"booking_{self.booking_id}",
                        {
                            "type": "booking_update",
                            "data": {
                                "type": "chat_message_received",
                                "message": saved_msg
                            }
                        }
                    )
            elif action_type == 'mark_read':
                # Mark as read
                marked = await mark_messages_as_read(self.booking_id, user.id)
                if marked:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "chat_messages_read",
                            "reader_id": user.id
                        }
                    )
        except Exception as e:
            print("ChatConsumer receive error:", e)

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "type": "message",
            "message": event["message"]
        }))

    async def chat_messages_read(self, event):
        # Send read notification to WebSocket
        await self.send(text_data=json.dumps({
            "type": "messages_read",
            "reader_id": event["reader_id"]
        }))

