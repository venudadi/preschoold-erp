import React, { useState } from 'react';
import {
    Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, 
    DialogActions, CircularProgress, Alert, Snackbar
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InvoiceList from '../components/InvoiceList.jsx';
import { generateMonthlyInvoices } from '../services/api';

const BillingManagementPage = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
            </Paper>

            {/* Invoice List Section */}
            <InvoiceList refreshTrigger={refreshTrigger} />

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
        </Box>
    );
};

export default BillingManagementPage;