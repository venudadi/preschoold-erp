import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Paper,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert,
  Fade,
  Grow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  PhotoLibrary as PortfolioIcon,
  Campaign as AnnouncementsIcon,
  Chat as MessagesIcon,
  ReceiptLong as BillingIcon,
  EmojiEvents as ProgressIcon,
  Restaurant as FoodIcon,
  Bedtime as SleepIcon,
  ChildCare as PottyIcon,
  LocalHospital as HealthIcon,
  Star as StarIcon,
  FamilyRestroom as FamilyIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import api from '../services/api';

// Import components
import PortfolioGallery from './PortfolioGallery';
import Messaging from './Messaging';
import ClassroomAnnouncements from './ClassroomAnnouncements';
import InvoiceList from './InvoiceList';
import ObservationLogList from './ObservationLogList';
import DailyActivityView from './DailyActivityView';
import ParentPreferences from './ParentPreferences';
import ParentFeedback from './ParentFeedback';

/**
 * Enhanced Parent Dashboard with Child Selector
 * Features: Multiple child support, beautiful child switcher, center name display
 */
const EnhancedParentDashboard = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  const selectedChild = children[selectedChildIndex] || {};
  const hasMultipleChildren = children.length > 1;

  // Fetch parent's children on mount
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const response = await api.get('/parents/my-children');
        const childrenData = response.data.children || response.data || [];
        setChildren(childrenData);
        localStorage.setItem('children', JSON.stringify(childrenData));
        setError('');
      } catch (err) {
        console.error('Error fetching children:', err);
        const storedChildren = JSON.parse(localStorage.getItem('children') || '[]');
        setChildren(storedChildren);
        if (storedChildren.length === 0) {
          setError('Unable to load your children data. Please contact support.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  const handleChildMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleChildMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChildSelect = (index) => {
    setSelectedChildIndex(index);
    setSelectedActivity(null); // Reset to activity grid when switching children
    handleChildMenuClose();
  };

  // Activity configurations with vibrant colors
  const activities = [
    {
      id: 'diary',
      name: 'Daily Diary',
      icon: FoodIcon,
      bgColor: '#FFF3E0',
      iconColor: '#FF9800',
      borderColor: '#FF9800',
      component: <DailyActivityView childId={selectedChild.id} childName={selectedChild.first_name} />
    },
    {
      id: 'portfolio',
      name: 'Share Media',
      icon: PortfolioIcon,
      bgColor: '#FCE4EC',
      iconColor: '#E91E63',
      borderColor: '#E91E63',
      component: <PortfolioGallery childId={selectedChild.id} />
    },
    {
      id: 'progress',
      name: 'Play and Learn',
      icon: ProgressIcon,
      bgColor: '#E8EAF6',
      iconColor: '#5C6BC0',
      borderColor: '#5C6BC0',
      component: <ObservationLogList childId={selectedChild.id} />
    },
    {
      id: 'announcements',
      name: 'Observations',
      icon: AnnouncementsIcon,
      bgColor: '#E0F2F1',
      iconColor: '#26A69A',
      borderColor: '#26A69A',
      component: <ClassroomAnnouncements classroomId={selectedChild.classroom_id} role="parent" />
    },
    {
      id: 'food',
      name: 'Food',
      icon: FoodIcon,
      bgColor: '#E8F5E9',
      iconColor: '#66BB6A',
      borderColor: '#66BB6A',
      component: <DailyActivityView childId={selectedChild.id} childName={selectedChild.first_name} />
    },
    {
      id: 'sleep',
      name: 'Sleep',
      icon: SleepIcon,
      bgColor: '#E1F5FE',
      iconColor: '#29B6F6',
      borderColor: '#29B6F6',
      component: <DailyActivityView childId={selectedChild.id} childName={selectedChild.first_name} />
    },
    {
      id: 'star',
      name: 'Star',
      icon: StarIcon,
      bgColor: '#E0F7FA',
      iconColor: '#00BCD4',
      borderColor: '#00BCD4',
      component: <ObservationLogList childId={selectedChild.id} />
    },
    {
      id: 'potty',
      name: 'Potty',
      icon: PottyIcon,
      bgColor: '#FFF9C4',
      iconColor: '#FBC02D',
      borderColor: '#FBC02D',
      component: <DailyActivityView childId={selectedChild.id} childName={selectedChild.first_name} />
    },
    {
      id: 'health',
      name: 'Health',
      icon: HealthIcon,
      bgColor: '#FFEBEE',
      iconColor: '#EF5350',
      borderColor: '#EF5350',
      component: <Typography variant="body1" p={3}>Health tracking coming soon...</Typography>
    },
    {
      id: 'messages',
      name: 'Messages',
      icon: MessagesIcon,
      bgColor: '#F3E5F5',
      iconColor: '#AB47BC',
      borderColor: '#AB47BC',
      component: <Messaging />
    },
    {
      id: 'billing',
      name: 'Billing',
      icon: BillingIcon,
      bgColor: '#FFF3E0',
      iconColor: '#FFA726',
      borderColor: '#FFA726',
      component: <InvoiceList />
    }
  ];

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
  };

  const handleBackToActivities = () => {
    setSelectedActivity(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        p: isMobile ? 2 : 4
      }}
    >
      {/* Header with Child Selector */}
      <Fade in timeout={800}>
        <Paper
          elevation={8}
          sx={{
            borderRadius: 4,
            mb: 4,
            p: isMobile ? 2 : 4,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" flex={1}>
              <Avatar
                sx={{
                  bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  width: isMobile ? 56 : 72,
                  height: isMobile ? 56 : 72,
                  mr: 2,
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                }}
              >
                <FamilyIcon fontSize="large" />
              </Avatar>
              <Box flex={1}>
                <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} color="primary.main">
                  Welcome, {user?.name || user?.full_name || 'Parent'}!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedChild.center_name || 'Preschool ERP System'}
                </Typography>
              </Box>
            </Box>

            {/* Child Selector - Only show if multiple children */}
            {hasMultipleChildren && (
              <Box>
                <Chip
                  avatar={
                    <Avatar sx={{ bgcolor: '#667eea', color: 'white' }}>
                      {selectedChild.first_name?.charAt(0) || 'C'}
                    </Avatar>
                  }
                  label={
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" fontWeight={600}>
                        {selectedChild.first_name || 'Child'} {selectedChild.last_name || ''}
                      </Typography>
                      <ExpandMoreIcon sx={{ ml: 0.5 }} />
                    </Box>
                  }
                  onClick={handleChildMenuOpen}
                  sx={{
                    height: 48,
                    px: 1,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: '#667eea',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      transform: 'scale(1.05)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                />
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleChildMenuClose}
                  PaperProps={{
                    elevation: 8,
                    sx: {
                      mt: 1,
                      minWidth: 280,
                      borderRadius: 2,
                      overflow: 'hidden'
                    }
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, bgcolor: '#f5f5f5' }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      SELECT CHILD
                    </Typography>
                  </Box>
                  <Divider />
                  {children.map((child, index) => (
                    <MenuItem
                      key={child.id || index}
                      selected={index === selectedChildIndex}
                      onClick={() => handleChildSelect(index)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&.Mui-selected': {
                          bgcolor: '#E8EAF6',
                          '&:hover': {
                            bgcolor: '#C5CAE9'
                          }
                        }
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: index === selectedChildIndex ? '#667eea' : '#ccc',
                            width: 36,
                            height: 36
                          }}
                        >
                          {child.first_name?.charAt(0) || 'C'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight={500}>
                            {child.first_name} {child.last_name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              <SchoolIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                              {child.classroom_name || 'No classroom assigned'}
                            </Typography>
                            <Typography variant="caption" display="block" color="primary.main">
                              {child.center_name || 'Center info unavailable'}
                            </Typography>
                          </Box>
                        }
                      />
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            )}
          </Box>

          {/* Current Child Info - Always visible */}
          {selectedChild.first_name && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                border: '1px solid rgba(102, 126, 234, 0.3)'
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={hasMultipleChildren ? 4 : 6}>
                  <Box display="flex" alignItems="center">
                    <PersonIcon sx={{ mr: 1, color: '#667eea' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Viewing
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedChild.first_name} {selectedChild.last_name}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={hasMultipleChildren ? 4 : 6}>
                  <Box display="flex" alignItems="center">
                    <SchoolIcon sx={{ mr: 1, color: '#667eea' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Classroom
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedChild.classroom_name || 'Unassigned'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                {hasMultipleChildren && (
                  <Grid item xs={12} sm={4}>
                    <Chip
                      label={`${children.length} Children Enrolled`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {children.length === 0 && !error && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No children found in your account. Please contact the school administration.
            </Alert>
          )}
        </Paper>
      </Fade>

      {/* Main Content */}
      {!selectedActivity ? (
        /* Floating Icons Grid */
        <Box>
          <Fade in timeout={1000}>
            <Typography
              variant="h4"
              align="center"
              fontWeight={700}
              color="white"
              mb={4}
              sx={{
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                letterSpacing: 1
              }}
            >
              Activities
            </Typography>
          </Fade>

          <Grid
            container
            spacing={isMobile ? 2 : 4}
            justifyContent="center"
            sx={{ maxWidth: 1200, mx: 'auto' }}
          >
            {activities.map((activity, index) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={activity.id}>
                <Grow in timeout={800 + index * 100}>
                  <Card
                    onClick={() => handleActivityClick(activity)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 4,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: activity.bgColor,
                      border: `3px solid transparent`,
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.05)',
                        boxShadow: `0 12px 40px ${activity.iconColor}40`,
                        border: `3px solid ${activity.borderColor}`
                      },
                      '&:active': {
                        transform: 'translateY(-8px) scale(1.02)'
                      }
                    }}
                  >
                    <CardContent
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: isMobile ? 2 : 3,
                        '&:last-child': { pb: isMobile ? 2 : 3 }
                      }}
                    >
                      <Box
                        sx={{
                          width: isMobile ? 56 : 64,
                          height: isMobile ? 56 : 64,
                          borderRadius: '50%',
                          bgcolor: activity.iconColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1.5,
                          boxShadow: `0 4px 16px ${activity.iconColor}40`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: `0 8px 24px ${activity.iconColor}60`
                          }
                        }}
                      >
                        <activity.icon
                          sx={{
                            color: 'white',
                            fontSize: isMobile ? 32 : 36
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        align="center"
                        color="text.primary"
                        sx={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          lineHeight: 1.2
                        }}
                      >
                        {activity.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        /* Selected Activity View */
        <Fade in timeout={600}>
          <Box>
            <Paper
              elevation={8}
              sx={{
                borderRadius: 4,
                p: isMobile ? 2 : 4,
                background: 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  onClick={handleBackToActivities}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: selectedActivity.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: `0 4px 16px ${selectedActivity.iconColor}60`
                    }
                  }}
                >
                  <selectedActivity.icon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box flex={1}>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {selectedActivity.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedChild.first_name} {selectedChild.last_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    onClick={handleBackToActivities}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    ← Back to Activities
                  </Typography>
                </Box>
              </Box>

              <Box>{selectedActivity.component}</Box>
            </Paper>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default EnhancedParentDashboard;
