import React, { useState, useEffect } from 'react';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState('select-role');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
    }
  }, [isDarkMode]);

  // --- ANNOUNCEMENT BROADCAST STATE ---
  const [announcement, setAnnouncement] = useState('🔔 QTEI Notice: Cohort 2 Orientation begins Monday at 10:00 AM WAT. Ensure your Human Rights module is reviewed.');
  const [newAnnouncementInput, setNewAnnouncementInput] = useState('');

  // --- STUDENT AUTH STATE ---
  const [inviteCode, setInviteCode] = useState('');
  const [studentError, setStudentError] = useState('');
  const [studentLoggedIn, setStudentLoggedIn] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const hasStudentVisited = localStorage.getItem('qtei_student_returning');

  // --- TUTOR AUTH STATE ---
  const [tutorInviteCode, setTutorInviteCode] = useState('');
  const [tutorError, setTutorError] = useState('');
  const [tutorLoggedIn, setTutorLoggedIn] = useState(false);
  const [tutorData, setTutorData] = useState(null);
  const [tutorMagicLinkSent, setTutorMagicLinkSent] = useState(false);
  const hasTutorVisited = localStorage.getItem('qtei_tutor_returning');

  // --- DATABASE-BACKED SYSTEM STATE ---
  const [courses, setCourses] = useState([
    { id: 1, name: 'Front-End Engineering', tutor: 'Amina Yusuf', tutorCode: 'TUTOR-AM-101', type: 'Tech' },
    { id: 2, name: 'Cybersecurity', tutor: 'Chinedu Okoro', tutorCode: 'TUTOR-CH-202', type: 'Tech' },
    { id: 3, name: 'Human Rights & Digital Advocacy', tutor: 'Dr. Emeka Obi', tutorCode: 'TUTOR-EM-303', type: 'Compulsory' }
  ]);

  const [students, setStudents] = useState([]);
  
  // Fetch students from backend server on load
  useEffect(() => {
fetch('https://qtei-backend.onrender.com/api/...')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStudents(data);
      })
      .catch(err => console.error('Backend fetch error:', err));
  }, []);

  const [curriculumLessons, setCurriculumLessons] = useState([
    { id: 101, course: 'Front-End Engineering', week: 'Week 1 - Day 1', title: 'HTML5 Semantic Structure & Modern CSS Layouts', mode: 'Live', time: 'Mon 10:00 AM WAT', meetUrl: 'https://meet.google.com/new' },
    { id: 102, course: 'Front-End Engineering', week: 'Week 1 - Day 2', title: 'JavaScript Essentials & DOM Manipulation', mode: 'Live', time: 'Wed 10:00 AM WAT', meetUrl: 'https://meet.google.com/new' }
  ]);

  const [pendingRequests, setPendingRequests] = useState([
    { id: 1, type: 'Schedule Change Request', tutor: 'Amina Yusuf', details: 'Reschedule Week 2 - Day 2 to Thursday due to health leave (Sick day off)', status: 'Pending' }
  ]);

  // --- ASSIGNMENT SUBMISSION VAULT STATE ---
  const [submissions, setSubmissions] = useState([
    { id: 1, studentName: 'Blessing Adebayo', course: 'Front-End Engineering', title: 'Assignment 1: Responsive Dashboard', link: 'https://github.com/example/repo', grade: 'Pending' }
  ]);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentLink, setAssignmentLink] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  // Form states for Tutor actions
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonWeek, setNewLessonWeek] = useState('Week 2 - Day 1');

  // Admin student creation form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentCourse, setNewStudentCourse] = useState('Front-End Engineering');

  // Admin tutor creation form
  const [newTutorName, setNewTutorName] = useState('');
  const [newTutorCourseName, setNewTutorCourseName] = useState('Cloud Computing');

  // --- STUDENT AUTH HANDLERS ---
  const handleStudentLogin = (e) => {
    e.preventDefault();
    setStudentError('');
    if (!hasStudentVisited) {
      const found = students.find(s => s.code.toUpperCase() === inviteCode.trim().toUpperCase());
      if (found && found.status === 'Admitted') {
        setStudentData(found);
        setStudentLoggedIn(true);
        localStorage.setItem('qtei_student_returning', 'true');
        localStorage.setItem('qtei_student_email', found.email);
      } else {
        setStudentError('Invalid welcome code. Check your admission letter.');
      }
    } else {
      setMagicLinkSent(true);
    }
  };

  const handleSimulateStudentMagicLink = () => {
    const email = localStorage.getItem('qtei_student_email') || 'blessing@example.com';
    const found = students.find(s => s.email === email) || students[0];
    setStudentData(found);
    setStudentLoggedIn(true);
    setMagicLinkSent(false);
  };

  // --- TUTOR AUTH HANDLERS ---
  const handleTutorLogin = (e) => {
    e.preventDefault();
    setTutorError('');
    if (!hasTutorVisited) {
      const found = courses.find(c => c.tutorCode.toUpperCase() === tutorInviteCode.trim().toUpperCase());
      if (found) {
        setTutorData({ name: found.tutor, assignedCourse: found.name, code: found.tutorCode });
        setTutorLoggedIn(true);
        localStorage.setItem('qtei_tutor_returning', 'true');
        localStorage.setItem('qtei_tutor_code', found.tutorCode);
      } else {
        setTutorError('Invalid tutor access code. Try TUTOR-AM-101');
      }
    } else {
      setTutorMagicLinkSent(true);
    }
  };

  // --- ADMIN ACTIONS (Connected to PostgreSQL Backend) ---
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;
    const randomCode = `QTEI-${newStudentCourse.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const response = await fetch('https://qtei-backend.onrender.com/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStudentName,
          email: newStudentEmail,
          course: newStudentCourse,
          code: randomCode
        })
      });
      const savedStudent = await response.json();
      setStudents([...students, savedStudent]);
      setSuccessMsg(`Student ${newStudentName} admitted and saved to database! Code: ${randomCode}`);
      setNewStudentName('');
      setNewStudentEmail('');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      alert('Error saving student to backend server.');
    }
  };
  const handleCreateTutor = (e) => {
    e.preventDefault();
    if (!newTutorName.trim() || !newTutorCourseName.trim()) return;
    const randomTutorCode = `TUTOR-${newTutorName.substring(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newCourseObj = {
      id: Date.now(),
      name: newTutorCourseName,
      tutor: newTutorName,
      tutorCode: randomTutorCode,
      type: 'Tech'
    };
    setCourses([...courses, newCourseObj]);
    setSuccessMsg(`Instructor ${newTutorName} created successfully! Access Code: ${randomTutorCode}`);
    setNewTutorName('');
    setNewTutorCourseName('');
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleRequestNewClass = (e) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;
    setPendingRequests([...pendingRequests, {
      id: Date.now(),
      type: 'New Class Creation',
      tutor: tutorData.name,
      details: `Create "${newLessonTitle}" (${newLessonWeek}) for ${tutorData.assignedCourse}`,
      status: 'Pending Admin Approval'
    }]);
    setNewLessonTitle('');
    alert('Class creation submitted to Admin Control Center for sign-off approval!');
  };

  const handleAdminApproveRequest = (id) => {
    setPendingRequests(pendingRequests.filter(r => r.id !== id));
    setSuccessMsg(`Request approved! Master timetable and student calendars synchronized.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleGradeSubmission = (subId, newGrade) => {
    setSubmissions(submissions.map(s => s.id === subId ? { ...s, grade: newGrade } : s));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-indigo-900/20 via-violet-900/20 to-rose-900/10 blur-3xl pointer-events-none -z-10"></div>

      {/* Global Admin Broadcast Ticker */}
      <div className="w-full max-w-6xl mx-auto mb-4 bg-indigo-950/80 border border-indigo-500/40 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs backdrop-blur-md shadow-lg">
        <span className="text-indigo-200 font-medium truncate">📢 <strong>Announcement:</strong> {announcement}</span>
        <span className="text-[10px] text-indigo-400 font-mono uppercase bg-indigo-900/60 px-2 py-0.5 rounded ml-2 whitespace-nowrap">Live Ticker</span>
      </div>

      {/* Header & Brand Navigation */}
      <header className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center py-4 border-b border-slate-800/80 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-xs">MW</span>
          </div>
          <div>
            <span className="font-bold tracking-wide uppercase text-sm bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Minority Watch</span>
            <span className="block text-[10px] text-indigo-400 font-medium uppercase tracking-widest">QTEI LMS Portal</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
          <button onClick={() => setCurrentView('select-role')} className={`text-xs px-3.5 py-2 rounded-xl font-medium transition-all ${currentView === 'select-role' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Home</button>
          <button onClick={() => setCurrentView('student-portal')} className={`text-xs px-3.5 py-2 rounded-xl font-medium transition-all ${currentView === 'student-portal' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Student Portal</button>
          <button onClick={() => setCurrentView('tutor-portal')} className={`text-xs px-3.5 py-2 rounded-xl font-medium transition-all ${currentView === 'tutor-portal' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Tutor Portal</button>
          <button onClick={() => setCurrentView('admin-dashboard')} className={`text-xs px-3.5 py-2 rounded-xl font-medium transition-all ${currentView === 'admin-dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Admin Center</button><button 
  onClick={() => setIsDarkMode(!isDarkMode)}
  className="text-xs px-3.5 py-2 rounded-xl font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all"
>
  {isDarkMode ? '☀️ Light' : '🌙 Dark'}
</button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-6xl mx-auto my-8 flex-grow">
        
        {/* Role Selector Screen */}
        {currentView === 'select-role' && (
          <div className="max-w-md mx-auto text-center py-12 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500"></div>
            <h2 className="text-3xl font-extrabold text-white mb-2">QTEI Learning Hub</h2>
            <p className="text-sm text-slate-400 mb-8">A Minority Watch Organisation Nigeria Program</p>
            <div className="space-y-3.5">
              <button onClick={() => setCurrentView('student-portal')} className="w-full bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium py-3.5 rounded-2xl transition-all text-sm border border-slate-700/60 shadow-md">Student Portal</button>
              <button onClick={() => setCurrentView('tutor-portal')} className="w-full bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium py-3.5 rounded-2xl transition-all text-sm border border-slate-700/60 shadow-md">Tutor Portal</button>
              <button onClick={() => setCurrentView('admin-dashboard')} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 rounded-2xl transition-all text-sm shadow-xl shadow-indigo-600/30">Admin Control Center</button>
            </div>
          </div>
        )}
       

        {/* ================= STUDENT PORTAL ================= */}
        {currentView === 'student-portal' && (
          <div>
            {!studentLoggedIn ? (
              <div className="w-full max-w-md mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
                {!hasStudentVisited ? (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">First-Time Student Login</h2>
                    <p className="text-sm text-slate-400 mb-6">Enter your welcome admission code sent via email.</p>
                    {studentError && <div className="mb-4 p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl">{studentError}</div>}
                    <form onSubmit={handleStudentLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">Welcome Code</label>
                        <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="e.g. QTEI-FE-9921" className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm uppercase font-mono" required />
                        <span className="text-[11px] text-slate-500 mt-1.5 block">Test code: <code className="text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">QTEI-FE-9921</code></span>
                      </div>
                      <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 rounded-2xl text-sm shadow-lg">Verify & Enter Portal</button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome Back, Scholar</h2>
                    <p className="text-sm text-slate-400 mb-6">Click below to receive a secure instant sign-in link.</p>
                    {!magicLinkSent ? (
                      <button onClick={handleStudentLogin} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 rounded-2xl text-sm shadow-lg">Send Magic Sign-In Link</button>
                    ) : (
                      <div className="bg-slate-950 border border-indigo-500/40 p-4 rounded-2xl text-center space-y-3">
                        <p className="text-xs text-indigo-300 font-medium">📬 Secure magic link dispatched!</p>
                        <button onClick={handleSimulateStudentMagicLink} className="w-full bg-emerald-600 text-white text-xs py-2.5 rounded-xl font-semibold">[Simulate Email Click] Open Dashboard</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl gap-4 shadow-xl">
                  <div>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-medium">Scholar Workspace</span>
                    <h1 className="text-2xl font-extrabold text-white mt-2">Welcome, {studentData.name}</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Enrolled Tracks: <span className="text-indigo-400 font-semibold">{studentData.course}</span> &bull; <span className="text-rose-400 font-semibold">Human Rights & Digital Advocacy</span></p>
                  </div>
                  <button onClick={() => setStudentLoggedIn(false)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 font-medium">Log Out</button>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white uppercase tracking-wider">Overall Graduation Readiness & Curriculum Progress</span>
                    <span className="text-indigo-400 font-mono font-bold">75% Completed</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-white">Your Synchronized Timetable</h3>
                    <div className="space-y-3">
                      {curriculumLessons.map(lesson => (
                        <div key={lesson.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center gap-3">
                          <div>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">{lesson.course}</span>
                            <h4 className="text-sm font-bold text-white mt-1">{lesson.title}</h4>
                          </div>
                          <a href={lesson.meetUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap">Join Class &rarr;</a>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-white">Submit Assignment</h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if(!assignmentTitle || !assignmentLink) return;
                      setSubmissions([{ id: Date.now(), studentName: studentData.name, course: studentData.course, title: assignmentTitle, link: assignmentLink, grade: 'Submitted' }, ...submissions]);
                      setAssignmentTitle(''); setAssignmentLink('');
                      alert('Assignment submitted!');
                    }} className="space-y-3">
                      <input type="text" value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} placeholder="Task Title" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" required />
                      <input type="url" value={assignmentLink} onChange={(e) => setAssignmentLink(e.target.value)} placeholder="GitHub / Doc Link" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" required />
                      <button type="submit" className="w-full bg-slate-800 text-white text-xs py-2.5 rounded-xl font-semibold">Submit to Tutor</button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TUTOR PORTAL ================= */}
        {currentView === 'tutor-portal' && (
          <div>
            {!tutorLoggedIn ? (
              <div className="w-full max-w-md mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 to-pink-500"></div>
                {!hasTutorVisited ? (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">First-Time Tutor Login</h2>
                    <p className="text-sm text-slate-400 mb-6">Enter your assigned tutor access code.</p>
                    {tutorError && <div className="mb-4 p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl">{tutorError}</div>}
                    <form onSubmit={handleTutorLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">Tutor Access Code</label>
                        <input type="text" value={tutorInviteCode} onChange={(e) => setTutorInviteCode(e.target.value)} placeholder="e.g. TUTOR-AM-101" className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm uppercase font-mono" required />
                        <span className="text-[11px] text-slate-500 mt-1.5 block">Test code: <code className="text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">TUTOR-AM-101</code></span>
                      </div>
                      <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 rounded-2xl text-sm shadow-lg">Verify & Access</button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome Back, Instructor</h2>
                    <p className="text-sm text-slate-400 mb-6">Click below to receive your instant secure sign-in link.</p>
                    {!tutorMagicLinkSent ? (
                      <button onClick={handleTutorLogin} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 rounded-2xl text-sm shadow-lg">Send Magic Sign-In Link</button>
                    ) : (
                      <div className="bg-slate-950 border border-indigo-500/40 p-4 rounded-2xl text-center space-y-3">
                        <p className="text-xs text-indigo-300 font-medium">📬 Secure magic link dispatched!</p>
                        <button onClick={handleSimulateTutorMagicLink} className="w-full bg-emerald-600 text-white text-xs py-2.5 rounded-xl font-semibold">[Simulate Email Click] Open Tutor Dashboard</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 via-violet-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <div>
                    <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full font-medium">Tutor Portal Dashboard</span>
                    <h1 className="text-2xl font-extrabold text-white mt-2">Welcome, {tutorData.name}</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Assigned Track: <span className="text-indigo-400 font-semibold">{tutorData.assignedCourse}</span></p>
                  </div>
                  <button onClick={() => setTutorLoggedIn(false)} className="text-xs bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 font-medium">Log Out</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-white">Student Assignment Submissions</h3>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {submissions.filter(s => s.course === tutorData.assignedCourse).map(sub => (
                        <div key={sub.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-xs space-y-2">
                          <p className="font-bold text-white">{sub.studentName} &bull; <span className="text-indigo-400">{sub.title}</span></p>
                          <a href={sub.link} target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline block truncate">{sub.link}</a>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-slate-400 font-mono">Status: {sub.grade}</span>
                            <div className="flex gap-1">
                              <button onClick={() => handleGradeSubmission(sub.id, 'Passed (A)')} className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px]">Pass</button>
                              <button onClick={() => handleGradeSubmission(sub.id, 'Revision Required')} className="bg-amber-600 text-white px-2.5 py-1 rounded-lg text-[10px]">Revise</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-white">Create Class & Request Sign-Off</h3>
                    <form onSubmit={handleRequestNewClass} className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Week & Day</label>
                        <input type="text" value={newLessonWeek} onChange={(e) => setNewLessonWeek(e.target.value)} placeholder="e.g. Week 2 - Day 1" className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500" required />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Topic Title</label>
                        <input type="text" value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder="e.g. Advanced State Management" className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500" required />
                      </div>
                      <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs py-3 rounded-xl font-semibold shadow-md transition-all">Submit for Admin Sign-Off</button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= ADMIN DASHBOARD ================= */}
        {currentView === 'admin-dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <div>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-medium">System Admin</span>
                <h1 className="text-2xl font-extrabold text-white mt-2">Admin Control Center</h1>
                <p className="text-xs text-slate-400 mt-0.5">Create instructors, admit students to database, and approve schedules.</p>
              </div>
            </div>

            {successMsg && <div className="p-4 bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs rounded-2xl shadow-xl">{successMsg}</div>}

            {/* Broadcast Announcement Controller */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">Broadcast Global Cohort Announcement</h3>
              <div className="flex gap-3">
                <input type="text" value={newAnnouncementInput} onChange={(e) => setNewAnnouncementInput(e.target.value)} placeholder="Type emergency or cohort announcement..." className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" />
                <button onClick={() => { if(newAnnouncementInput.trim()) { setAnnouncement(newAnnouncementInput); setNewAnnouncementInput(''); alert('Announcement broadcasted globally!'); } }} className="bg-indigo-600 text-white text-xs px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap">Broadcast</button>
              </div>
            </div>

            {/* Pending Tutor Schedule Requests */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center justify-between">
                <span>Pending Tutor Schedule Sign-Off Requests</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full">{pendingRequests.length} Pending</span>
              </h3>
              {pendingRequests.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No pending schedule sign-off requests.</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-center gap-4 text-xs">
                      <div>
                        <span className="text-indigo-400 font-bold uppercase">{req.type}</span> &bull; Tutor: <span className="text-white font-semibold">{req.tutor}</span>
                        <p className="text-slate-300 mt-1">{req.details}</p>
                      </div>
                      <button onClick={() => handleAdminApproveRequest(req.id)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap">Approve & Sync</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Management Grids: Create Tutor & Create Student */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Create Tutor Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-white">Create & Assign Instructor</h3>
                <form onSubmit={handleCreateTutor} className="space-y-3.5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">Instructor Full Name</label>
                    <input type="text" value={newTutorName} onChange={(e) => setNewTutorName(e.target.value)} placeholder="e.g. Dr. Samuel Okon" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">Assigned Course Track</label>
                    <input type="text" value={newTutorCourseName} onChange={(e) => setNewTutorCourseName(e.target.value)} placeholder="e.g. Cloud Computing & DevOps" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" required />
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 rounded-2xl text-sm font-semibold shadow-lg">Create Tutor & Generate Access Code</button>
                </form>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-300">Active Instructors Roster</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {courses.map(c => (
                      <div key={c.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{c.tutor}</p>
                          <p className="text-violet-400">{c.name}</p>
                        </div>
                        <span className="font-mono bg-violet-950/60 text-violet-300 border border-violet-800 px-2 py-1 rounded">{c.tutorCode}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Create Student Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-white">Admit & Save Student to Database</h3>
                <form onSubmit={handleCreateStudent} className="space-y-3.5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">Full Legal Name</label>
                    <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="e.g. Chioma Adebayo" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">Email Address</label>
                    <input type="email" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} placeholder="chioma@example.com" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">Assigned Tech Track (+ Human Rights)</label>
                    <select value={newStudentCourse} onChange={(e) => setNewStudentCourse(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white">
                      {courses.filter(c => c.type === 'Tech').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-2xl text-sm font-semibold shadow-lg">Admit Student & Save to Database</button>
                </form>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-300">Database Roster Summary ({students.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {students.map(s => (
                      <div key={s.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{s.name}</p>
                          <p className="text-indigo-400">{s.course}</p>
                        </div>
                        <span className="font-mono bg-amber-950/60 text-amber-300 border border-amber-800 px-2 py-1 rounded">{s.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 mt-10 py-4 border-t border-slate-900">
        Minority Watch &copy; 2026 QueerTech Empowerment Initiative (QTEI) &bull; A Minority Watch Organisation Nigeria Program
      </footer>
    </div>
  );
}
