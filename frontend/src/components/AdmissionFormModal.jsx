import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
    Typography, Box, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel,
    RadioGroup, Radio, Card, CardContent, CircularProgress, Alert, FormHelperText
} from '@mui/material';
import { getClassrooms, checkCompanyTieUp, calculateAdmissionPreview } from '../services/api';

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

    // Payment configuration state
    const [paymentMode, setPaymentMode] = useState('Online');
    const [billingFrequency, setBillingFrequency] = useState('Monthly');

    // Tie-up state
    const [hasTieUp, setHasTieUp] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [companyDetails, setCompanyDetails] = useState(null);

    // Fee calculation state
    const [calculationResult, setCalculationResult] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculationError, setCalculationError] = useState(null);

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

            // Check for company tie-up
            if (enquiryData.company_name) {
                checkCompanyTieUp(enquiryData.company_name)
                    .then(response => {
                        if (response.hasTieUp) {
                            setHasTieUp(true);
                            setCompanyId(response.company.id);
                            setCompanyDetails(response.company);
                            setBillingFrequency('Monthly'); // Force monthly for tie-ups
                            setFeeDetails(prev => ({ ...prev, discountPercentage: 0 })); // No discount for tie-ups
                        }
                    })
                    .catch(error => {
                        console.error('Error checking company tie-up:', error);
                    });
            }
        }
    }, [enquiryData]);

    // Calculate fee preview whenever relevant fields change
    useEffect(() => {
        const shouldCalculate = feeDetails.originalFeePerMonth &&
                               feeDetails.studentKitAmount !== '' &&
                               paymentMode &&
                               billingFrequency;

        if (shouldCalculate && open) {
            const timer = setTimeout(() => {
                calculateFeePreview();
            }, 300); // Debounce for 300ms

            return () => clearTimeout(timer);
        }
    }, [
        feeDetails.originalFeePerMonth,
        feeDetails.studentKitAmount,
        feeDetails.annualFeeWaiveOff,
        feeDetails.discountPercentage,
        paymentMode,
        billingFrequency,
        hasTieUp,
        companyId,
        open
    ]);

    const calculateFeePreview = async () => {
        setIsCalculating(true);
        setCalculationError(null);

        try {
            const response = await calculateAdmissionPreview({
                originalFeePerMonth: parseFloat(feeDetails.originalFeePerMonth) || 0,
                studentKitAmount: parseFloat(feeDetails.studentKitAmount) || 0,
                annualFeeWaiveOff: feeDetails.annualFeeWaiveOff,
                paymentMode,
                billingFrequency,
                hasTieUp,
                companyId: hasTieUp ? companyId : null,
                discountPercentage: hasTieUp ? 0 : parseFloat(feeDetails.discountPercentage) || 0
            });

            setCalculationResult(response.calculation);

            // Auto-set finalFeePerMonth based on calculation
            if (!hasTieUp && response.calculation.finalFeePerMonth) {
                setFeeDetails(prev => ({
                    ...prev,
                    finalFeePerMonth: response.calculation.finalFeePerMonth
                }));
            }
        } catch (error) {
            console.error('Fee calculation error:', error);
            setCalculationError(error.message || 'Failed to calculate fees');
        } finally {
            setIsCalculating(false);
        }
    };

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

        // Prepare enhanced fee details with payment configuration
        const enhancedFeeDetails = {
            ...feeDetails,
            paymentMode,
            billingFrequency,
            // Include calculation results for validation
            parentContributionPercent: calculationResult?.parentContributionPercent || 0,
            companyContributionPercent: calculationResult?.companyContributionPercent || 0,
            parentAmountBeforeGst: calculationResult?.parentAmountBeforeGst || 0,
            companyAmountBeforeGst: calculationResult?.companyAmountBeforeGst || 0,
            parentGstAmount: calculationResult?.parentGstAmount || 0,
            companyGstAmount: calculationResult?.companyGstAmount || 0,
            parentTotalWithGst: calculationResult?.parentTotalWithGst || 0,
            companyTotalWithGst: calculationResult?.companyTotalWithGst || 0
        };

        const admissionData = {
            child,
            parents,
            classroomId,
            probableJoiningDate,
            feeDetails: enhancedFeeDetails,
            companyId: hasTieUp ? companyId : null
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

                    {hasTieUp && companyDetails && (
                        <Alert severity="info" sx={{ mt: 3 }}>
                            This enquiry has a tie-up with <strong>{companyDetails.company_name}</strong>.
                            Contribution split: Parent {companyDetails.parent_contribution_percent}% | Company {companyDetails.company_contribution_percent}%
                        </Alert>
                    )}

                    <Typography variant="h6" sx={{ mt: 4 }}>Payment Configuration</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Payment Mode</Typography>
                                <RadioGroup
                                    row
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                >
                                    <FormControlLabel value="Online" control={<Radio />} label="Online" />
                                    <FormControlLabel value="Cash" control={<Radio />} label="Cash" />
                                </RadioGroup>
                                <FormHelperText>
                                    {paymentMode === 'Online' ? '18% GST will be applied' : 'Cash payments generate receipts'}
                                </FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Billing Frequency</InputLabel>
                                <Select
                                    value={billingFrequency}
                                    label="Billing Frequency"
                                    onChange={(e) => setBillingFrequency(e.target.value)}
                                    disabled={hasTieUp}
                                >
                                    <MenuItem value="Monthly">Monthly</MenuItem>
                                    <MenuItem value="Term">Term (4+3+3 months)</MenuItem>
                                    <MenuItem value="Annual">Annual (10 months)</MenuItem>
                                </Select>
                                {hasTieUp && (
                                    <FormHelperText>Tie-up students must use Monthly billing</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>
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
                            <FormControl fullWidth disabled={hasTieUp}>
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
                                {hasTieUp && (
                                    <FormHelperText>Discounts not applicable for tie-up students</FormHelperText>
                                )}
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

                    {/* Fee Calculation Preview */}
                    {calculationResult && (
                        <Card sx={{ mt: 3, bgcolor: '#f5f5f5' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Fee Calculation Preview {isCalculating && <CircularProgress size={20} sx={{ ml: 2 }} />}
                                </Typography>

                                {calculationError && (
                                    <Alert severity="error" sx={{ mb: 2 }}>{calculationError}</Alert>
                                )}

                                <Grid container spacing={2}>
                                    {hasTieUp ? (
                                        <>
                                            {/* Tie-up calculation display */}
                                            <Grid item xs={12} md={6}>
                                                <Card variant="outlined">
                                                    <CardContent>
                                                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                                            Parent Contribution
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Base Amount: ₹{calculationResult.parentAmountBeforeGst?.toFixed(2) || '0.00'}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Student Kit: ₹{parseFloat(feeDetails.studentKitAmount || 0).toFixed(2)}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Subtotal: ₹{calculationResult.parentSubtotal?.toFixed(2) || '0.00'}
                                                        </Typography>
                                                        {paymentMode === 'Online' && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                GST (18%): ₹{calculationResult.parentGstAmount?.toFixed(2) || '0.00'}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="h6" sx={{ mt: 1 }}>
                                                            Total: ₹{calculationResult.parentTotalWithGst?.toFixed(2) || '0.00'}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Card variant="outlined">
                                                    <CardContent>
                                                        <Typography variant="subtitle1" fontWeight="bold" color="secondary">
                                                            Company Contribution
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Base Amount: ₹{calculationResult.companyAmountBeforeGst?.toFixed(2) || '0.00'}
                                                        </Typography>
                                                        {paymentMode === 'Online' && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                GST (18%): ₹{calculationResult.companyGstAmount?.toFixed(2) || '0.00'}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="h6" sx={{ mt: 1 }}>
                                                            Total: ₹{calculationResult.companyTotalWithGst?.toFixed(2) || '0.00'}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        </>
                                    ) : (
                                        <>
                                            {/* Non-tie-up calculation display */}
                                            <Grid item xs={12}>
                                                <Typography variant="body2">
                                                    Original Fee: ₹{parseFloat(feeDetails.originalFeePerMonth || 0).toFixed(2)}
                                                </Typography>
                                                {calculationResult.discountAmount > 0 && (
                                                    <Typography variant="body2" color="success.main">
                                                        Discount ({feeDetails.discountPercentage}%): -₹{calculationResult.discountAmount?.toFixed(2)}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2">
                                                    Final Fee per Month: ₹{calculationResult.finalFeePerMonth?.toFixed(2) || '0.00'}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Student Kit: ₹{parseFloat(feeDetails.studentKitAmount || 0).toFixed(2)}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Subtotal: ₹{calculationResult.parentSubtotal?.toFixed(2) || '0.00'}
                                                </Typography>
                                                {paymentMode === 'Online' && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        GST (18%): ₹{calculationResult.parentGstAmount?.toFixed(2) || '0.00'}
                                                    </Typography>
                                                )}
                                                <Typography variant="h6" sx={{ mt: 1 }}>
                                                    Total Monthly: ₹{calculationResult.parentTotalWithGst?.toFixed(2) || '0.00'}
                                                </Typography>
                                            </Grid>
                                        </>
                                    )}

                                    {/* Billing frequency breakdown */}
                                    {billingFrequency === 'Term' && calculationResult.term1Total && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" sx={{ mt: 2 }}>Term Payment Breakdown:</Typography>
                                            <Typography variant="body2">Term 1 (4 months): ₹{calculationResult.term1Total.toFixed(2)}</Typography>
                                            <Typography variant="body2">Term 2 (3 months): ₹{calculationResult.term2Total.toFixed(2)}</Typography>
                                            <Typography variant="body2">Term 3 (3 months): ₹{calculationResult.term3Total.toFixed(2)}</Typography>
                                        </Grid>
                                    )}

                                    {billingFrequency === 'Annual' && calculationResult.annualTotal && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" sx={{ mt: 2 }}>Annual Payment (10 months):</Typography>
                                            <Typography variant="h6">₹{calculationResult.annualTotal.toFixed(2)}</Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
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