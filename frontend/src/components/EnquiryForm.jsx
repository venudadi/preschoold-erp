import React, { useState } from 'react';
import {
    Grid, TextField, Button, Select, MenuItem, FormControl, InputLabel, Paper, Typography,
    CircularProgress, Box, Checkbox, FormControlLabel, Alert
} from '@mui/material';
import { createEnquiry, checkCompanyTieUp } from '../services/api';
import AdmissionFormModal from './AdmissionFormModal.jsx';

const programOptions = {
    "Daycare": ["CRECHE", "PLAYGROUP", "TODDLERS", "PRE-KINDY", "KINDY"],
    "Pre-school": ["PLAYGROUP", "TODDLERS", "PRE-KINDY", "KINDY"],
    "Adhoc Daycare": ["Adhoc Daycare"],
    "After-school Care": ["Joey Juniors", "Koala Seniors"]
};

// UPDATED: The initial state now perfectly matches your final schema
const initialFormData = {
    source: '', childName: '', childDob: '', parentName: '', mobileNumber: '',
    company: '', email: '', parentLocation: '', majorProgram: '', specificProgram: '',
    serviceHours: '', status: 'Open', reasonForClosure: '', followUpFlag: false,
    assignedTo: '', remarks: '', followUpDate: '', visited: false
};

// Validation functions
const validateEmail = (email) => {
    if (!email) return null; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : 'Please enter a valid email address';
};

const validateMobile = (mobile) => {
    if (!mobile) return 'Mobile number is required';
    const mobileRegex = /^(\+91)?[6-9]\d{9}$/;
    return mobileRegex.test(mobile.replace(/\s/g, '')) ? null : 'Please enter a valid 10-digit mobile number';
};

