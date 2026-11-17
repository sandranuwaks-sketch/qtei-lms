const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_EMAIL = 'sandranuwaks@gmail.com';
const FRONTEND_URL = 'https://qtei-lms.vercel.app';

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Send Email via Resend HTTP API (Bypasses Render SMTP port blocks)
async function sendEmail(to, subject, html) {
  // CRITICAL FIX: Skip sending any automated welcome/admission emails to the admin
  if (to.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    console.log(`ℹ️ Skipped sending notification email to admin (${ADMIN_EMAIL})`);
    return true;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY missing in Render Environment Variables.');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // Note: Change 'onboarding@resend.dev' to 'noreply@yourdomain.com' once your custom domain is verified in Resend
        from: 'QTEI LMS Portal <onboarding@resend.dev>',
        to: [to],
        subject,
        html
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log('✅ Email sent via Resend:', data.id);
      return true;
    } else {
      console.error('❌ Resend API Error:', data);
      return false;
    }
  } catch (err) {
    console.error('❌ Email delivery failed:', err.message);
    return false;
  }
}

// Auto-create database tables safely
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        timetable TEXT DEFAULT 'Mon & Wed: 10:00 AM - 12:00 PM WAT'
      );
      CREATE TABLE IF NOT EXISTS tutors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        code TEXT UNIQUE NOT NULL,
        course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        code TEXT UNIQUE NOT NULL,
        course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
        bio TEXT DEFAULT '',
        phone TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS magic_links (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );
      CREATE TABLE IF NOT EXISTS timetable_requests (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        tutor_name TEXT NOT NULL,
        proposed_timetable TEXT NOT NULL,
        status TEXT DEFAULT 'pending'
      );
      CREATE TABLE IF NOT EXISTS teacher_applications (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        expertise TEXT NOT NULL,
        bio TEXT NOT NULL,
        status TEXT DEFAULT 'pending'
      );
      CREATE TABLE IF NOT EXISTS student_applications (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        track TEXT NOT NULL,
        motivation TEXT NOT NULL,
        status TEXT DEFAULT 'pending'
      );
      CREATE TABLE IF NOT EXISTS course_requests (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        requested_by TEXT NOT NULL,
        status TEXT DEFAULT 'pending'
      );
    `);
    console.log('Database tables initialized successfully.');
  } catch (err) {
    console.error('DB Init Error:', err);
  }
}
initDB();

async function createAndEmailMagicLink(email, role, extraWelcomeHtml = '') {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await pool.query(
    'INSERT INTO magic_links (token, email, role, expires_at) VALUES ($1, $2, $3, $4)',
    [token, email.toLowerCase(), role, expiresAt]
  );

  const link = `${FRONTEND_URL}/?token=${token}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #4f46e5;">QTEI LMS Portal Access</h2>
      ${extraWelcomeHtml}
      <p>Click the secure sign-in button below to access your <strong>${role.toUpperCase()}</strong> dashboard:</p>
      <a href="${link}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">
        Sign In to QTEI Portal
      </a>
    </div>
  `;
  const emailSent = await sendEmail(email, `Your QTEI LMS ${role.toUpperCase()} Sign-In Link`, html);
  return { link, emailSent };
}

// 1. FETCH ALL INITIAL DATA
app.get('/api/data', async (req, res) => {
  try {
    const courses = await pool.query('SELECT * FROM courses ORDER BY id ASC');
    const tutors = await pool.query(`
      SELECT t.*, c.name AS course_name, c.code AS course_code 
      FROM tutors t LEFT JOIN courses c ON t.course_id = c.id 
      ORDER BY t.id ASC
    `);
    const students = await pool.query(`
      SELECT s.*, c.name AS course_name, c.code AS course_code, c.timetable 
      FROM students s LEFT JOIN courses c ON s.course_id = c.id 
      ORDER BY s.id ASC
    `);
    const requests = await pool.query(`
      SELECT r.*, c.name AS course_name, c.code AS course_code 
      FROM timetable_requests r JOIN courses c ON r.course_id = c.id 
      WHERE r.status = 'pending' 
      ORDER BY r.id DESC
    `);
    const teacherApps = await pool.query("SELECT * FROM teacher_applications WHERE status = 'pending' ORDER BY id DESC");
    const studentApps = await pool.query("SELECT * FROM student_applications WHERE status = 'pending' ORDER BY id DESC");
    const courseReqs = await pool.query("SELECT * FROM course_requests WHERE status = 'pending' ORDER BY id DESC");

    res.json({
      courses: courses.rows,
      tutors: tutors.rows,
      students: students.rows,
      timetableRequests: requests.rows,
      teacherApps: teacherApps.rows,
      studentApps: studentApps.rows,
      courseReqs: courseReqs.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUBLIC APPLICATION ENDPOINTS
app.post('/api/apply/teach', async (req, res) => {
  const { name, email, expertise, bio } = req.body;
  if (!name || !email || !expertise) return res.status(400).json({ error: 'Required fields missing.' });
  try {
    const result = await pool.query(
      'INSERT INTO teacher_applications (name, email, expertise, bio) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email.toLowerCase(), expertise, bio || '']
    );
    sendEmail(
      email.toLowerCase(),
      'QTEI Instructor Application Received',
      `<p>Hi ${name},</p><p>Thank you for applying to teach <strong>${expertise}</strong> with QTEI. Our team will review your application shortly.</p>`
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apply/learn', async (req, res) => {
  const { name, email, track, motivation } = req.body;
  if (!name || !email || !track) return res.status(400).json({ error: 'Required fields missing.' });
  try {
    const result = await pool.query(
      'INSERT INTO student_applications (name, email, track, motivation) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email.toLowerCase(), track, motivation || '']
    );
    sendEmail(
      email.toLowerCase(),
      'QTEI Cohort Application Received',
      `<p>Hi ${name},</p><p>We have received your application for the <strong>${track}</strong> track at QTEI. You will receive your admission code once approved.</p>`
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/request-course', async (req, res) => {
  const { title, description, requestedBy } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required.' });
  try {
    const result = await pool.query(
      'INSERT INTO course_requests (title, description, requested_by) VALUES ($1, $2, $3) RETURNING *',
      [title, description, requestedBy || 'Anonymous']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. COURSES, TUTORS & STUDENTS CREATION + DELETE
app.post('/api/courses', async (req, res) => {
  const { name, timetable } = req.body;
  if (!name) return res.status(400).json({ error: 'Course name is required' });
  const code = `CRS-${name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  try {
    const result = await pool.query(
      'INSERT INTO courses (name, code, timetable) VALUES ($1, $2, $3) RETURNING *',
      [name, code, timetable || 'Mon & Wed: 10:00 AM - 12:00 PM WAT']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
    res.json({ message: 'Course deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tutors', async (req, res) => {
  const { name, email, courseId } = req.body;
  if (!name || !email || !courseId) return res.status(400).json({ error: 'Name, email, and course required.' });
  const code = `TUT-${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) return res.status(404).json({ error: 'Course not found.' });

    const result = await pool.query(
      'INSERT INTO tutors (name, email, code, course_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email.toLowerCase(), code, courseId]
    );
    const welcomeHtml = `<p>Welcome <strong>${name}</strong>! You have been assigned to teach <strong>${courseRes.rows[0].name}</strong>. Your Instructor Code is <strong>${code}</strong>.</p>`;
    createAndEmailMagicLink(email.toLowerCase(), 'tutor', welcomeHtml);

    res.json({
      ...result.rows[0],
      course_name: courseRes.rows[0].name,
      course_code: courseRes.rows[0].code,
      tempCode: code,
      emailSent: true
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A tutor with this email address is already registered.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tutors/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tutors WHERE id = $1', [req.params.id]);
    res.json({ message: 'Tutor removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  const { name, email, courseId } = req.body;
  if (!name || !email || !courseId) return res.status(400).json({ error: 'Name, email, and course required.' });
  const code = `QTEI-${Math.floor(10000 + Math.random() * 90000)}`;
  try {
    const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) return res.status(404).json({ error: 'Course not found.' });

    const result = await pool.query(
      'INSERT INTO students (name, email, code, course_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email.toLowerCase(), code, courseId]
    );

    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4f46e5;">Welcome to QTEI LMS!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>You have been admitted to <strong>${courseRes.rows[0].name}</strong>.</p>
        <p>Your Student Access Code is: <strong style="font-size: 18px; color: #059669;">${code}</strong></p>
        <a href="${FRONTEND_URL}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">
          Access Student Portal
        </a>
      </div>
    `;
    sendEmail(email.toLowerCase(), 'Your QTEI Student Admission & Access Code', html);

    res.json({
      ...result.rows[0],
      course_name: courseRes.rows[0].name,
      course_code: courseRes.rows[0].code,
      emailSent: true
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A student with this email address is already registered.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.json({ message: 'Student removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. AUTHENTICATION ROUTES
app.post('/api/auth/request-link', async (req, res) => {
  const { email, role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required.' });
  try {
    if (role === 'admin') return res.json({ user: { role: 'admin', email: ADMIN_EMAIL } });
    const cleanEmail = (email || '').trim().toLowerCase();
    const { link, emailSent } = await createAndEmailMagicLink(cleanEmail, role);
    res.json({
      message: emailSent ? 'Magic link emailed and generated!' : 'Magic link generated.',
      devLink: link,
      emailSent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required.' });
  try {
    const linkRes = await pool.query('SELECT * FROM magic_links WHERE token = $1', [token]);
    if (linkRes.rows.length === 0) return res.status(401).json({ error: 'Invalid or expired link.' });
    const record = linkRes.rows[0];
    await pool.query('DELETE FROM magic_links WHERE token = $1', [token]);

    let profile = { email: record.email, role: record.role };
    if (record.role === 'tutor') {
      const tRes = await pool.query('SELECT t.*, c.name AS course_name, c.code AS course_code, c.timetable FROM tutors t LEFT JOIN courses c ON t.course_id = c.id WHERE t.email = $1', [record.email]);
      profile = { ...profile, ...tRes.rows[0] };
    } else if (record.role === 'student') {
      const sRes = await pool.query('SELECT s.*, c.name AS course_name, c.code AS course_code, c.timetable FROM students s LEFT JOIN courses c ON s.course_id = c.id WHERE s.email = $1', [record.email]);
      profile = { ...profile, ...sRes.rows[0] };
    }
    res.json({ user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/code-login', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required.' });
  try {
    const sRes = await pool.query('SELECT s.*, c.name AS course_name, c.code AS course_code, c.timetable FROM students s LEFT JOIN courses c ON s.course_id = c.id WHERE UPPER(s.code) = $1', [code.trim().toUpperCase()]);
    if (sRes.rows.length === 0) return res.status(401).json({ error: 'Invalid Student Access Code.' });
    res.json({ user: { ...sRes.rows[0], role: 'student' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id/profile', async (req, res) => {
  const { bio, phone } = req.body;
  try {
    const result = await pool.query('UPDATE students SET bio = $1, phone = $2 WHERE id = $3 RETURNING *', [bio || '', phone || '', req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/timetable/propose', async (req, res) => {
  const { courseId, tutorName, proposedTimetable } = req.body;
  try {
    const result = await pool.query('INSERT INTO timetable_requests (course_id, tutor_name, proposed_timetable) VALUES ($1, $2, $3) RETURNING *', [courseId, tutorName, proposedTimetable]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/timetable/approve/:requestId', async (req, res) => {
  try {
    const reqRes = await pool.query('SELECT * FROM timetable_requests WHERE id = $1', [req.params.requestId]);
    const request = reqRes.rows[0];
    await pool.query('UPDATE courses SET timetable = $1 WHERE id = $2', [request.proposed_timetable, request.course_id]);
    await pool.query("UPDATE timetable_requests SET status = 'approved' WHERE id = $1", [request.id]);
    res.json({ message: 'Approved!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
