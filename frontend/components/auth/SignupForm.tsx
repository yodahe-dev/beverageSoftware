"use client";

import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

interface SignupFormProps {
  name: string;
  setName: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  usernameAvailable: boolean | null;
  usernameError: string | null;
  isCheckingUsername: boolean;
  checkUsernameAvailability: () => void;

  email: string;
  setEmail: (value: string) => void;
  emailError: string | null;

  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;

  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;

  renderPasswordStrength: () => React.ReactNode;

  isLoading: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function SignupForm({
  name,
  setName,
  username,
  setUsername,
  usernameAvailable,
  usernameError,
  isCheckingUsername,
  checkUsernameAvailability,
  email,
  setEmail,
  emailError,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  confirmPassword,
  setConfirmPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  renderPasswordStrength,
  isLoading,
  handleSubmit,
}: SignupFormProps) {
  return (
    <div className="p-8 pt-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Full Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <div className="relative">
            <input
              placeholder="John Doe"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[var(--bg-input)] border border-[var(--color-brand-mid)]/30 text-[var(--text-light)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-brand-mid)] focus:ring-1 focus:ring-[var(--color-brand-mid)]/30 rounded-xl py-3 px-4 pl-10 transition-all duration-300"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-mid)]">
              <FaUser className="h-4 w-4" />
            </div>
          </div>
        </motion.div>

        {/* Username */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Username</label>
            <button
              type="button"
              onClick={checkUsernameAvailability}
              disabled={isCheckingUsername || !username}
              className="text-xs text-[var(--color-brand-mid)] hover:text-[var(--color-brand-end)] transition-colors flex items-center"
            >
              {isCheckingUsername ? (
                <span className="flex items-center">
                  <span className="h-3 w-3 border-t-2 border-[var(--color-brand-mid)] rounded-full animate-spin mr-1"></span>
                  Checking...
                </span>
              ) : (
                "Check Availability"
              )}
            </button>
          </div>

          <div className="relative">
            <input
              placeholder="yourusername"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              required
              className="w-full bg-[var(--bg-input)] border border-[var(--color-brand-mid)]/30 text-[var(--text-light)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-brand-mid)] focus:ring-1 focus:ring-[var(--color-brand-mid)]/30 rounded-xl py-3 px-4 pl-10 transition-all duration-300"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-mid)]">
              <FaUser className="h-4 w-4" />
            </div>

            {username && usernameAvailable !== null && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameAvailable ? (
                  <FaCheck className="h-4 w-4 text-green-400" />
                ) : (
                  <FaTimes className="h-4 w-4 text-red-400" />
                )}
              </div>
            )}
          </div>

          {usernameError && (
            <p className="mt-1 text-xs text-red-400">{usernameError}</p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <label className="block text-sm font-medium mb-2">Email</label>
          <div className="relative">
            <input
              placeholder="name@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--bg-input)] border border-[var(--color-brand-mid)]/30 text-[var(--text-light)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-brand-mid)] focus:ring-1 focus:ring-[var(--color-brand-mid)]/30 rounded-xl py-3 px-4 pl-10 transition-all duration-300"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-mid)]">
              <FaEnvelope className="h-4 w-4" />
            </div>
          </div>
          {emailError && (
            <p className="mt-1 text-xs text-red-400">{emailError}</p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          <label className="block text-sm font-medium mb-2">Password</label>
          <div className="relative">
            <input
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[var(--bg-input)] border border-[var(--color-brand-mid)]/30 text-[var(--text-light)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-brand-mid)] focus:ring-1 focus:ring-[var(--color-brand-mid)]/30 rounded-xl py-3 px-4 pl-10 transition-all duration-300"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-mid)]">
              <FaLock className="h-4 w-4" />
            </div>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-mid)] hover:text-[var(--color-brand-end)] transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <FaEyeSlash className="h-4 w-4" />
              ) : (
                <FaEye className="h-4 w-4" />
              )}
            </button>
          </div>
          {renderPasswordStrength()}
        </motion.div>

        {/* Confirm Password */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <label className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              placeholder="••••••••"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-[var(--bg-input)] border border-[var(--color-brand-mid)]/30 text-[var(--text-light)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-brand-mid)] focus:ring-1 focus:ring-[var(--color-brand-mid)]/30 rounded-xl py-3 px-4 pl-10 transition-all duration-300"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-mid)]">
              <FaLock className="h-4 w-4" />
            </div>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-mid)] hover:text-[var(--color-brand-end)] transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <FaEyeSlash className="h-4 w-4" />
              ) : (
                <FaEye className="h-4 w-4" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <button
            type="submit"
            disabled={isLoading || usernameAvailable === false}
            className="w-full relative overflow-hidden py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--bg-gradient-brand)",
              color: "var(--text-primary)",
            }}
          >
            <span className="relative z-10">
              {isLoading ? "Creating account..." : "Create Account"}
            </span>

            {/* Hover layer */}
            <span
              className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{ background: "var(--btn-hover-gradient)" }}
            ></span>
          </button>
        </motion.div>
      </form>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="text-center text-sm text-[var(--color-brand-mid)/80] mt-8"
      >
        New to +Me?{" "}
        <a
          href="/login"
          className="text-[var(--color-brand-start)] hover:text-[var(--color-brand-end)] underline transition-colors font-medium"
        >
          already a member? Login here.
        </a>
      </motion.p>
    </div>
  );
}
