import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import BackToDashboard from '../common/BackToDashboard';
import api from '../../services/api';

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/users/me');
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Container sx={{ mt: 4 }}>Loading...</Container>;
  if (!profile) return <Container sx={{ mt: 4 }}>Failed to load profile.</Container>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Typography variant="h5" gutterBottom>
        My Profile
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ '& > *': { mb: 2 } }}>
          <Typography variant="subtitle2" color="text.secondary">Name</Typography>
          <Typography variant="body1">{profile.name}</Typography>
          <Typography variant="subtitle2" color="text.secondary">Email</Typography>
          <Typography variant="body1">{profile.email}</Typography>
          <Typography variant="subtitle2" color="text.secondary">Role</Typography>
          <Typography variant="body1">{profile.role}</Typography>
          <Typography variant="subtitle2" color="text.secondary">Department</Typography>
          <Typography variant="body1">{profile.department}</Typography>
          <Typography variant="subtitle2" color="text.secondary">Skills</Typography>
          <Typography variant="body1">
            {Array.isArray(profile.skills) ? profile.skills.join(', ') : '—'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default MyProfile;
