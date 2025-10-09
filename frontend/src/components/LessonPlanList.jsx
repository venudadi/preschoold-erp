import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Grid, Chip, CircularProgress, Alert, Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dayjs from 'dayjs';
import api from '../services/api';

const LessonPlanForm = ({ open, onClose, onSave, initialData, readOnly }) => {
  const [form, setForm] = useState(initialData || {
    topic: '', objectives: '', activities: '', resources: '', date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initialData || { topic: '', objectives: '', activities: '', resources: '', date: '' });
    setError('');
  }, [initialData]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.topic?.trim()) {
      setError('Topic is required');
      return;
    }

    if (!form.date) {
      setError('Date is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave(form);
    } catch (err) {
      console.error('Error saving lesson plan:', err);
      setError('Failed to save lesson plan. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialData ? (readOnly ? 'Lesson Plan' : 'Edit Lesson Plan') : 'Lesson Plan'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField margin="dense" label="Topic" name="topic" value={form.topic} onChange={handleChange} fullWidth required disabled={readOnly} />
        <TextField margin="dense" label="Objectives" name="objectives" value={form.objectives} onChange={handleChange} fullWidth multiline disabled={readOnly} />
        <TextField margin="dense" label="Activities" name="activities" value={form.activities} onChange={handleChange} fullWidth multiline disabled={readOnly} />
        <TextField margin="dense" label="Resources" name="resources" value={form.resources} onChange={handleChange} fullWidth multiline disabled={readOnly} />
        <TextField margin="dense" label="Date" name="date" type="date" value={form.date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} disabled={readOnly} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {!readOnly && <Button onClick={handleSubmit} disabled={loading} variant="contained">{loading ? <CircularProgress size={20} /> : 'Save'}</Button>}
      </DialogActions>
    </Dialog>
  );
};

const LessonPlanList = () => {
  const [lessonPlans, setLessonPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [checkoffOpen, setCheckoffOpen] = useState(false);
  const [checkoffData, setCheckoffData] = useState({});
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchLessonPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/lesson-plans');
      setLessonPlans(res.data.lesson_plans || []);
    } catch (err) {
      console.error('Error fetching lesson plans:', err);

      if (err.response) {
        if (err.response.status === 401) {
          setError('Please log in again to view lesson plans');
        } else if (err.response.status === 403) {
          setError('You do not have permission to view lesson plans');
        } else if (err.response.status === 500) {
          setError('Server error. Please try again later');
        } else {
          setError(err.response.data?.message || 'Failed to load lesson plans');
        }
      } else if (err.request) {
        setError('Network error. Please check your connection and try again');
      } else {
        setError('An unexpected error occurred. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLessonPlans(); }, []);

  const handleEdit = (plan) => {
    setSelected(plan);
    setEditOpen(true);
    setActionError('');
    setActionSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lesson plan?')) {
      return;
    }

    try {
      setActionError('');
      await api.delete(`/lesson-plans/${id}`);
      setActionSuccess('Lesson plan deleted successfully');
      fetchLessonPlans();

      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting lesson plan:', err);

      if (err.response) {
        if (err.response.status === 401) {
          setActionError('Please log in again to delete lesson plans');
        } else if (err.response.status === 403) {
          setActionError('You do not have permission to delete this lesson plan');
        } else if (err.response.status === 500) {
          setActionError('Server error. Please try again');
        } else {
          setActionError(err.response.data?.message || 'Failed to delete lesson plan');
        }
      } else if (err.request) {
        setActionError('Network error. Please check your connection and try again');
      } else {
        setActionError('An unexpected error occurred. Please try again');
      }
    }
  };

  const handleSave = async (form) => {
    try {
      await api.put(`/lesson-plans/${selected.id}`, form);
      setEditOpen(false);
      setActionSuccess('Lesson plan saved successfully');
      fetchLessonPlans();

      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving lesson plan:', err);

      let errorMessage = 'Failed to save lesson plan';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Please log in again to save lesson plans';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to save this lesson plan';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection and try again';
      }

      throw new Error(errorMessage);
    }
  };

  // Teacher check-off logic
  const handleCheckoffOpen = (plan) => {
    setSelected(plan);
    setCheckoffData(plan.checkoff_status ? JSON.parse(plan.checkoff_status) : { objectives_done: false, activities_done: false, resources_done: false });
    setCheckoffOpen(true);
    setActionError('');
    setActionSuccess('');
  };

  const handleCheckoffChange = (e) => {
    setCheckoffData({ ...checkoffData, [e.target.name]: e.target.checked });
  };

  const handleCheckoffSave = async () => {
    try {
      await api.patch(`/lesson-plans/${selected.id}/checkoff`, checkoffData);
      setCheckoffOpen(false);
      setActionSuccess('Check-off status updated successfully');
      fetchLessonPlans();

      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating check-off status:', err);

      if (err.response) {
        if (err.response.status === 401) {
          setActionError('Please log in again to update check-off status');
        } else if (err.response.status === 403) {
          setActionError('You do not have permission to update check-off status');
        } else if (err.response.status === 500) {
          setActionError('Server error. Please try again');
        } else {
          setActionError(err.response.data?.message || 'Failed to update check-off status');
        }
      } else if (err.request) {
        setActionError('Network error. Please check your connection and try again');
      } else {
        setActionError('An unexpected error occurred. Please try again');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <div>
      <Typography variant="h5" gutterBottom>My Lesson Plans</Typography>

      {actionSuccess && <Alert severity="success" sx={{ mb: 2 }}>{actionSuccess}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      <Grid container spacing={2}>
        {lessonPlans.map(plan => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card sx={{ mb: 2, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
              <CardContent>
                <Typography variant="h6">{plan.topic}</Typography>
                <Typography variant="body2" color="text.secondary">{dayjs(plan.date).format('MMM D, YYYY')}</Typography>
                <Chip label={plan.classroom_id} size="small" sx={{ mt: 1, mb: 1 }} />
                <Typography variant="body2"><b>Objectives:</b> {plan.objectives}</Typography>
                <Typography variant="body2"><b>Activities:</b> {plan.activities}</Typography>
                <Typography variant="body2"><b>Resources:</b> {plan.resources}</Typography>
                {/* Check-off status display */}
                {plan.checkoff_status && (
                  <div style={{ marginTop: 8 }}>
                    <Typography variant="caption" color="success.main">Checked off: {Object.entries(JSON.parse(plan.checkoff_status)).filter(([k,v])=>v===true).map(([k])=>k.replace('_done','')).join(', ')}</Typography>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  {user.role === 'teacher' && (
                    <IconButton onClick={() => handleCheckoffOpen(plan)} title="Check off completed"><CheckCircleIcon /></IconButton>
                  )}
                  {(user.role === 'admin' || user.role === 'academic_coordinator') && (
                    <>
                      <IconButton onClick={() => handleEdit(plan)}><EditIcon /></IconButton>
                      <IconButton onClick={() => handleDelete(plan.id)}><DeleteIcon /></IconButton>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Edit dialog for admin/coordinator, read-only for teacher */}
      <LessonPlanForm open={editOpen} onClose={() => setEditOpen(false)} onSave={handleSave} initialData={selected} readOnly={user.role !== 'admin' && user.role !== 'academic_coordinator'} />
      {/* Check-off dialog for teachers */}
      <Dialog open={checkoffOpen} onClose={() => setCheckoffOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Check Off Completed</DialogTitle>
        <DialogContent>
          <div>
            <label><input type="checkbox" name="objectives_done" checked={!!checkoffData.objectives_done} onChange={handleCheckoffChange} /> Objectives</label><br />
            <label><input type="checkbox" name="activities_done" checked={!!checkoffData.activities_done} onChange={handleCheckoffChange} /> Activities</label><br />
            <label><input type="checkbox" name="resources_done" checked={!!checkoffData.resources_done} onChange={handleCheckoffChange} /> Resources</label>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoffOpen(false)}>Cancel</Button>
          <Button onClick={handleCheckoffSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LessonPlanList;
