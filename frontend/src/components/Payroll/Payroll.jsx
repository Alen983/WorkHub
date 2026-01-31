import {
  Container,
  Typography,
  Paper,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import BackToDashboard from '../common/BackToDashboard';
import {
  SALARY_OVERVIEW,
  SALARY_STRUCTURE,
  TAX_DETAILS,
  COMPLIANCE_FORMS,
  PAYSLIPS,
  COMPENSATION_HISTORY,
} from '../../data/mockPayroll';

const formatINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const formatCTC = (n) => `₹${(n / 100000).toFixed(2)} L`;

const Payroll = () => {
  const { basic, hra, specialAllowance, otherAllowances, deductions } = SALARY_STRUCTURE;

  const handleDownload = (url, label) => {
    // Mock: replace with actual download when external API is integrated
    console.log('Download', label, url);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Payroll & Compensation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Trust & financial clarity. View salary, payslips, tax and compliance.
      </Typography>

      {/* Salary overview card */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': { boxShadow: '0 6px 24px rgba(230, 81, 0, 0.1)' },
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', opacity: 0.95 }} gutterBottom>
          Salary overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.9 }}>Current CTC</Typography>
            <Typography variant="h6" sx={{ color: 'text.primary' }}>{formatCTC(SALARY_OVERVIEW.currentCTC)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.9 }}>Net monthly salary</Typography>
            <Typography variant="h6" sx={{ color: 'text.primary' }}>{formatINR(SALARY_OVERVIEW.netMonthly)}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Salary structure (expandable) */}
      <Accordion sx={{ '&:before': { display: 'none' }, mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ opacity: 0.9 }} />}>
          <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>Salary structure</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle2" gutterBottom>Earnings</Typography>
          <List dense>
            <ListItem><ListItemText primary="Basic" secondary={formatCTC(basic)} /></ListItem>
            <ListItem><ListItemText primary="HRA" secondary={formatCTC(hra)} /></ListItem>
            <ListItem><ListItemText primary="Special allowance" secondary={formatCTC(specialAllowance)} /></ListItem>
            <ListItem><ListItemText primary="Other allowances" secondary={formatCTC(otherAllowances)} /></ListItem>
          </List>
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Deductions</Typography>
          <List dense>
            <ListItem><ListItemText primary="PF" secondary={formatCTC(deductions.pf)} /></ListItem>
            <ListItem><ListItemText primary="TDS" secondary={formatCTC(deductions.tds)} /></ListItem>
            {deductions.other > 0 && (
              <ListItem><ListItemText primary="Other" secondary={formatCTC(deductions.other)} /></ListItem>
            )}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Tax details */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mt: 2,
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>Tax details</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box><Typography variant="body2" color="text.secondary">Financial year</Typography><Typography variant="body1">{TAX_DETAILS.financialYear}</Typography></Box>
          <Box><Typography variant="body2" color="text.secondary">Taxable income</Typography><Typography variant="body1">{formatINR(TAX_DETAILS.taxableIncome)}</Typography></Box>
          <Box><Typography variant="body2" color="text.secondary">TDS deducted</Typography><Typography variant="body1">{formatINR(TAX_DETAILS.tdsDeducted)}</Typography></Box>
          <Box><Typography variant="body2" color="text.secondary">Tax regime</Typography><Typography variant="body1">{TAX_DETAILS.taxSlab}</Typography></Box>
        </Box>
      </Paper>

      {/* Compliance forms */}
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Compliance forms (PF, TDS, etc.)</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <List dense>
          {COMPLIANCE_FORMS.map((form) => (
            <ListItem
              key={form.id}
              secondaryAction={
                <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleDownload(form.downloadUrl, form.title)}>
                  Download
                </Button>
              }
            >
              <ListItemText primary={form.title} secondary={form.period} />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Payslip list */}
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Payslips</Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell align="right">Net pay</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PAYSLIPS.map((ps) => (
              <TableRow key={ps.id}>
                <TableCell>{ps.month}</TableCell>
                <TableCell align="right">{formatINR(ps.netPay)}</TableCell>
                <TableCell align="right">
                  <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleDownload(ps.downloadUrl, ps.month)}>Download</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Compensation history timeline */}
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Compensation history</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        {COMPENSATION_HISTORY.map((item, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              py: 1,
              borderBottom: i < COMPENSATION_HISTORY.length - 1 ? 1 : 0,
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" fontWeight="medium">{item.year}</Typography>
            <Typography variant="body2">{item.type}: {item.amount}</Typography>
            <Typography variant="body2" color="text.secondary">{item.note}</Typography>
          </Box>
        ))}
      </Paper>

      {/* Payroll FAQs via Echo */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        Have questions? Use the Echo chatbot (bottom-right) for payroll FAQs.
      </Typography>
    </Container>
  );
};

export default Payroll;
