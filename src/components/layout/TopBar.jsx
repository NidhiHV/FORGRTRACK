import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function TopBar() {
  const location = useLocation();
  const [name, setName] = useState(localStorage.getItem('ft_name') || 'Nidhi H V');
  const [email, setEmail] = useState(localStorage.getItem('ft_email') || 'nidhiharish99@gmail.com');

  useEffect(() => {
    const handler = () => {
      setName(localStorage.getItem('ft_name') || 'Nidhi H V');
      setEmail(localStorage.getItem('ft_email') || 'nidhiharish99@gmail.com');
    };
    window.addEventListener('ft_settings_changed', handler);
    return () => window.removeEventListener('ft_settings_changed', handler);
  }, []);

  const getBreadcrumb = () => {
    switch(location.pathname) {
      case '/dashboard':  return 'Overview / Dashboard';
      case '/attendance': return 'Activity / Mark Attendance';
      case '/history':    return 'Activity / Student History';
      case '/materials':  return 'Resources / Materials';
      case '/upload':     return 'Data / Upload CSV';
      case '/reports':    return 'Data / Reports';
      case '/sessions':   return 'Activity / Sessions';
      case '/students':   return 'Students / Manage';
      case '/settings':   return 'Account / Settings';
      default:            return 'Overview / Dashboard';
    }
  };

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="h-20 border-b border-subtle flex items-center justify-between px-12 z-10 sticky top-0 bg-void/80 backdrop-blur-md">
      <div className="text-body-lg text-primary font-medium">{getBreadcrumb()}</div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="input h-10 w-64 bg-surface/50 border-subtle rounded-full px-4 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 border-l border-subtle pl-6">
          <div className="text-right">
            <div className="text-body-sm text-primary font-medium">{email}</div>
            <div className="text-caption text-secondary">Mentor</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent-glow/20 border border-accent-glow/30 flex items-center justify-center text-accent-glow font-semibold text-sm">
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
}
