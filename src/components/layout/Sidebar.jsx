import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, BookOpen, Upload, BarChart3, Calendar, UserCog, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-body transition-colors ${
      isActive
        ? 'bg-surface-raised text-primary border-l-[2px] border-l-accent-glow'
        : 'text-secondary hover:bg-surface'
    }`;

  return (
    <div className="w-[260px] h-screen fixed left-0 top-0 bg-canvas border-r border-subtle flex flex-col pt-6 pb-6 z-20">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent-glow flex items-center justify-center">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        <span className="text-h2 text-primary font-display">ForgeTrack</span>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        <div>
          <h3 className="text-label text-tertiary px-4 mb-2">OVERVIEW</h3>
          <div className="space-y-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard size={20} /><span>Dashboard</span>
            </NavLink>
          </div>
        </div>

        <div>
          <h3 className="text-label text-tertiary px-4 mb-2">ACTIVITY</h3>
          <div className="space-y-1">
            <NavLink to="/sessions" className={navLinkClass}>
              <Calendar size={20} /><span>Sessions</span>
            </NavLink>
            <NavLink to="/attendance" className={navLinkClass}>
              <CheckSquare size={20} /><span>Mark Attendance</span>
            </NavLink>
            <NavLink to="/history" className={navLinkClass}>
              <Users size={20} /><span>Student History</span>
            </NavLink>
            <NavLink to="/materials" className={navLinkClass}>
              <BookOpen size={20} /><span>Materials</span>
            </NavLink>
          </div>
        </div>

        <div>
          <h3 className="text-label text-tertiary px-4 mb-2">STUDENTS</h3>
          <div className="space-y-1">
            <NavLink to="/students" className={navLinkClass}>
              <UserCog size={20} /><span>Manage Students</span>
            </NavLink>
            <NavLink to="/upload" className={navLinkClass}>
              <Upload size={20} /><span>Upload CSV</span>
            </NavLink>
          </div>
        </div>

        <div>
          <h3 className="text-label text-tertiary px-4 mb-2">DATA</h3>
          <div className="space-y-1">
            <NavLink to="/reports" className={navLinkClass}>
              <BarChart3 size={20} /><span>Reports</span>
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="px-4 mt-auto space-y-1">
        <div className="h-[1px] bg-subtle w-full mb-3"></div>
        <NavLink to="/settings" className={navLinkClass}>
          <Settings size={20} /><span>Settings</span>
        </NavLink>
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-body text-secondary hover:bg-surface w-full transition-colors">
          <LogOut size={20} /><span>Logout</span>
        </button>
      </div>
    </div>
  );
}
