import { Box, Paper, Typography, Grid } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';

const TeamStats = ({ stats }) => {
  if (!stats) return null;

  const statCards = [
    {
      label: 'Team Size',
      value: stats.total_team_size || 0,
      icon: <PeopleIcon />,
      color: '#3B2F53'
    },
    {
      label: 'On Leave',
      value: stats.on_leave_count || 0,
      icon: <EventBusyIcon />,
      color: '#f44336'
    },
    {
      label: 'Available',
      value: stats.available_count || 0,
      icon: <CheckCircleIcon />,
      color: '#4caf50'
    },
    {
      label: 'Pending Approvals',
      value: stats.pending_approvals || 0,
      icon: <PendingIcon />,
      color: '#ff9800'
    }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            elevation={1}
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box sx={{ color: stat.color, fontSize: 36, display: 'flex', alignItems: 'center' }}>
              {stat.icon}
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: stat.color, lineHeight: 1.2 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {stat.label}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default TeamStats;
