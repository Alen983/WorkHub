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
      main: '#E65100',
      light: '#FF8A50',
      dark: '#BF360C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C62828',
      light: '#E53935',
      dark: '#B71C1C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFAF9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
    success: { main: '#059669' },
    warning: { main: '#F57C00' },
    error: { main: '#C62828' },
    info: { main: '#0284C7' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.02em' },
    subtitle1: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid',
          borderColor: 'grey.200',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          border: '1px solid',
          borderColor: 'grey.200',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          transition: 'all 0.15s ease',
          fontWeight: 600,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #E65100 0%, #FF6D00 100%)',
          boxShadow: '0 2px 8px rgba(230, 81, 0, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #BF360C 0%, #E65100 100%)',
            boxShadow: '0 4px 12px rgba(230, 81, 0, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #C62828 0%, #E53935 100%)',
          boxShadow: '0 2px 8px rgba(198, 40, 40, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #B71C1C 0%, #C62828 100%)',
            boxShadow: '0 4px 12px rgba(198, 40, 40, 0.4)',
          },
        },
        outlinedPrimary: {
          borderColor: '#E65100',
          color: '#E65100',
          '&:hover': {
            borderColor: '#BF360C',
            backgroundColor: 'rgba(230, 81, 0, 0.08)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease, transform 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(230, 81, 0, 0.08)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(230, 81, 0, 0.04)',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(230, 81, 0, 0.05)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(230, 81, 0, 0.06)',
          },
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
