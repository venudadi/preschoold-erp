import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Schedule,
  Person,
  CalendarToday,
  AccessTime,
  Coffee,
  CheckCircle,
  Warning,
  Cancel,
  SwapHoriz,
  Refresh,
  Print,
  Download,
  Notifications
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const StaffSchedulingManager = ({ userRole }) => {
  const [schedules, setSchedules] = useState([]);
  const [staff, setStaff] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({
    staff_id: '',
    schedule_date: new Date(),
    shift_start: null,
    shift_end: null,
    break_start: null,
    break_end: null,
    role_assignment: '',
    classroom_assignment: '',
    notes: ''
  });

  useEffect(() => {
    loadScheduleData();
  }, [selectedDate]);

  const loadScheduleData = async () => {
    setLoading(true);
    setError('');
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Load schedules for selected date
      const schedulesResponse = await fetch(`/api/center-director/staff/schedules?date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData.data || []);
      }

      // Load staff list (if not already loaded)
      if (staff.length === 0) {
        const staffResponse = await fetch('/api/staff', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          setStaff(staffData.data || []);
        }
      }

      // Load classrooms (if not already loaded)
      if (classrooms.length === 0) {
        const classroomsResponse = await fetch('/api/admin/classrooms', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (classroomsResponse.ok) {
          const classroomsData = await classroomsResponse.json();
          setClassrooms(classroomsData.classrooms || []);
        }
      }

    } catch (err) {
      console.error('Schedule load error:', err);
      setError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const payload = {
        ...scheduleForm,
        schedule_date: scheduleForm.schedule_date.toISOString().split('T')[0],
        shift_start: scheduleForm.shift_start ? scheduleForm.shift_start.toTimeString().slice(0, 8) : null,
        shift_end: scheduleForm.shift_end ? scheduleForm.shift_end.toTimeString().slice(0, 8) : null,
        break_start: scheduleForm.break_start ? scheduleForm.break_start.toTimeString().slice(0, 8) : null,
        break_end: scheduleForm.break_end ? scheduleForm.break_end.toTimeString().slice(0, 8) : null
      };

      const response = await fetch('/api/center-director/staff/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setDialogOpen(false);
        setEditingSchedule(null);
        resetForm();
        loadScheduleData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save schedule');
      }

    } catch (err) {
      console.error('Save schedule error:', err);
      setError('Failed to save schedule');
    }
  };

  const resetForm = () => {
    setScheduleForm({
      staff_id: '',
      schedule_date: selectedDate,
      shift_start: null,
      shift_end: null,
      break_start: null,
      break_end: null,
      role_assignment: '',
      classroom_assignment: '',
      notes: ''
    });
  };

  const openScheduleDialog = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setScheduleForm({
        staff_id: schedule.staff_id,
        schedule_date: new Date(schedule.schedule_date),
        shift_start: schedule.shift_start ? new Date(`2000-01-01T${schedule.shift_start}`) : null,
        shift_end: schedule.shift_end ? new Date(`2000-01-01T${schedule.shift_end}`) : null,
        break_start: schedule.break_start ? new Date(`2000-01-01T${schedule.break_start}`) : null,
        break_end: schedule.break_end ? new Date(`2000-01-01T${schedule.break_end}`) : null,
        role_assignment: schedule.role_assignment || '',
        classroom_assignment: schedule.classroom_assignment || '',
        notes: schedule.notes || ''
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const getScheduleStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'confirmed': return 'success';
      case 'absent': return 'error';
      case 'substitute': return 'warning';
      case 'overtime': return 'info';
      default: return 'default';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStaffName = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? staffMember.full_name : 'Unknown';
  };

  const getClassroomName = (classroomId) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    return classroom ? classroom.name : '';
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography variant="h5" gutterBottom>Staff Scheduling</Typography>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading schedule data...
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={2}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">Staff Scheduling</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage staff schedules and assignments
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadScheduleData}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openScheduleDialog()}
            >
              Add Schedule
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Date Selector */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CalendarToday />
              <DatePicker
                label="Schedule Date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                renderInput={(params) => <TextField {...params} />}
              />
              <Typography variant="body2" color="text.secondary">
                {schedules.length} staff scheduled for this date
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Card>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Daily Schedule" />
            <Tab label="Staff Overview" />
            <Tab label="Coverage Analysis" />
          </Tabs>

          <Box p={3}>
            {/* Daily Schedule Tab */}
            {currentTab === 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Staff Member</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Shift Time</TableCell>
                      <TableCell>Break Time</TableCell>
                      <TableCell>Classroom</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getStaffName(schedule.staff_id).charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {getStaffName(schedule.staff_id)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {schedule.role}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={schedule.role_assignment || 'General'}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <AccessTime fontSize="small" />
                            <Typography variant="body2">
                              {formatTime(schedule.shift_start)} - {formatTime(schedule.shift_end)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Coffee fontSize="small" />
                            <Typography variant="body2">
                              {schedule.break_start && schedule.break_end
                                ? `${formatTime(schedule.break_start)} - ${formatTime(schedule.break_end)}`
                                : 'No break'
                              }
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getClassroomName(schedule.classroom_assignment) || 'Unassigned'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={schedule.status}
                            color={getScheduleStatusColor(schedule.status)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Edit Schedule">
                              <IconButton
                                size="small"
                                onClick={() => openScheduleDialog(schedule)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Mark as Substitute">
                              <IconButton size="small" color="warning">
                                <SwapHoriz />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {schedules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Box py={4}>
                            <Typography variant="body2" color="text.secondary">
                              No schedules found for this date
                            </Typography>
                            <Button
                              variant="outlined"
                              startIcon={<Add />}
                              sx={{ mt: 2 }}
                              onClick={() => openScheduleDialog()}
                            >
                              Add First Schedule
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Staff Overview Tab */}
            {currentTab === 1 && (
              <Grid container spacing={3}>
                {staff.map((staffMember) => {
                  const staffSchedule = schedules.find(s => s.staff_id === staffMember.id);
                  return (
                    <Grid item xs={12} md={6} lg={4} key={staffMember.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                            <Badge
                              variant="dot"
                              color={staffSchedule ? 'success' : 'error'}
                            >
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {staffMember.full_name.charAt(0)}
                              </Avatar>
                            </Badge>
                            <Box>
                              <Typography variant="subtitle1">
                                {staffMember.full_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {staffMember.role}
                              </Typography>
                            </Box>
                          </Stack>

                          {staffSchedule ? (
                            <Box>
                              <Typography variant="body2" gutterBottom>
                                <strong>Shift:</strong> {formatTime(staffSchedule.shift_start)} - {formatTime(staffSchedule.shift_end)}
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                <strong>Assignment:</strong> {getClassroomName(staffSchedule.classroom_assignment) || 'General'}
                              </Typography>
                              <Chip
                                label={staffSchedule.status}
                                color={getScheduleStatusColor(staffSchedule.status)}
                                size="small"
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </Box>
                          ) : (
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Not scheduled for this date
                              </Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Add />}
                                onClick={() => {
                                  setScheduleForm({
                                    ...scheduleForm,
                                    staff_id: staffMember.id
                                  });
                                  openScheduleDialog();
                                }}
                              >
                                Schedule
                              </Button>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {/* Coverage Analysis Tab */}
            {currentTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="Shift Coverage" />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Coverage analysis for {selectedDate.toDateString()}
                      </Typography>

                      <Box mt={2}>
                        <Typography variant="body2" gutterBottom>
                          Morning Shift (6:00 AM - 12:00 PM)
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={75}
                          color="success"
                        />
                        <Typography variant="caption">
                          {schedules.filter(s => s.shift_start <= '12:00:00').length} staff scheduled
                        </Typography>
                      </Box>

                      <Box mt={2}>
                        <Typography variant="body2" gutterBottom>
                          Afternoon Shift (12:00 PM - 6:00 PM)
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={85}
                          color="primary"
                        />
                        <Typography variant="caption">
                          {schedules.filter(s => s.shift_start > '12:00:00' && s.shift_start <= '18:00:00').length} staff scheduled
                        </Typography>
                      </Box>

                      <Box mt={2}>
                        <Typography variant="body2" gutterBottom>
                          Evening Shift (6:00 PM - 10:00 PM)
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={60}
                          color="warning"
                        />
                        <Typography variant="caption">
                          {schedules.filter(s => s.shift_start > '18:00:00').length} staff scheduled
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="Classroom Coverage" />
                    <CardContent>
                      <List dense>
                        {classrooms.map((classroom) => {
                          const assignedStaff = schedules.filter(s => s.classroom_assignment === classroom.id);
                          return (
                            <ListItem key={classroom.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: assignedStaff.length > 0 ? 'success.main' : 'error.main' }}>
                                  {assignedStaff.length}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={classroom.name}
                                secondary={`${assignedStaff.length} staff assigned`}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Card>

        {/* Schedule Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Staff Member</InputLabel>
                  <Select
                    value={scheduleForm.staff_id}
                    onChange={(e) => setScheduleForm({
                      ...scheduleForm,
                      staff_id: e.target.value
                    })}
                  >
                    {staff.map((staffMember) => (
                      <MenuItem key={staffMember.id} value={staffMember.id}>
                        {staffMember.full_name} ({staffMember.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Schedule Date"
                  value={scheduleForm.schedule_date}
                  onChange={(newDate) => setScheduleForm({
                    ...scheduleForm,
                    schedule_date: newDate
                  })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Shift Start"
                  value={scheduleForm.shift_start}
                  onChange={(newTime) => setScheduleForm({
                    ...scheduleForm,
                    shift_start: newTime
                  })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Shift End"
                  value={scheduleForm.shift_end}
                  onChange={(newTime) => setScheduleForm({
                    ...scheduleForm,
                    shift_end: newTime
                  })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Break Start"
                  value={scheduleForm.break_start}
                  onChange={(newTime) => setScheduleForm({
                    ...scheduleForm,
                    break_start: newTime
                  })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Break End"
                  value={scheduleForm.break_end}
                  onChange={(newTime) => setScheduleForm({
                    ...scheduleForm,
                    break_end: newTime
                  })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Role Assignment"
                  value={scheduleForm.role_assignment}
                  onChange={(e) => setScheduleForm({
                    ...scheduleForm,
                    role_assignment: e.target.value
                  })}
                  placeholder="e.g., Lead Teacher, Assistant"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Classroom Assignment</InputLabel>
                  <Select
                    value={scheduleForm.classroom_assignment}
                    onChange={(e) => setScheduleForm({
                      ...scheduleForm,
                      classroom_assignment: e.target.value
                    })}
                  >
                    <MenuItem value="">No specific classroom</MenuItem>
                    {classrooms.map((classroom) => (
                      <MenuItem key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({
                    ...scheduleForm,
                    notes: e.target.value
                  })}
                  placeholder="Additional notes or instructions"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSchedule}
              variant="contained"
              disabled={!scheduleForm.staff_id || !scheduleForm.shift_start || !scheduleForm.shift_end}
            >
              {editingSchedule ? 'Update' : 'Create'} Schedule
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default StaffSchedulingManager;