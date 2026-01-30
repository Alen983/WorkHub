import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FolderIcon from '@mui/icons-material/Folder';
import api from '../../services/api';
import { format } from 'date-fns';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LockIcon from '@mui/icons-material/Lock';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const COMPLIANCE_CATEGORIES = [
  {
    id: 'hr',
    title: 'HR Compliance',
    ruleCount: 12,
    icon: FolderIcon,
    rules: [
      'Employees must follow company working hours and attendance guidelines',
      'Biometric/ESS attendance manipulation is strictly prohibited',
      'All leave requests must be submitted through the ESS portal',
      'Discrimination based on gender, caste, religion, race, or background is prohibited',
      'Workplace harassment of any form is a zero-tolerance offense',
      'Employee personal data must be kept confidential',
      'Official documents must not be shared externally without HR approval',
      'Code of conduct must be followed in office and remote work',
      'Performance reviews should be fair and data-driven',
      'Any conflict of interest must be disclosed',
      'Resignation notice period policy must be respected',
      'Company assets must be returned on exit',
    ],
  },
  {
    id: 'ai',
    title: 'Responsible AI Policy',
    ruleCount: 12,
    icon: SmartToyIcon,
    rules: [
      'AI systems must not be used to discriminate or bias decisions',
      'Employee data used for AI must be anonymized where possible',
      'No sensitive data allowed in public AI tools (ChatGPT, etc.)',
      'AI outputs must be reviewed by humans before decisions',
      'Training data must follow data privacy regulations',
      'AI models must be explainable where required',
      'Unauthorized AI tools are not permitted',
      'Regular audits of AI systems are mandatory',
      'AI must comply with company ethics guidelines',
      'Employees must be trained on AI responsible usage',
      'Data used in AI must have documented consent',
      'Security controls must protect AI pipelines',
    ],
  },
  {
    id: 'it',
    title: 'IT Security Policy',
    ruleCount: 13,
    icon: LockIcon,
    rules: [
      'Strong passwords with periodic changes are mandatory',
      'Two-factor authentication must be enabled',
      'Company systems must not be used for illegal activities',
      'Software installations require IT approval',
      'USB and external drives are restricted',
      'Company email is for official use only',
      'Confidential data must be encrypted',
      'Devices must be locked when unattended',
      'Phishing awareness training is mandatory',
      'VPN must be used for remote access',
      'System vulnerabilities must be reported immediately',
      'Data backups are performed regularly',
      'Unauthorized access attempts will lead to disciplinary action',
    ],
  },
  {
    id: 'finance',
    title: 'Financial Conduct Policy',
    ruleCount: 12,
    icon: AccountBalanceIcon,
    rules: [
      'Expense claims must have valid receipts',
      'False expense claims lead to disciplinary action',
      'Approval hierarchy must be followed',
      'Company funds must be used only for business purposes',
      'Budget limits must be respected',
      'Payroll data is confidential',
      'Any financial conflict of interest must be disclosed',
      'Vendor payments require authorized approval',
      'Fraud or misuse must be reported immediately',
      'Tax compliance must be followed strictly',
      'Financial records must be accurately maintained',
      'Audits must be fully supported',
    ],
  },
];

const ComplianceRules = () => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dueDatePolicies, setDueDatePolicies] = useState([]);
  const [dueDateLoading, setDueDateLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setDueDateLoading(true);
      try {
        const res = await api.get('/admin/compliance');
        setDueDatePolicies(res.data || []);
      } catch (err) {
        console.error('Failed to load due-date policies:', err);
        setDueDatePolicies([]);
      } finally {
        setDueDateLoading(false);
      }
    };
    load();
  }, []);

  const displayedCategories =
    categoryFilter === 'all'
      ? COMPLIANCE_CATEGORIES
      : COMPLIANCE_CATEGORIES.filter((c) => c.id === categoryFilter);

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Company compliance and policy rules. All employees must acknowledge and follow these policies.
      </Typography>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
        Due-date policies (assigned tasks)
      </Typography>
      {dueDateLoading ? (
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 3 }} />
      ) : dueDatePolicies.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No due-date policies assigned. Create them in the &quot;Compliance Policies&quot; tab.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dueDatePolicies.map((p) => (
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
    </Box>
  );
};

export default ComplianceRules;
