import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  CircularProgress,
  Grid,
  Chip,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  TrendingUp,
  School,
  Favorite,
  DirectionsRun,
  MenuBook,
  Palette,
  MusicNote,
  SportsEsports,
  EmojiNature,
  Psychology,
  Groups,
  Build,
  Timeline,
  CalendarToday,
  ExpandMore,
  ExpandLess,
  Share,
  Download,
  Close,
  Check,
  Lock,
  LockOpen,
  Celebration
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

// Vibrant colors for different skills and achievements
const colors = {
  cognitive: '#9C27B0',
  social: '#4CAF50',
  physical: '#FF5722',
  creative: '#E91E63',
  language: '#2196F3',
  emotional: '#FF9800',
  completed: '#4CAF50',
  locked: '#9E9E9E',
  inProgress: '#FFC107'
};

// Skill categories with emojis and descriptions
const skillCategories = [
  {
    id: 'cognitive',
    name: 'Cognitive Development',
    emoji: '🧠',
    color: colors.cognitive,
    icon: Psychology,
    description: 'Problem-solving, memory, and thinking skills'
  },
  {
    id: 'social',
    name: 'Social Skills',
    emoji: '👥',
    color: colors.social,
    icon: Groups,
    description: 'Interaction with peers and adults'
  },
  {
    id: 'physical',
    name: 'Physical Development',
    emoji: '🏃‍♀️',
    color: colors.physical,
    icon: DirectionsRun,
    description: 'Motor skills and physical coordination'
  },
  {
    id: 'creative',
    name: 'Creative Expression',
    emoji: '🎨',
    color: colors.creative,
    icon: Palette,
    description: 'Art, music, and imaginative play'
  },
  {
    id: 'language',
    name: 'Language & Literacy',
    emoji: '📚',
    color: colors.language,
    icon: MenuBook,
    description: 'Speaking, reading, and communication'
  },
  {
    id: 'emotional',
    name: 'Emotional Growth',
    emoji: '❤️',
    color: colors.emotional,
    icon: Favorite,
    description: 'Self-regulation and emotional intelligence'
  }
];

// Achievement badges
const achievementBadges = [
  {
    id: 'first_word',
    name: 'First Word',
    description: 'Said their first clear word',
    emoji: '💬',
    category: 'language',
    rarity: 'common',
    points: 50
  },
  {
    id: 'sharing_star',
    name: 'Sharing Star',
    description: 'Shared toys with friends willingly',
    emoji: '🤝',
    category: 'social',
    rarity: 'common',
    points: 75
  },
  {
    id: 'creative_genius',
    name: 'Creative Genius',
    description: 'Created an original artwork',
    emoji: '🎭',
    category: 'creative',
    rarity: 'rare',
    points: 150
  },
  {
    id: 'problem_solver',
    name: 'Problem Solver',
    description: 'Solved a complex puzzle independently',
    emoji: '🧩',
    category: 'cognitive',
    rarity: 'epic',
    points: 200
  },
  {
    id: 'kindness_champion',
    name: 'Kindness Champion',
    description: 'Helped a friend in need',
    emoji: '🌟',
    category: 'emotional',
    rarity: 'rare',
    points: 125
  },
  {
    id: 'athletic_achiever',
    name: 'Athletic Achiever',
    description: 'Mastered riding a tricycle',
    emoji: '🚴‍♀️',
    category: 'physical',
    rarity: 'common',
    points: 100
  }
];

// Milestone definitions
const milestones = [
  {
    id: 'potty_trained',
    name: 'Potty Training Master',
    description: 'Successfully using the potty independently',
    emoji: '🚽',
    category: 'physical',
    targetAge: '3-4 years',
    steps: [
      'Shows interest in potty',
      'Sits on potty with clothes',
      'Sits on potty without diaper',
      'Uses potty successfully',
      'Stays dry for longer periods',
      'Asks to use potty',
      'Fully independent'
    ]
  },
  {
    id: 'shoe_tying',
    name: 'Shoe Tying Champion',
    description: 'Can tie shoelaces independently',
    emoji: '👟',
    category: 'physical',
    targetAge: '4-5 years',
    steps: [
      'Shows interest in laces',
      'Attempts to pull laces',
      'Makes bunny ears',
      'Crosses laces over',
      'Pulls through loop',
      'Tightens properly',
      'Ties independently'
    ]
  },
  {
    id: 'alphabet_master',
    name: 'Alphabet Master',
    description: 'Recognizes all letters of the alphabet',
    emoji: '🔤',
    category: 'language',
    targetAge: '4-5 years',
    steps: [
      'Recognizes 5 letters',
      'Recognizes 10 letters',
      'Recognizes 15 letters',
      'Recognizes 20 letters',
      'Recognizes all 26 letters',
      'Can write some letters',
      'Writes full alphabet'
    ]
  }
];

