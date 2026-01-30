import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
} from '@mui/material';
import api from '../../services/api';

const LearningManagement = () => {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    tags: '',
    level: 'Beginner',
    description: ''
  });
  const [error, setError] = useState('');

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await api.get('/learning/catalog');
      setCatalog(res.data || []);
    } catch (err) {
      console.error('Failed to load learning catalog:', err);
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setFormData({
      title: '',
      tags: '',
      level: 'Beginner',
      description: ''
    });
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);

    try {
      await api.post('/admin/learning', {
        ...formData,
        tags: tagsArray
      });
      handleClose();
      loadCatalog();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create content');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Learning Content Management</Typography>
        <Button variant="contained" onClick={handleOpen}>
          Add Content
        </Button>
      </Box>

      {loading ? (
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      ) : catalog.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No learning content yet. Click &quot;Add Content&quot; to create a course or training.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Level</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tags</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {catalog.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <Chip label={item.level} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {Array.isArray(item.tags) && item.tags.length > 0
                      ? item.tags.map((t) => <Chip key={t} label={t} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)
                      : '—'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>{item.description || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Learning Content</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            margin="normal"
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Tags (comma-separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="React, JavaScript, Frontend"
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Level"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            required
          >
            <MenuItem value="Beginner">Beginner</MenuItem>
            <MenuItem value="Intermediate">Intermediate</MenuItem>
            <MenuItem value="Advanced">Advanced</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LearningManagement;
