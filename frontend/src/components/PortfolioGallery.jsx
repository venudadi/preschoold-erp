import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Fab,
  Zoom,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Fullscreen,
  Close,
  Search,
  FilterList,
  Add,
  Download,
  Share,
  Info
} from '@mui/icons-material';
import PortfolioUploader from './PortfolioUploader';

// Enhanced: Mobile-friendly digital portfolio gallery with filtering and favorites
export default function PortfolioGallery({ childId, userRole = 'parent', onUpload, showAllChildren = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFavorite, setFilterFavorite] = useState('all');
  const [filterChild, setFilterChild] = useState('all'); // New filter for admin
  const [filterTeacher, setFilterTeacher] = useState('all'); // New filter for admin
  const [sortBy, setSortBy] = useState('upload_date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [stats, setStats] = useState({});
  const [children, setChildren] = useState([]); // For admin dropdown
  const [teachers, setTeachers] = useState([]); // For admin dropdown
  const [error, setError] = useState('');
  const itemsPerPage = 12;

  useEffect(() => {
    loadPortfolioItems();
    loadPortfolioStats();

    // Load filter options for admin
    if (showAllChildren && (userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin')) {
      loadFilterOptions();
    }
  }, [childId, currentPage, filterType, filterFavorite, filterChild, filterTeacher, sortBy, sortOrder, showAllChildren]);

  const loadPortfolioItems = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        type: filterType,
        favorite: filterFavorite === 'all' ? '' : filterFavorite,
        sortBy,
        sortOrder
      });

      // Add admin-specific filters
      if (showAllChildren && (userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin')) {
        if (filterChild !== 'all') {
          params.set('childId', filterChild);
        }
        if (filterTeacher !== 'all') {
          params.set('uploadedBy', filterTeacher);
        }
      }

      // Use different endpoint for admin viewing all children vs specific child
      const endpoint = showAllChildren && (userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin')
        ? `/api/digital-portfolio/center/all?${params}`
        : `/api/digital-portfolio/child/${childId}?${params}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load portfolio items');
      }

      const data = await response.json();
      setItems(data.items || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error('Error loading portfolio items:', err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioStats = async () => {
    try {
      // Use different stats endpoint for admin viewing all children
      const endpoint = showAllChildren && (userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin')
        ? `/api/digital-portfolio/center/stats`
        : `/api/digital-portfolio/stats/${childId}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading portfolio stats:', err);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Load children for filter dropdown
      const childrenResponse = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        setChildren(childrenData);
      }

      // Load teachers for filter dropdown
      const teachersResponse = await fetch('/api/admin/users?role=teacher', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData);
      }
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const toggleFavorite = async (itemId, currentFavoriteStatus) => {
    if (userRole !== 'teacher') return;

    try {
      const response = await fetch(`/api/digital-portfolio/${itemId}/favorite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_favorite: !currentFavoriteStatus })
      });

      if (response.ok) {
        setItems(prev => prev.map(item =>
          item.id === itemId
            ? { ...item, is_favorite: !currentFavoriteStatus }
            : item
        ));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const filteredItems = items.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.file_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleUploadComplete = () => {
    setUploaderOpen(false);
    setCurrentPage(1);
    loadPortfolioItems();
    loadPortfolioStats();
    if (onUpload) onUpload();
  };

  if (loading && items.length === 0) {
    return (
      <Box p={2}>
        <Grid container spacing={2}>
          {Array.from(new Array(8)).map((_, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={120} />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box p={1}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          {showAllChildren ? 'Center Digital Portfolios' : 'Digital Portfolio'}
        </Typography>
        {userRole === 'teacher' && !showAllChildren && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setUploaderOpen(true)}
            size="small"
          >
            Add Photos
          </Button>
        )}
      </Box>

      {/* Stats */}
      {(stats.total_items > 0 || stats.overall?.total_items > 0) && (
        <Box mb={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {showAllChildren ? (
              <>
                <Chip
                  label={`${stats.overall?.total_items || 0} Total`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${stats.overall?.favorites || 0} Favorites`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label={`${stats.overall?.children_with_portfolios || 0} Children`}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
                <Chip
                  label={`${stats.overall?.active_teachers || 0} Teachers`}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              </>
            ) : (
              <>
                <Chip
                  label={`${stats.total_items || 0} Total`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${stats.favorites || 0} Favorites`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label={`${stats.images || 0} Images`}
                  size="small"
                  variant="outlined"
                />
              </>
            )}
          </Stack>
        </Box>
      )}

      {/* Search and Filters */}
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={showAllChildren ? 4 : 6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search photos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Admin-specific filters */}
          {showAllChildren && (userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin') && (
            <>
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Child</InputLabel>
                  <Select
                    value={filterChild}
                    onChange={(e) => setFilterChild(e.target.value)}
                    label="Child"
                  >
                    <MenuItem value="all">All Children</MenuItem>
                    {children.map(child => (
                      <MenuItem key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Teacher</InputLabel>
                  <Select
                    value={filterTeacher}
                    onChange={(e) => setFilterTeacher(e.target.value)}
                    label="Teacher"
                  >
                    <MenuItem value="all">All Teachers</MenuItem>
                    {teachers.map(teacher => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          <Grid item xs={6} sm={showAllChildren ? 2 : 3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="image">Images</MenuItem>
                <MenuItem value="video">Videos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={showAllChildren ? 2 : 3}>
            <FormControl fullWidth size="small">
              <InputLabel>Favorites</InputLabel>
              <Select
                value={filterFavorite}
                onChange={(e) => setFilterFavorite(e.target.value)}
                label="Favorites"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="true">Favorites</MenuItem>
                <MenuItem value="false">Not Favorites</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Gallery Grid */}
      <Grid container spacing={2}>
        {filteredItems.map(item => (
          <Grid item xs={6} sm={4} md={3} key={item.id}>
            <Card sx={{ position: 'relative', borderRadius: 2 }}>
              <CardMedia
                component="img"
                image={item.thumbnail_url || item.file_url}
                alt={item.file_name}
                sx={{
                  height: 120,
                  objectFit: 'cover',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedImage(item)}
              />

              {/* Overlay Icons */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  display: 'flex',
                  gap: 0.5
                }}
              >
                {userRole === 'teacher' && (
                  <IconButton
                    size="small"
                    onClick={() => toggleFavorite(item.id, item.is_favorite)}
                    sx={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                  >
                    {item.is_favorite ? (
                      <Favorite fontSize="small" color="error" />
                    ) : (
                      <FavoriteBorder fontSize="small" />
                    )}
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={() => setSelectedImage(item)}
                  sx={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                >
                  <Fullscreen fontSize="small" />
                </IconButton>
              </Box>

              {/* Favorite indicator */}
              {item.is_favorite && (
                <Box sx={{ position: 'absolute', top: 4, left: 4 }}>
                  <Favorite fontSize="small" color="error" />
                </Box>
              )}

              <CardContent sx={{ p: 1 }}>
                <Typography variant="body2" noWrap>
                  {item.title || item.description || item.file_name}
                </Typography>

                {/* Show child name for admin view */}
                {showAllChildren && item.child_name && (
                  <Typography variant="caption" color="primary.main" display="block">
                    {item.child_name} {item.class_name && `(${item.class_name})`}
                  </Typography>
                )}

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.upload_date || item.created_at).toLocaleDateString()}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    {item.capture_method === 'camera' && (
                      <Chip label="Camera" size="small" color="secondary" />
                    )}
                    {showAllChildren && item.uploaded_by_name && (
                      <Chip
                        label={item.uploaded_by_name.split(' ')[0]}
                        size="small"
                        variant="outlined"
                        title={`Uploaded by ${item.uploaded_by_name}`}
                      />
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No photos yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {userRole === 'teacher'
              ? 'Start capturing memories by adding photos'
              : 'Ask your teacher to add photos to the digital portfolio'
            }
          </Typography>
          {userRole === 'teacher' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setUploaderOpen(true)}
            >
              Add First Photo
            </Button>
          )}
        </Box>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={pagination.totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Upload FAB for Teachers */}
      {userRole === 'teacher' && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setUploaderOpen(true)}
        >
          <Add />
        </Fab>
      )}

      {/* Image Detail Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedImage && (
          <>
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ position: 'relative' }}>
                <img
                  src={selectedImage.file_url}
                  alt={selectedImage.file_name}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                />
                <IconButton
                  onClick={() => setSelectedImage(null)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white'
                  }}
                >
                  <Close />
                </IconButton>
              </Box>

              {(selectedImage.title || selectedImage.description) && (
                <Box p={2}>
                  {selectedImage.title && (
                    <Typography variant="h6" gutterBottom>
                      {selectedImage.title}
                    </Typography>
                  )}
                  {selectedImage.description && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedImage.description}
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Uploaded: {new Date(selectedImage.upload_date || selectedImage.created_at).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Portfolio Uploader Modal */}
      <PortfolioUploader
        open={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        childId={childId}
        onUpload={handleUploadComplete}
      />
    </Box>
  );
}