import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Divider,
  Stack,
  Paper,
  Fab,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Notifications,
  PhotoCamera,
  Mic,
  Message,
  Schedule,
  EmojiEvents,
  LocalDining,
  School,
  Favorite,
  ExpandMore,
  ExpandLess,
  MarkEmailRead,
  Reply,
  Share,
  Close,
  VolumeUp,
  Download,
  Star,
  Info,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Vibrant colors
const colors = {
  photo: '#E91E63',
  voice: '#FF9800',
  message: '#2196F3',
  achievement: '#4CAF50',
  alert: '#F44336',
  meal: '#FF5722',
  activity: '#9C27B0',
  general: '#607D8B'
};

// Custom notification illustrations (SVG components)
const NotificationIllustration = ({ type, size = 80 }) => {
  const illustrations = {
    photo: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="photoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.photo, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#C2185B', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#photoGradient)" />
        <rect x="25" y="30" width="50" height="35" rx="5" fill="white" />
        <circle cx="35" cy="40" r="3" fill={colors.photo} />
        <polygon points="25,55 35,45 45,50 65,35 75,40 75,65 25,65" fill="#FFE0E6" />
        <motion.circle
          cx="50"
          cy="25"
          r="8"
          fill="white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <text x="50" y="30" textAnchor="middle" fill={colors.photo} fontSize="8">📸</text>
      </svg>
    ),
    voice: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="voiceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.voice, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F57C00', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#voiceGradient)" />
        <rect x="40" y="25" width="20" height="30" rx="10" fill="white" />
        <motion.path
          d="M 60 40 Q 70 40 70 50 Q 70 60 60 60"
          stroke="white"
          strokeWidth="3"
          fill="none"
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.path
          d="M 65 35 Q 80 35 80 50 Q 80 65 65 65"
          stroke="white"
          strokeWidth="2"
          fill="none"
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
      </svg>
    ),
    message: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="messageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.message, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1976D2', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#messageGradient)" />
        <rect x="20" y="30" width="60" height="35" rx="8" fill="white" />
        <motion.polygon
          points="50,55 25,35 75,35"
          fill={colors.message}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <text x="50" y="80" textAnchor="middle" fill="white" fontSize="12">💌</text>
      </svg>
    ),
    achievement: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="achievementGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.achievement, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#388E3C', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#achievementGradient)" />
        <motion.polygon
          points="50,20 60,40 80,40 65,55 70,75 50,65 30,75 35,55 20,40 40,40"
          fill="#FFD700"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <circle cx="50" cy="50" r="15" fill="white" />
        <text x="50" y="55" textAnchor="middle" fill={colors.achievement} fontSize="12">🏆</text>
      </svg>
    ),
    meal: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="mealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.meal, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#D84315', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#mealGradient)" />
        <ellipse cx="50" cy="55" rx="25" ry="15" fill="white" />
        <ellipse cx="50" cy="45" rx="20" ry="10" fill="#FFF3E0" />
        <motion.circle
          cx="40"
          cy="45"
          r="3"
          fill={colors.meal}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.circle
          cx="50"
          cy="42"
          r="2"
          fill={colors.meal}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.circle
          cx="60"
          cy="47"
          r="2.5"
          fill={colors.meal}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </svg>
    ),
    activity: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="activityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.activity, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7B1FA2', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#activityGradient)" />
        <motion.rect
          x="35"
          y="35"
          width="30"
          height="30"
          rx="5"
          fill="white"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <text x="50" y="55" textAnchor="middle" fill={colors.activity} fontSize="14">🎨</text>
      </svg>
    )
  };

  return illustrations[type] || illustrations.general;
};

