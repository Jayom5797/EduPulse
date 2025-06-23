import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Users, TrendingDown, Target } from 'lucide-react';

const ProblemStatement = () => {
  const problems = [
    {
      icon: Users,
      title: "Lack of Physical Presence",
      description: "Online learning environments miss the natural cues teachers use to gauge student engagement in traditional classrooms."
    },
    {
      icon: TrendingDown,
      title: "Declining Attention Rates",
      description: "Studies show that student attention spans decrease significantly in virtual learning environments without proper monitoring."
    },
    {
      icon: AlertTriangle,
      title: "Real-time Detection Gap",
      description: "Teachers struggle to identify disengaged students in real-time, missing critical moments to re-engage learners."
    }
  ];

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
            🚨 Why Monitor Student Attentiveness?
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            The shift to online learning has created unprecedented challenges in maintaining 
            student engagement and measuring learning effectiveness.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg p-8 card-hover border border-gray-100"
            >
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <problem.icon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{problem.title}</h3>
              <p className="text-gray-600 leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-white"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">The Challenge is Real</h3>
              <p className="text-xl text-white/90 mb-6">
                Research shows the critical need for attention monitoring in online education environments.
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <blockquote className="text-lg italic">
                  📌 "Over 60% of students report struggling with attention in virtual classrooms."
                </blockquote>
                <cite className="text-white/80 text-sm mt-2 block">
                  — UNESCO e-Learning Report 2024
                </cite>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-300 mb-2">60%</div>
                <div className="text-white/80">Students Struggle with Focus</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-300 mb-2">40%</div>
                <div className="text-white/80">Attention Drop Rate</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-300 mb-2">25%</div>
                <div className="text-white/80">Learning Efficiency Loss</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-300 mb-2">85%</div>
                <div className="text-white/80">Teachers Need Better Tools</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Solution Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            EduPulse Bridges This Gap
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our intelligent visual analysis system provides real-time attention monitoring, 
            helping educators identify and re-engage distracted students instantly.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemStatement;