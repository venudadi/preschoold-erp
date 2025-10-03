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
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Compare,
  Psychology,
  DirectionsRun,
  Favorite,
  MenuBook,
  Palette,
  Star,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  EmojiEvents,
  Warning,
  CheckCircle,
  Info,
  School,
  Group,
  Person,
  Timeline,
  Assessment,
  BarChart,
  ShowChart,
  PieChart,
  ExpandMore,
  FilterList,
  Visibility,
  VisibilityOff,
  Close,
  Share,
  Download,
  Refresh
} from '@mui/icons-material';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  Cell,
  PieChart as RechartsPieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// Developmental standards and benchmarks
const developmentalBenchmarks = {
  ageRanges: [
    { label: '3.0-3.5 years', value: 3.25, color: '#FF9800' },
    { label: '3.5-4.0 years', value: 3.75, color: '#2196F3' },
    { label: '4.0-4.5 years', value: 4.25, color: '#4CAF50' },
    { label: '4.5-5.0 years', value: 4.75, color: '#9C27B0' }
  ],
  categories: {
    cognitive: {
      name: 'Cognitive Development',
      emoji: '🧠',
      color: '#9C27B0',
      benchmarks: {
        3.25: { typical: 65, advanced: 80, milestones: ['Simple problem solving', 'Basic counting'] },
        3.75: { typical: 72, advanced: 85, milestones: ['Complex problem solving', 'Pattern recognition'] },
        4.25: { typical: 78, advanced: 90, milestones: ['Abstract thinking', 'Mathematical concepts'] },
        4.75: { typical: 83, advanced: 93, milestones: ['Logic reasoning', 'Hypothesis formation'] }
      },
      skills: [
        'Problem Solving', 'Memory', 'Attention Span', 'Creative Thinking', 'Logic & Reasoning'
      ]
    },
    physical: {
      name: 'Physical Development',
      emoji: '🏃‍♀️',
      color: '#FF5722',
      benchmarks: {
        3.25: { typical: 70, advanced: 82, milestones: ['Running smoothly', 'Basic climbing'] },
        3.75: { typical: 75, advanced: 86, milestones: ['Balance on one foot', 'Pedaling tricycle'] },
        4.25: { typical: 80, advanced: 88, milestones: ['Jumping with both feet', 'Catching ball'] },
        4.75: { typical: 84, advanced: 92, milestones: ['Skipping', 'Complex coordination'] }
      },
      skills: [
        'Gross Motor', 'Fine Motor', 'Balance', 'Coordination', 'Strength'
      ]
    },
    socialEmotional: {
      name: 'Social-Emotional',
      emoji: '❤️',
      color: '#E91E63',
      benchmarks: {
        3.25: { typical: 68, advanced: 78, milestones: ['Parallel play', 'Basic empathy'] },
        3.75: { typical: 74, advanced: 83, milestones: ['Cooperative play', 'Emotion recognition'] },
        4.25: { typical: 79, advanced: 88, milestones: ['Friendship formation', 'Conflict resolution'] },
        4.75: { typical: 82, advanced: 90, milestones: ['Leadership skills', 'Advanced empathy'] }
      },
      skills: [
        'Empathy', 'Cooperation', 'Self-Regulation', 'Social Communication', 'Conflict Resolution'
      ]
    },
    language: {
      name: 'Language Development',
      emoji: '📚',
      color: '#2196F3',
      benchmarks: {
        3.25: { typical: 70, advanced: 82, milestones: ['300+ word vocabulary', 'Simple sentences'] },
        3.75: { typical: 76, advanced: 87, milestones: ['Complex sentences', 'Story comprehension'] },
        4.25: { typical: 81, advanced: 90, milestones: ['Letter recognition', 'Rhyming'] },
        4.75: { typical: 85, advanced: 93, milestones: ['Pre-reading skills', 'Complex narratives'] }
      },
      skills: [
        'Vocabulary', 'Grammar', 'Reading Readiness', 'Listening Skills', 'Storytelling'
      ]
    },
    creative: {
      name: 'Creative Development',
      emoji: '🎨',
      color: '#FF9800',
      benchmarks: {
        3.25: { typical: 72, advanced: 80, milestones: ['Scribble art', 'Pretend play'] },
        3.75: { typical: 76, advanced: 85, milestones: ['Representational art', 'Role playing'] },
        4.25: { typical: 80, advanced: 88, milestones: ['Detailed drawings', 'Creative storytelling'] },
        4.75: { typical: 83, advanced: 92, milestones: ['Complex art', 'Original ideas'] }
      },
      skills: [
        'Artistic Expression', 'Musical Ability', 'Imagination', 'Innovation', 'Aesthetic Sense'
      ]
    },
    adaptive: {
      name: 'Adaptive Skills',
      emoji: '⭐',
      color: '#4CAF50',
      benchmarks: {
        3.25: { typical: 68, advanced: 78, milestones: ['Basic self-care', 'Simple routines'] },
        3.75: { typical: 74, advanced: 82, milestones: ['Independence in tasks', 'Following rules'] },
        4.25: { typical: 78, advanced: 86, milestones: ['Complex self-care', 'Responsibility'] },
        4.75: { typical: 82, advanced: 89, milestones: ['Full independence', 'Task planning'] }
      },
      skills: [
        'Independence', 'Self-Care', 'Following Routines', 'Safety Awareness', 'Responsibility'
      ]
    }
  }
};

