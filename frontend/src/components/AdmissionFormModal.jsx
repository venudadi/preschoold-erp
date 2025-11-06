import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
    Typography, Box, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel
} from '@mui/material';
import { getClassrooms } from '../services/api'; // We'll need to fetch classrooms for the dropdown

const AdmissionFormModal = ({ open, onClose, enquiryData, onConfirm }) => {
    const [child, setChild] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: '' });
    const [parents, setParents] = useState([
        { firstName: '', lastName: '', relation: 'Father', phone: '', email: '' },
        { firstName: '', lastName: '', relation: 'Mother', phone: '', email: '' },
        { firstName: '', lastName: '', relation: 'Guardian', phone: '', email: '' }
    ]);
    const [classroomId, setClassroomId] = useState('');
    const [probableJoiningDate, setProbableJoiningDate] = useState('');
    const [availableClassrooms, setAvailableClassrooms] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Fee details state
    const [feeDetails, setFeeDetails] = useState({
        originalFeePerMonth: '',
        finalFeePerMonth: '',
        annualFeeWaiveOff: false,
        studentKitAmount: '',
        discountPercentage: 0
    });

    // Fetch available classrooms when the modal opens
    useEffect(() => {
        if (open) {
            const fetchClassrooms = async () => {
                try {
                    const data = await getClassrooms();
                    setAvailableClassrooms(data);
                } catch (error) {
                    console.error("Failed to fetch classrooms", error);
                }
            };
            fetchClassrooms();
        }
    }, [open]);

    // Pre-populate the form when enquiryData is available
    useEffect(() => {
        if (enquiryData) {
            setChild({
                firstName: enquiryData.child_name || '', // As requested, full name goes into first name
                lastName: '',
                dateOfBirth: enquiryData.child_dob ? new Date(enquiryData.child_dob).toISOString().slice(0, 10) : '',
                gender: enquiryData.gender || 'Male'
            });
            setParents(prev => {
                const newParents = [...prev];
                newParents[0] = {
                    ...newParents[0],
                    firstName: enquiryData.parent_name || '',
                    phone: enquiryData.mobile_number || '',
                    email: enquiryData.email || ''
                };
                return newParents;
            });
            setProbableJoiningDate(enquiryData.probable_joining_date ? new Date(enquiryData.probable_joining_date).toISOString().slice(0, 10) : '');
        }
    }, [enquiryData]);

    const handleParentChange = (index, e) => {
        const { name, value } = e.target;
        const newParents = [...parents];
        newParents[index][name] = value;
        setParents(newParents);
    };
    
    const handleChildChange = (e) => {
        const { name, value } = e.target;
        setChild(prev => ({ ...prev, [name]: value }));
    };

    const handleFeeDetailsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFeeDetails(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleConfirm = async () => {
        setIsSaving(true);
        const admissionData = {
            child,
            parents,
            classroomId,
            probableJoiningDate,
            feeDetails
        };
        try {
            await onConfirm(admissionData);
        } catch (error) {
            console.error("Admission failed", error);
            // You can add an error state here to show in the modal
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>Final Admission Form</DialogTitle>
            <DialogContent>
                <Box component="form" sx={{ mt: 2 }}>
                    <Typography variant="h6">Child's Details</Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="First Name" name="firstName" value={child.firstName} onChange={handleChildChange} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Last Name" name="lastName" value={child.lastName} onChange={handleChildChange} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required type="date" label="Date of Birth" name="dateOfBirth" value={child.dateOfBirth} onChange={handleChildChange} InputLabelProps={{ shrink: true }} /></Grid>
                        <Grid item xs={12} sm={6}><FormControl fullWidth required><InputLabel>Gender</InputLabel><Select name="gender" value={child.gender} label="Gender" onChange={handleChildChange}><MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem><MenuItem value="Other">Other</MenuItem></Select></FormControl></Grid>
                    </Grid>

                    <Typography variant="h6">Parent/Guardian Details</Typography>
                    {parents.map((parent, index) => (
                        <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={2.5}><TextField fullWidth required={index === 0} label={`Parent ${index + 1} First Name`} name="firstName" value={parent.firstName} onChange={(e) => handleParentChange(index, e)} /></Grid>
                            <Grid item xs={12} sm={2.5}><TextField fullWidth label="Last Name" name="lastName" value={parent.lastName} onChange={(e) => handleParentChange(index, e)} /></Grid>
                            <Grid item xs={12} sm={2}><TextField fullWidth label="Relation" name="relation" value={parent.relation} onChange={(e) => handleParentChange(index, e)} /></Grid>
                            <Grid item xs={12} sm={2.5}><TextField fullWidth required={index === 0} label="Phone" name="phone" value={parent.phone} onChange={(e) => handleParentChange(index, e)} /></Grid>
                            <Grid item xs={12} sm={2.5}><TextField fullWidth label="Email" name="email" value={parent.email} onChange={(e) => handleParentChange(index, e)} /></Grid>
                        </Grid>
                    ))}

                    <Typography variant="h6" sx={{ mt: 4 }}>Admission Details</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Assign to Classroom</InputLabel>
                                <Select value={classroomId} label="Assign to Classroom" onChange={(e) => setClassroomId(e.target.value)}>
                                    {availableClassrooms.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Probable Date of Joining" value={probableJoiningDate} onChange={(e) => setProbableJoiningDate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 4 }}>Fee Details</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="Original Fee per Month"
                                name="originalFeePerMonth"
                                value={feeDetails.originalFeePerMonth}
                                onChange={handleFeeDetailsChange}
                                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="Final Fee per Month"
                                name="finalFeePerMonth"
                                value={feeDetails.finalFeePerMonth}
                                onChange={handleFeeDetailsChange}
                                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Student Kit Amount"
                                name="studentKitAmount"
                                value={feeDetails.studentKitAmount}
                                onChange={handleFeeDetailsChange}
                                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Discount Percentage</InputLabel>
                                <Select
                                    name="discountPercentage"
                                    value={feeDetails.discountPercentage}
                                    label="Discount Percentage"
                                    onChange={handleFeeDetailsChange}
                                >
                                    <MenuItem value={0}>0%</MenuItem>
                                    <MenuItem value={5}>5%</MenuItem>
                                    <MenuItem value={10}>10%</MenuItem>
                                    <MenuItem value={15}>15%</MenuItem>
                                    <MenuItem value={20}>20%</MenuItem>
                                    <MenuItem value={25}>25%</MenuItem>
                                    <MenuItem value={30}>30%</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="annualFeeWaiveOff"
                                        checked={feeDetails.annualFeeWaiveOff}
                                        onChange={handleFeeDetailsChange}
                                    />
                                }
                                label="Annual Fee Waive Off"
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleConfirm} variant="contained" disabled={isSaving}>
                    {isSaving ? 'Confirming...' : 'Confirm Admission'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdmissionFormModal;