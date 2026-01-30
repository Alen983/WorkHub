import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardCard = ({ title, children, icon: Icon, description, to, onClick, sx = {} }) => {
  const navigate = useNavigate();
  const isClickable = Boolean(to || onClick);

  const handleClick = () => {
    if (to) navigate(to);
    else if (onClick) onClick();
  };

  return (
    <Card
      elevation={1}
      sx={{
        mb: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': isClickable
          ? { boxShadow: 3, transform: 'translateY(-2px)' }
          : {},
        border: '1px solid',
        borderColor: 'divider',
        ...sx,
      }}
      onClick={isClickable ? handleClick : undefined}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: description ? 1.5 : 0 }}>
          {Icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1.5,
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 24 }} />
            </Box>
          )}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Box>
        {children}
        {isClickable && to && (
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 2, alignSelf: 'flex-start' }}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            View
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
