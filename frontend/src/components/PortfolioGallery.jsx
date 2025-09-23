import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardMedia, CardContent, CircularProgress } from '@mui/material';

// Parent: Mobile-friendly digital portfolio gallery
export default function PortfolioGallery({ childId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/digital-portfolio/child/${childId}`)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, [childId]);

  if (loading) return <CircularProgress />;

  return (
    <Box p={1}>
      <Typography variant="h6" align="center">Digital Portfolio</Typography>
      <Grid container spacing={2}>
        {items.map(item => (
          <Grid item xs={6} sm={4} md={3} key={item.id}>
            <Card sx={{ borderRadius: 2 }}>
              <CardMedia
                component="img"
                image={item.file_url}
                alt={item.file_name}
                sx={{ height: 120, objectFit: 'cover' }}
              />
              <CardContent sx={{ p: 1 }}>
                <Typography variant="body2" noWrap>{item.description || item.file_name}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(item.uploaded_at).toLocaleDateString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
