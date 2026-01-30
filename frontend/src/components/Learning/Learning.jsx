import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SchoolIcon from '@mui/icons-material/School';
import BackToDashboard from '../common/BackToDashboard';
import api from '../../services/api';
import { format } from 'date-fns';

const TAB_KEYS = { catalog: 0, assigned: 1, certs: 2, skillGap: 3, ai: 4 };

const Learning = () => {
  const [tab, setTab] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [progress, setProgress] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [data, setData] = useState({
    learning_content: [],
    compliance_policies: [],
    skill_gaps: [],
    role_based_certifications: [],
    learning_paths: [],
    explanations: [],
  });
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [assignedLoading, setAssignedLoading] = useState(true);
  const [certsLoading, setCertsLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [certForm, setCertForm] = useState({ title: '', issuer: '', date: '', expiry: '' });
  const [certError, setCertError] = useState(null);
  const [levelFilter, setLevelFilter] = useState('');

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const params = levelFilter ? { level: levelFilter } : {};
      const res = await api.get('/learning/catalog', { params });
      setCatalog(res.data || []);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadProgress = async () => {
    setProgressLoading(true);
    try {
      const res = await api.get('/learning/progress');
      setProgress(res.data || []);
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setProgressLoading(false);
    }
  };

  const loadAssigned = async () => {
    setAssignedLoading(true);
    try {
      const res = await api.get('/learning/assigned');
      setAssigned(res.data || []);
    } catch (err) {
      console.error('Failed to load assigned:', err);
    } finally {
      setAssignedLoading(false);
    }
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recommendations');
      setData(res.data || {});
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCertifications = async () => {
    setCertsLoading(true);
    try {
      const res = await api.get('/users/me');
      setCertifications(Array.isArray(res.data?.certifications) ? res.data.certifications : []);
    } catch (err) {
      console.error('Failed to load certifications:', err);
    } finally {
      setCertsLoading(false);
    }
  };

  useEffect(() => { loadCatalog(); }, [levelFilter]);
  useEffect(() => { loadProgress(); }, []);
  useEffect(() => { loadAssigned(); }, []);
  useEffect(() => { loadRecommendations(); }, []);
  useEffect(() => { loadCertifications(); }, []);

  const getStatus = (contentId) => {
    const p = (progress || []).find((x) => x.learning_content_id === contentId);
    return p?.status || 'not_started';
  };

  const handleUpdateProgress = async (contentId, status) => {
    try {
      await api.patch('/learning/progress', { learning_content_id: contentId, status });
      loadProgress();
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleAddCert = () => {
    setCertForm({ title: '', issuer: '', date: '', expiry: '' });
    setCertError(null);
    setAddOpen(true);
  };

  const handleSaveNewCert = async () => {
    if (!certForm.title?.trim() || !certForm.issuer?.trim()) {
      setCertError('Title and Issuer are required.');
      return;
    }
    setSaving(true);
    setCertError(null);
    try {
      const newCert = {
        title: (certForm.title || '').trim(),
        issuer: (certForm.issuer || '').trim(),
        date: (certForm.date || '').trim() || null,
        expiry: (certForm.expiry || '').trim() || null,
      };
      await api.patch('/users/me', { certifications: [...certifications, newCert] });
      setCertifications((prev) => [...prev, newCert]);
      setAddOpen(false);
    } catch (err) {
      setCertError(err.response?.data?.detail || 'Failed to add certification.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCert = async (index) => {
    const updated = certifications.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await api.patch('/users/me', { certifications: updated });
      setCertifications(updated);
    } catch (err) {
      console.error('Failed to delete certification:', err);
    } finally {
      setSaving(false);
    }
  };

  const skillGaps = data.skill_gaps || [];
  const roleCerts = data.role_based_certifications || [];
  const learningPaths = data.learning_paths || [];
  const compliancePolicies = data.compliance_policies || [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Typography variant="h5" gutterBottom>
        Learning & Certifications
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Skill growth and upskilling: catalog, assigned trainings, certification tracking, completion status, and AI-powered recommendations.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label="Learning catalog" />
        <Tab label="Assigned trainings" />
        <Tab label="My certifications" />
        <Tab label="Skill gap view" />
        <Tab label="AI recommendations" />
      </Tabs>

      {tab === TAB_KEYS.catalog && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Level</InputLabel>
              <Select
                value={levelFilter}
                label="Level"
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {catalogLoading ? (
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          ) : catalog.length === 0 ? (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No learning content in catalog.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {catalog.map((content) => {
                const status = getStatus(content.id);
                return (
                  <Paper key={content.id} elevation={2} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">{content.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{content.description}</Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip label={content.level} size="small" />
                          {Array.isArray(content.tags) && content.tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In progress' : 'Not started'}
                          color={status === 'completed' ? 'success' : status === 'in_progress' ? 'primary' : 'default'}
                          size="small"
                        />
                        {status !== 'completed' && (
                          <>
                            {status !== 'in_progress' && (
                              <Button size="small" variant="outlined" onClick={() => handleUpdateProgress(content.id, 'in_progress')}>
                                Start
                              </Button>
                            )}
                            <Button size="small" variant="contained" startIcon={<CheckCircleOutlineIcon />} onClick={() => handleUpdateProgress(content.id, 'completed')}>
                              Mark complete
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {tab === TAB_KEYS.assigned && (
        <Box>
          {assignedLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
          ) : assigned.length === 0 ? (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No assigned trainings.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {assigned.map((a) => (
                <Paper key={a.id} elevation={2} sx={{ p: 2 }}>
                  {a.content && (
                    <>
                      <Typography variant="subtitle1" fontWeight="medium">{a.content.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{a.content.description}</Typography>
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {a.due_date && (
                          <Chip size="small" label={`Due: ${format(new Date(a.due_date), 'MMM d, yyyy')}`} />
                        )}
                        <Chip size="small" label={getStatus(a.learning_content_id) === 'completed' ? 'Completed' : getStatus(a.learning_content_id) === 'in_progress' ? 'In progress' : 'Not started'} color={getStatus(a.learning_content_id) === 'completed' ? 'success' : 'default'} />
                        {getStatus(a.learning_content_id) !== 'completed' && (
                          <Button size="small" variant="contained" onClick={() => handleUpdateProgress(a.learning_content_id, 'completed')}>
                            Mark complete
                          </Button>
                        )}
                      </Box>
                    </>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}

      {tab === TAB_KEYS.certs && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>My certifications (tracking)</Typography>
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Add or remove earned certifications.</Typography>
              <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" size="small" onClick={handleAddCert} disabled={saving}>Add certification</Button>
            </Box>
            {certifications.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No certifications added yet.</Typography>
            ) : (
              <List dense disablePadding>
                {certifications.map((cert, idx) => (
                  <ListItem key={idx} sx={{ px: 0 }} secondaryAction={
                    <IconButton edge="end" size="small" onClick={() => handleDeleteCert(idx)} disabled={saving} aria-label="Delete">
                      <DeleteOutlineIcon />
                    </IconButton>
                  }>
                    <ListItemText
                      primary={cert.title || 'Untitled'}
                      secondary={[cert.issuer && `Issuer: ${cert.issuer}`, cert.date && `Date: ${cert.date}`, cert.expiry && `Expiry: ${cert.expiry}`].filter(Boolean).join(' · ') || '—'}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Certifications for your role (AI)</Typography>
          <Paper elevation={2} sx={{ p: 2 }}>
            {roleCerts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No role-based suggestions.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {roleCerts.map((name, idx) => (
                  <Chip key={idx} label={name} size="small" icon={<SchoolIcon />} />
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {tab === TAB_KEYS.skillGap && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Skills to develop (based on your role and recommendations)</Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
          ) : skillGaps.length === 0 ? (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No skill gaps identified.</Typography>
            </Paper>
          ) : (
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {skillGaps.map((skill, idx) => (
                  <Chip key={idx} label={skill} variant="outlined" />
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {tab === TAB_KEYS.ai && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Personalized learning paths</Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
            ) : learningPaths.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No paths yet.</Typography>
            ) : (
              learningPaths.map((path, idx) => (
                <Paper key={idx} elevation={2} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>{path.name}</Typography>
                  <List dense>
                    {(path.steps || []).map((step, i) => (
                      <ListItem key={i}>
                        <ListItemText primary={`${step.order}. ${step.content?.title || '—'}`} secondary={step.content?.description} />
                        <Chip size="small" label={getStatus(step.content?.id) === 'completed' ? 'Done' : getStatus(step.content?.id) === 'in_progress' ? 'In progress' : 'Not started'} color={getStatus(step.content?.id) === 'completed' ? 'success' : 'default'} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ))
            )}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Role-based certifications</Typography>
            <Paper elevation={2} sx={{ p: 2 }}>
              {roleCerts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">None for your role.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {roleCerts.map((name, idx) => (
                    <Chip key={idx} label={name} size="small" />
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Compliance-mandatory courses</Typography>
            {compliancePolicies.length === 0 ? (
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No compliance policies due.</Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {compliancePolicies.map((p) => (
                  <Paper key={p.id} elevation={2} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium">{p.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{p.description}</Typography>
                    <Chip size="small" label={`Due: ${format(new Date(p.due_date), 'MMM d, yyyy')}`} color="warning" sx={{ mt: 1 }} />
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add certification</DialogTitle>
        <DialogContent>
          {certError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCertError(null)}>{certError}</Alert>}
          <TextField fullWidth label="Title" value={certForm.title} onChange={(e) => setCertForm((f) => ({ ...f, title: e.target.value }))} margin="dense" placeholder="e.g. AWS Certified Developer" required />
          <TextField fullWidth label="Issuer" value={certForm.issuer} onChange={(e) => setCertForm((f) => ({ ...f, issuer: e.target.value }))} margin="dense" placeholder="e.g. Amazon Web Services" required />
          <TextField fullWidth label="Date" value={certForm.date} onChange={(e) => setCertForm((f) => ({ ...f, date: e.target.value }))} margin="dense" placeholder="YYYY-MM" />
          <TextField fullWidth label="Expiry" value={certForm.expiry} onChange={(e) => setCertForm((f) => ({ ...f, expiry: e.target.value }))} margin="dense" placeholder="Optional" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNewCert} disabled={saving}>{saving ? 'Saving...' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Learning;
