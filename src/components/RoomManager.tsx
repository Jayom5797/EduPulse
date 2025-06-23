import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, Timestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Room {
  id: string;
  roomName: string;
  createdBy?: string;
  createdAt?: string;
}

const RoomManager: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch rooms from Firestore 'conferences' collection
  const fetchRooms = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'conferences'));
    let roomsList: Room[] = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        roomName: docSnap.id,
        createdBy: data.createdBy || '',
        createdAt: data.createdAt || '',
      };
    });
    // Treat 'defaultRoom' and 'EduPulseDemoRoom' as the same, show only one as 'Demo Room'
    const hasDefault = roomsList.find(r => r.roomName === 'defaultRoom');
    const hasDemo = roomsList.find(r => r.roomName === 'EduPulseDemoRoom');
    if (hasDefault || hasDemo) {
      roomsList = roomsList.filter(r => r.roomName !== 'defaultRoom' && r.roomName !== 'EduPulseDemoRoom');
      roomsList.unshift({
        id: 'EduPulseDemoRoom',
        roomName: 'Demo Room',
        createdBy: hasDefault?.createdBy || hasDemo?.createdBy || '',
        createdAt: hasDefault?.createdAt || hasDemo?.createdAt || '',
      });
    }
    setRooms(roomsList);
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Create a new room in 'conferences' collection
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    const createdBy = localStorage.getItem('userName') || 'Unknown';
    const createdAt = new Date().toLocaleString('en-IN', { hour12: true, timeZone: 'Asia/Kolkata' });
    // Create a new document in 'conferences' with roomName as ID
    await setDoc(doc(db, 'conferences', roomName), {
      createdBy,
      createdAt,
    });
    setRoomName('');
    fetchRooms();
  };

  // Join a room
  const handleJoinRoom = (roomId: string) => {
    navigate(`/conference?roomId=${roomId}`);
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-white via-blue-50 to-purple-50 flex flex-col items-center py-16 overflow-hidden">
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow z-0" style={{ animationDelay: '1s' }}></div>
      <h2 className="text-4xl font-extrabold gradient-text mb-10 relative z-10">Room Manager</h2>
      <form onSubmit={handleCreateRoom} className="flex gap-3 mb-10 relative z-10">
        <input
          type="text"
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
          placeholder="Enter room name"
          className="px-5 py-3 border border-primary-200 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-primary-400 text-lg w-64"
        />
        <button type="submit" className="btn-primary text-lg px-8 py-3">Create Room</button>
      </form>
      <div className="w-full max-w-xl bg-white/90 rounded-2xl shadow-2xl p-8 border border-primary-100 relative z-10">
        <h3 className="text-2xl font-bold gradient-text mb-6">Available Rooms</h3>
        {loading ? (
          <p>Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p>No rooms available. Create one above!</p>
        ) : (
          <ul className="space-y-4">
            {rooms.map(room => (
              <li key={room.id} className="flex justify-between items-center border-b pb-3 last:border-b-0 last:pb-0">
                <div>
                  <span className="font-semibold text-primary-700 text-lg">{room.roomName}</span>
                  {room.createdBy && <span className="ml-2 text-xs text-gray-500">by {room.createdBy}</span>}
                  {room.createdAt && <span className="ml-2 text-xs text-gray-400">({room.createdAt})</span>}
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  className="btn-secondary px-6 py-2 text-lg"
                >
                  Join
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RoomManager; 