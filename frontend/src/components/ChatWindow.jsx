import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, IconButton, Avatar, Badge, Paper,
  useTheme, useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import api, { buildWsUrl } from '../services/api';
import { tokens } from '../design/tokens';
import toast from 'react-hot-toast';

function ChatWindow({ open, onClose, bookingId, currentUser, otherUser }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socketStatus, setSocketStatus] = useState('connecting'); // 'connecting', 'connected', 'reconnecting', 'disconnected'
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const chatBottomRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Helper to normalize message structure from different sources (REST API vs WebSocket)
  const normalizeMessage = (msg) => {
    if (!msg) return msg;
    const senderVal = msg.sender_id !== undefined ? msg.sender_id : msg.sender;
    const receiverVal = msg.receiver_id !== undefined ? msg.receiver_id : msg.receiver;
    return {
      ...msg,
      sender: typeof senderVal === 'object' && senderVal !== null ? senderVal.id : senderVal,
      receiver: typeof receiverVal === 'object' && receiverVal !== null ? receiverVal.id : receiverVal,
    };
  };

  // 1. Fetch Chat History
  const fetchHistory = async () => {
    try {
      const res = await api.get(`/api/chat/${bookingId}/`);
      setMessages(res.data.map(normalizeMessage));
    } catch (err) {
      console.error('Failed to load chat history', err);
      toast.error('Failed to load chat history');
    }
  };

  // 2. Setup WebSocket Connection with Reconnect Logic
  const connectWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setSocketStatus('disconnected');
      return;
    }

    const wsUrl = buildWsUrl(`/ws/chat/${bookingId}/`, `?token=${token}`);
    
    // Clear existing intervals & sockets if any
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setSocketStatus('connected');
      reconnectAttemptsRef.current = 0;
      // Mark read automatically when socket establishes
      ws.send(JSON.stringify({ type: 'mark_read' }));

      // Setup Heartbeat Ping (every 25 seconds)
      pingIntervalRef.current = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'message') {
          const normalizedMsg = normalizeMessage(payload.message);
          setMessages(prev => {
            // Check for duplicate message ID
            if (prev.some(m => m.id === normalizedMsg.id)) {
              return prev;
            }
            return [...prev, normalizedMsg];
          });
          // If the message came from the other user, mark it as read
          if (Number(normalizedMsg.sender) !== Number(currentUser.id)) {
            ws.send(JSON.stringify({ type: 'mark_read' }));
          }
        } else if (payload.type === 'messages_read') {
          // If other user read the messages, update is_read of our sent messages to true
          const readerId = payload.reader_id;
          if (Number(readerId) !== Number(currentUser.id)) {
            setMessages(prev =>
              prev.map(m => (Number(m.sender) === Number(currentUser.id) ? { ...m, is_read: true } : m))
            );
          }
        }
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    ws.onclose = (e) => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      if (e.code === 4003) {
        setSocketStatus('disconnected');
        return;
      }

      if (reconnectAttemptsRef.current < 5) {
        setSocketStatus('reconnecting');
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      } else {
        setSocketStatus('disconnected');
      }
    };

    ws.onerror = (err) => {
      console.error('[WS Error] Chat WebSocket error:', err);
      ws.close();
    };
  };

  // 3. Mount Logic: Load history first, then connect WebSocket
  useEffect(() => {
    if (open && bookingId) {
      fetchHistory().then(() => {
        connectWebSocket();
      });
    }

    return () => {
      // Cleanup WebSocket connection
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [open, bookingId]);

  // 4. Scroll to Bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 5. Send Message Function
  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'message',
        message: text
      }));
      setInputText('');
    } else {
      toast.error('Unable to send. Chat is disconnected. Reconnecting...');
      connectWebSocket();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to format timestamps (e.g. 10:42 AM)
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  if (!otherUser) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isMobile}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: isMobile ? '0px' : '24px',
          height: isMobile ? '100dvh' : '600px',
          maxHeight: isMobile ? '100dvh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)'
        }
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${tokens.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: tokens.colors.paper
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: socketStatus === 'connected' ? '#44b700' : '#ff9800',
                color: socketStatus === 'connected' ? '#44b700' : '#ff9800',
                boxShadow: `0 0 0 2px #fff`,
                '&::after': {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  animation: socketStatus === 'connected' ? 'ripple 1.2s infinite ease-in-out' : 'none',
                  border: '1px solid currentColor',
                  content: '""',
                },
              },
              '@keyframes ripple': {
                '0%': { transform: 'scale(.8)', opacity: 1 },
                '100%': { transform: 'scale(2.4)', opacity: 0 },
              },
            }}
          >
            <Avatar sx={{ bgcolor: tokens.colors.primary, color: '#fff', fontWeight: 'bold' }}>
              {otherUser.full_name?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {otherUser.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {socketStatus === 'connected' ? 'Online' : socketStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} edge="end" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* MESSAGES LIST */}
      <DialogContent
        sx={{
          p: 3,
          flexGrow: 1,
          overflowY: 'auto',
          bgcolor: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {messages.map((msg) => {
          const isOwnMessage = Number(msg.sender) === Number(currentUser.id);
          return (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
            >
              <Box
                sx={{
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.8,
                    px: 2.2,
                    borderRadius: isOwnMessage ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    bgcolor: isOwnMessage ? tokens.colors.primary : '#ffffff',
                    color: isOwnMessage ? '#ffffff' : '#1e293b',
                    border: isOwnMessage ? 'none' : `1px solid ${tokens.borderColor}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {msg.message}
                  </Typography>
                </Paper>
                
                {/* Meta details: Time and read checkmark */}
                <Box display="flex" alignItems="center" gap={0.5} sx={{ mt: 0.5, px: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {formatTime(msg.created_at)}
                  </Typography>
                  {isOwnMessage && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: msg.is_read ? '#10b981' : '#94a3b8',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        lineHeight: 1
                      }}
                    >
                      {msg.is_read ? '✓✓' : '✓'}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
        <div ref={chatBottomRef} />
      </DialogContent>

      {/* INPUT DRAWER */}
      <DialogActions
        sx={{
          p: 2.5,
          borderTop: `1px solid ${tokens.borderColor}`,
          bgcolor: tokens.colors.paper,
          display: 'flex',
          gap: 1.5,
          alignItems: 'center'
        }}
      >
        <TextField
          fullWidth
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          variant="outlined"
          size="medium"
          disabled={socketStatus === 'disconnected'}
          InputProps={{
            sx: {
              borderRadius: '16px',
              bgcolor: '#f8fafc',
              '& fieldset': { borderColor: tokens.borderColor }
            }
          }}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || socketStatus === 'disconnected'}
          variant="contained"
          sx={{
            minWidth: '50px',
            width: '50px',
            height: '50px',
            borderRadius: '16px',
            bgcolor: tokens.colors.primary,
            color: '#fff',
            p: 0,
            '&:hover': { bgcolor: '#23232F' }
          }}
        >
          <SendIcon />
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ChatWindow;
