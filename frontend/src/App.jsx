import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Login from './components/Login';
import EmployeeDashboard from './components/Dashboard/EmployeeDashboard';
import ManagerDashboard from './components/Dashboard/ManagerDashboard';
import HRDashboard from './components/Dashboard/HRDashboard';
import LeaveApplication from './components/Leave/LeaveApplication';
import LeaveList from './components/Leave/LeaveList';
import MyProfile from './components/Profile/MyProfile';
import Attendance from './components/Attendance/Attendance';
import Payroll from './components/Payroll/Payroll';
import Learning from './components/Learning/Learning';
import Career from './components/Career/Career';
import Wellness from './components/Wellness/Wellness';
import Compliance from './components/Compliance/Compliance';
import ProtectedRoute from './components/common/ProtectedRoute';
import Echo from './components/Chatbot/Echo';
import HRNavbar from './components/HRPortal/HRNavbar';
import HRProtectedRoute from './components/HRPortal/HRProtectedRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3B2F53',
      light: '#5E4D7A',
      dark: '#2A223D',
    },
    secondary: {
      main: '#0D9488',
      light: '#14B8A6',
      dark: '#0F766E',
    },
    background: {
      default: '#F8FAFC',
      paper: '#ffffff',
    },
    success: { main: '#059669' },
    warning: { main: '#D97706' },
    error: { main: '#DC2626' },
    info: { main: '#0284C7' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
});

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || '').toLowerCase();
  if (role === 'hr') {
    return <Navigate to="/hr" replace />;
  }
  if (role === 'manager') {
    return <ManagerDashboard />;
  } else {
    return <EmployeeDashboard />;
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/hr/login" element={<Navigate to="/login" replace />} />
            <Route
              path="/hr"
              element={
                <HRProtectedRoute>
                  <HRNavbar />
                  <HRDashboard />
                </HRProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <DashboardRouter />
                  <Echo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <MyProfile />
                  <Echo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <Attendance />
                  <Echo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <LeaveList />
                  <Echo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/apply"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <LeaveApplication />
                  <Echo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <Payroll />
                  <Echo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <Learning />
                  <Echo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/career"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <Career />
                  <Echo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wellness"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <Wellness />
                  <Echo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compliance"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <Compliance />
                  <Echo />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/hr/*" element={<Navigate to="/hr" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
