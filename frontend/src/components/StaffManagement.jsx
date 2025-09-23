import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Typography,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { useApi } from '../services/api';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const api = useApi();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'teacher',
        designation: '',
        department: '',
        employee_id: '',
        joining_date: '',
        contract_type: 'full-time',
        contact_number: '',
        emergency_contact: '',
        address: ''
    });

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/staff/center/' + localStorage.getItem('centerId'));
            setStaff(response.data);
            setError(null);
        } catch (error) {
            setError('Failed to fetch staff data');
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (selectedStaff) {
                await api.put(`/staff/${selectedStaff.id}`, formData);
            } else {
                await api.post('/staff', {
                    ...formData,
                    center_id: localStorage.getItem('centerId')
                });
            }
            setOpenDialog(false);
            fetchStaff();
            setError(null);
        } catch (error) {
            setError('Failed to save staff member');
            console.error('Error saving staff member:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (staffMember) => {
        setSelectedStaff(staffMember);
        setFormData({
            email: staffMember.email,
            first_name: staffMember.first_name,
            last_name: staffMember.last_name,
            role: staffMember.role,
            designation: staffMember.designation,
            department: staffMember.department,
            employee_id: staffMember.employee_id,
            joining_date: staffMember.joining_date ? new Date(staffMember.joining_date).toISOString().slice(0, 10) : '',
            contract_type: staffMember.contract_type,
            contact_number: staffMember.contact_number,
            emergency_contact: staffMember.emergency_contact,
            address: staffMember.address
        });
        setOpenDialog(true);
    };

    const getStatusChipColor = (status) => {
        switch (status) {
            case true:
                return 'success';
            case false:
                return 'error';
            default:
                return 'default';
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            role: 'teacher',
            designation: '',
            department: '',
            employee_id: '',
            joining_date: '',
            contract_type: 'full-time',
            contact_number: '',
            emergency_contact: '',
            address: ''
        });
    };

    return (
        <Box p={3}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Staff Management</Typography>
                <Box display="flex" alignItems="center" gap={2}>
                    {loading && (
                        <Typography color="text.secondary">
                            Loading...
                        </Typography>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        onClick={() => {
                            setSelectedStaff(null);
                            resetForm();
                            setOpenDialog(true);
                        }}
                    >
                        Add Staff Member
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Employee ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Designation</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Contact</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {staff.map((staffMember) => (
                            <TableRow key={staffMember.id}>
                                <TableCell>{staffMember.employee_id}</TableCell>
                                <TableCell>
                                    {staffMember.first_name} {staffMember.last_name}
                                </TableCell>
                                <TableCell>{staffMember.designation}</TableCell>
                                <TableCell>{staffMember.department}</TableCell>
                                <TableCell>{staffMember.contact_number}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={staffMember.active_status ? 'Active' : 'Inactive'}
                                        color={getStatusChipColor(staffMember.active_status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEdit(staffMember)}
                                        disabled={loading}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => {/* TODO: Handle schedule */}}
                                        disabled={loading}
                                    >
                                        <CalendarMonthIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => {/* TODO: Handle documents */}}
                                        disabled={loading}
                                    >
                                        <AssignmentIndIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog 
                open={openDialog} 
                onClose={() => {
                    if (!loading) {
                        setOpenDialog(false);
                        resetForm();
                    }
                }} 
                maxWidth="md" 
                fullWidth
            >
                <DialogTitle>
                    {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </Grid>
                        {!selectedStaff && (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />
                                </Grid>
                            </>
                        )}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    label="Role"
                                    disabled={loading}
                                >
                                    <MenuItem value="teacher">Teacher</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="staff">Staff</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Employee ID"
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Department"
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Joining Date"
                                name="joining_date"
                                type="date"
                                value={formData.joining_date}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Contract Type</InputLabel>
                                <Select
                                    name="contract_type"
                                    value={formData.contract_type}
                                    onChange={handleInputChange}
                                    label="Contract Type"
                                    disabled={loading}
                                >
                                    <MenuItem value="full-time">Full Time</MenuItem>
                                    <MenuItem value="part-time">Part Time</MenuItem>
                                    <MenuItem value="contract">Contract</MenuItem>
                                    <MenuItem value="temporary">Temporary</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact Number"
                                name="contact_number"
                                value={formData.contact_number}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Emergency Contact"
                                name="emergency_contact"
                                value={formData.emergency_contact}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                multiline
                                rows={3}
                                value={formData.address}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => {
                            setOpenDialog(false);
                            resetForm();
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : selectedStaff ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StaffManagement;