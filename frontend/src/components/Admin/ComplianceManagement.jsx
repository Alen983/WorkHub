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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';
import { format } from 'date-fns';

const DEPARTMENT_OPTIONS = [
  { value: 'All', label: 'All (company-wide)' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'HR', label: 'HR' },
  { value: 'Sales', label: 'Sales' },
];

const ComplianceManagement = () => {
  const [open, setOpen] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    due_date: '',
    description: ''
  });
  const [error, setError] = useState('');

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/compliance');
      setPolicies(res.data || []);
    } catch (err) {
      console.error('Failed to load compliance policies:', err);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setFormData({
      title: '',
      department: '',
      due_date: '',
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
    try {
      await api.post('/admin/compliance', formData);
      handleClose();
      loadPolicies();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create policy');
    }
  };

  const handleDelete = async (policyId, title) => {
    if (!window.confirm(`Delete policy "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/compliance/${policyId}`);
      loadPolicies();
    } catch (err) {
      console.error('Failed to delete policy:', err);
      alert(err.response?.data?.detail || 'Failed to delete policy');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Compliance Policy Management</Typography>
        <Button variant="contained" onClick={handleOpen}>
          Add Policy
        </Button>
      </Box>

      {loading ? (
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      ) : policies.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No compliance policies yet. Click &quot;Add Policy&quot; to create one.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {policies.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.title}</TableCell>
                  <TableCell>{p.department}</TableCell>
                  <TableCell>{p.due_date ? format(new Date(p.due_date), 'MMM d, yyyy') : '—'}</TableCell>
                  <TableCell>{p.description || '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete policy">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Delete policy"
                        onClick={() => handleDelete(p.id, p.title)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Compliance Policy</DialogTitle>
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
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="compliance-department-label">Department</InputLabel>
            <Select
              labelId="compliance-department-label"
              id="compliance-department"
              value={formData.department}
              label="Department"
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              {DEPARTMENT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Due Date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
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

export default ComplianceManagement;