// Animated achievement card
const AchievementCard = ({ achievement, isNew = false, onClick }) => {
  const [showSparkles, setShowSparkles] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setShowSparkles(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'common': return '#4CAF50';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <motion.div
      initial={isNew ? { scale: 0, rotateY: 180 } : { scale: 1, rotateY: 0 }}
      animate={{ scale: 1, rotateY: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Card sx={{
        position: 'relative',
        borderRadius: '20px',
        background: `linear-gradient(135deg, ${getRarityColor()}20, ${getRarityColor()}10)`,
        border: `2px solid ${getRarityColor()}`,
        overflow: 'hidden',
        '&:hover': {
          boxShadow: `0 8px 25px ${getRarityColor()}40`
        }
      }}>
        {/* Sparkles animation for new achievements */}
        {showSparkles && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  fontSize: '20px',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
              >
                ✨
              </motion.div>
            ))}
          </Box>
        )}

        <CardContent sx={{ p: 2, textAlign: 'center' }}>
          <motion.div
            animate={isNew ? {
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.5, repeat: isNew ? 3 : 0 }}
          >
            <Typography variant="h4" sx={{ mb: 1 }}>
              {achievement.emoji}
            </Typography>
          </motion.div>

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {achievement.name}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {achievement.description}
          </Typography>

          <Chip
            label={achievement.rarity}
            size="small"
            sx={{
              bgcolor: getRarityColor(),
              color: 'white',
              textTransform: 'capitalize',
              fontWeight: 'bold'
            }}
          />

          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: getRarityColor() }}>
            +{achievement.points} points
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Skill progress circle
const SkillProgressCircle = ({ skill, progress, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Card sx={{
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        border: `2px solid ${skill.color}20`,
        '&:hover': {
          border: `2px solid ${skill.color}`,
          boxShadow: `0 4px 20px ${skill.color}30`
        }
      }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ width: 100, height: 100, margin: '0 auto', mb: 2 }}>
            <CircularProgressbar
              value={progress}
              text={`${Math.round(progress)}%`}
              styles={buildStyles({
                pathColor: skill.color,
                textColor: skill.color,
                trailColor: `${skill.color}20`,
                pathTransition: 'stroke-dasharray 0.5s ease 0s',
                textSize: '16px'
              })}
            />
          </Box>

          <Typography variant="h6" sx={{ mb: 0.5, fontSize: '20px' }}>
            {skill.emoji}
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {skill.name}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {skill.description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Milestone progress stepper
const MilestoneProgress = ({ milestone, currentStep = 3 }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card sx={{ borderRadius: '16px', mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: colors[milestone.category], fontSize: '24px' }}>
              {milestone.emoji}
            </Avatar>
            <Box>
              <Typography variant="h6">{milestone.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {milestone.description}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={(currentStep / milestone.steps.length) * 100}
            sx={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              bgcolor: `${colors[milestone.category]}20`,
              '& .MuiLinearProgress-bar': {
                bgcolor: colors[milestone.category],
                borderRadius: 4
              }
            }}
          />
          <Typography variant="body2" sx={{ minWidth: 60 }}>
            {currentStep}/{milestone.steps.length}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={milestone.targetAge}
            size="small"
            variant="outlined"
            sx={{ borderColor: colors[milestone.category] }}
          />
          <Typography variant="caption" color="text.secondary">
            {Math.round((currentStep / milestone.steps.length) * 100)}% Complete
          </Typography>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={currentStep - 1} orientation="vertical">
              {milestone.steps.map((step, index) => (
                <Step key={step} completed={index < currentStep}>
                  <StepLabel
                    icon={
                      <Avatar sx={{
                        bgcolor: index < currentStep ? colors[milestone.category] : 'rgba(0,0,0,0.1)',
                        width: 24,
                        height: 24,
                        fontSize: '12px'
                      }}>
                        {index < currentStep ? <Check sx={{ fontSize: 16 }} /> : index + 1}
                      </Avatar>
                    }
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: index < currentStep ? colors[milestone.category] : 'text.secondary',
                        fontWeight: index === currentStep - 1 ? 'bold' : 'normal'
                      }}
                    >
                      {step}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const ProgressTracker = ({ child }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showNewAchievement, setShowNewAchievement] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [skillProgress, setSkillProgress] = useState({});

  // Sample data
  useEffect(() => {
    const earnedAchievements = achievementBadges.slice(0, 4);
    const points = earnedAchievements.reduce((sum, badge) => sum + badge.points, 0);
    setTotalPoints(points);
    setLevel(Math.floor(points / 500) + 1);

    // Sample skill progress
    setSkillProgress({
      cognitive: 75,
      social: 85,
      physical: 60,
      creative: 90,
      language: 70,
      emotional: 80
    });

    // Simulate new achievement
    const timer = setTimeout(() => setShowNewAchievement(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const earnedAchievements = achievementBadges.slice(0, 4);
  const lockedAchievements = achievementBadges.slice(4);

  const nextLevelPoints = level * 500;
  const currentLevelProgress = ((totalPoints % 500) / 500) * 100;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 2, maxHeight: '70vh', overflow: 'auto' }}>
      {/* Header with level and points */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <span style={{ fontSize: '24px' }}>🏆</span>
            {child?.name}'s Progress Journey
          </Typography>

          {/* Level and points card */}
          <Card sx={{
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #FFD93D, #FF8A65)',
            color: 'white',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Level {level}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Little Explorer
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                  <EmojiEvents sx={{ fontSize: 32 }} />
                </Avatar>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Progress to Level {level + 1}</Typography>
                  <Typography variant="body2">{totalPoints % 500}/{500} XP</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={currentLevelProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'white',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">
                  🌟 Total Points: {totalPoints}
                </Typography>
                <Typography variant="body2">
                  🏅 Achievements: {earnedAchievements.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      {/* Navigation tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ mb: 3 }}
        TabIndicatorProps={{
          style: { backgroundColor: '#FF6B9D', height: 3, borderRadius: '3px 3px 0 0' }
        }}
      >
        <Tab label="Skills" />
        <Tab label="Achievements" />
        <Tab label="Milestones" />
      </Tabs>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {/* Skills tab */}
        {activeTab === 0 && (
          <motion.div
            key="skills"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              {skillCategories.map((skill) => (
                <Grid item xs={6} md={4} key={skill.id}>
                  <SkillProgressCircle
                    skill={skill}
                    progress={skillProgress[skill.id] || 0}
                    onClick={() => {/* TODO: Implement skill details view */}}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Overall progress summary */}
            <Card sx={{ mt: 3, borderRadius: '16px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp sx={{ color: colors.completed }} />
                  Overall Development
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Average Progress: {Math.round(Object.values(skillProgress).reduce((a, b) => a + b, 0) / Object.values(skillProgress).length)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Object.values(skillProgress).reduce((a, b) => a + b, 0) / Object.values(skillProgress).length}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: 'rgba(76, 175, 80, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: colors.completed,
                        borderRadius: 5
                      }
                    }}
                  />
                </Box>

                <Alert severity="success" sx={{ borderRadius: '12px' }}>
                  Emma is showing excellent progress across all areas! Keep encouraging her curiosity and creativity.
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Achievements tab */}
        {activeTab === 1 && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: colors.completed }}>
              Earned Achievements ({earnedAchievements.length})
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {earnedAchievements.map((achievement, index) => (
                <Grid item xs={6} sm={4} md={3} key={achievement.id}>
                  <AchievementCard
                    achievement={achievement}
                    isNew={index === 0 && showNewAchievement}
                    onClick={() => setSelectedAchievement(achievement)}
                  />
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" sx={{ mb: 2, color: colors.locked }}>
              Upcoming Achievements
            </Typography>
            <Grid container spacing={2}>
              {lockedAchievements.map((achievement) => (
                <Grid item xs={6} sm={4} md={3} key={achievement.id}>
                  <Card sx={{
                    borderRadius: '20px',
                    background: 'rgba(0,0,0,0.05)',
                    border: '2px solid rgba(0,0,0,0.1)',
                    filter: 'grayscale(1)',
                    opacity: 0.7
                  }}>
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        🔒
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {achievement.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Keep exploring to unlock!
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}

        {/* Milestones tab */}
        {activeTab === 2 && (
          <motion.div
            key="milestones"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h6" sx={{ mb: 3, color: colors.inProgress }}>
              Development Milestones
            </Typography>
            {milestones.map((milestone, index) => (
              <MilestoneProgress
                key={milestone.id}
                milestone={milestone}
                currentStep={[5, 3, 6][index]} // Sample current steps
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement detail dialog */}
      <Dialog
        open={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAchievement && (
          <>
            <DialogTitle sx={{
              textAlign: 'center',
              background: `linear-gradient(135deg, ${colors[selectedAchievement.category]}, ${colors[selectedAchievement.category]}80)`,
              color: 'white'
            }}>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {selectedAchievement.emoji}
              </Typography>
              <Typography variant="h6">
                {selectedAchievement.name}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedAchievement.description}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Chip
                  label={selectedAchievement.category}
                  sx={{
                    bgcolor: colors[selectedAchievement.category],
                    color: 'white'
                  }}
                />
                <Chip
                  label={selectedAchievement.rarity}
                  variant="outlined"
                />
              </Box>

              <Typography variant="h5" sx={{ color: colors[selectedAchievement.category], fontWeight: 'bold' }}>
                +{selectedAchievement.points} XP
              </Typography>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  startIcon={<Share />}
                  variant="outlined"
                  sx={{ borderRadius: '20px' }}
                >
                  Share
                </Button>
                <Button
                  onClick={() => setSelectedAchievement(null)}
                  variant="contained"
                  sx={{
                    borderRadius: '20px',
                    bgcolor: colors[selectedAchievement.category]
                  }}
                >
                  Awesome!
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* New achievement celebration */}
      <AnimatePresence>
        {showNewAchievement && (
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
              zIndex: 2000
            }}
            onClick={() => setShowNewAchievement(false)}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Card sx={{
                borderRadius: '24px',
                maxWidth: 320,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #FFD93D, #FF8A65)',
                color: 'white'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      🏆
                    </Typography>
                  </motion.div>

                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                    New Achievement!
                  </Typography>

                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {earnedAchievements[0]?.name}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                    {earnedAchievements[0]?.description}
                  </Typography>

                  <Chip
                    label={`+${earnedAchievements[0]?.points} XP`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ProgressTracker;