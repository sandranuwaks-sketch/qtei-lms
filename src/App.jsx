import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'https://qtei-backend.onrender.com';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [timetableRequests, setTimetableRequests] = useState([]);

  const [adminView, setAdminView] = useState('hub');
  const [authView, setAuthView] = useState('select');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const [teachName, setTeachName] = useState('');
  const [teachEmail, setTeachEmail] = useState('');
  const [teachExpertise, setTeachExpertise] = useState('');
  const [teachBio, setTeachBio] = useState('');

  const [learnName, setLearnName] = useState('');
  const [learnEmail, setLearnEmail] = useState('');
  const [learnTrack, setLearnTrack] = useState('');
  const [learnMotivation, setLearnMotivation] = useState('');

  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqBy, setReqBy] = useState('');

  const [teacherApps, setTeacherApps] = useState([]);
  const [studentApps, setStudentApps] = useState([]);
  const [courseReqs, setCourseReqs] = useState([]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
        setTeacherApps(data.teacherApps || []);
        setStudentApps(data.studentApps || []);
        setCourseReqs(data.courseReqs || []);
        if (data.courses && data.courses.length > 0) {
          setNewTutorCourseId(prev => prev || data.courses[0].id);
          setNewStudentCourseId(prev => prev || data.courses[0].id);
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

  const handleApplyTeach = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/apply/teach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teachName, email: teachEmail, expertise: teachExpertise, bio: teachBio })
      });
      if (res.ok) {
        setSuccessMsg('✅ Application submitted! Admin will review your credentials.');
        setActiveModal(null);
        setTeachName('');
        setTeachEmail('');
        setTeachExpertise('');
        setTeachBio('');
      }
    } catch (err) {
      setErrorMsg('Failed to submit application.');
    }
  };

  const handleApplyLearn = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/apply/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: learnName, email: learnEmail, track: learnTrack, motivation: learnMotivation })
      });
      if (res.ok) {
        setSuccessMsg('✅ Learning application submitted! We will be in touch soon.');
        setActiveModal(null);
        setLearnName('');
        setLearnEmail('');
        setLearnTrack('');
        setLearnMotivation('');
      }
    } catch (err) {
      setErrorMsg('Failed to submit application.');
    }
  };

  const handleRequestCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/request-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: reqTitle, description: reqDesc, requestedBy: reqBy })
      });
      if (res.ok) {
        setSuccessMsg('✅ Course request submitted to curriculum team!');
        setActiveModal(null);
        setReqTitle('');
        setReqDesc('');
        setReqBy('');
      }
    } catch (err) {
      setErrorMsg('Failed to submit course request.');
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
      setErrorMsg('Please enter your email.');
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
      if (res.ok && data.devLink) {
        setSuccessMsg(
          <span>
            {data.message} <br />
            <a href={data.devLink} className="underline font-bold text-white bg-indigo-600 px-3 py-1 rounded-lg inline-block mt-2">
              👉 Click Here to Sign In
            </a>
          </span>
        );
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg('Network error.');
    } finally {
      setLoadingMsg('');
    }
  };

  const handleStudentCodeLogin = async (e) => {
    e.preventDefault();
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
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoadingMsg('Creating course...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCourseName, timetable: newCourseTimetable })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`✅ Course "${data.name}" (${data.code}) created successfully!`);
        setNewCourseName('');
        await fetchAllData();
        setAdminView('hub');
      } else {
        setErrorMsg(`❌ Error: ${data.error || 'Could not create course.'}`);
      }
    } catch (err) {
      setErrorMsg('❌ Network error connecting to backend.');
    } finally {
      setLoadingMsg('');
    }
  };

  const handleCreateTutor = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!newTutorCourseId) {
      setErrorMsg('Please create a course first or select a valid course.');
      return;
    }
    setLoadingMsg('Assigning tutor and dispatching welcome link...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/tutors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTutorName.trim(),
          email: newTutorEmail.trim().toLowerCase(),
          courseId: Number(newTutorCourseId)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`✅ Tutor "${data.name}" assigned to ${data.course_name}! Code: ${data.tempCode}`);
        setNewTutorName('');
        setNewTutorEmail('');
        await fetchAllData();
        setAdminView('hub');
      } else {
        setErrorMsg(`❌ Error: ${data.error || 'Could not assign tutor.'}`);
      }
    } catch (err) {
      setErrorMsg('❌ Network error connecting to backend.');
    } finally {
      setLoadingMsg('');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!newStudentCourseId) {
      setErrorMsg('Please create a course first or select a valid course.');
      return;
    }
    setLoadingMsg('Admitting student and generating access code...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStudentName.trim(),
          email: newStudentEmail.trim().toLowerCase(),
          courseId: Number(newStudentCourseId)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`✅ Student "${data.name}" admitted to ${data.course_name}! Access Code: ${data.code}`);
        setNewStudentName('');
        setNewStudentEmail('');
        await fetchAllData();
        setAdminView('hub');
      } else {
        setErrorMsg(`❌ Error: ${data.error || 'Could not admit student.'}`);
      }
    } catch (err) {
      setErrorMsg('❌ Network error connecting to backend.');
    } finally {
      setLoadingMsg('');
    }
  };

  const handleDeleteRecord = async (type, id, label) => {
    if (!window.confirm(`Are you sure you want to remove ${label}?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/${type}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(`🗑️ Removed ${label}.`);
        await fetchAllData();
      } else {
        setErrorMsg(`Failed to delete ${label}.`);
      }
    } catch (err) {
      setErrorMsg('Network error while deleting.');
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
        setSuccessMsg('✅ Profile updated!');
      }
    } catch (err) {
      setErrorMsg('Failed.');
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
        setSuccessMsg('✅ Timetable proposal submitted to Admin!');
        setProposedTimetable('');
        fetchAllData();
      }
    } catch (err) {
      setErrorMsg('Failed.');
    }
  };

  const handleApproveTimetable = async (requestId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/timetable/approve/${requestId}`, { method: 'POST' });
      if (res.ok) {
        setSuccessMsg('✅ Approved!');
        fetchAllData();
      }
    } catch (err) {
      setErrorMsg('Failed.');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-6 transition-colors duration-300 font-sans relative`}>
      <header className="flex justify-between items-center max-w-6xl mx-auto border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setUser(null); setAuthView('select'); setAdminView('hub'); }}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-md transition-all"
          >
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
          <button onClick={() => setIsSidebarOpen(true)} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 text-indigo-300 flex items-center gap-1">
            ☰ Quick Actions
          </button>
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

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="font-bold text-white text-sm">⚡ QTEI Quick Actions</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
              </div>
              <div className="space-y-3 text-xs">
                <button onClick={() => { setActiveModal('teach'); setIsSidebarOpen(false); }} className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 flex items-center gap-3 text-white font-medium transition-all">
                  <span>👨‍🏫</span> Apply to Teach
                </button>
                <button onClick={() => { setActiveModal('learn'); setIsSidebarOpen(false); }} className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 flex items-center gap-3 text-white font-medium transition-all">
                  <span>🎓</span> Apply to Learn
                </button>
                <button onClick={() => { setActiveModal('request-course'); setIsSidebarOpen(false); }} className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 flex items-center gap-3 text-white font-medium transition-all">
                  <span>💡</span> Request a Course
                </button>
                <button onClick={() => { setActiveModal('info'); setIsSidebarOpen(false); }} className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 flex items-center gap-3 text-white font-medium transition-all">
                  <span>ℹ️</span> About QTEI & FAQ
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 text-center border-t border-slate-800 pt-4">
              Minority Watch Organisation &bull; QTEI Portal v2.0
            </div>
          </div>
        </div>
      )}

      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-5 shadow-2xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white font-bold">✕</button>

            {activeModal === 'teach' && (
              <form onSubmit={handleApplyTeach} className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-white">Apply to Teach with QTEI</h3>
                <input type="text" value={teachName} onChange={e => setTeachName(e.target.value)} placeholder="Full Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                <input type="email" value={teachEmail} onChange={e => setTeachEmail(e.target.value)} placeholder="Email Address" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                <input type="text" value={teachExpertise} onChange={e => setTeachExpertise(e.target.value)} placeholder="Area of Tech Expertise" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                <textarea value={teachBio} onChange={e => setTeachBio(e.target.value)} placeholder="Short Bio & Links" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-20 resize-none" />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl">Submit Application</button>
              </form>
            )}

            {activeModal === 'learn' && (
              <form onSubmit={handleApplyLearn} className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-white">Apply to Learn in Our Cohort</h3>
                <input type="text" value={learnName} onChange={e => setLearnName(e.target.value)} placeholder="Full Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                <input type="email" value={learnEmail} onChange={e => setLearnEmail(e.target.value)} placeholder="Email Address" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                <input type="text" value={learnTrack} onChange={e => setLearnTrack(e.target.value)} placeholder="Desired Track" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                <textarea value={learnMotivation} onChange={e => setLearnMotivation(e.target.value)} placeholder="Why do you want to join?" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-20 resize-none" />
                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl">Submit Learner Application</button>
              </form>
            )}

            {activeModal === 'request-course' && (
              <form onSubmit={handleRequestCourse} className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-white">Request a New Course</h3>
                <input type="text" value={reqTitle} onChange={e => setReqTitle(e.target.value)} placeholder="Course Title" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                <textarea value={reqDesc} onChange={e => setReqDesc(e.target.value)} placeholder="Course Description" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-20 resize-none" required />
                <input type="text" value={reqBy} onChange={e => setReqBy(e.target.value)} placeholder="Your Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">Submit Course Request</button>
              </form>
            )}

            {activeModal === 'info' && (
              <div className="space-y-4 text-xs text-slate-300">
                <h3 className="text-base font-bold text-white">About QTEI</h3>
                <p>The QueerTech Empowerment Initiative (QTEI) is a Minority Watch Organisation program focused on bridging the digital divide for marginalized tech leaders across Africa.</p>
                <p className="font-mono text-indigo-400">sandranuwaks@gmail.com</p>
                <button onClick={() => setActiveModal(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {loadingMsg && <div className="max-w-6xl mx-auto mb-4 bg-cyan-950/80 border border-cyan-500 text-cyan-200 px-4 py-2 rounded-xl text-xs">{loadingMsg}</div>}
      {errorMsg && <div className="max-w-6xl mx-auto mb-4 bg-rose-950/80 border border-rose-500 text-rose-200 px-4 py-2 rounded-xl text-xs flex justify-between"><span>{errorMsg}</span><button onClick={() => setErrorMsg('')}>✕</button></div>}
      {successMsg && <div className="max-w-6xl mx-auto mb-4 bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-xl text-xs flex justify-between"><span>{successMsg}</span><button onClick={() => setSuccessMsg('')}>✕</button></div>}

      <main className="max-w-6xl mx-auto space-y-8">
        {!user && (
          <div className="space-y-10 py-6">
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

            {authView === 'tutor-login' && (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-5 shadow-xl">
                <button onClick={() => setAuthView('select')} className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">← Back to Portal Select</button>
                <h3 className="text-lg font-bold text-white">Instructor Sign-In</h3>
                <form onSubmit={(e) => handleRequestMagicLink(e, 'tutor')} className="space-y-3 text-xs">
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="tutor@example.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl">Send Magic Link</button>
                </form>
              </div>
            )}

            {authView === 'student-login' && (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-5 shadow-xl">
                <button onClick={() => setAuthView('select')} className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">← Back to Portal Select</button>
                <h3 className="text-lg font-bold text-white">Student Sign-In</h3>
                <form onSubmit={handleStudentCodeLogin} className="space-y-3 text-xs">
                  <input type="text" value={loginCode} onChange={e => setLoginCode(e.target.value)} placeholder="e.g. QTEI-48291" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white uppercase font-mono" required />
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl">Login with Code</button>
                </form>
              </div>
            )}
          </div>
        )}

        {user && user.role === 'admin' && (
          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex justify-between items-center shadow-xl">
              <div>
                <h2 className="text-lg font-bold text-white">Admin Dashboard Hub</h2>
                <p className="text-xs text-slate-400">Logged in as {user.email}</p>
              </div>
              <span className="font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-xl text-xs">Super Admin</span>
            </div>

            {adminView === 'hub' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <button onClick={() => setAdminView('course')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl text-left space-y-2 shadow-xl transition-all">
                    <span className="text-2xl">📚</span>
                    <h3 className="text-sm font-bold text-white">Create Course</h3>
                    <p className="text-xs text-slate-400">Establish new courses and codes.</p>
                  </button>
                  <button onClick={() => setAdminView('tutor')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl text-left space-y-2 shadow-xl transition-all">
                    <span className="text-2xl">👨‍🏫</span>
                    <h3 className="text-sm font-bold text-white">Assign Tutors</h3>
                    <p className="text-xs text-slate-400">Add instructors and assign courses.</p>
                  </button>
                  <button onClick={() => setAdminView('student')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl text-left space-y-2 shadow-xl transition-all">
                    <span className="text-2xl">🎓</span>
                    <h3 className="text-sm font-bold text-white">Admit Students</h3>
                    <p className="text-xs text-slate-400">Admit students into cohorts.</p>
                  </button>
                  <button onClick={() => setAdminView('directory')} className="bg-slate-900 border border-indigo-700/60 hover:border-indigo-400 p-6 rounded-3xl text-left space-y-2 shadow-xl transition-all">
                    <span className="text-2xl">📋</span>
                    <h3 className="text-sm font-bold text-indigo-300">View Directory</h3>
                    <p className="text-xs text-slate-400">View all courses ({courses.length}), tutors ({tutors.length}) & students ({students.length}).</p>
                  </button>
                </div>

                {teacherApps.length > 0 && (
                  <div className="bg-indigo-950/40 border border-indigo-600/50 p-6 rounded-3xl space-y-3">
                    <h3 className="text-sm font-bold text-indigo-300">Pending Teacher Applications ({teacherApps.length})</h3>
                    {teacherApps.map(app => (
                      <div key={app.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                        <p className="font-bold text-white">{app.name} ({app.email})</p>
                        <p className="text-indigo-400">Expertise: {app.expertise}</p>
                        <p className="text-slate-300">Bio: {app.bio}</p>
                      </div>
                    ))}
                  </div>
                )}

                {studentApps.length > 0 && (
                  <div className="bg-cyan-950/40 border border-cyan-600/50 p-6 rounded-3xl space-y-3">
                    <h3 className="text-sm font-bold text-cyan-300">Pending Student Applications ({studentApps.length})</h3>
                    {studentApps.map(app => (
                      <div key={app.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                        <p className="font-bold text-white">{app.name} ({app.email})</p>
                        <p className="text-cyan-400">Track: {app.track}</p>
                        <p className="text-slate-300">Motivation: {app.motivation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {timetableRequests.length > 0 && (
                  <div className="bg-amber-950/40 border border-amber-600/50 p-6 rounded-3xl space-y-4">
                    <h3 className="text-sm font-bold text-amber-300">Tutor Timetable Sign-Off Requests ({timetableRequests.length})</h3>
                    {timetableRequests.map(req => (
                      <div key={req.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <p className="text-white font-bold">{req.course_name} — Instructor: {req.tutor_name}</p>
                          <p className="text-amber-400 font-mono">Proposed: {req.proposed_timetable}</p>
                        </div>
                        <button onClick={() => handleApproveTimetable(req.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl">Sign Off</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {adminView === 'directory' && (
              <div className="space-y-6">
                <button onClick={() => setAdminView('hub')} className="text-xs font-bold text-indigo-400 hover:underline">← Back to Hub</button>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white">📚 Active Courses ({courses.length})</h3>
                  {courses.length === 0 ? (
                    <p className="text-xs text-slate-400">No courses created yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {courses.map(c => (
                        <div key={c.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{c.name} <span className="font-mono text-indigo-400">({c.code})</span></p>
                            <p className="text-slate-400">{c.timetable}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white">👨‍🏫 Assigned Tutors ({tutors.length})</h3>
                  {tutors.length === 0 ? (
                    <p className="text-xs text-slate-400">No tutors assigned yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {tutors.map(t => (
                        <div key={t.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{t.name} <span className="font-mono text-emerald-400">({t.code})</span></p>
                            <p className="text-slate-400">{t.email}</p>
                            <p className="text-indigo-300">Course: {t.course_name || 'Unassigned'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white">🎓 Admitted Students ({students.length})</h3>
                  {students.length === 0 ? (
                    <p className="text-xs text-slate-400">No students admitted yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {students.map(s => (
                        <div key={s.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{s.name} <span className="font-mono text-cyan-400">({s.code})</span></p>
                            <p className="text-slate-400">{s.email}</p>
                            <p className="text-indigo-300">Course: {s.course_name || 'Unassigned'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {adminView === 'course' && (
              <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
                <button onClick={() => setAdminView('hub')} className="text-xs font-bold text-indigo-400 hover:underline">← Back to Hub</button>
                <h3 className="text-base font-bold text-white">Create Course</h3>
                <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
                  <input type="text" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} placeholder="Course Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                  <input type="text" value={newCourseTimetable} onChange={e => setNewCourseTimetable(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl">Create Course</button>
                </form>
              </div>
            )}

            {adminView === 'tutor' && (
              <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
                <button onClick={() => setAdminView('hub')} className="text-xs font-bold text-indigo-400 hover:underline">← Back to Hub</button>
                <h3 className="text-base font-bold text-white">Assign Tutor</h3>
                <form onSubmit={handleCreateTutor} className="space-y-4 text-xs">
                  <input type="text" value={newTutorName} onChange={e => setNewTutorName(e.target.value)} placeholder="Instructor Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                  <input type="email" value={newTutorEmail} onChange={e => setNewTutorEmail(e.target.value)} placeholder="Instructor Email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                  <select value={newTutorCourseId} onChange={e => setNewTutorCourseId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">Assign Tutor</button>
                </form>
              </div>
            )}

            {adminView === 'student' && (
              <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
                <button onClick={() => setAdminView('hub')} className="text-xs font-bold text-indigo-400 hover:underline">← Back to Hub</button>
                <h3 className="text-base font-bold text-white">Admit Student</h3>
                <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
                  <input type="text" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="Student Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                  <input type="email" value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} placeholder="Student Email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
                  <select value={newStudentCourseId} onChange={e => setNewStudentCourseId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl">Admit Student</button>
                </form>
              </div>
            )}
          </div>
        )}

        {user && user.role === 'tutor' && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl max-w-3xl mx-auto">
            <h2 className="text-lg font-bold text-white">Instructor Dashboard</h2>
            <p className="text-xs text-slate-400">Welcome, {user.name} &bull; Course: <span className="text-emerald-400 font-bold">{user.course_name}</span></p>
            <div className="space-y-4 text-xs bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-sm">Master Schedule</h3>
              <p className="text-slate-300 font-mono bg-slate-900 p-3 rounded-xl">{user.timetable || 'No schedule set.'}</p>
            </div>
            <form onSubmit={handleProposeTimetable} className="space-y-3 text-xs bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-indigo-400 text-sm">Propose Timetable Update</h3>
              <input type="text" value={proposedTimetable} onChange={e => setProposedTimetable(e.target.value)} placeholder="e.g. Tue & Thu: 2:00 PM - 4:00 PM WAT" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white" required />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl">Submit to Admin</button>
            </form>
          </div>
        )}

        {user && user.role === 'student' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white">Student Dashboard</h2>
              <p className="text-xs text-slate-400">Welcome, {user.name} (Code: {user.code})</p>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <span className="text-slate-500 uppercase text-[10px] font-bold">Class Timetable</span>
                <p className="text-emerald-400 font-mono font-bold text-sm">{user.timetable || 'Pending.'}</p>
              </div>
              <form onSubmit={handleUpdateStudentProfile} className="space-y-3 text-xs border-t border-slate-800 pt-6">
                <h3 className="text-sm font-bold text-white">Edit Profile</h3>
                <textarea value={editBio !== '' ? editBio : (user.bio || '')} onChange={e => setEditBio(e.target.value)} placeholder="Bio" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-20 resize-none" />
                <input type="text" value={editPhone !== '' ? editPhone : (user.phone || '')} onChange={e => setEditPhone(e.target.value)} placeholder="Phone Number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white" />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl">Save Profile</button>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-500 mt-12 py-4 border-t border-slate-900 max-w-6xl mx-auto">
        Minority Watch &copy; 2026 QueerTech Empowerment Initiative (QTEI)
      </footer>
    </div>
  );
}
