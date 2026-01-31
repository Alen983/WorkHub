import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Button,
  Skeleton,
  Alert,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Slider,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import BackToDashboard from '../common/BackToDashboard';
import api from '../../services/api';

const Wellness = () => {
  const [links, setLinks] = useState([]);
  const [resources, setResources] = useState([]);
  const [tips, setTips] = useState([]);
  const [workLife, setWorkLife] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [surveyOpen, setSurveyOpen] = useState(false);
  const [surveyDetail, setSurveyDetail] = useState(null);
  const [surveyResponses, setSurveyResponses] = useState({});
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  const loadAll = async () => {
    setError(null);
    try {
      const [linksRes, resourcesRes, tipsRes, workLifeRes, surveysRes, nudgesRes] = await Promise.all([
        api.get('/wellness/links'),
        api.get('/wellness/resources'),
        api.get('/wellness/mental-health-tips'),
        api.get('/wellness/work-life'),
        api.get('/wellness/surveys'),
        api.get('/wellness/nudges'),
      ]);
      setLinks(linksRes.data || []);
      setResources(resourcesRes.data || []);
      setTips(tipsRes.data || []);
      setWorkLife(workLifeRes.data || []);
      setSurveys(surveysRes.data || []);
      setNudges(nudgesRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load wellness data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openSurvey = async (surveyId) => {
    setSurveySubmitted(false);
    setSurveyResponses({});
    try {
      const res = await api.get(`/wellness/surveys/${surveyId}`);
      setSurveyDetail(res.data);
      setSurveyOpen(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load survey.');
    }
  };

  const handleSurveyResponse = (questionId, value) => {
    setSurveyResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitSurvey = async () => {
    if (!surveyDetail?.id) return;
    setSurveySubmitting(true);
    try {
      await api.post(`/wellness/surveys/${surveyDetail.id}/submit`, { responses: surveyResponses });
      setSurveySubmitted(true);
      setTimeout(() => {
        setSurveyOpen(false);
        setSurveyDetail(null);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit survey.');
    } finally {
      setSurveySubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <BackToDashboard />
        <Typography variant="h5" gutterBottom>Wellness & Engagement</Typography>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <BackToDashboard />
        <Typography variant="h5" gutterBottom>Wellness & Engagement</Typography>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => window.location.reload()}>Retry</Button>}>
          {error}
        </Alert>
      </Container>
    );
  }

  const linkIcons = {
    'Counselling sessions': PsychologyIcon,
    'Yoga classes': SelfImprovementIcon,
    'Exercises': FitnessCenterIcon,
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Typography variant="h5" gutterBottom>
        Wellness & Engagement
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Holistic support: resources, tips, surveys, and personalized nudges
      </Typography>

      {/* AI Wellness Nudges */}
      {nudges.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'rgba(230, 81, 0, 0.06)', borderLeft: 4, borderColor: 'primary.main' }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.primary' }}>
            <LightbulbIcon sx={{ color: 'primary.main', opacity: 0.9 }} /> For you
          </Typography>
          {nudges.map((n, i) => (
            <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: i < nudges.length - 1 ? 1 : 0 }}>
              {n.message}
            </Typography>
          ))}
        </Paper>
      )}

      {/* Quick links: Counselling, Yoga, Exercises */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Quick links</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {links.map((link) => {
          const Icon = linkIcons[link.name] || OpenInNewIcon;
          return (
            <Card key={link.name} variant="outlined" sx={{ minWidth: 200, flex: '1 1 200px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'rgba(230, 81, 0, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon sx={{ fontSize: 20, color: 'primary.main', opacity: 0.9 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600}>{link.name}</Typography>
                </Box>
                {link.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {link.description}
                  </Typography>
                )}
                <Button
                  size="small"
                  variant="contained"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon />}
                >
                  Open
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Wellness resources */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Wellness resources</Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <List dense>
          {resources.map((r, i) => (
            <ListItem key={i}>
              <ListItemText primary={r.title} secondary={r.content} />
              {r.url && (
                <Button size="small" href={r.url} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNewIcon />}>
                  Link
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Mental health tips */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Mental health tips</Typography>
      <Box sx={{ mb: 3 }}>
        {tips.map((t, i) => (
          <Accordion key={i} variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight="medium">{t.title}</Typography>
              {t.category && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({t.category})</Typography>
              )}
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">{t.content}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Work-life balance */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Work-life balance</Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <List dense>
          {workLife.map((w, i) => (
            <ListItem key={i}>
              <ListItemText primary={w.title} secondary={w.content} />
              {w.url && (
                <Button size="small" href={w.url} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNewIcon />}>
                  Link
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Engagement surveys */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Engagement surveys</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {surveys.map((s) => (
          <Card key={s.id} variant="outlined" sx={{ minWidth: 260 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">{s.title}</Typography>
              {s.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{s.description}</Typography>
              )}
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => openSurvey(s.id)}
                sx={{ mt: 2 }}
              >
                Take survey
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Survey dialog */}
      <Dialog open={surveyOpen} onClose={() => !surveySubmitting && setSurveyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{surveyDetail?.title}</DialogTitle>
        <DialogContent>
          {surveySubmitted ? (
            <Alert severity="success">Thank you for your response.</Alert>
          ) : (
            surveyDetail?.questions?.map((q) => (
              <Box key={q.id} sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="medium">{q.question}</Typography>
                {q.type === 'scale' && (
                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <Slider
                      value={surveyResponses[q.id] ?? 3}
                      onChange={(_, v) => handleSurveyResponse(q.id, v)}
                      min={1}
                      max={5}
                      step={1}
                      valueLabelDisplay="auto"
                      marks={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: n }))}
                    />
                  </FormControl>
                )}
                {q.type === 'single_choice' && (
                  <RadioGroup
                    value={surveyResponses[q.id] ?? ''}
                    onChange={(e) => handleSurveyResponse(q.id, e.target.value)}
                    sx={{ mt: 0.5 }}
                  >
                    {(q.options || []).map((opt) => (
                      <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
                    ))}
                  </RadioGroup>
                )}
                {q.type === 'text' && (
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    value={surveyResponses[q.id] ?? ''}
                    onChange={(e) => handleSurveyResponse(q.id, e.target.value)}
                    placeholder="Optional"
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Box>
            ))
          )}
        </DialogContent>
        {!surveySubmitted && (
          <DialogActions>
            <Button onClick={() => setSurveyOpen(false)} disabled={surveySubmitting}>Cancel</Button>
            <Button variant="contained" onClick={submitSurvey} disabled={surveySubmitting}>
              {surveySubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Container>
  );
};

export default Wellness;
