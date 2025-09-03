"use client";
import { motion } from "framer-motion";

const LogoHeader = () => {
  return (
    <div
      className="p-8 pb-6 border-b relative"
      style={{
        borderColor: "var(--color-brand-mid)",
        background: "var(--bg-dark-2)",
      }}
    >
      <div className="flex flex-col items-center">
        {/* Logo Animated Container */}
        <motion.div
          className="relative mb-6"
          initial={{ rotate: -15, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 300,
            damping: 15,
          }}
        >
          {/* Outer Circle */}
          <div
            className="w-32 h-32 rounded-[30%] flex items-center justify-center border-2"
            style={{
              borderColor: "var(--color-brand-mid)",
              boxShadow: "var(--shadow-brand-1)",
            }}
          >
            {/* Rotating Cross */}
            <motion.div
              className="relative"
              animate={{
                rotate: [0, 5, 0, -5, 0],
                scale: [1, 1.05, 1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: "3rem",
                  height: "0.25rem",
                  background: "var(--color-brand-end)",
                }}
              ></div>
              <div
                className="absolute rounded-full"
                style={{
                  width: "0.25rem",
                  height: "3rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--color-brand-end)",
                }}
              ></div>
            </motion.div>
          </div>

          {/* Pulsing Dot */}
          <motion.div
            className="absolute -top-2 -right-2 rounded-full"
            style={{
              width: "2rem",
              height: "2rem",
              background: "var(--color-brand-mid)",
              border: "4px solid var(--bg-dark-1)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          ></motion.div>
        </motion.div>

        {/* Logo Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold text-center mb-2 tracking-tight"
          style={{
            background: "var(--text-brand-1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          +Me
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
          style={{
            color: "var(--plusme-text-muted)",
          }}
        >
          Because everything's better when it's +Me
        </motion.p>
      </div>
    </div>
  );
};

export default LogoHeader;
