"use client";

import { motion } from "framer-motion";
import { FaLock } from "react-icons/fa";

type LockedScreenProps = {
  lockTime: number;
  failedAttempts: number;
  formatTime: (seconds: number) => string;
};

export default function LockedScreen({ lockTime, failedAttempts, formatTime }: LockedScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8"
    >
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
          <FaLock className="text-red-400 text-2xl" />
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2">Account Locked</h3>
      <p className="text-green-400/80 mb-4">
        Too many failed login attempts. Please try again later.
      </p>
      <div className="text-3xl font-mono font-bold text-green-400">
        {formatTime(lockTime)}
      </div>
      <p className="text-sm text-green-500/60 mt-4">
        Attempts: {failedAttempts}
      </p>
    </motion.div>
  );
}
