import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { format } from 'date-fns';
import BackToDashboard from '../common/BackToDashboard';
import api from '../../services/api';

const Compliance = () => {
  const [data, setData] = useState({ compliance_policies: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/recommendations');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load compliance:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const policies = data.compliance_policies || [];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Typography variant="h5" gutterBottom>
        Compliance & Policies
      </Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : policies.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No compliance policies at this time</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {policies.map((policy) => (
            <Paper key={policy.id} elevation={2} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {policy.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Due: {format(new Date(policy.due_date), 'MMM dd, yyyy')}
                {policy.department && ` · ${policy.department}`}
              </Typography>
              {policy.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {policy.description}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Compliance;
