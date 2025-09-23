import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Button,
    CardActions,
    Chip
} from '@mui/material';
import {
    School,
    Assignment,
    Today,
    Group,
    Description,
    CheckCircle,
    Schedule,
    Class
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsOverview } from '../services/api';

const TeacherDashboard = ({ user, ...props }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const analyticsData = await getAnalyticsOverview();
                setAnalytics(analyticsData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setError(error.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading dashboard...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading dashboard: {error}
            </Alert>
        );
    }

    // Mock data for teacher-specific information (in real app, this would come from API)
    const myClassrooms = [
        { id: 1, name: 'Nursery A', studentCount: 12, schedule: 'Monday-Friday 9:00-12:00' },
        { id: 2, name: 'Pre-K B', studentCount: 15, schedule: 'Monday-Friday 1:00-4:00' }
    ];

    const todaysSchedule = [
        { time: '9:00 AM', activity: 'Morning Circle Time', classroom: 'Nursery A' },
        { time: '10:30 AM', activity: 'Art & Craft', classroom: 'Nursery A' },
        { time: '1:00 PM', activity: 'Story Time', classroom: 'Pre-K B' },
        { time: '2:30 PM', activity: 'Outdoor Play', classroom: 'Pre-K B' }
    ];

    const quickActions = [
        {
            title: 'Take Attendance',
            description: 'Mark attendance for your classes',
            icon: <CheckCircle />,
            action: () => navigate('/attendance'),
            color: 'success'
        },
        {
            title: 'View My Classes',
            description: 'See students assigned to your classrooms',
            icon: <Group />,
            action: () => navigate('/classrooms'),
            color: 'primary'
        },
        {
            title: 'Lesson Plans',
            description: 'Create and manage lesson plans',
            icon: <Assignment />,
            action: () => navigate('/lesson-plans'),
            color: 'secondary'
        },
        {
            title: 'Student Records',
            description: 'View and update student information',
            icon: <Description />,
            action: () => navigate('/documents'),
            color: 'info'
        }
    ];

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <School sx={{ mr: 2, fontSize: 40 }} />
                Teacher Dashboard
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Welcome back, {user?.fullName || 'Teacher'}!
            </Typography>

            {/* My Classrooms */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                My Classrooms
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {myClassrooms.map((classroom) => (
                    <Grid item xs={12} md={6} key={classroom.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6">
                                        {classroom.name}
                                    </Typography>
                                    <Chip 
                                        label={`${classroom.studentCount} students`} 
                                        color="primary" 
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {classroom.schedule}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small" onClick={() => navigate('/attendance')}>
                                    Take Attendance
                                </Button>
                                <Button size="small" onClick={() => navigate('/classrooms')}>
                                    View Details
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Today's Schedule */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Today's Schedule
            </Typography>
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <List>
                        {todaysSchedule.map((item, index) => (
                            <React.Fragment key={index}>
                                <ListItem>
                                    <ListItemIcon>
                                        <Schedule color="primary" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="body1">{item.activity}</Typography>
                                                <Chip label={item.classroom} size="small" variant="outlined" />
                                            </Box>
                                        }
                                        secondary={item.time}
                                    />
                                </ListItem>
                                {index < todaysSchedule.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Quick Actions
            </Typography>
            <Grid container spacing={3}>
                {quickActions.map((action, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ mb: 2 }}>
                                    {React.cloneElement(action.icon, { 
                                        sx: { fontSize: 48 }, 
                                        color: action.color 
                                    })}
                                </Box>
                                <Typography variant="h6" gutterBottom>
                                    {action.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {action.description}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'center' }}>
                                <Button 
                                    variant="outlined" 
                                    color={action.color}
                                    onClick={action.action}
                                >
                                    Open
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Today's Tasks */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Today's Reminders
            </Typography>
            <Card>
                <CardContent>
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <Today color="warning" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Morning Attendance"
                                secondary="Don't forget to mark attendance for all your classes"
                            />
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemIcon>
                                <Assignment color="info" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Lesson Plan Review"
                                secondary="Review tomorrow's lesson plans and prepare materials"
                            />
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemIcon>
                                <Class color="success" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Parent Communication"
                                secondary="Check for any parent messages or updates needed"
                            />
                        </ListItem>
                    </List>
                </CardContent>
            </Card>
        </Box>
    );
};

export default TeacherDashboard;
