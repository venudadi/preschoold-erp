import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Restaurant as FoodIcon,
  Bedtime as SleepIcon,
  ChildCare as PottyIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../services/api';

/**
 * DailyActivityView - Parents view daily activities of their children
 * Displays: Food consumption, Sleep duration, Potty tracking
 */
const DailyActivityView = ({ childId, childName, date = dayjs() }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState({
    food: [],
    sleep: [],
    potty: []
  });

  useEffect(() => {
    if (childId) {
      fetchDailyActivities();
    }
  }, [childId, date]);

  const fetchDailyActivities = async () => {
    setLoading(true);
    setError('');
    try {
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      const response = await api.get(`/daily-activities/${childId}`, {
        params: { date: formattedDate }
      });

      setActivities({
        food: response.data.food || [],
        sleep: response.data.sleep || [],
        potty: response.data.potty || []
      });
    } catch (err) {
      console.error('Error fetching daily activities:', err);
      setError('Failed to load daily activities');
      setActivities({ food: [], sleep: [], potty: [] });
    } finally {
      setLoading(false);
    }
  };

  const getMealTypeLabel = (type) => {
    const labels = {
      breakfast: 'Morning Snack',
      lunch: 'Lunch',
      snack: 'Evening Snack'
    };
    return labels[type] || type;
  };

  const getMealTypeColor = (type) => {
    const colors = {
      breakfast: '#FF9800',
      lunch: '#4CAF50',
      snack: '#9C27B0'
    };
    return colors[type] || '#757575';
  };

  const calculateTotalSleep = () => {
    return activities.sleep.reduce((total, entry) => {
      return total + parseFloat(entry.duration_hours || 0);
    }, 0).toFixed(1);
  };

  const getBathroomCount = () => {
    return activities.potty.filter(p => p.type === 'bathroom').length;
  };

  const getDiaperChanges = () => {
    return activities.potty.filter(p => p.type === 'diaper_change');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Daily Activities - {dayjs(date).format('MMMM D, YYYY')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* FOOD CARD */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
              border: '2px solid #FF9800',
              borderRadius: 3
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    bgcolor: '#FF9800',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2,
                    display: 'flex'
                  }}
                >
                  <FoodIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  Food
                </Typography>
              </Box>

              {activities.food.length > 0 ? (
                <Box>
                  {activities.food.map((entry, index) => (
                    <Paper
                      key={entry.id || index}
                      elevation={1}
                      sx={{
                        p: 1.5,
                        mb: 1.5,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        borderLeft: 4,
                        borderColor: getMealTypeColor(entry.meal_type)
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Chip
                          label={getMealTypeLabel(entry.meal_type)}
                          size="small"
                          sx={{
                            bgcolor: getMealTypeColor(entry.meal_type),
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(entry.created_at).format('h:mm A')}
                        </Typography>
                      </Box>

                      <Box mb={1}>
                        <Typography variant="body2" fontWeight={500} gutterBottom>
                          Consumed: {entry.food_consumed}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={entry.food_consumed}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getMealTypeColor(entry.meal_type)
                            }
                          }}
                        />
                      </Box>

                      {entry.notes && (
                        <Typography variant="caption" color="text.secondary">
                          Note: {entry.notes}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" p={2}>
                  No meals recorded today
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* SLEEP CARD */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
              border: '2px solid #2196F3',
              borderRadius: 3
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    bgcolor: '#2196F3',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2,
                    display: 'flex'
                  }}
                >
                  <SleepIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  Sleep
                </Typography>
              </Box>

              {activities.sleep.length > 0 ? (
                <Box>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h3" fontWeight={700} color="primary.main">
                      {calculateTotalSleep()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
                    </Typography>
                  </Paper>

                  {activities.sleep.map((entry, index) => (
                    <Paper
                      key={entry.id || index}
                      elevation={1}
                      sx={{ p: 1.5, mb: 1.5, bgcolor: 'rgba(255,255,255,0.9)' }}
                    >
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <TimeIcon fontSize="small" sx={{ mr: 1, color: '#2196F3' }} />
                        <Typography variant="body2" fontWeight={500}>
                          {entry.start_time} - {entry.end_time}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Duration: {entry.duration_hours} hours
                      </Typography>
                      {entry.notes && (
                        <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                          Note: {entry.notes}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" p={2}>
                  No sleep recorded today
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* POTTY CARD */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%)',
              border: '2px solid #FBC02D',
              borderRadius: 3
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    bgcolor: '#FBC02D',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2,
                    display: 'flex'
                  }}
                >
                  <PottyIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  Potty
                </Typography>
              </Box>

              {activities.potty.length > 0 ? (
                <Box>
                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={6}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="h4" fontWeight={700} color="#FBC02D">
                          {getBathroomCount()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Bathroom Visits
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="h4" fontWeight={700} color="#FBC02D">
                          {getDiaperChanges().length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Diaper Changes
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {getDiaperChanges().length > 0 && (
                    <Box mb={2}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Diaper Status:
                      </Typography>
                      {getDiaperChanges().map((entry, index) => (
                        <Chip
                          key={entry.id || index}
                          label={entry.diaper_status?.toUpperCase() || 'Unknown'}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                          color={
                            entry.diaper_status === 'dry'
                              ? 'success'
                              : entry.diaper_status === 'wet'
                              ? 'info'
                              : 'warning'
                          }
                        />
                      ))}
                    </Box>
                  )}

                  {activities.potty.some(p => p.notes) && (
                    <Paper elevation={1} sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.9)' }}>
                      <Typography variant="caption" fontWeight={600} gutterBottom>
                        Notes:
                      </Typography>
                      {activities.potty
                        .filter(p => p.notes)
                        .map((entry, index) => (
                          <Typography
                            key={entry.id || index}
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            • {entry.notes}
                          </Typography>
                        ))}
                    </Paper>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" p={2}>
                  No potty activities recorded today
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DailyActivityView;
