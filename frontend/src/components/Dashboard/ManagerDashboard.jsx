import { useState, useEffect, useRef } from 'react';
import { Container, Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Grid, Tabs, Tab, Checkbox, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DashboardCard from './DashboardCard';
import TeamStats from './TeamStats';
import TeamOverview from './TeamOverview';
import LeaveCalendar from '../Leave/LeaveCalendar';
import LeaveBalances from '../Leave/LeaveBalances';
import TeamCompliance from './TeamCompliance';
import api from '../../services/api';
import { format } from 'date-fns';

const AUTO_APPROVE_SECONDS = 5 * 60;
function getRemainingSeconds(createdAt) {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  const elapsed = Math.floor((Date.now() - created) / 1000);
  return Math.max(0, AUTO_APPROVE_SECONDS - elapsed);
}
function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const ManagerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedLeaves, setSelectedLeaves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tick, setTick] = useState(0);
  const refetchedOnZero = useRef(new Set());

  useEffect(() => {
    loadDashboard();
  }, []);

  const pendingWithTimer = dashboardData?.pending_leaves?.filter(
    (l) => l.status === 'Pending' && l.created_at
  ) || [];
  useEffect(() => {
    if (pendingWithTimer.length === 0) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [pendingWithTimer.length]);

  useEffect(() => {
    if (pendingWithTimer.length === 0) return;
    for (const leave of dashboardData?.pending_leaves || []) {
      if (leave.status !== 'Pending' || !leave.created_at) continue;
      const remaining = getRemainingSeconds(leave.created_at);
      if (remaining <= 0 && !refetchedOnZero.current.has(leave.id)) {
        refetchedOnZero.current.add(leave.id);
        loadDashboard();
      }
    }
  }, [tick, pendingWithTimer.length, dashboardData?.pending_leaves]);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const handleApprove = async (leaveId, status) => {
    try {
      await api.post('/leave/approve', { leave_id: leaveId, status });
      loadDashboard();
      setSelectedLeaves(selectedLeaves.filter(id => id !== leaveId));
    } catch (error) {
      console.error('Failed to update leave:', error);
      alert(error.response?.data?.detail || 'Failed to update leave');
    }
  };

  const handleBulkApprove = async (status) => {
    if (selectedLeaves.length === 0) {
      alert('Please select at least one leave request');
      return;
    }
    
    try {
      await api.post('/leave/bulk-approve', {
        leave_ids: selectedLeaves,
        status: status
      });
      loadDashboard();
      setSelectedLeaves([]);
      alert(`Successfully ${status.toLowerCase()} ${selectedLeaves.length} leave request(s)`);
    } catch (error) {
      console.error('Failed to bulk update:', error);
      alert(error.response?.data?.detail || 'Failed to bulk update leaves');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = filteredPendingLeaves.map(leave => leave.id);
      setSelectedLeaves(allIds);
    } else {
      setSelectedLeaves([]);
    }
  };

  const handleSelectOne = (leaveId) => {
    if (selectedLeaves.includes(leaveId)) {
      setSelectedLeaves(selectedLeaves.filter(id => id !== leaveId));
    } else {
      setSelectedLeaves([...selectedLeaves, leaveId]);
    }
  };

  if (!dashboardData) {
    return <div>Loading...</div>;
  }

  const filteredPendingLeaves = dashboardData.pending_leaves?.filter(leave => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      leave.employee_name?.toLowerCase().includes(searchLower) ||
      leave.reason?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const teamAvailabilityData = dashboardData.team_members?.map(member => {
    const currentLeave = dashboardData.pending_leaves?.find(
      leave => leave.employee_id === member.id && leave.status === 'Approved'
    );
    return {
      id: member.id,
      availability_status: currentLeave ? 'On Leave' : 'Available',
      current_leave: currentLeave?.reason
    };
  }) || [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Manager Dashboard
      </Typography>

      <TeamStats stats={dashboardData.recommendations} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3, mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Team Overview" />
          <Tab label="Leave Management" />
          <Tab label="Leave Calendar" />
          <Tab label="Leave Balances" />
          <Tab label="Compliance" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TeamOverview
              teamMembers={dashboardData.team_members}
              availabilityData={teamAvailabilityData}
            />
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DashboardCard title="Pending Leave Requests">
              {dashboardData.pending_leaves && dashboardData.pending_leaves.length > 0 ? (
                <>
                  <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      placeholder="Search by employee or reason..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ flexGrow: 1, maxWidth: 400 }}
                    />
                    {selectedLeaves.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleBulkApprove('Approved')}
                        >
                          Approve Selected ({selectedLeaves.length})
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleBulkApprove('Rejected')}
                        >
                          Reject Selected ({selectedLeaves.length})
                        </Button>
                      </Box>
                    )}
                  </Box>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedLeaves.length === filteredPendingLeaves.length && filteredPendingLeaves.length > 0}
                              indeterminate={selectedLeaves.length > 0 && selectedLeaves.length < filteredPendingLeaves.length}
                              onChange={handleSelectAll}
                            />
                          </TableCell>
                          <TableCell>Employee</TableCell>
                          <TableCell>From Date</TableCell>
                          <TableCell>To Date</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredPendingLeaves.map((leave) => (
                          <TableRow key={leave.id}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedLeaves.includes(leave.id)}
                                onChange={() => handleSelectOne(leave.id)}
                              />
                            </TableCell>
                            <TableCell>{leave.employee_name || 'N/A'}</TableCell>
                            <TableCell>{format(new Date(leave.from_date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{format(new Date(leave.to_date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{leave.reason}</TableCell>
                            <TableCell>
                              {leave.created_at ? (
                                (() => {
                                  const remaining = getRemainingSeconds(leave.created_at);
                                  return (
                                    <Chip
                                      label={remaining > 0 ? `Auto-approve in ${formatCountdown(remaining)}` : 'Auto-approving…'}
                                      color="warning"
                                      size="small"
                                    />
                                  );
                                })()
                              ) : (
                                <Chip label={leave.status} color="warning" size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                color="success"
                                onClick={() => handleApprove(leave.id, 'Approved')}
                                sx={{ mr: 1 }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleApprove(leave.id, 'Rejected')}
                              >
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Typography color="text.secondary">No pending leave requests</Typography>
              )}
            </DashboardCard>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <LeaveCalendar />
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <LeaveBalances />
          </Grid>
        </Grid>
      )}

      {tabValue === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TeamCompliance teamMembers={dashboardData.team_members} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ManagerDashboard;
