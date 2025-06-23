export {}; 

// Calculate the Eye Aspect Ratio (EAR) given 6 eye landmarks (array of {x, y, z})
export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

export function calculateEAR(landmarks: Landmark[]): number {
  if (!landmarks || landmarks.length !== 6) return 0;
  const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);
  // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
  const ear = (dist(landmarks[1], landmarks[5]) + dist(landmarks[2], landmarks[4])) /
    (2.0 * dist(landmarks[0], landmarks[3]));
  return ear;
}

export function isDistracted(ear: number, threshold: number = 0.2): boolean {
  return ear < threshold;
} 