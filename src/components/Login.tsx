import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-login-credentials') {
        setError('Invalid Email or Password');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative bg-gradient-to-br from-white via-blue-50 to-purple-50 overflow-hidden">
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow z-0" style={{ animationDelay: '1s' }}></div>
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 px-5 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-primary-700 hover:to-purple-700 transition-all"
      >
        &larr; Back to Home
      </button>
      <form onSubmit={handleSubmit} className="bg-white/90 p-10 rounded-2xl shadow-2xl w-96 relative z-10 border border-primary-100 flex flex-col items-center">
        <h2 className="text-3xl mb-6 font-extrabold text-center gradient-text">Login</h2>
        {error && <div className="text-red-500 mb-4 font-semibold">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          className="border border-primary-200 p-3 mb-4 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-lg"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border border-primary-200 p-3 mb-6 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-lg"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary w-full text-lg">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login; 