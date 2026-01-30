import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Chip } from '@mui/material';
import BackToDashboard from '../common/BackToDashboard';
import api from '../../services/api';

const Learning = () => {
  const [data, setData] = useState({ learning_content: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/recommendations');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load learning:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const items = data.learning_content || [];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Typography variant="h5" gutterBottom>
        Learning & Certifications
      </Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : items.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No learning content available</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((content) => (
            <Paper key={content.id} elevation={2} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {content.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {content.description}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip label={content.level} size="small" />
                {Array.isArray(content.tags) &&
                  content.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Learning;
