import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel,
  Slider,
  Tab,
  Tabs,
  TabPanel
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Lightbulb,
  Assessment,
  EmojiEvents,
  Warning,
  CheckCircle,
  School,
  Home,
  Group,
  Person,
  ExpandMore,
  Info,
  Star,
  Timeline,
  Insights,
  AutoAwesome,
  SmartToy,
  Analytics,
  Recommend,
  LocalLibrary,
  Celebration,
  Flag,
  NotificationImportant,
  TipsAndUpdates,
  Bookmark,
  Share,
  Refresh
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// Mock AI analysis data structure
const aiAnalysis = {
  overallSummary: {
    developmentalAge: "4.2 years",
    chronologicalAge: "3.8 years",
    overallScore: 8.7,
    strengths: ["Creative Expression", "Social-Emotional Skills", "Problem Solving"],
    challenges: ["Fine Motor Precision", "Reading Readiness"],
    trend: "Accelerating Growth",
    confidence: 0.94
  },
  detailedInsights: [
    {
      category: "cognitive",
      title: "Exceptional Problem-Solving Abilities",
      type: "strength",
      confidence: 0.92,
      description: "Emma demonstrates advanced problem-solving skills, consistently finding creative solutions to complex challenges.",
      evidence: [
        "Built complex block structures with engineering principles",
        "Solved multi-step puzzles independently",
        "Created innovative solutions during play scenarios"
      ],
      recommendations: [
        "Introduce more challenging construction toys",
        "Encourage scientific exploration activities",
        "Provide open-ended problem-solving games"
      ],
      developmentalImplications: "This advanced cognitive ability suggests readiness for more complex academic concepts.",
      nextSteps: ["STEM activities", "Logic games", "Building challenges"]
    },
    {
      category: "creative",
      title: "Remarkable Artistic Expression",
      type: "strength",
      confidence: 0.89,
      description: "Demonstrates exceptional creativity and artistic skills well above age level.",
      evidence: [
        "Creates detailed, representational artwork",
        "Uses advanced color mixing techniques",
        "Shows sophisticated understanding of composition"
      ],
      recommendations: [
        "Provide diverse art materials and techniques",
        "Introduce art history and famous artists",
        "Create opportunities for artistic collaboration"
      ],
      developmentalImplications: "Strong visual-spatial intelligence indicates potential for advanced artistic development.",
      nextSteps: ["Art classes", "Museum visits", "Creative projects"]
    },
    {
      category: "physical",
      title: "Fine Motor Development Opportunity",
      type: "growth_area",
      confidence: 0.87,
      description: "While gross motor skills are excellent, fine motor precision could benefit from targeted activities.",
      evidence: [
        "Occasional difficulty with precise cutting",
        "Handwriting shows some shakiness",
        "Button fastening still challenging"
      ],
      recommendations: [
        "Increase fine motor practice through play",
        "Use tweezers and small manipulatives",
        "Practice tracing and pre-writing skills"
      ],
      developmentalImplications: "This is a common area that responds well to targeted practice.",
      nextSteps: ["Fine motor games", "Handwriting practice", "Cutting activities"]
    }
  ],
  predictions: {
    shortTerm: {
      timeline: "1-3 months",
      predictions: [
        {
          skill: "Reading Readiness",
          currentLevel: 69,
          predictedLevel: 78,
          confidence: 0.85,
          factors: ["Phonemic awareness activities", "Letter recognition games", "Story comprehension"]
        },
        {
          skill: "Fine Motor Control",
          currentLevel: 75,
          predictedLevel: 82,
          confidence: 0.88,
          factors: ["Daily practice activities", "Occupational therapy techniques", "Hand strength exercises"]
        }
      ]
    },
    longTerm: {
      timeline: "6-12 months",
      predictions: [
        {
          skill: "Mathematical Concepts",
          currentLevel: 71,
          predictedLevel: 87,
          confidence: 0.79,
          factors: ["Strong problem-solving foundation", "Spatial reasoning abilities", "Number sense development"]
        },
        {
          skill: "Leadership Skills",
          currentLevel: 82,
          predictedLevel: 91,
          confidence: 0.83,
          factors: ["Natural empathy", "Communication skills", "Conflict resolution abilities"]
        }
      ]
    }
  },
  personalizedRecommendations: [
    {
      title: "STEM Exploration Path",
      description: "Build on Emma's problem-solving strengths with engineering and science activities.",
      activities: [
        "Simple machines exploration",
        "Basic chemistry experiments",
        "Engineering design challenges",
        "Nature observation journals"
      ],
      expectedOutcomes: ["Enhanced logical thinking", "Scientific vocabulary", "Hypothesis formation"],
      timeframe: "Ongoing",
      priority: "high"
    },
    {
      title: "Fine Motor Enhancement Program",
      description: "Targeted activities to strengthen fine motor skills and writing readiness.",
      activities: [
        "Play dough manipulation",
        "Bead threading activities",
        "Cutting practice with safety scissors",
        "Finger painting and drawing"
      ],
      expectedOutcomes: ["Improved pencil grip", "Better cutting control", "Enhanced dexterity"],
      timeframe: "Daily, 15-20 minutes",
      priority: "medium"
    },
    {
      title: "Creative Leadership Opportunities",
      description: "Combine Emma's creativity and emerging leadership skills.",
      activities: [
        "Lead art projects with peers",
        "Create and tell stories to younger children",
        "Plan and organize dramatic play scenarios",
        "Mentor newer students"
      ],
      expectedOutcomes: ["Increased confidence", "Enhanced communication", "Peer respect"],
      timeframe: "2-3 times per week",
      priority: "high"
    }
  ],
  comparativeAnalysis: {
    ageComparison: {
      aboveAverage: ["Creative Expression", "Problem Solving", "Empathy", "Imagination"],
      average: ["Physical Strength", "Vocabulary", "Social Communication"],
      belowAverage: [],
      concernAreas: []
    },
    peerComparison: {
      classroom: {
        rank: 2,
        totalStudents: 18,
        strengths: ["Most creative", "Best problem solver", "Kindest peer"],
        uniqueQualities: ["Artistic ability", "Leadership potential", "Innovative thinking"]
      }
    }
  },
  warningFlags: [],
  celebrationMoments: [
    {
      achievement: "First Independent Shoe Tying",
      significance: "Major milestone in self-care development",
      date: new Date().toISOString(),
      category: "adaptive"
    },
    {
      achievement: "Complex Story Creation",
      significance: "Advanced language and narrative skills",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: "language"
    }
  ]
};

