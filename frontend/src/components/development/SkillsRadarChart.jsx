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
  Slider,
  LinearProgress,
  Paper,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert
} from '@mui/material';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Psychology,
  TrendingUp,
  Compare,
  Timeline,
  Info,
  Star,
  EmojiEvents,
  Assessment,
  ShowChart,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Close,
  Fullscreen,
  Download,
  Share,
  Refresh
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced developmental skills data structure
const skillsData = [
  {
    category: 'Cognitive',
    emoji: '🧠',
    color: '#9C27B0',
    skills: [
      { name: 'Problem Solving', current: 85, potential: 95, ageAverage: 70 },
      { name: 'Memory', current: 78, potential: 88, ageAverage: 75 },
      { name: 'Attention Span', current: 72, potential: 85, ageAverage: 68 },
      { name: 'Creative Thinking', current: 92, potential: 98, ageAverage: 72 },
      { name: 'Logic & Reasoning', current: 68, potential: 82, ageAverage: 65 }
    ],
    overall: 79,
    trend: '+8% this month',
    strengths: ['Creative thinking', 'Problem solving'],
    growthAreas: ['Logic & reasoning', 'Attention span']
  },
  {
    category: 'Physical',
    emoji: '🏃‍♀️',
    color: '#FF5722',
    skills: [
      { name: 'Gross Motor', current: 88, potential: 92, ageAverage: 82 },
      { name: 'Fine Motor', current: 75, potential: 88, ageAverage: 78 },
      { name: 'Balance', current: 82, potential: 90, ageAverage: 80 },
      { name: 'Coordination', current: 79, potential: 87, ageAverage: 76 },
      { name: 'Strength', current: 85, potential: 90, ageAverage: 83 }
    ],
    overall: 82,
    trend: '+5% this month',
    strengths: ['Gross motor skills', 'Strength'],
    growthAreas: ['Fine motor skills']
  },
  {
    category: 'Social-Emotional',
    emoji: '❤️',
    color: '#E91E63',
    skills: [
      { name: 'Empathy', current: 95, potential: 98, ageAverage: 75 },
      { name: 'Cooperation', current: 90, potential: 95, ageAverage: 78 },
      { name: 'Self-Regulation', current: 73, potential: 85, ageAverage: 70 },
      { name: 'Social Communication', current: 87, potential: 92, ageAverage: 80 },
      { name: 'Conflict Resolution', current: 68, potential: 82, ageAverage: 65 }
    ],
    overall: 83,
    trend: '+12% this month',
    strengths: ['Empathy', 'Cooperation'],
    growthAreas: ['Self-regulation', 'Conflict resolution']
  },
  {
    category: 'Language',
    emoji: '📚',
    color: '#2196F3',
    skills: [
      { name: 'Vocabulary', current: 86, potential: 92, ageAverage: 80 },
      { name: 'Grammar', current: 74, potential: 88, ageAverage: 75 },
      { name: 'Reading Readiness', current: 69, potential: 85, ageAverage: 72 },
      { name: 'Listening Skills', current: 91, potential: 95, ageAverage: 78 },
      { name: 'Storytelling', current: 83, potential: 90, ageAverage: 76 }
    ],
    overall: 81,
    trend: '+6% this month',
    strengths: ['Listening skills', 'Vocabulary'],
    growthAreas: ['Reading readiness', 'Grammar']
  },
  {
    category: 'Creative',
    emoji: '🎨',
    color: '#FF9800',
    skills: [
      { name: 'Artistic Expression', current: 94, potential: 98, ageAverage: 75 },
      { name: 'Musical Ability', current: 81, potential: 90, ageAverage: 70 },
      { name: 'Imagination', current: 96, potential: 99, ageAverage: 78 },
      { name: 'Innovation', current: 88, potential: 95, ageAverage: 72 },
      { name: 'Aesthetic Sense', current: 85, potential: 92, ageAverage: 74 }
    ],
    overall: 89,
    trend: '+10% this month',
    strengths: ['Imagination', 'Artistic expression'],
    growthAreas: ['Musical ability']
  },
  {
    category: 'Adaptive',
    emoji: '🌟',
    color: '#4CAF50',
    skills: [
      { name: 'Independence', current: 77, potential: 88, ageAverage: 75 },
      { name: 'Self-Care', current: 82, potential: 90, ageAverage: 80 },
      { name: 'Following Routines', current: 89, potential: 95, ageAverage: 82 },
      { name: 'Safety Awareness', current: 85, potential: 92, ageAverage: 78 },
      { name: 'Responsibility', current: 71, potential: 85, ageAverage: 68 }
    ],
    overall: 81,
    trend: '+7% this month',
    strengths: ['Following routines', 'Safety awareness'],
    growthAreas: ['Responsibility', 'Independence']
  }
];

