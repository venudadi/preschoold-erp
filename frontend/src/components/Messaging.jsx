import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Grid, List, ListItem, ListItemText, Badge, CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../services/api';

const Messaging = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // Fetch threads for user
  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messaging/threads');
      setThreads(res.data.threads || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
      // Handle 403 or other errors gracefully
      if (error.response?.status === 403) {
        console.warn('Access forbidden: User may not have permission to access messaging');
      }
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchThreads(); }, [refresh]);

  // Fetch messages for selected thread
  const fetchMessages = async (threadId) => {
    try {
      const res = await api.get(`/messaging/threads/${threadId}/messages`);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };
  useEffect(() => {
    if (selectedThread) fetchMessages(selectedThread.id);
  }, [selectedThread, refresh]);

  // Select a thread
  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    setMessageText('');
  };

  // Send a message
  const handleSend = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      // Determine recipient
      let recipient_id = user.role === 'parent' ? selectedThread.teacher_id : selectedThread.parent_id;
      await api.post(`/messaging/threads/${selectedThread.id}/messages`, { recipient_id, content: messageText });
      setMessageText('');
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show an error to the user
    } finally {
      setSending(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Typography variant="h6">Conversations</Typography>
        <List>
          {threads.map(thread => (
            <ListItem button key={thread.id} selected={selectedThread?.id === thread.id} onClick={() => handleSelectThread(thread)}>
              <ListItemText
                primary={`Child: ${thread.child_id}`}
                secondary={user.role === 'parent' ? `Teacher: ${thread.teacher_id}` : `Parent: ${thread.parent_id}`}
              />
              {/* Notification badge for unread messages */}
              {messages.some(m => !m.is_read && m.recipient_id === user.id) && selectedThread?.id === thread.id && (
                <Badge color="primary" variant="dot" />
              )}
            </ListItem>
          ))}
        </List>
      </Grid>
      <Grid item xs={12} md={8}>
        {selectedThread ? (
          <Card sx={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, overflowY: 'auto', maxHeight: 350 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ marginBottom: 8, textAlign: msg.sender_id === user.id ? 'right' : 'left' }}>
                  <Typography variant="body2" color={msg.sender_id === user.id ? 'primary' : 'secondary'}>
                    {msg.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(msg.sent_at).toLocaleString()}</Typography>
                </div>
              ))}
            </CardContent>
            <div style={{ display: 'flex', alignItems: 'center', padding: 8 }}>
              <TextField
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                fullWidth
                placeholder="Type your message..."
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                disabled={sending}
              />
              <IconButton color="primary" onClick={handleSend} disabled={sending || !messageText.trim()}>
                <SendIcon />
              </IconButton>
            </div>
          </Card>
        ) : (
          <Typography variant="body1" sx={{ mt: 4 }}>Select a conversation to view messages.</Typography>
        )}
      </Grid>
    </Grid>
  );
};

export default Messaging;
