import React, { useState, useEffect } from 'react';
import {
    Paper, Typography, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Button, Chip, Box, TextField, FormControl, 
    InputLabel, Select, MenuItem, TablePagination, CircularProgress,
    IconButton, Tooltip, Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { getInvoices, downloadInvoicePDF } from '../services/api';

const InvoiceList = ({ refreshTrigger = 0 }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        child_name: ''
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        items_per_page: 10
    });
    const [downloadingInvoices, setDownloadingInvoices] = useState(new Set());

    // Fetch invoices function
    const fetchInvoices = async (page = 1, filterParams = filters) => {
        setLoading(true);
        setError('');
        
        try {
            const queryParams = {
                page,
                limit: pagination.items_per_page,
                ...filterParams
            };

            // Remove empty filter values
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] === '') {
                    delete queryParams[key];
                }
            });

            const response = await getInvoices(queryParams);
            setInvoices(response.invoices);
            setPagination(response.pagination);
        } catch (err) {
            setError('Failed to fetch invoices');
            console.error('Error fetching invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial load and refresh trigger
    useEffect(() => {
        fetchInvoices(1);
    }, [refreshTrigger]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        fetchInvoices(1, newFilters);
    };

    // Handle page change
    const handlePageChange = (event, newPage) => {
        fetchInvoices(newPage + 1);
    };

    // Handle rows per page change
    const handleRowsPerPageChange = (event) => {
        const newItemsPerPage = parseInt(event.target.value, 10);
        setPagination(prev => ({ ...prev, items_per_page: newItemsPerPage }));
        fetchInvoices(1);
    };

    // Handle PDF download
    const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
        setDownloadingInvoices(prev => new Set(prev).add(invoiceId));
        
        try {
            await downloadInvoicePDF(invoiceId, invoiceNumber);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            // You could add a snackbar notification here
        } finally {
            setDownloadingInvoices(prev => {
                const newSet = new Set(prev);
                newSet.delete(invoiceId);
                return newSet;
            });
        }
    };

    // Get status chip color and variant
    const getStatusChip = (status) => {
        const statusProps = {
            'Paid': { color: 'success', variant: 'filled' },
            'Pending': { color: 'warning', variant: 'filled' },
            'Overdue': { color: 'error', variant: 'filled' },
            'Cancelled': { color: 'default', variant: 'outlined' }
        };
        
        return statusProps[status] || { color: 'default', variant: 'outlined' };
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    Invoice List
                </Typography>
                <Tooltip title="Refresh">
                    <IconButton onClick={() => fetchInvoices(pagination.current_page)} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                    name="child_name"
                    label="Search by Child Name"
                    value={filters.child_name}
                    onChange={handleFilterChange}
                    size="small"
                    sx={{ minWidth: 200 }}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                    }}
                />
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        name="status"
                        value={filters.status}
                        label="Status"
                        onChange={handleFilterChange}
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Paid">Paid</MenuItem>
                        <MenuItem value="Overdue">Overdue</MenuItem>
                        <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Invoice Table */}
            {!loading && (
                <>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Invoice #</strong></TableCell>
                                    <TableCell><strong>Child Name</strong></TableCell>
                                    <TableCell><strong>Student ID</strong></TableCell>
                                    <TableCell><strong>Issue Date</strong></TableCell>
                                    <TableCell><strong>Due Date</strong></TableCell>
                                    <TableCell><strong>Total Due</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                No invoices found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map((invoice) => (
                                        <TableRow key={invoice.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {invoice.invoice_number}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {invoice.child_first_name} {invoice.child_last_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Class: {invoice.classroom_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="primary">
                                                    {invoice.student_id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(invoice.issue_date)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(invoice.due_date)}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {formatCurrency(invoice.total_amount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={invoice.status}
                                                    size="small"
                                                    {...getStatusChip(invoice.status)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="Download PDF">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                                                        disabled={downloadingInvoices.has(invoice.id)}
                                                        color="primary"
                                                    >
                                                        {downloadingInvoices.has(invoice.id) ? (
                                                            <CircularProgress size={20} />
                                                        ) : (
                                                            <DownloadIcon />
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    <TablePagination
                        component="div"
                        count={pagination.total_items}
                        page={pagination.current_page - 1}
                        onPageChange={handlePageChange}
                        rowsPerPage={pagination.items_per_page}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        showFirstButton
                        showLastButton
                    />
                </>
            )}
        </Paper>
    );
};

export default InvoiceList;