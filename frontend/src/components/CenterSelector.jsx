import React, { useState, useEffect } from 'react';
import { 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    Box, 
    Typography,
    CircularProgress 
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import { getCenters } from '../services/api';

const CenterSelector = ({ selectedCenter, onCenterChange, userRole }) => {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCenters = async () => {
            try {
                setLoading(true);
                const data = await getCenters();
                setCenters(data);
                
                // Auto-select first center for superadmin if none selected
                if (userRole === 'superadmin' && !selectedCenter && data.length > 0) {
                    onCenterChange(data[0].id);
                }
            } catch (err) {
                setError('Failed to fetch centers');
                console.error('Error fetching centers:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCenters();
    }, [userRole, selectedCenter, onCenterChange]);

    // Don't render for non-superadmin users
    if (userRole !== 'superadmin') {
        return null;
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                    Loading centers...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Typography variant="body2" color="error">
                {error}
            </Typography>
        );
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 250 }}>
            <BusinessIcon color="primary" />
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="center-select-label">Select Center</InputLabel>
                <Select
                    labelId="center-select-label"
                    value={selectedCenter || ''}
                    label="Select Center"
                    onChange={(e) => onCenterChange(e.target.value)}
                    sx={{ backgroundColor: 'background.paper' }}
                >
                    {centers.map((center) => (
                        <MenuItem key={center.id} value={center.id}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" fontWeight="medium">
                                    {center.center_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {center.total_students} students • {center.total_classrooms} classrooms
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default CenterSelector;