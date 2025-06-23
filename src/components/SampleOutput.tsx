import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';

const SampleOutput = () => {
  const sampleStudents = [
    {
      name: "Aditi",
      id: "S001",
      focus: 82,
      alerts: 3,
      status: "good",
      trend: "up",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "Rahul",
      id: "S002",
      focus: 42,
      alerts: 11,
      status: "needs-help",
      trend: "down",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "Meena",
      id: "S003",
      focus: 95,
      alerts: 1,
      status: "excellent",
      trend: "up",
      avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "Arjun",
      id: "S004",
      focus: 67,
      alerts: 6,
      status: "average",
      trend: "stable",
      avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      name: "Priya",
      id: "S005",
      focus: 89,
      alerts: 2,
      status: "good",
      trend: "up",
      avatar: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  ];

  const testimonials = [
    {
      quote: "EduPulse has revolutionized how I monitor student engagement. The real-time alerts help me identify struggling students immediately.",
      author: "Dr. Sarah Johnson",
      role: "Computer Science Professor",
      rating: 5,
      avatar: "https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      quote: "The privacy-first approach gives me confidence in using this tool. Students feel comfortable knowing their data is protected.",
      author: "Prof. Michael Chen",
      role: "Mathematics Department Head",
      rating: 5,
      avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100"
    },
    {
      quote: "The analytics dashboard provides insights I never had before. It's like having a teaching assistant that never sleeps.",
      author: "Dr. Emily Rodriguez",
      role: "Online Learning Coordinator",
      rating: 5,
      avatar: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'good':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'average':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'needs-help':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent':
        return '✅ Excellent';
      case 'good':
        return '✅ Good';
      case 'average':
        return '⚠️ Average';
      case 'needs-help':
        return '❌ Needs Help';
      default:
        return '⚠️ Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-blue-600 bg-blue-50';
      case 'average':
        return 'text-yellow-600 bg-yellow-50';
      case 'needs-help':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            📌 What EduPulse Captures
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-world examples of how EduPulse monitors and analyzes student attention 
            patterns to provide actionable insights for educators.
          </p>
        </motion.div>

        {/* Sample Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-16"
        >
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-4">
            <h3 className="text-xl font-semibold text-white">Live Class Analytics</h3>
            <p className="text-white/80 text-sm">Real-time student attention monitoring results</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Focus (%)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Alerts</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sampleStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{student.focus}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              student.focus >= 80 ? 'bg-green-500' :
                              student.focus >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${student.focus}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.alerts <= 3 ? 'bg-green-100 text-green-800' :
                        student.alerts <= 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {student.alerts}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(student.status)}`}>
                        {getStatusIcon(student.status)}
                        <span>{getStatusText(student.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className={`h-4 w-4 ${
                          student.trend === 'up' ? 'text-green-500' :
                          student.trend === 'down' ? 'text-red-500 transform rotate-180' : 'text-gray-400'
                        }`} />
                        <span className="text-sm text-gray-600 capitalize">{student.trend}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What Educators Are Saying
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-lg p-6 card-hover"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-gray-600 mb-4 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center space-x-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-8 text-white text-center"
        >
          <h3 className="text-2xl font-bold mb-8">EduPulse Impact Metrics</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-yellow-300 mb-2">87%</div>
              <div className="text-white/80">Average Class Attention</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-300 mb-2">23%</div>
              <div className="text-white/80">Engagement Improvement</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-300 mb-2">95%</div>
              <div className="text-white/80">Detection Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-300 mb-2">100%</div>
              <div className="text-white/80">Privacy Protection</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SampleOutput;