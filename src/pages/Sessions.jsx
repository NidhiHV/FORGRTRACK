import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, Wifi, WifiOff, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    topic: '',
    month_number: new Date().getMonth() + 1,
    duration_hours: 2.0,
    session_type: 'offline',
    notes: ''
  });

  useEffect(() => { fetchSessions(); }, []);

  async function fetchSessions() {
    setLoading(true);
    const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false });
    setSessions(data || []);
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('sessions').insert([form]).select().single();
      if (error) throw error;
      setSessions([data, ...sessions]);
      setIsModalOpen(false);
      setForm({ date: new Date().toISOString().split('T')[0], topic: '', month_number: new Date().getMonth() + 1, duration_hours: 2.0, session_type: 'offline', notes: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this session? This will also delete all attendance records for it.')) return;
    setDeleting(id);
    await supabase.from('sessions').delete().eq('id', id);
    setSessions(sessions.filter(s => s.id !== id));
    setDeleting(null);
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-display-sm text-primary mb-1">Sessions</h1>
          <p className="text-body text-secondary">Manage all your class sessions.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Session
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-tertiary" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar size={40} className="mx-auto text-tertiary mb-4 opacity-50" />
          <p className="text-body text-secondary">No sessions yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map(s => (
            <div key={s.id} className="card border border-subtle hover:border-default transition-colors group relative flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className={`pill text-xs ${s.session_type === 'online' ? 'bg-info-bg text-info-fg border border-info-border' : 'bg-surface-raised text-secondary border border-subtle'}`}>
                  {s.session_type === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {s.session_type}
                </span>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-danger-fg hover:bg-danger-bg p-1 rounded-md"
                >
                  {deleting === s.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
              <h3 className="text-h3 text-primary">{s.topic}</h3>
              <div className="mt-auto flex items-center gap-4 text-caption text-tertiary">
                <span className="flex items-center gap-1"><Calendar size={12} />{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{s.duration_hours}h</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-default rounded-2xl shadow-2xl p-8 max-w-[500px] w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-h2 text-primary">New Session</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-tertiary hover:text-primary"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="flex flex-col gap-1">
                <label className="text-label text-tertiary">TOPIC</label>
                <input required value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} placeholder="e.g. Introduction to AI Agents" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-label text-tertiary">DATE</label>
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value, month_number: new Date(e.target.value).getMonth() + 1})} className="input" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label text-tertiary">DURATION (HRS)</label>
                  <input required type="number" step="0.5" min="0.5" max="8" value={form.duration_hours} onChange={e => setForm({...form, duration_hours: parseFloat(e.target.value)})} className="input" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label text-tertiary">TYPE</label>
                <select value={form.session_type} onChange={e => setForm({...form, session_type: e.target.value})} className="input appearance-none">
                  <option value="offline">Offline (In-person)</option>
                  <option value="online">Online (Virtual)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label text-tertiary">NOTES (OPTIONAL)</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any notes about this session..." className="input h-20 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Creating...' : 'Create Session'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
