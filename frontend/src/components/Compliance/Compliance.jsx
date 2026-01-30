import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import BackToDashboard from '../common/BackToDashboard';
import api from '../../services/api';
import { format } from 'date-fns';
import { COMPLIANCE_CATEGORIES } from '../../utils/complianceRules';

const Compliance = () => {
  const [data, setData] = useState({ compliance_policies: [] });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/recommendations');
        setData(res.data || {});
      } catch (err) {
        console.error('Failed to load compliance:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const policies = data.compliance_policies || [];
  const displayedCategories =
    categoryFilter === 'all'
      ? COMPLIANCE_CATEGORIES
      : COMPLIANCE_CATEGORIES.filter((c) => c.id === categoryFilter);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Typography variant="h5" gutterBottom>
        Compliance & Policies
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your assigned policies and company compliance rules.
      </Typography>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
        Your assigned policies (due dates)
      </Typography>
      {loading ? (
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 3 }} />
      ) : policies.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No compliance policies assigned to you at this time.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {policies.map((policy) => (
            <Paper key={policy.id} elevation={2} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {policy.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Due: {format(new Date(policy.due_date), 'MMM dd, yyyy')}
                {policy.department && ` · ${policy.department}`}
              </Typography>
              {policy.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {policy.description}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
        Policy rules by category
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <FilterListIcon sx={{ color: 'action.active' }} />
        <FormControl size="small" sx={{ minWidth: 240 }} variant="outlined">
          <InputLabel id="compliance-category-label">Filter by category</InputLabel>
          <Select
            labelId="compliance-category-label"
            id="compliance-category"
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
              elevation={1}
              sx={{
                p: 2.5,
                mb: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon sx={{ fontSize: 24 }} />
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
    </Container>
  );
};

export default Compliance;
