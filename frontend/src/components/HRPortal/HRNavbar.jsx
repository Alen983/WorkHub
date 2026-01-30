import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const HRNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/hr/login', { replace: true });
  };

  return (
    <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'primary.main' }}>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 }, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AdminPanelSettingsIcon sx={{ fontSize: 22, color: 'white' }} />
          </Box>
          <Typography variant="h6" component="div" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
            WorkHub HR
          </Typography>
        </Box>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.1)',
              }}
            >
              <PersonOutlineIcon sx={{ fontSize: 18, opacity: 0.9 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                (HR)
              </Typography>
            </Box>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default HRNavbar;
