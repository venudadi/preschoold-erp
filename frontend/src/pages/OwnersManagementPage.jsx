import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, TextField, Button, Alert, Checkbox, FormControlLabel, FormGroup, Divider, CircularProgress, Chip } from '@mui/material';
import { getOwners, createOwner, getOwnerCenters, updateOwnerCenters, getAllCenters, getUserRoles, updateUserRoles } from '../services/api';

const OwnersManagementPage = () => {
  const [owners, setOwners] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [ownerAssignments, setOwnerAssignments] = useState({}); // userId -> [centerId]
  const [roleAssignments, setRoleAssignments] = useState({}); // userId -> [role]

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [ownersRes, centersRes] = await Promise.all([
        getOwners(),
        getAllCenters()
      ]);
      setOwners(ownersRes);
      setCenters(centersRes);
    } catch (e) {
      setError(e?.message || 'Failed to load owners or centers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createOwner(form);
      setForm({ fullName: '', email: '', password: '' });
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to create owner');
    } finally {
      setSaving(false);
    }
  };

  const toggleOwnerCenter = async (ownerId, centerId) => {
    // update local state first
    setOwnerAssignments(prev => {
      const cur = new Set(prev[ownerId] || []);
      if (cur.has(centerId)) cur.delete(centerId); else cur.add(centerId);
      return { ...prev, [ownerId]: Array.from(cur) };
    });
  };

  const persistAssignments = async (ownerId) => {
    setSaving(true);
    setError('');
    try {
      const centerIds = ownerAssignments[ownerId] || [];
      await updateOwnerCenters(ownerId, centerIds);
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  const loadOwnerCenters = async (ownerId) => {
    try {
      const ids = await getOwnerCenters(ownerId);
      setOwnerAssignments(prev => ({ ...prev, [ownerId]: ids }));
    } catch (e) {
      // ignore per-owner errors here
    }
  };

  const loadUserRoles = async (userId) => {
    try {
      const roles = await getUserRoles(userId);
      setRoleAssignments(prev => ({ ...prev, [userId]: roles }));
    } catch (e) {}
  };

  useEffect(() => {
    owners.forEach(o => { loadOwnerCenters(o.id); loadUserRoles(o.id); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owners.length]);

  const toggleUserRole = (userId, role) => {
    setRoleAssignments(prev => {
      const cur = new Set(prev[userId] || []);
      if (cur.has(role)) cur.delete(role); else cur.add(role);
      return { ...prev, [userId]: Array.from(cur) };
    });
  };

  const persistRoles = async (userId) => {
    setSaving(true);
    setError('');
    try {
      await updateUserRoles(userId, roleAssignments[userId] || []);
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to save roles');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Owners</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create owners and assign one or more centers to each owner.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Add Owner</Typography>
              <Box component="form" onSubmit={handleCreateOwner} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Full Name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                <TextField label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                <TextField label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Create Owner'}</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Assign Centers</Typography>
                {loading && <CircularProgress size={20} />}
              </Box>
              <Divider sx={{ mb: 2 }} />
              {owners.map(owner => {
                const selected = new Set(ownerAssignments[owner.id] || []);
                const roles = new Set(roleAssignments[owner.id] || []);
                return (
                  <Box key={owner.id} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{owner.full_name} <Typography component="span" variant="caption" color="text.secondary">({owner.email})</Typography></Typography>
                    <Box sx={{ my: 1 }}>
                      {(roleAssignments[owner.id] || []).map(r => (<Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />))}
                    </Box>
                    <FormGroup row sx={{ mt: 1 }}>
                      {centers.map(c => (
                        <FormControlLabel key={c.id} control={<Checkbox size="small" checked={selected.has(c.id)} onChange={() => toggleOwnerCenter(owner.id, c.id)} />} label={c.name} />
                      ))}
                    </FormGroup>
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <Button size="small" variant="outlined" onClick={() => persistAssignments(owner.id)} disabled={saving}>Save Centers</Button>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>Roles</Typography>
                    <FormGroup row>
                      {['owner','admin','financial_manager','academic_coordinator'].map(role => (
                        <FormControlLabel key={role} control={<Checkbox size="small" checked={roles.has(role)} onChange={() => toggleUserRole(owner.id, role)} />} label={role.replace('_',' ')} />
                      ))}
                    </FormGroup>
                    <Box sx={{ mt: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => persistRoles(owner.id)} disabled={saving}>Save Roles</Button>
                    </Box>
                  </Box>
                );
              })}
              {owners.length === 0 && <Typography variant="body2" color="text.secondary">No owners yet.</Typography>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OwnersManagementPage;
