import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, MenuItem, Select, InputLabel, FormControl, CircularProgress, Alert } from '@mui/material';
import api from '../services/api';

// Modal for admin to promote or assign student to class
export default function PromoteAssignStudentModal({ open, onClose, studentId, currentClassId, currentCenterId, onSuccess }) {
  const [centers, setCenters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [centerId, setCenterId] = useState(currentCenterId || '');
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      api.get('/centers')
        .then(res => setCenters(Array.isArray(res.data) ? res.data : []))
        .catch(err => {
          console.error('Error fetching centers:', err);
          setCenters([]);
        });
    }
  }, [open]);

  useEffect(() => {
    if (centerId) {
      api.get(`/classrooms?center_id=${centerId}`)
        .then(res => setClasses(Array.isArray(res.data) ? res.data : []))
        .catch(err => {
          console.error('Error fetching classrooms:', err);
          setClasses([]);
        });
    }
  }, [centerId]);

  const handleAssign = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/admin-class/promotion/assign', {
        student_id: studentId,
        class_id: classId,
        center_id: centerId
      });
      setSuccess('Student assigned successfully!');
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to assign student.');
    } finally { setLoading(false); }
  };

  const handlePromote = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/admin-class/promotion/promote', {
        student_id: studentId,
        from_class_id: currentClassId,
        to_class_id: classId,
        center_id: centerId
      });
      setSuccess('Student promoted successfully!');
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to promote student.');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2, maxWidth: 400, mx: 'auto', mt: 8 }}>
        <Typography variant="h6" mb={2}>Promote or Assign Student</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Center</InputLabel>
          <Select value={centerId} label="Center" onChange={e => setCenterId(e.target.value)}>
            {centers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Class</InputLabel>
          <Select value={classId} label="Class" onChange={e => setClassId(e.target.value)}>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <Box display="flex" gap={2} mt={2}>
          <Button variant="contained" onClick={handleAssign} disabled={loading || !classId || !centerId}>Assign</Button>
          <Button variant="outlined" onClick={handlePromote} disabled={loading || !classId || !centerId || !currentClassId}>Promote</Button>
        </Box>
        {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}
      </Box>
    </Modal>
  );
}
