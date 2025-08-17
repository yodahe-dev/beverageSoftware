"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { motion } from "framer-motion";
import { 
  FaEnvelope, 
  FaUser, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaCheck,
  FaTimes,
  FaRedo
} from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Signup = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationRef = useRef<number | null>(null);

  const Backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Particle animation
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

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/");
    }
  }, [router]);

  // Check password strength
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength(0);
      return;
    }

    // Simple password strength algorithm
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character diversity
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(Math.min(strength, 5));
  }, [password]);

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check username availability
  const checkUsernameAvailability = async () => {
    if (!username || username.length < 3) {
      setUsernameAvailable(false);
      setUsernameError("");
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setUsernameError("Username can only contain letters, numbers, and underscores (3-20 characters)");
      setUsernameAvailable(false);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await axios.get(`${Backend}/api/check-username`, {
        params: { username }
      });
      
      setUsernameAvailable(response.data.available);
      setUsernameError(response.data.available ? "" : "Username is already taken");
    } catch (err: any) {
      console.error("Username check error:", err);
      setUsernameError(err.response?.data?.error || "Failed to check username availability");
      setUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Handle signup form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError("");
    setUsernameError("");

    // Validate fields
    let isValid = true;
    
    if (!name || name.length < 2) {
      toast.error("Invalid name", {
        description: "Please enter your full name",
        position: "top-center",
      });
      isValid = false;
    }
    
    if (!username || username.length < 3) {
      toast.error("Invalid username", {
        description: "Username must be at least 3 characters",
        position: "top-center",
      });
      isValid = false;
    }
    
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }
    
    if (password.length < 8) {
      toast.error("Weak password", {
        description: "Password must be at least 8 characters",
        position: "top-center",
      });
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure both passwords match",
        position: "top-center",
      });
      isValid = false;
    }
    
    if (usernameAvailable === false) {
      toast.error("Username unavailable", {
        description: "Please choose a different username",
        position: "top-center",
      });
      isValid = false;
    }
    
    // If we haven't checked username yet, check it now
    if (usernameAvailable === null) {
      await checkUsernameAvailability();
      if (!usernameAvailable) {
        toast.error("Username unavailable", {
          description: "Please choose a different username",
          position: "top-center",
        });
        isValid = false;
      }
    }
    
    if (!isValid) return;
    
    setIsLoading(true);

    try {
      const res = await axios.post(`${Backend}/api/signup`, {
        name,
        username,
        email,
        password
      });

      // Save signup token and show verification modal
      setSignupToken(res.data.signupToken);
      setShowVerificationModal(true);
      
      toast.success("Signup successful!", {
        description: "Please check your email for verification code",
        position: "top-center",
        duration: 5000,
      });

    } catch (err: any) {
      setIsLoading(false);
      
      let errorMessage = "An unexpected error occurred";
      if (err.response) {
        // Handle specific error cases
        if (err.response.status === 400) {
          errorMessage = err.response.data.error || "Invalid input data";
        } else if (err.response.status === 409) {
          errorMessage = "User already exists with that email or username";
        } else if (err.response.status === 429) {
          errorMessage = "Too many requests. Please try again later";
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error("Signup failed", {
        description: errorMessage,
        position: "top-center",
        duration: 5000,
      });
    }
  };

  // Handle verification code submission
  const handleVerificationSubmit = async () => {
    if (!verificationCode) {
      toast.error("Verification code required", {
        description: "Please enter the code sent to your email",
        position: "top-center",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const res = await axios.post(`${Backend}/api/verify`, {
        signupToken,
        code: verificationCode
      });

      // Save tokens to localStorage
      localStorage.setItem("token", res.data.token);
      if (res.data.refreshToken) {
        localStorage.setItem("refreshToken", res.data.refreshToken);
      }

      toast.success("Account verified!", {
        description: "Your account has been successfully verified",
        position: "top-center",
      });

      // Close modal and redirect
      setShowVerificationModal(false);
      router.push("/");

    } catch (err: any) {
      setIsVerifying(false);
      
      let errorMessage = "Verification failed";
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data.error || "Invalid verification code";
        } else if (err.response.status === 410) {
          errorMessage = "Verification code expired";
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, {
        position: "top-center",
        duration: 5000,
      });
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await axios.post(`${Backend}/api/resend-code`, {
        signupToken
      });
      
      toast.success("Verification code resent", {
        description: "Check your email for the new code",
        position: "top-center",
      });
    } catch (err: any) {
      let errorMessage = "Failed to resend code";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      toast.error(errorMessage, {
        position: "top-center",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Password strength indicator
  const renderPasswordStrength = () => {
    if (password.length === 0) return null;
    
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
    const strengthColors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-400",
      "bg-green-500",
      "bg-green-600"
    ];
    
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-green-400">Password strength:</span>
          <span className={`text-xs font-medium ${
            passwordStrength < 2 ? "text-red-400" : 
            passwordStrength < 4 ? "text-yellow-400" : "text-green-400"
          }`}>
            {strengthLabels[passwordStrength]}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${strengthColors[passwordStrength]}`}
            style={{ width: `${(passwordStrength / 5) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden relative">
      <Toaster richColors expand={true} />
      
      {/* Particle animation canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 z-1 bg-[radial-gradient(ellipse_at_center,rgba(9,9,11,0.7)_0%,rgba(9,9,11,0.9)_70%)]" />
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md backdrop-blur-sm bg-black/20 rounded-2xl border border-green-500/20 shadow-[0_0_50px_#22c55e/10] overflow-hidden"
        >
          {/* Logo header */}
          <div className="p-8 pb-6 border-b border-green-500/10 relative">
            <div className="flex flex-col items-center">
              {/* +Me logo */}
              <motion.div 
                className="relative mb-6"
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ 
                  delay: 0.2, 
                  type: "spring", 
                  stiffness: 300,
                  damping: 15
                }}
              >
                <div className="w-32 h-32 rounded-[30%] bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-2 border-green-500/30 flex items-center justify-center">
                  <motion.div 
                    className="relative"
                    animate={{ 
                      rotate: [0, 5, 0, -5, 0],
                      scale: [1, 1.05, 1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="absolute w-12 h-1 bg-green-400 rounded-full"></div>
                    <div className="absolute w-1 h-12 bg-green-400 rounded-full" style={{ left: '50%', transform: 'translateX(-50%)' }}></div>
                  </motion.div>
                </div>
                <motion.div 
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-black"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                ></motion.div>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold text-center mb-2 tracking-tight"
              >
                Create Account
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-green-400/80 text-center"
              >
                Join the +Me community today
              </motion.p>
            </div>
          </div>
          
          {/* Form section */}
          <div className="p-8 pt-6">
            <form 
              onSubmit={handleSubmit} 
              className="flex flex-col gap-5"
            >
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
                    className="w-full bg-black/20 border border-green-500/30 text-green-300 placeholder:text-green-600/70 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 shadow-[0_0_10px_#22c55e/5] rounded-xl py-3 px-4 pl-10 transition-all duration-300"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
                    <FaUser className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>
              
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
                    className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center"
                  >
                    {isCheckingUsername ? (
                      <span className="flex items-center">
                        <span className="h-3 w-3 border-t-2 border-green-400 rounded-full animate-spin mr-1"></span>
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
                      setUsernameAvailable(null);
                    }}
                    required
                    className="w-full bg-black/20 border border-green-500/30 text-green-300 placeholder:text-green-600/70 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 shadow-[0_0_10px_#22c55e/5] rounded-xl py-3 px-4 pl-10 transition-all duration-300"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
                    <FaUser className="h-4 w-4" />
                  </div>
                  {username && usernameAvailable !== null && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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
                {usernameAvailable !== null && !usernameError && (
                  <p className={`mt-1 text-xs ${
                    usernameAvailable ? "text-green-400" : "text-red-400"
                  }`}>
                    {usernameAvailable 
                      ? "Username is available!" 
                      : "Username is not available"}
                  </p>
                )}
              </motion.div>
              
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
                    className={`w-full bg-black/20 border ${
                      emailError ? "border-red-500/50" : "border-green-500/30"
                    } text-green-300 placeholder:text-green-600/70 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 shadow-[0_0_10px_#22c55e/5] rounded-xl py-3 px-4 pl-10 transition-all duration-300`}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
                    <FaEnvelope className="h-4 w-4" />
                  </div>
                </div>
                {emailError && (
                  <p className="mt-1 text-xs text-red-400">{emailError}</p>
                )}
              </motion.div>
              
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
                    className="w-full bg-black/20 border border-green-500/30 text-green-300 placeholder:text-green-600/70 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 shadow-[0_0_10px_#22c55e/5] rounded-xl py-3 px-4 pl-10 transition-all duration-300"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
                    <FaLock className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300 transition-colors"
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
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    placeholder="••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-green-500/30 text-green-300 placeholder:text-green-600/70 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 shadow-[0_0_10px_#22c55e/5] rounded-xl py-3 px-4 pl-10 transition-all duration-300"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
                    <FaLock className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300 transition-colors"
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
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <button
                  type="submit"
                  disabled={isLoading || usernameAvailable === false}
                  className={`w-full relative overflow-hidden py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center ${
                    isLoading || usernameAvailable === false
                      ? "bg-green-600/30 cursor-not-allowed" 
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
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                  
                  {/* Hover effect */}
                  {!isLoading && usernameAvailable !== false && (
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
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="text-center text-sm text-green-500/80 mt-8"
            >
              Already have an account?{" "}
              <a
                href="/login"
                className="text-green-400 hover:text-green-300 underline transition-colors font-medium"
              >
                Sign in
              </a>
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-6 text-xs text-green-500/60 text-center"
            >
              <p>By creating an account, you agree to our</p>
              <p>
                <a href="#" className="hover:text-green-400 underline">Terms of Service</a> and{" "}
                <a href="#" className="hover:text-green-400 underline">Privacy Policy</a>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Verification Modal */}
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="bg-gray-900 border border-green-500/30 rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              Verify Your Email
            </DialogTitle>
            <DialogDescription className="text-center text-green-400/80">
              We've sent a 6-digit code to your email address
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-green-300">
                Verification Code
              </label>
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="bg-gray-800 border border-green-500/30 text-white rounded-xl py-3 px-4 focus:border-green-400 focus:ring-1 focus:ring-green-500/30"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleVerificationSubmit}
                disabled={isVerifying}
                className="w-full bg-gradient-to-r from-green-600/80 to-emerald-600/90 hover:from-green-500/90 hover:to-emerald-500/90 py-3 px-4 rounded-xl transition-colors"
              >
                {isVerifying ? (
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
                    Verifying...
                  </>
                ) : (
                  "Verify Account"
                )}
              </Button>

              <Button
                onClick={handleResendCode}
                disabled={isResending}
                variant="outline"
                className="w-full border border-green-500/30 text-green-400 hover:bg-green-500/10 py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isResending ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                    Sending...
                  </>
                ) : (
                  <>
                    <FaRedo className="h-4 w-4" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Signup;