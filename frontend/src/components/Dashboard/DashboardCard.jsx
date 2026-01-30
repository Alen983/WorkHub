import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardCard = ({ title, children, icon: Icon, description, to, onClick, sx = {} }) => {
  const navigate = useNavigate();
  const isClickable = Boolean(to || onClick);

  const handleClick = () => {
    if (to) navigate(to);
    else if (onClick) onClick();
  };

  const cardContent = (
    <Card
      sx={{
        mb: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
        '&:hover': isClickable ? { boxShadow: 4 } : {},
        ...sx,
      }}
      onClick={isClickable ? handleClick : undefined}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: description ? 1 : 0 }}>
          {Icon && (
            <Box sx={{ color: 'primary.main', mt: 0.25 }}>
              <Icon fontSize="medium" />
            </Box>
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Box>
        {children}
        {isClickable && to && (
          <Button size="small" sx={{ mt: 2, alignSelf: 'flex-start' }} onClick={(e) => { e.stopPropagation(); handleClick(); }}>
            View
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return cardContent;
};

export default DashboardCard;
