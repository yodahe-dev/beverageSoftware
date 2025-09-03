"use client";

import { motion } from "framer-motion";

type PasswordResetModalProps = {
  show: boolean;
  setShow: (value: boolean) => void;
  resetStep: number;
  setResetStep: (step: number) => void;
  resetEmail: string;
  setResetEmail: (email: string) => void;
  resetCode: string;
  setResetCode: (code: string) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  handleResetRequest: () => void;
  handlePasswordReset: () => void;
};

export default function PasswordResetModal({
  show,
  setShow,
  resetStep,
  setResetStep,
  resetEmail,
  setResetEmail,
  resetCode,
  setResetCode,
  newPassword,
  setNewPassword,
  handleResetRequest,
  handlePasswordReset,
}: PasswordResetModalProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "var(--modal-overlay)" }} // semi-transparent black
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl w-full max-w-md p-6"
        style={{
          background: "var(--bg-gradient-dark-3)",
          border: "1px solid var(--color-brand-mid)",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Reset Password
          </h3>
          <button
            onClick={() => setShow(false)}
            className="transition-colors"
            style={{
              color: "var(--text-muted)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ stroke: "currentColor" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Step 1 - Send reset code */}
        {resetStep === 1 ? (
          <div>
            <p
              className="mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Enter your email address to receive a reset code.
            </p>
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl py-2 px-4 focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--color-brand-mid)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <button
              onClick={handleResetRequest}
              className="w-full py-2 px-4 rounded-xl font-medium transition-all duration-300"
              style={{
                background: "var(--bg-gradient-brand)",
                color: "var(--text-light)",
              }}
            >
              Send Reset Code
            </button>
          </div>
        ) : (
          /* Step 2 - Enter code and new password */
          <div>
            <p
              className="mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Enter the code sent to your email and your new password.
            </p>
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Reset Code
              </label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full rounded-xl py-2 px-4 focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--color-brand-mid)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-xl py-2 px-4 focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--color-brand-mid)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <button
              onClick={handlePasswordReset}
              className="w-full py-2 px-4 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "var(--bg-gradient-brand)",
                color: "var(--text-light)",
              }}
            >
              Reset Password
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
