import { useState, useEffect, useRef } from 'react';
import { Container, Typography, Box, Chip, Paper, Button, IconButton } from '@mui/material';
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

  const handleDelete = async (leaveId) => {
    if (!window.confirm('Cancel this leave request? This cannot be undone.')) return;
    try {
      await api.delete(`/leave/my/${leaveId}`);
      loadLeaves();
    } catch (err) {
      console.error('Failed to delete leave:', err);
      alert(err.response?.data?.detail || 'Failed to delete leave');
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Pending requests show a 5-minute countdown; after 5 min they are auto-approved.
      </Typography>
      {leaves.length > 0 ? (
        <Box sx={{ mt: 2 }}>
          {leaves.map((leave) => (
            <Paper key={leave.id} elevation={2} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="body1">
                    {format(new Date(leave.from_date), 'MMM dd, yyyy')} - {format(new Date(leave.to_date), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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
