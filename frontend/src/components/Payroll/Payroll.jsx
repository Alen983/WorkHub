import { Container, Typography, Paper } from '@mui/material';
import BackToDashboard from '../common/BackToDashboard';

const Payroll = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Typography variant="h5" gutterBottom>
        Payroll & Compensation
      </Typography>
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Payroll & compensation – coming soon
        </Typography>
      </Paper>
    </Container>
  );
};

export default Payroll;
