"use client";
import { motion } from "framer-motion";
import { useState } from "react";

interface LoginFormProps {
  identifier: string;
  setIdentifier: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  setShowResetModal: (val: boolean) => void;
}

const LoginForm = ({
  identifier,
  setIdentifier,
  password,
  setPassword,
  isLoading,
  handleSubmit,
  setShowResetModal,
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <label className="block text-sm font-medium mb-2">Email or Username</label>
        <input
          placeholder="name@example.com or username"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full bg-black/20 border border-green-500/30 text-green-300 placeholder:text-green-600/70 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 rounded-xl py-3 px-4"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Password</label>
          <button
            type="button"
            className="text-xs text-green-400 hover:text-green-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <input
          placeholder="••••••••"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-black/20 border border-green-500/30 text-green-300 placeholder:text-green-600/70 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 rounded-xl py-3 px-4"
        />
      </motion.div>

      <div className="flex items-center justify-between text-sm pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 text-green-500 rounded" />
          <span className="text-green-400">Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="text-green-400 hover:text-green-300"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center ${
          isLoading
            ? "bg-green-600/80 cursor-not-allowed"
            : "bg-gradient-to-r from-green-600/80 to-emerald-600/90 hover:from-green-500/90 hover:to-emerald-500/90"
        }`}
      >
        {isLoading ? "Signing in..." : "Continue to your feed"}
      </button>
    </form>
  );
};

export default LoginForm;