// Floating notification component
const FloatingNotification = ({ notification, onDismiss, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{ marginBottom: '16px' }}
    >
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `2px solid ${colors[notification.type] || colors.general}`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1)`,
          overflow: 'hidden',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 40px rgba(0, 0, 0, 0.15)`
          }
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Custom illustration */}
            <Box sx={{ flexShrink: 0 }}>
              <NotificationIllustration type={notification.type} size={60} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold', color: colors[notification.type] || colors.general }}
                >
                  {notification.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {notification.unread && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge
                        variant="dot"
                        color="error"
                        sx={{
                          '& .MuiBadge-dot': {
                            width: 8,
                            height: 8
                          }
                        }}
                      />
                    </motion.div>
                  )}
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {notification.time}
                  </Typography>
                </Box>
              </Box>

              {/* Message */}
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: expanded ? 'none' : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {notification.message}
              </Typography>

              {/* Tags */}
              {notification.tags && notification.tags.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {notification.tags.map((tag, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Chip
                        label={tag}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: `${colors[notification.type]}20`,
                          color: colors[notification.type],
                          border: `1px solid ${colors[notification.type]}30`
                        }}
                      />
                    </motion.div>
                  ))}
                </Box>
              )}

              {/* Actions */}
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {notification.hasAttachment && (
                    <Tooltip title="View attachment">
                      <IconButton size="small" sx={{ color: colors[notification.type] }}>
                        <PhotoCamera fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {notification.hasVoice && (
                    <Tooltip title="Play voice message">
                      <IconButton size="small" sx={{ color: colors.voice }}>
                        <VolumeUp fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {notification.canReply && (
                    <Tooltip title="Reply">
                      <IconButton size="small" sx={{ color: colors.message }}>
                        <Reply fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {notification.expandable && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                      }}
                      sx={{ color: 'text.secondary' }}
                    >
                      {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )}
                  {notification.unread && (
                    <Tooltip title="Mark as read">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(notification.id);
                        }}
                        sx={{ color: colors.achievement }}
                      >
                        <MarkEmailRead fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Expanded content */}
              <Collapse in={expanded}>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  {notification.fullContent && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {notification.fullContent}
                    </Typography>
                  )}
                  {notification.attachments && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {notification.attachments.map((attachment, i) => (
                        <Chip
                          key={i}
                          label={attachment.name}
                          icon={<PhotoCamera />}
                          variant="outlined"
                          size="small"
                          clickable
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const NotificationHub = ({ notifications: propNotifications = [] }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // Sample notifications with rich content
  useEffect(() => {
    const sampleNotifications = [
      {
        id: 1,
        type: 'photo',
        title: '📸 New Photos Available!',
        message: 'Emma created a beautiful artwork during today\'s creative session. Check out her masterpiece!',
        fullContent: 'Emma showed exceptional creativity today, mixing colors to create a vibrant landscape painting. She was particularly excited about the rainbow she painted in the corner.',
        time: '10 minutes ago',
        unread: true,
        hasAttachment: true,
        expandable: true,
        tags: ['Art Class', 'Creative'],
        attachments: [
          { name: 'artwork_1.jpg', type: 'image' },
          { name: 'artwork_2.jpg', type: 'image' }
        ]
      },
      {
        id: 2,
        type: 'voice',
        title: '🎤 Voice Message from Ms. Sarah',
        message: 'Your teacher has sent you a personal voice message about Emma\'s day.',
        time: '25 minutes ago',
        unread: true,
        hasVoice: true,
        canReply: true,
        tags: ['Teacher Message'],
        duration: '1:23'
      },
      {
        id: 3,
        type: 'achievement',
        title: '🏆 New Milestone Reached!',
        message: 'Emma successfully tied her shoes all by herself today! This is a big step in developing independence.',
        fullContent: 'Emma has been practicing tying her shoes for weeks, and today she accomplished this important milestone completely independently. She was so proud and excited to show her friends!',
        time: '1 hour ago',
        unread: false,
        expandable: true,
        tags: ['Milestone', 'Independence', 'Motor Skills']
      },
      {
        id: 4,
        type: 'meal',
        title: '🍽️ Lunchtime Update',
        message: 'Emma enjoyed a healthy lunch today and tried a new vegetable - broccoli! She ate most of her meal.',
        time: '2 hours ago',
        unread: false,
        tags: ['Nutrition', 'Healthy Eating']
      },
      {
        id: 5,
        type: 'activity',
        title: '🎨 Art Class Highlights',
        message: 'Emma collaborated beautifully with friends during group art project. She showed great teamwork skills.',
        time: '3 hours ago',
        unread: false,
        tags: ['Teamwork', 'Social Skills', 'Art']
      },
      {
        id: 6,
        type: 'message',
        title: '💌 Reminder: Show and Tell',
        message: 'Don\'t forget about tomorrow\'s show and tell! Emma is excited to share her favorite book.',
        time: '4 hours ago',
        unread: true,
        canReply: true,
        tags: ['Reminder', 'Show and Tell']
      }
    ];

    setNotifications(sampleNotifications);
    setUnreadCount(sampleNotifications.filter(n => n.unread).length);
  }, [propNotifications]);

  const handleMarkAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return notification.unread;
    return notification.type === filter;
  });

  const notificationTypes = [
    { key: 'all', label: 'All', icon: '📋', count: notifications.length },
    { key: 'unread', label: 'Unread', icon: '🔔', count: unreadCount },
    { key: 'photo', label: 'Photos', icon: '📸', count: notifications.filter(n => n.type === 'photo').length },
    { key: 'voice', label: 'Voice', icon: '🎤', count: notifications.filter(n => n.type === 'voice').length },
    { key: 'achievement', label: 'Achievements', icon: '🏆', count: notifications.filter(n => n.type === 'achievement').length }
  ];

  return (
    <Box sx={{ p: 2, maxHeight: '70vh', overflow: 'auto' }}>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <span style={{ fontSize: '24px' }}>💌</span>
            Messages & Updates
            {unreadCount > 0 && (
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '10px',
                    height: '18px',
                    minWidth: '18px'
                  }
                }}
              >
                <Box sx={{ width: 10 }} />
              </Badge>
            )}
          </Typography>

          {/* Filter tabs */}
          <Box sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { display: 'none' }
          }}>
            {notificationTypes.map((type) => (
              <motion.div
                key={type.key}
                whileTap={{ scale: 0.95 }}
              >
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                      {type.count > 0 && (
                        <Badge
                          badgeContent={type.count}
                          color="primary"
                          sx={{ ml: 0.5, '& .MuiBadge-badge': { fontSize: '0.6rem', height: '16px', minWidth: '16px' } }}
                        />
                      )}
                    </Box>
                  }
                  onClick={() => setFilter(type.key)}
                  variant={filter === type.key ? 'filled' : 'outlined'}
                  color={filter === type.key ? 'primary' : 'default'}
                  sx={{
                    borderRadius: '20px',
                    fontWeight: filter === type.key ? 'bold' : 'normal',
                    '& .MuiChip-label': { px: 2 }
                  }}
                />
              </motion.div>
            ))}
          </Box>
        </Box>
      </motion.div>

      {/* Notifications list */}
      <Box sx={{ position: 'relative' }}>
        <AnimatePresence>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <FloatingNotification
                key={notification.id}
                notification={notification}
                onDismiss={handleMarkAsRead}
                index={index}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(156, 39, 176, 0.1))',
                  border: '2px dashed rgba(0,0,0,0.1)'
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontSize: '48px' }}>
                  📭
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  All Caught Up!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filter === 'unread'
                    ? 'No unread messages. You\'re all up to date!'
                    : 'No messages in this category yet.'}
                </Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Quick actions */}
      {unreadCount > 0 && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 1000
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Tooltip title="Mark all as read">
            <Fab
              size="small"
              sx={{
                background: colors.achievement,
                color: 'white',
                '&:hover': { background: '#388E3C' }
              }}
              onClick={() => {
                setNotifications(prev =>
                  prev.map(notification => ({ ...notification, unread: false }))
                );
                setUnreadCount(0);
              }}
            >
              <CheckCircle />
            </Fab>
          </Tooltip>
        </motion.div>
      )}
    </Box>
  );
};

export default NotificationHub;