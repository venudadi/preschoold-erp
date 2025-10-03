import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  IconButton,
  Fab,
  Dialog,
  Slide,
  useTheme,
  alpha,
  Container,
  LinearProgress,
  Badge,
  Chip
} from '@mui/material';
import {
  SwipeableDrawer,
  useMediaQuery
} from '@mui/material';
import {
  Notifications,
  PhotoCamera,
  Mic,
  Timeline,
  EmojiEvents,
  Favorite,
  Star,
  MenuBook,
  LocalDining,
  DirectionsRun,
  Bedtime,
  School,
  ArrowBack,
  Settings,
  Share,
  VideoCall
} from '@mui/icons-material';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import ChildTimeline from './ChildTimeline';
import NotificationHub from './NotificationHub';
import VoiceMessaging from './VoiceMessaging';
import MediaUploader from './MediaUploader';
import ProgressTracker from './ProgressTracker';
import SwipeableViews from './SwipeableViews';

// Enhanced vibrant colors
const theme = {
  primary: {
    main: '#FF6B9D', // Vibrant pink
    light: '#FFB3D1',
    dark: '#E5477A'
  },
  secondary: {
    main: '#4ECDC4', // Turquoise
    light: '#8EEAE6',
    dark: '#26B5A8'
  },
  accent: {
    yellow: '#FFD93D',
    orange: '#FF8A65',
    purple: '#9C27B0',
    green: '#66BB6A',
    blue: '#42A5F5'
  },
  gradient: {
    morning: 'linear-gradient(135deg, #FFD93D 0%, #FF8A65 100%)',
    afternoon: 'linear-gradient(135deg, #42A5F5 0%, #66BB6A 100%)',
    evening: 'linear-gradient(135deg, #9C27B0 0%, #FF6B9D 100%)'
  }
};

// Animated background component
const AnimatedBackground = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGradientByTime = () => {
    const hour = time.getHours();
    if (hour < 12) return theme.gradient.morning;
    if (hour < 17) return theme.gradient.afternoon;
    return theme.gradient.evening;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: getGradientByTime(),
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          animation: 'float 6s ease-in-out infinite'
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(10px, -10px)' }
        }
      }}
    />
  );
};

