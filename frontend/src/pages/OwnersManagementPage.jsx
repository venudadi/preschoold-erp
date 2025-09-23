import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, TextField, Button, Alert, 
  Checkbox, FormControlLabel, FormGroup, Divider, CircularProgress, Chip,
  Select, MenuItem, FormControl, InputLabel, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText, ListItemSecondaryAction,
  Switch, Tooltip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { Edit, Delete, PersonAdd, Security, ToggleOn, ToggleOff } from '@mui/icons-material';
import { getOwners, createOwner, getOwnerCenters, updateOwnerCenters, getAllCenters } from '../services/api';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    role: '',
    centerId: '',
    phoneNumber: '',
    jobTitle: ''
  });
  const [saving, setSaving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [centerAssignments, setCenterAssignments] = useState({}); // userId -> [centerId]

  // Load available roles from backend
  const loadRoles = async () => {
    try {
      const response = await fetch('/api/owners/roles', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableRoles(data.roles);
      }
    } catch (e) {
      console.error('Failed to load roles', e);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, centersRes] = await Promise.all([
        getOwners(), // This will now return all users
        getAllCenters()
      ]);
      setUsers(usersRes);
      setCenters(centersRes);
    } catch (e) {
      setError(e?.message || 'Failed to load users or centers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadRoles();
    load(); 
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/owners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      setForm({ 
        fullName: '', 
        email: '', 
        password: '', 
        role: '',
        centerId: '',
        phoneNumber: '',
        jobTitle: ''
      });
      setSuccess('User created successfully!');
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      centerId: user.center_id || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/owners/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fullName: editingUser.full_name,
          email: editingUser.email,
          role: editingUser.role,
          centerId: editingUser.centerId || null,
          phoneNumber: editingUser.phone_number,
          jobTitle: editingUser.job_title,
          isActive: editingUser.is_active
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      
      setSuccess('User updated successfully!');
      setEditDialogOpen(false);
      setEditingUser(null);
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/owners/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle user status');
      }
      
      setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to toggle user status');
    } finally {
      setSaving(false);
    }
  };

  const handleForcePasswordReset = async (userId, userName) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/owners/${userId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to force password reset');
      }
      
      setSuccess(`Password reset flag set for ${userName}. They will be required to reset their password on next login.`);
    } catch (e) {
      setError(e?.message || 'Failed to force password reset');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (role) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getRoleChipColor = (role) => {
    const colors = {
      'owner': 'error',
      'admin': 'warning',
      'academic_coordinator': 'info',
      'teacher': 'success',
      'parent': 'default'
    };
    return colors[role] || 'default';
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>User Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create and manage users with different roles across all centers.
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Create User Form */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PersonAdd sx={{ mr: 1 }} />
                Add New User
              </Typography>
              <Box component="form" onSubmit={handleCreateUser} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  label="Full Name" 
                  value={form.fullName} 
                  onChange={e => setForm({ ...form, fullName: e.target.value })} 
                  required 
                  size="small"
                />
                <TextField 
                  label="Email" 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({ ...form, email: e.target.value })} 
                  required 
                  size="small"
                />
                <TextField 
                  label="Password" 
                  type="password" 
                  value={form.password} 
                  onChange={e => setForm({ ...form, password: e.target.value })} 
                  required 
                  size="small"
                  helperText="Minimum 8 characters"
                />
                <FormControl size="small" required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={form.role}
                    label="Role"
                    onChange={e => setForm({ ...form, role: e.target.value })}
                  >
                    {availableRoles.map(role => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small">
                  <InputLabel>Primary Center</InputLabel>
                  <Select
                    value={form.centerId}
                    label="Primary Center"
                    onChange={e => setForm({ ...form, centerId: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>No Center</em>
                    </MenuItem>
                    {centers.map(center => (
                      <MenuItem key={center.id} value={center.id}>
                        {center.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField 
                  label="Phone Number" 
                  value={form.phoneNumber} 
                  onChange={e => setForm({ ...form, phoneNumber: e.target.value })} 
                  size="small"
                />
                <TextField 
                  label="Job Title" 
                  value={form.jobTitle} 
                  onChange={e => setForm({ ...form, jobTitle: e.target.value })} 
                  size="small"
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={saving}
                  sx={{ mt: 1 }}
                >
                  {saving ? 'Creating...' : 'Create User'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Users List */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">All Users</Typography>
                {loading && <CircularProgress size={20} />}
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Center</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {user.full_name}
                          </Typography>
                          {user.phone_number && (
                            <Typography variant="caption" color="text.secondary">
                              {user.phone_number}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{user.email}</Typography>
                          {user.job_title && (
                            <Typography variant="caption" color="text.secondary">
                              {user.job_title}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getRoleDisplayName(user.role)} 
                            size="small"
                            color={getRoleChipColor(user.role)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.center_name || 'No Center'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.is_active ? 'Active' : 'Inactive'} 
                            size="small"
                            color={user.is_active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit User">
                              <IconButton size="small" onClick={() => handleEditUser(user)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                color={user.is_active ? 'warning' : 'success'}
                              >
                                {user.is_active ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Force Password Reset">
                              <IconButton 
                                size="small" 
                                onClick={() => handleForcePasswordReset(user.id, user.full_name)}
                                color="info"
                              >
                                <Security fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {users.length === 0 && !loading && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No users found.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editingUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField 
                label="Full Name" 
                value={editingUser.full_name} 
                onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })} 
                size="small"
              />
              <TextField 
                label="Email" 
                type="email" 
                value={editingUser.email} 
                onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} 
                size="small"
              />
              <FormControl size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={editingUser.role}
                  label="Role"
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  {availableRoles.map(role => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Primary Center</InputLabel>
                <Select
                  value={editingUser.centerId}
                  label="Primary Center"
                  onChange={e => setEditingUser({ ...editingUser, centerId: e.target.value })}
                >
                  <MenuItem value="">
                    <em>No Center</em>
                  </MenuItem>
                  {centers.map(center => (
                    <MenuItem key={center.id} value={center.id}>
                      {center.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField 
                label="Phone Number" 
                value={editingUser.phone_number || ''} 
                onChange={e => setEditingUser({ ...editingUser, phone_number: e.target.value })} 
                size="small"
              />
              <TextField 
                label="Job Title" 
                value={editingUser.job_title || ''} 
                onChange={e => setEditingUser({ ...editingUser, job_title: e.target.value })} 
                size="small"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(editingUser.is_active)}
                    onChange={e => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained" disabled={saving}>
            {saving ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;

