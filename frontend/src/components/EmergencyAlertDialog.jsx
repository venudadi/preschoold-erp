import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Alert,
  Box,
  Typography,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  ReportProblem as Emergency,
  LocalFireDepartment,
  Security,
  Warning,
  MedicalServices,
  Storm,
  PowerOff
} from '@mui/icons-material';

const EmergencyAlertDialog = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    alert_type: '',
    severity: 'high',
    message: '',
    location: '',
    requires_evacuation: false,
    affected_areas: [],
    instructions: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const alertTypes = [
    { value: 'fire', label: 'Fire Emergency', icon: <LocalFireDepartment />, color: '#f44336' },
    { value: 'medical_emergency', label: 'Medical Emergency', icon: <MedicalServices />, color: '#2196f3' },
    { value: 'severe_weather', label: 'Severe Weather', icon: <Storm />, color: '#ff9800' },
    { value: 'lockdown', label: 'Security Lockdown', icon: <Security />, color: '#9c27b0' },
    { value: 'evacuation', label: 'Evacuation Required', icon: <Emergency />, color: '#f44336' },
    { value: 'power_outage', label: 'Power Outage', icon: <PowerOff />, color: '#607d8b' },
    { value: 'gas_leak', label: 'Gas Leak', icon: <Warning />, color: '#ff5722' },
    { value: 'intruder', label: 'Intruder Alert', icon: <Security />, color: '#e91e63' },
    { value: 'other', label: 'Other Emergency', icon: <Warning />, color: '#795548' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low Priority', color: '#4caf50' },
    { value: 'medium', label: 'Medium Priority', color: '#ff9800' },
    { value: 'high', label: 'High Priority', color: '#f44336' },
    { value: 'critical', label: 'CRITICAL', color: '#b71c1c' }
  ];

  const commonAreas = [
    'Main Entrance', 'Kitchen', 'Playground', 'Classroom A', 'Classroom B',
    'Classroom C', 'Office', 'Restrooms', 'Storage', 'Parking Lot'
  ];

  const predefinedInstructions = {
    fire: 'Evacuate immediately via nearest exit. Gather at assembly point in parking lot. Call 911.',
    medical_emergency: 'Provide first aid if trained. Clear area around patient. Call 911 immediately.',
    severe_weather: 'Move to interior rooms away from windows. Stay low. Monitor weather alerts.',
    lockdown: 'Lock all doors. Turn off lights. Move away from windows. Remain quiet until all-clear.',
    evacuation: 'Follow evacuation procedures. Use designated exits. Account for all children and staff.',
    power_outage: 'Use emergency lighting. Ensure all safety systems operational. Monitor HVAC systems.',
    gas_leak: 'Evacuate area immediately. Do not use electrical switches. Call gas company and 911.',
    intruder: 'Implement lockdown procedures. Call 911. Do not approach or engage intruder.'
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-populate instructions based on alert type
    if (field === 'alert_type' && predefinedInstructions[value]) {
      setFormData(prev => ({
        ...prev,
        instructions: predefinedInstructions[value]
      }));
    }

    // Auto-set evacuation requirement for certain alert types
    if (field === 'alert_type') {
      const evacuationRequired = ['fire', 'gas_leak', 'evacuation'].includes(value);
      setFormData(prev => ({
        ...prev,
        requires_evacuation: evacuationRequired
      }));
    }
  };

  const handleAreaToggle = (area) => {
    setFormData(prev => ({
      ...prev,
      affected_areas: prev.affected_areas.includes(area)
        ? prev.affected_areas.filter(a => a !== area)
        : [...prev.affected_areas, area]
    }));
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!formData.alert_type || !formData.message) {
      setError('Alert type and message are required');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(formData);

      // Reset form
      setFormData({
        alert_type: '',
        severity: 'high',
        message: '',
        location: '',
        requires_evacuation: false,
        affected_areas: [],
        instructions: ''
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to trigger emergency alert');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAlertType = alertTypes.find(type => type.value === formData.alert_type);
  const selectedSeverity = severityLevels.find(level => level.value === formData.severity);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          border: '2px solid #f44336',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: '#f44336',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Emergency />
        <Typography variant="h6">EMERGENCY ALERT SYSTEM</Typography>
        {submitting && (
          <Box sx={{ ml: 'auto' }}>
            <LinearProgress color="inherit" />
          </Box>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Alert Type Selection */}
          <FormControl fullWidth>
            <InputLabel>Emergency Type *</InputLabel>
            <Select
              value={formData.alert_type}
              label="Emergency Type *"
              onChange={handleChange('alert_type')}
            >
              {alertTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {type.icon}
                    <Typography>{type.label}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Severity Level */}
          <FormControl fullWidth>
            <InputLabel>Severity Level</InputLabel>
            <Select
              value={formData.severity}
              label="Severity Level"
              onChange={handleChange('severity')}
            >
              {severityLevels.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  <Chip
                    label={level.label}
                    size="small"
                    sx={{
                      bgcolor: level.color,
                      color: 'white',
                      minWidth: 120
                    }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Emergency Message */}
          <TextField
            fullWidth
            label="Emergency Message *"
            multiline
            rows={3}
            value={formData.message}
            onChange={handleChange('message')}
            placeholder="Describe the emergency situation clearly and concisely..."
            helperText="This message will be broadcast to all staff and logged for emergency response"
          />

          {/* Location */}
          <TextField
            fullWidth
            label="Location"
            value={formData.location}
            onChange={handleChange('location')}
            placeholder="Specify the location of the emergency"
          />

          {/* Affected Areas */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Affected Areas
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {commonAreas.map((area) => (
                <Chip
                  key={area}
                  label={area}
                  clickable
                  color={formData.affected_areas.includes(area) ? 'primary' : 'default'}
                  variant={formData.affected_areas.includes(area) ? 'filled' : 'outlined'}
                  onClick={() => handleAreaToggle(area)}
                />
              ))}
            </Box>
          </Box>

          {/* Emergency Instructions */}
          <TextField
            fullWidth
            label="Emergency Instructions"
            multiline
            rows={4}
            value={formData.instructions}
            onChange={handleChange('instructions')}
            placeholder="Specific instructions for emergency response..."
            helperText="Instructions will be automatically suggested based on emergency type"
          />

          {/* Evacuation Required */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.requires_evacuation}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  requires_evacuation: e.target.checked
                }))}
              />
            }
            label={
              <Typography variant="body2">
                <strong>Evacuation Required</strong> - Check if immediate evacuation is necessary
              </Typography>
            }
          />

          {/* Alert Preview */}
          {formData.alert_type && (
            <Alert
              severity="warning"
              icon={selectedAlertType?.icon}
              sx={{
                border: `2px solid ${selectedSeverity?.color}`,
                '& .MuiAlert-icon': {
                  color: selectedSeverity?.color
                }
              }}
            >
              <Typography variant="subtitle2">
                Alert Preview:
              </Typography>
              <Typography variant="body2">
                <strong>{selectedAlertType?.label}</strong> - {selectedSeverity?.label}
              </Typography>
              {formData.message && (
                <Typography variant="body2">
                  {formData.message}
                </Typography>
              )}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#fafafa' }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={submitting || !formData.alert_type || !formData.message}
          startIcon={submitting ? null : <Emergency />}
          sx={{
            minWidth: 150,
            fontWeight: 'bold'
          }}
        >
          {submitting ? 'TRIGGERING...' : 'TRIGGER ALERT'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmergencyAlertDialog;