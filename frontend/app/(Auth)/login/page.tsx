// app/login/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaLockOpen } from "react-icons/fa";
import LogoHeader from "@/components/auth/LogoHeader";
import { Input } from "@/components/ui/input";

const Login = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState(1);
  const [resetToken, setResetToken] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationRef = useRef<number | null>(null);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const Backend = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/");
    }
    
    // Check for existing lock state
    const storedLock = localStorage.getItem("loginLock");
    if (storedLock) {
      const { lockUntil, attempts } = JSON.parse(storedLock);
      const now = Date.now();
      
      if (now < lockUntil) {
        setIsLocked(true);
        setLockTime(Math.floor((lockUntil - now) / 1000));
        setFailedAttempts(attempts);
      } else {
        localStorage.removeItem("loginLock");
      }
    }
    
    // Check for failed attempts
    const storedAttempts = localStorage.getItem("failedAttempts");
    if (storedAttempts) {
      setFailedAttempts(parseInt(storedAttempts));
    }
  }, [router]);

  // Handle lock countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isLocked && lockTime > 0) {
      interval = setInterval(() => {
        setLockTime(prev => {
          if (prev <= 1) {
            clearInterval(interval as NodeJS.Timeout);
            setIsLocked(false);
            localStorage.removeItem("loginLock");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    };
  }, [isLocked, lockTime]);

  // Pure particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      
      constructor() {
        this.x = Math.random() * (canvas?.width ?? window.innerWidth);
        this.y = Math.random() * (canvas?.height ?? window.innerHeight);
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `rgba(34, 197, 94, ${Math.random() * 0.4 + 0.1})`;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (canvas) {
          if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
          if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
        }
      }
      
      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 80; i++) {
        particlesRef.current.push(new Particle());
      }
    };

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connecting lines
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i; j < particlesRef.current.length; j++) {
          const dx = particlesRef.current[i].x - particlesRef.current[j].x;
          const dy = particlesRef.current[i].y - particlesRef.current[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 197, 94, ${0.1 * (1 - distance/100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
            ctx.stroke();
          }
        }
        
        particlesRef.current[i].update();
        particlesRef.current[i].draw();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Handle lockout based on failed attempts
  const handleLockout = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    localStorage.setItem("failedAttempts", newAttempts.toString());
    
    if (newAttempts >= 5) {
      let lockDuration = 3 * 60; 
      
      if (newAttempts === 6) lockDuration = 6 * 60;
      else if (newAttempts >= 7) lockDuration = 12 * 60; 
      
      const lockUntil = Date.now() + lockDuration * 1000;
      setIsLocked(true);
      setLockTime(lockDuration);
      
      localStorage.setItem("loginLock", JSON.stringify({
        lockUntil,
        attempts: newAttempts
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast.warning("Account locked", {
        description: `Please try again in ${Math.floor(lockTime / 60)}m ${lockTime % 60}s`,
        position: "top-center",
        duration: 5000,
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const res = await axios.post(`${Backend}/api/login`, {
        identifier,
        password
      });

      localStorage.setItem("token", res.data.token);
      if (res.data.refreshToken) {
        localStorage.setItem("refreshToken", res.data.refreshToken);
      }

      localStorage.removeItem("failedAttempts");
      setFailedAttempts(0);

      toast.success("Login successful!", {
        description: "Welcome back to +Me!",
        position: "top-center",
        duration: 2000,
      });

      setTimeout(() => {
        router.push("/");
      }, 1500);

    } catch (err: any) {
      setIsLoading(false);
      
      let errorMessage = "An unexpected error occurred";
      if (err.response) {
        // Handle specific error cases
        if (err.response.status === 401) {
          errorMessage = "Invalid email or password";
          handleLockout();
        } else if (err.response.status === 403) {
          if (err.response.data.error === "Email not verified") {
            errorMessage = "Please verify your email before logging in";
          } else {
            errorMessage = "Account locked due to too many attempts";
            handleLockout();
          }
        } else if (err.response.status === 429) {
          errorMessage = "Too many requests. Please try again later";
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error("Login failed", {
        description: errorMessage,
        position: "top-center",
        duration: 5000,
      });
    }
  };

  // Handle password reset request
  const handleResetRequest = async () => {
    if (!resetEmail) {
      toast.error("Email required", {
        description: "Please enter your email address",
        position: "top-center",
      });
      return;
    }

    try {
      const res = await axios.post(`${Backend}/api/forgot-password`, {
        email: resetEmail
      });

      setResetToken(res.data.resetToken);
      setResetStep(2);
      
      toast.success("Reset code sent", {
        description: "Check your email for the reset code",
        position: "top-center",
      });
    } catch (err: any) {
      let errorMessage = "Failed to send reset code";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      toast.error("Reset failed", {
        description: errorMessage,
        position: "top-center",
      });
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!resetCode || !newPassword) {
      toast.error("Missing information", {
        description: "Please enter both the code and new password",
        position: "top-center",
      });
      return;
    }

    try {
      await axios.post(`${Backend}/api/reset-password`, {
        resetToken,
        code: resetCode,
        newPassword
      });

      toast.success("Password reset successful", {
        description: "You can now login with your new password",
        position: "top-center",
      });
      
      // Close modal and reset state
      setShowResetModal(false);
      setResetStep(1);
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
    } catch (err: any) {
      let errorMessage = "Failed to reset password";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      toast.error("Reset failed", {
        description: errorMessage,
        position: "top-center",
      });
    }
  };

  // Format time for lock display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden relative">
      <Toaster richColors expand={true} />

      {/* Pure particle animation canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Modern gradient overlay */}
      <div className="absolute inset-0 z-1 bg-[radial-gradient(ellipse_at_center,rgba(9,9,11,0.7)_0%,rgba(9,9,11,0.9)_70%)]" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md backdrop-blur-sm bg-black/20 rounded-2xl border border-green-500/20 shadow-[0_0_50px_#22c55e/10] overflow-hidden"
        >
          {/* Logo header with modern shape */}
          <LogoHeader />

          {/* Form section */}
          <div className="p-8 pt-6">
            {isLocked ? (
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
            ) : (
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-medium mb-2">
                    Email or Username
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="name@example.com or username"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="h-12 w-full bg-black/20 border border-green-500/30 text-green-300 placeholder:text-green-600/70 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 shadow-[0_0_10px_#22c55e/5] rounded-xl py-3 px-4 transition-all duration-300"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-green-400 hover:text-green-300 transition-colors"
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
                      className="h-12 w-full bg-black/20 border border-green-500/30 text-green-300 placeholder:text-green-600/70 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 shadow-[0_0_10px_#22c55e/5] rounded-xl py-3 px-4 transition-all duration-300"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300 transition-colors"
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

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center justify-between text-sm pt-2"
                >

                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full relative overflow-hidden py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center ${
                      isLoading
                        ? "bg-green-600/80 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600/80 to-emerald-600/90 hover:from-green-500/90 hover:to-emerald-500/90"
                    }`}
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

                    {/* Hover effect */}
                    {!isLoading && (
                      <motion.span
                        className="absolute inset-0 bg-white/5"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </button>
                </motion.div>
              </form>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="text-center text-sm text-green-500/80 mt-8"
            >
              New to +Me?{" "}
              <a
                href="/signup"
                className="text-green-400 hover:text-green-300 underline transition-colors font-medium"
              >
                Create an account
              </a>
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-green-500/30 rounded-xl w-full max-w-md p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Reset Password</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

            {resetStep === 1 ? (
              <div>
                <p className="text-gray-400 mb-4">
                  Enter your email address to receive a reset code
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-gray-800 border border-green-500/30 text-white rounded-xl py-2 px-4 focus:border-green-400 focus:ring-1 focus:ring-green-500/30"
                  />
                </div>
                <button
                  onClick={handleResetRequest}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl transition-colors"
                >
                  Send Reset Code
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 mb-4">
                  Enter the code sent to your email and your new password
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-gray-800 border border-green-500/30 text-white rounded-xl py-2 px-4 focus:border-green-400 focus:ring-1 focus:ring-green-500/30"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-gray-800 border border-green-500/30 text-white rounded-xl py-2 px-4 focus:border-green-400 focus:ring-1 focus:ring-green-500/30"
                  />
                </div>
                <button
                  onClick={handlePasswordReset}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl transition-colors"
                >
                  Reset Password
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Login;