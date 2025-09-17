import React, { memo } from 'react'; // <-- ADD 'memo' TO THE IMPORT
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
    Box, TextField, Select, MenuItem, FormControl, InputLabel, Grid, CircularProgress
} from '@mui/material';

// --- NEW MEMOIZED COMPONENTS ---
// These components will only re-render if their props (like value or onChange) change.
const MemoizedTextField = memo(({ value, onChange, name, label }) => {
    return (
        <TextField
            fullWidth
            label={label}
            name={name}
            value={value}
            onChange={onChange}
        />
    );
});

const MemoizedSelect = memo(({ value, onChange, name, label, children }) => {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select
                name={name}
                value={value}
                label={label}
                onChange={onChange}
            >
                {children}
            </Select>
        </FormControl>
    );
});


const EnquiryList = ({ enquiries, onRowClick, filters, onFilterChange, isLoading }) => {
    return (
        <Paper elevation={3} sx={{ mt: 4 }}>
             <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Existing Enquiries</Typography>
            </Box>

            <Grid container spacing={2} sx={{ p: 2 }}>
                <Grid item xs={12} sm={7}>
                    {/* --- UPDATED: Using the new MemoizedTextField --- */}
                    <MemoizedTextField
                        label="Search by Child Name"
                        name="search"
                        value={filters.search}
                        onChange={onFilterChange}
                    />
                </Grid>
                <Grid item xs={12} sm={5}>
                    {/* --- UPDATED: Using the new MemoizedSelect --- */}
                    <MemoizedSelect
                        label="Filter by Status"
                        name="status"
                        value={filters.status}
                        onChange={onFilterChange}
                    >
                        <MenuItem value=""><em>All Statuses</em></MenuItem>
                        <MenuItem value="Open">Open</MenuItem>
                        <MenuItem value="Follow-up">Follow-up</MenuItem>
                        <MenuItem value="Closed">Closed</MenuItem>
                        <MenuItem value="Lost">Lost</MenuItem>
                    </MemoizedSelect>
                </Grid>
            </Grid>

            <TableContainer>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Enquiry Date</TableCell>
                                <TableCell>Child Name</TableCell>
                                <TableCell>Parent Name</TableCell>
                                <TableCell>Mobile</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {enquiries.map((row) => (
                                <TableRow 
                                    key={row.id} 
                                    onClick={() => onRowClick(row)}
                                    sx={{ '&:hover': { cursor: 'pointer', backgroundColor: 'action.hover' } }}
                                >
                                    <TableCell>{new Date(row.enquiry_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{row.child_name}</TableCell>
                                    <TableCell>{row.parent_name}</TableCell>
                                    <TableCell>{row.mobile_number}</TableCell>
                                    <TableCell>{row.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>
        </Paper>
    );
};

export default EnquiryList;