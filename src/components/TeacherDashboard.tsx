import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import AttentionChart from './AttentionChart';
import EngagementPieChart from './EngagementPieChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AttentionBarChart from './AttentionBarChart';
import EngagementRadarChart from './EngagementRadarChart';
import StatCard from './StatCard';

interface Room {
  id: string;
  teacheremail: string;
  createdAt?: string;
}

interface Student {
  id: string;
  userId: string;
  joinedAt?: string;
  role?: string;
  averageAttention?: number;
  distractionCount?: number;
}

const TeacherDashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [studentsByRoom, setStudentsByRoom] = useState<Record<string, Student[]>>({});
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [modalAttentionData, setModalAttentionData] = useState<{ attention: number; timestamp: string }[]>([]);
  const [modalRoom, setModalRoom] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [studentAttentionData, setStudentAttentionData] = useState<Record<string, Record<string, { attention: number; timestamp: string }[]>>>({});
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  // Mapping of teacher emails to display names
  const teacherNameMap: Record<string, string> = {
    'amarsir@gmail.com': 'Amar Sir',
    'vermasir@gmail.com': 'Dr. Verma',
    'sharmasir@gmail.com': 'Professor Sharma',
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchRoomsAndStudents = async () => {
      if (!userEmail) return;
      setLoading(true);
      const q = query(
        collection(db, 'conferences'),
        where('teacheremail', '==', userEmail)
      );
      const snapshot = await getDocs(q);
      const fetchedRooms: Room[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(fetchedRooms);
      const studentsData: Record<string, Student[]> = {};
      const attentionDataMap: Record<string, Record<string, { attention: number; timestamp: string }[]>> = {};
      for (const room of fetchedRooms) {
        const usersSnap = await getDocs(collection(db, 'conferences', room.id, 'users'));
        const students: Student[] = [];
        attentionDataMap[room.id] = {};
        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          if (userData.role !== 'teacher') {
            // Fetch attention data for this student
            const attentionsSnap = await getDocs(query(collection(db, 'conferences', room.id, 'attentions'), where('userId', '==', userData.userId)));
            const attentions = attentionsSnap.docs.map(d => d.data() as { attention: number; timestamp: string });
            let avgAttention = 0;
            let distractionCount = 0;
            if (attentions.length > 0) {
              const scores = attentions.map(a => Number(a.attention) || 0);
              avgAttention = scores.reduce((a, b) => a + b, 0) / scores.length;
              distractionCount = scores.filter(s => s < 40).length;
            }
            students.push({
              id: userDoc.id,
              userId: userData.userId,
              joinedAt: userData.joinedAt,
              averageAttention: avgAttention,
              distractionCount,
            });
            attentionDataMap[room.id][userData.userId] = attentions;
          }
        }
        studentsData[room.id] = students;
      }
      setStudentsByRoom(studentsData);
      setStudentAttentionData(attentionDataMap);
      setLoading(false);
    };
    fetchRoomsAndStudents();
  }, [userEmail]);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate('/');
  };

  const getTeacherName = () => {
    if (!userEmail) return '';
    if (teacherNameMap[userEmail]) return teacherNameMap[userEmail];
    // Fallback: Get the part before @, then split on common separators and capitalize the first part
    const prefix = userEmail.split('@')[0];
    const first = prefix.split(/[._-]/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  };

  // Fetch attention data for modal student
  const openStudentReport = async (student: Student, roomId: string) => {
    setModalStudent(student);
    setModalRoom(roomId);
    // Fetch all attention data for this student in this room
    const attentionsSnap = await getDocs(query(collection(db, 'conferences', roomId, 'attentions'), where('userId', '==', student.userId)));
    const attentionData = attentionsSnap.docs.map(d => d.data() as { attention: number; timestamp: string });
    setModalAttentionData(attentionData);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalStudent(null);
    setModalAttentionData([]);
    setModalRoom(null);
  };

  // PDF download for student report
  const downloadStudentPdf = async () => {
    const input = document.getElementById('student-report-modal');
    if (input && modalStudent) {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth;
      const height = width / ratio;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height > pdfHeight ? pdfHeight : height);
      pdf.save(`EduPulse-Report-${modalStudent.userId}.pdf`);
    }
  };

  // Download all reports (teacher + all students)
  const downloadAllReports = async () => {
    setPdfLoading(true);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // --- DASHBOARD SUMMARY PAGE ---
    const dashboardDiv = document.getElementById('dashboard-summary-pdf');
    if (dashboardDiv) {
      const canvas = await html2canvas(dashboardDiv, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.addPage();
    }
    let pageAdded = true;
    // Only add each student report as a separate page, one per student, after the dashboard summary
    for (const room of rooms) {
      const students = studentsByRoom[room.id] || [];
      for (const student of students) {
        const studentDiv = document.getElementById(`student-report-${room.id}-${student.id}`);
        if (studentDiv) {
          // Wait a bit to ensure charts are rendered
          await new Promise(res => setTimeout(res, 400));
          pdf.addPage();
          const canvas = await html2canvas(studentDiv, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        }
      }
    }
    pdf.save('EduPulse-Teacher-Full-Report.pdf');
    setPdfLoading(false);
  };

  // Calculate overall stats
  const totalRooms = rooms.length;
  const allStudents = Object.values(studentsByRoom).flat();
  const avgAttention = allStudents.length > 0 ? (allStudents.reduce((sum, s) => sum + (s.averageAttention || 0), 0) / allStudents.length).toFixed(2) : '0.00';
  const totalDistractions = allStudents.reduce((sum, s) => sum + (s.distractionCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col">
      {/* Topbar */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-sm z-20">
        <div className="text-2xl font-bold text-blue-700 tracking-tight">EduPulse</div>
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">Welcome, {getTeacherName()}</span>
          <button
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition-all"
          >
            Logout
          </button>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        {/* Filter Controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <label htmlFor="room-filter" className="text-gray-700 font-medium">Filter by Room:</label>
          <select
            id="room-filter"
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={selectedRoom}
            onChange={e => setSelectedRoom(e.target.value)}
          >
            <option value="">All Rooms</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>{room.id}</option>
            ))}
          </select>
        </div>
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <StatCard
            icon="👨‍🏫"
            label="Classes Taught"
            value={totalRooms}
            colorClass="text-blue-600"
            bgClass="from-blue-50 to-blue-100"
            ariaLabel="Total Rooms"
          />
          <StatCard
            icon="📈"
            label="Avg. Attention"
            value={parseFloat(avgAttention)}
            colorClass="text-green-600"
            bgClass="from-green-50 to-green-100"
            ariaLabel="Average Attention"
            suffix="%"
          />
          <StatCard
            icon="🔔"
            label="Distraction Alerts"
            value={totalDistractions}
            colorClass="text-red-500"
            bgClass="from-red-50 to-red-100"
            ariaLabel="Distraction Alerts"
          />
        </div>
        {/* Rooms List */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-gray-500 text-lg">Loading rooms...</span>
          </div>
        ) : rooms.length > 0 ? (
          <div className="flex flex-col gap-8 w-full">
            {rooms
              .filter(room => !selectedRoom || room.id === selectedRoom)
              .map(room => {
                const students = studentsByRoom[room.id] || [];
                const attentionData = students.flatMap(student => (studentAttentionData[room.id] && studentAttentionData[room.id][student.userId]) || []);
                return (
                  <div key={room.id} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6 w-full">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2 w-full">
                      <div>
                        <div className="text-2xl font-bold text-blue-700 mb-1">Room: {room.id}</div>
                        <div className="text-base text-gray-500">Teacher: {getTeacherName()}</div>
                        <div className="text-base text-gray-500">Students: {students.length}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                      <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">Avg. Attention</div>
                        <div className="text-3xl font-bold text-green-600">{students.length > 0 ? (students.reduce((sum, s) => sum + (s.averageAttention || 0), 0) / students.length).toFixed(2) + '%' : '-'}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">Distraction Alerts</div>
                        <div className="text-3xl font-bold text-red-500">{students.reduce((sum, s) => sum + (s.distractionCount || 0), 0)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">Highest Focus</div>
                        <div className="text-3xl font-bold text-green-500">{students.length > 0 ? Math.max(...students.map(s => s.averageAttention || 0)).toFixed(0) + '%' : '-'}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">Lowest Focus</div>
                        <div className="text-3xl font-bold text-yellow-500">{students.length > 0 ? Math.min(...students.map(s => s.averageAttention || 0)).toFixed(0) + '%' : '-'}</div>
                      </div>
                    </div>
                    <div className="w-full mt-6">
                      {attentionData && attentionData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white rounded-xl shadow-inner p-6">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Attention Analysis</h4>
                            <AttentionBarChart attentionData={attentionData} />
                          </div>
                          <div className="bg-white rounded-xl shadow-inner p-6">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Engagement Analysis</h4>
                            <EngagementRadarChart attentionData={attentionData} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">No attention data available for this room.</div>
                      )}
                    </div>
                    <div className="ml-2">
                      {students.length > 0 ? (
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr>
                              <th className="py-1 px-2">Student</th>
                              <th className="py-1 px-2">Joined At</th>
                              <th className="py-1 px-2">Avg. Attention</th>
                              <th className="py-1 px-2">Distractions</th>
                              <th className="py-1 px-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map(student => (
                              <tr key={student.id}>
                                <td className="py-1 px-2 font-medium">{student.userId}</td>
                                <td className="py-1 px-2">{student.joinedAt || '-'}</td>
                                <td className="py-1 px-2">{student.averageAttention !== undefined ? student.averageAttention.toFixed(2) + '%' : '-'}</td>
                                <td className="py-1 px-2">{student.distractionCount ?? '-'}</td>
                                <td className="py-1 px-2">
                                  <button
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow-md hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all flex items-center gap-2"
                                    onClick={() => openStudentReport(student, room.id)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    View Report
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-gray-500">No students found in this room.</div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="flex justify-center items-center h-40">
            <span className="text-gray-500 text-lg">No rooms found for your account.</span>
          </div>
        )}
      </main>
      <div className="flex justify-center w-full pb-8">
        <button
          onClick={downloadAllReports}
          className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold px-4 py-2 rounded-xl shadow-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={pdfLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {pdfLoading ? 'Generating PDF...' : 'Download All Reports'}
        </button>
      </div>
      {/* Modal for student report */}
      {modalOpen && modalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-auto rounded-3xl shadow-2xl p-0 overflow-hidden" style={{background: 'rgba(255,255,255,0.85)', border: '1.5px solid #e0e7ff', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)', backdropFilter: 'blur(12px)'}}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors text-3xl font-bold focus:outline-none z-10">
              &times;
            </button>
            <div className="px-10 pt-12 pb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-xl shadow">
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-7 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Student Report</h2>
                  <div className="text-gray-500 text-sm">Detailed engagement analytics</div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                <div className="text-gray-700 font-medium">Teacher: <span className="font-semibold text-blue-700">{getTeacherName()}</span></div>
                <div className="text-gray-700 font-medium">Student: <span className="font-semibold text-purple-700">{modalStudent.userId}</span></div>
                <div className="text-gray-600 text-sm">Joined: {modalStudent.joinedAt || '-'}</div>
              </div>
              <div id="student-report-modal">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/80 rounded-2xl shadow-inner p-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-4 text-center">Attention Analysis</h4>
                    {modalAttentionData.length > 0 ? (
                      <AttentionBarChart attentionData={modalAttentionData} />
                    ) : (
                      <div className="text-gray-400 text-center">No attention data available for this student.</div>
                    )}
                  </div>
                  <div className="bg-white/80 rounded-2xl shadow-inner p-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-4 text-center">Engagement Analysis</h4>
                    <EngagementRadarChart attentionData={modalAttentionData} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-2">
                  <div className="rounded-2xl p-6 flex flex-col items-center bg-gradient-to-br from-blue-100 via-blue-50 to-purple-100 shadow">
                    <div className="mb-2">
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-7 text-blue-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m4 0h-1v-4h-1m-4 0h-1v-4h-1' /></svg>
                    </div>
                    <p className="text-sm text-gray-500">Avg. Attention</p>
                    <p className="text-2xl font-bold text-blue-600">{modalStudent.averageAttention !== undefined ? modalStudent.averageAttention.toFixed(2) + '%' : '-'}</p>
                  </div>
                  <div className="rounded-2xl p-6 flex flex-col items-center bg-gradient-to-br from-pink-100 via-red-50 to-yellow-100 shadow">
                    <div className="mb-2">
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-7 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414' /></svg>
                    </div>
                    <p className="text-sm text-gray-500">Distraction Alerts</p>
                    <p className="text-2xl font-bold text-red-500">{modalStudent.distractionCount ?? '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Off-screen dashboard summary for PDF export */}
      <div id="dashboard-summary-pdf" style={{ position: 'absolute', left: '-9999px', top: 0, width: '900px', background: '#fff', padding: 24, boxSizing: 'border-box' }} aria-hidden="true">
        {/* Render the same dashboard summary as on screen: welcome, room summary, charts, table */}
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700 }}>Welcome {getTeacherName()}</h2>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Your Rooms & Student Insights</h3>
          {rooms.map(room => {
            const students = studentsByRoom[room.id] || [];
            const attentionData = students.flatMap(student => (studentAttentionData[room.id] && studentAttentionData[room.id][student.userId]) || []);
            return (
              <div key={room.id} style={{ marginBottom: 32 }}>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Room: {room.id}</div>
                <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
                  <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #d1fae5 60%, #f0fdf4 100%)',
                    borderRadius: '1em',
                    boxShadow: '0 4px 24px #6ee7b733',
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#059669',
                    fontWeight: 800,
                  }}>
                    {students.length}
                    <div style={{ fontSize: '1rem', color: '#10b981' }}>Total Students</div>
                  </div>
                  <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #d1fae5 60%, #f0fdf4 100%)',
                    borderRadius: '1em',
                    boxShadow: '0 4px 24px #6ee7b733',
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#059669',
                    fontWeight: 800,
                  }}>
                    {students.length > 0 ? (students.reduce((sum, s) => sum + (s.averageAttention || 0), 0) / students.length).toFixed(2) + '%' : '-'}
                    <div style={{ fontSize: '1rem', color: '#10b981' }}>Avg. Attention</div>
                  </div>
                  <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #fee2e2 60%, #fef2f2 100%)',
                    borderRadius: '1em',
                    boxShadow: '0 4px 24px #fecaca33',
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#dc2626',
                    fontWeight: 800,
                  }}>
                    {students.reduce((sum, s) => sum + (s.distractionCount || 0), 0)}
                    <div style={{ fontSize: '1rem', color: '#dc2626' }}>Total Distractions</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
                  <div style={{ flex: 1, background: 'linear-gradient(135deg, #e0e7ff 60%, #f3e8ff 100%)', borderRadius: 16, padding: 20, textAlign: 'center', boxShadow: '0 2px 12px #a5b4fc33' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#6366f1', fontSize: 16 }}>Attention Analysis</div>
                    <AttentionBarChart attentionData={attentionData} />
                  </div>
                  <div style={{ flex: 1, background: 'linear-gradient(135deg, #f3e8ff 60%, #e0e7ff 100%)', borderRadius: 16, padding: 20, textAlign: 'center', boxShadow: '0 2px 12px #a5b4fc33' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#a21caf', fontSize: 16 }}>Engagement Analysis</div>
                    <EngagementRadarChart attentionData={attentionData} />
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, background: 'rgba(255,255,255,0.95)', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: 8, fontWeight: 600, textAlign: 'left' }}>Student</th>
                      <th style={{ padding: 8, fontWeight: 600, textAlign: 'left' }}>Joined At</th>
                      <th style={{ padding: 8, fontWeight: 600, textAlign: 'left' }}>Avg. Attention</th>
                      <th style={{ padding: 8, fontWeight: 600, textAlign: 'left' }}>Distractions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id}>
                        <td style={{ padding: 8 }}>{student.userId}</td>
                        <td style={{ padding: 8 }}>{student.joinedAt || '-'}</td>
                        <td style={{ padding: 8 }}>{student.averageAttention !== undefined ? student.averageAttention.toFixed(2) + '%' : '-'}</td>
                        <td style={{ padding: 8 }}>{student.distractionCount ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
      {/* Off-screen student reports for PDF export */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '700px', background: '#fff', padding: 24, boxSizing: 'border-box' }} aria-hidden="true">
        {rooms.map(room => {
          const students = studentsByRoom[room.id] || [];
          return students.map(student => {
            const attentionData = (studentAttentionData[room.id] && studentAttentionData[room.id][student.userId]) || [];
            return (
              <div key={student.id} id={`student-report-${room.id}-${student.id}`} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', margin: '32px 0', padding: 24, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Student Report</h2>
                <div style={{ marginBottom: 4, color: '#333', fontWeight: 500 }}>Teacher: {getTeacherName()}</div>
                <div style={{ marginBottom: 12, color: '#333', fontWeight: 500 }}>Student: {student.userId}</div>
                <div style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>Joined: {student.joinedAt || '-'}</div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                  <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Attention Analysis</div>
                    <AttentionBarChart attentionData={attentionData} />
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Engagement Analysis</div>
                    <EngagementRadarChart attentionData={attentionData} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <div style={{ background: '#e0e7ff', borderRadius: 8, padding: 16, textAlign: 'center', minWidth: 120 }}>
                    <div style={{ fontSize: 13, color: '#555' }}>Avg. Attention</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>{student.averageAttention !== undefined ? student.averageAttention.toFixed(2) + '%' : '-'}</div>
                  </div>
                  <div style={{ background: '#fee2e2', borderRadius: 8, padding: 16, textAlign: 'center', minWidth: 120 }}>
                    <div style={{ fontSize: 13, color: '#555' }}>Distraction Alerts</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{student.distractionCount ?? '-'}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #fef9c3 60%, #fde68a 100%)', borderRadius: 8, padding: 16, textAlign: 'center', minWidth: 120, boxShadow: '0 2px 8px #fde68a33' }}>
                    <div style={{ fontSize: 13, color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3' /></svg>
                      Total Avg. (Past)
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#b45309' }}>{
                      (() => {
                        const allStudents = studentsByRoom[room.id] || [];
                        if (allStudents.length === 0) return '-';
                        const avg = allStudents.reduce((sum, s) => sum + (s.averageAttention || 0), 0) / allStudents.length;
                        return avg.toFixed(2) + '%';
                      })()
                    }</div>
                  </div>
                </div>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

export default TeacherDashboard; 