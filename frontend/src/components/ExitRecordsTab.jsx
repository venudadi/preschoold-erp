import React, { useState, useEffect, useCallback } from 'react';
import {
    Paper,
    Table,
    TableBody,
    CircularProgress,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Tab,
    Tabs,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { useApi } from '../services/api';

const ExitRecordsTab = () => {
    const [selectedTab, setSelectedTab] = useState('all');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        startDate: null,
        endDate: null
    });

    const api = useApi();

    const loadRecords = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            
            if (filters.type) params.append('type', filters.type);
            if (filters.startDate) params.append('startDate', format(filters.startDate, 'yyyy-MM-dd'));
            if (filters.endDate) params.append('endDate', format(filters.endDate, 'yyyy-MM-dd'));

            const response = await api.get(`/exits?${params.toString()}`);
            setRecords(response.data);
        } catch (error) {
            console.error('Error loading exit records:', error);
        } finally {
            setLoading(false);
        }
    }, [api, filters]);

    useEffect(() => {
        loadRecords();
    }, [filters, loadRecords]);

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
        setFilters(prev => ({
            ...prev,
            type: newValue === 'all' ? '' : newValue
        }));
    };

    return (
        <div>
            <Typography variant="h5" gutterBottom>
                Exit Records
            </Typography>
            {loading && <CircularProgress />}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={selectedTab} onChange={handleTabChange}>
                    <Tab label="All Records" value="all" />
                    <Tab label="Students" value="student" />
                    <Tab label="Teachers" value="teacher_staff" />
                    <Tab label="Other Staff" value="other_staff" />
                </Tabs>
            </Box>

            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Start Date"
                        value={filters.startDate}
                        onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                    />
                    <DatePicker
                        label="End Date"
                        value={filters.endDate}
                        onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                    />
                </LocalizationProvider>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Exit Date</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell>Center</TableCell>
                            <TableCell>Recorded By</TableCell>
                            <TableCell>Recorded At</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {records.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>{record.person_name}</TableCell>
                                <TableCell>
                                    {record.person_type === 'student' ? 'Student' : 
                                     (record.job_title?.toLowerCase().includes('teacher') ? 'Teacher' : 'Staff')}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(record.exit_date), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell>{record.exit_reason}</TableCell>
                                <TableCell>{record.center_name}</TableCell>
                                <TableCell>{record.recorded_by_name}</TableCell>
                                <TableCell>
                                    {format(new Date(record.recorded_at), 'dd/MM/yyyy HH:mm')}
                                </TableCell>
                            </TableRow>
                        ))}
                        {records.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No exit records found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default ExitRecordsTab;