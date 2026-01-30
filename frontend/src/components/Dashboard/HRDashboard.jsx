import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import UserManagement from '../Admin/UserManagement';
import ComplianceManagement from '../Admin/ComplianceManagement';
import ComplianceRules from '../HRPortal/ComplianceRules';
import LearningManagement from '../Admin/LearningManagement';
import api from '../../services/api';
import { format } from 'date-fns';

const KPICard = ({ title, value, icon: Icon, subtitle, color = 'primary' }) => (
  <Card elevation={1} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
        {Icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: `${color}.main`,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        )}
      </Box>
      <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
        {value}
      </Typography>
      {subtitle != null && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const HRDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [commandData, setCommandData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/dashboard');
        setCommandData(res.data);
      } catch (err) {
        console.error('Failed to load HR dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const rec = commandData?.recommendations || {};
  const pendingLeaves = commandData?.pending_leaves || [];
  const aiInsights = Array.isArray(rec.ai_insights) ? rec.ai_insights : [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          HR Command Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Organization-wide overview and pending actions
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Grid item xs={6} sm={4} md={2.4} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Total employees"
                value={rec.total_employees ?? 0}
                icon={PeopleIcon}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Pending leave approvals"
                value={rec.pending_leaves_count ?? pendingLeaves.length}
                icon={EventBusyIcon}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Compliance due"
                value={rec.compliance_due ?? 0}
                subtitle={rec.compliance_overdue > 0 ? `${rec.compliance_overdue} overdue` : null}
                icon={AssignmentIcon}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Learning completion"
                value={`${rec.learning_completion_pct ?? 0}%`}
                icon={SchoolIcon}
                color="success"
              />
            </Grid>
          </Grid>

          {(pendingLeaves.length > 0 || aiInsights.length > 0) && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {pendingLeaves.length > 0 && (
                <Grid item xs={12} md={aiInsights.length > 0 ? 8 : 12}>
                  <Paper elevation={1} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Pending leave approvals (org-wide)
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>To</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingLeaves.slice(0, 5).map((leave) => (
                            <TableRow key={leave.id} hover>
                              <TableCell>{leave.employee_name || '—'}</TableCell>
                              <TableCell>{leave.department}</TableCell>
                              <TableCell>{format(new Date(leave.from_date), 'MMM d, yyyy')}</TableCell>
                              <TableCell>{format(new Date(leave.to_date), 'MMM d, yyyy')}</TableCell>
                              <TableCell>{leave.reason}</TableCell>
                              <TableCell>
                                <Chip label={leave.status} color="warning" size="small" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Showing up to 5. Approve or reject from Manager dashboard by department.
                    </Typography>
                  </Paper>
                </Grid>
              )}
              {aiInsights.length > 0 && (
                <Grid item xs={12} md={pendingLeaves.length > 0 ? 4 : 12}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'primary.dark',
                      borderRadius: 2,
                      height: '100%',
                      bgcolor: 'primary.main',
                      color: 'white',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LightbulbIcon /> AI insights
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                      {aiInsights.map((msg, i) => (
                        <Typography key={i} component="li" variant="body2" sx={{ mb: 0.5, opacity: 0.95 }}>
                          {msg}
                        </Typography>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ minHeight: 48 }}>
          <Tab label="User Management" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Compliance Policies" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Compliance & Rules" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Learning Content" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      <Box sx={{ mt: 3 }}>
        {tabValue === 0 && <UserManagement />}
        {tabValue === 1 && <ComplianceManagement />}
        {tabValue === 2 && <ComplianceRules />}
        {tabValue === 3 && <LearningManagement />}
      </Box>
    </Container>
  );
};

export default HRDashboard;
