import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';
import { format } from 'date-fns';
import { COMPLIANCE_CATEGORIES } from '../../utils/complianceRules';

const CATEGORY_OPTIONS = [
  { value: 'hr', label: 'HR Compliance' },
  { value: 'ai', label: 'Responsible AI Policy' },
  { value: 'it', label: 'IT Security Policy' },
  { value: 'finance', label: 'Financial Conduct Policy' },
];

const ComplianceRules = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryRules, setCategoryRules] = useState({ hr: [], ai: [], it: [], finance: [] });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [addRuleCategory, setAddRuleCategory] = useState('');
  const [addRuleText, setAddRuleText] = useState('');
  const [addRuleError, setAddRuleError] = useState('');
  const [addRuleSubmitting, setAddRuleSubmitting] = useState(false);

  const loadPolicies = async () => {
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

  const loadCategoryRules = async () => {
    try {
      const res = await api.get('/admin/compliance-category-rules');
      setCategoryRules(res.data || { hr: [], ai: [], it: [], finance: [] });
    } catch (err) {
      console.error('Failed to load category rules:', err);
      setCategoryRules({ hr: [], ai: [], it: [], finance: [] });
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  useEffect(() => {
    loadCategoryRules();
  }, []);

  const handleAddRuleOpen = () => {
    setAddRuleCategory('');
    setAddRuleText('');
    setAddRuleError('');
    setAddRuleOpen(true);
  };

  const handleAddRuleClose = () => {
    setAddRuleOpen(false);
    setAddRuleError('');
  };

  const handleAddRuleSubmit = async () => {
    if (!addRuleCategory || !addRuleText?.trim()) {
      setAddRuleError('Select a category and enter the rule text.');
      return;
    }
    setAddRuleSubmitting(true);
    setAddRuleError('');
    try {
      await api.post('/admin/compliance-category-rules', {
        category: addRuleCategory,
        rule_text: addRuleText.trim(),
      });
      loadCategoryRules();
      handleAddRuleClose();
    } catch (err) {
      setAddRuleError(err.response?.data?.detail || 'Failed to add rule');
    } finally {
      setAddRuleSubmitting(false);
    }
  };

  const handleDeleteCategoryRule = async (ruleId) => {
    if (!window.confirm('Remove this rule from the category?')) return;
    try {
      await api.delete(`/admin/compliance-category-rules/${ruleId}`);
      loadCategoryRules();
    } catch (err) {
      console.error('Failed to delete category rule:', err);
      alert(err.response?.data?.detail || 'Failed to delete rule');
    }
  };

  const displayedCategories =
    categoryFilter === 'all'
      ? COMPLIANCE_CATEGORIES
      : COMPLIANCE_CATEGORIES.filter((c) => c.id === categoryFilter);

  const departments = [...new Set((policies || []).map((p) => p.department).filter(Boolean))].sort();
  const filteredPolicies =
    departmentFilter === 'all'
      ? policies
      : policies.filter((p) => p.department === departmentFilter);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        Company compliance and policy rules. All employees must acknowledge and follow these policies.
      </Typography>

      {/* Due-date policies first */}
      <Paper elevation={1} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Due-date policies (assigned tasks)
        </Typography>
        {departments.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, mb: 2, flexWrap: 'wrap' }}>
            <FilterListIcon sx={{ color: 'action.active' }} />
            <FormControl size="small" sx={{ minWidth: 200 }} variant="outlined">
              <InputLabel id="compliance-dept-label">Filter by department</InputLabel>
              <Select
                labelId="compliance-dept-label"
                value={departmentFilter}
                label="Filter by department"
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <MenuItem value="all">All departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
        {loading ? (
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
        ) : filteredPolicies.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {policies.length === 0
              ? 'No compliance policies with due dates.'
              : 'No policies match the selected department.'}
          </Typography>
        ) : (
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPolicies.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.title}</TableCell>
                    <TableCell>{p.department}</TableCell>
                    <TableCell>{p.due_date ? format(new Date(p.due_date), 'MMM d, yyyy') : '—'}</TableCell>
                    <TableCell>{p.description || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Policy rules by category second */}
      <Paper elevation={1} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Policy rules by category
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, mb: 2, flexWrap: 'wrap' }}>
          <FilterListIcon sx={{ color: 'action.active' }} />
          <FormControl size="small" sx={{ minWidth: 220 }} variant="outlined">
            <InputLabel id="compliance-category-label">Filter by category</InputLabel>
            <Select
              labelId="compliance-category-label"
              value={categoryFilter}
              label="Filter by category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All categories</MenuItem>
              {COMPLIANCE_CATEGORIES.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddRuleOpen} size="small">
            Add rule to category
          </Button>
        </Box>
        <Box sx={{ mt: 2 }}>
          {displayedCategories.map((cat) => {
            const Icon = cat.icon;
            const apiRules = categoryRules[cat.id] || [];
            const displayRules = [
              ...cat.rules.map((text) => ({ text, id: null })),
              ...apiRules.map((r) => ({ text: r.rule_text, id: r.id })),
            ];
            const totalCount = displayRules.length;
            return (
              <Accordion
                key={cat.id}
                variant="outlined"
                sx={{ '&:before': { display: 'none' }, mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {Icon && (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1,
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon sx={{ fontSize: 20 }} />
                      </Box>
                    )}
                    <Typography variant="subtitle1" fontWeight={600}>
                      {cat.title} ({totalCount} Rules)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="ol" sx={{ m: 0, pl: 2.5, '& li': { py: 0.5, display: 'flex', alignItems: 'flex-start', gap: 1 } }}>
                    {displayRules.map((item, i) => (
                      <Box key={item.id || `base-${i}`} component="li" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {item.text}
                        </Typography>
                        {item.id != null && (
                          <Tooltip title="Remove this rule">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label="Remove rule"
                              onClick={() => handleDeleteCategoryRule(item.id)}
                              sx={{ mt: -0.5, ml: 0.5 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
        Policy rules by category
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <FilterListIcon sx={{ color: 'action.active' }} />
        <FormControl size="small" sx={{ minWidth: 240 }} variant="outlined">
          <InputLabel id="compliance-category-filter-label">Filter by category</InputLabel>
          <Select
            labelId="compliance-category-filter-label"
            id="compliance-category-filter"
            value={categoryFilter}
            label="Filter by category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
          <MenuItem value="all">All categories</MenuItem>
          {COMPLIANCE_CATEGORIES.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.title} ({cat.ruleCount} rules)
            </MenuItem>
          ))}
          </Select>
        </FormControl>
      </Box>
      {displayedCategories.length === 0 ? (
        <Typography color="text.secondary">No category selected.</Typography>
      ) : (
        displayedCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Paper
              key={cat.id}
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 2,
                transition: 'box-shadow 0.2s ease',
                '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(230, 81, 0, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon sx={{ fontSize: 24, color: 'primary.main', opacity: 0.9 }} />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  {cat.title} ({cat.ruleCount} Rules)
                </Typography>
              </Box>
              <Box component="ol" sx={{ m: 0, pl: 2.5, '& li': { py: 0.5 } }}>
                {cat.rules.map((rule, idx) => (
                  <Typography key={idx} component="li" variant="body2" sx={{ mb: 0.5 }}>
                    {rule}
                  </Typography>
                ))}
              </Box>
            </Paper>
          );
        })
      )}
      <Dialog open={addRuleOpen} onClose={handleAddRuleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add rule to category</DialogTitle>
        <DialogContent>
          {addRuleError && <Alert severity="error" sx={{ mb: 2 }}>{addRuleError}</Alert>}
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="add-rule-category-label">Category</InputLabel>
            <Select
              labelId="add-rule-category-label"
              value={addRuleCategory}
              label="Category"
              onChange={(e) => setAddRuleCategory(e.target.value)}
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
            value={addRuleText}
            onChange={(e) => setAddRuleText(e.target.value)}
            placeholder="e.g. All leave requests must be submitted through the ESS portal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddRuleClose}>Cancel</Button>
          <Button
            onClick={handleAddRuleSubmit}
            variant="contained"
            disabled={!addRuleCategory || !addRuleText?.trim() || addRuleSubmitting}
          >
            {addRuleSubmitting ? 'Adding...' : 'Add to category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceRules;
