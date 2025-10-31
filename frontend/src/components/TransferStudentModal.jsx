import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, MenuItem, Select, InputLabel, FormControl, CircularProgress, Alert } from '@mui/material';
import api from '../services/api';

// Modal for admin to transfer student to another center
export default function TransferStudentModal({ open, onClose, studentId, fromCenterId, onSuccess }) {
  const [centers, setCenters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [toCenterId, setToCenterId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      api.get('/centers').then(res => setCenters(res.data)).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (toCenterId) {
      api.get(`/classrooms?center_id=${toCenterId}`).then(res => setClasses(res.data)).catch(console.error);
    } else {
      setClasses([]);
    }
  }, [toCenterId]);

  const handleTransfer = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/admin-class/promotion/transfer', {
        student_id: studentId,
        from_center_id: fromCenterId,
        to_center_id: toCenterId,
        to_class_id: toClassId
      });
      setSuccess('Student transferred successfully!');
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to transfer student.');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2, maxWidth: 400, mx: 'auto', mt: 8 }}>
        <Typography variant="h6" mb={2}>Transfer Student to Another Center</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>New Center</InputLabel>
          <Select value={toCenterId} label="New Center" onChange={e => setToCenterId(e.target.value)}>
            {centers.filter(c => c.id !== fromCenterId).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>New Class</InputLabel>
          <Select value={toClassId} label="New Class" onChange={e => setToClassId(e.target.value)} disabled={!toCenterId}>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <Box display="flex" gap={2} mt={2}>
          <Button variant="contained" onClick={handleTransfer} disabled={loading || !toCenterId || !toClassId}>Transfer</Button>
        </Box>
        {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}
      </Box>
    </Modal>
  );
}
