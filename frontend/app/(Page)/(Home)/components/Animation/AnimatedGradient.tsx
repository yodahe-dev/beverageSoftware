"use client";

import { motion } from "framer-motion";

const GradientOrbs = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <motion.div 
        animate={{ 
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-full blur-3xl"
      ></motion.div>
      <motion.div 
        animate={{ 
          x: [0, -100, 0],
          y: [0, -50, 0],
        }}
        transition={{ 
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 rounded-full blur-3xl"
      ></motion.div>
      <motion.div 
        animate={{ 
          x: [0, 80, 0],
          y: [0, -80, 0],
        }}
        transition={{ 
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-pink-600/20 to-rose-600/20 rounded-full blur-3xl"
      ></motion.div>
    </div>
  );
};

export default GradientOrbs;