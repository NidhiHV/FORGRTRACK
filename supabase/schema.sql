-- ==========================================
-- ForgeTrack Database Schema (Phase 1)
-- ==========================================

-- 1. Students Table
CREATE TABLE public.students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    usn TEXT UNIQUE NOT NULL,
    admission_number TEXT,
    email TEXT,
    branch_code TEXT NOT NULL,
    batch TEXT DEFAULT '2024-2028',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sessions Table
CREATE TABLE public.sessions (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    topic TEXT NOT NULL,
    month_number INTEGER NOT NULL,
    duration_hours DECIMAL(3,1) DEFAULT 2.0,
    session_type TEXT DEFAULT 'offline',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ImportLog Table
CREATE TABLE public.import_log (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_rows INTEGER NOT NULL,
    imported_rows INTEGER NOT NULL,
    skipped_rows INTEGER NOT NULL,
    warnings JSONB,
    column_mapping JSONB,
    status TEXT NOT NULL CHECK (status IN ('completed', 'partial', 'failed', 'in_progress'))
);

-- 4. Attendance Table
CREATE TABLE public.attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marked_by TEXT DEFAULT 'system',
    import_id INTEGER REFERENCES public.import_log(id) ON DELETE SET NULL,
    UNIQUE(student_id, session_id)
);

-- 5. Materials Table
CREATE TABLE public.materials (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('slides', 'recording', 'document', 'link')),
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Users Extension Table (Maps Supabase Auth to App Roles)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
    student_id INTEGER REFERENCES public.students(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- Constraints
-- ==========================================

-- No future attendance dates or dates before program start (2025-08-04)
ALTER TABLE public.sessions 
  ADD CONSTRAINT valid_session_date 
  CHECK (date <= CURRENT_DATE AND date >= '2025-08-04');

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Mentors have full access to everything
CREATE POLICY "mentors_all_students" ON public.students FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "mentors_all_sessions" ON public.sessions FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "mentors_all_attendance" ON public.attendance FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "mentors_all_materials" ON public.materials FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "mentors_all_import_log" ON public.import_log FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));
CREATE POLICY "mentors_all_users" ON public.users FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor'));

-- Students have read-only access strictly scoped to their own data
CREATE POLICY "students_read_self" ON public.students FOR SELECT USING (id = (SELECT student_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "students_read_sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "students_read_materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "students_read_own_attendance" ON public.attendance FOR SELECT USING (student_id = (SELECT student_id FROM public.users WHERE id = auth.uid()));

-- ==========================================
-- Trigger: Auto-create Student User
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_student() 
RETURNS TRIGGER AS $$
BEGIN
  -- We assume the actual auth.users creation happens via Supabase API, 
  -- but we can auto-create the public.users record linked to the auth ID later,
  -- or handle this entirely in the app layer upon first login.
  -- For demo purposes, we will rely on explicit user creation.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
