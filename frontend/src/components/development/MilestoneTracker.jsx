import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  Tooltip,
  Badge,
  Collapse,
  Alert
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
  EmojiEvents,
  Star,
  Check,
  Schedule,
  TrendingUp,
  PhotoCamera,
  VideoCall,
  Add,
  Edit,
  Share,
  Celebration,
  Flag,
  Lock,
  LockOpen,
  ExpandMore,
  ExpandLess,
  PlayArrow,
  Pause,
  FastForward
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Comprehensive milestone data structure
const milestoneCategories = [
  {
    id: 'physical',
    name: 'Physical Development',
    color: '#FF5722',
    emoji: '🏃‍♀️',
    milestones: [
      {
        id: 'walking',
        name: 'First Steps',
        description: 'Takes first independent steps',
        typicalAge: '9-18 months',
        prerequisites: ['Crawling', 'Pulling to stand', 'Cruising'],
        status: 'completed',
        achievedDate: '2023-03-15',
        photos: ['photo1.jpg', 'photo2.jpg'],
        teacherNotes: 'Emma took her first steps during outdoor play time!',
        significance: 'Major motor milestone indicating strong leg development and balance.',
        nextSteps: ['Walking longer distances', 'Walking on uneven surfaces', 'Beginning to run']
      },
      {
        id: 'running',
        name: 'Running',
        description: 'Runs with coordination and balance',
        typicalAge: '18-24 months',
        prerequisites: ['Walking steadily', 'Good balance'],
        status: 'achieved',
        achievedDate: '2023-07-22',
        progress: 95,
        teacherNotes: 'Shows excellent coordination while running in the playground.',
        significance: 'Indicates advanced gross motor skills and cardiovascular development.'
      },
      {
        id: 'jumping',
        name: 'Jumping',
        description: 'Jumps with both feet leaving ground',
        typicalAge: '2-3 years',
        prerequisites: ['Running', 'Strong leg muscles'],
        status: 'in_progress',
        progress: 75,
        currentObservations: 'Attempts jumping but needs more practice with coordination.',
        targetDate: '2024-02-01'
      },
      {
        id: 'tricycle',
        name: 'Pedaling Tricycle',
        description: 'Pedals tricycle using alternating foot motion',
        typicalAge: '2.5-4 years',
        prerequisites: ['Leg strength', 'Coordination'],
        status: 'upcoming',
        progress: 25,
        estimatedStart: '2024-03-01'
      }
    ]
  },
  {
    id: 'cognitive',
    name: 'Cognitive Development',
    color: '#9C27B0',
    emoji: '🧠',
    milestones: [
      {
        id: 'object_permanence',
        name: 'Object Permanence',
        description: 'Understands objects exist when not visible',
        typicalAge: '8-12 months',
        status: 'completed',
        achievedDate: '2022-11-30',
        significance: 'Foundation for memory and problem-solving skills.'
      },
      {
        id: 'counting',
        name: 'Counting to 10',
        description: 'Counts from 1 to 10 correctly',
        typicalAge: '3-4 years',
        status: 'achieved',
        achievedDate: '2023-09-10',
        progress: 100,
        teacherNotes: 'Can count objects accurately and understands one-to-one correspondence.'
      },
      {
        id: 'colors',
        name: 'Color Recognition',
        description: 'Identifies primary and secondary colors',
        typicalAge: '2.5-3.5 years',
        status: 'achieved',
        progress: 90,
        achievedDate: '2023-08-15',
        currentObservations: 'Knows 8 colors confidently, working on pink and purple.'
      },
      {
        id: 'alphabet',
        name: 'Letter Recognition',
        description: 'Recognizes all uppercase letters',
        typicalAge: '4-5 years',
        status: 'in_progress',
        progress: 65,
        currentObservations: 'Knows 17 letters confidently, practicing remaining 9.',
        targetDate: '2024-04-01'
      }
    ]
  },
  {
    id: 'social',
    name: 'Social-Emotional',
    color: '#E91E63',
    emoji: '❤️',
    milestones: [
      {
        id: 'sharing',
        name: 'Sharing Toys',
        description: 'Willingly shares toys with peers',
        typicalAge: '2.5-4 years',
        status: 'achieved',
        achievedDate: '2023-10-05',
        progress: 100,
        teacherNotes: 'Demonstrates excellent sharing behavior, often offers toys to friends.',
        significance: 'Shows developing empathy and social awareness.'
      },
      {
        id: 'turn_taking',
        name: 'Turn Taking',
        description: 'Waits for turn in games and activities',
        typicalAge: '3-4 years',
        status: 'in_progress',
        progress: 80,
        currentObservations: 'Getting better at waiting, sometimes needs gentle reminders.',
        targetDate: '2024-01-15'
      },
      {
        id: 'empathy',
        name: 'Showing Empathy',
        description: 'Comforts others when they are sad',
        typicalAge: '3-5 years',
        status: 'emerging',
        progress: 45,
        currentObservations: 'Shows concern when friends cry, learning appropriate responses.'
      }
    ]
  },
  {
    id: 'language',
    name: 'Language & Communication',
    color: '#2196F3',
    emoji: '📚',
    milestones: [
      {
        id: 'first_words',
        name: 'First Words',
        description: 'Says first meaningful words',
        typicalAge: '10-14 months',
        status: 'completed',
        achievedDate: '2022-12-20',
        firstWords: ['mama', 'dada', 'bye-bye'],
        significance: 'Beginning of verbal communication development.'
      },
      {
        id: 'two_word_phrases',
        name: 'Two-Word Phrases',
        description: 'Combines words into simple phrases',
        typicalAge: '18-24 months',
        status: 'completed',
        achievedDate: '2023-04-08',
        examples: ['more juice', 'go outside', 'my toy']
      },
      {
        id: 'storytelling',
        name: 'Story Telling',
        description: 'Tells simple stories about experiences',
        typicalAge: '3-4 years',
        status: 'in_progress',
        progress: 70,
        currentObservations: 'Loves sharing about weekend activities, uses good sequencing.',
        targetDate: '2024-02-15'
      }
    ]
  }
];

