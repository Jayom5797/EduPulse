import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import AttentionChart from './AttentionChart';
import EngagementPieChart from './EngagementPieChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-white via-blue-50 to-purple-50 flex flex-col items-center py-10 overflow-hidden">
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow z-0" style={{ animationDelay: '1s' }}></div>
      <div className="w-full max-w-3xl bg-white/90 rounded-2xl shadow-xl p-10 relative z-10 border border-primary-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Welcome {getTeacherName()}</h2>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
        </div>
        <h3 className="text-xl font-semibold mb-4">Your Rooms & Student Insights</h3>
        {loading ? (
          <p>Loading rooms and students...</p>
        ) : rooms.length === 0 ? (
          <p>No rooms found for your account.</p>
        ) : (
          <div className="space-y-8">
            {rooms.map(room => {
              const students = studentsByRoom[room.id] || [];
              // Gather all attention data for this room
              const allAttentionData = students.flatMap(student => {
                // Simulate per-student attention data as an array of objects with timestamp and attention
                // In real use, you would fetch and aggregate actual attentionData arrays
                return student.averageAttention !== undefined ? [{ attention: student.averageAttention, timestamp: student.joinedAt || '' }] : [];
              });
              return (
                <div key={room.id} className="border-b pb-4 mb-6">
                  {/* Charts row restored to on-screen dashboard */}
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex-1">
                      <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">Attention Over Time</h4>
                      <AttentionChart attentionData={students.flatMap(student => (studentAttentionData[room.id] && studentAttentionData[room.id][student.userId]) || [])} />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex-1">
                      <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">Engagement Level Breakdown</h4>
                      <EngagementPieChart attentionData={students.flatMap(student => (studentAttentionData[room.id] && studentAttentionData[room.id][student.userId]) || [])} />
                    </div>
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
                                <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-xs" onClick={() => openStudentReport(student, room.id)}>View Report</button>
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
        )}
      </div>
      {/* Modal for student report */}
      {modalOpen && modalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative">
            <button onClick={closeModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            <h2 className="text-2xl font-bold mb-2">Student Report</h2>
            <div className="mb-2 text-gray-700 font-medium">Teacher: {getTeacherName()}</div>
            <div className="mb-4 text-gray-700 font-medium">Student: {modalStudent.userId}</div>
            <div className="flex items-center text-gray-600 text-sm mb-4">
              <span>Joined: {modalStudent.joinedAt || '-'} </span>
            </div>
            <div id="student-report-modal">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                  <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">Attention Over Time</h4>
                  {modalAttentionData.length > 0 ? (
                    <AttentionChart attentionData={modalAttentionData} />
                  ) : (
                    <div className="text-gray-400 text-center">No attention data available for this student.</div>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                  <EngagementPieChart attentionData={modalAttentionData} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Avg. Attention</p>
                  <p className="text-2xl font-bold text-blue-600">{modalStudent.averageAttention !== undefined ? modalStudent.averageAttention.toFixed(2) + '%' : '-'}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Distraction Alerts</p>
                  <p className="text-2xl font-bold text-red-500">{modalStudent.distractionCount ?? '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Download All Reports Button moved to bottom */}
      <button onClick={downloadAllReports} className="mt-8 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold text-lg shadow" disabled={pdfLoading}>
        {pdfLoading ? 'Generating PDF...' : 'Download All Reports'}
      </button>
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
                  <div style={{ flex: 1, background: 'linear-gradient(135deg, #e0e7ff 60%, #f3e8ff 100%)', borderRadius: 16, padding: 24, textAlign: 'center', boxShadow: '0 4px 24px #a5b4fc33' }}>
                    <div style={{ fontSize: 16, color: '#6366f1', fontWeight: 600 }}>Total Students</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#7c3aed' }}>{students.length}</div>
                  </div>
                  <div style={{ flex: 1, background: 'linear-gradient(135deg, #d1fae5 60%, #f0fdf4 100%)', borderRadius: 16, padding: 24, textAlign: 'center', boxShadow: '0 4px 24px #6ee7b733' }}>
                    <div style={{ fontSize: 16, color: '#059669', fontWeight: 600 }}>Avg. Attention</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#059669' }}>{students.length > 0 ? (students.reduce((sum, s) => sum + (s.averageAttention || 0), 0) / students.length).toFixed(2) + '%' : '-'}</div>
                  </div>
                  <div style={{ flex: 1, background: 'linear-gradient(135deg, #fee2e2 60%, #fef2f2 100%)', borderRadius: 16, padding: 24, textAlign: 'center', boxShadow: '0 4px 24px #fecaca33' }}>
                    <div style={{ fontSize: 16, color: '#dc2626', fontWeight: 600 }}>Total Distractions</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#dc2626' }}>{students.reduce((sum, s) => sum + (s.distractionCount || 0), 0)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
                  <div style={{ flex: 1, background: 'linear-gradient(135deg, #e0e7ff 60%, #f3e8ff 100%)', borderRadius: 16, padding: 20, textAlign: 'center', boxShadow: '0 2px 12px #a5b4fc33' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#6366f1', fontSize: 16 }}>Attention Over Time</div>
                    <AttentionChart attentionData={attentionData} />
                  </div>
                  <div style={{ flex: 1, background: 'linear-gradient(135deg, #f3e8ff 60%, #e0e7ff 100%)', borderRadius: 16, padding: 20, textAlign: 'center', boxShadow: '0 2px 12px #a5b4fc33' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#a21caf', fontSize: 16 }}>Engagement Level Breakdown</div>
                    <EngagementPieChart attentionData={attentionData} />
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
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Attention Over Time</div>
                    <AttentionChart attentionData={attentionData} />
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Engagement Level Breakdown</div>
                    <EngagementPieChart attentionData={attentionData} />
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