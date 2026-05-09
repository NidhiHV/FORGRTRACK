-- ==========================================
-- ForgeTrack Database Seed Data (Phase 1)
-- ==========================================

-- 1. Seed Students
INSERT INTO public.students (name, usn, branch_code) VALUES
('Aditya Gupta', '4SH24CS013', 'CS'),
('Aishwarya P', '4SH24CS024', 'AI'),
('Amitabh B', '4SH24CS003', 'CS'),
('Ananya Patel', '4SH24CS008', 'IS'),
('Arjun Reddy', '4SH24CS005', 'CS'),
('Rahul K', '4SH24CS001', 'CS'),
('Sneha Rao', '4SH24CS002', 'AI');

-- 2. Seed Sessions
INSERT INTO public.sessions (date, topic, month_number, duration_hours, session_type) VALUES
('2026-04-10', '8-Layer AI Stack', 5, 2.0, 'offline'),
('2026-04-15', 'ReAct Agent Pattern', 5, 2.0, 'online'),
('2026-04-20', 'pgvector RAG', 5, 2.0, 'offline'),
('2026-04-25', 'Tiered Autonomy Multi-Agent', 5, 2.0, 'offline'),
('2026-04-30', 'Agentic Workflows', 5, 2.0, 'online');

-- 3. Seed Attendance (Assuming student IDs 1-7, session IDs 1-5)
INSERT INTO public.attendance (student_id, session_id, present, marked_by) VALUES
(1, 1, true, 'Nischay'), (2, 1, true, 'Nischay'), (3, 1, false, 'Nischay'), (4, 1, true, 'Nischay'), (5, 1, true, 'Nischay'), (6, 1, true, 'Nischay'), (7, 1, true, 'Nischay'),
(1, 5, true, 'Nischay'), (2, 5, true, 'Nischay'), (3, 5, false, 'Nischay'), (4, 5, true, 'Nischay'), (5, 5, true, 'Nischay'), (6, 5, false, 'Nischay'), (7, 5, false, 'Nischay');

-- 4. Seed Materials
INSERT INTO public.materials (session_id, title, type, url, description) VALUES
(1, '8-Layer Stack Slides', 'slides', 'https://docs.google.com/presentation/d/demo', 'Full architecture diagram'),
(1, 'Session Recording', 'recording', 'https://youtube.com/demo', 'Zoom recording from 10th April'),
(5, 'Agentic Workflow Guide', 'document', 'https://notion.so/demo', 'Core concepts and patterns');

-- 5. Note on Users:
-- To fully test RLS, you must create a mentor and student user in your Supabase Authentication dashboard,
-- and manually map their UUIDs into the `public.users` table.
-- e.g., INSERT INTO public.users (id, email, role, display_name) VALUES ('<UUID>', 'nischay@theboringpeople.in', 'mentor', 'Nischay');
