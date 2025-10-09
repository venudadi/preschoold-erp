import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Stack
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon
} from '@mui/icons-material';

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Show too many errors warning
      if (this.state.errorCount > 5) {
        return (
          <Container maxWidth="md" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom color="error">
                  Critical Error
                </Typography>
                <Alert severity="error" sx={{ mb: 3 }}>
                  The application has encountered multiple errors. Please refresh the page or contact support.
                </Alert>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = '/login';
                    }}
                  >
                    Logout & Clear Data
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Container>
        );
      }

      // Show error details
      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom color="error">
                Oops! Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We're sorry for the inconvenience. The application encountered an unexpected error.
              </Typography>
            </Box>

            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Error Details:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                {this.state.error?.toString()}
              </Typography>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
              >
                Go to Home
              </Button>
            </Stack>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                If this problem persists, please contact your system administrator.
              </Typography>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
