import React from 'react';
import { motion } from 'framer-motion';
import { Code, Database, Cpu, Globe, Zap, Shield, Eye } from 'lucide-react';

const TechStack = () => {
  const technologies = [
    {
      category: "Computer Vision",
      icon: Eye,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      technologies: ["MediaPipe", "OpenCV", "TensorFlow.js", "Face-API.js"]
    },
    {
      category: "Frontend",
      icon: Globe,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      technologies: ["React.js", "TypeScript", "Tailwind CSS", "Framer Motion"]
    },
    {
      category: "Backend",
      icon: Database,
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      technologies: ["Node.js", "Express.js", "Socket.io", "MongoDB"]
    },
    {
      category: "Machine Learning",
      icon: Cpu,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      technologies: ["TensorFlow", "Scikit-learn", "NumPy", "Pandas"]
    },
    {
      category: "Real-time Processing",
      icon: Zap,
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50",
      technologies: ["WebRTC", "WebSockets", "Canvas API", "Web Workers"]
    },
    {
      category: "Security & Privacy",
      icon: Shield,
      color: "from-teal-500 to-green-500",
      bgColor: "bg-teal-50",
      technologies: ["Local Processing", "Encryption", "GDPR Compliance", "No Data Storage"]
    }
  ];

  return (
    <section id="tech-stack" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            ⚡ Technology Stack
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built with cutting-edge technologies to deliver reliable, scalable, 
            and privacy-focused attention monitoring solutions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className={`h-2 bg-gradient-to-r ${tech.color}`}></div>
              
              <div className="p-8">
                <div className={`${tech.bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <tech.icon className="h-8 w-8 text-gray-700" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {tech.category}
                </h3>

                <div className="space-y-2">
                  {tech.technologies.map((technology, techIndex) => (
                    <div
                      key={techIndex}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${tech.color}`}></div>
                      <span className="text-sm font-medium">{technology}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            System Architecture
          </h3>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "Video Input",
                  description: "Webcam feed capture",
                  icon: "📹",
                  color: "bg-blue-100 text-blue-600"
                },
                {
                  title: "AI Processing",
                  description: "Face & eye detection",
                  icon: "🧠",
                  color: "bg-purple-100 text-purple-600"
                },
                {
                  title: "Analytics Engine",
                  description: "Attention scoring",
                  icon: "📊",
                  color: "bg-green-100 text-green-600"
                },
                {
                  title: "Dashboard",
                  description: "Real-time insights",
                  icon: "📈",
                  color: "bg-orange-100 text-orange-600"
                }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center text-2xl mx-auto mb-4`}>
                    {step.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-8 left-full w-8 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-8 text-white"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">&lt; 100ms</div>
              <div className="text-white/80">Processing Latency</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">30 FPS</div>
              <div className="text-white/80">Real-time Analysis</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">95%</div>
              <div className="text-white/80">Detection Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">0%</div>
              <div className="text-white/80">Data Storage</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TechStack;