// Progress prediction chart
const ProgressPredictionChart = ({ predictions, type = "shortTerm" }) => {
  const data = predictions[type].predictions.map(pred => ({
    skill: pred.skill,
    current: pred.currentLevel,
    predicted: pred.predictedLevel,
    improvement: pred.predictedLevel - pred.currentLevel
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="skill" angle={-45} textAnchor="end" height={60} />
        <YAxis domain={[0, 100]} />
        <RechartsTooltip />
        <Bar dataKey="current" fill="#4ECDC4" name="Current Level" />
        <Bar dataKey="predicted" fill="#FF6B9D" name="Predicted Level" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// AI Insight Card Component
const InsightCard = ({ insight, onExpand }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'strength': return '#4CAF50';
      case 'growth_area': return '#FF9800';
      case 'concern': return '#F44336';
      case 'milestone': return '#2196F3';
      default: return '#757575';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'strength': return <Star />;
      case 'growth_area': return <TrendingUp />;
      case 'concern': return <Warning />;
      case 'milestone': return <EmojiEvents />;
      default: return <Info />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card sx={{
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${getTypeColor(insight.type)}15, ${getTypeColor(insight.type)}08)`,
        border: `1px solid ${getTypeColor(insight.type)}30`,
        cursor: 'pointer',
        '&:hover': {
          boxShadow: `0 8px 25px ${getTypeColor(insight.type)}40`
        }
      }}
      onClick={() => onExpand(insight)}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: getTypeColor(insight.type), width: 32, height: 32 }}>
                {getTypeIcon(insight.type)}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {insight.title}
              </Typography>
            </Box>
            <Chip
              label={`${Math.round(insight.confidence * 100)}% confident`}
              size="small"
              sx={{ bgcolor: getTypeColor(insight.type), color: 'white' }}
            />
          </Box>

          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            {insight.description}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {insight.evidence.length} pieces of evidence
            </Typography>
            <Button size="small" sx={{ color: getTypeColor(insight.type) }}>
              View Details
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ recommendation }) => {
  const [expanded, setExpanded] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  return (
    <Card sx={{ borderRadius: '16px', mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb sx={{ color: '#FFD700' }} />
            {recommendation.title}
          </Typography>
          <Chip
            label={recommendation.priority}
            size="small"
            sx={{
              bgcolor: getPriorityColor(recommendation.priority),
              color: 'white',
              textTransform: 'capitalize'
            }}
          />
        </Box>

        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {recommendation.description}
        </Typography>

        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2">
              {recommendation.activities.length} Recommended Activities
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {recommendation.activities.map((activity, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText primary={activity} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Expected Outcomes:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {recommendation.expectedOutcomes.map((outcome, index) => (
                <Chip key={index} label={outcome} size="small" variant="outlined" />
              ))}
            </Box>

            <Typography variant="body2" color="text.secondary">
              <strong>Timeframe:</strong> {recommendation.timeframe}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

// Main AI Insights Dashboard Component
const AIInsightsDashboard = ({ child, data }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.8);

  // Filter insights by confidence threshold
  const filteredInsights = aiAnalysis.detailedInsights.filter(
    insight => insight.confidence >= confidenceThreshold
  );

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy />
          AI-Powered Development Insights
        </Typography>

        {/* Overall summary cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 'bold' }}>
                {aiAnalysis.overallSummary.overallScore}/10
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Development Score
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                {Math.round(aiAnalysis.overallSummary.confidence * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI Confidence
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                {aiAnalysis.overallSummary.strengths.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Key Strengths
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#E91E63', fontWeight: 'bold' }}>
                {aiAnalysis.personalizedRecommendations.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recommendations
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Main content */}
      <Box sx={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        p: 3,
        backdropFilter: 'blur(20px)'
      }}>
        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                sx={{ color: 'white' }}
              />
            }
            label={<Typography sx={{ color: 'white' }}>Auto-refresh insights</Typography>}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'white' }}>
              Confidence Threshold:
            </Typography>
            <Slider
              value={confidenceThreshold}
              onChange={(e, value) => setConfidenceThreshold(value)}
              min={0.5}
              max={1}
              step={0.05}
              sx={{ width: 120, color: 'white' }}
              marks={[
                { value: 0.5, label: '50%' },
                { value: 0.75, label: '75%' },
                { value: 1, label: '100%' }
              ]}
            />
            <IconButton sx={{ color: 'white' }}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
            '& .Mui-selected': { color: 'white' },
            '& .MuiTabs-indicator': { backgroundColor: '#4ECDC4' }
          }}
        >
          <Tab label="Key Insights" icon={<Insights />} />
          <Tab label="Predictions" icon={<Timeline />} />
          <Tab label="Recommendations" icon={<Recommend />} />
          <Tab label="Comparisons" icon={<Assessment />} />
          <Tab label="Celebrations" icon={<Celebration />} />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={selectedTab} index={0}>
          <Grid container spacing={3}>
            {filteredInsights.map((insight, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <InsightCard
                  insight={insight}
                  onExpand={setSelectedInsight}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timeline />
                    Short-term Predictions (1-3 months)
                  </Typography>
                  <ProgressPredictionChart predictions={aiAnalysis.predictions} type="shortTerm" />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Long-term Predictions (6-12 months)
                  </Typography>
                  <ProgressPredictionChart predictions={aiAnalysis.predictions} type="longTerm" />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
              Prediction Details
            </Typography>
            {[...aiAnalysis.predictions.shortTerm.predictions, ...aiAnalysis.predictions.longTerm.predictions].map((pred, index) => (
              <Card key={index} sx={{ borderRadius: '16px', mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{pred.skill}</Typography>
                    <Chip
                      label={`+${pred.predictedLevel - pred.currentLevel}% improvement`}
                      sx={{ bgcolor: '#4CAF50', color: 'white' }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(pred.currentLevel / pred.predictedLevel) * 100}
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Key factors influencing this prediction:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {pred.factors.map((factor, idx) => (
                      <Chip key={idx} label={factor} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          {aiAnalysis.personalizedRecommendations.map((rec, index) => (
            <RecommendationCard key={index} recommendation={rec} />
          ))}
        </TabPanel>

        <TabPanel value={selectedTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Age Comparison
                  </Typography>

                  <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Above Average Skills ({aiAnalysis.comparativeAnalysis.ageComparison.aboveAverage.length})
                    </Typography>
                    {aiAnalysis.comparativeAnalysis.ageComparison.aboveAverage.join(', ')}
                  </Alert>

                  <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Age-Appropriate Skills ({aiAnalysis.comparativeAnalysis.ageComparison.average.length})
                    </Typography>
                    {aiAnalysis.comparativeAnalysis.ageComparison.average.join(', ')}
                  </Alert>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Classroom Standing
                  </Typography>

                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h3" sx={{ color: '#4ECDC4', fontWeight: 'bold' }}>
                      #{aiAnalysis.comparativeAnalysis.peerComparison.classroom.rank}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      out of {aiAnalysis.comparativeAnalysis.peerComparison.classroom.totalStudents} students
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Unique Strengths:</Typography>
                  <List dense>
                    {aiAnalysis.comparativeAnalysis.peerComparison.classroom.strengths.map((strength, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Star sx={{ color: '#FFD700', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText primary={strength} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={4}>
          <Grid container spacing={3}>
            {aiAnalysis.celebrationMoments.map((moment, index) => (
              <Grid item xs={12} md={6} key={index}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card sx={{
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #FFD70015, #FFD70008)',
                    border: '1px solid #FFD70030'
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar sx={{ bgcolor: '#FFD700', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                        <EmojiEvents sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {moment.achievement}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {moment.significance}
                      </Typography>
                      <Chip
                        label={new Date(moment.date).toLocaleDateString()}
                        size="small"
                        sx={{ bgcolor: '#FFD700', color: 'white' }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Box>

      {/* Detailed Insight Dialog */}
      {selectedInsight && (
        <Dialog
          open={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedInsight.title}</Typography>
            <IconButton onClick={() => setSelectedInsight(null)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {selectedInsight.description}
            </Typography>

            <Typography variant="h6" sx={{ mb: 2 }}>Evidence</Typography>
            <List>
              {selectedInsight.evidence.map((evidence, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#4CAF50' }} />
                  </ListItemIcon>
                  <ListItemText primary={evidence} />
                </ListItem>
              ))}
            </List>

            <Typography variant="h6" sx={{ mb: 2 }}>Recommendations</Typography>
            <List>
              {selectedInsight.recommendations.map((rec, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Lightbulb sx={{ color: '#FFD700' }} />
                  </ListItemIcon>
                  <ListItemText primary={rec} />
                </ListItem>
              ))}
            </List>

            <Alert severity="info" sx={{ mt: 3, borderRadius: '12px' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Developmental Implications
              </Typography>
              <Typography variant="body2">
                {selectedInsight.developmentalImplications}
              </Typography>
            </Alert>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default AIInsightsDashboard;