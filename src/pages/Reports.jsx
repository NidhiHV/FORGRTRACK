import { useState, useEffect } from 'react';
import { FileDown, Calendar, Filter, Loader2, FilePen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const years = [2024, 2025, 2026, 2027];

  useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: studentData } = await supabase.from('students').select('*').eq('is_active', true).order('name');
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}-${lastDay}`;
      const { data: sessionData } = await supabase.from('sessions').select('*').gte('date', startDate).lte('date', endDate);
      const sessionIds = sessionData?.map(s => s.id) || [];
      let attendanceData = [];
      if (sessionIds.length > 0) {
        const { data: attData } = await supabase.from('attendance').select('*').in('session_id', sessionIds);
        attendanceData = attData || [];
      }
      setStudents(studentData || []);
      setSessions(sessionData || []);
      setAttendance(attendanceData);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }

  const reportData = students.map(student => {
    const sa = attendance.filter(a => a.student_id === student.id);
    const present = sa.filter(a => a.present).length;
    const total = sessions.length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { usn: student.usn, name: student.name, branch: student.branch_code, present, total, pct };
  });

  const threshold = parseInt(localStorage.getItem('ft_threshold') || '75');

  const handleExportExcel = () => {
    const rows = reportData.map(r => ({ "USN": r.usn, "Name": r.name, "Branch": r.branch, "Present": r.present, "Total Sessions": r.total, "Attendance %": `${r.pct}%` }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Attendance");
    XLSX.writeFile(wb, `Attendance_${months[selectedMonth-1]}_${selectedYear}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ForgeTrack — Attendance Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Period: ${months[selectedMonth-1]} ${selectedYear}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);
    autoTable(doc, {
      startY: 45,
      head: [['USN', 'Name', 'Branch', 'Present', 'Total', '%']],
      body: reportData.map(r => [r.usn, r.name, r.branch, r.present, r.total, `${r.pct}%`]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [99, 102, 241] },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const pct = parseInt(data.cell.raw);
          if (pct < threshold) data.cell.styles.textColor = [244, 63, 94];
          else if (pct >= 85) data.cell.styles.textColor = [16, 185, 129];
        }
      }
    });
    doc.save(`Attendance_${months[selectedMonth-1]}_${selectedYear}.pdf`);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-display-sm text-primary mb-1">Monthly Reports</h1>
          <p className="text-body text-secondary">Analyze and export attendance summaries.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportPDF} disabled={loading || reportData.length === 0} className="btn-secondary flex items-center gap-2 border border-subtle">
            <FilePen size={16}/> Export PDF
          </button>
          <button onClick={handleExportExcel} disabled={loading || reportData.length === 0} className="btn-primary flex items-center gap-2">
            <FileDown size={16}/> Export Excel
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="card py-3 px-4 flex items-center gap-3 border border-subtle bg-surface/50">
          <Calendar size={16} className="text-tertiary" />
          <select className="bg-transparent text-primary outline-none text-body-sm font-medium cursor-pointer" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
            {months.map((m, i) => <option key={m} value={i+1} className="bg-canvas">{m}</option>)}
          </select>
        </div>
        <div className="card py-3 px-4 flex items-center gap-3 border border-subtle bg-surface/50">
          <Filter size={16} className="text-tertiary" />
          <select className="bg-transparent text-primary outline-none text-body-sm font-medium cursor-pointer" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {years.map(y => <option key={y} value={y} className="bg-canvas">{y}</option>)}
          </select>
        </div>
        <div className="card py-3 px-4 border border-subtle bg-surface/50 text-body-sm text-secondary">
          {sessions.length} sessions · {students.length} students
        </div>
      </div>

      {/* Low attendance warning */}
      {!loading && reportData.filter(r => r.pct < threshold && r.total > 0).length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger-bg/50 border border-danger-border">
          <span className="text-danger-fg font-medium text-body-sm">
            ⚠ {reportData.filter(r => r.pct < threshold && r.total > 0).length} student(s) are below the {threshold}% attendance threshold!
          </span>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden border border-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-surface-raised">
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">USN</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">NAME</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">BRANCH</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle text-center">PRESENT</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle text-center">TOTAL</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle text-right">PERCENTAGE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr><td colSpan="6" className="py-12 text-center"><Loader2 size={24} className="animate-spin mx-auto text-tertiary" /></td></tr>
              ) : reportData.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-secondary">No data for this period.</td></tr>
              ) : reportData.map(row => (
                <tr key={row.usn} className={`hover:bg-surface-raised transition-colors ${row.pct < threshold && row.total > 0 ? 'bg-danger-bg/10' : ''}`}>
                  <td className="py-4 px-6 font-mono text-body-sm text-primary">{row.usn}</td>
                  <td className="py-4 px-6 text-body font-medium text-primary">{row.name}</td>
                  <td className="py-4 px-6 text-body-sm text-secondary">{row.branch}</td>
                  <td className="py-4 px-6 text-center font-mono text-body-sm text-primary">{row.present}</td>
                  <td className="py-4 px-6 text-center font-mono text-body-sm text-secondary">{row.total}</td>
                  <td className="py-4 px-6 text-right">
                    <span className={`text-body font-bold font-mono ${row.pct >= 85 ? 'text-success-fg' : row.pct >= threshold ? 'text-warning-fg' : 'text-danger-fg'}`}>
                      {row.pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
