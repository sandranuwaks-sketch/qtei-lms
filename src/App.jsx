import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'https://qtei-backend.onrender.com';

export default function App() {
  // Global States
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null); // { role, name, email, code, course_name, course_code, timetable, bio, phone, ... }
  const [courses, setCourses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [timetableRequests, setTimetableRequests] = useState([]);
  
  // UI & Form States
  const [authView, setAuthView] = useState('select'); // 'select', 'admin-login', 'tutor-login', 'student-login'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin Create States
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseTimetable, setNewCourseTimetable] = useState('Mon & Wed: 10:00 AM - 12:00 PM WAT');
  
  const [newTutorName, setNewTutorName] = useState('');
  const [newTutorEmail, setNewTutorEmail] = useState('');
  const [newTutorCourseId, setNewTutorCourseId] = useState('');

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentCourseId, setNewStudentCourseId] = useState('');

  // Student Self-Edit Profile
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Tutor Propose Timetable
  const [proposedTimetable, setProposedTimetable] = useState('');

  // Fetch initial data & handle magic link token verification on mount
  useEffect(() => {
    fetchAllData();

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      verifyMagicToken(token);
    }
  }, []);

  const fetchAllData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/data`);
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses || []);
        setTutors(data.tutors || []);
        setStudents(data.students || []);
        setTimetableRequests(data.timetableRequests || []);
        if (data.courses.length > 0) {
          if (!newTutorCourseId) setNewTutorCourseId(data.courses[0].id);
          if (!newStudentCourseId) setNewStudentCourseId(data.courses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  const verifyMagicToken = async (token) => {
    setLoadingMsg('Verifying your magic sign-in link...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setErrorMsg(data.error || 'Invalid or expired link.');
      }
    } catch (err) {
      setErrorMsg('Network error verifying sign-in link.');
    } finally {
      setLoadingMsg('');
    }
  };

  // --- AUTH HANDLERS ---
  const handleRequestMagicLink = async (e, role) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Instant Admin bypass check
    if (role === 'admin') {
      setUser({ role: 'admin', email: 'sandranuwaks@gmail.com' });
      return;
    }

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoadingMsg('Generating secure sign-in link...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/request-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, role })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user) {
          setUser(data.user);
        } else if (data.devLink) {
          setSuccessMsg(
            <span>
              {data.message} <br/>
              <a href={data.devLink} className="underline font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg inline-block mt-2">
                👉 Click Here to Sign In Instantly
              </a>
            </span>
          );
        }
        setLoginEmail('');
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend server.');
    } finally {
      setLoadingMsg('');
    }
  };
  const handleStudentCodeLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginCode.trim()) {
      setErrorMsg('Please enter your student access code.');
      return;
    }

    setLoadingMsg('Logging in with access code...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/code-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: loginCode })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setLoginCode('');
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg('Network error during login.');
    } finally {
      setLoadingMsg('');
    }
  };

  // --- ADMIN CREATION FLOW ---
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCourseName, timetable: newCourseTimetable })
      });
      const data = await res.json();
      if (res.ok) {
        setCourses([...courses, data]);
        setSuccessMsg(`✅ Course "${data.name}" created with code ${data.code}!`);
        setNewCourseName('');
        fetchAllData();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg('Failed to create course.');
    }
  };

  const handleCreateTutor = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/tutors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTutorName, email: newTutorEmail, courseId: newTutorCourseId })
      });
      const data = await res.json();
      if (res.ok) {
        setTutors([...tutors, data]);
        setSuccessMsg(`✅ Instructor ${data.name} created and welcome email sent!`);
        setNewTutorName('');
        setNewTutorEmail('');
        fetchAllData();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg('Failed to create tutor.');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStudentName, email: newStudentEmail, courseId: newStudentCourseId })
      });
      const data = await res.json();
      if (res.ok) {
        setStudents([...students, data]);
        setSuccessMsg(`✅ Student ${data.name} admitted, code generated, and email sent!`);
        setNewStudentName('');
        setNewStudentEmail('');
        fetchAllData();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg('Failed to admit student.');
    }
  };

  // --- STUDENT PROFILE EDIT ---
  const handleUpdateStudentProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/students/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: editBio, phone: editPhone })
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...user, bio: data.bio, phone: data.phone });
        setSuccessMsg('✅ Profile updated successfully!');
      }
    } catch (err) {
      setErrorMsg('Failed to update profile.');
    }
  };

  // --- TUTOR PROPOSE TIMETABLE ---
  const handleProposeTimetable = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/timetable/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: user.course_id, tutorName: user.name, proposedTimetable })
      });
      if (res.ok) {
        setSuccessMsg('✅ Timetable update submitted to Admin for sign-off review!');
        setProposedTimetable('');
        fetchAllData();
      }
    } catch (err) {
      setErrorMsg('Failed to submit proposal.');
    }
  };

  // --- ADMIN APPROVE TIMETABLE ---
  const handleApproveTimetable = async (requestId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/timetable/approve/${requestId}`, {
        method: 'POST'
      });
      if (res.ok) {
        setSuccessMsg('✅ Timetable sign-off approved and synced across all dashboards!');
        fetchAllData();
      }
    } catch (err) {
      setErrorMsg('Failed to approve timetable.');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-6 transition-colors duration-300 font-sans`}>
      
      {/* Header Bar */}
      <header className="flex justify-between items-center max-w-6xl mx-auto border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            QTEI LMS Portal
          </h1>
          <p className="text-xs text-slate-400">QueerTech Empowerment Initiative &bull; Minority Watch Organisation</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 transition-all shadow-sm"
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          {user && (
            <button 
              onClick={() => { setUser(null); setAuthView('select'); }}
              className="text-xs font-bold px-4 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-all shadow-md"
            >
              🚪 Sign Out ({user.role || 'Admin'})
            </button>
          )}
        </div>
      </header>

      {/* Global Notifications */}
      {loadingMsg && <div className="max-w-6xl mx-auto mb-4 bg-cyan-950/80 border border-cyan-500 text-cyan-200 px-4 py-2 rounded-xl text-xs">{loadingMsg}</div>}
      {errorMsg && <div className="max-w-6xl mx-auto mb-4 bg-rose-950/80 border border-rose-500 text-rose-200 px-4 py-2 rounded-xl text-xs flex justify-between"><span>{errorMsg}</span><button onClick={() => setErrorMsg('')}>✕</button></div>}
      {successMsg && <div className="max-w-6xl mx-auto mb-4 bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-xl text-xs flex justify-between"><span>{successMsg}</span><button onClick={() => setSuccessMsg('')}>✕</button></div>}

      <main className="max-w-6xl mx-auto space-y-8">
        
        {/* ================= USER NOT LOGGED IN (AUTH & ROLE SELECTOR) ================= */}
        {!user && (
          <div className="space-y-8">
            {authView === 'select' && (
              <div className="space-y-6 text-center py-10">
                <h2 className="text-2xl font-black text-white">Select Your Portal Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-4">
                  <div onClick={() => setAuthView('admin-login')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl cursor-pointer transition-all shadow-xl space-y-3">
                    <span className="text-3xl">⚙️</span>
                    <h3 className="text-base font-bold text-white">Admin Portal</h3>
                    <p className="text-xs text-slate-400">Secure magic-link sign in for sandranuwaks@gmail.com.</p>
                  </div>
                  <div onClick={() => setAuthView('tutor-login')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl cursor-pointer transition-all shadow-xl space-y-3">
                    <span className="text-3xl">👨‍🏫</span>
                    <h3 className="text-base font-bold text-white">Instructor Portal</h3>
                    <p className="text-xs text-slate-400">Sign in with your registered instructor email via magic link.</p>
                  </div>
                  <div onClick={() => setAuthView('student-login')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl cursor-pointer transition-all shadow-xl space-y-3">
                    <span className="text-3xl">🎓</span>
                    <h3 className="text-base font-bold text-white">Student Portal</h3>
                    <p className="text-xs text-slate-400">Sign in with your student code or magic link.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN LOGIN */}
            {authView === 'admin-login' && (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4 shadow-xl">
                <button onClick={() => setAuthView('select')} className="text-xs text-indigo-400 hover:underline">← Back to Portal Select</button>
                <h3 className="text-lg font-bold text-white">Admin Passwordless Sign-In</h3>
                <p className="text-xs text-slate-400">Enter authorized admin email (sandranuwaks@gmail.com) to receive a magic sign-in link.</p>
                <form onSubmit={(e) => handleRequestMagicLink(e, 'admin')} className="space-y-3 text-xs">
                  <input 
                    type="email" 
                    value={loginEmail} 
                    onChange={e => setLoginEmail(e.target.value)} 
                    placeholder="sandranuwaks@gmail.com" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                    required 
                  />
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all">
                    Send Admin Magic Link
                  </button>
                </form>
              </div>
            )}

            {/* TUTOR LOGIN */}
            {authView === 'tutor-login' && (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4 shadow-xl">
                <button onClick={() => setAuthView('select')} className="text-xs text-indigo-400 hover:underline">← Back to Portal Select</button>
                <h3 className="text-lg font-bold text-white">Instructor Sign-In</h3>
                <p className="text-xs text-slate-400">Enter your registered instructor email to receive your magic sign-in link.</p>
                <form onSubmit={(e) => handleRequestMagicLink(e, 'tutor')} className="space-y-3 text-xs">
                  <input 
                    type="email" 
                    value={loginEmail} 
                    onChange={e => setLoginEmail(e.target.value)} 
                    placeholder="instructor@example.com" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                    required 
                  />
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all">
                    Send Instructor Magic Link
                  </button>
                </form>
              </div>
            )}

            {/* STUDENT LOGIN */}
            {authView === 'student-login' && (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
                <button onClick={() => setAuthView('select')} className="text-xs text-indigo-400 hover:underline">← Back to Portal Select</button>
                <div>
                  <h3 className="text-lg font-bold text-white">Student Sign-In</h3>
                  <p className="text-xs text-slate-400">Sign in instantly with your Student Access Code or request a magic email link.</p>
                </div>
                
                {/* Code Login */}
                <form onSubmit={handleStudentCodeLogin} className="space-y-3 text-xs border-b border-slate-800 pb-5">
                  <label className="text-slate-400 block font-bold">Sign in with Student Access Code</label>
                  <input 
                    type="text" 
                    value={loginCode} 
                    onChange={e => setLoginCode(e.target.value)} 
                    placeholder="e.g. QTEI-48291" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white uppercase font-mono" 
                  />
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all">
                    Login with Code
                  </button>
                </form>

                {/* Magic Link Login */}
                <form onSubmit={(e) => handleRequestMagicLink(e, 'student')} className="space-y-3 text-xs">
                  <label className="text-slate-400 block font-bold">Or sign in with Email Magic Link</label>
                  <input 
                    type="email" 
                    value={loginEmail} 
                    onChange={e => setLoginEmail(e.target.value)} 
                    placeholder="student@example.com" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                  />
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-all">
                    Send Student Magic Link
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ================= ADMIN DASHBOARD ================= */}
        {user && user.role === 'admin' && (
          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex justify-between items-center shadow-xl">
              <div>
                <h2 className="text-lg font-bold text-white">Admin Control Center</h2>
                <p className="text-xs text-slate-400">Logged in as {user.email} &bull; Full platform authority</p>
              </div>
              <span className="font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-xl text-xs">Super Admin</span>
            </div>

            {/* Course-First Setup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 1. Create Course */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><span>📚</span> 1. Create Course First</h3>
                <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Course Name</label>
                    <input 
                      type="text" 
                      value={newCourseName} 
                      onChange={e => setNewCourseName(e.target.value)} 
                      placeholder="e.g. Full-Stack Software Engineering" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Master Timetable Schedule</label>
                    <input 
                      type="text" 
                      value={newCourseTimetable} 
                      onChange={e => setNewCourseTimetable(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                      required 
                    />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all">
                    Create Course & Auto-Code
                  </button>
                </form>
              </div>

              {/* 2. Create Tutor & Assign to Course */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><span>👨‍🏫</span> 2. Assign Tutor to Course</h3>
                <form onSubmit={handleCreateTutor} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Instructor Name</label>
                    <input 
                      type="text" 
                      value={newTutorName} 
                      onChange={e => setNewTutorName(e.target.value)} 
                      placeholder="e.g. Dr. Sarah Jenkins" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Instructor Email</label>
                    <input 
                      type="email" 
                      value={newTutorEmail} 
                      onChange={e => setNewTutorEmail(e.target.value)} 
                      placeholder="tutor@example.com" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Assign Existing Course</label>
                    <select 
                      value={newTutorCourseId} 
                      onChange={e => setNewTutorCourseId(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      required
                    >
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all">
                    Create & Email Tutor Link
                  </button>
                </form>
              </div>

              {/* 3. Admit Student & Assign to Course */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><span>🎓</span> 3. Admit Student to Course</h3>
                <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Student Name</label>
                    <input 
                      type="text" 
                      value={newStudentName} 
                      onChange={e => setNewStudentName(e.target.value)} 
                      placeholder="e.g. Jordan Adeleke" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Student Email</label>
                    <input 
                      type="email" 
                      value={newStudentEmail} 
                      onChange={e => setNewStudentEmail(e.target.value)} 
                      placeholder="student@example.com" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Assign Existing Course</label>
                    <select 
                      value={newStudentCourseId} 
                      onChange={e => setNewStudentCourseId(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      required
                    >
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl transition-all">
                    Admit & Email Welcome Code
                  </button>
                </form>
              </div>

            </div>

            {/* Timetable Sign-Off Queue */}
            {timetableRequests.length > 0 && (
              <div className="bg-amber-950/40 border border-amber-600/50 p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2"><span>⏳</span> Tutor Timetable Sign-Off Requests ({timetableRequests.length})</h3>
                <div className="space-y-3">
                  {timetableRequests.map(req => (
                    <div key={req.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <p className="text-white font-bold">Course: {req.course_name} ({req.course_code})</p>
                        <p className="text-slate-300">Instructor: {req.tutor_name}</p>
                        <p className="text-amber-400 font-mono">Proposed Schedule: {req.proposed_timetable}</p>
                      </div>
                      <button 
                        onClick={() => handleApproveTimetable(req.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition-all"
                      >
                        Sign Off & Sync Live
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Database Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Courses ({courses.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {courses.map(c => (
                    <div key={c.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <p className="font-bold text-white">{c.name}</p>
                      <p className="text-slate-400 font-mono text-[10px]">{c.code} &bull; {c.timetable}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Instructors ({tutors.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tutors.map(t => (
                    <div key={t.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <p className="font-bold text-white">{t.name}</p>
                      <p className="text-emerald-300 text-[10px]">{t.course_name || 'Unassigned'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Students ({students.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {students.map(s => (
                    <div key={s.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-cyan-300 text-[10px]">{s.course_name}</p>
                      </div>
                      <span className="font-mono text-amber-300 text-[10px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">{s.code}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= TUTOR DASHBOARD ================= */}
        {user && user.role === 'tutor' && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl max-w-3xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Instructor Dashboard</h2>
              <p className="text-xs text-slate-400">Welcome, {user.name} &bull; Assigned Course: <span className="text-emerald-400 font-bold">{user.course_name} ({user.course_code})</span></p>
            </div>

            <div className="space-y-4 text-xs bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-sm">Master Course Timetable</h3>
              <p className="text-slate-300 font-mono bg-slate-900 p-3 rounded-xl border border-slate-800">{user.timetable || 'No schedule set.'}</p>
            </div>

            {/* Propose Timetable Update */}
            <div className="space-y-4 text-xs bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-indigo-400 text-sm">Propose Timetable Schedule Update</h3>
              <p className="text-slate-400">Any schedule changes you submit here will be reviewed and signed off by the Admin before updating student dashboards.</p>
              <form onSubmit={handleProposeTimetable} className="space-y-3">
                <input 
                  type="text" 
                  value={proposedTimetable} 
                  onChange={e => setProposedTimetable(e.target.value)} 
                  placeholder="e.g. Tue & Thu: 2:00 PM - 4:00 PM WAT" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                  required 
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all">
                  Submit for Admin Sign-Off
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= STUDENT DASHBOARD ================= */}
        {user && user.role === 'student' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Student Info & Locked Defaults */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Student Dashboard</h2>
                  <p className="text-xs text-slate-400">Welcome back, {user.name}!</p>
                </div>
                <span className="font-mono bg-amber-950 text-amber-300 border border-amber-800 px-3 py-1 rounded-xl text-xs">Code: {user.code}</span>
              </div>

              {/* Locked Admin Defaults */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] font-bold">Full Name (Locked)</span>
                  <p className="font-bold text-white">{user.name}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] font-bold">Email Address (Locked)</span>
                  <p className="font-bold text-white">{user.email}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px] font-bold">Assigned Course (Locked)</span>
                  <p className="font-bold text-indigo-400">{user.course_name} ({user.course_code})</p>
                </div>
              </div>

              {/* Synced Master Timetable (Read-Only) */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <span className="text-slate-500 uppercase text-[10px] font-bold">Master Class Timetable (Admin & Tutor Managed)</span>
                <p className="text-emerald-400 font-mono font-bold text-sm">{user.timetable || 'Schedule pending assignment.'}</p>
              </div>

              {/* Editable Personal Profile */}
              <div className="border-t border-slate-800 pt-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Edit Your Personal Profile</h3>
                <form onSubmit={handleUpdateStudentProfile} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Personal Bio / About Me</label>
                    <textarea 
                      value={editBio !== '' ? editBio : (user.bio || '')} 
                      onChange={e => setEditBio(e.target.value)} 
                      placeholder="Tell your cohort about your background and tech interests..." 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-20 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={editPhone !== '' ? editPhone : (user.phone || '')} 
                      onChange={e => setEditPhone(e.target.value)} 
                      placeholder="+234 ..." 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                    />
                  </div>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all">
                    Save Profile Changes
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 mt-12 py-4 border-t border-slate-900 max-w-6xl mx-auto">
        Minority Watch &copy; 2026 QueerTech Empowerment Initiative (QTEI) &bull; A Minority Watch Organisation Nigeria Program
      </footer>

    </div>
  );
}
