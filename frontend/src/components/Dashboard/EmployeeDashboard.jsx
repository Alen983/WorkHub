import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Collapse,
  Skeleton,
} from '@mui/material';
import DashboardCard from './DashboardCard';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PolicyIcon from '@mui/icons-material/Policy';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import api from '../../services/api';

const MODULES = [
  { title: 'My Profile', description: 'View and update your profile', to: '/profile', icon: PersonIcon, configKey: 'profile' },
  { title: 'Attendance', description: 'View attendance and timesheets', to: '/attendance', icon: ScheduleIcon, configKey: 'attendance' },
  { title: 'Leave Management', description: 'Apply and track leave requests', to: '/leave', icon: EventIcon, configKey: 'leave' },
  { title: 'Payroll & Compensation', description: 'Payslips and compensation', to: '/payroll', icon: AttachMoneyIcon, configKey: 'payroll' },
  { title: 'Learning & Certifications', description: 'Courses and certifications', to: '/learning', icon: SchoolIcon, configKey: 'learning' },
  { title: 'Career Growth & Development', description: 'Goals and development plans', to: '/career', icon: TrendingUpIcon, configKey: 'career' },
  { title: 'Wellness & Engagement', description: 'Wellness programs and engagement', to: '/wellness', icon: FavoriteIcon, configKey: 'wellness' },
  { title: 'Compliance & Policies', description: 'Policies and compliance tasks', to: '/compliance', icon: PolicyIcon, configKey: 'compliance' },
];

const defaultConfig = {
  show_profile: true,
  show_attendance: true,
  show_leaves: true,
  show_payroll: true,
  show_learning: true,
  show_career: true,
  show_wellness: true,
  show_compliance: true,
  show_complaints: true,
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(defaultConfig);
  const [localConfig, setLocalConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/dashboard');
        const c = res.data?.config || defaultConfig;
        setConfig(c);
        setLocalConfig(c);
      } catch {
        setConfig(defaultConfig);
        setLocalConfig(defaultConfig);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isVisible = (mod) => {
    const key = mod.configKey;
    if (key === 'leave') return config.show_leaves !== false;
    if (key === 'complaints') return config.show_complaints !== false;
    return config[`show_${key}`] !== false;
  };

  const visibleModules = MODULES.filter(isVisible);

  const handleToggle = (key) => {
    const field = key === 'leave' ? 'show_leaves' : key === 'complaints' ? 'show_complaints' : `show_${key}`;
    setLocalConfig((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const res = await api.post('/dashboard/config', localConfig);
      setConfig(res.data);
      setLocalConfig(res.data);
      setPersonalizeOpen(false);
    } catch (err) {
      console.error('Failed to save dashboard preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Skeleton variant="text" width={320} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3, mb: 5 }}>
        <Box sx={{ flex: '1 1 280px' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: 'text.primary', borderBottom: '2px solid', borderColor: 'rgba(230, 81, 0, 0.25)', pb: 0.5, display: 'inline-block' }}>
            Personalized Employee Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
            Your modules and quick access
          </Typography>
        </Box>
        <Button
          startIcon={personalizeOpen ? <ExpandLessIcon sx={{ opacity: 0.9 }} /> : <ExpandMoreIcon sx={{ opacity: 0.9 }} />}
          endIcon={<SettingsIcon sx={{ opacity: 0.9 }} />}
          variant="outlined"
          size="medium"
          color="primary"
          onClick={() => setPersonalizeOpen((o) => !o)}
          sx={{
            fontWeight: 600,
            flexShrink: 0,
            borderColor: 'rgba(230, 81, 0, 0.4)',
            color: 'primary.main',
            opacity: 0.95,
            '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(230, 81, 0, 0.06)', opacity: 1 },
          }}
        >
          Personalize dashboard
        </Button>
      </Box>

      <Collapse in={personalizeOpen}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            border: '1px solid',
            borderColor: 'grey.200',
            borderLeft: '4px solid',
            borderLeftColor: 'rgba(230, 81, 0, 0.35)',
            transition: 'box-shadow 0.2s ease',
            '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
            Add or remove cards
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.92, mb: 2.5 }}>
            Toggle which module cards appear on your dashboard. Changes are saved when you click Save.
          </Typography>
          <FormGroup row sx={{ flexWrap: 'wrap', gap: 2 }}>
            {MODULES.map((mod) => {
              const key = mod.configKey;
              const field = key === 'leave' ? 'show_leaves' : key === 'complaints' ? 'show_complaints' : `show_${key}`;
              const checked = localConfig[field] !== false;
              return (
                <FormControlLabel
                  key={mod.to}
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={() => handleToggle(key)}
                      size="small"
                      sx={{ '& .MuiSvgIcon-root': { opacity: 0.9 } }}
                    />
                  }
                  label={mod.title}
                  sx={{ opacity: 0.95, '&:hover': { opacity: 1 } }}
                />
              );
            })}
          </FormGroup>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSavePreferences}
            disabled={saving}
            sx={{ mt: 2.5, fontWeight: 600 }}
          >
            {saving ? 'Saving...' : 'Save preferences'}
          </Button>
        </Paper>
      </Collapse>

      {visibleModules.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            transition: 'box-shadow 0.2s ease',
            '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
          }}
        >
          <Typography sx={{ color: 'text.secondary', opacity: 0.95 }} gutterBottom>
            No cards visible. Open &quot;Personalize dashboard&quot; and enable at least one card, then Save.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setPersonalizeOpen(true)} sx={{ mt: 2.5, fontWeight: 600 }}>
            Personalize dashboard
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {visibleModules.map((mod) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={mod.to}>
              <DashboardCard
                title={mod.title}
                description={mod.description}
                to={mod.to}
                icon={mod.icon}
              />
            </Grid>
          ))}
        </Grid>
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 2,
              flexWrap: 'wrap',
              mb: 3,
              py: 1.5,
              px: 2,
              borderRadius: 2,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
              Have a concern? Report it to HR.
            </Typography>
            <Button
              variant="contained"
              color="warning"
              size="medium"
              startIcon={<ReportProblemIcon />}
              onClick={() => navigate('/complaints')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                py: 1.25,
                boxShadow: 1,
                '&:hover': { boxShadow: 2 },
              }}
            >
              Raise a complaint
            </Button>
          </Box>
          <Grid container spacing={3}>
            {visibleModules.map((mod) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={mod.to}>
                <DashboardCard
                  title={mod.title}
                  description={mod.description}
                  to={mod.to}
                  icon={mod.icon}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default EmployeeDashboard;
