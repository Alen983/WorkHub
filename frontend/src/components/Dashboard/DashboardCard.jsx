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
      elevation={0}
      sx={{
        mb: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        border: '1px solid',
        borderColor: 'grey.200',
        '&:hover': isClickable
          ? {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              borderColor: 'grey.300',
            }
          : {},
        ...sx,
      }}
      onClick={isClickable ? handleClick : undefined}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: description ? 2 : 0 }}>
          {Icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: 'rgba(230, 81, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background-color 0.2s ease',
                '.MuiCard-root:hover &': {
                  bgcolor: 'rgba(230, 81, 0, 0.18)',
                },
              }}
            >
              <Icon sx={{ fontSize: 20, color: 'primary.main', opacity: 0.9 }} />
            </Box>
          )}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Box>
        {children}
        {isClickable && to && (
          <Button
            size="small"
            variant="text"
            color="primary"
            sx={{
              mt: 1.5,
              alignSelf: 'flex-start',
              fontWeight: 600,
              opacity: 0.9,
              transition: 'opacity 0.2s ease',
              '&:hover': { opacity: 1, bgcolor: 'rgba(230, 81, 0, 0.06)' },
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            View →
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
