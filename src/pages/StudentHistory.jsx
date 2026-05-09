import { useState, useEffect } from 'react';
import { Search, User, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function StudentHistory() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      try {
        const { data } = await supabase
          .from('students')
          .select('*')
          .order('name');
        setStudents(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      if (!selectedStudent) return;
      setHistoryLoading(true);
      try {
        const { data } = await supabase
          .from('attendance')
          .select(`
            *,
            sessions (*)
          `)
          .eq('student_id', selectedStudent.id)
          .order('marked_at', { ascending: false });
        
        setHistory(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  }, [selectedStudent]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.usn.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = history.filter(h => h.present).length;
  const attendancePercentage = history.length > 0 
    ? Math.round((presentCount / history.length) * 100) 
    : 0;

  return (
    <div className="space-y-8 h-full flex flex-col">
      <header>
        <h1 className="text-display-sm text-primary">Student History</h1>
      </header>

      <div className="flex flex-col md:flex-row gap-8 flex-1 min-h-[500px]">
        {/* Left List */}
        <div className="w-full md:w-[320px] flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" size={16} />
            <input 
              type="text" 
              placeholder="Search USN or Name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-11 bg-surface-inset"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-[600px]">
            {loading ? (
              <p className="text-secondary text-center py-4">Loading students...</p>
            ) : filteredStudents.map((s) => {
              const isSelected = selectedStudent?.id === s.id;
              return (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-subtle bg-surface-raised border-l-[3px] border-l-accent-glow' 
                      : 'border-subtle bg-surface hover:bg-surface-raised'
                  }`}
                >
                  <div className="text-body font-medium text-primary mb-1">{s.name}</div>
                  <div className="text-caption font-mono text-tertiary">{s.usn}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel View */}
        <div className="flex-1 card flex flex-col border border-subtle overflow-hidden p-0">
          {!selectedStudent ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <User size={48} className="text-tertiary mb-4 opacity-50" />
              <p className="text-body text-tertiary">Select a student to view history</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Profile Header */}
              <div className="p-8 border-b border-subtle bg-surface-raised">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-display-sm text-primary mb-2">{selectedStudent.name}</h2>
                    <div className="text-body font-mono text-secondary">{selectedStudent.usn} &bull; {selectedStudent.branch_code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-label text-tertiary mb-1">OVERALL</div>
                    <div className="text-h2 font-mono text-primary">{attendancePercentage}%</div>
                  </div>
                </div>
              </div>

              {/* History List */}
              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                <h3 className="text-label text-tertiary mb-6">ATTENDANCE LOG</h3>
                {historyLoading ? (
                  <p className="text-secondary">Loading history...</p>
                ) : history.length === 0 ? (
                  <p className="text-secondary">No attendance records found.</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border border-subtle rounded-xl bg-surface">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            record.present ? 'bg-success-bg text-success-fg' : 'bg-danger-bg text-danger-fg'
                          }`}>
                            {record.present ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                          </div>
                          <div>
                            <div className="text-body font-medium text-primary">{record.sessions?.topic || 'Unknown Session'}</div>
                            <div className="text-caption text-secondary flex items-center gap-1 mt-1">
                              <Calendar size={12} /> {record.sessions?.date ? new Date(record.sessions.date).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`pill ${record.present ? 'pill-success' : 'pill-danger'}`}>
                            {record.present ? 'Present' : 'Absent'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
