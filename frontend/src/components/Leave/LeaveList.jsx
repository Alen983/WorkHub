import { useState, useEffect, useRef } from 'react';
import { Container, Typography, Box, Chip, Paper, Button, IconButton, Grid, LinearProgress, Skeleton, Alert } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';
import BackToDashboard from '../common/BackToDashboard';

const AUTO_APPROVE_SECONDS = 5 * 60; // 5 minutes

function getCreatedAt(leave) {
  return leave?.created_at ?? leave?.createdAt ?? null;
}

function formatCountdown(seconds) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Self-contained 5-minute countdown timer. Updates every second.
 * Uses createdAt from API if present; otherwise starts from 5:00 when mounted.
 */
function PendingLeaveTimer({ createdAt, onExpired }) {
  const [now, setNow] = useState(() => Date.now());
  const startTimeRef = useRef(null);
  const expiredRef = useRef(false);

  if (startTimeRef.current === null) {
    startTimeRef.current = createdAt ? new Date(createdAt).getTime() : Date.now();
  }
  const startTime = startTimeRef.current;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.floor((now - startTime) / 1000);
  const remaining = Math.max(0, AUTO_APPROVE_SECONDS - elapsed);

  useEffect(() => {
    if (remaining <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpired?.();
    }
  }, [remaining, onExpired]);

  if (remaining <= 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Status
        </Typography>
        <Chip label="Auto approved" color="success" size="small" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
        Auto-approve in
      </Typography>
      <Typography
        variant="h5"
        component="span"
        sx={{
          fontFamily: 'monospace',
          fontWeight: 700,
          color: 'warning.main',
          minWidth: 52,
          textAlign: 'center',
        }}
      >
        {formatCountdown(remaining)}
      </Typography>
    </Box>
  );
}

const LeaveList = () => {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState('');
  const [loadingBalance, setLoadingBalance] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaves();
    loadBalance();
  }, []);

   const loadLeaves = async () => {
      try {
        const response = await api.get('/leave/my');
        setLeaves(response.data);
        setError(''); // Clear any previous errors
      } catch (error) {
        setError('Failed to load your leave requests. Please try again.');
      }
   };

   const loadBalance = async () => {
     try {
       setLoadingBalance(true);
       const response = await api.get('/leave/my/balance');
       setBalance(response.data);
       setError(''); // Clear any previous errors
     } catch (error) {
       setError('Failed to load your leave balance. Please refresh the page.');
     } finally {
       setLoadingBalance(false);
     }
   };

  const handleDelete = async (leaveId) => {
    if (!window.confirm('Cancel this leave request? This cannot be undone.')) return;
    try {
      await api.delete(`/leave/my/${leaveId}`);
      loadLeaves();
      loadBalance(); // Reload balance after deleting leave
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel leave request. Please try again.');
    }
  };

  const renderStatus = (leave) => {
    if (leave.status !== 'Pending') {
      return (
        <Chip
          label={leave.status}
          color={leave.status === 'Approved' ? 'success' : 'error'}
        />
      );
    }
    return (
      <PendingLeaveTimer
        createdAt={getCreatedAt(leave)}
        onExpired={loadLeaves}
      />
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
    )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Leave Management
        </Typography>
        <Button variant="contained" onClick={() => navigate('/leave/apply')}>
          Apply for Leave
        </Button>
      </Box>
      
      {/* Leave Balance Card */}
      {loadingBalance ? (
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={4}>
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" width="60%" height={32} />
            </Grid>
            <Grid item xs={4}>
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" width="60%" height={32} />
            </Grid>
            <Grid item xs={4}>
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" width="60%" height={32} />
            </Grid>
          </Grid>
        </Paper>
      ) : balance ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            background: balance.remaining_leaves < 5 
              ? 'linear-gradient(135deg, rgba(198, 40, 40, 0.05) 0%, rgba(230, 81, 0, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(230, 81, 0, 0.03) 0%, rgba(255, 255, 255, 1) 100%)',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            My Leave Balance
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Leaves
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {balance.total_leaves}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Used Leaves
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {balance.used_leaves}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Remaining Leaves
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700,
                    color: balance.remaining_leaves < 5 ? 'error.main' : 'success.main'
                  }}
                >
                  {balance.remaining_leaves}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={(balance.used_leaves / balance.total_leaves) * 100}
              color={
                (balance.used_leaves / balance.total_leaves) * 100 > 80 ? 'error' :
                (balance.used_leaves / balance.total_leaves) * 100 > 60 ? 'warning' : 'primary'
              }
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        </Paper>
      ) : null}
      
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'text.primary' }} gutterBottom>
        My Leave Requests
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.92, mb: 2 }}>
        Pending requests show a 5-minute countdown; after 5 min they are auto-approved.
      </Typography>
      {leaves.length > 0 ? (
        <Box sx={{ mt: 3 }}>
          {leaves.map((leave) => (
            <Paper
              key={leave.id}
              elevation={0}
              sx={{
                p: 2.5,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(230, 81, 0, 0.08)',
                  borderColor: 'rgba(230, 81, 0, 0.2)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {format(new Date(leave.from_date), 'MMM dd, yyyy')} - {format(new Date(leave.to_date), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.92 }}>
                    {leave.reason}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {renderStatus(leave)}
                  {leave.status === 'Pending' && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(leave.id)}
                      title="Cancel / Delete leave request"
                      aria-label="Delete leave"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  )}
                </Box>
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