// Floating elements
const FloatingElements = () => {
  const elements = ['🌟', '🎈', '🌈', '☀️', '🦋', '🌸'];

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
      {elements.map((emoji, index) => (
        <motion.div
          key={index}
          style={{
            position: 'absolute',
            fontSize: '24px',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </Box>
  );
};

// Child profile card component
const ChildProfileCard = ({ child, onTap }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onTap}
    >
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'visible',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          {/* Floating heart animation */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ scale: 0, y: 0 }}
                animate={{ scale: 1, y: -30 }}
                exit={{ scale: 0, y: -50, opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  fontSize: '20px'
                }}
              >
                ❤️
              </motion.div>
            )}
          </AnimatePresence>

          {/* Child avatar with pulse animation */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(255, 107, 157, 0.7)',
                '0 0 0 20px rgba(255, 107, 157, 0)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ borderRadius: '50%', display: 'inline-block' }}
          >
            <Avatar
              src={child.photo}
              sx={{
                width: 80,
                height: 80,
                mb: 2,
                border: '4px solid white',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              {child.name?.charAt(0)}
            </Avatar>
          </motion.div>

          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.primary.dark }}>
            {child.name}
          </Typography>

          <Typography variant="body2" sx={{ color: theme.secondary.dark, mb: 2 }}>
            {child.classroom} • Age {child.age}
          </Typography>

          {/* Status indicators */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Chip
                label={child.status || "At School"}
                color="success"
                size="small"
                sx={{ borderRadius: '12px' }}
              />
            </motion.div>
            <Badge badgeContent={child.newUpdates || 0} color="error">
              <Chip
                label="Updates"
                color="primary"
                size="small"
                sx={{ borderRadius: '12px' }}
              />
            </Badge>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Navigation sections
const navigationSections = [
  {
    id: 'timeline',
    name: 'Day Timeline',
    icon: Timeline,
    color: theme.accent.blue,
    emoji: '📅'
  },
  {
    id: 'notifications',
    name: 'Messages',
    icon: Notifications,
    color: theme.primary.main,
    emoji: '💌'
  },
  {
    id: 'media',
    name: 'Photos & Videos',
    icon: PhotoCamera,
    color: theme.accent.purple,
    emoji: '📸'
  },
  {
    id: 'voice',
    name: 'Voice Messages',
    icon: Mic,
    color: theme.accent.orange,
    emoji: '🎤'
  },
  {
    id: 'progress',
    name: 'Progress',
    icon: EmojiEvents,
    color: theme.accent.yellow,
    emoji: '🏆'
  }
];

const EnhancedParentDashboard = ({ user }) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeSection, setActiveSection] = useState('timeline');
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [dailyHighlights, setDailyHighlights] = useState([]);

  // Load children and initial data
  useEffect(() => {
    loadChildrenData();
    loadNotifications();
    loadDailyHighlights();
  }, []);

  const loadChildrenData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockChildren = [
        {
          id: '1',
          name: 'Emma Johnson',
          classroom: 'Butterfly Class',
          age: 4,
          photo: '/child-avatar-1.jpg',
          status: 'Playing Outside',
          newUpdates: 3
        }
      ];
      setChildren(mockChildren);
      setSelectedChild(mockChildren[0]);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    // Mock notifications
    setNotifications([
      { id: 1, type: 'photo', message: 'New photos from art class!', time: '10:30 AM', unread: true },
      { id: 2, type: 'voice', message: 'Voice message from Ms. Sarah', time: '9:15 AM', unread: true },
      { id: 3, type: 'update', message: 'Emma had a great lunch!', time: '12:45 PM', unread: false }
    ]);
  };

  const loadDailyHighlights = async () => {
    // Mock daily highlights
    setDailyHighlights([
      { time: '8:30 AM', activity: 'Arrival & Breakfast', emoji: '🌅', status: 'completed' },
      { time: '9:00 AM', activity: 'Circle Time', emoji: '🎵', status: 'completed' },
      { time: '10:00 AM', activity: 'Art & Crafts', emoji: '🎨', status: 'current' },
      { time: '11:30 AM', activity: 'Outdoor Play', emoji: '🏃‍♀️', status: 'upcoming' },
      { time: '12:00 PM', activity: 'Lunch Time', emoji: '🍽️', status: 'upcoming' }
    ]);
  };

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = navigationSections.findIndex(s => s.id === activeSection);
      const nextIndex = (currentIndex + 1) % navigationSections.length;
      setActiveSection(navigationSections[nextIndex].id);
    },
    onSwipedRight: () => {
      const currentIndex = navigationSections.findIndex(s => s.id === activeSection);
      const prevIndex = currentIndex === 0 ? navigationSections.length - 1 : currentIndex - 1;
      setActiveSection(navigationSections[prevIndex].id);
    },
    trackMouse: true
  });

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'timeline':
        return <ChildTimeline child={selectedChild} highlights={dailyHighlights} />;
      case 'notifications':
        return <NotificationHub notifications={notifications} />;
      case 'voice':
        return <VoiceMessaging child={selectedChild} />;
      case 'media':
        return <MediaUploader child={selectedChild} />;
      case 'progress':
        return <ProgressTracker child={selectedChild} />;
      default:
        return <ChildTimeline child={selectedChild} highlights={dailyHighlights} />;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.gradient.morning
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Typography variant="h2">🌈</Typography>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <AnimatedBackground />
      <FloatingElements />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2, py: 2 }}>
        {/* Header with welcome message */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            p: 2,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}! 🌟
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {user?.name || 'Parent'}
              </Typography>
            </Box>
            <IconButton sx={{ color: 'white' }}>
              <Settings />
            </IconButton>
          </Box>
        </motion.div>

        {/* Child Profile Card */}
        {selectedChild && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ marginBottom: '24px' }}
          >
            <ChildProfileCard child={selectedChild} onTap={() => {}} />
          </motion.div>
        )}

        {/* Navigation Pills */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Box sx={{
            display: 'flex',
            overflowX: 'auto',
            gap: 2,
            pb: 2,
            mb: 3,
            '&::-webkit-scrollbar': { display: 'none' }
          }}>
            {navigationSections.map((section) => (
              <motion.div
                key={section.id}
                whileTap={{ scale: 0.95 }}
                style={{ minWidth: 'fit-content' }}
              >
                <Card
                  onClick={() => setActiveSection(section.id)}
                  sx={{
                    minWidth: 120,
                    background: activeSection === section.id
                      ? `linear-gradient(135deg, ${section.color}, ${alpha(section.color, 0.7)})`
                      : 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    border: activeSection === section.id ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      {section.emoji}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: activeSection === section.id ? 'white' : theme.primary.dark,
                        fontWeight: 'bold'
                      }}
                    >
                      {section.name}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>
        </motion.div>

        {/* Content Area with Swipe Support */}
        <motion.div
          {...swipeHandlers}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          key={activeSection}
        >
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              minHeight: '60vh',
              overflow: 'hidden'
            }}
          >
            {renderSectionContent()}
          </Card>
        </motion.div>

        {/* Quick Action FAB */}
        <motion.div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Fab
            color="primary"
            sx={{
              background: `linear-gradient(135deg, ${theme.primary.main}, ${theme.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.primary.dark}, ${theme.secondary.dark})`
              }
            }}
          >
            <Favorite />
          </Fab>
        </motion.div>

        {/* Notification Badge */}
        {notifications.filter(n => n.unread).length > 0 && (
          <motion.div
            style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000 }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge
              badgeContent={notifications.filter(n => n.unread).length}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '12px',
                  height: '24px',
                  minWidth: '24px'
                }
              }}
            >
              <IconButton
                sx={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { background: 'rgba(255, 255, 255, 1)' }
                }}
              >
                <Notifications sx={{ color: theme.primary.main }} />
              </IconButton>
            </Badge>
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default EnhancedParentDashboard;