import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import MarkAttendance from './pages/MarkAttendance';
import StudentHistory from './pages/StudentHistory';
import Materials from './pages/Materials';
import Upload from './pages/Upload';
import Reports from './pages/Reports';
import Sessions from './pages/Sessions';
import Students from './pages/Students';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="sessions"   element={<Sessions />} />
          <Route path="attendance" element={<MarkAttendance />} />
          <Route path="history"    element={<StudentHistory />} />
          <Route path="materials"  element={<Materials />} />
          <Route path="students"   element={<Students />} />
          <Route path="upload"     element={<Upload />} />
          <Route path="reports"    element={<Reports />} />
          <Route path="settings"   element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
