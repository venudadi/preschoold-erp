import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Grid, Chip, CircularProgress, InputLabel, MenuItem, Select, FormControl, Alert, Box
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import dayjs from 'dayjs';
import api from '../services/api';

const AssignmentForm = ({ open, onClose, onSave, initialData }) => {
  const [form, setForm] = useState(initialData || {
    title: '', description: '', due_date: '', classroom_id: '', attachments: []
  });
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initialData || { title: '', description: '', due_date: '', classroom_id: '', attachments: [] });
    setFileList([]);
    setError('');
  }, [initialData]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = e => {
    setFileList([...e.target.files]);
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.title?.trim()) {
      setError('Title is required');
      return;
    }

    if (!form.classroom_id) {
      setError('Classroom ID is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      fileList.forEach(f => data.append('attachments', f));
      await onSave(data);
    } catch (err) {
      console.error('Error saving assignment:', err);
      setError('Failed to save assignment. Please try again.');
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialData ? 'Edit Assignment' : 'New Assignment'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField margin="dense" label="Title" name="title" value={form.title} onChange={handleChange} fullWidth required />
        <TextField margin="dense" label="Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline />
        <TextField margin="dense" label="Due Date" name="due_date" type="date" value={form.due_date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
        <TextField margin="dense" label="Classroom ID" name="classroom_id" value={form.classroom_id} onChange={handleChange} fullWidth required />
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

const AssignmentSubmissionForm = ({ open, onClose, onSubmit, assignmentId, childrenList }) => {
  const [form, setForm] = useState({ child_id: '', submission_text: '' });
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = e => {
    setFileList([...e.target.files]);
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.child_id) {
      setError('Please select a child');
      return;
    }

    if (!form.submission_text?.trim() && fileList.length === 0) {
      setError('Please provide submission text or upload files');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('child_id', form.child_id);
      data.append('submission_text', form.submission_text);
      fileList.forEach(f => data.append('submission_files', f));
      await onSubmit(assignmentId, data);
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setError('Failed to submit assignment. Please try again.');
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Submit Assignment</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel>Child</InputLabel>
          <Select name="child_id" value={form.child_id} label="Child" onChange={handleChange} required>
            {childrenList.map(child => <MenuItem key={child.id} value={child.id}>{child.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField margin="dense" label="Submission Text" name="submission_text" value={form.submission_text} onChange={handleChange} fullWidth multiline />
        <Button component="label" startIcon={<UploadFileIcon />} sx={{ mt: 2 }}>
          Upload Files
          <input type="file" multiple hidden onChange={handleFileChange} />
        </Button>
        {fileList.length > 0 && <Typography variant="caption">{fileList.length} file(s) selected</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">{loading ? <CircularProgress size={20} /> : 'Submit'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [childrenList, setChildrenList] = useState([]);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/assignments');
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);

      if (err.response) {
        if (err.response.status === 401) {
          setError('Please log in again to view assignments');
        } else if (err.response.status === 403) {
          setError('You do not have permission to view assignments');
        } else if (err.response.status === 500) {
          setError('Server error. Please try again later');
        } else {
          setError(err.response.data?.message || 'Failed to load assignments');
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

  useEffect(() => { fetchAssignments(); }, []);

  // For parent: fetch children list (simulate, replace with real API)
  useEffect(() => {
    if (user.role === 'parent') {
      setChildrenList([{ id: 'child1', name: 'Child 1' }, { id: 'child2', name: 'Child 2' }]);
    }
  }, [user.role]);

  const handleCreate = () => {
    setFormOpen(true);
    setActionError('');
    setActionSuccess('');
  };

  const handleSave = async (formData) => {
    try {
      await api.post('/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormOpen(false);
      setActionSuccess('Assignment created successfully');
      fetchAssignments();

      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating assignment:', err);

      let errorMessage = 'Failed to create assignment';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Please log in again to create assignments';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to create assignments';
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

  const handleSubmitOpen = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionOpen(true);
    setActionError('');
    setActionSuccess('');
  };

  const handleSubmit = async (assignmentId, formData) => {
    try {
      await api.post(`/assignments/${assignmentId}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmissionOpen(false);
      setActionSuccess('Assignment submitted successfully');
      fetchAssignments();

      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error submitting assignment:', err);

      let errorMessage = 'Failed to submit assignment';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Please log in again to submit assignments';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to submit this assignment';
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
      <Typography variant="h5" gutterBottom>Assignments</Typography>

      {actionSuccess && <Alert severity="success" sx={{ mb: 2 }}>{actionSuccess}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      {user.role === 'teacher' && <Button variant="contained" sx={{ mb: 2 }} onClick={handleCreate}>Create Assignment</Button>}
      <Grid container spacing={2}>
        {assignments.map(assignment => (
          <Grid item xs={12} sm={6} md={4} key={assignment.id}>
            <Card sx={{ mb: 2, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
              <CardContent>
                <Typography variant="h6">{assignment.title}</Typography>
                <Typography variant="body2" color="text.secondary">Due: {dayjs(assignment.due_date).format('MMM D, YYYY')}</Typography>
                <Chip label={assignment.classroom_id} size="small" sx={{ mt: 1, mb: 1 }} />
                <Typography variant="body2"><b>Description:</b> {assignment.description}</Typography>
                {assignment.attachments && JSON.parse(assignment.attachments).length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Typography variant="caption">Attachments:</Typography>
                    {JSON.parse(assignment.attachments).map((file, idx) => (
                      <a key={idx} href={`/${file}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>{file.split('/').pop()}</a>
                    ))}
                  </div>
                )}
                {user.role === 'parent' && (
                  <Button sx={{ mt: 2 }} variant="outlined" onClick={() => handleSubmitOpen(assignment)}>Submit</Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <AssignmentForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
      <AssignmentSubmissionForm open={submissionOpen} onClose={() => setSubmissionOpen(false)} onSubmit={handleSubmit} assignmentId={selectedAssignment?.id} childrenList={childrenList} />
    </div>
  );
};

export default AssignmentList;
