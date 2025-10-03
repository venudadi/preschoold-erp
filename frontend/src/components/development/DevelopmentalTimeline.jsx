import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Slider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
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
  Photo,
  VideoLibrary,
  AudioFile,
  Description,
  Psychology,
  DirectionsRun,
  Favorite,
  MenuBook,
  Palette,
  Star,
  FilterList,
  Sort,
  ViewModule,
  ViewList,
  PlayArrow,
  Pause,
  VolumeUp,
  ZoomIn,
  Share,
  Download,
  Edit,
  Add,
  Close,
  ExpandMore,
  CalendarToday,
  School,
  Home,
  EmojiEvents,
  TrendingUp,
  Insights,
  Category
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfDay, endOfDay, isToday, isYesterday, parseISO } from 'date-fns';

// Developmental categories with enhanced metadata
const developmentalCategories = {
  cognitive: {
    name: 'Cognitive',
    emoji: '🧠',
    color: '#9C27B0',
    icon: Psychology,
    description: 'Problem-solving, memory, attention, and thinking skills'
  },
  physical: {
    name: 'Physical',
    emoji: '🏃‍♀️',
    color: '#FF5722',
    icon: DirectionsRun,
    description: 'Motor skills, coordination, and physical development'
  },
  socialEmotional: {
    name: 'Social-Emotional',
    emoji: '❤️',
    color: '#E91E63',
    icon: Favorite,
    description: 'Emotional regulation, empathy, and social interactions'
  },
  language: {
    name: 'Language',
    emoji: '📚',
    color: '#2196F3',
    icon: MenuBook,
    description: 'Communication, vocabulary, and language comprehension'
  },
  creative: {
    name: 'Creative',
    emoji: '🎨',
    color: '#FF9800',
    icon: Palette,
    description: 'Artistic expression, imagination, and creativity'
  },
  adaptive: {
    name: 'Adaptive',
    emoji: '⭐',
    color: '#4CAF50',
    icon: Star,
    description: 'Independence, self-care, and daily living skills'
  }
};

// Mock timeline data with rich developmental metadata
const timelineData = [
  {
    id: '1',
    type: 'photo',
    title: 'Building Block Tower Success!',
    description: 'Emma built a 12-block tower independently, showing excellent fine motor control and spatial reasoning.',
    mediaUrl: '/api/placeholder/400/300',
    thumbnail: '/api/placeholder/150/100',
    timestamp: new Date().toISOString(),
    category: 'cognitive',
    subcategory: 'Problem Solving',
    developmentalMilestone: 'Complex Construction',
    ageAppropriate: true,
    significance: 'advanced',
    teacherNotes: 'This shows significant improvement in spatial awareness and planning. Emma counted each block and checked stability.',
    tags: ['problem-solving', 'fine-motor', 'counting', 'planning'],
    relatedSkills: ['Spatial Reasoning', 'Fine Motor Control', 'Mathematical Concepts'],
    context: 'Free Play Time',
    location: 'Classroom Learning Center',
    duration: '15 minutes',
    peersInvolved: ['Alex', 'Sophie']
  },
  {
    id: '2',
    type: 'video',
    title: 'Playground Leadership Moment',
    description: 'Emma helped resolve a conflict between two friends during outdoor play.',
    mediaUrl: '/api/placeholder/video/300/200',
    thumbnail: '/api/placeholder/150/100',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: 'socialEmotional',
    subcategory: 'Social Skills',
    developmentalMilestone: 'Conflict Resolution',
    ageAppropriate: true,
    significance: 'typical',
    teacherNotes: 'Emma showed empathy by listening to both sides and suggesting a compromise. Great leadership skills.',
    tags: ['empathy', 'leadership', 'conflict-resolution', 'communication'],
    relatedSkills: ['Emotional Intelligence', 'Communication', 'Problem Solving'],
    context: 'Outdoor Play',
    location: 'Playground',
    duration: '8 minutes',
    peersInvolved: ['Maya', 'Jacob']
  },
  {
    id: '3',
    type: 'audio',
    title: 'Storytelling Adventure',
    description: 'Emma created and told an imaginative story about a magical garden.',
    mediaUrl: '/api/placeholder/audio.mp3',
    thumbnail: null,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    category: 'language',
    subcategory: 'Narrative Skills',
    developmentalMilestone: 'Complex Storytelling',
    ageAppropriate: true,
    significance: 'advanced',
    teacherNotes: 'Rich vocabulary, clear sequence, and creative plot development. Used descriptive language beautifully.',
    tags: ['storytelling', 'vocabulary', 'creativity', 'sequencing'],
    relatedSkills: ['Language Development', 'Creative Expression', 'Memory'],
    context: 'Circle Time',
    location: 'Reading Corner',
    duration: '12 minutes',
    peersInvolved: []
  },
  {
    id: '4',
    type: 'photo',
    title: 'Art Masterpiece Creation',
    description: 'Emma painted a detailed self-portrait with remarkable attention to facial features.',
    mediaUrl: '/api/placeholder/400/300',
    thumbnail: '/api/placeholder/150/100',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    category: 'creative',
    subcategory: 'Visual Arts',
    developmentalMilestone: 'Representational Art',
    ageAppropriate: true,
    significance: 'advanced',
    teacherNotes: 'Shows advanced observational skills and artistic technique. Mixed colors independently.',
    tags: ['painting', 'self-expression', 'observation', 'color-mixing'],
    relatedSkills: ['Fine Motor Skills', 'Visual Processing', 'Self-Awareness'],
    context: 'Art Activity',
    location: 'Art Studio',
    duration: '25 minutes',
    peersInvolved: []
  },
  {
    id: '5',
    type: 'video',
    title: 'Independent Shoe Tying Achievement',
    description: 'Emma successfully tied her shoes independently for the first time!',
    mediaUrl: '/api/placeholder/video/300/200',
    thumbnail: '/api/placeholder/150/100',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    category: 'adaptive',
    subcategory: 'Self-Care',
    developmentalMilestone: 'Complex Motor Sequence',
    ageAppropriate: true,
    significance: 'milestone',
    teacherNotes: 'This is a significant milestone! Emma practiced persistently and celebrated her success.',
    tags: ['self-care', 'fine-motor', 'persistence', 'milestone'],
    relatedSkills: ['Fine Motor Control', 'Sequencing', 'Independence'],
    context: 'Getting Ready',
    location: 'Cubbies Area',
    duration: '3 minutes',
    peersInvolved: []
  }
];

