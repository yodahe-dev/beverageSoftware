"use client";
import { motion } from "framer-motion";

const LogoHeader = () => {
  return (
    <div className="p-8 pb-6 border-b border-green-500/10 relative">
      <div className="flex flex-col items-center">
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
          <div className="w-32 h-32 rounded-[30%] bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-2 border-green-500/30 flex items-center justify-center">
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
              <div className="absolute w-12 h-1 bg-green-400 rounded-full"></div>
              <div
                className="absolute w-1 h-12 bg-green-400 rounded-full"
                style={{ left: "50%", transform: "translateX(-50%)" }}
              ></div>
            </motion.div>
          </div>
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-black"
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

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold text-center mb-2 tracking-tight"
        >
          +Me
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-green-400/80 text-center"
        >
          Because everything's better when it's +Me
        </motion.p>
      </div>
    </div>
  );
};

export default LogoHeader;
