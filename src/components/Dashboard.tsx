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
    <div className="min-h-screen relative bg-gradient-to-br from-white via-blue-50 to-purple-50 p-8 overflow-hidden">
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow z-0" style={{ animationDelay: '1s' }}></div>
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800">{displayName ? `Welcome \"${displayName}\"` : 'Welcome'}</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span>&larr; Back</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        <p className="text-gray-500 mb-8">An overview of your meeting performance and attention trends.</p>

        {/* Overall Stats */}
        <div className="bg-gradient-to-br from-primary-100/80 to-purple-100/80 rounded-2xl shadow-xl p-8 mb-10 border border-primary-100">
          <h2 className="text-3xl font-bold gradient-text mb-6">Overall Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/80 rounded-xl shadow-lg p-6 card-hover">
              <p className="text-md text-gray-500 mb-2">Total Meetings</p>
              <p className="text-4xl font-extrabold text-yellow-400">{overallStats.totalMeetings}</p>
            </div>
            <div className="bg-white/80 rounded-xl shadow-lg p-6 card-hover">
              <p className="text-md text-gray-500 mb-2">Overall Avg. Attention</p>
              <p className={`text-4xl font-extrabold ${getAttentionColor(parseFloat(overallStats.overallAverageAttention))}`}>{overallStats.overallAverageAttention}%</p>
            </div>
            <div className="bg-white/80 rounded-xl shadow-lg p-6 card-hover">
              <p className="text-md text-gray-500 mb-2">Total Distraction Alerts</p>
              <p className="text-4xl font-extrabold text-red-500">{overallStats.totalDistractions}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <p>Loading meetings...</p>
        ) : meetings.length > 0 ? (
          <div className="space-y-8">
            {meetings.map((meeting, index) => (
              <div key={index} id={`meeting-report-${meeting.roomName}`} className="bg-gradient-to-br from-primary-100/80 to-purple-100/80 p-8 rounded-2xl shadow-xl border border-primary-100 transition-all hover:shadow-2xl card-hover mb-10">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Meeting: {meeting.roomName}</h2>
                  <button 
                    onClick={() => downloadPdf(meeting.roomName)} 
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Report</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Left side: Teacher/Student info, Meeting Details & Insights (2/5 width) */}
                  <div className="md:col-span-2 flex flex-col justify-center space-y-6">
                    <div className="mb-4">
                      <div className="font-bold text-primary-700 text-2xl gradient-text">Teacher: {getTeacherName(meeting.teacherEmail)}</div>
                      <div className="font-bold text-purple-700 text-2xl gradient-text">Student: {meeting.studentName}</div>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>
                        Joined: {meeting.joinedAt} | Duration: {meeting.duration} (Role: {meeting.role})
                      </span>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">Key Insights</h3>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-white/80 p-4 rounded-xl shadow card-hover flex flex-col justify-center items-center">
                          <p className="text-md text-gray-500">Avg. Attention</p>
                          <div className="flex items-center">
                            <p className={`text-3xl font-extrabold ${getAttentionColor(parseFloat(meeting.averageAttention))}`}>{meeting.averageAttention}%</p>
                            <TrendIcon trend={meeting.attentionTrend} />
                          </div>
                        </div>
                        <div className="bg-white/80 p-4 rounded-xl shadow card-hover">
                          <p className="text-md text-gray-500">Distraction Alerts</p>
                          <p className="text-3xl font-extrabold text-red-500">{meeting.distractionCount}</p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-xl shadow card-hover">
                          <p className="text-md text-gray-500">Highest Focus</p>
                          <p className="text-3xl font-extrabold text-green-500">{meeting.maxAttention}%</p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-xl shadow card-hover">
                          <p className="text-md text-gray-500">Lowest Focus</p>
                          <p className="text-3xl font-extrabold text-yellow-500">{meeting.minAttention}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Charts (3/5 width) */}
                  <div className="md:col-span-3 space-y-4">
                    {meeting.attentionData && meeting.attentionData.length > 0 ? (
                      <>
                        <div className="bg-gradient-to-br from-primary-100/60 to-purple-100/60 p-4 rounded-xl shadow-inner card-hover">
                          <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">Attention Over Time</h4>
                           <AttentionChart attentionData={meeting.attentionData} />
                        </div>
                        <div className="bg-gradient-to-br from-primary-100/60 to-purple-100/60 p-4 rounded-xl shadow-inner card-hover">
                          <EngagementPieChart attentionData={meeting.attentionData} />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-1 text-center text-gray-500 flex items-center justify-center">
                        <p>No attention data available for this meeting.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No meetings found for this user.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 