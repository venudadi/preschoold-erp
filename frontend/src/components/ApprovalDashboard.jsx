import React, { useEffect, useState } from 'react';
import {
    Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Box, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { getInvoiceRequests, approveInvoiceRequest, rejectInvoiceRequest } from '../services/api';

const ApprovalDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [actionDialog, setActionDialog] = useState(false);
    const [actionType, setActionType] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getInvoiceRequests();
            setRequests(data.requests || []);
        } catch (err) {
            setError('Failed to fetch invoice requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = (request, type) => {
        setSelectedRequest(request);
        setActionType(type);
        setActionDialog(true);
        setActionError('');
        setRejectionReason('');
    };

    const handleConfirmAction = async () => {
        setActionLoading(true);
        setActionError('');
        try {
            if (actionType === 'approve') {
                await approveInvoiceRequest(selectedRequest.id);
            } else {
                await rejectInvoiceRequest(selectedRequest.id, rejectionReason);
            }
            setActionDialog(false);
            fetchRequests();
        } catch (err) {
            setActionError(err.message || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Pending Invoice Requests</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Student</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No pending requests</TableCell>
                                </TableRow>
                            ) : requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.child_name}</TableCell>
                                    <TableCell>{req.amount}</TableCell>
                                    <TableCell>{req.due_date}</TableCell>
                                    <TableCell>{req.description}</TableCell>
                                    <TableCell>
                                        <Chip label={req.status} color={req.status === 'Pending' ? 'warning' : req.status === 'Approved' ? 'success' : 'error'} />
                                    </TableCell>
                                    <TableCell>
                                        {req.status === 'Pending' && (
                                            <>
                                                <Button variant="contained" color="success" size="small" sx={{ mr: 1 }} onClick={() => handleAction(req, 'approve')}>Approve</Button>
                                                <Button variant="outlined" color="error" size="small" onClick={() => handleAction(req, 'reject')}>Reject</Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Dialog open={actionDialog} onClose={() => setActionDialog(false)}>
                <DialogTitle>{actionType === 'approve' ? 'Approve Invoice Request' : 'Reject Invoice Request'}</DialogTitle>
                <DialogContent>
                    {actionType === 'reject' && (
                        <TextField
                            label="Rejection Reason"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                    )}
                    {actionError && <Alert severity="error">{actionError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog(false)} disabled={actionLoading}>Cancel</Button>
                    <Button
                        onClick={handleConfirmAction}
                        variant="contained"
                        color={actionType === 'approve' ? 'success' : 'error'}
                        disabled={actionLoading || (actionType === 'reject' && !rejectionReason)}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : actionType === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default ApprovalDashboard;
