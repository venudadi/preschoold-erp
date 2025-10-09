import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, List, ListItem, ListItemText, Badge, IconButton } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

// Classroom Announcements UI (teacher: post, parent: view)
export default function ClassroomAnnouncements({ classroomId, role }) {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unread, setUnread] = useState(0);

  const fetchAnnouncements = async () => {
    // Don't fetch if classroomId is undefined
    if (!classroomId) {
      setAnnouncements([]);
      setUnread(0);
      return;
    }

    try {
      const res = await fetch(`/api/classroom-announcements/${classroomId}`);

      if (!res.ok) {
        console.error(`Failed to fetch announcements: ${res.status}`);
        setAnnouncements([]);
        setUnread(0);
        return;
      }

      const data = await res.json();

      // Ensure data is an array
      const announcementsArray = Array.isArray(data) ? data : [];
      setAnnouncements(announcementsArray);
      setUnread(announcementsArray.filter(a => !a.read).length); // Placeholder for unread logic
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
      setUnread(0);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // Optionally, subscribe to push notifications here
  }, [classroomId]);

  const handlePost = async () => {
    await fetch('/api/classroom-announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroom_id: classroomId, title, message })
    });
    setTitle('');
    setMessage('');
    fetchAnnouncements();
  };

  return (
    <Box p={2}>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h6" flexGrow={1}>Classroom Announcements</Typography>
        <Badge badgeContent={unread} color="error">
          <IconButton>
            <NotificationsActiveIcon />
          </IconButton>
        </Badge>
      </Box>
      {role === 'teacher' && (
        <Box mb={2}>
          <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} fullWidth margin="dense" />
          <TextField label="Message" value={message} onChange={e => setMessage(e.target.value)} fullWidth margin="dense" multiline rows={2} />
          <Button variant="contained" onClick={handlePost} disabled={!title || !message}>Post Announcement</Button>
        </Box>
      )}
      <List>
        {announcements && announcements.length > 0 ? (
          announcements.map(a => (
            <ListItem key={a.id} alignItems="flex-start">
              <ListItemText
                primary={<b>{a.title}</b>}
                secondary={<>
                  <Typography variant="body2">{a.message}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(a.posted_at).toLocaleString()}</Typography>
                </>}
              />
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="body2" color="text.secondary" align="center">
                  {!classroomId ? 'No classroom assigned' : 'No announcements yet'}
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
}
