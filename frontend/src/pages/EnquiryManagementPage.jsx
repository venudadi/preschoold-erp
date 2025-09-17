import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel
} from '@mui/material';
import EnquiryForm from '../components/EnquiryForm.jsx';
import EnquiryList from '../components/EnquiryList.jsx';
import AdmissionFormModal from '../components/AdmissionFormModal.jsx'; // <-- IMPORT THE NEW MODAL
import { getEnquiries, updateEnquiry, convertEnquiryToStudent } from '../services/api'; // <-- IMPORT THE CONVERT FUNCTION

const EnquiryManagementPage = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ search: '', status: '' });
    
    // State for the first (update) modal
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // State for the second (admission) modal
    const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);

    const fetchEnquiries = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getEnquiries(filters);
            setEnquiries(data);
        } catch (error) { 
            console.error('Error fetching enquiries:', error);
            setError('Failed to fetch enquiries.'); 
        } 
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);
    
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleRowClick = (enquiry) => {
        const formattedEnquiry = { ...enquiry, follow_up_date: enquiry.follow_up_date ? new Date(enquiry.follow_up_date).toISOString().slice(0, 10) : '' };
        setSelectedEnquiry(formattedEnquiry);
        setIsUpdateModalOpen(true);
    };

    const handleCloseUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setSelectedEnquiry(null);
    };

    const handleModalFieldChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setSelectedEnquiry(prev => ({ ...prev, [name]: newValue }));
        
        // Auto-trigger admission for 'Closed' status
        if (name === "status" && newValue === "Closed") {
            setTimeout(() => {
                handleProcessAdmissionClick();
            }, 100); // Small delay to ensure state update
        }
        
        // Auto-set follow-up flag for 'Follow-up' status
        if (name === "status" && newValue === "Follow-up") {
            setSelectedEnquiry(prev => ({ ...prev, follow_up_flag: true }));
        }
    };

    const handleSaveChanges = async () => {
        if (!selectedEnquiry) return;
        setIsSaving(true);
        try {
            await updateEnquiry(selectedEnquiry.id, selectedEnquiry);
            handleCloseUpdateModal();
            fetchEnquiries();
        } catch (error) { 
            console.error("Failed to update enquiry", error); 
        } 
        finally { setIsSaving(false); }
    };

    // --- NEW HANDLERS FOR THE ADMISSION FLOW ---
    const handleProcessAdmissionClick = () => {
        setIsUpdateModalOpen(false); // Close the first modal
        setIsAdmissionModalOpen(true); // Open the second modal
    };
    
    const handleConfirmAdmission = async (admissionData) => {
        try {
            await convertEnquiryToStudent(selectedEnquiry.id, admissionData);
            setIsAdmissionModalOpen(false);
            setSelectedEnquiry(null);
            fetchEnquiries(); // Refresh the enquiry list
            alert('Student admitted successfully!'); // Or use a proper snackbar
        } catch(error) {
            console.error("Failed to convert enquiry", error);
            alert(error.message || 'Failed to admit student.');
        }
    };

    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>Enquiry & Lead Management</Typography>
            <EnquiryForm onEnquiryAdded={fetchEnquiries} />
            
            <EnquiryList 
                enquiries={enquiries} 
                onRowClick={handleRowClick}
                filters={filters}
                onFilterChange={handleFilterChange}
                isLoading={loading} 
            />

            {/* --- UPDATE MODAL --- */}
            <Dialog open={isUpdateModalOpen} onClose={handleCloseUpdateModal} fullWidth maxWidth="md">
                <DialogTitle>Update Enquiry Details</DialogTitle>
                <DialogContent>
                    {selectedEnquiry && (
                        <Box component="form" sx={{ mt: 2 }}>
                            <Grid container spacing={3}>
                                {/* Demographics Section */}
                                <Grid item xs={12}><Typography variant="h6">Demographics</Typography></Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Child Name" name="child_name" value={selectedEnquiry.child_name || ''} onChange={handleModalFieldChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="date" label="Child DOB" name="child_dob" value={selectedEnquiry.child_dob || ''} onChange={handleModalFieldChange} InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Parent Name" name="parent_name" value={selectedEnquiry.parent_name || ''} onChange={handleModalFieldChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Mobile Number" name="mobile_number" value={selectedEnquiry.mobile_number || ''} onChange={handleModalFieldChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Email" name="email" value={selectedEnquiry.email || ''} onChange={handleModalFieldChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Location" name="parent_location" value={selectedEnquiry.parent_location || ''} onChange={handleModalFieldChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Company" name="company" value={selectedEnquiry.company || ''} onChange={handleModalFieldChange} />
                                </Grid>

                                {/* Status & Follow-up Section */}
                                <Grid item xs={12}><Typography variant="h6" sx={{ mt: 2 }}>Status & Follow-up</Typography></Grid>
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select name="status" value={selectedEnquiry.status || ''} label="Status" onChange={handleModalFieldChange}>
                                            <MenuItem value="Open">Open</MenuItem>
                                            <MenuItem value="Follow-up">Follow-up</MenuItem>
                                            <MenuItem value="Closed">Closed</MenuItem>
                                            <MenuItem value="Lost">Lost</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <FormControlLabel 
                                        control={<Checkbox name="follow_up_flag" checked={selectedEnquiry.follow_up_flag || false} onChange={handleModalFieldChange} />} 
                                        label="Follow-up Required" 
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField 
                                        fullWidth 
                                        type="date" 
                                        label="Follow-up Date" 
                                        name="follow_up_date" 
                                        value={selectedEnquiry.follow_up_date || ''} 
                                        onChange={handleModalFieldChange} 
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Assigned To" name="assigned_to" value={selectedEnquiry.assigned_to || ''} onChange={handleModalFieldChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel 
                                        control={<Checkbox name="visited" checked={selectedEnquiry.visited || false} onChange={handleModalFieldChange} />} 
                                        label="Visited Center" 
                                    />
                                </Grid>
                                {selectedEnquiry.status === 'Lost' && (
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Reason for Closure" name="reason_for_closure" value={selectedEnquiry.reason_for_closure || ''} onChange={handleModalFieldChange} />
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <TextField fullWidth multiline rows={3} label="Remarks" name="remarks" value={selectedEnquiry.remarks || ''} onChange={handleModalFieldChange} />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between' }}>
                    {/* Conditionally show "Process Admission" button only for Closed status */}
                    {selectedEnquiry?.status === 'Closed' && (
                        <Button onClick={handleProcessAdmissionClick} variant="contained" color="success">
                            Process Admission
                        </Button>
                    )}
                    <Box sx={{ ml: 'auto' }}>
                        <Button onClick={handleCloseUpdateModal}>Cancel</Button>
                        <Button onClick={handleSaveChanges} variant="contained" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
            
            {/* --- NEW: THE FINAL ADMISSION MODAL --- */}
            {selectedEnquiry && (
                <AdmissionFormModal
                    open={isAdmissionModalOpen}
                    onClose={() => setIsAdmissionModalOpen(false)}
                    enquiryData={selectedEnquiry}
                    onConfirm={handleConfirmAdmission}
                />
            )}
        </Box>
    );
};

export default EnquiryManagementPage;