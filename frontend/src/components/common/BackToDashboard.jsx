import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BackToDashboard = () => {
  const navigate = useNavigate();
  return (
    <Button
      color="primary"
      startIcon={<ArrowBackIcon sx={{ opacity: 0.9 }} />}
      onClick={() => navigate('/dashboard')}
      sx={{
        mb: 2,
        fontWeight: 600,
        opacity: 0.95,
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        '&:hover': { opacity: 1, transform: 'translateX(-2px)' },
      }}
    >
      Back to Dashboard
    </Button>
  );
};

export default BackToDashboard;
