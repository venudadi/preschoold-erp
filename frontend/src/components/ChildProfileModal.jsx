import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
    Divider,
    Chip,
    CircularProgress,
    Alert,
    Paper,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import {
    Close as CloseIcon,
    Person as PersonIcon,
    Cake as CakeIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Payments as PaymentsIcon,
    Business as BusinessIcon,
    Warning as WarningIcon,
    LocalHospital as MedicalIcon
} from '@mui/icons-material';
import { getChildProfile } from '../services/api';
import dayjs from 'dayjs';

const ChildProfileModal = ({ open, onClose, childId }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && childId) {
            fetchProfile();
        }
    }, [open, childId]);

    const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getChildProfile(childId);
            setProfile(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch child profile.');
        } finally {
            setLoading(false);
        }
    };

    const formatAge = (age) => {
        if (!age) return 'N/A';
        if (age.years === 0) return `${age.months} months`;
        return `${age.years} year${age.years !== 1 ? 's' : ''} ${age.months} month${age.months !== 1 ? 's' : ''}`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return dayjs(date).format('DD MMM YYYY');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'paused': return 'warning';
            case 'left': return 'error';
            default: return 'default';
        }
    };

    const InfoRow = ({ label, value, icon }) => (
        <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon}
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                    {label}
                </Typography>
            </Grid>
            <Grid item xs={8}>
                <Typography variant="body1">{value || 'N/A'}</Typography>
            </Grid>
        </Grid>
    );

    const SectionTitle = ({ children }) => (
        <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
            {children}
        </Typography>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { maxHeight: '90vh' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h5" fontWeight="bold">
                    Child Profile
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {profile && (
                    <Box>
                        {/* Basic Information */}
                        <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="h4" gutterBottom>
                                        {profile.child.full_name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip
                                            label={profile.child.status || 'active'}
                                            color={getStatusColor(profile.child.status)}
                                            size="small"
                                        />
                                        {profile.child.student_id && (
                                            <Chip
                                                label={`ID: ${profile.child.student_id}`}
                                                variant="outlined"
                                                size="small"
                                            />
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Child Details */}
                        <SectionTitle>Personal Information</SectionTitle>
                        <InfoRow
                            label="Age"
                            value={formatAge(profile.child.age)}
                            icon={<CakeIcon fontSize="small" color="action" />}
                        />
                        <InfoRow
                            label="Date of Birth"
                            value={formatDate(profile.child.date_of_birth)}
                            icon={<CakeIcon fontSize="small" color="action" />}
                        />
                        <InfoRow
                            label="Gender"
                            value={profile.child.gender}
                            icon={<PersonIcon fontSize="small" color="action" />}
                        />
                        <InfoRow
                            label="Enrollment Date"
                            value={formatDate(profile.child.enrollment_date)}
                            icon={<PersonIcon fontSize="small" color="action" />}
                        />

                        {/* Classroom & Center */}
                        <SectionTitle>Placement</SectionTitle>
                        <InfoRow label="Classroom" value={profile.classroom?.name} icon={<PersonIcon fontSize="small" color="action" />} />
                        <InfoRow label="Center" value={profile.center?.name} icon={<BusinessIcon fontSize="small" color="action" />} />

                        {/* Parents/Guardians */}
                        <SectionTitle>Parents/Guardians</SectionTitle>
                        {profile.parents && profile.parents.length > 0 ? (
                            <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                                {profile.parents.map((parent, index) => (
                                    <React.Fragment key={parent.id}>
                                        <ListItem>
                                            <ListItemIcon>
                                                <PersonIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                        <Typography variant="body1" fontWeight="bold">
                                                            {parent.full_name}
                                                        </Typography>
                                                        <Chip
                                                            label={parent.relationship || 'Guardian'}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        {parent.is_primary && (
                                                            <Chip
                                                                label="Primary"
                                                                size="small"
                                                                color="primary"
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 1 }}>
                                                        {parent.phone && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                                <PhoneIcon fontSize="small" />
                                                                <Typography variant="body2">{parent.phone}</Typography>
                                                            </Box>
                                                        )}
                                                        {parent.email && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <EmailIcon fontSize="small" />
                                                                <Typography variant="body2">{parent.email}</Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        {index < profile.parents.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Alert severity="warning" icon={<WarningIcon />}>
                                No parents/guardians registered for this child
                            </Alert>
                        )}

                        {/* Company Tie-up */}
                        {profile.company && (
                            <>
                                <SectionTitle>Company Tie-up</SectionTitle>
                                <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.lighter' }}>
                                    <Typography variant="body1" fontWeight="bold">
                                        {profile.company.name}
                                    </Typography>
                                    {profile.company.discount_percentage && (
                                        <Typography variant="body2" color="text.secondary">
                                            Discount: {profile.company.discount_percentage}%
                                        </Typography>
                                    )}
                                </Paper>
                            </>
                        )}

                        {/* Emergency Contact */}
                        <SectionTitle>Emergency Contact</SectionTitle>
                        <InfoRow
                            label="Contact Name"
                            value={profile.emergency?.contact_name}
                            icon={<PersonIcon fontSize="small" color="action" />}
                        />
                        <InfoRow
                            label="Contact Phone"
                            value={profile.emergency?.contact_phone}
                            icon={<PhoneIcon fontSize="small" color="action" />}
                        />

                        {/* Medical Information */}
                        {(profile.child.allergies || profile.child.medical_info) && (
                            <>
                                <SectionTitle>Medical Information</SectionTitle>
                                {profile.child.allergies && (
                                    <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                                        <Typography variant="body2" fontWeight="bold">Allergies:</Typography>
                                        <Typography variant="body2">{profile.child.allergies}</Typography>
                                    </Alert>
                                )}
                                {profile.child.medical_info && (
                                    <InfoRow
                                        label="Medical Info"
                                        value={profile.child.medical_info}
                                        icon={<MedicalIcon fontSize="small" color="action" />}
                                    />
                                )}
                            </>
                        )}

                        {/* Billing Summary */}
                        <SectionTitle>Billing Summary</SectionTitle>
                        <Paper elevation={1} sx={{ p: 2, bgcolor: profile.billing?.outstanding_balance > 0 ? 'warning.lighter' : 'success.lighter' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Outstanding Balance</Typography>
                                    <Typography variant="h6" fontWeight="bold" color={profile.billing?.outstanding_balance > 0 ? 'warning.dark' : 'text.primary'}>
                                        {formatCurrency(profile.billing?.outstanding_balance)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {formatCurrency(profile.billing?.total_paid)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Payment Status</Typography>
                                    <Chip
                                        label={profile.billing?.payment_status || 'N/A'}
                                        color={
                                            profile.billing?.payment_status === 'Paid' ? 'success' :
                                            profile.billing?.payment_status === 'Overdue' ? 'error' : 'warning'
                                        }
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Last Payment</Typography>
                                    <Typography variant="body2">{formatDate(profile.billing?.last_payment_date)}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Pause Information */}
                        {profile.child.pause_info && profile.child.status === 'paused' && (
                            <>
                                <SectionTitle>Pause Information</SectionTitle>
                                <Alert severity="info">
                                    <Typography variant="body2" fontWeight="bold">Start Date:</Typography>
                                    <Typography variant="body2">{formatDate(profile.child.pause_info.start_date)}</Typography>
                                    <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>End Date:</Typography>
                                    <Typography variant="body2">{formatDate(profile.child.pause_info.end_date)}</Typography>
                                    {profile.child.pause_info.reason && (
                                        <>
                                            <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>Reason:</Typography>
                                            <Typography variant="body2">{profile.child.pause_info.reason}</Typography>
                                        </>
                                    )}
                                </Alert>
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    Close
                </Button>
                {profile && (
                    <Button variant="contained" color="primary">
                        Edit Profile
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ChildProfileModal;
