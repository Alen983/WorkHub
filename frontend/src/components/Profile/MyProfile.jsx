import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Chip,
  Skeleton,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  IconButton,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BackToDashboard from '../common/BackToDashboard';
import api from '../../services/api';
import { format } from 'date-fns';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2) || '?').toUpperCase();
};

const roleColor = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'manager') return 'primary';
  if (r === 'hr') return 'secondary';
  return 'default';
};

const SectionCard = ({ title, children }) => (
  <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const LabelValue = ({ label, value }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1">{value || '—'}</Typography>
  </Box>
);

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [managers, setManagers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('certificate');

  const loadProfile = async () => {
    setError(null);
    try {
      const res = await api.get('/users/me');
      const d = res.data;
      setProfile(d);
      const prefs = d.career_preferences || {};
      setEditForm({
        name: d.name,
        phone: d.phone || '',
        address: d.address || '',
        manager_id: d.manager_id ?? '',
        skills: d.skills || [],
        interests: d.interests || [],
        certifications: Array.isArray(d.certifications) && d.certifications.length
          ? d.certifications.map((c) => ({
              title: c.title || '',
              issuer: c.issuer || '',
              date: c.date || '',
              expiry: c.expiry || '',
            }))
          : [{ title: '', issuer: '', date: '', expiry: '' }],
        career_preferences: {
          current_role: prefs.current_role || '',
          goals: Array.isArray(prefs.goals) ? prefs.goals.join(', ') : (prefs.goals || ''),
          preferred_roles: Array.isArray(prefs.preferred_roles) ? prefs.preferred_roles.join(', ') : (prefs.preferred_roles || ''),
          work_prefs: prefs.work_prefs || '',
        },
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.detail || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      const res = await api.get('/users/managers');
      setManagers(res.data || []);
    } catch {
      setManagers([]);
    }
  };

  const loadDocuments = async () => {
    setDocLoading(true);
    try {
      const res = await api.get('/users/me/documents');
      setDocuments(res.data || []);
    } catch {
      setDocuments([]);
    } finally {
      setDocLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile && !loading) loadDocuments();
  }, [profile, loading]);

  useEffect(() => {
    if (editOpen) loadManagers();
  }, [editOpen]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const certs = (editForm.certifications || []).filter((c) => c.title || c.issuer);
      const prefs = editForm.career_preferences || {};
      const payload = {
        name: editForm.name,
        phone: editForm.phone || null,
        address: editForm.address || null,
        manager_id: editForm.manager_id === '' || editForm.manager_id == null ? null : Number(editForm.manager_id),
        skills: Array.isArray(editForm.skills) ? editForm.skills : (editForm.skills || '').toString().split(',').map((s) => s.trim()).filter(Boolean),
        interests: Array.isArray(editForm.interests) ? editForm.interests : (editForm.interests || '').toString().split(',').map((s) => s.trim()).filter(Boolean),
        certifications: certs,
        career_preferences: {
          current_role: (prefs.current_role || '').toString().trim() || null,
          goals: (prefs.goals || '').toString().split(',').map((s) => s.trim()).filter(Boolean),
          preferred_roles: (prefs.preferred_roles || '').toString().split(',').map((s) => s.trim()).filter(Boolean),
          work_prefs: prefs.work_prefs || '',
        },
      };
      const res = await api.patch('/users/me', payload);
      setProfile(res.data);
      setEditOpen(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const addCertification = () => {
    setEditForm((f) => ({
      ...f,
      certifications: [...(f.certifications || []), { title: '', issuer: '', date: '', expiry: '' }],
    }));
  };

  const updateCertification = (index, field, value) => {
    setEditForm((f) => {
      const list = [...(f.certifications || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...f, certifications: list };
    });
  };

  const removeCertification = (index) => {
    setEditForm((f) => ({
      ...f,
      certifications: (f.certifications || []).filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);
      await api.post('/users/me/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      loadDocuments();
      e.target.value = '';
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const viewDocument = async (docId) => {
    try {
      const res = await api.get(`/users/me/documents/${docId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error('Failed to load document:', err);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <BackToDashboard />
        <Skeleton variant="text" width={200} height={40} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Skeleton variant="circular" width={80} height={80} />
          <Box>
            <Skeleton variant="text" width={180} />
            <Skeleton variant="text" width={120} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" height={120} sx={{ mt: 2 }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <BackToDashboard />
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={loadProfile}>Retry</Button>
      </Container>
    );
  }

  if (!profile) return null;

  const interests = profile.interests || [];
  const certifications = profile.certifications || [];
  const prefs = profile.career_preferences || {};

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight={600}>
          My Profile
        </Typography>
        <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setEditOpen(true)}>
          Edit profile
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        This profile feeds your personalized learning and career recommendations.
      </Alert>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Avatar sx={{ bgcolor: 'rgba(230, 81, 0, 0.85)', width: 80, height: 80 }}>
          {getInitials(profile.name)}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={600}>{profile.name}</Typography>
          <Chip label={profile.role} color={roleColor(profile.role)} size="small" sx={{ mt: 0.5, mr: 1 }} />
          <Typography variant="body2" color="text.secondary">{profile.department}</Typography>
        </Box>
      </Box>

      <SectionCard title="Personal details">
        <LabelValue label="Name" value={profile.name} />
        <LabelValue label="Email" value={profile.email} />
        <LabelValue label="Contact" value={profile.phone} />
        <LabelValue label="Address" value={profile.address} />
      </SectionCard>

      <SectionCard title="Work details">
        <LabelValue label="Role" value={profile.role} />
        <LabelValue label="Department" value={profile.department} />
        <LabelValue label="Manager" value={profile.manager_name} />
      </SectionCard>

      <SectionCard title="Skills and interests">
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Skills</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {(profile.skills || []).length ? profile.skills.map((s) => <Chip key={s} label={s} size="small" />) : <Typography variant="body2" color="text.secondary">No skills listed</Typography>}
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Interests</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {interests.length ? interests.map((i) => <Chip key={i} label={i} size="small" variant="outlined" />) : <Typography variant="body2" color="text.secondary">No interests added</Typography>}
        </Box>
      </SectionCard>

      <SectionCard title="Certifications">
        {certifications.length ? (
          <List dense>
            {certifications.map((c, idx) => (
              <ListItem key={idx}>
                <ListItemText
                  primary={c.title || 'Untitled'}
                  secondary={c.issuer ? `${c.issuer}${c.date ? ' · ' + c.date : ''}${c.expiry ? ' · Expires ' + c.expiry : ''}` : null}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">No certifications added</Typography>
        )}
      </SectionCard>

      <SectionCard title="Career preferences">
        {prefs && (prefs.goals?.length || prefs.preferred_roles?.length || prefs.work_prefs) ? (
          <Box>
            {prefs.goals?.length ? <LabelValue label="Goals" value={Array.isArray(prefs.goals) ? prefs.goals.join(', ') : prefs.goals} /> : null}
            {prefs.preferred_roles?.length ? <LabelValue label="Preferred roles" value={Array.isArray(prefs.preferred_roles) ? prefs.preferred_roles.join(', ') : prefs.preferred_roles} /> : null}
            {prefs.work_prefs ? <LabelValue label="Work preferences" value={prefs.work_prefs} /> : null}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">No career preferences set</Typography>
        )}
      </SectionCard>

      <SectionCard title="Documents">
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Upload type</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant={uploadType === 'id' ? 'contained' : 'outlined'} size="small" onClick={() => setUploadType('id')}>ID</Button>
            <Button variant={uploadType === 'certificate' ? 'contained' : 'outlined'} size="small" onClick={() => setUploadType('certificate')}>Certificate</Button>
            <label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
              <Button variant="contained" component="span" size="small" disabled={uploading}>
                {uploading ? <CircularProgress size={20} /> : 'Upload'}
              </Button>
            </label>
          </Box>
        </Box>
        {docLoading ? <Typography variant="body2">Loading documents...</Typography> : documents.length ? (
          <List dense>
            {documents.map((doc) => (
              <ListItem key={doc.id}>
                <ListItemText primary={doc.filename} secondary={`${doc.type} · ${doc.uploaded_at ? format(new Date(doc.uploaded_at), 'MMM d, yyyy') : ''}`} />
                <ListItemSecondaryAction>
                  <Button size="small" onClick={() => viewDocument(doc.id)}>View</Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">No documents uploaded</Typography>
        )}
      </SectionCard>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle>Edit profile</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>Personal</Typography>
          <TextField fullWidth label="Name" value={editForm.name || ''} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} margin="dense" />
          <TextField fullWidth label="Email" value={profile?.email || ''} margin="dense" disabled helperText="Contact HR to change email." />
          <TextField fullWidth label="Phone" value={editForm.phone || ''} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} margin="dense" />
          <TextField fullWidth label="Address" multiline rows={2} value={editForm.address || ''} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} margin="dense" />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>Work</Typography>
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel>Manager</InputLabel>
            <Select
              value={editForm.manager_id ?? ''}
              label="Manager"
              onChange={(e) => setEditForm((f) => ({ ...f, manager_id: e.target.value === '' ? '' : e.target.value }))}
            >
              <MenuItem value="">None</MenuItem>
              {managers.map((m) => (
                <MenuItem key={m.id} value={m.id}>{m.name} ({m.department})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>Skills (comma-separated)</Typography>
          <TextField fullWidth value={Array.isArray(editForm.skills) ? editForm.skills.join(', ') : (editForm.skills || '')} onChange={(e) => setEditForm((f) => ({ ...f, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} margin="dense" placeholder="e.g. Python, React" />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>Interests (comma-separated)</Typography>
          <TextField fullWidth value={Array.isArray(editForm.interests) ? editForm.interests.join(', ') : ''} onChange={(e) => setEditForm((f) => ({ ...f, interests: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} margin="dense" placeholder="e.g. AI, Web Development" />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>Certifications</Typography>
          {(editForm.certifications || []).map((cert, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1, flexWrap: 'wrap' }}>
              <TextField size="small" label="Title" value={cert.title || ''} onChange={(e) => updateCertification(idx, 'title', e.target.value)} sx={{ flex: 1, minWidth: 120 }} />
              <TextField size="small" label="Issuer" value={cert.issuer || ''} onChange={(e) => updateCertification(idx, 'issuer', e.target.value)} sx={{ flex: 1, minWidth: 100 }} />
              <TextField size="small" label="Date" value={cert.date || ''} onChange={(e) => updateCertification(idx, 'date', e.target.value)} placeholder="YYYY-MM" sx={{ width: 100 }} />
              <TextField size="small" label="Expiry" value={cert.expiry || ''} onChange={(e) => updateCertification(idx, 'expiry', e.target.value)} placeholder="Optional" sx={{ width: 100 }} />
              <IconButton size="small" onClick={() => removeCertification(idx)} aria-label="Remove"><DeleteOutlineIcon /></IconButton>
            </Box>
          ))}
          <Button startIcon={<AddCircleOutlineIcon />} size="small" onClick={addCertification} sx={{ mb: 2 }}>Add certification</Button>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>Career preferences</Typography>
          <TextField fullWidth label="Current role" value={editForm.career_preferences?.current_role || ''} onChange={(e) => setEditForm((f) => ({ ...f, career_preferences: { ...(f.career_preferences || {}), current_role: e.target.value } }))} margin="dense" placeholder="e.g. Data Scientist, Software Engineer" helperText="Used for your career roadmap" />
          <TextField fullWidth label="Goals (comma-separated)" value={editForm.career_preferences?.goals || ''} onChange={(e) => setEditForm((f) => ({ ...f, career_preferences: { ...(f.career_preferences || {}), goals: e.target.value } }))} margin="dense" placeholder="e.g. Tech Lead, Architect" />
          <TextField fullWidth label="Preferred roles (comma-separated)" value={editForm.career_preferences?.preferred_roles || ''} onChange={(e) => setEditForm((f) => ({ ...f, career_preferences: { ...(f.career_preferences || {}), preferred_roles: e.target.value } }))} margin="dense" placeholder="e.g. Senior Developer" />
          <TextField fullWidth label="Work preferences" value={editForm.career_preferences?.work_prefs || ''} onChange={(e) => setEditForm((f) => ({ ...f, career_preferences: { ...(f.career_preferences || {}), work_prefs: e.target.value } }))} margin="dense" placeholder="e.g. Remote, Hybrid" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyProfile;
