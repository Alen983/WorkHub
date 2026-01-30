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
import api from '../../services/api';
import BackToDashboard from '../common/BackToDashboard';

const LeaveApplication = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!fromDate || !toDate) {
      setError('Please select both from and to dates');
      return;
    }

    if (fromDate > toDate) {
      setError('From date must be before or equal to to date');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    try {
      await api.post('/leave/apply', {
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit leave request');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ marginTop: 4 }}>
        <BackToDashboard />
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="h5" gutterBottom>
            Apply for Leave
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Leave request submitted successfully!
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              multiline
              rows={4}
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
              >
                Submit
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LeaveApplication;
