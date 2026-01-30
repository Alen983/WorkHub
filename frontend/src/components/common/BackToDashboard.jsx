import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BackToDashboard = () => {
  const navigate = useNavigate();
  return (
    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
      Back to Dashboard
    </Button>
  );
};

export default BackToDashboard;
