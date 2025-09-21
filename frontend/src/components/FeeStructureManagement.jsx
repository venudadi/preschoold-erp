import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper,
    Typography,
    Table,
    CircularProgress,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    IconButton,
    Chip
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useApi } from '../services/api';

const FeeStructureManagement = () => {
    const [feeStructures, setFeeStructures] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [loading, setLoading] = useState(true);
    const api = useApi();

    const [formData, setFormData] = useState({
        program_name: '',
        service_hours: 0,
        monthly_fee: 0,
        registration_fee: 10000,
        security_deposit: 10000,
        material_fee: 0,
        quarterly_discount_percent: 0,
        annual_discount_percent: 0,
        age_group: '',
        academic_year: '',
        components: []
    });

    const loadFeeStructures = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/fee-structures');
            setFeeStructures(response.data);
        } catch (error) {
            console.error('Error loading fee structures:', error);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        loadFeeStructures();
    }, [loadFeeStructures]);

    const handleOpen = (structure = null) => {
        if (structure) {
            setFormData(structure);
        } else {
            setFormData({
                program_name: '',
                service_hours: 0,
                monthly_fee: 0,
                registration_fee: 10000,
                security_deposit: 10000,
                material_fee: 0,
                quarterly_discount_percent: 0,
                annual_discount_percent: 0,
                age_group: '',
                academic_year: '',
                components: []
            });
        }
        setSelectedStructure(structure);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedStructure(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddComponent = () => {
        setFormData(prev => ({
            ...prev,
            components: [
                ...prev.components,
                {
                    name: '',
                    amount: 0,
                    component_type: 'one_time',
                    is_refundable: false,
                    is_optional: false
                }
            ]
        }));
    };

    const handleRemoveComponent = (index) => {
        setFormData(prev => ({
            ...prev,
            components: prev.components.filter((_, i) => i !== index)
        }));
    };

    const handleComponentChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            components: prev.components.map((comp, i) => 
                i === index ? { ...comp, [field]: value } : comp
            )
        }));
    };

    const handleSubmit = async () => {
        try {
            if (selectedStructure) {
                await api.put(`/fee-structures/${selectedStructure.id}`, formData);
            } else {
                await api.post('/fee-structures', formData);
            }
            loadFeeStructures();
            handleClose();
        } catch (error) {
            console.error('Error saving fee structure:', error);
        }
    };

    return (
        <div>
            {loading && <CircularProgress />}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Fee Structure Management</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Add Fee Structure
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Program Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Age Group</TableCell>
                            <TableCell>Monthly Fee</TableCell>
                            <TableCell>Service Hours</TableCell>
                            <TableCell>Academic Year</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {feeStructures.map((structure) => (
                            <TableRow key={structure.id}>
                                <TableCell>{structure.program_name}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={structure.program_type} 
                                        color={structure.program_type === 'daycare' ? 'secondary' : 'primary'}
                                    />
                                </TableCell>
                                <TableCell>{structure.age_group}</TableCell>
                                <TableCell>₹{structure.monthly_fee}</TableCell>
                                <TableCell>{structure.service_hours}</TableCell>
                                <TableCell>{structure.academic_year}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleOpen(structure)}>
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedStructure ? 'Edit Fee Structure' : 'New Fee Structure'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Program Name"
                                name="program_name"
                                value={formData.program_name}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Age Group"
                                name="age_group"
                                value={formData.age_group}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Academic Year"
                                name="academic_year"
                                value={formData.academic_year}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Service Hours"
                                name="service_hours"
                                value={formData.service_hours}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Monthly Fee"
                                name="monthly_fee"
                                value={formData.monthly_fee}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Material Fee"
                                name="material_fee"
                                value={formData.material_fee}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Quarterly Discount (%)"
                                name="quarterly_discount_percent"
                                value={formData.quarterly_discount_percent}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Annual Discount (%)"
                                name="annual_discount_percent"
                                value={formData.annual_discount_percent}
                                onChange={handleInputChange}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                        Additional Components
                        <IconButton color="primary" onClick={handleAddComponent}>
                            <AddIcon />
                        </IconButton>
                    </Typography>

                    {formData.components.map((component, index) => (
                        <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Component Name"
                                    value={component.name}
                                    onChange={(e) => handleComponentChange(index, 'name', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Amount"
                                    value={component.amount}
                                    onChange={(e) => handleComponentChange(index, 'amount', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={component.component_type}
                                        label="Type"
                                        onChange={(e) => handleComponentChange(index, 'component_type', e.target.value)}
                                    >
                                        <MenuItem value="one_time">One Time</MenuItem>
                                        <MenuItem value="recurring">Recurring</MenuItem>
                                        <MenuItem value="annual">Annual</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <IconButton color="error" onClick={() => handleRemoveComponent(index)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {selectedStructure ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default FeeStructureManagement;