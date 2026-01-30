import { useState, useEffect } from 'react';
import { Container, Typography, Box, Chip, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';
import BackToDashboard from '../common/BackToDashboard';

const LeaveList = () => {
  const [leaves, setLeaves] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const response = await api.get('/leave/my');
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to load leaves:', error);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Leave Management
        </Typography>
        <Button variant="contained" onClick={() => navigate('/leave/apply')}>
          Apply for Leave
        </Button>
      </Box>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        My Leave Requests
      </Typography>
      {leaves.length > 0 ? (
        <Box sx={{ mt: 2 }}>
          {leaves.map((leave) => (
            <Paper key={leave.id} elevation={2} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1">
                    {format(new Date(leave.from_date), 'MMM dd, yyyy')} - {format(new Date(leave.to_date), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {leave.reason}
                  </Typography>
                </Box>
                <Chip
                  label={leave.status}
                  color={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'error' : 'warning'}
                />
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No leave requests found
        </Typography>
      )}
    </Container>
  );
};

export default LeaveList;
