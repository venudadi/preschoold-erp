import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Grid, Chip, CircularProgress
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

  useEffect(() => {
    setForm(initialData || { topic: '', objectives: '', activities: '', resources: '', date: '' });
  }, [initialData]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialData ? (readOnly ? 'Lesson Plan' : 'Edit Lesson Plan') : 'Lesson Plan'}</DialogTitle>
      <DialogContent>
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
  const [selected, setSelected] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [checkoffOpen, setCheckoffOpen] = useState(false);
  const [checkoffData, setCheckoffData] = useState({});
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchLessonPlans = async () => {
    setLoading(true);
    const res = await api.get('/lesson-plans');
    setLessonPlans(res.data.lesson_plans || []);
    setLoading(false);
  };

  useEffect(() => { fetchLessonPlans(); }, []);

  const handleEdit = (plan) => {
    setSelected(plan);
    setEditOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this lesson plan?')) {
      await api.delete(`/lesson-plans/${id}`);
      fetchLessonPlans();
    }
  };

  const handleSave = async (form) => {
    await api.put(`/lesson-plans/${selected.id}`, form);
    setEditOpen(false);
    fetchLessonPlans();
  };

  // Teacher check-off logic
  const handleCheckoffOpen = (plan) => {
    setSelected(plan);
    setCheckoffData(plan.checkoff_status ? JSON.parse(plan.checkoff_status) : { objectives_done: false, activities_done: false, resources_done: false });
    setCheckoffOpen(true);
  };
  const handleCheckoffChange = (e) => {
    setCheckoffData({ ...checkoffData, [e.target.name]: e.target.checked });
  };
  const handleCheckoffSave = async () => {
    await api.patch(`/lesson-plans/${selected.id}/checkoff`, checkoffData);
    setCheckoffOpen(false);
    fetchLessonPlans();
  };

  if (loading) return <CircularProgress />;

  return (
    <div>
      <Typography variant="h5" gutterBottom>My Lesson Plans</Typography>
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
