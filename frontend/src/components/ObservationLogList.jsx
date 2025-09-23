import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Grid, Chip, CircularProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import api from '../services/api';

const ObservationLogForm = ({ open, onClose, onSave, initialData }) => {
  const [form, setForm] = useState(initialData || {
    child_id: '', date: '', milestone: '', notes: '', attachments: []
  });
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(initialData || { child_id: '', date: '', milestone: '', notes: '', attachments: [] });
    setFileList([]);
  }, [initialData]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleFileChange = e => {
    setFileList([...e.target.files]);
  };
  const handleSubmit = async () => {
    setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    fileList.forEach(f => data.append('attachments', f));
    await onSave(data);
    setLoading(false);
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialData ? 'Edit Observation Log' : 'New Observation Log'}</DialogTitle>
      <DialogContent>
        <TextField margin="dense" label="Child ID" name="child_id" value={form.child_id} onChange={handleChange} fullWidth required />
        <TextField margin="dense" label="Date" name="date" type="date" value={form.date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} required />
        <TextField margin="dense" label="Milestone" name="milestone" value={form.milestone} onChange={handleChange} fullWidth />
        <TextField margin="dense" label="Notes" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline />
        <Button component="label" startIcon={<UploadFileIcon />} sx={{ mt: 2 }}>
          Upload Attachments
          <input type="file" multiple hidden onChange={handleFileChange} />
        </Button>
        {fileList.length > 0 && <Typography variant="caption">{fileList.length} file(s) selected</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">{loading ? <CircularProgress size={20} /> : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const ObservationLogList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchLogs = async () => {
    setLoading(true);
    const res = await api.get('/observation-logs');
    setLogs(res.data.logs || []);
    setLoading(false);
  };
  useEffect(() => { fetchLogs(); }, []);

  const handleCreate = () => {
    setEditLog(null);
    setFormOpen(true);
  };
  const handleEdit = (log) => {
    setEditLog(log);
    setFormOpen(true);
  };
  const handleDelete = async (id) => {
    if (window.confirm('Delete this observation log?')) {
      await api.delete(`/observation-logs/${id}`);
      fetchLogs();
    }
  };
  const handleSave = async (formData) => {
    if (editLog) {
      await api.put(`/observation-logs/${editLog.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else {
      await api.post('/observation-logs', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    setFormOpen(false);
    fetchLogs();
  };
  // Export logs as CSV
  const handleExport = () => {
    const csv = [
      ['Child ID', 'Date', 'Milestone', 'Notes'],
      ...logs.map(l => [l.child_id, l.date, l.milestone, l.notes])
    ].map(row => row.map(String).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'observation_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <CircularProgress />;

  return (
    <div>
      <Typography variant="h5" gutterBottom>Observation Logs</Typography>
      <Button variant="contained" sx={{ mb: 2, mr: 2 }} onClick={handleCreate}>New Log</Button>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={handleExport}>Export CSV</Button>
      <Grid container spacing={2}>
        {logs.map(log => (
          <Grid item xs={12} sm={6} md={4} key={log.id}>
            <Card sx={{ mb: 2, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
              <CardContent>
                <Typography variant="h6">{log.milestone}</Typography>
                <Typography variant="body2" color="text.secondary">{dayjs(log.date).format('MMM D, YYYY')}</Typography>
                <Chip label={log.child_id} size="small" sx={{ mt: 1, mb: 1 }} />
                <Typography variant="body2"><b>Notes:</b> {log.notes}</Typography>
                {log.attachments && JSON.parse(log.attachments).length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Typography variant="caption">Attachments:</Typography>
                    {JSON.parse(log.attachments).map((file, idx) => (
                      <a key={idx} href={`/${file}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>{file.split('/').pop()}</a>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <IconButton onClick={() => handleEdit(log)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(log.id)}><DeleteIcon /></IconButton>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <ObservationLogForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} initialData={editLog} />
    </div>
  );
};

export default ObservationLogList;
