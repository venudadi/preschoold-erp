import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Rating, Alert, CircularProgress } from '@mui/material';
import api from '../services/api';

// Parent Feedback UI
export default function ParentFeedback() {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await api.post('/parent-module/feedback', {
        feedback_type: 'general',
        rating,
        comment: feedback
      });
      setSuccess(true);
      setFeedback('');
      setRating(0);
    } catch {
      setError('Failed to submit feedback');
    }
    setLoading(false);
  };

  return (
    <Box p={2}>
      <Typography variant="h6" mb={2}>We value your feedback!</Typography>
      <form onSubmit={handleSubmit}>
        <Rating
          value={rating}
          onChange={(_, v) => setRating(v)}
          size="large"
        />
        <TextField
          label="Your feedback"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          fullWidth
          multiline
          rows={3}
          margin="normal"
        />
        <Button type="submit" variant="contained" disabled={loading || !feedback}>
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </form>
      {success && <Alert severity="success" sx={{ mt: 2 }}>Thank you for your feedback!</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
