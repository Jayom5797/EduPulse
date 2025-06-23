import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, AlertCircle, Users, Clock, Target } from 'lucide-react';

const Analytics = () => {
  const dashboardFeatures = [
    {
      icon: BarChart3,
      title: "Real-time Heatmaps",
      description: "Visual representation of class attention levels with color-coded engagement zones"
    },
    {
      icon: AlertCircle,
      title: "Instant Alerts",
      description: "Immediate notifications when students show signs of distraction or disengagement"
    },
    {
      icon: TrendingUp,
      title: "Engagement Trends",
      description: "Historical data analysis showing attention patterns over time and across sessions"
    },
    {
      icon: Users,
      title: "Student Profiles",
      description: "Individual attention analytics with personalized engagement recommendations"
    }
  ];

  const sampleData = [
    { time: '9:00', attention: 85 },
    { time: '9:15', attention: 78 },
    { time: '9:30', attention: 92 },
    { time: '9:45', attention: 67 },
    { time: '10:00', attention: 89 },
    { time: '10:15', attention: 94 },
  ];

  return (
    <section id="analytics" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            📊 Instructor Insights in Real-Time
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive analytics dashboard providing actionable insights 
            to enhance teaching effectiveness and student engagement.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gray-900 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-white/60 text-sm">EduPulse Analytics Dashboard</div>
            </div>

            {/* Mock Chart */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-4">Class Attention Over Time</h3>
              <div className="flex items-end space-x-2 h-32">
                {sampleData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <motion.div
                      className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t w-full"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${data.attention}%` }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                      viewport={{ once: true }}
                    ></motion.div>
                    <span className="text-white/60 text-xs mt-2">{data.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-600/20 rounded-lg p-3 border border-green-600/30">
                <div className="text-green-400 text-xs mb-1">Focused Students</div>
                <div className="text-white font-bold text-lg">24/30</div>
              </div>
              <div className="bg-yellow-600/20 rounded-lg p-3 border border-yellow-600/30">
                <div className="text-yellow-400 text-xs mb-1">Avg Attention</div>
                <div className="text-white font-bold text-lg">87%</div>
              </div>
              <div className="bg-red-600/20 rounded-lg p-3 border border-red-600/30">
                <div className="text-red-400 text-xs mb-1">Alerts</div>
                <div className="text-white font-bold text-lg">3</div>
              </div>
            </div>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {dashboardFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="bg-primary-100 p-3 rounded-lg flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Alert Examples */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 mb-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Live Alert System
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                type: "warning",
                message: "Student S101 distracted for 15s",
                time: "2 min ago",
                color: "border-yellow-400 bg-yellow-50"
              },
              {
                type: "alert",
                message: "Low class attention detected",
                time: "5 min ago",
                color: "border-red-400 bg-red-50"
              },
              {
                type: "info",
                message: "Engagement improved by 12%",
                time: "8 min ago",
                color: "border-green-400 bg-green-50"
              }
            ].map((alert, index) => (
              <div key={index} className={`border-l-4 ${alert.color} p-4 rounded-r-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 capitalize">{alert.type}</span>
                  <span className="text-xs text-gray-500">{alert.time}</span>
                </div>
                <p className="text-gray-700 text-sm">{alert.message}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Export Options */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Comprehensive Reporting
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Export detailed analytics reports in multiple formats for academic records, 
            parent communication, and institutional assessment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['PDF Report', 'CSV Data', 'Excel Analytics', 'JSON Export'].map((format, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white border-2 border-primary-200 text-primary-700 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 hover:border-primary-300 transition-colors"
              >
                📄 {format}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Analytics;