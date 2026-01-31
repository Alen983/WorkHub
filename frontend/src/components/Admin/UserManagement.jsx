import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    skills: ''
  });
  const [error, setError] = useState('');
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [payrollData, setPayrollData] = useState({
    current_ctc: '',
    net_monthly: '',
    basic: '',
    hra: '',
    special_allowance: '',
    other_allowances: '',
    pf: '',
    tds: '',
    other_deductions: '',
    financial_year: '',
    tax_regime: 'Old regime'
  });
  const [payrollError, setPayrollError] = useState('');
  const [payrollLoading, setPayrollLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      department: '',
      skills: ''
    });
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
    
    try {
      await api.post('/admin/user', {
        ...formData,
        skills: skillsArray
      });
      handleClose();
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/admin/user/${userId}`);
        loadUsers();
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  const handlePayrollOpen = async (user) => {
    setSelectedUser(user);
    setPayrollError('');
    setPayrollLoading(true);
    try {
      // Try to load existing payroll
      const response = await api.get(`/admin/payroll/${user.id}`);
      setPayrollData({
        current_ctc: response.data.current_ctc || '',
        net_monthly: response.data.net_monthly || '',
        basic: response.data.basic || '',
        hra: response.data.hra || '',
        special_allowance: response.data.special_allowance || '',
        other_allowances: response.data.other_allowances || '',
        pf: response.data.pf || '',
        tds: response.data.tds || '',
        other_deductions: response.data.other_deductions || '',
        financial_year: response.data.financial_year || '',
        tax_regime: response.data.tax_regime || 'Old regime'
      });
    } catch (err) {
      // Payroll doesn't exist yet, use empty form
      if (err.response?.status !== 404) {
        setPayrollError(err.response?.data?.detail || 'Failed to load payroll');
      }
      setPayrollData({
        current_ctc: '',
        net_monthly: '',
        basic: '',
        hra: '',
        special_allowance: '',
        other_allowances: '',
        pf: '',
        tds: '',
        other_deductions: '',
        financial_year: '',
        tax_regime: 'Old regime'
      });
    } finally {
      setPayrollLoading(false);
      setPayrollOpen(true);
    }
  };

  const handlePayrollClose = () => {
    setPayrollOpen(false);
    setSelectedUser(null);
    setPayrollError('');
  };

  const handlePayrollSubmit = async () => {
    setPayrollError('');
    if (!selectedUser) return;

    const payload = {
      user_id: selectedUser.id,
      current_ctc: parseInt(payrollData.current_ctc) || 0,
      net_monthly: parseInt(payrollData.net_monthly) || 0,
      basic: parseInt(payrollData.basic) || 0,
      hra: parseInt(payrollData.hra) || 0,
      special_allowance: parseInt(payrollData.special_allowance) || 0,
      other_allowances: parseInt(payrollData.other_allowances) || 0,
      pf: parseInt(payrollData.pf) || 0,
      tds: parseInt(payrollData.tds) || 0,
      other_deductions: parseInt(payrollData.other_deductions) || 0,
      financial_year: payrollData.financial_year || '',
      tax_regime: payrollData.tax_regime || 'Old regime'
    };

    try {
      // Try to update first, if 404 then create
      try {
        await api.patch(`/admin/payroll/${selectedUser.id}`, payload);
      } catch (updateErr) {
        if (updateErr.response?.status === 404) {
          // Payroll doesn't exist, create it
          await api.post('/admin/payroll', payload);
        } else {
          throw updateErr;
        }
      }
      handlePayrollClose();
      alert('Payroll saved successfully');
    } catch (err) {
      setPayrollError(err.response?.data?.detail || 'Failed to save payroll');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">User Management</Typography>
        <Button variant="contained" onClick={handleOpen}>
          Create User
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
          >
            <MenuItem value="employee">Employee</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="hr">HR</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Skills (comma-separated)"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="Python, React, Docker"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handlePayrollOpen(user)}
                    title="Manage Payroll"
                  >
                    <AttachMoneyIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(user.id)}
                    title="Delete User"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={payrollOpen} onClose={handlePayrollClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Manage Payroll - {selectedUser?.name}
        </DialogTitle>
        <DialogContent>
          {payrollError && <Alert severity="error" sx={{ mb: 2 }}>{payrollError}</Alert>}
          {payrollLoading ? (
            <Typography>Loading...</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Current CTC (Annual)"
                type="number"
                value={payrollData.current_ctc}
                onChange={(e) => setPayrollData({ ...payrollData, current_ctc: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Net Monthly Salary"
                type="number"
                value={payrollData.net_monthly}
                onChange={(e) => setPayrollData({ ...payrollData, net_monthly: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Basic"
                type="number"
                value={payrollData.basic}
                onChange={(e) => setPayrollData({ ...payrollData, basic: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="HRA (House Rent Allowance)"
                type="number"
                value={payrollData.hra}
                onChange={(e) => setPayrollData({ ...payrollData, hra: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Special Allowance"
                type="number"
                value={payrollData.special_allowance}
                onChange={(e) => setPayrollData({ ...payrollData, special_allowance: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Other Allowances"
                type="number"
                value={payrollData.other_allowances}
                onChange={(e) => setPayrollData({ ...payrollData, other_allowances: e.target.value })}
              />
              <TextField
                fullWidth
                label="PF (Provident Fund)"
                type="number"
                value={payrollData.pf}
                onChange={(e) => setPayrollData({ ...payrollData, pf: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="TDS (Tax Deducted at Source)"
                type="number"
                value={payrollData.tds}
                onChange={(e) => setPayrollData({ ...payrollData, tds: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Other Deductions"
                type="number"
                value={payrollData.other_deductions}
                onChange={(e) => setPayrollData({ ...payrollData, other_deductions: e.target.value })}
              />
              <TextField
                fullWidth
                label="Financial Year"
                value={payrollData.financial_year}
                onChange={(e) => setPayrollData({ ...payrollData, financial_year: e.target.value })}
                placeholder="2024-25"
                required
              />
              <TextField
                fullWidth
                select
                label="Tax Regime"
                value={payrollData.tax_regime}
                onChange={(e) => setPayrollData({ ...payrollData, tax_regime: e.target.value })}
                required
              >
                <MenuItem value="Old regime">Old regime</MenuItem>
                <MenuItem value="New regime">New regime</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePayrollClose}>Cancel</Button>
          <Button onClick={handlePayrollSubmit} variant="contained" disabled={payrollLoading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
