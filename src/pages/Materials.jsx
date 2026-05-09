import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Video, Link as LinkIcon, FileDown } from 'lucide-react';

export default function Materials() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  // Form state
  const [sessionId, setSessionId] = useState('');
  const [type, setType] = useState('document');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sessionRes, materialRes] = await Promise.all([
          supabase.from('sessions').select('*').order('date', { ascending: false }),
          supabase.from('materials').select('*, sessions(topic, date)').order('created_at', { ascending: false })
        ]);
        
        setSessions(sessionRes.data || []);
        setMaterials(materialRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!sessionId || !title || !url) return;
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('materials').insert([
        {
          session_id: parseInt(sessionId),
          title,
          type,
          url
        }
      ]).select('*, sessions(topic, date)').single();

      if (error) throw error;

      setMaterials([data, ...materials]);
      setIsModalOpen(false);
      setTitle('');
      setUrl('');
      setSessionId('');
    } catch (err) {
      console.error(err);
      alert("Failed to add material");
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'slides': return <FileText size={24} className="text-info-fg" />;
      case 'recording': return <Video size={24} className="text-danger-fg" />;
      case 'link': return <LinkIcon size={24} className="text-warning-fg" />;
      default: return <FileDown size={24} className="text-success-fg" />;
    }
  };

  return (
    <div className="space-y-8 relative">
      <header className="flex justify-between items-center">
        <h1 className="text-display-sm text-primary">Materials</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Add Material</button>
      </header>

      {loading ? (
        <p className="text-secondary">Loading materials...</p>
      ) : materials.length === 0 ? (
        <div className="card text-center p-12">
          <p className="text-body text-secondary">No materials uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <a 
              key={mat.id} 
              href={mat.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="card block hover:border-strong transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-raised flex items-center justify-center group-hover:scale-110 transition-transform">
                  {getIcon(mat.type)}
                </div>
                <span className="pill bg-surface-inset border-subtle text-tertiary capitalize text-[10px]">
                  {mat.type}
                </span>
              </div>
              <p className="text-caption font-mono text-tertiary mb-2">
                {mat.sessions?.date ? new Date(mat.sessions.date).toLocaleDateString() : ''} &bull; {mat.sessions?.topic}
              </p>
              <h3 className="text-h3 text-primary mb-2 line-clamp-2">{mat.title}</h3>
            </a>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="modal bg-surface-raised border border-default rounded-2xl shadow-2xl p-8 max-w-[500px] w-full">
            <h2 className="text-h2 text-primary mb-6">Add New Material</h2>
            
            <form onSubmit={handleAddMaterial} className="space-y-6">
              <div className="flex flex-col">
                <label className="text-label text-tertiary mb-2">SESSION</label>
                <select 
                  required
                  value={sessionId}
                  onChange={e => setSessionId(e.target.value)}
                  className="input bg-surface border-subtle text-primary appearance-none custom-select"
                >
                  <option value="" disabled>Select a session...</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.topic} ({new Date(s.date).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-label text-tertiary mb-2">TYPE</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="input bg-surface border-subtle text-primary appearance-none custom-select"
                >
                  <option value="slides">Slides</option>
                  <option value="recording">Recording</option>
                  <option value="document">Document</option>
                  <option value="link">Link</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-label text-tertiary mb-2">TITLE</label>
                <input 
                  required
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Session 1 Slides" 
                  className="input bg-surface border-subtle"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-label text-tertiary mb-2">URL</label>
                <input 
                  required
                  type="url" 
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://..." 
                  className="input bg-surface border-subtle"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  className="btn-secondary flex-1 border-subtle hover:bg-surface-inset"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn-primary flex-1 bg-white text-void hover:bg-gray-200"
                >
                  {submitting ? 'Adding...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
