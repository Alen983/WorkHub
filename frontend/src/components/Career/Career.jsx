import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Skeleton,
  Alert,
  Button,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PersonIcon from '@mui/icons-material/Person';
import BackToDashboard from '../common/BackToDashboard';
import api from '../../services/api';

const PATH_ICONS = {
  most_common: StarIcon,
  similar: AccountTreeIcon,
  pivot: SwapHorizIcon,
};

const PATH_COLORS = {
  most_common: 'success.main',
  similar: 'info.main',
  pivot: 'secondary.main',
};

const Career = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      try {
        const res = await api.get('/career/roadmap');
        if (!cancelled) setRoadmap(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || 'Failed to load career roadmap.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <BackToDashboard />
        <Typography variant="h5" gutterBottom>Career Growth & Development</Typography>
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 1 }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <BackToDashboard />
        <Typography variant="h5" gutterBottom>Career Growth & Development</Typography>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => window.location.reload()}>Retry</Button>}>
          {error}
        </Alert>
      </Container>
    );
  }

  const current = roadmap?.current_role || { title: 'Your role', department: 'Your department' };
  const paths = roadmap?.paths || [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Typography variant="h5" gutterBottom>
        Career Growth & Development
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Explore your next role at G10X Technology Private Limited
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Current role card */}
        <Paper
          elevation={2}
          sx={{
            p: 2,
            minWidth: { xs: '100%', md: 200 },
            maxWidth: { md: 220 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
            }}
          >
            <PersonIcon fontSize="medium" />
          </Box>
          <Typography variant="subtitle1" fontWeight={600} align="center">
            {current.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {current.department}
          </Typography>
        </Paper>

        {/* Connector + next roles by path */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {paths.map((path) => {
            const Icon = PATH_ICONS[path.type] || StarIcon;
            const color = PATH_COLORS[path.type] || 'text.secondary';
            return (
              <Box key={path.type} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Icon sx={{ fontSize: 20, color }} />
                  <Typography variant="caption" fontWeight={600} color={color}>
                    {path.label}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    pl: 3,
                  }}
                >
                  {(path.next_roles || []).map((role, idx) => (
                    <Card
                      key={`${role.title}-${idx}`}
                      variant="outlined"
                      sx={{
                        minWidth: 160,
                        maxWidth: 200,
                        borderRadius: 2,
                        borderLeft: '4px solid',
                        borderLeftColor: color,
                      }}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {role.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {role.department}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {paths.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Add your current role in your profile to see personalized career paths.
        </Alert>
      )}
    </Container>
  );
};

export default Career;
