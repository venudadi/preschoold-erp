
import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardHeader, Avatar, Tabs, Tab, Paper, useMediaQuery, useTheme } from '@mui/material';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ChatIcon from '@mui/icons-material/Chat';
import CampaignIcon from '@mui/icons-material/Campaign';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ChildCareIcon from '@mui/icons-material/ChildCare';

import PortfolioGallery from './PortfolioGallery';
import Messaging from './Messaging';
import ClassroomAnnouncements from './ClassroomAnnouncements';
import InvoiceList from './InvoiceList';
import ObservationLogList from './ObservationLogList';
import ChildList from './ChildList';
import ParentPreferences from './ParentPreferences';
import ParentFeedback from './ParentFeedback';

// Visually stunning, mobile-first parent dashboard
const ParentDashboard = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tab, setTab] = useState(0);
  // Assume parent can have multiple children, select first by default
  const children = JSON.parse(localStorage.getItem('children') || '[]');
  const selectedChild = children[0] || {};

  const handleTabChange = (e, newValue) => setTab(newValue);

  return (
    <Box sx={{ p: isMobile ? 1 : 4, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      <Paper elevation={4} sx={{ borderRadius: 4, mb: 3, p: isMobile ? 2 : 4, background: 'rgba(255,255,255,0.95)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar sx={{ bgcolor: '#1976d2', width: 64, height: 64 }}>
              <FamilyRestroomIcon fontSize="large" />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} color="primary.main">
              Welcome, {user?.name || 'Parent'}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Here’s what’s happening with your child{children.length > 1 ? 'ren' : ''} at school
            </Typography>
          </Grid>
        </Grid>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{ mt: 3, mb: 1 }}
        >
          <Tab icon={<PhotoLibraryIcon />} label="Portfolio" />
          <Tab icon={<EmojiEventsIcon />} label="Progress" />
          <Tab icon={<CampaignIcon />} label="Announcements" />
          <Tab icon={<ChatIcon />} label="Messages" />
          <Tab icon={<ReceiptLongIcon />} label="Billing" />
          <Tab icon={<span role="img" aria-label="preferences">⚙️</span>} label="Preferences" />
          <Tab icon={<span role="img" aria-label="feedback">💬</span>} label="Feedback" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box>
        {tab === 0 && (
          <PortfolioGallery childId={selectedChild.id} />
        )}
        {tab === 1 && (
          <Box>
            <Card elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
              <CardHeader
                avatar={<Avatar sx={{ bgcolor: '#ff9800' }}><ChildCareIcon /></Avatar>}
                title={<Typography variant="h6">Child Progress & Observations</Typography>}
                subheader={selectedChild.name}
              />
              <CardContent>
                <ObservationLogList childId={selectedChild.id} />
              </CardContent>
            </Card>
          </Box>
        )}
        {tab === 2 && (
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: '#00bcd4' }}><CampaignIcon /></Avatar>}
              title={<Typography variant="h6">Classroom Announcements</Typography>}
              subheader={selectedChild.classroom_name}
            />
            <CardContent>
              <ClassroomAnnouncements classroomId={selectedChild.classroom_id} role="parent" />
            </CardContent>
          </Card>
        )}
        {tab === 3 && (
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: '#4caf50' }}><ChatIcon /></Avatar>}
              title={<Typography variant="h6">Messages</Typography>}
              subheader="Parent-Teacher Communication"
            />
            <CardContent>
              <Messaging />
            </CardContent>
          </Card>
        )}
        {tab === 4 && (
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: '#9c27b0' }}><ReceiptLongIcon /></Avatar>}
              title={<Typography variant="h6">Billing & Invoices</Typography>}
              subheader={selectedChild.name}
            />
            <CardContent>
              <InvoiceList />
            </CardContent>
          </Card>
        )}
        {tab === 5 && (
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: '#607d8b' }}>⚙️</Avatar>}
              title={<Typography variant="h6">Preferences</Typography>}
            />
            <CardContent>
              <ParentPreferences />
            </CardContent>
          </Card>
        )}
        {tab === 6 && (
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: '#ffb300' }}>💬</Avatar>}
              title={<Typography variant="h6">Feedback</Typography>}
            />
            <CardContent>
              <ParentFeedback />
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default ParentDashboard;