// Enhanced media player component
const MediaPlayer = ({ item, onClose }) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const handlePlayPause = () => {
    if (item.type === 'video' && videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    } else if (item.type === 'audio' && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{item.title}</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {item.type === 'photo' && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={item.mediaUrl}
                alt={item.title}
                style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '12px' }}
              />
            </Box>
          )}

          {item.type === 'video' && (
            <Box sx={{ position: 'relative' }}>
              <video
                ref={videoRef}
                src={item.mediaUrl}
                poster={item.thumbnail}
                style={{ width: '100%', borderRadius: '12px' }}
                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
              />
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.7)',
                borderRadius: '0 0 12px 12px',
                p: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton onClick={handlePlayPause} sx={{ color: 'white' }}>
                    {playing ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <Slider
                    value={currentTime}
                    max={duration}
                    onChange={(e, value) => {
                      setCurrentTime(value);
                      if (videoRef.current) videoRef.current.currentTime = value;
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} /
                    {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {item.type === 'audio' && (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 3, bgcolor: developmentalCategories[item.category].color }}>
                <VolumeUp sx={{ fontSize: 60 }} />
              </Avatar>
              <audio
                ref={audioRef}
                src={item.mediaUrl}
                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
              />
              <Box sx={{ mb: 3 }}>
                <IconButton onClick={handlePlayPause} size="large" sx={{ bgcolor: 'primary.main', color: 'white', mr: 2 }}>
                  {playing ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Box>
              <Slider
                value={currentTime}
                max={duration}
                onChange={(e, value) => {
                  setCurrentTime(value);
                  if (audioRef.current) audioRef.current.currentTime = value;
                }}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} /
                {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Developmental insights */}
        <Card sx={{ borderRadius: '12px', mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Avatar sx={{ bgcolor: developmentalCategories[item.category].color, width: 32, height: 32 }}>
                {developmentalCategories[item.category].emoji}
              </Avatar>
              <Typography variant="h6">
                {developmentalCategories[item.category].name} Development
              </Typography>
              <Chip
                label={item.significance}
                size="small"
                sx={{
                  bgcolor: item.significance === 'milestone' ? '#4CAF50' :
                           item.significance === 'advanced' ? '#FF9800' : '#2196F3',
                  color: 'white',
                  ml: 'auto'
                }}
              />
            </Box>

            <Typography variant="body1" sx={{ mb: 2 }}>
              {item.description}
            </Typography>

            <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 2, color: 'text.secondary' }}>
              Teacher's Note: {item.teacherNotes}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Related Skills:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {item.relatedSkills.map(skill => (
                    <Chip key={skill} label={skill} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Context Details:</Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Context:</strong> {item.context}<br />
                  <strong>Duration:</strong> {item.duration}<br />
                  <strong>Location:</strong> {item.location}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

// Timeline item component with enhanced developmental categorization
const TimelineItemCard = ({ item, onMediaClick, isLast }) => {
  const category = developmentalCategories[item.category];
  const [expanded, setExpanded] = useState(false);

  const getTimeString = (timestamp) => {
    const date = parseISO(timestamp);
    if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const getSignificanceColor = (significance) => {
    switch (significance) {
      case 'milestone': return '#4CAF50';
      case 'advanced': return '#FF9800';
      case 'emerging': return '#2196F3';
      default: return '#757575';
    }
  };

  return (
    <TimelineItem>
      <TimelineOppositeContent sx={{ m: 'auto 0', minWidth: 120 }}>
        <Typography variant="body2" color="text.secondary">
          {getTimeString(item.timestamp)}
        </Typography>
        <Chip
          label={item.context}
          size="small"
          sx={{ mt: 0.5, fontSize: '0.7rem' }}
        />
      </TimelineOppositeContent>

      <TimelineSeparator>
        <Badge
          badgeContent={
            item.significance === 'milestone' ? <EmojiEvents sx={{ fontSize: 12, color: '#FFD700' }} /> : null
          }
        >
          <TimelineDot sx={{ bgcolor: category.color, width: 48, height: 48 }}>
            {item.type === 'photo' && <Photo />}
            {item.type === 'video' && <VideoLibrary />}
            {item.type === 'audio' && <AudioFile />}
            {item.type === 'note' && <Description />}
          </TimelineDot>
        </Badge>
        {!isLast && <TimelineConnector sx={{ bgcolor: `${category.color}30`, height: 60 }} />}
      </TimelineSeparator>

      <TimelineContent sx={{ py: '12px', px: 2 }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card sx={{
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${category.color}15, ${category.color}08)`,
            border: `1px solid ${category.color}30`,
            cursor: 'pointer',
            '&:hover': {
              boxShadow: `0 8px 25px ${category.color}40`
            }
          }}
          onClick={() => onMediaClick(item)}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {item.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ bgcolor: category.color, width: 24, height: 24 }}>
                      {category.emoji}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {category.name} • {item.subcategory}
                    </Typography>
                  </Box>
                </Box>

                {item.thumbnail && (
                  <Box sx={{
                    width: 60,
                    height: 40,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    ml: 2,
                    position: 'relative'
                  }}>
                    <img
                      src={item.thumbnail}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {item.type === 'video' && (
                      <PlayArrow sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: 20
                      }} />
                    )}
                  </Box>
                )}
              </Box>

              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                {item.description}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {item.tags.slice(0, 3).map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      bgcolor: `${category.color}20`,
                      color: category.color,
                      fontSize: '0.7rem'
                    }}
                  />
                ))}
                {item.tags.length > 3 && (
                  <Chip
                    label={`+${item.tags.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Milestone: {item.developmentalMilestone}
                  </Typography>
                </Box>
                <Chip
                  label={item.significance}
                  size="small"
                  sx={{
                    bgcolor: getSignificanceColor(item.significance),
                    color: 'white',
                    fontSize: '0.7rem'
                  }}
                />
              </Box>

              {item.peersInvolved.length > 0 && (
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <Typography variant="caption" color="text.secondary">
                    With peers: {item.peersInvolved.join(', ')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </TimelineContent>
    </TimelineItem>
  );
};

const DevelopmentalTimeline = ({ child, activities }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('timeline');
  const [dateRange, setDateRange] = useState('week');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort timeline data
  const filteredData = timelineData
    .filter(item => filterCategory === 'all' || item.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'significance':
          const significanceOrder = { milestone: 3, advanced: 2, emerging: 1, typical: 0 };
          return significanceOrder[b.significance] - significanceOrder[a.significance];
        default:
          return 0;
      }
    });

  // Statistics for insights
  const categoryStats = Object.keys(developmentalCategories).map(key => {
    const categoryData = filteredData.filter(item => item.category === key);
    return {
      category: key,
      count: categoryData.length,
      milestones: categoryData.filter(item => item.significance === 'milestone').length,
      advanced: categoryData.filter(item => item.significance === 'advanced').length
    };
  }).filter(stat => stat.count > 0);

  return (
    <Box>
      {/* Header with statistics */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline />
          Developmental Timeline
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 'bold' }}>
                {filteredData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Moments
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                {filteredData.filter(item => item.significance === 'milestone').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Milestones
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                {filteredData.filter(item => item.significance === 'advanced').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced Skills
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#E91E63', fontWeight: 'bold' }}>
                {Object.keys(developmentalCategories).filter(cat =>
                  filteredData.some(item => item.category === cat)
                ).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Areas
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Controls and filters */}
      <Box sx={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        p: 3,
        backdropFilter: 'blur(20px)',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Activity Timeline
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              sx={{ color: 'white' }}
            >
              <FilterList />
            </IconButton>
            <IconButton
              onClick={() => setViewMode(viewMode === 'timeline' ? 'grid' : 'timeline')}
              sx={{ color: 'white' }}
            >
              {viewMode === 'timeline' ? <ViewModule /> : <ViewList />}
            </IconButton>
          </Box>
        </Box>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Category</InputLabel>
                    <Select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.3)'
                        },
                        '& .MuiSelect-icon': {
                          color: 'white'
                        },
                        color: 'white'
                      }}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      {Object.entries(developmentalCategories).map(([key, category]) => (
                        <MenuItem key={key} value={key}>
                          {category.emoji} {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.3)'
                        },
                        '& .MuiSelect-icon': {
                          color: 'white'
                        },
                        color: 'white'
                      }}
                    >
                      <MenuItem value="recent">Most Recent</MenuItem>
                      <MenuItem value="oldest">Oldest First</MenuItem>
                      <MenuItem value="significance">By Significance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Time Period</InputLabel>
                    <Select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.3)'
                        },
                        '& .MuiSelect-icon': {
                          color: 'white'
                        },
                        color: 'white'
                      }}
                    >
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="week">This Week</MenuItem>
                      <MenuItem value="month">This Month</MenuItem>
                      <MenuItem value="all">All Time</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category overview */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          <Chip
            label="All"
            onClick={() => setFilterCategory('all')}
            sx={{
              bgcolor: filterCategory === 'all' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          />
          {categoryStats.map(stat => {
            const category = developmentalCategories[stat.category];
            return (
              <Chip
                key={stat.category}
                label={`${category.emoji} ${category.name} (${stat.count})`}
                onClick={() => setFilterCategory(stat.category)}
                sx={{
                  bgcolor: filterCategory === stat.category ? `${category.color}60` : `${category.color}30`,
                  color: 'white',
                  '&:hover': { bgcolor: `${category.color}50` }
                }}
              />
            );
          })}
        </Box>

        {/* Timeline view */}
        {viewMode === 'timeline' ? (
          <Timeline position="alternate">
            {filteredData.map((item, index) => (
              <TimelineItemCard
                key={item.id}
                item={item}
                onMediaClick={setSelectedMedia}
                isLast={index === filteredData.length - 1}
              />
            ))}
          </Timeline>
        ) : (
          /* Grid view */
          <Grid container spacing={2}>
            {filteredData.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    sx={{
                      borderRadius: '16px',
                      cursor: 'pointer',
                      height: '100%',
                      background: `linear-gradient(135deg, ${developmentalCategories[item.category].color}15, ${developmentalCategories[item.category].color}08)`,
                      border: `1px solid ${developmentalCategories[item.category].color}30`,
                      '&:hover': {
                        boxShadow: `0 8px 25px ${developmentalCategories[item.category].color}40`
                      }
                    }}
                    onClick={() => setSelectedMedia(item)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar sx={{
                          bgcolor: developmentalCategories[item.category].color,
                          width: 32,
                          height: 32
                        }}>
                          {developmentalCategories[item.category].emoji}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {item.title}
                        </Typography>
                      </Box>

                      {item.thumbnail && (
                        <Box sx={{ mb: 2 }}>
                          <img
                            src={item.thumbnail}
                            alt=""
                            style={{
                              width: '100%',
                              height: '120px',
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                        </Box>
                      )}

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {item.description}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(item.timestamp), 'MMM d, h:mm a')}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Media player dialog */}
      {selectedMedia && (
        <MediaPlayer
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      {/* Floating action button for adding new content */}
      <SpeedDial
        ariaLabel="Add developmental content"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Photo />}
          tooltipTitle="Add Photo"
          onClick={() => {/* Handle photo upload */}}
        />
        <SpeedDialAction
          icon={<VideoLibrary />}
          tooltipTitle="Add Video"
          onClick={() => {/* Handle video upload */}}
        />
        <SpeedDialAction
          icon={<AudioFile />}
          tooltipTitle="Add Audio"
          onClick={() => {/* Handle audio upload */}}
        />
        <SpeedDialAction
          icon={<Description />}
          tooltipTitle="Add Note"
          onClick={() => {/* Handle note creation */}}
        />
      </SpeedDial>
    </Box>
  );
};

export default DevelopmentalTimeline;