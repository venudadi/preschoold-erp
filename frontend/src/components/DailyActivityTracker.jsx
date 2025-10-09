import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  Restaurant as FoodIcon,
  Bedtime as SleepIcon,
  ChildCare as PottyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../services/api';

/**
 * DailyActivityTracker - Teachers track daily activities for children
 * Tracks: Food (breakfast, lunch, snack), Sleep (duration & time), Potty (diaper changes & bathroom)
 */
const DailyActivityTracker = ({ childId, childName, date = dayjs() }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Food tracking state
  const [foodEntries, setFoodEntries] = useState([]);
  const [newFood, setNewFood] = useState({
    meal_type: 'breakfast',
    food_consumed: 50,
    notes: ''
  });

  // Sleep tracking state
  const [sleepEntries, setSleepEntries] = useState([]);
  const [newSleep, setNewSleep] = useState({
    start_time: null,
    end_time: null,
    notes: ''
  });

  // Potty tracking state
  const [pottyEntries, setPottyEntries] = useState([]);
  const [newPotty, setNewPotty] = useState({
    type: 'bathroom',
    diaper_status: '',
    notes: ''
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

      const data = response.data;
      setFoodEntries(data.food || []);
      setSleepEntries(data.sleep || []);
      setPottyEntries(data.potty || []);
    } catch (err) {
      console.error('Error fetching daily activities:', err);
      setError('Failed to load daily activities');
    } finally {
      setLoading(false);
    }
  };

  // === FOOD TRACKING ===
  const handleAddFood = async () => {
    if (!childId) return;

    setSaving(true);
    setError('');
    try {
      const response = await api.post('/daily-activities/food', {
        child_id: childId,
        date: dayjs(date).format('YYYY-MM-DD'),
        ...newFood
      });

      setFoodEntries([...foodEntries, response.data]);
      setNewFood({ meal_type: 'breakfast', food_consumed: 50, notes: '' });
      setSuccess('Food entry added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding food entry:', err);
      setError(err.response?.data?.message || 'Failed to add food entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFood = async (id) => {
    try {
      await api.delete(`/daily-activities/food/${id}`);
      setFoodEntries(foodEntries.filter(entry => entry.id !== id));
      setSuccess('Food entry deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting food entry:', err);
      setError('Failed to delete food entry');
    }
  };

  // === SLEEP TRACKING ===
  const handleAddSleep = async () => {
    if (!childId || !newSleep.start_time || !newSleep.end_time) {
      setError('Please select both start and end times');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const duration = newSleep.end_time.diff(newSleep.start_time, 'minute') / 60;

      const response = await api.post('/daily-activities/sleep', {
        child_id: childId,
        date: dayjs(date).format('YYYY-MM-DD'),
        start_time: newSleep.start_time.format('HH:mm:ss'),
        end_time: newSleep.end_time.format('HH:mm:ss'),
        duration_hours: duration.toFixed(2),
        notes: newSleep.notes
      });

      setSleepEntries([...sleepEntries, response.data]);
      setNewSleep({ start_time: null, end_time: null, notes: '' });
      setSuccess('Sleep entry added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding sleep entry:', err);
      setError(err.response?.data?.message || 'Failed to add sleep entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSleep = async (id) => {
    try {
      await api.delete(`/daily-activities/sleep/${id}`);
      setSleepEntries(sleepEntries.filter(entry => entry.id !== id));
      setSuccess('Sleep entry deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting sleep entry:', err);
      setError('Failed to delete sleep entry');
    }
  };

  // === POTTY TRACKING ===
  const handleAddPotty = async () => {
    if (!childId) return;

    setSaving(true);
    setError('');
    try {
      const response = await api.post('/daily-activities/potty', {
        child_id: childId,
        date: dayjs(date).format('YYYY-MM-DD'),
        ...newPotty
      });

      setPottyEntries([...pottyEntries, response.data]);
      setNewPotty({ type: 'bathroom', diaper_status: '', notes: '' });
      setSuccess('Potty entry added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding potty entry:', err);
      setError(err.response?.data?.message || 'Failed to add potty entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePotty = async (id) => {
    try {
      await api.delete(`/daily-activities/potty/${id}`);
      setPottyEntries(pottyEntries.filter(entry => entry.id !== id));
      setSuccess('Potty entry deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting potty entry:', err);
      setError('Failed to delete potty entry');
    }
  };

  const getMealTypeColor = (type) => {
    const colors = {
      breakfast: '#FF9800',
      lunch: '#4CAF50',
      snack: '#9C27B0'
    };
    return colors[type] || '#757575';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Daily Activity Tracker
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {childName} - {dayjs(date).format('MMMM D, YYYY')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab icon={<FoodIcon />} label="Food" />
            <Tab icon={<SleepIcon />} label="Sleep" />
            <Tab icon={<PottyIcon />} label="Potty" />
          </Tabs>

          {/* FOOD TAB */}
          {activeTab === 0 && (
            <Box>
              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#FFF3E0' }}>
                <Typography variant="h6" gutterBottom>
                  Add Food Entry
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Meal Type</InputLabel>
                      <Select
                        value={newFood.meal_type}
                        label="Meal Type"
                        onChange={(e) => setNewFood({ ...newFood, meal_type: e.target.value })}
                      >
                        <MenuItem value="breakfast">Morning Snack</MenuItem>
                        <MenuItem value="lunch">Lunch</MenuItem>
                        <MenuItem value="snack">Evening Snack</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" gutterBottom>
                      Food Consumed: {newFood.food_consumed}%
                    </Typography>
                    <Slider
                      value={newFood.food_consumed}
                      onChange={(e, val) => setNewFood({ ...newFood, food_consumed: val })}
                      valueLabelDisplay="auto"
                      step={10}
                      marks
                      min={0}
                      max={100}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Notes (optional)"
                      value={newFood.notes}
                      onChange={(e) => setNewFood({ ...newFood, notes: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddFood}
                      disabled={saving}
                    >
                      Add Entry
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="h6" gutterBottom>
                Today's Food Entries ({foodEntries.length})
              </Typography>
              <List>
                {foodEntries.map((entry) => (
                  <ListItem
                    key={entry.id}
                    sx={{
                      mb: 1,
                      bgcolor: 'background.paper',
                      borderLeft: 4,
                      borderColor: getMealTypeColor(entry.meal_type),
                      borderRadius: 1
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={entry.meal_type.toUpperCase()}
                            size="small"
                            sx={{ bgcolor: getMealTypeColor(entry.meal_type), color: 'white' }}
                          />
                          <Typography variant="body1" fontWeight={500}>
                            {entry.food_consumed}% consumed
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          {entry.notes && <Typography variant="body2">{entry.notes}</Typography>}
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(entry.created_at).format('h:mm A')}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteFood(entry.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {foodEntries.length === 0 && (
                  <Typography variant="body2" color="text.secondary" align="center" p={2}>
                    No food entries recorded today
                  </Typography>
                )}
              </List>
            </Box>
          )}

          {/* SLEEP TAB */}
          {activeTab === 1 && (
            <Box>
              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#E3F2FD' }}>
                <Typography variant="h6" gutterBottom>
                  Add Sleep Entry
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <TimePicker
                      label="Start Time"
                      value={newSleep.start_time}
                      onChange={(val) => setNewSleep({ ...newSleep, start_time: val })}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TimePicker
                      label="End Time"
                      value={newSleep.end_time}
                      onChange={(val) => setNewSleep({ ...newSleep, end_time: val })}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Notes (optional)"
                      value={newSleep.notes}
                      onChange={(e) => setNewSleep({ ...newSleep, notes: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddSleep}
                      disabled={saving}
                      fullWidth
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="h6" gutterBottom>
                Today's Sleep Entries ({sleepEntries.length})
              </Typography>
              <List>
                {sleepEntries.map((entry) => (
                  <ListItem
                    key={entry.id}
                    sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight={500}>
                          {entry.duration_hours} hours
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2">
                            {entry.start_time} - {entry.end_time}
                          </Typography>
                          {entry.notes && <Typography variant="body2">{entry.notes}</Typography>}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteSleep(entry.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {sleepEntries.length === 0 && (
                  <Typography variant="body2" color="text.secondary" align="center" p={2}>
                    No sleep entries recorded today
                  </Typography>
                )}
              </List>
            </Box>
          )}

          {/* POTTY TAB */}
          {activeTab === 2 && (
            <Box>
              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#FFF9C4' }}>
                <Typography variant="h6" gutterBottom>
                  Add Potty Entry
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={newPotty.type}
                        label="Type"
                        onChange={(e) => setNewPotty({ ...newPotty, type: e.target.value })}
                      >
                        <MenuItem value="bathroom">Bathroom</MenuItem>
                        <MenuItem value="diaper_change">Diaper Change</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {newPotty.type === 'diaper_change' && (
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Diaper Status</InputLabel>
                        <Select
                          value={newPotty.diaper_status}
                          label="Diaper Status"
                          onChange={(e) => setNewPotty({ ...newPotty, diaper_status: e.target.value })}
                        >
                          <MenuItem value="wet">Wet</MenuItem>
                          <MenuItem value="dry">Dry</MenuItem>
                          <MenuItem value="soiled">Soiled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Notes (optional)"
                      value={newPotty.notes}
                      onChange={(e) => setNewPotty({ ...newPotty, notes: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddPotty}
                      disabled={saving}
                    >
                      Add Entry
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="h6" gutterBottom>
                Today's Potty Entries ({pottyEntries.length})
              </Typography>
              <List>
                {pottyEntries.map((entry) => (
                  <ListItem
                    key={entry.id}
                    sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={entry.type === 'bathroom' ? 'Bathroom' : 'Diaper Change'}
                            size="small"
                            color={entry.type === 'bathroom' ? 'primary' : 'secondary'}
                          />
                          {entry.diaper_status && (
                            <Chip label={entry.diaper_status.toUpperCase()} size="small" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          {entry.notes && <Typography variant="body2">{entry.notes}</Typography>}
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(entry.created_at).format('h:mm A')}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeletePotty(entry.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {pottyEntries.length === 0 && (
                  <Typography variant="body2" color="text.secondary" align="center" p={2}>
                    No potty entries recorded today
                  </Typography>
                )}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default DailyActivityTracker;
