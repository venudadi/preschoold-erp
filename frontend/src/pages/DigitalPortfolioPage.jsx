import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import PortfolioUploader from '../components/PortfolioUploader';
import PortfolioGallery from '../components/PortfolioGallery';

// Digital Portfolio Page: Tab for teachers (upload), gallery for parents
export default function DigitalPortfolioPage() {
  // Simulate role and childId (replace with real auth/child context)
  const [role] = useState(localStorage.getItem('role') || 'parent');
  const [childId] = useState(localStorage.getItem('childId') || '');
  const [tab, setTab] = useState(0);

  return (
    <Box p={2}>
      {role === 'teacher' ? (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Upload" />
            <Tab label="Gallery" />
          </Tabs>
          {tab === 0 && <PortfolioUploader childId={childId} />}
          {tab === 1 && <PortfolioGallery childId={childId} />}
        </>
      ) : (
        <PortfolioGallery childId={childId} />
      )}
    </Box>
  );
}
