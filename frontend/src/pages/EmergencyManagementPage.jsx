import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    IconButton,
    Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const EmergencyManagementPage = () => {
    const [tabValue, setTabValue] = useState(0);
    const [procedures, setProcedures] = useState([]);
    const [drills, setDrills] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [openProcedureModal, setOpenProcedureModal] = useState(false);
    const [openDrillModal, setOpenDrillModal] = useState(false);
    
    // Form States
    const [procedureForm, setProcedureForm] = useState({
        title: '',
        description: '',
        category: 'fire',
        steps: ['']
    });

    const [drillForm, setDrillForm] = useState({
        drill_type: 'fire',
        drill_date: new Date().toISOString().split('T')[0],
        duration_minutes: '',
        participants_count: '',
        success_rating: 5,
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, [tabValue]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            if (tabValue === 0) {
                const res = await axios.get(`${API_URL}/emergency/procedures`, { headers });
                setProcedures(res.data);
            } else {
                const res = await axios.get(`${API_URL}/emergency/drills`, { headers });
                setDrills(res.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProcedure = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/emergency/procedures`, procedureForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOpenProcedureModal(false);
            fetchData();
        } catch (error) {
            console.error('Error creating procedure:', error);
        }
    };

    const handleLogDrill = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/emergency/drills`, drillForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOpenDrillModal(false);
            fetchData();
        } catch (error) {
            console.error('Error logging drill:', error);
        }
    };

    const handleDeleteProcedure = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/emergency/procedures/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error('Error deleting procedure:', error);
        }
    };

    // Render Procedure Form Step
    const handleStepChange = (index, value) => {
        const newSteps = [...procedureForm.steps];
        newSteps[index] = value;
        setProcedureForm({ ...procedureForm, steps: newSteps });
    };

    const addStep = () => {
        setProcedureForm({ ...procedureForm, steps: [...procedureForm.steps, ''] });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 'bold' }}>
                    Emergency Management
                </Typography>
                <Button 
                    variant="contained" 
                    className="gradient-btn"
                    startIcon={<AddIcon />}
                    onClick={() => tabValue === 0 ? setOpenProcedureModal(true) : setOpenDrillModal(true)}
                >
                    {tabValue === 0 ? 'New Procedure' : 'Log Drill'}
                </Button>
            </Box>

            <Paper className="glass-card">
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                    <Tab label="Procedures & Protocols" />
                    <Tab label="Drill Logs" />
                </Tabs>

                {tabValue === 0 && (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Steps</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {procedures.map((proc) => (
                                    <TableRow key={proc.id}>
                                        <TableCell>
                                            <Typography variant="subtitle1" fontWeight="bold">{proc.title}</Typography>
                                            <Typography variant="body2" color="textSecondary">{proc.description}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={proc.category.toUpperCase()} 
                                                color={proc.category === 'fire' ? 'error' : 'primary'} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {proc.steps && JSON.parse(proc.steps).length} steps defined
                                        </TableCell>
                                        <TableCell>
                                            <IconButton color="error" onClick={() => handleDeleteProcedure(proc.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {procedures.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">No procedures found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {tabValue === 1 && (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Rating</TableCell>
                                    <TableCell>Conducted By</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {drills.map((drill) => (
                                    <TableRow key={drill.id}>
                                        <TableCell>{new Date(drill.drill_date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Chip label={drill.drill_type.toUpperCase()} variant="outlined" />
                                        </TableCell>
                                        <TableCell>{drill.duration_minutes} mins</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {drill.success_rating}/5
                                                {drill.success_rating >= 4 ? <CheckCircleIcon color="success" fontSize="small"/> : <WarningIcon color="warning" fontSize="small"/>}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{drill.conducted_by_name || 'Unknown'}</TableCell>
                                    </TableRow>
                                ))}
                                {drills.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">No drills logged yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Create Procedure Modal */}
            <Dialog open={openProcedureModal} onClose={() => setOpenProcedureModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create Emergency Procedure</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField 
                            label="Title" 
                            fullWidth 
                            value={procedureForm.title} 
                            onChange={(e) => setProcedureForm({...procedureForm, title: e.target.value})} 
                        />
                        <TextField 
                            label="Description" 
                            fullWidth 
                            multiline 
                            rows={2} 
                            value={procedureForm.description} 
                            onChange={(e) => setProcedureForm({...procedureForm, description: e.target.value})} 
                        />
                        <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select 
                                value={procedureForm.category}
                                label="Category"
                                onChange={(e) => setProcedureForm({...procedureForm, category: e.target.value})}
                            >
                                <MenuItem value="fire">Fire</MenuItem>
                                <MenuItem value="medical">Medical</MenuItem>
                                <MenuItem value="weather">Weather</MenuItem>
                                <MenuItem value="lockdown">Lockdown</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </Select>
                        </FormControl>

                        <Typography variant="h6">Steps</Typography>
                        {procedureForm.steps.map((step, index) => (
                            <TextField
                                key={index}
                                label={`Step ${index + 1}`}
                                fullWidth
                                value={step}
                                onChange={(e) => handleStepChange(index, e.target.value)}
                            />
                        ))}
                        <Button startIcon={<AddIcon />} onClick={addStep}>Add Step</Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenProcedureModal(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateProcedure}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* Log Drill Modal */}
            <Dialog open={openDrillModal} onClose={() => setOpenDrillModal(false)}>
                <DialogTitle>Log Emergency Drill</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Drill Type</InputLabel>
                            <Select 
                                value={drillForm.drill_type}
                                label="Drill Type"
                                onChange={(e) => setDrillForm({...drillForm, drill_type: e.target.value})}
                            >
                                <MenuItem value="fire">Fire</MenuItem>
                                <MenuItem value="lockdown">Lockdown</MenuItem>
                                <MenuItem value="earthquake">Earthquake</MenuItem>
                                <MenuItem value="tornado">Tornado</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField 
                            label="Date" 
                            type="date" 
                            fullWidth 
                            InputLabelProps={{ shrink: true }}
                            value={drillForm.drill_date} 
                            onChange={(e) => setDrillForm({...drillForm, drill_date: e.target.value})} 
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField 
                                    label="Duration (min)" 
                                    type="number" 
                                    fullWidth 
                                    value={drillForm.duration_minutes} 
                                    onChange={(e) => setDrillForm({...drillForm, duration_minutes: e.target.value})} 
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField 
                                    label="Participants" 
                                    type="number" 
                                    fullWidth 
                                    value={drillForm.participants_count} 
                                    onChange={(e) => setDrillForm({...drillForm, participants_count: e.target.value})} 
                                />
                            </Grid>
                        </Grid>
                        <FormControl fullWidth>
                            <InputLabel>Success Rating (1-5)</InputLabel>
                            <Select 
                                value={drillForm.success_rating}
                                label="Success Rating (1-5)"
                                onChange={(e) => setDrillForm({...drillForm, success_rating: e.target.value})}
                            >
                                <MenuItem value={1}>1 - Poor</MenuItem>
                                <MenuItem value={2}>2 - Fair</MenuItem>
                                <MenuItem value={3}>3 - Good</MenuItem>
                                <MenuItem value={4}>4 - Very Good</MenuItem>
                                <MenuItem value={5}>5 - Excellent</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField 
                            label="Notes / Observations" 
                            fullWidth 
                            multiline 
                            rows={3}
                            value={drillForm.notes} 
                            onChange={(e) => setDrillForm({...drillForm, notes: e.target.value})} 
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDrillModal(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleLogDrill}>Log Drill</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmergencyManagementPage;
