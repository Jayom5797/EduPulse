import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, setDoc, doc, getDoc, setDoc as setDocRaw } from 'firebase/firestore';
import WebcamAttentionTracker from './WebcamAttentionTracker'; // Re-import the tracker
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Declare Jitsi API on window
declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

// Helper to generate a random user ID
function getRandomId() {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Helper to get or create a persistent user ID
function getPersistentUserId(): string {
  const storageKey = 'edupulse_user_id';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    userId = getRandomId();
    localStorage.setItem(storageKey, userId);
    console.log('Created new persistent userId:', userId);
  } else {
    console.log('Retrieved existing userId:', userId);
  }
  
  return userId;
}

// Helper to get or create a persistent user name
function getPersistentUserName(): string | null {
  return localStorage.getItem('edupulse_user_name');
}

// Helper to format timestamp for India (IST, 12-hour format)
function getIndianTimestamp12hr(): string {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  };
  const parts = new Intl.DateTimeFormat('en-IN', options).formatToParts(date);
  const partValues = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  return `Date: ${partValues.day}/${partValues.month}/${partValues.year}, Time: ${partValues.hour}:${partValues.minute}:${partValues.second} ${partValues.dayPeriod}`;
}

// Teacher email mapping for role assignment
const teacherEmailMap: Record<string, string> = {
  'amarsir@gmail.com': 'Amar Sir',
  'vermasir@gmail.com': 'Dr. Verma',
  'sharmasir@gmail.com': 'Professor Sharma',
};

