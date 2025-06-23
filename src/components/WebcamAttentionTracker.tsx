import React, { useRef, useEffect, useState } from 'react';
import { calculateEAR } from './earUtils';
import './attention.css';
import { useNavigate } from 'react-router-dom';

// Indices for left eye landmarks (example: [33, 160, 158, 133, 153, 144])
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const EAR_HISTORY_SIZE = 5; // For moving average
const UPDATE_INTERVAL = 500; // ms, update status at most 2 times per second

// === Calibration ranges for your setup ===
const DX_MIN = 0.035; // lowest dx (head turned or not looking)
const DX_MAX = 0.060; // highest dx (looking straight)
const EAR_MIN = 0.10; // lowest ear (eyes closed)
const EAR_MAX = 0.40; // highest ear (eyes open)
const ANGLE_WEIGHT = 0.2; // dx is not very informative, so give it less weight
const EAR_WEIGHT = 0.8;   // ear is the main indicator
// =========================================

interface StatusObj {
  status: 'Attentive' | 'Distracted' | 'Absent';
  attention: number;
  error?: string;
}

interface WebcamAttentionTrackerProps {
  onAttentionChange?: (attention: number) => void;
  hideTitle?: boolean;
  compact?: boolean;
}

const getStatusColor = (status: StatusObj['status']) => {
  if (status === 'Attentive') return '#22c55e'; // green
  if (status === 'Distracted') return '#facc15'; // yellow
  return '#ef4444'; // red
};

const WebcamAttentionTracker: React.FC<WebcamAttentionTrackerProps> = ({ onAttentionChange, hideTitle = false, compact = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);
  const earHistoryRef = useRef<number[]>([]);
  const lastEmitRef = useRef<number>(0);
  const [status, setStatus] = useState<StatusObj>({ status: 'Absent', attention: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    let stream: MediaStream | undefined;
    let faceMesh: any;
    let running = true;
    let lastStatus: StatusObj | null = null;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        setStatus({ status: 'Absent', attention: 0, error: err.message });
      });

    // Wait for the FaceMesh script to be loaded
    const waitForFaceMesh = setInterval(() => {
      if (window && (window as any).FaceMesh) {
        clearInterval(waitForFaceMesh);

        faceMesh = new (window as any).FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: any) => {
          let statusObj: StatusObj = { status: 'Absent', attention: 0 };
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            const eyeLandmarks = LEFT_EYE_INDICES.map((idx: number) => landmarks[idx]);
            const ear = calculateEAR(eyeLandmarks);

            // Head pose proxy: distance between leftmost and rightmost eye points
            const leftEyeCorner = landmarks[33];
            const rightEyeCorner = landmarks[133];
            const dx = Math.abs(leftEyeCorner.x - rightEyeCorner.x);

            // Log values for calibration
            // console.log('dx:', dx, 'ear:', ear);

            // Normalize dx and ear using calibration ranges
            let angleScore = Math.max(0, Math.min(1, (dx - DX_MIN) / (DX_MAX - DX_MIN)));
            let earScore = Math.max(0, Math.min(1, (ear - EAR_MIN) / (EAR_MAX - EAR_MIN)));

            // Combine (weighted average)
            let attention = Math.round((ANGLE_WEIGHT * angleScore + EAR_WEIGHT * earScore) * 100);

            // Smoothing
            earHistoryRef.current.push(attention);
            if (earHistoryRef.current.length > EAR_HISTORY_SIZE) {
              earHistoryRef.current.shift();
            }
            const avgAttention = Math.round(
              earHistoryRef.current.reduce((a, b) => a + b, 0) / earHistoryRef.current.length
            );

            statusObj = { status: 'Attentive', attention: avgAttention };
            if (ear < EAR_MIN || dx < DX_MIN) statusObj.status = 'Distracted';
          } else {
            statusObj = { status: 'Absent', attention: 0 };
            earHistoryRef.current = [];
          }

          // Only emit status at most every UPDATE_INTERVAL ms
          const now = Date.now();
          if (
            (!lastStatus ||
              lastStatus.status !== statusObj.status ||
              lastStatus.attention !== statusObj.attention) &&
            now - lastEmitRef.current > UPDATE_INTERVAL
          ) {
            lastStatus = statusObj;
            lastEmitRef.current = now;
            setStatus(statusObj);
            if (onAttentionChange) {
              onAttentionChange(statusObj.attention);
            }
          }
        });

        const processFrame = async () => {
          if (videoRef.current && running) {
            await faceMesh.send({ image: videoRef.current });
            animationRef.current = requestAnimationFrame(processFrame);
          }
        };

        const onLoaded = () => {
          processFrame();
        };
        videoRef.current && videoRef.current.addEventListener('loadeddata', onLoaded);

        // Cleanup
        return () => {
          running = false;
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
          if (stream) stream.getTracks().forEach(track => track.stop());
          if (videoRef.current) videoRef.current.removeEventListener('loadeddata', onLoaded);
          if (faceMesh) faceMesh.close();
        };
      }
    }, 100);

    return () => clearInterval(waitForFaceMesh);
  }, []);

  if (compact) {
    return (
      <div
        className="attention-card"
        style={{
          width: 180,
          maxWidth: '90vw',
          padding: 8,
          background: 'rgba(30,30,30,0.95)',
          boxShadow: '0 2px 8px #0005',
          borderRadius: 10,
          margin: 0,
          color: '#fff',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width={160}
          height={100}
          style={{ borderRadius: 8, background: '#000', width: 160, height: 100 }}
        />
        <div style={{ marginTop: 8 }}>
          <div className="attention-bar-labels" style={{ fontSize: 12, marginBottom: 2, color: '#fff' }}>
            <span>Attention</span>
            <span>{status.attention}/100</span>
          </div>
          <div className="attention-bar-bg" style={{ height: 10 }}>
            <div
              className="attention-bar"
              style={{
                width: `${status.attention}%`,
                background: getStatusColor(status.status),
                height: 10,
              }}
            />
          </div>
          <div className="attention-status" style={{ fontSize: 12, marginTop: 2, color: '#fff' }}>
            Status: <span style={{ color: getStatusColor(status.status), fontWeight: 'bold' }}>{status.status}</span>
          </div>
          {status.error && status.error.trim() !== '' && (
            <div style={{ color: 'red', marginTop: 8 }}>Error: {status.error}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="attention-bg">
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
      <div
        className="attention-card"
        style={{ width: 600, maxWidth: '100%' }}
      >
        {!hideTitle && (
          <h1 className="attention-title" style={{ whiteSpace: 'nowrap', fontSize: '2rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            EduPulse Attention Tracker
          </h1>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width={580}
          height={350}
          style={{ borderRadius: 8, background: '#000', width: 580, height: 350 }}
        />
        <div style={{ marginTop: 24 }}>
          <div className="attention-bar-labels">
            <span>Attention</span>
            <span>{status.attention}/100</span>
          </div>
          <div className="attention-bar-bg">
            <div
              className="attention-bar"
              style={{
                width: `${status.attention}%`,
                background: getStatusColor(status.status),
                height: undefined,
              }}
            />
          </div>
          <div className="attention-status">
            Status: <span style={{ color: getStatusColor(status.status), fontWeight: 'bold' }}>{status.status}</span>
          </div>
          {status.error && status.error.trim() !== '' && (
            <div style={{ color: 'red', marginTop: 8 }}>Error: {status.error}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebcamAttentionTracker; 