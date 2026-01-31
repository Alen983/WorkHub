import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(90deg, #E65100 0%, #C62828 100%)',
        borderBottom: '3px solid rgba(255,255,255,0.2)',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 }, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <DashboardIcon sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Typography variant="h6" component="div" fontWeight={700} sx={{ letterSpacing: '-0.02em', color: 'white' }}>
            WorkHub
          </Typography>
        </Box>
        {user && (
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: 'white',
              transition: 'all 0.15s ease',
              ...(isDashboard
                ? { bgcolor: 'rgba(255,255,255,0.25)', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }
                : { '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }),
            }}
          >
            Dashboard
          </Button>
        )}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <PersonOutlineIcon sx={{ fontSize: 18, color: 'white' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                ({user.role})
              </Typography>
            </Box>
            <Button
              color="inherit"
              startIcon={<LogoutIcon sx={{ opacity: 0.95 }} />}
              onClick={handleLogout}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: 'white',
                opacity: 0.95,
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', opacity: 1 },
              }}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
