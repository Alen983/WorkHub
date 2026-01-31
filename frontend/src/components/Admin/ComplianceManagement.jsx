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
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderIcon from '@mui/icons-material/Folder';
import api from '../../services/api';
import { format } from 'date-fns';

const DEPARTMENT_OPTIONS = [
  { value: 'All', label: 'All (company-wide)' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'HR', label: 'HR' },
  { value: 'Sales', label: 'Sales' },
];

const CATEGORY_OPTIONS = [
  { value: 'hr', label: 'HR Compliance' },
  { value: 'ai', label: 'Responsible AI Policy' },
  { value: 'it', label: 'IT Security Policy' },
  { value: 'finance', label: 'Financial Conduct Policy' },
];

const ComplianceManagement = () => {
  const [open, setOpen] = useState(false);
  const [policyTypeStep, setPolicyTypeStep] = useState(null); // null | 'due_date' | 'category'
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    due_date: '',
    description: ''
  });
  const [categoryForm, setCategoryForm] = useState({ category: '', rule_text: '' });
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
    setPolicyTypeStep(null);
    setFormData({ title: '', department: '', due_date: '', description: '' });
    setCategoryForm({ category: '', rule_text: '' });
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setPolicyTypeStep(null);
    setError('');
  };

  const handleSubmitDueDate = async () => {
    setError('');
    try {
      await api.post('/admin/compliance', formData);
      handleClose();
      loadPolicies();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create policy');
    }
  };

  const handleSubmitCategory = async () => {
    setError('');
    if (!categoryForm.category || !categoryForm.rule_text?.trim()) {
      setError('Please select a category and enter the rule text.');
      return;
    }
    try {
      await api.post('/admin/compliance-category-rules', {
        category: categoryForm.category,
        rule_text: categoryForm.rule_text.trim(),
      });
      handleClose();
      loadPolicies();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add category rule');
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

  const renderDialogContent = () => {
    if (policyTypeStep === null) {
      return (
        <>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Is this a due-date policy (assigned task) or a category policy (rule under a category)?
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AssignmentIcon />}
              onClick={() => setPolicyTypeStep('due_date')}
              sx={{ justifyContent: 'flex-start', py: 1.5 }}
            >
              Due-date policy (assigned task)
            </Button>
            <Button
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={() => setPolicyTypeStep('category')}
              sx={{ justifyContent: 'flex-start', py: 1.5 }}
            >
              Category policy (rule under HR / AI / IT / Finance)
            </Button>
          </Box>
        </>
      );
    }

    if (policyTypeStep === 'due_date') {
      return (
        <>
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
            InputLabelProps={{ shrink: true }}
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
        </>
      );
    }

    if (policyTypeStep === 'category') {
      return (
        <>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="category-policy-category-label">Category</InputLabel>
            <Select
              labelId="category-policy-category-label"
              value={categoryForm.category}
              label="Category"
              onChange={(e) => setCategoryForm({ ...categoryForm, category: e.target.value })}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Rule text"
            multiline
            rows={3}
            value={categoryForm.rule_text}
            onChange={(e) => setCategoryForm({ ...categoryForm, rule_text: e.target.value })}
            placeholder="e.g. All leave requests must be submitted through the ESS portal"
            required
          />
        </>
      );
    }

    return null;
  };

  const dialogTitle =
    policyTypeStep === null
      ? 'Add Policy'
      : policyTypeStep === 'due_date'
        ? 'Create Due-Date Policy'
        : 'Add Category Rule';

  const showBack = policyTypeStep !== null;
  const showDueDateSubmit = policyTypeStep === 'due_date';
  const showCategorySubmit = policyTypeStep === 'category';

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
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {policyTypeStep === null && error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderDialogContent()}
        </DialogContent>
        <DialogActions>
          {showBack && (
            <Button onClick={() => { setPolicyTypeStep(null); setError(''); }}>
              Back
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleClose}>Cancel</Button>
          {showDueDateSubmit && (
            <Button onClick={handleSubmitDueDate} variant="contained" disabled={!formData.title || !formData.department || !formData.due_date}>
              Create
            </Button>
          )}
          {showCategorySubmit && (
            <Button onClick={handleSubmitCategory} variant="contained" disabled={!categoryForm.category || !categoryForm.rule_text?.trim()}>
              Add to category
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceManagement;
