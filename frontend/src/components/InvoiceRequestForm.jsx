import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, CircularProgress, Alert
} from '@mui/material';
import { getChildren, createInvoiceRequest } from '../services/api';

const InvoiceRequestForm = ({ open, onClose, onSuccess }) => {
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState('');
    const [form, setForm] = useState({ amount: '', dueDate: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


    useEffect(() => {
        if (open) {
            getChildren().then(setChildren).catch(() => setError('Failed to load students'));
        }
    }, [open]);

    // Auto-populate fields when a child is selected
    useEffect(() => {
        if (!selectedChild) return;
        const child = children.find(c => c.id === selectedChild);
        if (child) {
            setForm(form => ({
                ...form,
                amount: child.monthly_fee || '',
                description: child.program_name ? `Monthly Fee - ${child.program_name}` : ''
            }));
        }
    }, [selectedChild, children]);

    const handleChildChange = (e) => {
        setSelectedChild(e.target.value);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await createInvoiceRequest({
                child_id: selectedChild,
                ...form
            });
            setSuccess('Invoice request submitted for approval.');
            if (onSuccess) onSuccess();
            setTimeout(() => { setSuccess(''); onClose(); }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Request Invoice for Student</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
                <TextField
                    select
                    label="Select Student"
                    value={selectedChild}
                    onChange={handleChildChange}
                    fullWidth
                    margin="normal"
                >
                    {children.map(child => (
                        <MenuItem key={child.id} value={child.id}>
                            {child.first_name} {child.last_name} ({child.student_id})
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    label="Amount"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    type="number"
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Due Date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    type="date"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="Description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading || !selectedChild || !form.amount || !form.dueDate}>
                    {loading ? <CircularProgress size={20} /> : 'Submit Request'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InvoiceRequestForm;