// Mock child data for comparison
const childData = {
  name: 'Emma',
  chronologicalAge: 3.8, // 3 years, 10 months
  currentScores: {
    cognitive: 79,
    physical: 82,
    socialEmotional: 83,
    language: 81,
    creative: 89,
    adaptive: 81
  },
  skillBreakdown: {
    cognitive: { 'Problem Solving': 85, 'Memory': 78, 'Attention Span': 72, 'Creative Thinking': 92, 'Logic & Reasoning': 68 },
    physical: { 'Gross Motor': 88, 'Fine Motor': 75, 'Balance': 82, 'Coordination': 79, 'Strength': 85 },
    socialEmotional: { 'Empathy': 95, 'Cooperation': 90, 'Self-Regulation': 73, 'Social Communication': 87, 'Conflict Resolution': 68 },
    language: { 'Vocabulary': 86, 'Grammar': 74, 'Reading Readiness': 69, 'Listening Skills': 91, 'Storytelling': 83 },
    creative: { 'Artistic Expression': 94, 'Musical Ability': 81, 'Imagination': 96, 'Innovation': 88, 'Aesthetic Sense': 85 },
    adaptive: { 'Independence': 77, 'Self-Care': 82, 'Following Routines': 89, 'Safety Awareness': 85, 'Responsibility': 71 }
  }
};

