import React, { useState, useEffect } from 'react';
import {
    Paper, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Box, Chip, Grid, Card, CardContent
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getPendingApprovals, approveAdmission, rejectAdmission } from '../services/api';

const AdmissionApprovalDashboard = ({ onAction }) => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
    const [actionNotes, setActionNotes] = useState('');

    useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const data = await getPendingApprovals();
            setApprovals(data.approvals || []);
        } catch (error) {
            console.error('Error fetching approvals:', error);
            alert('Failed to load pending approvals.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenActionDialog = (approval, type) => {
        setSelectedApproval(approval);
        setActionType(type);
        setActionDialogOpen(true);
        setActionNotes('');
    };

    const handleCloseActionDialog = () => {
        setActionDialogOpen(false);
        setSelectedApproval(null);
        setActionType('');
        setActionNotes('');
    };

    const handleConfirmAction = async () => {
        if (!selectedApproval) return;

        try {
            if (actionType === 'approve') {
                await approveAdmission(selectedApproval.approval_id, actionNotes);
                alert('Admission approved successfully!');
            } else if (actionType === 'reject') {
                await rejectAdmission(selectedApproval.approval_id, actionNotes);
                alert('Admission rejected.');
            }

            handleCloseActionDialog();
            fetchApprovals();
            if (onAction) onAction();
        } catch (error) {
            console.error('Error processing approval:', error);
            alert(error.message || 'Failed to process approval.');
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography>Loading pending approvals...</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Pending Admission Approvals
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review and approve admission requests with fee details
            </Typography>

            {approvals.length === 0 ? (
                <Typography variant="body1" sx={{ mt: 2 }}>
                    No pending approvals at this time.
                </Typography>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Child Name</TableCell>
                                <TableCell>Parent Name</TableCell>
                                <TableCell>Contact</TableCell>
                                <TableCell>Original Fee</TableCell>
                                <TableCell>Final Fee</TableCell>
                                <TableCell>Discount</TableCell>
                                <TableCell>Annual Waive</TableCell>
                                <TableCell>Kit Amount</TableCell>
                                <TableCell>Submitted By</TableCell>
                                <TableCell>Submitted At</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {approvals.map((approval) => (
                                <TableRow key={approval.approval_id}>
                                    <TableCell>{approval.child_name}</TableCell>
                                    <TableCell>{approval.parent_name}</TableCell>
                                    <TableCell>{approval.mobile_number}</TableCell>
                                    <TableCell>₹{approval.original_fee_per_month}</TableCell>
                                    <TableCell>₹{approval.final_fee_per_month}</TableCell>
                                    <TableCell>{approval.discount_percentage}%</TableCell>
                                    <TableCell>
                                        {approval.annual_fee_waive_off ? (
                                            <Chip label="Yes" color="success" size="small" />
                                        ) : (
                                            <Chip label="No" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell>₹{approval.student_kit_amount || 0}</TableCell>
                                    <TableCell>{approval.submitted_by_name}</TableCell>
                                    <TableCell>
                                        {new Date(approval.submitted_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                startIcon={<CheckCircleIcon />}
                                                onClick={() => handleOpenActionDialog(approval, 'approve')}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                startIcon={<CancelIcon />}
                                                onClick={() => handleOpenActionDialog(approval, 'reject')}
                                            >
                                                Reject
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Action Confirmation Dialog */}
            <Dialog open={actionDialogOpen} onClose={handleCloseActionDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {actionType === 'approve' ? 'Approve Admission' : 'Reject Admission'}
                </DialogTitle>
                <DialogContent>
                    {selectedApproval && (
                        <Box sx={{ mt: 2 }}>
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Admission Details
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Child Name
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedApproval.child_name}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Parent Name
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedApproval.parent_name}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Original Fee/Month
                                            </Typography>
                                            <Typography variant="body1">
                                                ₹{selectedApproval.original_fee_per_month}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Final Fee/Month
                                            </Typography>
                                            <Typography variant="body1" color="primary">
                                                ₹{selectedApproval.final_fee_per_month}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Discount
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedApproval.discount_percentage}%
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Annual Fee Waive Off
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedApproval.annual_fee_waive_off ? 'Yes' : 'No'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label={actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                                placeholder={
                                    actionType === 'approve'
                                        ? 'Add any notes for this approval...'
                                        : 'Please provide a reason for rejection...'
                                }
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseActionDialog}>Cancel</Button>
                    <Button
                        onClick={handleConfirmAction}
                        variant="contained"
                        color={actionType === 'approve' ? 'success' : 'error'}
                    >
                        {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default AdmissionApprovalDashboard;
