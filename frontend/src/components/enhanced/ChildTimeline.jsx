import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  LinearProgress,
  Fab,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  PlayArrow,
  Check,
  Schedule,
  PhotoCamera,
  Restaurant,
  DirectionsRun,
  MenuBook,
  Bedtime,
  EmojiEvents,
  Favorite,
  Share,
  ExpandMore,
  Close,
  School,
  Group,
  LocalDining,
  SportsEsports
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Vibrant theme colors
const colors = {
  completed: '#4CAF50',
  current: '#FF9800',
  upcoming: '#2196F3',
  highlight: '#E91E63',
  background: {
    morning: 'linear-gradient(135deg, #FFE082 0%, #FFCC02 100%)',
    afternoon: 'linear-gradient(135deg, #81C784 0%, #4CAF50 100%)',
    evening: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)'
  }
};

// Activity icons mapping
const activityIcons = {
  arrival: '🌅',
  breakfast: '🥞',
  circle_time: '🎵',
  art_crafts: '🎨',
  outdoor_play: '🏃‍♀️',
  lunch: '🍽️',
  nap_time: '😴',
  story_time: '📚',
  music: '🎼',
  snack: '🍎',
  free_play: '🧸',
  departure: '👋'
};

// Floating particles for timeline
const TimelineParticles = ({ isActive }) => {
  if (!isActive) return null;

  const particles = Array.from({ length: 6 }, (_, i) => i);

  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {particles.map(i => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 4,
            height: 4,
            background: colors.highlight,
            borderRadius: '50%',
            left: '50%',
            top: '50%'
          }}
          animate={{
            x: [-20, 20, -20],
            y: [-20, 20, -20],
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
    </Box>
  );
};

// Timeline item component with enhanced animations
const TimelineItemComponent = ({ activity, index, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const iconRef = useRef(null);

  const getStatusColor = () => {
    switch (activity.status) {
      case 'completed': return colors.completed;
      case 'current': return colors.current;
      case 'upcoming': return colors.upcoming;
      default: return colors.upcoming;
    }
  };

  const getStatusIcon = () => {
    switch (activity.status) {
      case 'completed': return <Check />;
      case 'current': return <PlayArrow />;
      case 'upcoming': return <Schedule />;
      default: return <Schedule />;
    }
  };

  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <TimelineItem>
        <TimelineOppositeContent sx={{ flex: 0.3 }}>
          <Typography
            variant="body2"
            sx={{
              color: getStatusColor(),
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            {activity.time}
          </Typography>
        </TimelineOppositeContent>

        <TimelineSeparator>
          <motion.div
            animate={activity.status === 'current' ? {
              scale: [1, 1.2, 1],
              rotate: [0, 360]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <TimelineDot
              sx={{
                bgcolor: getStatusColor(),
                width: 48,
                height: 48,
                border: activity.status === 'current' ? '3px solid white' : 'none',
                boxShadow: activity.status === 'current' ? '0 0 20px rgba(255, 152, 0, 0.5)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'visible'
              }}
              onClick={() => onClick(activity)}
            >
              {/* Activity emoji */}
              <motion.div
                animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
                style={{ fontSize: '20px' }}
              >
                {activity.emoji || '⭐'}
              </motion.div>

              {/* Floating particles for current activity */}
              {activity.status === 'current' && (
                <TimelineParticles isActive={true} />
              )}

              {/* Completion sparkle */}
              <AnimatePresence>
                {activity.status === 'completed' && isHovered && (
                  <motion.div
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    exit={{ scale: 0, rotate: 180 }}
                    style={{
                      position: 'absolute',
                      fontSize: '16px',
                      top: -10,
                      right: -10
                    }}
                  >
                    ✨
                  </motion.div>
                )}
              </AnimatePresence>
            </TimelineDot>
          </motion.div>

          <TimelineConnector
            sx={{
              bgcolor: activity.status === 'completed' ? colors.completed : 'rgba(0,0,0,0.1)',
              height: activity.status === 'current' ? '60px' : '40px',
              transition: 'all 0.3s ease'
            }}
          />
        </TimelineSeparator>

        <TimelineContent sx={{ flex: 1 }}>
          <motion.div
            whileHover={{ x: 5 }}
            onClick={() => onClick(activity)}
            style={{ cursor: 'pointer' }}
          >
            <Card
              sx={{
                background: activity.status === 'current'
                  ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.1))'
                  : 'rgba(255, 255, 255, 0.9)',
                border: activity.status === 'current' ? '2px solid #FF9800' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: '16px',
                boxShadow: activity.status === 'current'
                  ? '0 4px 20px rgba(255, 152, 0, 0.2)'
                  : '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 'bold',
                      color: activity.status === 'current' ? colors.current : 'inherit'
                    }}
                  >
                    {activity.activity}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {activity.photos && activity.photos.length > 0 && (
                      <Badge badgeContent={activity.photos.length} color="primary">
                        <PhotoCamera sx={{ fontSize: 16, color: colors.highlight }} />
                      </Badge>
                    )}

                    <Chip
                      label={activity.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(),
                        color: 'white',
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}
                    />
                  </Box>
                </Box>

                {activity.description && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    {activity.description}
                  </Typography>
                )}

                {activity.highlights && activity.highlights.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {activity.highlights.map((highlight, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Chip
                          label={highlight}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </motion.div>
                    ))}
                  </Box>
                )}

                {/* Progress indicator for current activity */}
                {activity.status === 'current' && activity.progress && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption">Progress</Typography>
                      <Typography variant="caption">{activity.progress}%</Typography>
                    </Box>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                    >
                      <LinearProgress
                        variant="determinate"
                        value={activity.progress || 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(255, 152, 0, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: colors.current,
                            borderRadius: 3
                          }
                        }}
                      />
                    </motion.div>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TimelineContent>
      </TimelineItem>
    </motion.div>
  );
};

// Activity detail dialog
const ActivityDetailDialog = ({ activity, open, onClose }) => {
  if (!activity) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '20px', overflow: 'hidden' }
      }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${colors.highlight}, rgba(233, 30, 99, 0.8))`,
          color: 'white',
          textAlign: 'center',
          position: 'relative'
        }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <span style={{ fontSize: '24px' }}>{activity.emoji || '⭐'}</span>
            {activity.activity}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white'
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {/* Time and status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: colors.current }}>
                {activity.time}
              </Typography>
              <Chip
                label={activity.status}
                sx={{
                  bgcolor: activity.status === 'completed' ? colors.completed :
                           activity.status === 'current' ? colors.current : colors.upcoming,
                  color: 'white',
                  textTransform: 'capitalize'
                }}
              />
            </Box>

            {/* Description */}
            {activity.description && (
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                {activity.description}
              </Typography>
            )}

            {/* Highlights */}
            {activity.highlights && activity.highlights.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: colors.highlight }}>
                  Highlights
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {activity.highlights.map((highlight, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Chip
                        label={highlight}
                        variant="outlined"
                        sx={{ borderColor: colors.highlight }}
                      />
                    </motion.div>
                  ))}
                </Box>
              </Box>
            )}

            {/* Photos */}
            {activity.photos && activity.photos.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: colors.highlight }}>
                  Photos ({activity.photos.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
                  {activity.photos.map((photo, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '12px',
                          bgcolor: colors.upcoming,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          minWidth: 80,
                          backgroundImage: photo.url ? `url(${photo.url})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {!photo.url && <PhotoCamera sx={{ color: 'white' }} />}
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </Box>
            )}

            {/* Teacher notes */}
            {activity.teacherNotes && (
              <Box sx={{
                mt: 2,
                p: 2,
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                borderRadius: '12px',
                borderLeft: `4px solid ${colors.completed}`
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: colors.completed }}>
                  Teacher's Note
                </Typography>
                <Typography variant="body2">
                  {activity.teacherNotes}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
};

const ChildTimeline = ({ child, highlights = [] }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Sample timeline data with enhanced details
  const [timelineData, setTimelineData] = useState([
    {
      id: 1,
      time: '8:30 AM',
      activity: 'Arrival & Morning Greeting',
      emoji: '🌅',
      status: 'completed',
      description: 'Emma arrived with a big smile and shared her weekend adventures with friends.',
      highlights: ['Happy arrival', 'Shared stories', 'Made friends laugh'],
      teacherNotes: 'Emma was very enthusiastic today and helped comfort a new student.',
      photos: [
        { id: 1, url: null, caption: 'Morning circle time' },
        { id: 2, url: null, caption: 'Playing with blocks' }
      ]
    },
    {
      id: 2,
      time: '9:00 AM',
      activity: 'Circle Time & Songs',
      emoji: '🎵',
      status: 'completed',
      description: 'Participated in songs and shared about the weather.',
      highlights: ['Led weather song', 'Good participation'],
      progress: 100,
      photos: []
    },
    {
      id: 3,
      time: '10:00 AM',
      activity: 'Art & Creative Expression',
      emoji: '🎨',
      status: 'current',
      description: 'Currently working on a beautiful painting with watercolors.',
      highlights: ['Creative colors', 'Focus on details'],
      progress: 65,
      photos: [
        { id: 3, url: null, caption: 'Artwork in progress' }
      ]
    },
    {
      id: 4,
      time: '11:30 AM',
      activity: 'Outdoor Adventures',
      emoji: '🏃‍♀️',
      status: 'upcoming',
      description: 'Playground time with friends and nature exploration.',
      highlights: [],
      photos: []
    },
    {
      id: 5,
      time: '12:00 PM',
      activity: 'Lunch & Social Time',
      emoji: '🍽️',
      status: 'upcoming',
      description: 'Nutritious lunch and conversation with friends.',
      highlights: [],
      photos: []
    },
    {
      id: 6,
      time: '1:00 PM',
      activity: 'Quiet Rest Time',
      emoji: '😴',
      status: 'upcoming',
      description: 'Peaceful rest with soft music and story.',
      highlights: [],
      photos: []
    },
    {
      id: 7,
      time: '2:30 PM',
      activity: 'Story & Learning Time',
      emoji: '📚',
      status: 'upcoming',
      description: 'Interactive storytelling and learning activities.',
      highlights: [],
      photos: []
    },
    {
      id: 8,
      time: '3:30 PM',
      activity: 'Free Play & Friends',
      emoji: '🧸',
      status: 'upcoming',
      description: 'Free choice activities and social play.',
      highlights: [],
      photos: []
    }
  ]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setDetailOpen(true);
  };

  const currentActivity = timelineData.find(item => item.status === 'current');
  const completedCount = timelineData.filter(item => item.status === 'completed').length;
  const totalCount = timelineData.length;

  return (
    <Box sx={{ p: 2, maxHeight: '70vh', overflow: 'auto' }}>
      {/* Header with progress */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <span style={{ fontSize: '24px' }}>📅</span>
            {child?.name}'s Day Timeline
          </Typography>

          {/* Progress indicator */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Daily Progress
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {completedCount} of {totalCount} activities
              </Typography>
            </Box>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1 }}
            >
              <LinearProgress
                variant="determinate"
                value={(completedCount / totalCount) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(76, 175, 80, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: colors.completed,
                    borderRadius: 4
                  }
                }}
              />
            </motion.div>
          </Box>

          {/* Current activity highlight */}
          {currentActivity && (
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(255, 152, 0, 0.4)',
                  '0 0 0 10px rgba(255, 152, 0, 0)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Card sx={{
                background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.1))',
                border: '2px solid #FF9800',
                borderRadius: '16px',
                p: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ fontSize: '32px' }}>
                    {currentActivity.emoji}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: colors.current }}>
                      Currently: {currentActivity.activity}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Started at {currentActivity.time}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => handleActivityClick(currentActivity)}
                    sx={{ color: colors.current }}
                  >
                    <ExpandMore />
                  </IconButton>
                </Box>
              </Card>
            </motion.div>
          )}
        </Box>
      </motion.div>

      {/* Timeline */}
      <Timeline>
        <AnimatePresence>
          {timelineData.map((activity, index) => (
            <TimelineItemComponent
              key={activity.id}
              activity={activity}
              index={index}
              isActive={activity.status === 'current'}
              onClick={handleActivityClick}
            />
          ))}
        </AnimatePresence>
      </Timeline>

      {/* Activity Detail Dialog */}
      <ActivityDetailDialog
        activity={selectedActivity}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Floating refresh button */}
      <motion.div
        style={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          zIndex: 1000
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Fab
          size="small"
          sx={{
            background: colors.highlight,
            color: 'white',
            '&:hover': {
              background: colors.highlight,
              transform: 'scale(1.05)'
            }
          }}
          onClick={() => {
            // Refresh timeline data
            console.log('Refreshing timeline...');
          }}
        >
          <Schedule />
        </Fab>
      </motion.div>
    </Box>
  );
};

export default ChildTimeline;