// Comparison visualization components
const RadarComparison = ({ childScore, ageGroup, showPeers = false }) => {
  const age = childData.chronologicalAge;
  const benchmarks = Object.keys(developmentalBenchmarks.categories).map(category => {
    const categoryData = developmentalBenchmarks.categories[category];
    const benchmark = categoryData.benchmarks[age] || categoryData.benchmarks[3.75];

    return {
      category: categoryData.name,
      child: childData.currentScores[category],
      typical: benchmark.typical,
      advanced: benchmark.advanced,
      fullMark: 100
    };
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={benchmarks}>
        <PolarGrid />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />

        <Radar
          name="Age Typical"
          dataKey="typical"
          stroke="#FFD700"
          fill="#FFD700"
          fillOpacity={0.1}
          strokeWidth={2}
        />

        <Radar
          name="Advanced"
          dataKey="advanced"
          stroke="#FF9800"
          fill="#FF9800"
          fillOpacity={0.1}
          strokeWidth={2}
          strokeDasharray="5 5"
        />

        <Radar
          name={`${childData.name}'s Score`}
          dataKey="child"
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

const CategoryComparison = ({ category, detailed = false }) => {
  const categoryData = developmentalBenchmarks.categories[category];
  const age = childData.chronologicalAge;
  const benchmark = categoryData.benchmarks[age] || categoryData.benchmarks[3.75];
  const childScore = childData.currentScores[category];

  const getPerformanceLevel = (score, typical, advanced) => {
    if (score >= advanced) return { level: 'Advanced', color: '#4CAF50', icon: <TrendingUp /> };
    if (score >= typical) return { level: 'Typical', color: '#2196F3', icon: <TrendingFlat /> };
    return { level: 'Developing', color: '#FF9800', icon: <TrendingDown /> };
  };

  const performance = getPerformanceLevel(childScore, benchmark.typical, benchmark.advanced);

  return (
    <Card sx={{ borderRadius: '16px', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: categoryData.color, width: 48, height: 48 }}>
            {categoryData.emoji}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {categoryData.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {performance.icon}
              <Chip
                label={performance.level}
                sx={{
                  bgcolor: performance.color,
                  color: 'white',
                  fontWeight: 'bold'
                }}
                size="small"
              />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ color: categoryData.color, fontWeight: 'bold' }}>
            {childScore}%
          </Typography>
        </Box>

        {/* Progress bars */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              vs Age-Typical ({benchmark.typical}%)
            </Typography>
            <Typography variant="body2" sx={{ color: childScore >= benchmark.typical ? '#4CAF50' : '#FF9800' }}>
              {childScore >= benchmark.typical ? '+' : ''}{childScore - benchmark.typical}%
            </Typography>
          </Box>
          <LinearProgress
            variant="buffer"
            value={(childScore / 100) * 100}
            valueBuffer={(benchmark.typical / 100) * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.300',
              '& .MuiLinearProgress-bar1': {
                bgcolor: categoryData.color
              },
              '& .MuiLinearProgress-bar2': {
                bgcolor: '#FFD700'
              }
            }}
          />
        </Box>

        {/* Advanced comparison */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              vs Advanced Level ({benchmark.advanced}%)
            </Typography>
            <Typography variant="body2" sx={{ color: childScore >= benchmark.advanced ? '#4CAF50' : '#FF9800' }}>
              {childScore >= benchmark.advanced ? '+' : ''}{childScore - benchmark.advanced}%
            </Typography>
          </Box>
          <LinearProgress
            variant="buffer"
            value={(childScore / 100) * 100}
            valueBuffer={(benchmark.advanced / 100) * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.300',
              '& .MuiLinearProgress-bar1': {
                bgcolor: categoryData.color
              },
              '& .MuiLinearProgress-bar2': {
                bgcolor: '#FF9800'
              }
            }}
          />
        </Box>

        {detailed && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Skill Breakdown:
            </Typography>
            {categoryData.skills.map(skill => {
              const skillScore = childData.skillBreakdown[category][skill];
              const skillBenchmark = benchmark.typical;
              return (
                <Box key={skill} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 120, fontSize: '0.8rem' }}>
                    {skill}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={skillScore}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'grey.300',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: skillScore >= skillBenchmark ? '#4CAF50' : '#FF9800'
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ minWidth: 30 }}>
                    {skillScore}%
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Age milestones */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Age-Appropriate Milestones:
        </Typography>
        <List dense>
          {benchmark.milestones.map((milestone, index) => (
            <ListItem key={index} sx={{ py: 0 }}>
              <ListItemIcon>
                <CheckCircle sx={{ color: '#4CAF50', fontSize: 16 }} />
              </ListItemIcon>
              <ListItemText
                primary={milestone}
                primaryTypographyProps={{ fontSize: '0.8rem' }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

const AgeProgressionChart = ({ category }) => {
  const categoryData = developmentalBenchmarks.categories[category];
  const ages = [3.25, 3.5, 3.75, 4.0, 4.25, 4.5, 4.75];

  const data = ages.map(age => ({
    age: `${Math.floor(age)} yr ${Math.round((age % 1) * 12)} mo`,
    typical: categoryData.benchmarks[age]?.typical ||
             categoryData.benchmarks[Math.floor(age * 4) / 4]?.typical || 70,
    advanced: categoryData.benchmarks[age]?.advanced ||
              categoryData.benchmarks[Math.floor(age * 4) / 4]?.advanced || 85,
    child: age <= childData.chronologicalAge ? childData.currentScores[category] : null
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="age" angle={-45} textAnchor="end" height={60} />
        <YAxis domain={[50, 100]} />
        <RechartsTooltip />

        <Area
          type="monotone"
          dataKey="advanced"
          stroke="#FF9800"
          fill="#FF9800"
          fillOpacity={0.1}
          name="Advanced Range"
        />

        <Area
          type="monotone"
          dataKey="typical"
          stroke="#FFD700"
          fill="#FFD700"
          fillOpacity={0.2}
          name="Typical Range"
        />

        <Line
          type="monotone"
          dataKey="child"
          stroke="#4ECDC4"
          strokeWidth={3}
          dot={{ fill: '#4ECDC4', strokeWidth: 2, r: 6 }}
          name={`${childData.name}'s Progress`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const BenchmarkComparison = ({ child, comparisonData }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTab, setSelectedTab] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [showPeerData, setShowPeerData] = useState(false);
  const [ageRange, setAgeRange] = useState(childData.chronologicalAge);
  const [detailedView, setDetailedView] = useState(false);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  // Calculate overall performance summary
  const overallStats = {
    aboveAdvanced: Object.keys(childData.currentScores).filter(category => {
      const age = childData.chronologicalAge;
      const benchmark = developmentalBenchmarks.categories[category].benchmarks[age] ||
                       developmentalBenchmarks.categories[category].benchmarks[3.75];
      return childData.currentScores[category] >= benchmark.advanced;
    }).length,
    typical: Object.keys(childData.currentScores).filter(category => {
      const age = childData.chronologicalAge;
      const benchmark = developmentalBenchmarks.categories[category].benchmarks[age] ||
                       developmentalBenchmarks.categories[category].benchmarks[3.75];
      return childData.currentScores[category] >= benchmark.typical &&
             childData.currentScores[category] < benchmark.advanced;
    }).length,
    developing: Object.keys(childData.currentScores).filter(category => {
      const age = childData.chronologicalAge;
      const benchmark = developmentalBenchmarks.categories[category].benchmarks[age] ||
                       developmentalBenchmarks.categories[category].benchmarks[3.75];
      return childData.currentScores[category] < benchmark.typical;
    }).length
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Compare />
          Developmental Benchmarks Comparison
        </Typography>

        {/* Summary statistics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                {overallStats.aboveAdvanced}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced Areas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                {overallStats.typical}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Typical Development
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                {overallStats.developing}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Developing Areas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: '#E91E63', fontWeight: 'bold' }}>
                {childData.chronologicalAge.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chronological Age
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  sx={{ color: 'white' }}
                />
              }
              label={<Typography sx={{ color: 'white' }}>Show Advanced Benchmarks</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={detailedView}
                  onChange={(e) => setDetailedView(e.target.checked)}
                  sx={{ color: 'white' }}
                />
              }
              label={<Typography sx={{ color: 'white' }}>Detailed Skills View</Typography>}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'white' }}>
              Compare to Age:
            </Typography>
            <Select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.3)'
                },
                '& .MuiSelect-icon': {
                  color: 'white'
                }
              }}
            >
              {developmentalBenchmarks.ageRanges.map(range => (
                <MenuItem key={range.value} value={range.value}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
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
          <Tab label="Overview" icon={<Assessment />} />
          <Tab label="Category Details" icon={<BarChart />} />
          <Tab label="Age Progression" icon={<Timeline />} />
          <Tab label="Peer Comparison" icon={<Group />} />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={selectedTab} index={0}>
          {/* Radar chart overview */}
          <Card sx={{ borderRadius: '16px', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShowChart />
                Developmental Profile Overview
              </Typography>

              <RadarComparison
                childScore={childData.currentScores}
                ageGroup={ageRange}
                showPeers={showPeerData}
              />

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#FFD700', borderRadius: 1 }} />
                  <Typography variant="body2">Age Typical</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#FF9800', borderRadius: 1 }} />
                  <Typography variant="body2">Advanced</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#4ECDC4', borderRadius: 1 }} />
                  <Typography variant="body2">{childData.name}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Performance alerts */}
          {overallStats.aboveAdvanced > 0 && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                🌟 Exceptional Performance
              </Typography>
              <Typography variant="body2">
                {childData.name} is performing at advanced levels in {overallStats.aboveAdvanced} developmental areas!
              </Typography>
            </Alert>
          )}

          {overallStats.developing > 0 && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                📈 Growth Opportunities
              </Typography>
              <Typography variant="body2">
                {overallStats.developing} area(s) show potential for focused development activities.
              </Typography>
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Grid container spacing={3}>
            {Object.entries(developmentalBenchmarks.categories).map(([key, category]) => (
              <Grid item xs={12} md={6} lg={4} key={key}>
                <CategoryComparison
                  category={key}
                  detailed={detailedView}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Grid container spacing={3}>
            {Object.entries(developmentalBenchmarks.categories).map(([key, category]) => (
              <Grid item xs={12} md={6} key={key}>
                <Card sx={{ borderRadius: '16px' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: category.color
                    }}>
                      <Avatar sx={{ bgcolor: category.color, width: 32, height: 32 }}>
                        {category.emoji}
                      </Avatar>
                      {category.name} Progression
                    </Typography>

                    <AgeProgressionChart category={key} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Peer Group Comparison
                  </Typography>

                  <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
                    <Typography variant="body2">
                      Peer comparisons are anonymized and based on classroom data. Individual privacy is protected.
                    </Typography>
                  </Alert>

                  {/* Mock peer comparison data */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h2" sx={{ color: '#4ECDC4', fontWeight: 'bold' }}>
                      Top 15%
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Overall classroom ranking
                    </Typography>
                  </Box>

                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <EmojiEvents sx={{ color: '#FFD700' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Highest in Creative Development"
                        secondary="Ranks #1 out of 18 students in artistic and imaginative skills"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Star sx={{ color: '#4CAF50' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Strong Social-Emotional Skills"
                        secondary="Top 3 in empathy and cooperation among peers"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUp sx={{ color: '#2196F3' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Above Average Problem Solving"
                        secondary="Consistently outperforms age-matched peers in cognitive tasks"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: '16px', mb: 3 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Class Statistics
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" sx={{ color: '#4ECDC4', fontWeight: 'bold' }}>
                      18
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Students
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      4.2
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Class Average Age
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                      78%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Development Score
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: '16px' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Percentile Ranking
                  </Typography>

                  {Object.entries(developmentalBenchmarks.categories).map(([key, category]) => {
                    // Mock percentile data
                    const percentile = Math.floor(Math.random() * 30) + 70; // 70-100th percentile
                    return (
                      <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: category.color, width: 32, height: 32 }}>
                          {category.emoji}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {category.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {percentile}th percentile
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ color: category.color }}>
                          {percentile}%
                        </Typography>
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default BenchmarkComparison;