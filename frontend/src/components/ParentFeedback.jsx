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

    // Validation
    if (!feedback.trim()) {
      setError('Please provide feedback before submitting');
      return;
    }

    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

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
    } catch (err) {
      console.error('Error submitting feedback:', err);

      // Handle specific error cases
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          setError('Please log in again to submit feedback');
        } else if (err.response.status === 403) {
          setError('You do not have permission to submit feedback');
        } else if (err.response.status === 500) {
          setError('Server error. Please try again later');
        } else {
          setError(err.response.data?.message || 'Failed to submit feedback');
        }
      } else if (err.request) {
        // Request was made but no response received
        setError('Network error. Please check your connection and try again');
      } else {
        // Something else happened
        setError('An unexpected error occurred. Please try again');
      }
    } finally {
      setLoading(false);
    }
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
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </form>
      {success && <Alert severity="success" sx={{ mt: 2 }}>Thank you for your feedback!</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}
