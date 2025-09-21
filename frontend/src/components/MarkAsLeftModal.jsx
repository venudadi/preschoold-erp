import React, { useState } from 'react';
import { Dialog, TextField, Button, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const MarkAsLeftModal = ({ open, onClose, onSubmit, title }) => {
    const [exitDate, setExitDate] = useState(null);
    const [exitReason, setExitReason] = useState('');
    const [exitNotes, setExitNotes] = useState('');

    const handleSubmit = () => {
        if (!exitDate || !exitReason.trim()) {
            return;
        }

        onSubmit({
            exitDate,
            exitReason: exitReason.trim(),
            exitNotes: exitNotes.trim()
        });

        // Reset form
        setExitDate(null);
        setExitReason('');
        setExitNotes('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <div style={{ marginTop: '1rem' }}>
                        <DatePicker
                            label="Exit Date"
                            value={exitDate}
                            onChange={(newDate) => setExitDate(newDate)}
                            renderInput={(params) => <TextField {...params} fullWidth required />}
                        />
                    </div>
                </LocalizationProvider>
                
                <TextField
                    label="Exit Reason"
                    multiline
                    rows={3}
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                />

                <TextField
                    label="Additional Notes"
                    multiline
                    rows={3}
                    value={exitNotes}
                    onChange={(e) => setExitNotes(e.target.value)}
                    fullWidth
                    margin="normal"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={!exitDate || !exitReason.trim()}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MarkAsLeftModal;