import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload as UploadIcon, FileUp, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, FileText, Sparkles, Hand } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mapCsvColumnsWithAI } from '../lib/gemini';

const ACCEPTED_EXTS = ['.csv', '.xlsx', '.xls'];

function isAccepted(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTS.some(ext => name.endsWith(ext));
}

// Parse any file into { headers, rows }
async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.data.length === 0) return reject(new Error('File is empty.'));
          resolve({ headers: result.meta.fields, rows: result.data });
        },
        error: reject,
      });
    });
  }
  // Excel
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (json.length === 0) return reject(new Error('Excel sheet is empty or has no data rows.'));
        resolve({ headers: Object.keys(json[0]), rows: json });
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function importStudents(rows, mapping, filename) {
  let skipped = 0;
  const toInsert = rows.map(row => {
    const usn = String(row[mapping.usn] || '').trim();
    const name = String(row[mapping.name] || '').trim();
    const branch = String(row[mapping.branch_code] || '').trim() || 'CS';
    if (!usn || !name) { skipped++; return null; }
    return { usn, name, branch_code: branch, is_active: true };
  }).filter(Boolean);

  const { error } = await supabase.from('students').upsert(toInsert, { onConflict: 'usn' });
  if (error) throw error;

  await supabase.from('import_log').insert([{
    filename,
    uploaded_by: localStorage.getItem('ft_name') || 'Mentor',
    total_rows: rows.length,
    imported_rows: toInsert.length,
    skipped_rows: skipped,
    status: 'completed',
    column_mapping: mapping
  }]);

  return { total: rows.length, imported: toInsert.length, skipped };
}

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|parsing|mapping|manual|uploading|success|error
  const [message, setMessage] = useState('');
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // For manual mapping
  const [parsedData, setParsedData] = useState(null); // { headers, rows }
  const [manualMapping, setManualMapping] = useState({ name: '', usn: '', branch_code: '' });

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!isAccepted(selectedFile)) {
      setStatus('error');
      setMessage('Unsupported format. Please upload CSV, XLSX, or XLS.');
      return;
    }
    setFile(selectedFile);
    setStatus('idle');
    setMessage('');
    setResults(null);
    setParsedData(null);
    setManualMapping({ name: '', usn: '', branch_code: '' });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const processFile = async () => {
    if (!file) return;
    try {
      setStatus('parsing');
      setMessage('Reading file...');
      const { headers, rows } = await parseFile(file);
      setParsedData({ headers, rows });

      setStatus('mapping');
      setMessage('AI is detecting column names...');
      try {
        const mapping = await mapCsvColumnsWithAI(headers, rows[0]);
        if (mapping.name && mapping.usn && mapping.branch_code) {
          // AI worked! Go straight to upload
          setStatus('uploading');
          setMessage('Importing students...');
          const res = await importStudents(rows, mapping, file.name);
          setStatus('success');
          setResults(res);
          return;
        }
      } catch (_) {
        // AI failed — fall through to manual
      }

      // Fall back to manual mapping
      setManualMapping({ name: headers[0] || '', usn: headers[1] || '', branch_code: headers[2] || '' });
      setStatus('manual');
      setMessage('');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Failed to read the file.');
    }
  };

  const handleManualImport = async () => {
    if (!manualMapping.name || !manualMapping.usn || !manualMapping.branch_code) {
      alert('Please select all three column mappings.');
      return;
    }
    if (!parsedData) return;
    try {
      setStatus('uploading');
      setMessage('Importing students...');
      const res = await importStudents(parsedData.rows, manualMapping, file.name);
      setStatus('success');
      setResults(res);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  const isProcessing = ['parsing', 'mapping', 'uploading'].includes(status);

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1 className="text-display-sm text-primary mb-2">Upload Student Roster</h1>
        <p className="text-body text-secondary">Upload CSV or Excel files. AI auto-detects columns, with a manual fallback if needed.</p>
      </header>

      <div className="flex gap-3 flex-wrap">
        {['CSV (.csv)', 'Excel (.xlsx)', 'Excel 97-2003 (.xls)'].map(f => (
          <span key={f} className="pill border text-xs px-3 py-1 text-accent-glow border-accent-glow/30 bg-accent-glow/10">{f}</span>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => document.getElementById('fileUpload').click()}
        className={`card border-2 border-dashed transition-all bg-surface/50 p-12 flex flex-col items-center justify-center text-center cursor-pointer rounded-2xl
          ${dragOver ? 'border-accent-glow bg-accent-glow/5' : 'border-subtle hover:border-accent-glow/50'}`}
      >
        {file
          ? <FileSpreadsheet size={48} className="text-success-fg mb-4" />
          : <UploadIcon size={48} className="text-tertiary mb-4" />
        }
        {file ? (
          <>
            <h3 className="text-h3 text-primary mb-1">File Ready</h3>
            <div className="flex items-center gap-3 bg-surface-raised border border-subtle px-4 py-2 rounded-lg mt-2">
              <FileUp size={16} className="text-accent-glow" />
              <span className="text-body-sm text-primary font-medium">{file.name}</span>
              <span className="text-caption text-tertiary">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <p className="text-body-sm text-secondary mt-3">Click to change file</p>
          </>
        ) : (
          <>
            <h3 className="text-h3 text-primary mb-2">Drag & Drop your file here</h3>
            <p className="text-body-sm text-secondary">or click to browse — CSV, XLSX, XLS supported</p>
          </>
        )}
        <input id="fileUpload" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />
      </div>

      <div className="flex justify-end gap-3">
        {file && !isProcessing && (
          <button onClick={() => { setFile(null); setStatus('idle'); setResults(null); setParsedData(null); }} className="btn-secondary border border-subtle">Clear</button>
        )}
        <button onClick={processFile} disabled={!file || isProcessing || status === 'manual'} className="btn-primary min-w-[140px] flex items-center justify-center gap-2">
          {isProcessing && <Loader2 size={16} className="animate-spin" />}
          {isProcessing ? 'Processing...' : 'Start Import'}
        </button>
      </div>

      {/* Manual Column Mapper */}
      {status === 'manual' && parsedData && (
        <div className="card border border-warning-border bg-warning-bg/10 space-y-6">
          <div className="flex items-center gap-3">
            <Hand size={22} className="text-warning-fg flex-shrink-0" />
            <div>
              <h3 className="text-h3 text-primary">Manual Column Mapping</h3>
              <p className="text-body-sm text-secondary mt-0.5">AI couldn't auto-detect your columns. Please manually select which column matches each field.</p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-surface-inset rounded-xl p-4 overflow-x-auto">
            <p className="text-label text-tertiary mb-3">DETECTED COLUMNS (from your file):</p>
            <div className="flex flex-wrap gap-2">
              {parsedData.headers.map(h => (
                <span key={h} className="pill bg-surface-raised border border-subtle text-secondary text-xs px-3 py-1">{h}</span>
              ))}
            </div>
            <p className="text-caption text-tertiary mt-3">Sample first row: {JSON.stringify(parsedData.rows[0]).slice(0, 120)}...</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { key: 'name', label: 'STUDENT NAME COLUMN', placeholder: 'e.g. Student Name' },
              { key: 'usn', label: 'USN / ROLL NO COLUMN', placeholder: 'e.g. Roll Number' },
              { key: 'branch_code', label: 'BRANCH / DEPT COLUMN', placeholder: 'e.g. Department' },
            ].map(field => (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="text-label text-tertiary">{field.label}</label>
                <select
                  value={manualMapping[field.key]}
                  onChange={e => setManualMapping({ ...manualMapping, [field.key]: e.target.value })}
                  className="input appearance-none bg-surface"
                >
                  <option value="">Select column...</option>
                  {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button onClick={handleManualImport} className="btn-primary w-full flex items-center justify-center gap-2">
            <CheckCircle2 size={18} /> Confirm & Import
          </button>
        </div>
      )}

      {/* Status Banner */}
      {['parsing', 'mapping', 'uploading', 'success', 'error'].includes(status) && (
        <div className={`card p-6 border ${
          status === 'error'   ? 'border-danger-border bg-danger-bg/10' :
          status === 'success' ? 'border-success-border bg-success-bg/10' :
          'border-accent-glow/30 bg-accent-glow/5'
        }`}>
          <div className="flex items-start gap-4">
            {isProcessing && <Loader2 size={24} className="text-accent-glow animate-spin flex-shrink-0" />}
            {status === 'success' && <CheckCircle2 size={24} className="text-success-fg flex-shrink-0" />}
            {status === 'error'   && <AlertTriangle size={24} className="text-danger-fg flex-shrink-0" />}
            <div className="flex-1">
              <h3 className={`text-label mb-1 ${status === 'error' ? 'text-danger-fg' : status === 'success' ? 'text-success-fg' : 'text-accent-glow'}`}>
                {status.toUpperCase()}
              </h3>
              <p className="text-body text-primary">{message}</p>
              {status === 'success' && results && (
                <div className="mt-5 grid grid-cols-3 gap-6">
                  <div><span className="block text-caption text-secondary mb-1">IMPORTED</span><span className="text-h2 text-success-fg font-mono">{results.imported}</span></div>
                  <div><span className="block text-caption text-secondary mb-1">SKIPPED</span><span className="text-h2 text-warning-fg font-mono">{results.skipped}</span></div>
                  <div><span className="block text-caption text-secondary mb-1">TOTAL ROWS</span><span className="text-h2 text-primary font-mono">{results.total}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