// Milestone card component with animations
const MilestoneCard = ({ milestone, category, onEdit, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = () => {
    switch (milestone.status) {
      case 'completed': return '#4CAF50';
      case 'achieved': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'emerging': return '#2196F3';
      case 'upcoming': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = () => {
    switch (milestone.status) {
      case 'completed':
      case 'achieved':
        return <Check />;
      case 'in_progress':
        return <PlayArrow />;
      case 'emerging':
        return <TrendingUp />;
      case 'upcoming':
        return <Schedule />;
      default:
        return <Schedule />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
    >
      <Card sx={{
        borderRadius: '16px',
        border: `2px solid ${getStatusColor()}30`,
        background: milestone.status === 'achieved' || milestone.status === 'completed'
          ? `linear-gradient(135deg, ${getStatusColor()}15, ${getStatusColor()}08)`
          : 'rgba(255,255,255,0.95)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Achievement sparkles for completed milestones */}
        {(milestone.status === 'achieved' || milestone.status === 'completed') && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Typography variant="h6">✨</Typography>
            </motion.div>
          </Box>
        )}

        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <motion.div
                animate={milestone.status === 'in_progress' ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Avatar sx={{
                  bgcolor: getStatusColor(),
                  width: 50,
                  height: 50
                }}>
                  {getStatusIcon()}
                </Avatar>
              </motion.div>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {milestone.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {milestone.description}
                </Typography>
                <Chip
                  label={milestone.status.replace('_', ' ')}
                  sx={{
                    bgcolor: getStatusColor(),
                    color: 'white',
                    textTransform: 'capitalize',
                    fontWeight: 'bold'
                  }}
                  size="small"
                />
              </Box>
            </Box>

            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ color: 'text.secondary' }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {/* Progress bar for in-progress milestones */}
          {milestone.status === 'in_progress' && milestone.progress && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {milestone.progress}%
                </Typography>
              </Box>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <LinearProgress
                  variant="determinate"
                  value={milestone.progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: `${getStatusColor()}20`,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getStatusColor(),
                      borderRadius: 4
                    }
                  }}
                />
              </motion.div>
            </Box>
          )}

          {/* Basic info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Typical Age: {milestone.typicalAge}
            </Typography>
            {milestone.achievedDate && (
              <Typography variant="caption" sx={{ color: getStatusColor(), fontWeight: 'bold' }}>
                Achieved: {formatDate(milestone.achievedDate)}
              </Typography>
            )}
            {milestone.targetDate && milestone.status === 'in_progress' && (
              <Typography variant="caption" color="text.secondary">
                Target: {formatDate(milestone.targetDate)}
              </Typography>
            )}
          </Box>

          {/* Photos/videos indicator */}
          {milestone.photos && milestone.photos.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Badge badgeContent={milestone.photos.length} color="primary">
                <PhotoCamera sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Badge>
              <Typography variant="caption" color="text.secondary">
                {milestone.photos.length} memory photo{milestone.photos.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}

          {/* Expanded content */}
          <Collapse in={expanded}>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              {milestone.significance && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: category.color }}>
                    Why This Matters
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {milestone.significance}
                  </Typography>
                </Box>
              )}

              {milestone.teacherNotes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: category.color }}>
                    Teacher's Observation
                  </Typography>
                  <Paper sx={{
                    p: 2,
                    bgcolor: `${category.color}10`,
                    borderLeft: `4px solid ${category.color}`
                  }}>
                    <Typography variant="body2">
                      "{milestone.teacherNotes}"
                    </Typography>
                  </Paper>
                </Box>
              )}

              {milestone.currentObservations && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: category.color }}>
                    Current Observations
                  </Typography>
                  <Typography variant="body2">
                    {milestone.currentObservations}
                  </Typography>
                </Box>
              )}

              {milestone.prerequisites && milestone.prerequisites.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: category.color }}>
                    Prerequisites Met
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {milestone.prerequisites.map((prereq, index) => (
                      <Chip
                        key={index}
                        label={prereq}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {milestone.nextSteps && milestone.nextSteps.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: category.color }}>
                    Next Steps
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {milestone.nextSteps.map((step, index) => (
                      <Chip
                        key={index}
                        label={step}
                        size="small"
                        sx={{
                          bgcolor: `${category.color}15`,
                          color: category.color,
                          fontSize: '0.7rem'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  size="small"
                  startIcon={<PhotoCamera />}
                  variant="outlined"
                  sx={{ borderRadius: '20px' }}
                  onClick={() => onViewDetails(milestone)}
                >
                  View Memories
                </Button>
                {milestone.status !== 'completed' && milestone.status !== 'achieved' && (
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    variant="outlined"
                    sx={{ borderRadius: '20px' }}
                    onClick={() => onEdit(milestone)}
                  >
                    Update Progress
                  </Button>
                )}
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Category overview component
const CategoryOverview = ({ category, milestones }) => {
  const completedCount = milestones.filter(m =>
    m.status === 'completed' || m.status === 'achieved'
  ).length;
  const totalCount = milestones.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const inProgressCount = milestones.filter(m => m.status === 'in_progress').length;
  const upcomingCount = milestones.filter(m => m.status === 'upcoming').length;

  return (
    <Card sx={{
      borderRadius: '20px',
      background: `linear-gradient(135deg, ${category.color}20, ${category.color}10)`,
      border: `2px solid ${category.color}30`,
      mb: 3
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{
              bgcolor: category.color,
              width: 60,
              height: 60,
              fontSize: '24px'
            }}>
              {category.emoji}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {category.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completedCount} of {totalCount} milestones achieved
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" sx={{ color: category.color, fontWeight: 'bold' }}>
              {Math.round(progressPercentage)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Complete
            </Typography>
          </Box>
        </Box>

        {/* Progress visualization */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: `${category.color}20`,
              '& .MuiLinearProgress-bar': {
                bgcolor: category.color,
                borderRadius: 6
              }
            }}
          />
        </Box>

        {/* Status summary */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${completedCount} Achieved`}
            sx={{ bgcolor: '#4CAF50', color: 'white' }}
            size="small"
          />
          {inProgressCount > 0 && (
            <Chip
              label={`${inProgressCount} In Progress`}
              sx={{ bgcolor: '#FF9800', color: 'white' }}
              size="small"
            />
          )}
          {upcomingCount > 0 && (
            <Chip
              label={`${upcomingCount} Upcoming`}
              sx={{ bgcolor: '#9E9E9E', color: 'white' }}
              size="small"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const MilestoneTracker = ({ child, areas }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [viewingMilestone, setViewingMilestone] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Filter milestones based on selected category
  const getFilteredMilestones = () => {
    if (selectedCategory === 'all') {
      return milestoneCategories;
    }
    return milestoneCategories.filter(cat => cat.id === selectedCategory);
  };

  // Calculate overall statistics
  const getAllMilestones = () => {
    return milestoneCategories.flatMap(cat =>
      cat.milestones.map(m => ({ ...m, category: cat }))
    );
  };

  const allMilestones = getAllMilestones();
  const achievedMilestones = allMilestones.filter(m =>
    m.status === 'achieved' || m.status === 'completed'
  );
  const inProgressMilestones = allMilestones.filter(m => m.status === 'in_progress');

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
  };

  const handleViewDetails = (milestone) => {
    setViewingMilestone(milestone);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents />
          Milestone Tracking Journey
        </Typography>

        {/* Overall statistics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                {achievedMilestones.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Achieved
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                {inProgressMilestones.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                {Math.round((achievedMilestones.length / allMilestones.length) * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#9C27B0', fontWeight: 'bold' }}>
                {child?.age || 4}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Years Old
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Category filter */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Chip
            label="All Categories"
            onClick={() => setSelectedCategory('all')}
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
            sx={{
              bgcolor: selectedCategory === 'all' ? 'white' : 'transparent',
              color: selectedCategory === 'all' ? '#667eea' : 'white',
              borderColor: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          />
          {milestoneCategories.map(category => (
            <Chip
              key={category.id}
              label={`${category.emoji} ${category.name}`}
              onClick={() => setSelectedCategory(category.id)}
              variant={selectedCategory === category.id ? 'filled' : 'outlined'}
              sx={{
                bgcolor: selectedCategory === category.id ? 'white' : 'transparent',
                color: selectedCategory === category.id ? category.color : 'white',
                borderColor: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Milestone categories and cards */}
      <Box sx={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        p: 3,
        backdropFilter: 'blur(20px)'
      }}>
        {getFilteredMilestones().map(category => (
          <Box key={category.id} sx={{ mb: 4 }}>
            <CategoryOverview category={category} milestones={category.milestones} />

            <Grid container spacing={3}>
              {category.milestones.map(milestone => (
                <Grid item xs={12} md={6} lg={4} key={milestone.id}>
                  <MilestoneCard
                    milestone={milestone}
                    category={category}
                    onEdit={handleEditMilestone}
                    onViewDetails={handleViewDetails}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Box>

      {/* Recent achievements highlight */}
      <Card sx={{ mt: 3, borderRadius: '16px', background: 'rgba(255,255,255,0.95)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star sx={{ color: '#FFD700' }} />
            Recent Achievements
          </Typography>

          <Timeline>
            {achievedMilestones.slice(0, 3).map((milestone, index) => (
              <TimelineItem key={milestone.id}>
                <TimelineOppositeContent sx={{ flex: 0.2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(milestone.achievedDate).toLocaleDateString()}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot sx={{ bgcolor: milestone.category.color }}>
                    <milestone.category.icon sx={{ fontSize: 16 }} />
                  </TimelineDot>
                  {index < 2 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {milestone.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {milestone.category.name}
                  </Typography>
                  {milestone.teacherNotes && (
                    <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                      "{milestone.teacherNotes}"
                    </Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MilestoneTracker;