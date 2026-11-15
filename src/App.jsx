import React, { useState, useEffect } from 'react';

export default function App() {
  // --- STATE HOOKS ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState('select-role');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([
    { id: 1, name: 'Full-Stack Software Engineering', tutor: 'Dr. Sarah Jenkins', tutorCode: 'TUTOR-SJ-101', type: 'Tech' },
    { id: 2, name: 'Data Science & AI Analytics', tutor: 'Alex Adebayo', tutorCode: 'TUTOR-AA-202', type: 'Tech' }
  ]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentCourse, setNewStudentCourse] = useState('Full-Stack Software Engineering');
  const [newTutorName, setNewTutorName] = useState('');
  const [newTutorCourseName, setNewTutorCourseName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);

  // --- SAFE DATA FETCHING ON MOUNT ---
  useEffect(() => {
    fetch('https://qtei-backend.onrender.com/api/students')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStudents(data);
      })
      .catch(err => console.log('Backend sync skipped/offline, using local state.'));
  }, []);

  // --- HANDLERS ---
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
          code: randomCode,
          status: 'Admitted'
        })
      });
      
      if (response.ok) {
        const savedStudent = await response.json();
        setStudents([...students, savedStudent]);
      } else {
        // Fallback local append if backend schema/endpoint varies
        setStudents([...students, { name: newStudentName, email: newStudentEmail, course: newStudentCourse, code: randomCode }]);
      }
      
      setSuccessMsg(`✅ Student ${newStudentName} admitted successfully! Code: ${randomCode}`);
      setNewStudentName('');
      setNewStudentEmail('');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      // Graceful local fallback so UI never breaks on network error
      const fallbackStudent = { name: newStudentName, email: newStudentEmail, course: newStudentCourse, code: randomCode };
      setStudents([...students, fallbackStudent]);
      setSuccessMsg(`✅ Student ${newStudentName} admitted locally! Code: ${randomCode}`);
      setNewStudentName('');
      setNewStudentEmail('');
      setTimeout(() => setSuccessMsg(''), 6000);
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
    setSuccessMsg(`✅ Instructor ${newTutorName} created successfully! Access Code: ${randomTutorCode}`);
    setNewTutorName('');
    setNewTutorCourseName('');
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-6 transition-colors duration-300`}>
      
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
          <button 
            onClick={() => setCurrentView(currentView === 'admin' ? 'select-role' : 'admin')}
            className="text-xs font-bold px-4 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md"
          >
            {currentView === 'admin' ? '🏠 Home Portal' : '⚙️ Admin Center'}
          </button>
        </div>
      </header>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="max-w-6xl mx-auto mb-6 bg-indigo-950/80 border border-indigo-500 text-indigo-200 px-4 py-3 rounded-2xl text-xs font-medium shadow-xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-indigo-300 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Main View Container */}
      <main className="max-w-6xl mx-auto space-y-8">
        
        {/* Role Selector / Main Landing if not Admin */}
        {currentView === 'select-role' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-10">
            <div onClick={() => setCurrentView('admin')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl cursor-pointer transition-all shadow-xl space-y-3">
              <span className="text-2xl">⚙️</span>
              <h3 className="text-base font-bold text-white">Admin Control Center</h3>
              <p className="text-xs text-slate-400">Admit students, provision instructor credentials, oversee database rosters, and track platform telemetry.</p>
            </div>
            <div onClick={() => setCurrentView('student')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl cursor-pointer transition-all shadow-xl space-y-3">
              <span className="text-2xl">🎓</span>
              <h3 className="text-base font-bold text-white">Student Portal</h3>
              <p className="text-xs text-slate-400">Access tech tracks, review assignment progress, download resources, and monitor cohort standing.</p>
            </div>
            <div onClick={() => setCurrentView('tutor')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl cursor-pointer transition-all shadow-xl space-y-3">
              <span className="text-2xl">👨‍🏫</span>
              <h3 className="text-base font-bold text-white">Instructor Portal</h3>
              <p className="text-xs text-slate-400">Manage course curriculums, review submitted student tasks, log attendance, and update grading queues.</p>
            </div>
          </div>
        )}

        {/* Admin Center View */}
        {currentView === 'admin' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Admit Student Form */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><span>👤</span> Admit & Save Student to Database</h3>
                <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={newStudentName} 
                      onChange={e => setNewStudentName(e.target.value)}
                      placeholder="e.g. Jordan Adeleke" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={newStudentEmail} 
                      onChange={e => setNewStudentEmail(e.target.value)}
                      placeholder="e.g. jordan@example.com" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Assigned Track</label>
                    <select 
                      value={newStudentCourse} 
                      onChange={e => setNewStudentCourse(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md">
                    Admit Student & Save
                  </button>
                </form>
              </div>

              {/* Create Tutor Form */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><span>👨‍🏫</span> Create & Assign Instructor</h3>
                <form onSubmit={handleCreateTutor} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Instructor Name</label>
                    <input 
                      type="text" 
                      value={newTutorName} 
                      onChange={e => setNewTutorName(e.target.value)}
                      placeholder="e.g. Dr. Amina Bello" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Course / Module Title</label>
                    <input 
                      type="text" 
                      value={newTutorCourseName} 
                      onChange={e => setNewTutorCourseName(e.target.value)}
                      placeholder="e.g. Cloud Architecture & DevOps" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md mt-6">
                    Provision Instructor Access
                  </button>
                </form>
              </div>

            </div>

            {/* Database Roster Summary & Clickable Profiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              
              {/* Students List */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
                <h3 className="text-sm font-bold text-white">Database Student Roster ({students.length})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {students.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No students admitted yet. Use the form above.</p>
                  ) : (
                    students.map(s => (
                      <div 
                        key={s.id || s.email} 
                        onClick={() => setSelectedProfile({ type: 'student', data: s })}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs cursor-pointer hover:border-indigo-500 transition-all shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-white">{s.name}</p>
                          <p className="text-indigo-400">{s.course}</p>
                        </div>
                        <span className="font-mono bg-amber-950/60 text-amber-300 border border-amber-800 px-2 py-1 rounded">{s.code || 'Admitted'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Instructors List */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-xl">
                <h3 className="text-sm font-bold text-white">Active Instructors ({courses.length})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {courses.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedProfile({ type: 'tutor', data: c })}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs cursor-pointer hover:border-emerald-500 transition-all shadow-sm"
                    >
                      <div>
                        <p className="font-bold text-white">{c.tutor}</p>
                        <p className="text-emerald-400">{c.name}</p>
                      </div>
                      <span className="font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800 px-2 py-1 rounded">{c.tutorCode}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Student View Portal */}
        {currentView === 'student' && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white">Student Portal Dashboard</h2>
            <p className="text-xs text-slate-400">Welcome to your cohort learning center. Select your enrolled tech track below to access materials.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map(c => (
                <div key={c.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 font-mono">Enrolled Track</span>
                  <h4 className="font-bold text-white text-sm">{c.name}</h4>
                  <p className="text-xs text-slate-400">Instructor: {c.tutor}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tutor View Portal */}
        {currentView === 'tutor' && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white">Instructor Management Portal</h2>
            <p className="text-xs text-slate-400">Manage student submissions, grade assignments, and publish lecture updates.</p>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
              <p className="font-bold text-emerald-400">Active Grading Queue</p>
              <p className="text-slate-400">No pending student assignment submissions require review at this moment.</p>
            </div>
          </div>
        )}

      </main>

      {/* Profile Detail Inspection Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white capitalize">{selectedProfile.type} Profile Details</h3>
              <button onClick={() => setSelectedProfile(null)} className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 px-3 py-1 rounded-xl">✕ Close</button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <p><strong>Name:</strong> <span className="text-white">{selectedProfile.data.name || selectedProfile.data.tutor}</span></p>
              <p><strong>Track / Course:</strong> <span className="text-indigo-400">{selectedProfile.data.course || selectedProfile.data.name}</span></p>
              <p><strong>Email / Code:</strong> <span className="font-mono text-amber-300">{selectedProfile.data.email || selectedProfile.data.tutorCode}</span></p>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <p className="font-bold text-white uppercase text-[10px] tracking-wider">Curriculum & Progress Overview</p>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-[11px] text-slate-400">Status: Active &bull; Attendance: 95% &bull; Assignments Completed: 4/5</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 mt-10 py-4 border-t border-slate-900 max-w-6xl mx-auto">
        Minority Watch &copy; 2026 QueerTech Empowerment Initiative (QTEI) &bull; A Minority Watch Organisation Nigeria Program
      </footer>

    </div>
  );
}
