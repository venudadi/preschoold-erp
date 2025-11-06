import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton,
    Chip, Alert
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { getMainVendors, createMainVendor, updateMainVendor, deleteMainVendor } from '../services/api';

const MainVendorManagementPage = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState({
        vendorName: '',
        gstNumber: '',
        billingAddress: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const canManage = user.role === 'super_admin' || user.role === 'owner';

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const response = await getMainVendors(false);
            setVendors(response.vendors || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch main vendors');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (vendor = null) => {
        if (vendor) {
            setEditingVendor(vendor);
            setFormData({
                vendorName: vendor.vendor_name || '',
                gstNumber: vendor.gst_number || '',
                billingAddress: vendor.billing_address || '',
                contactPerson: vendor.contact_person || '',
                contactEmail: vendor.contact_email || '',
                contactPhone: vendor.contact_phone || ''
            });
        } else {
            setEditingVendor(null);
            setFormData({
                vendorName: '',
                gstNumber: '',
                billingAddress: '',
                contactPerson: '',
                contactEmail: '',
                contactPhone: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingVendor(null);
        setFormData({
            vendorName: '',
            gstNumber: '',
            billingAddress: '',
            contactPerson: '',
            contactEmail: '',
            contactPhone: ''
        });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {
            if (editingVendor) {
                await updateMainVendor(editingVendor.id, formData);
            } else {
                await createMainVendor(formData);
            }
            await fetchVendors();
            handleCloseDialog();
        } catch (err) {
            setError(err.message || 'Failed to save main vendor');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this main vendor? This will affect all associated companies.')) {
            try {
                await deleteMainVendor(id);
                await fetchVendors();
            } catch (err) {
                setError(err.message || 'Failed to delete main vendor');
            }
        }
    };

    if (!canManage) {
        return (
            <Box>
                <Alert severity="error">You do not have permission to access this page.</Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Main Vendor Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage main vendor firms (Krisla Pvt Ltd, Sevis) for tie-up billing
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Main Vendor
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Vendor Name</TableCell>
                            <TableCell>GST Number</TableCell>
                            <TableCell>Contact Person</TableCell>
                            <TableCell>Contact Email</TableCell>
                            <TableCell>Contact Phone</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">Loading...</TableCell>
                            </TableRow>
                        ) : vendors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">No main vendors found</TableCell>
                            </TableRow>
                        ) : (
                            vendors.map((vendor) => (
                                <TableRow key={vendor.id}>
                                    <TableCell><strong>{vendor.vendor_name}</strong></TableCell>
                                    <TableCell>{vendor.gst_number || '-'}</TableCell>
                                    <TableCell>{vendor.contact_person || '-'}</TableCell>
                                    <TableCell>{vendor.contact_email || '-'}</TableCell>
                                    <TableCell>{vendor.contact_phone || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={vendor.is_active ? 'Active' : 'Inactive'}
                                            color={vendor.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleOpenDialog(vendor)}
                                            size="small"
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDelete(vendor.id)}
                                            size="small"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{editingVendor ? 'Edit Main Vendor' : 'Add Main Vendor'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="Vendor Name"
                                name="vendorName"
                                value={formData.vendorName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="GST Number"
                                name="gstNumber"
                                value={formData.gstNumber}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact Person"
                                name="contactPerson"
                                value={formData.contactPerson}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact Email"
                                name="contactEmail"
                                type="email"
                                value={formData.contactEmail}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact Phone"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Billing Address"
                                name="billingAddress"
                                value={formData.billingAddress}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingVendor ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MainVendorManagementPage;
