import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'https://qtei-backend.onrender.com';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [timetableRequests, setTimetableRequests] = useState([]);
  
  // Navigation States
  const [adminView, setAdminView] = useState('hub'); // 'hub', 'course', 'tutor', 'student'
  const [authView, setAuthView] = useState('select'); // 'select', 'tutor-login', 'student-login'
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseTimetable, setNewCourseTimetable] = useState('Mon & Wed: 10:00 AM - 12:00 PM WAT');
  
  const [newTutorName, setNewTutorName] = useState('');
  const [newTutorEmail, setNewTutorEmail] = useState('');
  const [newTutorCourseId, setNewTutorCourseId] = useState('');

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentCourseId, setNewStudentCourseId] = useState('');

  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [proposedTimetable, setProposedTimetable] = useState('');

  useEffect(() => {
    fetchAllData();
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) verifyMagicToken(token);
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
    setLoadingMsg('Verifying your session...');
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
      setErrorMsg('Network error.');
    } finally {
      setLoadingMsg('');
    }
  };

  const handleRequestMagicLink = async (e, role) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (role === 'admin') {
      setUser({ role: 'admin', email: 'sandranuwaks@gmail.com' });
      return;
    }

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoadingMsg('Generating sign-in link...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/request-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, role })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.devLink) {
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

    setLoadingMsg('Logging in...');
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
      setErrorMsg('Network error.');
    } finally {
      setLoadingMsg('');
    }
  };

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
        setSuccessMsg(`✅ Student ${data.name} admitted successfully!`);
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

  const handleApproveTimetable = async (requestId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/timetable/approve/${requestId}`, { method: 'POST' });
      if (res.ok) {
        setSuccessMsg('✅ Timetable sign-off approved and synced across dashboards!');
        fetchAllData();
      }
    } catch (err) {
      setErrorMsg('Failed to approve.');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-6 transition-colors duration-300 font-sans`}>
      
      {/* Header Bar */}
      <header className="flex justify-between items-center max-w-6xl mx-auto border-b border-slate-800 pb-4 mb-6">
  <div className="flex items-center gap-4">
    <button 
      onClick={() => { setUser(null); setAuthView('select'); setAdminView('hub'); }} 
      className="text-xs font-bold px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-md transition-all">
      🏠 Home
    </button>
    <div className="cursor-pointer" onClick={() => { setUser(null); setAuthView('select'); setAdminView('hub'); }}>
      <h1 className="text-xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
        QTEI LMS Portal
      </h1>
      <p className="text-xs text-slate-400">QueerTech Empowerment Initiative &bull; Minority Watch Organisation</p>
    </div>
  </div>
  <div className="flex items-center gap-3">
    <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700">
      {isDarkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
    {user && (
      <button onClick={() => { setUser(null); setAuthView('select'); setAdminView('hub'); }} className="text-xs font-bold px-4 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-500 shadow-md">
        🚪 Sign Out
      </button>
    )}
  </div>
</header>

      {loadingMsg && <div className="max-w-6xl mx-auto mb-4 bg-cyan-950/80 border border-cyan-500 text-cyan-200 px-4 py-2 rounded-xl text-xs">{loadingMsg}</div>}
      {errorMsg && <div className="max-w-6xl mx-auto mb-4 bg-rose-950/80 border border-rose-500 text-rose-200 px-4 py-2 rounded-xl text-xs flex justify-between"><span>{errorMsg}</span><button onClick={() => setErrorMsg('')}>✕</button></div>}
      {successMsg && <div className="max-w-6xl mx-auto mb-4 bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-xl text-xs flex justify-between"><span>{successMsg}</span><button onClick={() => setSuccessMsg('')}>✕</button></div>}

      <main className="max-w-6xl mx-auto space-y-8">
        
        {/* ================= HERO HOME & AUTH SELECTOR ================= */}
        {!user && (
          <div className="space-y-10 py-6">
            
            {/* Hero Banner */}
            <div className="text-center space-y-4 max-w-3xl mx-auto bg-gradient-to-b from-slate-900 to-slate-950 p-10 rounded-3xl border border-slate-800 shadow-2xl">
              <span className="bg-indigo-950 text-indigo-300 font-mono text-xs px-3 py-1 rounded-full border border-indigo-800">
                Minority Watch Initiative
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Empowering Marginalized Tech Leaders
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Welcome to the official Learning Management and Cohort Operations System for the QueerTech Empowerment Initiative (QTEI). Manage courses, coordinate instructors, and empower students securely in one unified hub.
              </p>
              
              {/* Quick Stats Counter */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-xl mx-auto text-center">
                <div>
                  <p className="text-xl font-bold text-indigo-400">{courses.length}</p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Active Courses</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-400">{tutors.length}</p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Instructors</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-cyan-400">{students.length}</p>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Enrolled Students</p>
                </div>
              </div>
            </div>

            {/* Portal Role Selectors */}
            {authView === 'select' && (
              <div className="space-y-6 text-center">
                <h3 className="text-xl font-bold text-white">Select Your Portal Access</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div onClick={() => handleRequestMagicLink({ preventDefault: () => {} }, 'admin')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl cursor-pointer shadow-xl space-y-3 transition-all hover:-translate-y-1">
                    <span className="text-3xl">⚙️</span>
                    <h4 className="text-base font-bold text-white">Admin Portal</h4>
                    <p className="text-xs text-slate-400">Instant passwordless access to platform control center and sign-offs.</p>
                  </div>
                  <div onClick={() => setAuthView('tutor-login')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl cursor-pointer shadow-xl space-y-3 transition-all hover:-translate-y-1">
                    <span className="text-3xl">👨‍🏫</span>
                    <h4 className="text-base font-bold text-white">Instructor Portal</h4>
                    <p className="text-xs text-slate-400">Sign in with your registered instructor email for schedule oversight.</p>
                  </div>
                  <div onClick={() => setAuthView('student-login')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl cursor-pointer shadow-xl space-y-3 transition-all hover:-translate-y-1">
                    <span className="text-3xl">🎓</span>
                    <h4 className="text-base font-bold text-white">Student Portal</h4>
                    <p className="text-xs text-slate-400">Sign in instantly with your student access code or email.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tutor Login View with Back Navigation */}
            {authView === 'tutor-login' && (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl
