import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Avatar,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Divider,
  Alert,
  Tooltip,
  Badge,
  Fab
} from '@mui/material';
import {
  TrendingUp,
  EmojiEvents,
  Timeline,
  Assessment,
  Share,
  Download,
  Star,
  Insights,
  Psychology,
  School,
  DirectionsRun,
  Palette,
  MenuBook,
  Groups,
  Favorite,
  CalendarToday,
  PhotoLibrary,
  BarChart,
  PieChart,
  ShowChart,
  Celebration,
  Flag,
  Medical
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import MilestoneTracker from './MilestoneTracker';
import SkillsRadarChart from './SkillsRadarChart';
import DevelopmentalTimeline from './DevelopmentalTimeline';
import AIInsightsDashboard from './AIInsightsDashboard';
import BenchmarkComparison from './BenchmarkComparison';
import GoalCelebrationSystem from './GoalCelebrationSystem';
import ProgressReports from './ProgressReports';

// Developmental areas with enhanced styling
const developmentalAreas = [
  {
    id: 'cognitive',
    name: 'Cognitive Development',
    emoji: '🧠',
    color: '#9C27B0',
    icon: Psychology,
    description: 'Problem-solving, memory, thinking, and learning',
    skills: ['Problem Solving', 'Memory', 'Attention', 'Language Processing', 'Creative Thinking'],
    keyMilestones: ['First Words', 'Counting to 10', 'Recognizes Letters', 'Follows Instructions']
  },
  {
    id: 'physical',
    name: 'Physical Development',
    emoji: '🏃‍♀️',
    color: '#FF5722',
    icon: DirectionsRun,
    description: 'Gross and fine motor skills, coordination',
    skills: ['Gross Motor', 'Fine Motor', 'Balance', 'Coordination', 'Strength'],
    keyMilestones: ['Walking', 'Running', 'Jumping', 'Drawing Shapes', 'Using Utensils']
  },
  {
    id: 'social',
    name: 'Social-Emotional',
    emoji: '❤️',
    color: '#E91E63',
    icon: Groups,
    description: 'Relationships, emotional regulation, empathy',
    skills: ['Empathy', 'Sharing', 'Cooperation', 'Self-Regulation', 'Communication'],
    keyMilestones: ['Parallel Play', 'Sharing Toys', 'Following Rules', 'Expressing Emotions']
  },
  {
    id: 'language',
    name: 'Language & Literacy',
    emoji: '📚',
    color: '#2196F3',
    icon: MenuBook,
    description: 'Communication, reading readiness, vocabulary',
    skills: ['Vocabulary', 'Grammar', 'Reading Readiness', 'Writing', 'Listening'],
    keyMilestones: ['First Words', 'Two-Word Phrases', 'Storytelling', 'Letter Recognition']
  },
  {
    id: 'creative',
    name: 'Creative Expression',
    emoji: '🎨',
    color: '#FF9800',
    icon: Palette,
    description: 'Art, music, imagination, self-expression',
    skills: ['Artistic Skills', 'Musical Ability', 'Imagination', 'Self-Expression', 'Creativity'],
    keyMilestones: ['Scribbling', 'Drawing Figures', 'Singing Songs', 'Role Playing']
  },
  {
    id: 'adaptive',
    name: 'Adaptive Skills',
    emoji: '🌟',
    color: '#4CAF50',
    icon: School,
    description: 'Daily living skills, independence, self-care',
    skills: ['Self-Care', 'Independence', 'Routine Following', 'Safety Awareness', 'Organization'],
    keyMilestones: ['Toilet Training', 'Dressing', 'Eating Independently', 'Following Schedules']
  }
];

// Child development statistics
const developmentStats = [
  {
    label: 'Overall Development',
    value: 87,
    trend: '+5% this month',
    icon: TrendingUp,
    color: '#4CAF50'
  },
  {
    label: 'Milestones Achieved',
    value: 23,
    trend: '3 new this week',
    icon: EmojiEvents,
    color: '#FF9800'
  },
  {
    label: 'Skills Developing',
    value: 12,
    trend: '2 progressing well',
    icon: Psychology,
    color: '#9C27B0'
  },
  {
    label: 'Active Goals',
    value: 5,
    trend: '1 completed',
    icon: Flag,
    color: '#2196F3'
  }
];

// Floating animation for background elements
const FloatingElements = () => {
  const elements = ['🌈', '⭐', '🦋', '🌸', '🎈', '✨', '🌟', '🎭'];

  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
      {elements.map((emoji, index) => (
        <motion.div
          key={index}
          style={{
            position: 'absolute',
            fontSize: '20px',
            left: `${10 + (index * 12)}%`,
            top: `${5 + (index * 8)}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
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

// Development area overview card
const DevelopmentAreaCard = ({ area, progress, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Card sx={{
        height: '100%',
        borderRadius: '20px',
        background: `linear-gradient(135deg, ${area.color}15, ${area.color}08)`,
        border: `2px solid ${area.color}30`,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: `0 8px 30px ${area.color}40`,
          '& .area-icon': {
            transform: 'scale(1.1) rotate(5deg)'
          }
        }
      }}>
        {/* Background pattern */}
        <Box sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          fontSize: '80px',
          opacity: 0.1,
          transform: 'rotate(15deg)'
        }}>
          {area.emoji}
        </Box>

        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              className="area-icon"
              sx={{
                bgcolor: area.color,
                width: 50,
                height: 50,
                mr: 2,
                transition: 'transform 0.3s ease'
              }}
            >
              <area.icon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {area.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress}% developed
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
            {area.description}
          </Typography>

          {/* Progress bar */}
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: `${area.color}20`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: area.color,
                  borderRadius: 4
                }
              }}
            />
          </Box>

          {/* Key milestones chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {area.keyMilestones.slice(0, 2).map((milestone, index) => (
              <Chip
                key={index}
                label={milestone}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  bgcolor: `${area.color}20`,
                  color: area.color,
                  border: `1px solid ${area.color}30`
                }}
              />
            ))}
            {area.keyMilestones.length > 2 && (
              <Chip
                label={`+${area.keyMilestones.length - 2}`}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  bgcolor: 'rgba(0,0,0,0.1)',
                  color: 'text.secondary'
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Statistics card component
const StatCard = ({ stat, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card sx={{
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        },
        transition: 'all 0.3s ease'
      }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Avatar sx={{ bgcolor: stat.color, width: 36, height: 36 }}>
              <stat.icon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: stat.color }}>
              {stat.value}
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
            {stat.label}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {stat.trend}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ChildDevelopmentDashboard = ({ child }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedArea, setSelectedArea] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [developmentData, setDevelopmentData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Sample development data
  useEffect(() => {
    // Simulate loading development data
    setTimeout(() => {
      setDevelopmentData({
        cognitive: 78,
        physical: 85,
        social: 92,
        language: 74,
        creative: 88,
        adaptive: 81
      });
      setIsLoading(false);
    }, 1000);

    // Show celebration for recent achievement
    const celebrationTimer = setTimeout(() => {
      setShowCelebration(true);
    }, 3000);

    return () => clearTimeout(celebrationTimer);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAreaClick = (area) => {
    setSelectedArea(area);
  };

  const tabs = [
    { label: 'Overview', icon: Assessment },
    { label: 'Milestones', icon: EmojiEvents },
    { label: 'Skills Radar', icon: ShowChart },
    { label: 'Timeline', icon: Timeline },
    { label: 'AI Insights', icon: Insights },
    { label: 'Benchmarks', icon: BarChart },
    { label: 'Goals', icon: Flag },
    { label: 'Reports', icon: Medical }
  ];

  if (isLoading) {
    return (
      <Box sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Typography variant="h2" sx={{ mb: 2 }}>
            🌈
          </Typography>
        </motion.div>
        <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
          Loading {child?.name}'s Development Journey
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Preparing wonderful insights...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <FloatingElements />

      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ p: 3, pb: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  {child?.name}'s Development Journey
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Age: {child?.age || '4'} years • Tracking since birth
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}>
                  <Share />
                </IconButton>
                <IconButton sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}>
                  <Download />
                </IconButton>
              </Box>
            </Box>

            {/* Development Statistics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {developmentStats.map((stat, index) => (
                <Grid item xs={6} sm={3} key={stat.label}>
                  <StatCard stat={stat} index={index} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>

        {/* Navigation Tabs */}
        <Box sx={{ px: 3, mb: 2 }}>
          <Paper sx={{
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.7)',
                  minHeight: 48,
                  '&.Mui-selected': {
                    color: 'white'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'white',
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  label={tab.label}
                  icon={<tab.icon />}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Paper>
        </Box>

        {/* Tab Content */}
        <Box sx={{ px: 3, pb: 3 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 0 && (
                <Box>
                  {/* Development Areas Overview */}
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment />
                    Development Areas Overview
                  </Typography>

                  <Grid container spacing={3}>
                    {developmentalAreas.map((area) => (
                      <Grid item xs={12} sm={6} md={4} key={area.id}>
                        <DevelopmentAreaCard
                          area={area}
                          progress={developmentData[area.id] || 0}
                          onClick={() => handleAreaClick(area)}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  {/* Quick Insights */}
                  <Paper sx={{
                    mt: 3,
                    p: 3,
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)'
                  }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Insights sx={{ color: '#FF9800' }} />
                      Quick Development Insights
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
                          <strong>Great Progress!</strong> {child?.name} is developing exceptionally well in social-emotional areas, showing strong empathy and cooperation skills.
                        </Alert>
                        <Alert severity="info" sx={{ borderRadius: '12px' }}>
                          <strong>Focus Area:</strong> Language development could benefit from more reading activities and vocabulary games.
                        </Alert>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
                          <Typography variant="h3" sx={{ color: '#4CAF50', mb: 1 }}>
                            92%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Overall Development Score
                          </Typography>
                          <Chip label="Above Average" color="success" size="small" sx={{ mt: 1 }} />
                        </Card>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}

              {activeTab === 1 && <MilestoneTracker child={child} areas={developmentalAreas} />}
              {activeTab === 2 && <SkillsRadarChart child={child} areas={developmentalAreas} data={developmentData} />}
              {activeTab === 3 && <DevelopmentalTimeline child={child} />}
              {activeTab === 4 && <AIInsightsDashboard child={child} developmentData={developmentData} />}
              {activeTab === 5 && <BenchmarkComparison child={child} developmentData={developmentData} />}
              {activeTab === 6 && <GoalCelebrationSystem child={child} />}
              {activeTab === 7 && <ProgressReports child={child} developmentData={developmentData} />}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>

      {/* Achievement Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3000
            }}
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Paper sx={{
                borderRadius: '24px',
                p: 4,
                textAlign: 'center',
                maxWidth: 400,
                background: 'linear-gradient(135deg, #FFD93D, #FF8A65)',
                color: 'white'
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Typography variant="h2" sx={{ mb: 2 }}>
                    🏆
                  </Typography>
                </motion.div>

                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                  New Milestone Achieved!
                </Typography>

                <Typography variant="h6" sx={{ mb: 1 }}>
                  Social Sharing Champion
                </Typography>

                <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                  {child?.name} learned to share toys with friends during play time!
                </Typography>

                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: '20px',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                  onClick={() => setShowCelebration(false)}
                >
                  Celebrate! 🎉
                </Button>
              </Paper>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ChildDevelopmentDashboard;