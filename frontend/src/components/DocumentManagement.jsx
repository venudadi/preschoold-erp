import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    Delete as DeleteIcon,
    // Edit as EditIcon, // Removing unused import
    Download as DownloadIcon,
    Upload as UploadIcon
} from '@mui/icons-material';
import { uploadDocument, getDocuments, deleteDocument } from '../services/api';

const DocumentManagement = () => {
    const [documents, setDocuments] = useState([]);
    const [openUpload, setOpenUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [title, setTitle] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const data = await getDocuments();
            setDocuments(data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const handleFileSelect = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile || !documentType || !title) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category_id', documentType); // Using documentType as category for now

        // Get center_id from localStorage user data
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.center_id) {
                    formData.append('center_id', user.center_id);
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }

        try {
            await uploadDocument(formData);
            await fetchDocuments();
            setOpenUpload(false);
            setSelectedFile(null);
            setTitle('');
            setDocumentType('');
            setDescription('');
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Error uploading document: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (documentId) => {
        try {
            await deleteDocument(documentId);
            await fetchDocuments();
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Document Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setOpenUpload(true)}
                >
                    Upload Document
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Uploaded By</TableCell>
                            <TableCell>Upload Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell>{doc.name}</TableCell>
                                <TableCell>{doc.type}</TableCell>
                                <TableCell>{doc.description}</TableCell>
                                <TableCell>{doc.uploadedBy}</TableCell>
                                <TableCell>
                                    {new Date(doc.uploadDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => window.open(doc.url, '_blank')}
                                    >
                                        <DownloadIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(doc.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <input
                            accept="*/*"
                            style={{ display: 'none' }}
                            id="upload-file"
                            type="file"
                            onChange={handleFileSelect}
                        />
                        <label htmlFor="upload-file">
                            <Button
                                variant="outlined"
                                component="span"
                                fullWidth
                            >
                                {selectedFile ? selectedFile.name : 'Choose File'}
                            </Button>
                        </label>
                    </Box>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Document Title"
                        placeholder="Enter a descriptive title for this document"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Document Type</InputLabel>
                        <Select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            label="Document Type"
                            required
                        >
                            <MenuItem value="policy">Policy Document</MenuItem>
                            <MenuItem value="contract">Contract</MenuItem>
                            <MenuItem value="report">Report</MenuItem>
                            <MenuItem value="form">Form</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        margin="normal"
                        label="Description (Optional)"
                        placeholder="Add any additional details about this document"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUpload(false)}>Cancel</Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || !documentType || !title || loading}
                        variant="contained"
                    >
                        {loading ? 'Uploading...' : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DocumentManagement;