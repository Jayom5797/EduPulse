import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Brain, Monitor, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const floatingIcons = [
    { Icon: Eye, delay: 0, position: 'top-20 left-20' },
    { Icon: Brain, delay: 0.5, position: 'top-32 right-32' },
    { Icon: Monitor, delay: 1, position: 'bottom-32 left-32' },
    { Icon: Users, delay: 1.5, position: 'bottom-20 right-20' },
  ];

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-purple-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {floatingIcons.map(({ Icon, delay, position }, index) => (
          <motion.div
            key={index}
            className={`absolute ${position} text-white/10`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -20, 0],
            }}
            transition={{ 
              delay,
              duration: 2,
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            <Icon className="h-16 w-16" />
          </motion.div>
        ))}
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            <motion.h1 
              className="text-5xl lg:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              📷 AI-Powered 
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Attention Monitoring
              </span>
              <span className="block text-4xl lg:text-5xl mt-2">
                for Smarter Online Learning
              </span>
            </motion.h1>

            <motion.p 
              className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              🎯 EduPulse uses facial landmarks, eye tracking, and head pose detection 
              to monitor student engagement — in real time.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <button className="btn-primary text-lg px-8 py-4">
                📄 Download Brochure
              </button>
              <Link to="/demo" className="btn-secondary text-lg px-8 py-4 text-center">
                🎥 Watch Demo
              </Link>
              <Link to="/rooms" className="btn-secondary text-lg px-8 py-4 text-center">
                🧑‍💻 Join Conference
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">95%</div>
                <div className="text-white/80 text-sm">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">Real-time</div>
                <div className="text-white/80 text-sm">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">Privacy</div>
                <div className="text-white/80 text-sm">First Design</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Visual Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-white/60 text-sm">EduPulse Dashboard</div>
                </div>
                
                {/* Mock Dashboard */}
                <div className="space-y-4">
                  <div className="bg-primary-600/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm">Student Attention</span>
                      <span className="text-green-400 font-semibold">87%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '87%' }}
                        transition={{ delay: 1, duration: 1.5 }}
                      ></motion.div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-600/20 rounded-lg p-3">
                      <div className="text-purple-400 text-xs mb-1">Eye Tracking</div>
                      <div className="text-white font-semibold">Active</div>
                    </div>
                    <div className="bg-blue-600/20 rounded-lg p-3">
                      <div className="text-blue-400 text-xs mb-1">Head Pose</div>
                      <div className="text-white font-semibold">Focused</div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-600/20 rounded-lg p-3">
                    <div className="text-yellow-400 text-xs mb-1">Recent Alert</div>
                    <div className="text-white text-sm">Student S101 distracted for 15s</div>
                  </div>
                </div>
              </div>
              
              <div className="text-center text-white/80 text-sm">
                Live monitoring with real-time analytics
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;