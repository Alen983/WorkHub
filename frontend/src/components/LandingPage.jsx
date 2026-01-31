import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Card, CardContent, Grid } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SchoolIcon from '@mui/icons-material/School';
import PolicyIcon from '@mui/icons-material/Policy';

const FEATURE_CARDS = [
  { title: 'Self-Service HR', icon: AdminPanelSettingsIcon },
  { title: 'Transparent Payroll', icon: AttachMoneyIcon },
  { title: 'Career Growth', icon: SchoolIcon },
  { title: 'Compliance Made Easy', icon: PolicyIcon },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const goToLogin = () => navigate('/login');

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* Logo – same as Navbar (DashboardIcon + WorkHub), adapted for light background */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }} aria-label="WorkHub logo">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: 'rgba(230, 81, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(230, 81, 0, 0.25)',
              }}
            >
              <DashboardIcon sx={{ fontSize: 24, color: 'primary.main' }} aria-hidden />
            </Box>
            <Typography variant="h5" component="h1" fontWeight={700} sx={{ letterSpacing: '-0.02em', color: 'primary.main' }}>
              WorkHub
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={600} sx={{ color: 'text.primary', mb: 1 }}>
            Your Work, Simplified in One Place
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 480 }}>
            An employee self-service platform for attendance, payroll, wellness, and compliance—all in one place.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={goToLogin}
            sx={{ mb: 4, textTransform: 'none', fontWeight: 600 }}
            aria-label="Go to login page"
          >
            Go to Login
          </Button>
        </Box>

        {/* Feature cards – all clickable, navigate to /login */}
        <Grid container spacing={2} justifyContent="center" component="section" aria-label="Features" sx={{ alignItems: 'stretch' }}>
          {FEATURE_CARDS.map(({ title, icon: Icon }) => (
            <Grid item xs={12} sm={6} md={3} key={title} sx={{ display: 'flex' }}>
              <Card
                component="button"
                type="button"
                elevation={0}
                onClick={goToLogin}
                sx={{
                  width: '100%',
                  height: 140,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    borderColor: 'grey.300',
                  },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                  },
                }}
                aria-label={`${title} – go to login`}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(230, 81, 0, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.5,
                    }}
                  >
                    <Icon sx={{ fontSize: 20, color: 'primary.main', opacity: 0.9 }} aria-hidden />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'text.primary' }}>
                    {title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default LandingPage;
