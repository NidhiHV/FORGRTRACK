import { useState, useEffect } from 'react';
import { Calendar, XCircle, CheckCircle2, Save, CheckCheck, XSquare, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function MarkAttendance() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.from('sessions').select('*').order('date', { ascending: false });
        setSessions(sessionData || []);
        if (sessionData && sessionData.length > 0) setSelectedSession(sessionData[0]);
        const { data: studentData } = await supabase.from('students').select('*').eq('is_active', true).order('name');
        setStudents(studentData || []);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function fetchAttendance() {
      if (!selectedSession) return;
      const { data } = await supabase.from('attendance').select('*').eq('session_id', selectedSession.id);
      const newMap = {};
      if (data) data.forEach(r => { newMap[r.student_id] = r.present; });
      setAttendanceState(newMap);
    }
    fetchAttendance();
  }, [selectedSession]);

  const toggleAttendance = (id) => setAttendanceState(prev => ({ ...prev, [id]: prev[id] === undefined ? true : !prev[id] }));

  // Bulk actions
  const markAllPresent = () => {
    const all = {};
    students.forEach(s => { all[s.id] = true; });
    setAttendanceState(all);
  };
  const markAllAbsent = () => {
    const all = {};
    students.forEach(s => { all[s.id] = false; });
    setAttendanceState(all);
  };

  const saveAttendance = async () => {
    if (!selectedSession) return;
    setSaving(true);
    try {
      const payload = students.map(s => ({
        student_id: s.id,
        session_id: selectedSession.id,
        present: attendanceState[s.id] || false,
        marked_by: localStorage.getItem('ft_name') || 'Mentor',
        marked_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'student_id, session_id' });
      if (error) throw error;
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance: ' + err.message);
    } finally { setSaving(false); }
  };

  const presentCount = students.filter(s => attendanceState[s.id]).length;
  const absentCount = students.length - presentCount;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-tertiary" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-display-sm text-primary">Mark Attendance</h1>
        <div className="flex items-center gap-3">
          {savedOk && <span className="text-success-fg text-body-sm flex items-center gap-1"><CheckCircle2 size={16}/> Saved!</span>}
          <button onClick={saveAttendance} disabled={saving || !selectedSession} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>}
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Session selector */}
        <div className="flex-1 card py-4 px-6 border border-subtle">
          <span className="text-label text-tertiary mb-2 block">SELECT SESSION</span>
          <div className="relative">
            <select className="input w-full appearance-none pr-10" value={selectedSession?.id || ''}
              onChange={e => setSelectedSession(sessions.find(s => s.id === parseInt(e.target.value)))}>
              {sessions.map(s => <option key={s.id} value={s.id}>{new Date(s.date).toLocaleDateString()} — {s.topic}</option>)}
            </select>
            <Calendar size={16} className="text-tertiary absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="card py-4 px-5 border border-success-border bg-success-bg/10 flex flex-col items-center gap-1">
            <span className="text-label text-tertiary">PRESENT</span>
            <span className="text-h2 font-mono text-primary">{presentCount}</span>
          </div>
          <div className="card py-4 px-5 border border-subtle flex flex-col items-center gap-1">
            <span className="text-label text-tertiary">ABSENT</span>
            <span className="text-h2 font-mono text-primary">{absentCount}</span>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-raised border border-subtle">
        <span className="text-body-sm text-secondary mr-2">Quick Actions:</span>
        <button onClick={markAllPresent} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success-bg text-success-fg text-body-sm font-medium hover:opacity-80 transition-opacity border border-success-border">
          <CheckCheck size={16} /> Mark All Present
        </button>
        <button onClick={markAllAbsent} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger-bg text-danger-fg text-body-sm font-medium hover:opacity-80 transition-opacity border border-danger-border">
          <XSquare size={16} /> Mark All Absent
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden border border-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-surface-raised">
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">USN</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">STUDENT NAME</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">STATUS</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const isPresent = attendanceState[s.id] || false;
                return (
                  <tr key={s.id} className={`border-b border-subtle hover:bg-surface-raised transition-colors ${isPresent ? 'bg-success-bg/5' : ''}`}>
                    <td className="py-5 px-6 font-mono text-body-sm text-primary">{s.usn}</td>
                    <td className="py-5 px-6 text-body font-medium text-primary">{s.name}</td>
                    <td className="py-5 px-6">
                      {isPresent
                        ? <div className="flex items-center gap-2 text-success-fg text-body-sm font-medium"><CheckCircle2 size={16}/> Present</div>
                        : <div className="flex items-center gap-2 text-danger-fg text-body-sm font-medium"><XCircle size={16}/> Absent</div>}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <button onClick={() => toggleAttendance(s.id)} className="text-body-sm font-medium text-secondary hover:text-primary px-3 py-1.5 bg-surface-raised rounded-lg transition-colors">
                        Mark {isPresent ? 'Absent' : 'Present'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && <tr><td colSpan="4" className="py-8 text-center text-secondary">No active students found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
