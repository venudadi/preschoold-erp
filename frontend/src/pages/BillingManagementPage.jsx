import React, { useState } from 'react';
import {
    Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, CircularProgress, Alert, Snackbar, Grid, TextField,
    FormControl, InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BusinessIcon from '@mui/icons-material/Business';
import InvoiceList from '../components/InvoiceList.jsx';
import ApprovalDashboard from '../components/ApprovalDashboard.jsx';
import { generateMonthlyInvoices, generateCompanyInvoices } from '../services/api';

import InvoiceRequestForm from '../components/InvoiceRequestForm.jsx';

const BillingManagementPage = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [requestFormOpen, setRequestFormOpen] = useState(false);

    // Company invoice generation state
    const [isGeneratingCompany, setIsGeneratingCompany] = useState(false);
    const [companyInvoiceDialog, setCompanyInvoiceDialog] = useState(false);
    const [consolidationType, setConsolidationType] = useState('per_company');
    const [invoiceMonth, setInvoiceMonth] = useState(new Date().getMonth() + 1);
    const [invoiceYear, setInvoiceYear] = useState(new Date().getFullYear());

    // Get current month name
    const getCurrentMonth = () => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[new Date().getMonth()];
    };

    const handleGenerateClick = () => {
        setConfirmDialogOpen(true);
    };

    const handleConfirmGenerate = async () => {
        setConfirmDialogOpen(false);
        setIsGenerating(true);

        try {
            const response = await generateMonthlyInvoices();
            
            setSnackbar({
                open: true,
                message: response.message,
                severity: 'success'
            });

            // Trigger invoice list refresh
            setRefreshTrigger(prev => prev + 1);

        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message || 'Failed to generate invoices',
                severity: 'error'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Open invoice request form
    const handleOpenRequestForm = () => setRequestFormOpen(true);
    const handleCloseRequestForm = () => setRequestFormOpen(false);

    // Company invoice generation handlers
    const handleOpenCompanyInvoiceDialog = () => {
        setCompanyInvoiceDialog(true);
    };

    const handleGenerateCompanyInvoices = async () => {
        setCompanyInvoiceDialog(false);
        setIsGeneratingCompany(true);

        try {
            const response = await generateCompanyInvoices(invoiceMonth, invoiceYear, consolidationType);

            setSnackbar({
                open: true,
                message: response.message || `${response.count} company invoices generated successfully!`,
                severity: 'success'
            });

            // Trigger invoice list refresh
            setRefreshTrigger(prev => prev + 1);

        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message || 'Failed to generate company invoices',
                severity: 'error'
            });
        } finally {
            setIsGeneratingCompany(false);
        }
    };

    const getConsolidationTypeLabel = (type) => {
        switch (type) {
            case 'per_child': return 'Per Child (Individual invoices for each tie-up student)';
            case 'per_company': return 'Per Company (Consolidated by company)';
            case 'per_main_vendor': return 'Per Main Vendor (Single invoice to Krisla/Sevis)';
            default: return '';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <MonetizationOnIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                    Billing & Invoice Management
                </Typography>
            </Box>

            {/* Generate Monthly Invoices Section */}
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarMonthIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h5" component="h2">
                        Monthly Invoice Generation
                    </Typography>
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Generate invoices for all enrolled students with monthly billing frequency. 
                    This will create invoices for {getCurrentMonth()} {new Date().getFullYear()}.
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        <strong>Important:</strong> This action will generate invoices for all eligible students 
                        who are currently enrolled and have monthly billing enabled. Students who already 
                        have invoices for this month will be skipped automatically.
                    </Typography>
                </Alert>

                <Button
                    variant="contained"
                    size="large"
                    onClick={handleGenerateClick}
                    disabled={isGenerating}
                    startIcon={isGenerating ? <CircularProgress size={20} /> : <MonetizationOnIcon />}
                    sx={{ 
                        minWidth: 300,
                        height: 48,
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                    }}
                >
                    {isGenerating 
                        ? 'Generating Invoices...' 
                        : `Generate All Monthly Invoices for ${getCurrentMonth()}`
                    }
                </Button>

                {/* Request Invoice for Student (Admin) */}
                <Button
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 2, minWidth: 300, height: 48, fontWeight: 'bold' }}
                    onClick={handleOpenRequestForm}
                >
                    Request Invoice for Student
                </Button>
            </Paper>

            {/* Company Invoice Generation Section */}
            <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'background.paper', border: '2px solid', borderColor: 'secondary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ mr: 2, color: 'secondary.main' }} />
                    <Typography variant="h5" component="h2" color="secondary.main">
                        Company Invoice Generation (Tie-ups)
                    </Typography>
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Generate invoices for tie-up students. Invoices are billed to main vendors (Krisla Pvt Ltd / Sevis)
                    based on the selected consolidation type.
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        <strong>Consolidation Options:</strong>
                    </Typography>
                    <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                        <Typography component="li" variant="body2">
                            <strong>Per Child:</strong> Individual invoices for each tie-up student
                        </Typography>
                        <Typography component="li" variant="body2">
                            <strong>Per Company:</strong> Consolidated invoices per company
                        </Typography>
                        <Typography component="li" variant="body2">
                            <strong>Per Main Vendor:</strong> Single invoice to Krisla or Sevis
                        </Typography>
                    </Box>
                </Alert>

                <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={handleOpenCompanyInvoiceDialog}
                    disabled={isGeneratingCompany}
                    startIcon={isGeneratingCompany ? <CircularProgress size={20} /> : <BusinessIcon />}
                    sx={{
                        minWidth: 300,
                        height: 48,
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                    }}
                >
                    {isGeneratingCompany
                        ? 'Generating Company Invoices...'
                        : 'Generate Company Invoices'
                    }
                </Button>
            </Paper>

            {/* Invoice List Section */}
            <InvoiceList refreshTrigger={refreshTrigger} />

            {/* Approval Dashboard for Financial Manager */}
            <Box sx={{ mt: 4 }}>
                <ApprovalDashboard />
            </Box>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
                <DialogTitle>
                    Confirm Invoice Generation
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to generate monthly invoices for {getCurrentMonth()} {new Date().getFullYear()}?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        This action will:
                    </Typography>
                    <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                        <Typography component="li" variant="body2" color="text.secondary">
                            Create invoices for all eligible students
                        </Typography>
                        <Typography component="li" variant="body2" color="text.secondary">
                            Generate unique invoice numbers
                        </Typography>
                        <Typography component="li" variant="body2" color="text.secondary">
                            Set due dates 30 days from today
                        </Typography>
                        <Typography component="li" variant="body2" color="text.secondary">
                            Skip students who already have invoices for this month
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmGenerate} 
                        variant="contained" 
                        color="primary"
                        autoFocus
                    >
                        Yes, Generate Invoices
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Invoice Request Form Dialog */}
            <InvoiceRequestForm
                open={requestFormOpen}
                onClose={handleCloseRequestForm}
                onSuccess={() => setRefreshTrigger(prev => prev + 1)}
            />

            {/* Company Invoice Generation Dialog */}
            <Dialog open={companyInvoiceDialog} onClose={() => setCompanyInvoiceDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Generate Company Invoices (Tie-ups)
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Configure invoice generation settings for tie-up students. Invoices will be billed to
                        main vendors (Krisla Pvt Ltd / Sevis) based on your consolidation preference.
                    </Typography>

                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Consolidation Type</InputLabel>
                                <Select
                                    value={consolidationType}
                                    label="Consolidation Type"
                                    onChange={(e) => setConsolidationType(e.target.value)}
                                >
                                    <MenuItem value="per_child">
                                        <Box>
                                            <Typography variant="body1">Per Child</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Individual invoices for each tie-up student
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="per_company">
                                        <Box>
                                            <Typography variant="body1">Per Company</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Consolidated invoices per company
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="per_main_vendor">
                                        <Box>
                                            <Typography variant="body1">Per Main Vendor</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Single invoice to Krisla or Sevis
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                </Select>
                                <FormHelperText>
                                    {getConsolidationTypeLabel(consolidationType)}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                required
                                label="Month"
                                type="number"
                                value={invoiceMonth}
                                onChange={(e) => setInvoiceMonth(parseInt(e.target.value))}
                                InputProps={{ inputProps: { min: 1, max: 12 } }}
                                helperText="1 = January, 12 = December"
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                required
                                label="Year"
                                type="number"
                                value={invoiceYear}
                                onChange={(e) => setInvoiceYear(parseInt(e.target.value))}
                                InputProps={{ inputProps: { min: 2020, max: 2100 } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Alert severity="warning">
                                <Typography variant="body2">
                                    <strong>Note:</strong> This will generate invoices for all tie-up students
                                    who don't already have invoices for {invoiceMonth}/{invoiceYear}.
                                    Invoices will include company contribution amounts with GST (if applicable).
                                </Typography>
                            </Alert>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCompanyInvoiceDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerateCompanyInvoices}
                        variant="contained"
                        color="secondary"
                        autoFocus
                    >
                        Generate Invoices
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BillingManagementPage;