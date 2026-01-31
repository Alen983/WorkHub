import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(email, password);
    if (result.success) {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const role = (user?.role || '').toLowerCase();
      navigate(role === 'hr' ? '/hr' : '/dashboard', { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            padding: 4,
            width: '100%',
            border: '2px solid',
            borderColor: 'rgba(230, 81, 0, 0.2)',
            borderTop: '4px solid',
            borderTopColor: 'primary.main',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(230, 81, 0, 0.12)',
          }}
        >
          <Typography component="h1" variant="h5" align="center" fontWeight={700} sx={{ color: 'primary.main', opacity: 0.95 }} gutterBottom>
            WorkHub
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Sign in to WorkHub
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="medium"
              sx={{
                mt: 3,
                mb: 1.5,
                py: 1.5,
                fontWeight: 600,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant="text"
              color="inherit"
              size="medium"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{
                py: 1,
                fontWeight: 500,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main', backgroundColor: 'rgba(230, 81, 0, 0.06)' },
              }}
            >
              Go back
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
