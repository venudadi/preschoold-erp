import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    CircularProgress,
    Alert,
    Chip,
    Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon
} from '@mui/icons-material';
import { getCenters, createCenter, updateCenter } from '../services/api';

const CenterManagement = () => {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCenter, setEditingCenter] = useState(null);
    const [formData, setFormData] = useState({
        center_name: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        phone: '',
        email: '',
        capacity: ''
    });
    const [submitting, setSubmitting] = useState(false);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchCenters();
    }, []);

    const fetchCenters = async () => {
        try {
            setLoading(true);
            const data = await getCenters();
            setCenters(data);
            setError('');
        } catch (err) {
            setError('Failed to load centers');
            console.error('Error fetching centers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (center = null) => {
        if (center) {
            setEditingCenter(center);
            setFormData({
                center_name: center.center_name || '',
                address: center.address || '',
                city: center.city || '',
                state: center.state || '',
                postal_code: center.postal_code || '',
                phone: center.phone || '',
                email: center.email || '',
                capacity: center.capacity || ''
            });
        } else {
            setEditingCenter(null);
            setFormData({
                center_name: '',
                address: '',
                city: '',
                state: '',
                postal_code: '',
                phone: '',
                email: '',
                capacity: ''
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingCenter(null);
        setFormData({
            center_name: '',
            address: '',
            city: '',
            state: '',
            postal_code: '',
            phone: '',
            email: '',
            capacity: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.center_name || !formData.address || !formData.city) {
            setError('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            if (editingCenter) {
                await updateCenter(editingCenter.id, formData);
            } else {
                await createCenter(formData);
            }
            
            await fetchCenters();
            handleCloseDialog();
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to save center');
        } finally {
            setSubmitting(false);
        }
    };

    // Only render for super_admin
    if (user.role !== 'super_admin') {
        return null;
    }

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon color="primary" />
                        <Typography variant="h6" component="h2">
                            Center Management
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        disabled={loading}
                    >
                        Add Center
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List>
                        {centers.map((center) => (
                            <ListItem
                                key={center.id}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1,
                                    bgcolor: 'background.paper'
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Typography variant="h6">
                                                {center.center_name}
                                            </Typography>
                                            <Chip
                                                label={`${center.total_students || 0} Students`}
                                                color="primary"
                                                size="small"
                                            />
                                            <Chip
                                                label={`${center.total_classrooms || 0} Classrooms`}
                                                color="secondary"
                                                size="small"
                                            />
                                        </Box>
                                    }
                                    primaryTypographyProps={{ component: 'div' }}
                                    secondary={
                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                            <Grid item xs={12} sm={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <LocationIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {center.address}, {center.city}, {center.state} {center.postal_code}
                                                    </Typography>
                                                </Box>
                                                {center.phone && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PhoneIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            {center.phone}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                {center.email && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <EmailIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            {center.email}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {center.capacity && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Capacity: {center.capacity} students
                                                    </Typography>
                                                )}
                                            </Grid>
                                        </Grid>
                                    }
                                    secondaryTypographyProps={{ component: 'div' }}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        aria-label="edit"
                                        onClick={() => handleOpenDialog(center)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                        {centers.length === 0 && (
                            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                No centers found. Click "Add Center" to create your first center.
                            </Typography>
                        )}
                    </List>
                )}

                {/* Add/Edit Center Dialog */}
                <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {editingCenter ? 'Edit Center' : 'Add New Center'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    name="center_name"
                                    label="Center Name"
                                    value={formData.center_name}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="address"
                                    label="Address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    multiline
                                    rows={2}
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="city"
                                    label="City"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="state"
                                    label="State"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    fullWidth
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="postal_code"
                                    label="Postal Code"
                                    value={formData.postal_code}
                                    onChange={handleInputChange}
                                    fullWidth
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="capacity"
                                    label="Student Capacity"
                                    type="number"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    fullWidth
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="phone"
                                    label="Phone Number"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    fullWidth
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="email"
                                    label="Email Address"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    fullWidth
                                    variant="outlined"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained" 
                            disabled={submitting}
                        >
                            {submitting ? <CircularProgress size={20} /> : (editingCenter ? 'Update' : 'Create')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default CenterManagement;