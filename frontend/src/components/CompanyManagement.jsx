import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, TextField, Button, Paper, Typography, Grid, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Chip, FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { getCompanies, createCompany, updateCompany, deleteCompany, getMainVendors } from '../services/api';

const CompanyManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [mainVendors, setMainVendors] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [formData, setFormData] = useState({
        companyName: '',
        mainVendorId: '',
        parentContributionPercent: 30,
        companyContributionPercent: 70
    });

    const fetchCompanies = useCallback(async () => {
        try {
            const data = await getCompanies();
            setCompanies(data.companies || data || []);
        } catch (err) {
            setError(err.message || 'Failed to load companies.');
        }
    }, []);

    const fetchMainVendors = useCallback(async () => {
        try {
            const data = await getMainVendors();
            setMainVendors(data.vendors || []);
        } catch (err) {
            console.error('Failed to load main vendors:', err);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
        fetchMainVendors();
    }, [fetchCompanies, fetchMainVendors]);

    const handleOpenDialog = (company = null) => {
        if (company) {
            setEditingCompany(company);
            setFormData({
                companyName: company.company_name || '',
                mainVendorId: company.main_vendor_id || '',
                parentContributionPercent: company.parent_contribution_percent || 30,
                companyContributionPercent: company.company_contribution_percent || 70
            });
        } else {
            setEditingCompany(null);
            setFormData({
                companyName: '',
                mainVendorId: '',
                parentContributionPercent: 30,
                companyContributionPercent: 70
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCompany(null);
        setError('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Auto-adjust contribution percentages
            if (name === 'parentContributionPercent') {
                updated.companyContributionPercent = 100 - parseFloat(value || 0);
            } else if (name === 'companyContributionPercent') {
                updated.parentContributionPercent = 100 - parseFloat(value || 0);
            }

            return updated;
        });
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        // Validate contribution percentages
        const total = parseFloat(formData.parentContributionPercent) + parseFloat(formData.companyContributionPercent);
        if (Math.abs(total - 100) > 0.01) {
            setError('Parent and company contribution percentages must sum to 100%');
            return;
        }

        try {
            if (editingCompany) {
                await updateCompany(editingCompany.id, formData);
                setSuccess('Company updated successfully!');
            } else {
                await createCompany(formData);
                setSuccess('Company added successfully!');
            }
            fetchCompanies();
            handleCloseDialog();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to save company.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            try {
                await deleteCompany(id);
                setSuccess('Company deleted successfully!');
                fetchCompanies();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.message || 'Failed to delete company.');
            }
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Manage Tie-up Companies</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Company
                </Button>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Company Name</TableCell>
                            <TableCell>Main Vendor</TableCell>
                            <TableCell>Parent Contribution</TableCell>
                            <TableCell>Company Contribution</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {companies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No companies found</TableCell>
                            </TableRow>
                        ) : (
                            companies.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell>{company.company_name}</TableCell>
                                    <TableCell>{company.main_vendor_name || '-'}</TableCell>
                                    <TableCell>{company.parent_contribution_percent}%</TableCell>
                                    <TableCell>{company.company_contribution_percent}%</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={company.is_active ? 'Active' : 'Inactive'}
                                            color={company.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenDialog(company)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(company.id)}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingCompany ? 'Edit Company' : 'Add Company'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="Company Name"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Main Vendor</InputLabel>
                                <Select
                                    name="mainVendorId"
                                    value={formData.mainVendorId}
                                    label="Main Vendor"
                                    onChange={handleChange}
                                >
                                    {mainVendors.map((vendor) => (
                                        <MenuItem key={vendor.id} value={vendor.id}>
                                            {vendor.vendor_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                required
                                label="Parent Contribution %"
                                name="parentContributionPercent"
                                type="number"
                                value={formData.parentContributionPercent}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 0, max: 100, step: 0.01 } }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                required
                                label="Company Contribution %"
                                name="companyContributionPercent"
                                type="number"
                                value={formData.companyContributionPercent}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 0, max: 100, step: 0.01 } }}
                            />
                        </Grid>
                        {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingCompany ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default CompanyManagement;

