import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collectionGroup, query, where, getDocs, collection } from 'firebase/firestore';
import AttentionChart from './AttentionChart.tsx';
import EngagementPieChart from './EngagementPieChart';
import { TrendingUp, TrendingDown, Minus, Clock, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import AttentionBarChart from './AttentionBarChart';
import EngagementRadarChart from './EngagementRadarChart';
import StatCard from './StatCard';

interface AttentionData {
  attention: number;
  timestamp: string;
}

interface Meeting {
  roomName: string;
  joinedAt: string;
  role: string;
  averageAttention: string;
  attentionData: AttentionData[];
  maxAttention: string;
  minAttention: string;
  distractionCount: number;
  duration: string;
  attentionTrend: 'up' | 'down' | 'stable';
  teacherEmail: string;
  studentName: string;
}

const Dashboard = () => {
  const [userId, setUserId] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [overallStats, setOverallStats] = useState({
    totalMeetings: 0,
    overallAverageAttention: '0.00',
    totalDistractions: 0,
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [displayName, setDisplayName] = useState('');

  // Mapping of teacher emails to display names
  const teacherNameMap: Record<string, string> = {
    'amarsir@gmail.com': 'Amar Sir',
    'vermasir@gmail.com': 'Dr. Verma',
    'sharmasir@gmail.com': 'Professor Sharma',
  };

  // Helper to get teacher name from email
  const getTeacherName = (email: string) => {
    if (teacherNameMap[email]) return teacherNameMap[email];
    const prefix = email.split('@')[0];
    const first = prefix.split(/[._-]/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        setUserId(user.email || user.uid);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      fetchUserMeetings();
    }
  }, [userId]);

  const downloadPdf = (roomName: string) => {
    const input = document.getElementById(`meeting-report-${roomName}`);
    if (input) {
      html2canvas(input, { scale: 2 }).then(canvas => {
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
        pdf.save(`EduPulse-Report-${roomName}.pdf`);
      });
    }
  };

  const fetchUserMeetings = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const userEmail = auth.currentUser?.email;
      if (!userEmail) {
        setMeetings([]);
        setLoading(false);
        return;
      }
      // Find all conferences
      const conferencesSnap = await getDocs(collection(db, 'conferences'));
      const meetingsData: Meeting[] = [];
      let foundDisplayName = '';
      for (const confDoc of conferencesSnap.docs) {
        const roomName = confDoc.id;
        // Query users subcollection for this conference by email
        const usersRef = collection(db, 'conferences', roomName, 'users');
        const userQuery = query(usersRef, where('email', '==', userEmail));
        const userSnapshot = await getDocs(userQuery);
        if (userSnapshot.empty) continue;
        const userData = userSnapshot.docs[0].data();
        if (!foundDisplayName && userData.userId) {
          foundDisplayName = userData.userId;
        }
        // Fetch teacher email from conference doc
        const confData = confDoc.data();
        const teacherEmail = confData.teacheremail || '';
        // Fetch attention data for this user in this conference
        const attentionPath = `conferences/${roomName}/attentions`;
        const attentionDataQuery = query(collection(db, attentionPath), where('userId', '==', userData.userId));
        const attentionSnapshot = await getDocs(attentionDataQuery);
        const attentionData = attentionSnapshot.docs.map(d => {
          const data = d.data();
          return {
            ...data,
            attention: parseFloat(data.attention)
          } as AttentionData;
        });
        let averageAttention = 0;
        let maxAttention = 0;
        let minAttention = 100;
        let distractionCount = 0;
        const distractionThreshold = 40;
        let duration = '0m';
        let attentionTrend: 'up' | 'down' | 'stable' = 'stable';
        if (attentionData.length > 1) {
          const timestamps = attentionData.map(d => new Date(d.timestamp));
          const firstTimestamp = Math.min(...timestamps.map(t => t.getTime()));
          const lastTimestamp = Math.max(...timestamps.map(t => t.getTime()));
          const durationMinutes = Math.round((lastTimestamp - firstTimestamp) / (1000 * 60));
          duration = `${durationMinutes}m`;
          const totalAttention = attentionData.reduce((sum, data) => {
            const score = data.attention;
            if (score > maxAttention) maxAttention = score;
            if (score < minAttention) minAttention = score;
            if (score < distractionThreshold) distractionCount++;
            return sum + score;
          }, 0);
          averageAttention = totalAttention / attentionData.length;
          // Calculate trend
          const midPoint = Math.floor(attentionData.length / 2);
          const firstHalf = attentionData.slice(0, midPoint);
          const secondHalf = attentionData.slice(midPoint);
          const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.attention, 0) / firstHalf.length;
          const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.attention, 0) / secondHalf.length;
          if (secondHalfAvg > firstHalfAvg + 2) {
            attentionTrend = 'up';
          } else if (secondHalfAvg < firstHalfAvg - 2) {
            attentionTrend = 'down';
          }
        } else if (attentionData.length === 1) {
          averageAttention = attentionData[0].attention;
          maxAttention = attentionData[0].attention;
          minAttention = attentionData[0].attention;
          if (averageAttention < distractionThreshold) distractionCount = 1;
        } else {
          minAttention = 0;
        }
        meetingsData.push({
          roomName,
          joinedAt: userData.joinedAt,
          role: userData.role,
          averageAttention: !isNaN(averageAttention) ? averageAttention.toFixed(2) : '0.00',
          attentionData,
          maxAttention: maxAttention.toFixed(0),
          minAttention: minAttention.toFixed(0),
          distractionCount,
          duration,
          attentionTrend,
          teacherEmail,
          studentName: userData.userId,
        });
      }
      // Calculate overall stats after fetching all meetings
      if (meetingsData.length > 0) {
        const totalMeetings = meetingsData.length;
        const totalDistractions = meetingsData.reduce((sum, meeting) => sum + meeting.distractionCount, 0);
        const totalAvgAttention = meetingsData.reduce((sum, meeting) => sum + parseFloat(meeting.averageAttention), 0);
        const overallAverageAttention = (totalAvgAttention / totalMeetings).toFixed(2);
        setOverallStats({ totalMeetings, overallAverageAttention, totalDistractions });
      }
      setMeetings(meetingsData);
      if (foundDisplayName) setDisplayName(foundDisplayName);
    } catch (error) {
      console.error("Error fetching user meetings:", error);
    }
    setLoading(false);
  };

  const getAttentionColor = (score: number) => {
    if (score > 70) return 'text-green-600';
    if (score > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-5 h-5 text-green-500 ml-2" />;
    if (trend === 'down') return <TrendingDown className="w-5 h-5 text-red-500 ml-2" />;
    return <Minus className="w-5 h-5 text-gray-500 ml-2" />;
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate('/');
  };

  if (!authChecked) {
    return null; // or a loading spinner
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-lg text-gray-700">Please log in to see your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col">
      {/* Topbar */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-sm z-20">
        <div className="text-2xl font-bold text-blue-700 tracking-tight">EduPulse</div>
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">{displayName ? `Welcome, ${displayName}` : 'Welcome'}</span>
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
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <StatCard
            icon="📅"
            label="Total Meetings"
            value={overallStats.totalMeetings}
            colorClass="text-blue-600"
            bgClass="from-blue-50 to-blue-100"
            ariaLabel="Total Meetings"
          />
          <StatCard
            icon="📈"
            label="Avg. Attention"
            value={parseFloat(overallStats.overallAverageAttention)}
            colorClass="text-green-600"
            bgClass="from-green-50 to-green-100"
            ariaLabel="Average Attention"
            suffix="%"
          />
          <StatCard
            icon="🔔"
            label="Distraction Alerts"
            value={overallStats.totalDistractions}
            colorClass="text-red-500"
            bgClass="from-red-50 to-red-100"
            ariaLabel="Distraction Alerts"
          />
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-gray-500 text-lg">Loading meetings...</span>
          </div>
        ) : meetings.length > 0 ? (
          <div className="flex flex-col gap-8 w-full">
            {meetings.map((meeting, index) => (
              <React.Fragment key={index}>
                <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6 w-full">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2 w-full">
                    <div>
                      <div className="text-2xl font-bold text-blue-700 mb-1">Meeting: {meeting.roomName}</div>
                      <div className="text-base text-gray-500">Teacher: {getTeacherName(meeting.teacherEmail)}</div>
                      <div className="text-base text-gray-500">Student: {meeting.studentName}</div>
                    </div>
                    <button
                      onClick={() => downloadPdf(meeting.roomName)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-5 py-2 rounded shadow-sm transition-all mt-2 md:mt-0"
                    >
                      <Download className="w-5 h-5 inline mr-1" /> Report
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-6 text-base text-gray-600 w-full">
                    <div className="flex-1">Joined: {meeting.joinedAt} | Duration: {meeting.duration} (Role: {meeting.role})</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                    <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">Avg. Attention</div>
                      <div className={`text-3xl font-bold ${getAttentionColor(parseFloat(meeting.averageAttention))}`}>{meeting.averageAttention}%</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">Distraction Alerts</div>
                      <div className="text-3xl font-bold text-red-500">{meeting.distractionCount}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">Highest Focus</div>
                      <div className="text-3xl font-bold text-green-500">{meeting.maxAttention}%</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">Lowest Focus</div>
                      <div className="text-3xl font-bold text-yellow-500">{meeting.minAttention}%</div>
                    </div>
                  </div>
                  <div className="w-full mt-6">
                    {meeting.attentionData && meeting.attentionData.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-inner p-6">
                          <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Attention Analysis</h4>
                          <AttentionBarChart attentionData={meeting.attentionData} />
                        </div>
                        <div className="bg-white rounded-xl shadow-inner p-6">
                          <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Engagement Analysis</h4>
                          <EngagementRadarChart attentionData={meeting.attentionData} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">No attention data available for this meeting.</div>
                    )}
                  </div>
                </div>
                {/* Print-optimized hidden report for PDF export */}
                <div
                  id={`meeting-report-${meeting.roomName}`}
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: 0,
                    width: '900px',
                    background: '#fff',
                    padding: 24,
                    boxSizing: 'border-box',
                    zIndex: -1,
                  }}
                  aria-hidden="true"
                >
                  <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>Meeting Report</h2>
                  <div style={{ marginBottom: 4, color: '#334155', fontWeight: 500 }}>Teacher: {getTeacherName(meeting.teacherEmail)}</div>
                  <div style={{ marginBottom: 12, color: '#334155', fontWeight: 500 }}>Student: {meeting.studentName}</div>
                  <div style={{ color: '#64748b', fontSize: 15, marginBottom: 16 }}>Joined: {meeting.joinedAt || '-'}</div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 24, marginBottom: 24 }}>
                    <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, textAlign: 'center', flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8, color: '#2563eb', fontSize: 16 }}>Attention Analysis</div>
                      <AttentionBarChart attentionData={meeting.attentionData} />
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, textAlign: 'center', flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8, color: '#a21caf', fontSize: 16 }}>Engagement Analysis</div>
                      <EngagementRadarChart attentionData={meeting.attentionData} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 8 }}>
                    <div style={{ background: '#e0e7ff', borderRadius: 8, padding: 16, textAlign: 'center', minWidth: 120 }}>
                      <div style={{ fontSize: 13, color: '#555' }}>Avg. Attention</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>{meeting.averageAttention !== undefined ? meeting.averageAttention + '%' : '-'}</div>
                    </div>
                    <div style={{ background: '#fee2e2', borderRadius: 8, padding: 16, textAlign: 'center', minWidth: 120 }}>
                      <div style={{ fontSize: 13, color: '#555' }}>Distraction Alerts</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{meeting.distractionCount ?? '-'}</div>
                    </div>
                    <div style={{ background: '#fef9c3', borderRadius: 8, padding: 16, textAlign: 'center', minWidth: 120 }}>
                      <div style={{ fontSize: 13, color: '#b45309' }}>Highest Focus</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#b45309' }}>{meeting.maxAttention !== undefined ? meeting.maxAttention + '%' : '-'}</div>
                    </div>
                    <div style={{ background: '#fef9c3', borderRadius: 8, padding: 16, textAlign: 'center', minWidth: 120 }}>
                      <div style={{ fontSize: 13, color: '#b45309' }}>Lowest Focus</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#b45309' }}>{meeting.minAttention !== undefined ? meeting.minAttention + '%' : '-'}</div>
                    </div>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>Duration: {meeting.duration} | Role: {meeting.role}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-40">
            <span className="text-gray-500 text-lg">No meetings found for this user.</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard; 