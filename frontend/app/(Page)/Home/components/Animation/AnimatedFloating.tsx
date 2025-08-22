"use client";

import { motion } from "framer-motion";

// AnimatedFloating particles
const FloatingParticles = () => {
  const particles = Array.from({ length: 15 });
  
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-violet-400/30 to-fuchsia-400/30"
          initial={{
            x: Math.random() * 100 + 'vw',
            y: Math.random() * 100 + 'vh',
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, (Math.random() * 100) + 'vh'],
            x: [null, (Math.random() * 100) + 'vw'],
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;