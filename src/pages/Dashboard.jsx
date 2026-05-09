import { useEffect, useState } from 'react';
import { Calendar, Users, Activity, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    overallAttendance: 0,
    activeStudents: 0,
    lastSessionDate: '—'
  });
  const [todaysSession, setTodaysSession] = useState(null);
  const [todaysAttendance, setTodaysAttendance] = useState({
    present: 0,
    total: 0,
    absentStudents: []
  });

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch Students count
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // 2. Fetch Sessions
        const { data: sessions } = await supabase
          .from('sessions')
          .select('*')
          .order('date', { ascending: false });

        // 3. Fetch all attendance for overall %
        const { data: allAttendance } = await supabase
          .from('attendance')
          .select('present');

        // 4. Calculate Stats
        const totalSessions = sessions?.length || 0;
        const lastSessionDate = totalSessions > 0 
          ? new Date(sessions[0].date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
          : '—';
        
        let overallAttendance = 0;
        if (allAttendance && allAttendance.length > 0) {
          const presentCount = allAttendance.filter(a => a.present).length;
          overallAttendance = Math.round((presentCount / allAttendance.length) * 100);
        }

        setStats({
          totalSessions,
          overallAttendance,
          activeStudents: studentCount || 0,
          lastSessionDate
        });

        // 5. Today's Session & Attendance
        const sessionToday = sessions?.find(s => s.date === today);
        if (sessionToday) {
          setTodaysSession(sessionToday);

          const { data: todayAtt } = await supabase
            .from('attendance')
            .select('present, students(name)')
            .eq('session_id', sessionToday.id);

          if (todayAtt && todayAtt.length > 0) {
            const present = todayAtt.filter(a => a.present).length;
            const absentStudents = todayAtt.filter(a => !a.present).map(a => a.students.name);
            setTodaysAttendance({
              present,
              total: todayAtt.length,
              absentStudents
            });
          }
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-display-hero text-primary mb-2">Welcome Back, Nidhi H V</h1>
        <p className="text-body-sm text-secondary">Last login: Just now</p>
      </header>

      {/* Ticker Strip */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-subtle py-4">
        <div className="flex items-center gap-3">
          <Calendar size={16} className="text-tertiary" />
          <span className="text-caption text-tertiary">TOTAL SESSIONS</span>
          <span className="text-body-lg font-semibold text-primary font-mono tabular-nums">
            {loading ? '-' : stats.totalSessions}
          </span>
        </div>
        <div className="w-[1px] h-6 bg-subtle hidden sm:block"></div>
        <div className="flex items-center gap-3">
          <Activity size={16} className="text-tertiary" />
          <span className="text-caption text-tertiary">OVERALL ATTENDANCE %</span>
          <span className="text-body-lg font-semibold text-primary font-mono tabular-nums">
            {loading ? '-' : `${stats.overallAttendance}%`}
          </span>
        </div>
        <div className="w-[1px] h-6 bg-subtle hidden sm:block"></div>
        <div className="flex items-center gap-3">
          <Users size={16} className="text-tertiary" />
          <span className="text-caption text-tertiary">ACTIVE STUDENTS</span>
          <span className="text-body-lg font-semibold text-primary font-mono tabular-nums">
            {loading ? '-' : stats.activeStudents}
          </span>
        </div>
        <div className="w-[1px] h-6 bg-subtle hidden md:block"></div>
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-tertiary" />
          <span className="text-caption text-tertiary">LAST SESSION DATE</span>
          <span className="text-body-lg font-semibold text-primary font-mono tabular-nums">
            {loading ? '-' : stats.lastSessionDate}
          </span>
        </div>
      </div>

      {/* Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Session */}
        <div className="card flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <span className="text-label text-tertiary">TODAY'S SESSION</span>
            {todaysSession && (
              <span className="pill bg-surface-raised border border-subtle text-primary capitalize">
                {todaysSession.session_type}
              </span>
            )}
          </div>
          
          <h2 className="text-display-sm text-primary mb-12">
            {loading ? 'Loading...' : todaysSession ? todaysSession.topic : 'No Session Today'}
          </h2>
          
          <div className="mt-auto">
            {todaysSession ? (
              <>
                <div className="flex gap-8 mb-6">
                  <div>
                    <span className="text-body-sm text-secondary block mb-1">
                      Date: {new Date(todaysSession.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-body-sm text-secondary block mb-1">
                      Duration: {todaysSession.duration_hours}h
                    </span>
                  </div>
                </div>
                <a href="/attendance" className="btn-primary inline-block text-center w-full sm:w-auto">
                  Mark Attendance &rarr;
                </a>
              </>
            ) : (
              <button className="btn-primary w-full sm:w-auto">Create Session &rarr;</button>
            )}
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="card flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <span className="text-label text-tertiary">TODAY'S ATTENDANCE</span>
            {todaysAttendance.total > 0 && (
              <span className="pill border border-subtle text-primary bg-surface-raised">
                {Math.round((todaysAttendance.present / todaysAttendance.total) * 100)}%
              </span>
            )}
          </div>

          <div className="mb-8">
            {todaysSession ? (
              todaysAttendance.total > 0 ? (
                <>
                  <span className="text-display-md text-primary font-mono tabular-nums">{todaysAttendance.present}</span>
                  <span className="text-h2 text-tertiary ml-2">/ {todaysAttendance.total}</span>
                </>
              ) : (
                <span className="text-h2 text-tertiary">Not yet marked</span>
              )
            ) : (
              <span className="text-h2 text-tertiary">N/A</span>
            )}
          </div>

          <div className="mt-auto">
            <h3 className="text-label text-tertiary mb-3">ABSENT STUDENTS</h3>
            {todaysAttendance.absentStudents.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {todaysAttendance.absentStudents.slice(0, 5).map(name => (
                  <span key={name} className="pill pill-danger px-4 py-2 opacity-80">{name}</span>
                ))}
                {todaysAttendance.absentStudents.length > 5 && (
                  <span className="pill bg-surface-inset text-secondary px-4 py-2 opacity-80">
                    +{todaysAttendance.absentStudents.length - 5} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-body-sm text-secondary">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