const ConferencePage: React.FC = () => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [attention, setAttention] = useState<number>(0);
  const [userName, setUserName] = useState<string | null>(getPersistentUserName());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState('');
  // Draggable overlay state
  const [trackerPos, setTrackerPos] = useState<{ top: number; left: number } | null>(null);
  const trackerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragging = useRef(false);
  // Minimize state for the floating tracker
  const [trackerMinimized, setTrackerMinimized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Extract roomId from URL query params
  const searchParams = new URLSearchParams(location.search);
  const roomId = searchParams.get('roomId') || 'defaultRoom';

  // Default/fallback position for the tracker overlay
  const defaultTrackerPos = {
    top: window.innerHeight - 180 > 24 ? window.innerHeight - 180 : window.innerHeight - 120,
    left: window.innerWidth - 210 > 24 ? window.innerWidth - 210 : window.innerWidth - 180,
  };

  // Handle email/password auth
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const auth = getAuth();
    try {
      let userCred;
      if (authMode === 'login') {
        userCred = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      } else {
        userCred = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
      }
      setUserEmail(userCred.user.email);
      setUserName(userCred.user.email?.split('@')[0] || '');
      localStorage.setItem('edupulse_user_name', userCred.user.email?.split('@')[0] || '');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-login-credentials') {
        setAuthError('Invalid Email or Password');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Email already registered. Please login.');
      } else {
        setAuthError('An error occurred. Please try again.');
      }
    }
  };

  // Jitsi integration
  useEffect(() => {
    if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current || !userName) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: roomId,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: 600,
      configOverwrite: {
        prejoinPageEnabled: true,
        startWithVideoMuted: true,
        startWithAudioMuted: false,
        disableVirtualBackground: true,
      },
      userInfo: { displayName: userName },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    return () => api.dispose();
  }, [userName, roomId]);
  
  // This will be called by the WebcamAttentionTracker
  const handleAttentionChange = (newAttention: number) => {
    setAttention(newAttention);
    if (!isTracking) {
      setIsTracking(true);
    }
  };

  // Send attention data to Firestore
  useEffect(() => {
    if (!userName) return;
    const interval = setInterval(async () => {
      if (!userName || !isTracking) return;
      try {
        await addDoc(collection(db, 'conferences', roomId, 'attentions'), {
          attention,
          timestamp: getIndianTimestamp12hr(),
          userId: userName,
          role,
        });
      } catch (e) {
        console.error('Firestore write error:', e);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [attention, userName, role, isTracking, roomId]);

  // Handle name form submit
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      localStorage.setItem('edupulse_user_name', nameInput.trim());
      setUserName(nameInput.trim());
    }
  };

  // Set initial position to bottom-right after mount
  useEffect(() => {
    if (!trackerPos && trackerRef.current) {
      const { innerWidth, innerHeight } = window;
      setTrackerPos({
        top: innerHeight - 180,
        left: innerWidth - 210,
      });
    }
  }, [trackerPos]);

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    const rect = trackerRef.current!.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    setTrackerPos({
      top: Math.max(0, Math.min(window.innerHeight - 120, e.clientY - dragOffset.current.y)),
      left: Math.max(0, Math.min(window.innerWidth - 180, e.clientX - dragOffset.current.x)),
    });
  };
  const onMouseUp = () => {
    dragging.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  // Assign role after auth
  useEffect(() => {
    if (!userName || !userEmail) return;
    async function assignRole() {
      const roomDocRef = doc(db, 'conferences', roomId);
      const usersRef = collection(db, 'conferences', roomId, 'users');
      const roomDocSnap = await getDoc(roomDocRef);
      let assignedRole: 'teacher' | 'student' = 'student';
      if (userEmail && teacherEmailMap[userEmail]) {
        assignedRole = 'teacher';
        if (!roomDocSnap.exists() || !roomDocSnap.data().teacher) {
          await setDocRaw(roomDocRef, { teacher: userName }, { merge: true });
        }
      } else {
        assignedRole = 'student';
      }
      setRole(assignedRole);
      await setDoc(doc(usersRef, userName!), {
        userId: userName!,
        email: userEmail,
        role: assignedRole,
        joinedAt: getIndianTimestamp12hr(),
      });
    }
    assignRole();
  }, [userName, userEmail, roomId]);

  if (!userName || !userEmail) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-white via-blue-50 to-purple-50 flex flex-col items-center py-10 overflow-hidden">
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow z-0"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow z-0" style={{ animationDelay: '1s' }}></div>
        <div className="w-full max-w-3xl bg-white/90 rounded-2xl shadow-2xl p-10 border border-primary-100 relative z-10">
          <h2 className="text-2xl font-semibold mb-8 gradient-text">Join Conference</h2>
          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 items-center">
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="Email"
              className="px-5 py-3 border border-primary-200 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-primary-400 text-lg w-80"
              required
            />
            <input
              type="password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="px-5 py-3 border border-primary-200 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-primary-400 text-lg w-80"
              required
            />
            {authError && <div className="text-red-500 font-semibold">{authError}</div>}
            <button type="submit" className="btn-primary w-full text-lg">{authMode === 'login' ? 'Login & Join' : 'Register & Join'}</button>
          </form>
          <div className="mt-4 text-center">
            {authMode === 'login' ? (
              <span>New user? <button className="text-primary-600 font-semibold underline" onClick={() => setAuthMode('register')}>Register here</button></span>
            ) : (
              <span>Already have an account? <button className="text-primary-600 font-semibold underline" onClick={() => setAuthMode('login')}>Login here</button></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-white via-blue-50 to-purple-50 flex flex-col items-center py-10 overflow-hidden">
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow z-0" style={{ animationDelay: '1s' }}></div>
      <div className="mb-4 text-lg font-semibold text-blue-700">Room ID: {roomId}</div>
      <div style={{ minHeight: '100vh', width: '100vw', position: 'relative', background: '#181818' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            zIndex: 10002,
            background: 'rgba(30,30,30,0.85)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: 18,
            fontWeight: 500,
            boxShadow: '0 2px 8px #0003',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          ← Back
        </button>
        {/* Page Heading */}
        <div style={{ width: '100vw', textAlign: 'center', paddingTop: 16, paddingBottom: 8, color: '#fff', fontSize: 28, fontWeight: 600, letterSpacing: 1, zIndex: 10001, position: 'relative' }}>
          Conference Page
        </div>
        {}
        <div
          ref={jitsiContainerRef}
          id="jitsi-container"
          style={{
            position: 'absolute',
            top: 80, // Increased top margin
            left: 0,
            width: '100vw',
            height: 'calc(100vh - 160px)', // Adjusted height for more space
            zIndex: 1,
            background: '#222',
          }}
        />
        {/* Draggable Floating Attention Tracker Overlay with Minimize */}
        <div
          ref={trackerRef}
          style={{
            position: 'fixed',
            top: (trackerPos ? trackerPos.top : defaultTrackerPos.top),
            left: (trackerPos ? trackerPos.left : defaultTrackerPos.left),
            zIndex: 10000,
            boxShadow: '0 2px 16px #0005',
            borderRadius: 12,
            background: 'transparent',
            padding: 0,
            minWidth: 0,
            cursor: trackerMinimized ? 'default' : 'move',
            userSelect: 'none',
            transition: dragging.current ? 'none' : 'box-shadow 0.2s',
            display: 'inline-block',
          }}
          onMouseDown={trackerMinimized ? undefined : onMouseDown}
        >
          {/* Minimize button (only show if not minimized) */}
          {!trackerMinimized && (
            <button
              onClick={e => { e.stopPropagation(); setTrackerMinimized(true); }}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 10001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                boxShadow: '0 1px 4px #0006',
              }}
              title="Minimize"
            >
              &#8211;
            </button>
          )}
          {/* Tracker card: hide with display:none if minimized */}
          <div style={{ display: trackerMinimized ? 'none' : 'block' }}>
            <WebcamAttentionTracker onAttentionChange={handleAttentionChange} hideTitle={true} compact={true} />
          </div>
        </div>
        {/* Minimized icon (small circle at right edge) */}
        {trackerMinimized && (
          <button
            onClick={() => setTrackerMinimized(false)}
            style={{
              position: 'fixed',
              right: 16,
              bottom: 32,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(30,30,30,0.95)',
              color: '#fff',
              border: 'none',
              zIndex: 10001,
              boxShadow: '0 2px 8px #0005',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              cursor: 'pointer',
            }}
            title="Show Tracker"
          >
            <span role="img" aria-label="Show Tracker">👁️</span>
          </button>
        )}
        {/* Responsive: move overlay up on mobile */}
        <style>{`
          @media (max-width: 600px) {
            #jitsi-container { height: 100vh !important; }
            .attention-card video {
              width: 80vw !important;
              height: 24vw !important;
              min-width: 120px !important;
              min-height: 80px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ConferencePage;