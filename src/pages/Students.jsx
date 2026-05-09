import { useState, useEffect } from 'react';
import { Plus, Trash2, UserCheck, UserX, Search, Loader2, X, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [form, setForm] = useState({ name: '', usn: '', branch_code: '', email: '', batch: '2024-2028' });

  useEffect(() => { fetchStudents(); }, []);

  async function fetchStudents() {
    setLoading(true);
    const { data } = await supabase.from('students').select('*').order('name');
    setStudents(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('students').insert([{ ...form, is_active: true }]).select().single();
      if (error) throw error;
      setStudents([...students, data].sort((a, b) => a.name.localeCompare(b.name)));
      setIsModalOpen(false);
      setForm({ name: '', usn: '', branch_code: '', email: '', batch: '2024-2028' });
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(student) {
    setToggling(student.id);
    const { data } = await supabase.from('students').update({ is_active: !student.is_active }).eq('id', student.id).select().single();
    setStudents(students.map(s => s.id === student.id ? data : s));
    setToggling(null);
  }

  async function handleDelete(id) {
    if (!confirm('Permanently delete this student and all their attendance records?')) return;
    setDeleting(id);
    await supabase.from('students').delete().eq('id', id);
    setStudents(students.filter(s => s.id !== id));
    setDeleting(null);
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.usn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-display-sm text-primary mb-1">Students</h1>
          <p className="text-body text-secondary">{students.length} total · {students.filter(s => s.is_active).length} active</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Student
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" size={16} />
        <input type="text" placeholder="Search by name or USN..." value={search} onChange={e => setSearch(e.target.value)} className="input w-full pl-11" />
      </div>

      <div className="card p-0 overflow-hidden border border-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-surface-raised">
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">NAME</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">USN</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">BRANCH</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">BATCH</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle">STATUS</th>
                <th className="py-4 px-6 text-label text-tertiary border-b border-subtle text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr><td colSpan="6" className="py-12 text-center text-secondary"><Loader2 size={24} className="animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-secondary">No students found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className={`hover:bg-surface-raised transition-colors ${!s.is_active ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6 text-body font-medium text-primary">{s.name}</td>
                  <td className="py-4 px-6 font-mono text-body-sm text-secondary">{s.usn}</td>
                  <td className="py-4 px-6 text-body-sm text-secondary">{s.branch_code}</td>
                  <td className="py-4 px-6 text-body-sm text-secondary">{s.batch || '—'}</td>
                  <td className="py-4 px-6">
                    <span className={`pill text-xs ${s.is_active ? 'pill-success' : 'bg-surface-inset text-tertiary border border-subtle'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleToggle(s)} disabled={toggling === s.id} title={s.is_active ? 'Deactivate' : 'Activate'} className="p-2 rounded-lg hover:bg-surface-inset text-tertiary hover:text-primary transition-colors">
                        {toggling === s.id ? <Loader2 size={16} className="animate-spin" /> : s.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} title="Delete" className="p-2 rounded-lg hover:bg-danger-bg text-tertiary hover:text-danger-fg transition-colors">
                        {deleting === s.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-default rounded-2xl shadow-2xl p-8 max-w-[480px] w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-h2 text-primary">Add Student</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-tertiary hover:text-primary"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-5">
              <div className="flex flex-col gap-1">
                <label className="text-label text-tertiary">FULL NAME</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Rahul Kumar" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-label text-tertiary">USN</label>
                  <input required value={form.usn} onChange={e => setForm({...form, usn: e.target.value.toUpperCase()})} placeholder="e.g. 4SH24CS001" className="input font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label text-tertiary">BRANCH</label>
                  <select value={form.branch_code} onChange={e => setForm({...form, branch_code: e.target.value})} className="input appearance-none">
                    <option value="">Select...</option>
                    {['CS','AI','IS','EC','EE','ME','CV','BT'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label text-tertiary">EMAIL (OPTIONAL)</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="student@example.com" className="input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-label text-tertiary">BATCH</label>
                <input value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} placeholder="2024-2028" className="input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Adding...' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
