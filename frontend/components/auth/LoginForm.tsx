"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  identifier: string;
  setIdentifier: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  setShowResetModal: (val: boolean) => void;
};

export default function LoginForm({
  identifier,
  setIdentifier,
  password,
  setPassword,
  handleSubmit,
  isLoading,
  setShowResetModal,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Identifier Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <label className="block text-sm font-medium mb-2 text-[var(--plusme-text-light)]">
          Email or Username
        </label>
        <div className="relative">
          <Input
            placeholder="name@example.com or username"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="h-12 w-full bg-[var(--bg-dark-1)] border border-[var(--plusme-text-muted)] text-[var(--plusme-text-light)] placeholder:text-[var(--plusme-text-muted)] focus:border-[var(--color-brand-start)] focus:ring-1 focus:ring-[var(--color-brand-start)] shadow-[0_0_10px_var(--color-brand-start)/30] rounded-xl py-3 px-4 transition-all duration-300"
          />
        </div>
      </motion.div>

      {/* Password Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-[var(--plusme-text-light)]">
            Password
          </label>
          <button
            type="button"
            className="text-[var(--color-brand-start)] hover:text-[var(--color-brand-end)] text-xs transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div className="relative">
          <Input
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 w-full bg-[var(--bg-dark-1)] border border-[var(--plusme-text-muted)] text-[var(--plusme-text-light)] placeholder:text-[var(--plusme-text-muted)] focus:border-[var(--color-brand-start)] focus:ring-1 focus:ring-[var(--color-brand-start)] shadow-[0_0_10px_var(--color-brand-start)/30] rounded-xl py-3 px-4 transition-all duration-300"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-brand-start)] hover:text-[var(--color-brand-end)] transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clipRule="evenodd"
                />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            )}
          </button>
        </div>
      </motion.div>

      {/* Forgot Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-between text-sm pt-2"
      >
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="text-[var(--color-brand-start)] hover:text-[var(--color-brand-end)] transition-colors"
        >
          Forgot password?
        </button>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <button
          type="submit"
          disabled={isLoading}
          style={{
            background: isLoading
              ? "var(--color-brand-mid)"
              : "var(--bg-brand-3)",
          }}
          className="w-full relative overflow-hidden py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center text-white shadow-[0_0_10px_var(--color-brand-start)/30] hover:opacity-90"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </>
          ) : (
            "Continue to your feed"
          )}
        </button>
      </motion.div>

      {/* Signup Link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="text-center text-sm text-[var(--color-brand-mid)/80] mt-8"
      >
        New to +Me?{" "}
        <a
          href="/signup"
          className="text-[var(--color-brand-start)] hover:text-[var(--color-brand-end)] underline transition-colors font-medium"
        >
          Create an account
        </a>
      </motion.p>
    </form>
  );
}
