"use client";

import { useState, useRef, useEffect } from "react";

import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { motion } from "framer-motion";
import { 
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
import AuthHeader from "@/components/auth/AuthHeader";
import SignupForm from "@/components/auth/SignupForm";
import VerificationModal from "@/components/auth/VerificationModal";

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
          <AuthHeader/>
          
          {/* Form section */}
            <SignupForm
      name={name}
      setName={setName}
      username={username}
      setUsername={setUsername}
      usernameAvailable={usernameAvailable}
      usernameError={usernameError}
      isCheckingUsername={isCheckingUsername}
      checkUsernameAvailability={checkUsernameAvailability}
      email={email}
      setEmail={setEmail}
      emailError={emailError}
      password={password}
      setPassword={setPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      renderPasswordStrength={renderPasswordStrength}
      isLoading={isLoading}
      handleSubmit={handleSubmit}
    />
        </motion.div>
      </div>

      <VerificationModal
        showVerificationModal={showVerificationModal}
        setShowVerificationModal={setShowVerificationModal}
        verificationCode={verificationCode}
        setVerificationCode={setVerificationCode}
        handleVerificationSubmit={handleVerificationSubmit}
        handleResendCode={handleResendCode}
        isVerifying={isVerifying}
        isResending={isResending}
      />
    </div>
  );
};

export default Signup;