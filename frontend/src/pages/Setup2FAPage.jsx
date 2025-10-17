/**
 * Two-Factor Authentication Setup Page
 * Wizard for setting up 2FA with QR code and backup codes
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid
} from '@mui/material';
import {
    Security as SecurityIcon,
    QrCode as QrCodeIcon,
    Key as KeyIcon,
    Check as CheckIcon,
    ContentCopy as CopyIcon,
    Download as DownloadIcon,
    Warning as WarningIcon,
    ArrowBack as BackIcon
} from '@mui/icons-material';
import twoFactorAPI from '../services/twoFactorApi';

const Setup2FAPage = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Setup data
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);

    // Verification
    const [verificationCode, setVerificationCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [codeError, setCodeError] = useState('');

    // Dialog states
    const [showBackupDialog, setShowBackupDialog] = useState(false);
    const [backupCodesSaved, setBackupCodesSaved] = useState(false);

    const steps = ['Scan QR Code', 'Verify Setup', 'Save Backup Codes'];

    // Load 2FA setup on mount
    useEffect(() => {
        loadSetupData();
    }, []);

    const loadSetupData = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await twoFactorAPI.setup2FA();

            if (result.success) {
                setQrCode(result.data.qrCode);
                setSecret(result.data.secret);
                setBackupCodes(result.data.backupCodes);
                setLoading(false);
            } else {
                setError(result.error);
                setLoading(false);
            }
        } catch (err) {
            console.error('Setup 2FA error:', err);
            setError('Failed to load 2FA setup. Please try again.');
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setCodeError('');
        setError('');

        // Validate code
        const validation = twoFactorAPI.validateTOTPToken(verificationCode);
        if (!validation.valid) {
            setCodeError(validation.error);
            return;
        }

        setVerifying(true);

        try {
            const result = await twoFactorAPI.verifyAndEnable2FA(verificationCode);

            if (result.success) {
                setSuccess('2FA verified successfully!');
                setActiveStep(2);
                setShowBackupDialog(true);
            } else {
                setCodeError(result.error);
            }
        } catch (err) {
            console.error('Verify 2FA error:', err);
            setCodeError('Verification failed. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secret);
        setSuccess('Secret key copied to clipboard!');
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleCopyBackupCode = (code) => {
        navigator.clipboard.writeText(code);
        setSuccess(`Backup code ${code} copied!`);
        setTimeout(() => setSuccess(''), 2000);
    };

    const handleDownloadBackupCodes = () => {
        const content = `Preschool ERP - 2FA Backup Codes
Generated: ${new Date().toLocaleString()}

⚠️ IMPORTANT: Keep these codes in a safe place!
Each code can only be used once.

Backup Codes:
${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use these codes to log in.
`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `2FA-Backup-Codes-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setBackupCodesSaved(true);
        setSuccess('Backup codes downloaded successfully!');
    };

    const handleFinishSetup = () => {
        if (!backupCodesSaved) {
            setError('Please download your backup codes before continuing!');
            return;
        }
        navigate('/settings');
    };

    const handleBack = () => {
        navigate('/settings');
    };

    if (loading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom>
                            Set Up Two-Factor Authentication
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Add an extra layer of security to your account
                        </Typography>
                    </Box>

                    {/* Stepper */}
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Error/Success Messages */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    )}

                    {/* Step Content */}
                    {activeStep === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Step 1: Scan QR Code
                            </Typography>

                            <Alert severity="info" sx={{ mb: 3 }}>
                                Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to scan this QR code.
                            </Alert>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    {/* QR Code */}
                                    <Card>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            {qrCode && (
                                                <img
                                                    src={qrCode}
                                                    alt="2FA QR Code"
                                                    style={{ maxWidth: '100%', height: 'auto' }}
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    {/* Manual Setup */}
                                    <Typography variant="subtitle1" gutterBottom>
                                        Can't scan? Enter this key manually:
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                        <TextField
                                            fullWidth
                                            value={secret}
                                            InputProps={{
                                                readOnly: true,
                                                sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                                            }}
                                            size="small"
                                        />
                                        <Button
                                            variant="outlined"
                                            onClick={handleCopySecret}
                                            startIcon={<CopyIcon />}
                                        >
                                            Copy
                                        </Button>
                                    </Box>

                                    <List dense>
                                        <ListItem>
                                            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                                            <ListItemText primary="Download an authenticator app" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                                            <ListItemText primary="Scan the QR code or enter the key" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                                            <ListItemText primary="You'll see a 6-digit code" />
                                        </ListItem>
                                    </List>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleBack}
                                    startIcon={<BackIcon />}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => setActiveStep(1)}
                                >
                                    Next: Verify Code
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {activeStep === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Step 2: Verify Setup
                            </Typography>

                            <Alert severity="info" sx={{ mb: 3 }}>
                                Enter the 6-digit code from your authenticator app to verify the setup.
                            </Alert>

                            <TextField
                                fullWidth
                                label="6-Digit Verification Code"
                                value={verificationCode}
                                onChange={(e) => {
                                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                                    setCodeError('');
                                }}
                                error={!!codeError}
                                helperText={codeError || 'Enter the code shown in your authenticator app'}
                                disabled={verifying}
                                inputProps={{
                                    maxLength: 6,
                                    style: { fontSize: '2rem', textAlign: 'center', letterSpacing: '0.5rem' }
                                }}
                                sx={{ mb: 3 }}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setActiveStep(0)}
                                    disabled={verifying}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleVerifyCode}
                                    disabled={verificationCode.length !== 6 || verifying}
                                    startIcon={verifying ? <CircularProgress size={20} /> : <CheckIcon />}
                                >
                                    {verifying ? 'Verifying...' : 'Verify & Enable 2FA'}
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {activeStep === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom color="success.main">
                                ✓ 2FA Enabled Successfully!
                            </Typography>

                            <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    <strong>Important: Save Your Backup Codes!</strong>
                                </Typography>
                                <Typography variant="body2">
                                    If you lose access to your authenticator app, you'll need these codes to log in.
                                    Each code can only be used once.
                                </Typography>
                            </Alert>

                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Your Backup Codes:
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {backupCodes.map((code, index) => (
                                            <Grid item xs={12} sm={6} key={index}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 1,
                                                    bgcolor: 'grey.100',
                                                    borderRadius: 1
                                                }}>
                                                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                        {code}
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        onClick={() => handleCopyBackupCode(code)}
                                                    >
                                                        <CopyIcon fontSize="small" />
                                                    </Button>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<DownloadIcon />}
                                        onClick={handleDownloadBackupCodes}
                                        sx={{ mt: 3 }}
                                    >
                                        Download Backup Codes
                                    </Button>
                                </CardContent>
                            </Card>

                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                onClick={handleFinishSetup}
                                disabled={!backupCodesSaved}
                                size="large"
                            >
                                Finish Setup
                            </Button>

                            {!backupCodesSaved && (
                                <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                                    Please download your backup codes before continuing
                                </Typography>
                            )}
                        </Box>
                    )}
                </Paper>
            </Box>

            {/* Backup Codes Dialog */}
            <Dialog
                open={showBackupDialog}
                onClose={() => setShowBackupDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <KeyIcon color="warning" />
                        <span>Save Your Backup Codes</span>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        These codes will only be shown once! Make sure to save them securely.
                    </Alert>
                    <Typography variant="body2" paragraph>
                        Your backup codes allow you to log in if you lose access to your authenticator app.
                        Each code can only be used once.
                    </Typography>
                    <Typography variant="body2">
                        We recommend:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Download and save them in a secure location" />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Print them and store in a safe place" />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Don't share them with anyone" />
                        </ListItem>
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowBackupDialog(false)}>
                        I Understand
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Setup2FAPage;
