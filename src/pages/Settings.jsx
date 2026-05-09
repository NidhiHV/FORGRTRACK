import { useState, useEffect } from 'react';
import { User, Bell, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: localStorage.getItem('ft_name') || 'Nidhi H V',
    email: localStorage.getItem('ft_email') || 'nidhiharish99@gmail.com',
    role: 'Mentor',
  });

  const [notifs, setNotifs] = useState({
    lowAttendance: localStorage.getItem('ft_notif_low') !== 'false',
    threshold: parseInt(localStorage.getItem('ft_threshold') || '75'),
  });

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate save
    localStorage.setItem('ft_name', profile.name);
    localStorage.setItem('ft_email', profile.email);
    localStorage.setItem('ft_notif_low', notifs.lowAttendance);
    localStorage.setItem('ft_threshold', notifs.threshold);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // Force a page reload to reflect name/email changes in TopBar
    window.dispatchEvent(new Event('ft_settings_changed'));
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-display-sm text-primary mb-1">Settings</h1>
        <p className="text-body text-secondary">Manage your profile and app preferences.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Section */}
        <div className="card border border-subtle space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-subtle">
            <div className="w-10 h-10 rounded-full bg-accent-glow/20 border border-accent-glow/30 flex items-center justify-center">
              <User size={20} className="text-accent-glow" />
            </div>
            <h2 className="text-h3 text-primary">Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-label text-tertiary">DISPLAY NAME</label>
              <input
                required
                value={profile.name}
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="input"
                placeholder="Your name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label text-tertiary">EMAIL</label>
              <input
                required
                type="email"
                value={profile.email}
                onChange={e => setProfile({...profile, email: e.target.value})}
                className="input"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label text-tertiary">ROLE</label>
            <input
              disabled
              value={profile.role}
              className="input opacity-50 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Notifications Section */}
        <div className="card border border-subtle space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-subtle">
            <div className="w-10 h-10 rounded-full bg-warning-bg border border-warning-border flex items-center justify-center">
              <Bell size={20} className="text-warning-fg" />
            </div>
            <h2 className="text-h3 text-primary">Alerts & Notifications</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-medium text-primary">Low Attendance Alerts</p>
              <p className="text-body-sm text-secondary">Highlight students below the attendance threshold on the Dashboard.</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifs({...notifs, lowAttendance: !notifs.lowAttendance})}
              className={`w-12 h-6 rounded-full transition-colors relative ${notifs.lowAttendance ? 'bg-accent-glow' : 'bg-surface-inset border border-subtle'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifs.lowAttendance ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {notifs.lowAttendance && (
            <div className="flex flex-col gap-1">
              <label className="text-label text-tertiary">ALERT THRESHOLD (%)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="90"
                  step="5"
                  value={notifs.threshold}
                  onChange={e => setNotifs({...notifs, threshold: parseInt(e.target.value)})}
                  className="flex-1 accent-indigo-500"
                />
                <span className="text-h3 font-mono text-primary w-12 text-right">{notifs.threshold}%</span>
              </div>
              <p className="text-caption text-tertiary">Students below {notifs.threshold}% will be flagged in red.</p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving || saved} className="btn-primary flex items-center gap-2 min-w-[140px] justify-center">
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} className="text-success-fg" /> : <Save size={16} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
          {saved && <span className="text-success-fg text-body-sm">Your preferences have been updated.</span>}
        </div>
      </form>
    </div>
  );
}