const validateName = (name, fieldName) => {
    if (!name) return `${fieldName} is required`;
    if (name.length < 2) return `${fieldName} must be at least 2 characters`;
    if (name.length > 50) return `${fieldName} must not exceed 50 characters`;
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    return nameRegex.test(name) ? null : `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
};

const validateChildDOB = (dob) => {
    if (!dob) return null; // Optional field
    const today = new Date();
    const birthDate = new Date(dob);
    const ageInMonths = (today - birthDate) / (1000 * 60 * 60 * 24 * 30.44);
    
    if (birthDate > today) return 'Date of birth cannot be in the future';
    if (ageInMonths < 6) return 'Child must be at least 6 months old';
    if (ageInMonths > 96) return 'Child cannot be older than 8 years';
    return null;
};

const validateFollowUpDate = (date) => {
    if (!date) return null; // Will be required conditionally
    const today = new Date();
    const followUpDate = new Date(date);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);
    
    if (followUpDate < today) return 'Follow-up date cannot be in the past';
    if (followUpDate > sixMonthsFromNow) return 'Follow-up date cannot be more than 6 months in the future';
    return null;
};

const validateServiceHours = (hours) => {
    if (!hours) return null; // Optional field
    const num = parseInt(hours);
    if (isNaN(num) || num <= 0) return 'Service hours must be a positive number';
    if (num < 2) return 'Minimum 2 hours required';
    if (num > 12) return 'Maximum 12 hours allowed';
    return null;
};

const validateCompany = (company) => {
    if (!company) return null; // Optional field
    if (company.length < 2) return 'Company name must be at least 2 characters';
    if (company.length > 100) return 'Company name must not exceed 100 characters';
    return null;
};

const validateRemarks = (remarks) => {
    if (!remarks) return null; // Optional field
    if (remarks.length > 500) return 'Remarks must not exceed 500 characters';
    return null;
};

const EnquiryForm = ({ onEnquiryAdded }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [hasTieUp, setHasTieUp] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
    const [enquiryForAdmission, setEnquiryForAdmission] = useState(null);

    // Validation helper function
    const validateField = (name, value) => {
        let error = null;
        switch (name) {
            case 'childName':
                error = validateName(value, 'Child name');
                break;
            case 'parentName':
                error = validateName(value, 'Parent name');
                break;
            case 'mobileNumber':
                error = validateMobile(value);
                break;
            case 'email':
                error = validateEmail(value);
                break;
            case 'childDob':
                error = validateChildDOB(value);
                break;
            case 'followUpDate':
                error = validateFollowUpDate(value);
                break;
            case 'serviceHours':
                error = validateServiceHours(value);
                break;
            case 'company':
                error = validateCompany(value);
                break;
            case 'remarks':
                error = validateRemarks(value);
                break;
            default:
                break;
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Handle special cases
        if (name === "majorProgram") {
            setFormData(prev => ({ ...prev, specificProgram: '' }));
        }

        // Auto-trigger admission for 'Enrolled' status
        if (name === "status" && newValue === "Enrolled") {
            handleClosedStatusSelected();
        }

        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        
        // Handle conditional validations
        let conditionalError = null;
        if (name === 'followUpDate' && formData.followUpFlag && !value) {
            conditionalError = 'Follow-up date is required when follow-up is enabled';
        }
        if (name === 'reasonForClosure' && formData.status === 'Declined' && !value) {
            conditionalError = 'Reason for closure is required when status is Declined';
        }
        
        setValidationErrors(prev => ({
            ...prev,
            [name]: error || conditionalError
        }));
    };

    const handleTieUpCheck = async () => {
        if (!formData.company) return;
        setIsChecking(true);
        setHasTieUp(null);
        try {
            const result = await checkCompanyTieUp(formData.company);
            setHasTieUp(result.hasTieUp);
        } catch (err) { console.error(err); } 
        finally { setIsChecking(false); }
    };

    // Auto-trigger admission flow when status is Closed
    const handleClosedStatusSelected = () => {
        // Validate required fields first
        const errors = validateAllFields();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            alert('Please fix all validation errors before proceeding to admission');
            return;
        }
        
        // Create a mock enquiry object for admission
        const enquiryData = {
            ...formData,
            child_name: formData.childName,
            child_dob: formData.childDob,
            parent_name: formData.parentName,
            mobile_number: formData.mobileNumber,
            email: formData.email,
            probable_joining_date: formData.followUpDate || new Date().toISOString().slice(0, 10)
        };
        
        setEnquiryForAdmission(enquiryData);
        setIsAdmissionModalOpen(true);
    };

    // Validate all fields
    const validateAllFields = () => {
        const errors = {};
        
        // Validate all fields
        Object.keys(formData).forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) errors[field] = error;
        });
        
        // Conditional validations
        if (formData.followUpFlag && !formData.followUpDate) {
            errors.followUpDate = 'Follow-up date is required when follow-up is enabled';
        }
        if (formData.status === 'Declined' && !formData.reasonForClosure) {
            errors.reasonForClosure = 'Reason for closure is required when status is Declined';
        }
        if (!formData.source) errors.source = 'Source is required';
        if (!formData.majorProgram) errors.majorProgram = 'Major program is required';
        if (!formData.specificProgram) errors.specificProgram = 'Specific program is required';
        
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');
        
        // Validate all fields
        const errors = validateAllFields();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setSubmitting(false);
            setError('Please fix all validation errors before submitting');
            return;
        }
        
        try {
            await createEnquiry({ ...formData, hasTieUp });
            setSuccess('Enquiry submitted successfully!');
            onEnquiryAdded();
            setFormData(initialFormData);
            setHasTieUp(null);
            setValidationErrors({});
        } catch (err) {
            setError(err.message || 'Failed to submit enquiry.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdmissionConfirm = async (admissionData) => {
        try {
            // First create the enquiry
            const enquiryResponse = await createEnquiry({ ...formData, hasTieUp, status: 'Closed' });
            
            // Then process admission (assuming the API returns the enquiry ID)
            if (enquiryResponse.enquiryId) {
                const { convertEnquiryToStudent } = await import('../services/api');
                await convertEnquiryToStudent(enquiryResponse.enquiryId, admissionData);
            }
            
            setIsAdmissionModalOpen(false);
            setEnquiryForAdmission(null);
            setSuccess('Student admitted successfully!');
            onEnquiryAdded();
            setFormData(initialFormData);
            setHasTieUp(null);
            setValidationErrors({});
        } catch (error) {
            console.error("Admission failed", error);
            alert(error.message || 'Failed to admit student.');
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" gutterBottom>Add New Enquiry</Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Demographics Section */}
                    <Grid item xs={12}><Typography variant="h6">Demographics</Typography></Grid>
                    <Grid item xs={12} sm={4}><FormControl fullWidth required><InputLabel>Source</InputLabel><Select name="source" value={formData.source} label="Source" onChange={handleChange}><MenuItem value="Online">Online</MenuItem><MenuItem value="Walk-in">Walk-in</MenuItem><MenuItem value="Advertisement">Advertisement</MenuItem><MenuItem value="Reference (Internal)">Reference (Internal)</MenuItem><MenuItem value="Reference (External)">Reference (External)</MenuItem><MenuItem value="Others">Others</MenuItem></Select></FormControl></Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField 
                            fullWidth 
                            required 
                            name="childName" 
                            label="Child Name" 
                            value={formData.childName} 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!validationErrors.childName}
                            helperText={validationErrors.childName}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField 
                            fullWidth 
                            type="date" 
                            name="childDob" 
                            label="Child DOB" 
                            value={formData.childDob} 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            InputLabelProps={{ shrink: true }}
                            error={!!validationErrors.childDob}
                            helperText={validationErrors.childDob}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField 
                            fullWidth 
                            required 
                            name="parentName" 
                            label="Parent Name" 
                            value={formData.parentName} 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!validationErrors.parentName}
                            helperText={validationErrors.parentName}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField 
                            fullWidth 
                            required 
                            name="mobileNumber" 
                            label="Mobile Number" 
                            value={formData.mobileNumber} 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!validationErrors.mobileNumber}
                            helperText={validationErrors.mobileNumber}
                            placeholder="10-digit mobile number"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField 
                            fullWidth 
                            name="email" 
                            label="Email Address" 
                            type="email"
                            value={formData.email} 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!validationErrors.email}
                            helperText={validationErrors.email}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}><TextField fullWidth name="parentLocation" label="Parent Location" value={formData.parentLocation} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <TextField 
                                fullWidth 
                                name="company" 
                                label="Company" 
                                value={formData.company} 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={!!validationErrors.company}
                                helperText={validationErrors.company}
                            />
                            <Button onClick={handleTieUpCheck} disabled={isChecking} sx={{ ml: 1, minWidth: '120px' }}>
                                {isChecking ? <CircularProgress size={24} /> : 'Check Tie-up'}
                            </Button>
                        </Box>
                    </Grid>
                    {hasTieUp !== null && (<Grid item xs={12}><Typography color={hasTieUp ? 'success.main' : 'error.main'}>Corporate Tie-up: {hasTieUp ? 'Yes' : 'No'}</Typography></Grid>)}

                    {/* Academics Section */}
                    <Grid item xs={12}><Typography variant="h6" sx={{ mt: 2 }}>Academics</Typography></Grid>
                    <Grid item xs={12} sm={4}><FormControl fullWidth required><InputLabel>Major Program</InputLabel><Select name="majorProgram" value={formData.majorProgram} label="Major Program" onChange={handleChange}>{Object.keys(programOptions).map(prog => <MenuItem key={prog} value={prog}>{prog}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={4}><FormControl fullWidth required disabled={!formData.majorProgram}><InputLabel>Specific Program</InputLabel><Select name="specificProgram" value={formData.specificProgram} label="Specific Program" onChange={handleChange}>{(programOptions[formData.majorProgram] || []).map(prog => <MenuItem key={prog} value={prog}>{prog}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField 
                            fullWidth 
                            name="serviceHours" 
                            label="Service Opted in Hours" 
                            type="number" 
                            value={formData.serviceHours} 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!validationErrors.serviceHours}
                            helperText={validationErrors.serviceHours}
                            inputProps={{ min: 2, max: 12 }}
                        />
                    </Grid>

                    {/* Status & Follow-up Section */}
                    <Grid item xs={12}><Typography variant="h6" sx={{ mt: 2 }}>Status & Follow-up</Typography></Grid>
                    <Grid item xs={12} sm={3}><FormControl fullWidth><InputLabel>Status</InputLabel>
                        {/* Status options matching database ENUM */}
                        <Select name="status" value={formData.status} label="Status" onChange={handleChange}>
                            <MenuItem value="Open">Open</MenuItem>
                            <MenuItem value="New">New</MenuItem>
                            <MenuItem value="Contacted">Contacted</MenuItem>
                            <MenuItem value="Visit Scheduled">Visit Scheduled</MenuItem>
                            <MenuItem value="Enrolled">Enrolled</MenuItem>
                            <MenuItem value="Declined">Declined</MenuItem>
                            <MenuItem value="Closed">Closed</MenuItem>
                        </Select>
                    </FormControl></Grid>
                    <Grid item xs={12} sm={3}><FormControl fullWidth><InputLabel>Follow up?</InputLabel><Select name="followUpFlag" value={formData.followUpFlag} label="Follow up?" onChange={handleChange}><MenuItem value={true}>Yes</MenuItem><MenuItem value={false}>No</MenuItem></Select></FormControl></Grid>
                    
                    {/* Follow-up Date field */}
                    <Grid item xs={12} sm={3}>
                        <TextField 
                            fullWidth 
                            type="date" 
                            name="followUpDate" 
                            label="Follow-up Date" 
                            value={formData.followUpDate} 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            InputLabelProps={{ shrink: true }}
                            error={!!validationErrors.followUpDate}
                            helperText={validationErrors.followUpDate}
                            required={formData.followUpFlag}
                        />
                    </Grid>

                    {/* Visited checkbox */}
                    <Grid item xs={12} sm={3}>
                        <FormControlLabel 
                            control={<Checkbox name="visited" checked={Boolean(formData.visited)} onChange={handleChange} />} 
                            label="Visited Center?" 
                            sx={{ pt:1 }} 
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}><TextField fullWidth name="assignedTo" label="Assigned To" value={formData.assignedTo} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            name="reasonForClosure"
                            label="Reason (if Declined)"
                            value={formData.reasonForClosure}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!validationErrors.reasonForClosure}
                            helperText={validationErrors.reasonForClosure}
                            required={formData.status === 'Declined'}
                            disabled={formData.status !== 'Declined'}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField 
                            fullWidth 
                            multiline 
                            rows={3} 
                            name="remarks" 
                            label="Remarks" 
                            value={formData.remarks} 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={!!validationErrors.remarks}
                            helperText={validationErrors.remarks || `${formData.remarks.length}/500 characters`}
                            inputProps={{ maxLength: 500 }}
                        />
                    </Grid>

                    {/* Submit Section */}
                    <Grid item xs={12}>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            disabled={submitting || Object.keys(validationErrors).some(key => validationErrors[key])}
                        >
                            {submitting ? 'Submitting...' : 'Submit Enquiry'}
                        </Button>
                    </Grid>
                    {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}
                    {success && <Grid item xs={12}><Alert severity="success">{success}</Alert></Grid>}
                </Grid>
            </form>

            {/* Admission Modal */}
            {enquiryForAdmission && (
                <AdmissionFormModal
                    open={isAdmissionModalOpen}
                    onClose={() => {
                        setIsAdmissionModalOpen(false);
                        setEnquiryForAdmission(null);
                        // Reset status back to previous value if user cancels
                        setFormData(prev => ({ ...prev, status: 'Open' }));
                    }}
                    enquiryData={enquiryForAdmission}
                    onConfirm={handleAdmissionConfirm}
                />
            )}
        </Paper>
    );
};

export default EnquiryForm;