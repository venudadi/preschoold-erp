import React, { useState, useMemo } from 'react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { 
    Box, 
    List, 
    ListItem, 
    ListItemButton, 
    ListItemIcon, 
    ListItemText, 
    Typography, 
    Button,
    Drawer,
    AppBar,
    Toolbar,
    IconButton,
    useMediaQuery,
    useTheme,
    Chip,
    Avatar
} from '@mui/material';
import '../modern-theme.css';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { getFilteredNavigation, ROLE_INFO } from '../config/permissions';

// Icon mapping for navigation items
const ICON_MAP = {
    HomeIcon: <HomeIcon />,
    PeopleIcon: <PeopleIcon />,
    ClassIcon: <ClassIcon />,
    HowToRegIcon: <HowToRegIcon />,
    QuestionAnswerIcon: <QuestionAnswerIcon />,
    MonetizationOnIcon: <MonetizationOnIcon />,
    AssessmentIcon: <AssessmentIcon />,
    FolderIcon: <FolderIcon />,
    SettingsIcon: <SettingsIcon />
};

const DashboardLayout = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    let user = {};
    try {
        const raw = localStorage.getItem('user');
        user = raw ? JSON.parse(raw) : {};
    } catch (e) {
        user = {};
    }

    // Apply parent theme class to body if user is a parent
    React.useEffect(() => {
        if (user?.role === 'parent') {
            document.body.classList.add('parent-theme');
        } else {
            document.body.classList.remove('parent-theme');
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove('parent-theme');
        };
    }, [user?.role]);

    // Get filtered navigation items based on user role
    const allowedNavItems = useMemo(() => {
        if (!user?.role) return [];
        return getFilteredNavigation(user.role);
    }, [user?.role]);

    // Get role info for display
    const roleInfo = user?.role ? ROLE_INFO[user.role] : null;

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('csrfToken');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const drawerWidth = 240;

    const drawerContent = (
        <Box className="glass-card" sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', boxShadow: '0 0 32px 4px #00c6ff22' }}>
            {/* Header with close button for mobile */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 2
            }}>
                <Typography variant="h6" className="gradient-text" style={{ fontWeight: 700, fontSize: 22, letterSpacing: 1 }}>
                    Preschool ERP
                </Typography>
                {isMobile && (
                    <IconButton onClick={handleDrawerToggle}>
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </Box>
            <List sx={{ flexGrow: 1 }}>
                {allowedNavItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton 
                            component={RouterLink} 
                            to={item.path}
                            onClick={isMobile ? handleDrawerToggle : undefined}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                                    color: '#fff',
                                    boxShadow: '0 0 16px 2px #00c6ff55'
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                                {ICON_MAP[item.icon]}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 48, height: 48, boxShadow: '0 0 16px 2px var(--color-primary), 0 0 32px 4px var(--color-accent)' }}>
                    {user?.fullName ? user.fullName[0] : '?'}
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {user?.fullName}
                    </Typography>
                    {roleInfo && (
                        <Chip 
                            label={roleInfo.displayName}
                            size="small"
                            sx={{ 
                                backgroundColor: roleInfo.color,
                                color: 'white',
                                fontSize: '0.75rem',
                                height: 20,
                                mb: 1
                            }}
                        />
                    )}
                    <Typography variant="body2" color="var(--color-muted)">
                        {user?.centerName || user?.center_name || 'Preschool ERP'}
                    </Typography>
                </Box>
            </Box>
            <Button className="gradient-btn" fullWidth onClick={handleLogout} sx={{ mt: 3 }}>
                Logout
            </Button>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            {/* App Bar for Mobile */}
            {isMobile && (
                <AppBar
                    position="fixed"
                    sx={{
                        zIndex: theme.zIndex.drawer + 1,
                        backgroundColor: 'background.paper',
                        color: 'text.primary',
                        boxShadow: 1
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div">
                            Preschool ERP
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}

            {/* Navigation Drawer */}
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            bgcolor: 'background.paper',
                            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
                
                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            bgcolor: 'background.paper',
                            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    p: { xs: 2, md: 3 }, 
                    mt: { xs: 8, md: 0 }, // Add top margin for mobile app bar
                    minHeight: '100vh', 
                    overflow: 'auto', 
                    bgcolor: 'transparent',
                    width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
                    position: 'relative',
                }}
            >
                {/* Animated background blob */}
                <div className="animated-bg" />
                <Outlet />
            </Box>
        </Box>
    );
};

export default DashboardLayout;

