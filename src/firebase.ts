// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLS0TKFU5CstzXq43iLXIZ3XbfAIfu2Do",
  authDomain: "edupulse-30d34.firebaseapp.com",
  projectId: "edupulse-30d34",
  storageBucket: "edupulse-30d34.appspot.com",
  messagingSenderId: "906680012544",
  appId: "1:906680012544:web:b0bb4bb44ac48acc9aede5",
  measurementId: "G-PSCWCWLWB0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db }; 