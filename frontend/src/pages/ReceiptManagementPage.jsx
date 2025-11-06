import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton,
    Chip, Alert, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Edit, PictureAsPdf, Add } from '@mui/icons-material';
import { getReceipts, createReceipt, updateReceipt, generateReceiptPDF, getChildren } from '../services/api';

const ReceiptManagementPage = () => {
    const [receipts, setReceipts] = useState([]);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingReceipt, setEditingReceipt] = useState(null);
    const [formData, setFormData] = useState({
        childId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amountDue: '',
        amountCollected: '',
        collectionDate: '',
        paymentStatus: 'Pending',
        remarks: ''
    });

    useEffect(() => {
        fetchReceipts();
        fetchChildren();
    }, []);

    const fetchReceipts = async () => {
        try {
            setLoading(true);
            const response = await getReceipts();
            setReceipts(response.receipts || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch receipts');
        } finally {
            setLoading(false);
        }
    };

    const fetchChildren = async () => {
        try {
            const response = await getChildren();
            // Filter for cash payment mode children
            const cashChildren = (response.children || []).filter(child => child.payment_mode === 'Cash');
            setChildren(cashChildren);
        } catch (err) {
            console.error('Failed to fetch children:', err);
        }
    };

    const handleOpenDialog = (receipt = null) => {
        if (receipt) {
            setEditingReceipt(receipt);
            setFormData({
                childId: receipt.child_id || '',
                month: receipt.month || new Date().getMonth() + 1,
                year: receipt.year || new Date().getFullYear(),
                amountDue: receipt.amount_due || '',
                amountCollected: receipt.amount_collected || '',
                collectionDate: receipt.collection_date ? receipt.collection_date.slice(0, 10) : '',
                paymentStatus: receipt.payment_status || 'Pending',
                remarks: receipt.remarks || ''
            });
        } else {
            setEditingReceipt(null);
            setFormData({
                childId: '',
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                amountDue: '',
                amountCollected: '',
                collectionDate: '',
                paymentStatus: 'Pending',
                remarks: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingReceipt(null);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {
            if (editingReceipt) {
                await updateReceipt(editingReceipt.id, formData);
                setSuccess('Receipt updated successfully');
            } else {
                await createReceipt(formData);
                setSuccess('Receipt created successfully');
            }
            await fetchReceipts();
            handleCloseDialog();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Failed to save receipt');
        }
    };

    const handleDownloadPDF = async (receiptId) => {
        try {
            await generateReceiptPDF(receiptId);
            setSuccess('Receipt PDF downloaded successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Failed to generate PDF');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Collected': return 'success';
            case 'Partial': return 'warning';
            case 'Pending': return 'error';
            case 'Cancelled': return 'default';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Receipt Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage cash payment receipts for students
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Create Receipt
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Receipt Number</TableCell>
                            <TableCell>Student</TableCell>
                            <TableCell>Month/Year</TableCell>
                            <TableCell>Amount Due</TableCell>
                            <TableCell>Amount Collected</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Collection Date</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">Loading...</TableCell>
                            </TableRow>
                        ) : receipts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">No receipts found</TableCell>
                            </TableRow>
                        ) : (
                            receipts.map((receipt) => (
                                <TableRow key={receipt.id}>
                                    <TableCell><strong>{receipt.receipt_number}</strong></TableCell>
                                    <TableCell>
                                        {receipt.child_name || '-'}
                                        {receipt.student_id && <Typography variant="caption" display="block" color="text.secondary">{receipt.student_id}</Typography>}
                                    </TableCell>
                                    <TableCell>{receipt.month}/{receipt.year}</TableCell>
                                    <TableCell>₹{parseFloat(receipt.amount_due).toFixed(2)}</TableCell>
                                    <TableCell>₹{parseFloat(receipt.amount_collected || 0).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={receipt.payment_status}
                                            color={getStatusColor(receipt.payment_status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{receipt.collection_date ? new Date(receipt.collection_date).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleOpenDialog(receipt)}
                                            size="small"
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            color="secondary"
                                            onClick={() => handleDownloadPDF(receipt.id)}
                                            size="small"
                                        >
                                            <PictureAsPdf />
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
                <DialogTitle>{editingReceipt ? 'Edit Receipt' : 'Create Receipt'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Student</InputLabel>
                                <Select
                                    name="childId"
                                    value={formData.childId}
                                    label="Student"
                                    onChange={handleChange}
                                    disabled={!!editingReceipt}
                                >
                                    {children.map((child) => (
                                        <MenuItem key={child.id} value={child.id}>
                                            {child.first_name} {child.last_name} ({child.student_id})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                required
                                label="Month"
                                name="month"
                                type="number"
                                value={formData.month}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 1, max: 12 } }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                required
                                label="Year"
                                name="year"
                                type="number"
                                value={formData.year}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                required
                                label="Amount Due"
                                name="amountDue"
                                type="number"
                                value={formData.amountDue}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Amount Collected"
                                name="amountCollected"
                                type="number"
                                value={formData.amountCollected}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Collection Date"
                                name="collectionDate"
                                type="date"
                                value={formData.collectionDate}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Payment Status</InputLabel>
                                <Select
                                    name="paymentStatus"
                                    value={formData.paymentStatus}
                                    label="Payment Status"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Partial">Partial</MenuItem>
                                    <MenuItem value="Collected">Collected</MenuItem>
                                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Remarks"
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingReceipt ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReceiptManagementPage;
