import { useEffect } from 'react';
import { Container, Grid, Typography, Box } from '@mui/material';
import DashboardCard from './DashboardCard';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PolicyIcon from '@mui/icons-material/Policy';

const MODULES = [
  { title: 'My Profile', description: 'View and update your profile', to: '/profile', icon: PersonIcon },
  { title: 'Attendance', description: 'View attendance and timesheets', to: '/attendance', icon: ScheduleIcon },
  { title: 'Leave Management', description: 'Apply and track leave requests', to: '/leave', icon: EventIcon },
  { title: 'Payroll & Compensation', description: 'Payslips and compensation', to: '/payroll', icon: AttachMoneyIcon },
  { title: 'Learning & Certifications', description: 'Courses and certifications', to: '/learning', icon: SchoolIcon },
  { title: 'Career Growth & Development', description: 'Goals and development plans', to: '/career', icon: TrendingUpIcon },
  { title: 'Wellness & Engagement', description: 'Wellness programs and engagement', to: '/wellness', icon: FavoriteIcon },
  { title: 'Compliance & Policies', description: 'Policies and compliance tasks', to: '/compliance', icon: PolicyIcon },
];

const EmployeeDashboard = () => {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/c97bdf2a-ba3b-4d68-ac8d-51af73b942ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmployeeDashboard.jsx',message:'EmployeeDashboard mounted',data:{modulesCount:MODULES.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  }, []);
  // #endregion

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Personalized Employee Dashboard
      </Typography>

      <Grid container spacing={3}>
        {MODULES.map((mod) => (
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
    </Container>
  );
};

export default EmployeeDashboard;
