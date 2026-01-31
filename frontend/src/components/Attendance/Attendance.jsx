import { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import BackToDashboard from '../common/BackToDashboard';
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  subMonths,
  addMonths,
} from 'date-fns';

// Generate random mock attendance for past 3 months (deterministic per month seed)
// Roughly 65% Present, 25% WFH, 10% Absent
const STATUSES = ['Present', 'Present', 'Present', 'Present', 'Present', 'WFH', 'WFH', 'WFH', 'Absent', 'Absent'];
function buildMockAttendanceForMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const seed = year * 12 + month;
  const out = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekend
    const i = (seed * 31 + d * 7) % STATUSES.length;
    out[d] = STATUSES[i];
  }
  return out;
}

function getPastThreeMonthsMockData() {
  const now = new Date();
  const data = {};
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    data[ym] = buildMockAttendanceForMonth(d.getFullYear(), d.getMonth() + 1);
  }
  return data;
}

const MOCK_ATTENDANCE = getPastThreeMonthsMockData();

// Pastel (light) shades for calendar and chips
const STATUS_COLORS = {
  Present: { bg: '#e8f5e9', color: '#1b5e20' },
  Absent: { bg: '#ffebee', color: '#b71c1c' },
  WFH: { bg: '#e3f2fd', color: '#0d47a1' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getMonthlyStats = (yearMonth) => {
  const days = MOCK_ATTENDANCE[yearMonth] || {};
  const present = Object.values(days).filter((s) => s === 'Present').length;
  const absent = Object.values(days).filter((s) => s === 'Absent').length;
  const wfh = Object.values(days).filter((s) => s === 'WFH').length;
  return { present, absent, wfh };
};

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const yearMonth = format(selectedDate, 'yyyy-MM');
  const daysInMonth = getDaysInMonth(selectedDate);
  const monthData = MOCK_ATTENDANCE[yearMonth] || {};
  const stats = getMonthlyStats(yearMonth);

  const calendarGrid = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const startWeekday = getDay(start);
    const days = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    const rows = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [selectedDate, daysInMonth]);

  const monthOptions = useMemo(() => {
    const opts = [];
    for (let i = 0; i < 3; i++) {
      const d = subMonths(new Date(), i);
      opts.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') });
    }
    return opts;
  }, []);

  const pieChartData = useMemo(() => {
    const totals = { Present: 0, Absent: 0, WFH: 0 };
    Object.keys(MOCK_ATTENDANCE).forEach((ym) => {
      const s = getMonthlyStats(ym);
      totals.Present += s.present;
      totals.Absent += s.absent;
      totals.WFH += s.wfh;
    });
    return [
      { name: 'Present', value: totals.Present, color: '#81c784' },
      { name: 'Absent', value: totals.Absent, color: '#e57373' },
      { name: 'Work from home', value: totals.WFH, color: '#64b5f6' },
    ].filter((d) => d.value > 0);
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <BackToDashboard />
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Attendance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View your attendance in the calendar. Present, Absent, and Work from Home.
      </Typography>

      <FormControl size="small" sx={{ minWidth: 200, mb: 3 }}>
        <InputLabel>Month</InputLabel>
        <Select
          value={yearMonth}
          label="Month"
          onChange={(e) => setSelectedDate(new Date(e.target.value + '-01'))}
        >
          {monthOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary', mt: 2 }} gutterBottom>
        Monthly statistics
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Chip
          label={`Present: ${stats.present}`}
          sx={{ bgcolor: STATUS_COLORS.Present.bg, color: STATUS_COLORS.Present.color, opacity: 0.95, '&:hover': { opacity: 1 } }}
        />
        <Chip
          label={`Absent: ${stats.absent}`}
          sx={{ bgcolor: STATUS_COLORS.Absent.bg, color: STATUS_COLORS.Absent.color, opacity: 0.95, '&:hover': { opacity: 1 } }}
        />
        <Chip
          label={`Work from home: ${stats.wfh}`}
          sx={{ bgcolor: STATUS_COLORS.WFH.bg, color: STATUS_COLORS.WFH.color, opacity: 0.95, '&:hover': { opacity: 1 } }}
        />
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {WEEKDAYS.map((day) => (
            <Box
              key={day}
              sx={{
                width: 'calc(14.28% - 4px)',
                minWidth: 36,
                textAlign: 'center',
                py: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {day}
              </Typography>
            </Box>
          ))}
          {calendarGrid.flatMap((row) =>
            row.map((d, i) => {
              const status = d != null ? monthData[d] : null;
              const colors = status ? STATUS_COLORS[status] : { bg: 'action.hover', color: 'text.secondary' };
              return (
                <Box
                  key={d ?? `empty-${i}`}
                  sx={{
                    width: 'calc(14.28% - 4px)',
                    minWidth: 36,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: d != null ? colors.bg : 'transparent',
                    color: d != null ? colors.color : 'text.disabled',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                  }}
                >
                  {d ?? ''}
                </Box>
              );
            })
          )}
        </Box>
      </Paper>

      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Light green = Present · Light red = Absent · Light blue = Work from home
        </Typography>
      </Box>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
        Past 3 months statistics
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        {pieChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Days']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">No attendance data for past 3 months</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Attendance;