// Historical progress data for trend analysis
const historicalData = [
  { month: 'Aug', Cognitive: 71, Physical: 77, 'Social-Emotional': 71, Language: 75, Creative: 79, Adaptive: 74 },
  { month: 'Sep', Cognitive: 74, Physical: 79, 'Social-Emotional': 75, Language: 77, Creative: 82, Adaptive: 76 },
  { month: 'Oct', Cognitive: 76, Physical: 80, 'Social-Emotional': 78, Language: 78, Creative: 85, Adaptive: 78 },
  { month: 'Nov', Cognitive: 78, Physical: 81, 'Social-Emotional': 81, Language: 80, Creative: 87, Adaptive: 80 },
  { month: 'Dec', Cognitive: 79, Physical: 82, 'Social-Emotional': 83, Language: 81, Creative: 89, Adaptive: 81 }
];

// Radar chart component with animations
const AnimatedRadarChart = ({ data, colors, selectedView = 'current' }) => {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    // Animate data entry
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 300);

    return () => clearTimeout(timer);
  }, [data]);

  const radarData = skillsData.map(category => ({
    category: category.category,
    current: category.overall,
    potential: selectedView === 'potential' ? category.overall + 10 : category.overall,
    ageAverage: skillsData.find(s => s.category === category.category)?.skills[0]?.ageAverage || 70
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="rgba(255,255,255,0.2)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: 'white', fontSize: 12 }}
          className="radar-labels"
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
        />

        {selectedView === 'comparison' && (
          <Radar
            name="Age Average"
            dataKey="ageAverage"
            stroke="#FFC107"
            fill="#FFC107"
            fillOpacity={0.1}
            strokeWidth={2}
          />
        )}

        <Radar
          name={selectedView === 'potential' ? 'Potential' : 'Current Level'}
          dataKey={selectedView === 'potential' ? 'potential' : 'current'}
          stroke="#4ECDC4"
          fill="#4ECDC4"
          fillOpacity={0.3}
          strokeWidth={3}
          dot={{ fill: '#4ECDC4', strokeWidth: 2, r: 6 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

// Skill detail card
const SkillDetailCard = ({ skill, category, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const progressToMax = (skill.current / skill.potential) * 100;
  const comparisonToAverage = skill.current - skill.ageAverage;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card sx={{
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${category.color}15, ${category.color}08)`,
        border: `1px solid ${category.color}30`,
        '&:hover': {
          boxShadow: `0 8px 25px ${category.color}40`
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {skill.name}
            </Typography>
            <Typography variant="h5" sx={{ color: category.color, fontWeight: 'bold' }}>
              {skill.current}%
            </Typography>
          </Box>

          {/* Current progress bar */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Current Level
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {skill.current}% of potential
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressToMax}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: `${category.color}20`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: category.color,
                  borderRadius: 4
                }
              }}
            />
          </Box>

          {/* Comparison with age average */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              vs Age Average:
            </Typography>
            <Chip
              label={`${comparisonToAverage > 0 ? '+' : ''}${comparisonToAverage}%`}
              size="small"
              sx={{
                bgcolor: comparisonToAverage > 0 ? '#4CAF50' : '#FF9800',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>

          {/* Potential indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Potential: {skill.potential}%
            </Typography>
            <Typography variant="body2" sx={{ color: category.color }}>
              {skill.potential - skill.current}% growth possible
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Chart view toggle component
const ChartViewToggle = ({ view, onChange, options }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
      {options.map(option => (
        <Button
          key={option.key}
          variant={view === option.key ? 'contained' : 'outlined'}
          startIcon={<option.icon />}
          onClick={() => onChange(option.key)}
          sx={{
            borderRadius: '20px',
            bgcolor: view === option.key ? 'rgba(255,255,255,0.9)' : 'transparent',
            color: view === option.key ? '#667eea' : 'white',
            borderColor: 'rgba(255,255,255,0.5)',
            '&:hover': {
              bgcolor: view === option.key ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.1)'
            }
          }}
        >
          {option.label}
        </Button>
      ))}
    </Box>
  );
};

const SkillsRadarChart = ({ child, areas, data }) => {
  const [selectedView, setSelectedView] = useState('current');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState(null);

  const chartOptions = [
    { key: 'current', label: 'Current Skills', icon: Assessment },
    { key: 'potential', label: 'Growth Potential', icon: TrendingUp },
    { key: 'comparison', label: 'vs Age Average', icon: Compare },
    { key: 'trends', label: 'Progress Trends', icon: Timeline }
  ];

  // Calculate overall statistics
  const overallAverage = Math.round(
    skillsData.reduce((sum, category) => sum + category.overall, 0) / skillsData.length
  );

  const topStrengths = skillsData
    .flatMap(category =>
      category.skills.map(skill => ({
        ...skill,
        category: category.category,
        color: category.color
      }))
    )
    .sort((a, b) => b.current - a.current)
    .slice(0, 5);

  const growthOpportunities = skillsData
    .flatMap(category =>
      category.skills.map(skill => ({
        ...skill,
        category: category.category,
        color: category.color,
        growthPotential: skill.potential - skill.current
      }))
    )
    .sort((a, b) => b.growthPotential - a.growthPotential)
    .slice(0, 5);

  const renderChart = () => {
    switch (selectedView) {
      case 'current':
      case 'potential':
      case 'comparison':
        return (
          <AnimatedRadarChart
            data={skillsData}
            colors={skillsData.map(s => s.color)}
            selectedView={selectedView}
          />
        );

      case 'trends':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis dataKey="month" tick={{ fill: 'white', fontSize: 12 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} domain={[60, 100]} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              {skillsData.map((category, index) => (
                <Area
                  key={category.category}
                  type="monotone"
                  dataKey={category.category}
                  stackId="1"
                  stroke={category.color}
                  fill={category.color}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getChartDescription = () => {
    switch (selectedView) {
      case 'current':
        return `This radar chart shows ${child?.name}'s current skill levels across all developmental areas. The larger the area, the stronger the skills.`;
      case 'potential':
        return `This shows the growth potential for each skill area, indicating how much ${child?.name} could develop with continued support.`;
      case 'comparison':
        return `Compare ${child?.name}'s skills against age-appropriate benchmarks. Areas extending beyond the yellow line indicate above-average performance.`;
      case 'trends':
        return `Track progress over time to see which skills are developing most rapidly and identify patterns in growth.`;
      default:
        return '';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShowChart />
          Skills Development Radar
        </Typography>

        {/* Overall statistics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 'bold' }}>
                {overallAverage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Development
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                {topStrengths[0]?.current || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Top Skill
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                {skillsData.filter(s => s.trend.includes('+')).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Improving Areas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#E91E63', fontWeight: 'bold' }}>
                {Math.round(growthOpportunities[0]?.growthPotential || 0)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Growth Potential
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
        {/* Chart controls */}
        <ChartViewToggle
          view={selectedView}
          onChange={setSelectedView}
          options={chartOptions}
        />

        {/* Main radar chart */}
        <Card sx={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1), rgba(102, 126, 234, 0.1))',
          mb: 3,
          position: 'relative'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {chartOptions.find(opt => opt.key === selectedView)?.label} Visualization
              </Typography>
              <IconButton
                sx={{ color: 'white' }}
                onClick={() => setFullscreenChart(selectedView)}
              >
                <Fullscreen />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
              {getChartDescription()}
            </Typography>

            {renderChart()}
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Grid container spacing={3}>
          {/* Top Strengths */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star sx={{ color: '#FFD700' }} />
                  Top Strengths
                </Typography>

                <List>
                  {topStrengths.map((skill, index) => (
                    <ListItem key={skill.name} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: skill.color, width: 32, height: 32 }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={skill.name}
                        secondary={`${skill.current}% • ${skill.category}`}
                      />
                      <Chip
                        label={`+${skill.current - skill.ageAverage}% vs avg`}
                        size="small"
                        sx={{ bgcolor: '#4CAF50', color: 'white' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Growth Opportunities */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp sx={{ color: '#FF9800' }} />
                  Growth Opportunities
                </Typography>

                <List>
                  {growthOpportunities.map((skill, index) => (
                    <ListItem key={skill.name} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: skill.color, width: 32, height: 32 }}>
                          <TrendingUp sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={skill.name}
                        secondary={`Current: ${skill.current}% • ${skill.category}`}
                      />
                      <Chip
                        label={`${skill.growthPotential}% potential`}
                        size="small"
                        sx={{ bgcolor: '#FF9800', color: 'white' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed skills grid */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Detailed Skills Analysis
          </Typography>

          {skillsData.map(category => (
            <Box key={category.category} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{
                color: 'white',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Avatar sx={{ bgcolor: category.color, width: 32, height: 32 }}>
                  {category.emoji}
                </Avatar>
                {category.category} ({category.overall}% average)
                <Chip
                  label={category.trend}
                  size="small"
                  sx={{ bgcolor: '#4CAF50', color: 'white', ml: 1 }}
                />
              </Typography>

              <Grid container spacing={2}>
                {category.skills.map(skill => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={skill.name}>
                    <SkillDetailCard
                      skill={skill}
                      category={category}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>

        {/* Insights and recommendations */}
        <Card sx={{ mt: 3, borderRadius: '16px' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology sx={{ color: '#9C27B0' }} />
              AI-Generated Insights
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
                  <strong>Exceptional Creativity:</strong> {child?.name} shows remarkable artistic expression and imagination skills, scoring in the 96th percentile for age group.
                </Alert>
                <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
                  <strong>Balanced Development:</strong> Skills are developing evenly across all areas with no concerning delays.
                </Alert>
                <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                  <strong>Focus Opportunity:</strong> Reading readiness could benefit from additional phonics activities and letter recognition games.
                </Alert>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px' }}>
                  <Typography variant="h4" sx={{ color: '#4ECDC4', mb: 1 }}>
                    8.7/10
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Development Wellness Score
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Based on age-appropriate milestones and individual progress
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Fullscreen chart dialog */}
      <Dialog
        open={!!fullscreenChart}
        onClose={() => setFullscreenChart(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '20px', minHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            {chartOptions.find(opt => opt.key === fullscreenChart)?.label} - Fullscreen View
          </Typography>
          <IconButton onClick={() => setFullscreenChart(null)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ height: 600 }}>
          {fullscreenChart && (
            <AnimatedRadarChart
              data={skillsData}
              colors={skillsData.map(s => s.color)}
              selectedView={fullscreenChart}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SkillsRadarChart;