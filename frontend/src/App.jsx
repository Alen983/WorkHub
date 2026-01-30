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

const theme = createTheme({
  palette: {
    primary: {
      main: '#3B2F53',
    },
    secondary: {
      main: '#ffffff',
    },
    background: {
      default: '#ffffff',
    },
  },
});

const DashboardRouter = () => {
  const { user } = useAuth();

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c97bdf2a-ba3b-4d68-ac8d-51af73b942ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:DashboardRouter',message:'dashboard router render',data:{hasUser:!!user,role:user?.role,loading:user===undefined},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || '').toLowerCase();
  if (role === 'hr') {
    return <HRDashboard />;
  } else if (role === 'manager') {
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
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
