"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaLockOpen } from "react-icons/fa";
import LogoHeader from "@/components/auth/AuthHeader";
import LoginForm from "@/components/auth/LoginForm";
import LockedScreen from "@/components/auth/LockedScreen";
import PasswordResetModal from "@/components/auth/PasswordResetModal";

const Login = () => {
  const router = useRouter();
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
    if (token) router.push("/");

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

    const storedAttempts = localStorage.getItem("failedAttempts");
    if (storedAttempts) setFailedAttempts(parseInt(storedAttempts));
  }, [router]);

  // Lock countdown
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

  // Particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

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

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 80; i++) {
        particlesRef.current.push(new Particle());
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i; j < particlesRef.current.length; j++) {
          const dx = particlesRef.current[i].x - particlesRef.current[j].x;
          const dy = particlesRef.current[i].y - particlesRef.current[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 197, 94, ${0.1 * (1 - distance / 100)})`;
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Lockout handling
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
      localStorage.setItem("loginLock", JSON.stringify({ lockUntil, attempts: newAttempts }));
    }
  };

  // Submit login
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
      const res = await axios.post(`${Backend}/api/login`, { identifier, password });
      localStorage.setItem("token", res.data.token);
      if (res.data.refreshToken) localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.removeItem("failedAttempts");
      setFailedAttempts(0);

      toast.success("Login successful!", { description: "Welcome back to +Me!", position: "top-center", duration: 2000 });
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setIsLoading(false);
      let errorMessage = "An unexpected error occurred";
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Invalid email or password";
          handleLockout();
        } else if (err.response.status === 403) {
          if (err.response.data.error === "Email not verified") errorMessage = "Please verify your email before logging in";
          else { errorMessage = "Account locked due to too many attempts"; handleLockout(); }
        } else if (err.response.status === 429) errorMessage = "Too many requests. Please try again later";
        else if (err.response.data && err.response.data.error) errorMessage = err.response.data.error;
      } else if (err.message) errorMessage = err.message;

      toast.error("Login failed", { description: errorMessage, position: "top-center", duration: 5000 });
    }
  };

  // Password reset request
  const handleResetRequest = async () => {
    if (!resetEmail) {
      toast.error("Email required", { description: "Please enter your email address", position: "top-center" });
      return;
    }
    try {
      const res = await axios.post(`${Backend}/api/forgot-password`, { email: resetEmail });
      setResetToken(res.data.resetToken);
      setResetStep(2);
      toast.success("Reset code sent", { description: "Check your email for the reset code", position: "top-center" });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to send reset code";
      toast.error("Reset failed", { description: errorMessage, position: "top-center" });
    }
  };

  // Password reset
  const handlePasswordReset = async () => {
    if (!resetCode || !newPassword) {
      toast.error("Missing information", { description: "Please enter both the code and new password", position: "top-center" });
      return;
    }
    try {
      await axios.post(`${Backend}/api/reset-password`, { resetToken, code: resetCode, newPassword });
      toast.success("Password reset successful", { description: "You can now login with your new password", position: "top-center" });
      setShowResetModal(false);
      setResetStep(1);
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to reset password";
      toast.error("Reset failed", { description: errorMessage, position: "top-center" });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden relative">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      <Toaster richColors expand={true} />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md backdrop-blur-sm bg-black/20 rounded-2xl border border-green-500/20 shadow-[0_0_50px_#22c55e/10] overflow-hidden"
        >
          <LogoHeader />
          <div className="p-8 pt-6">
            {isLocked ? (
              <LockedScreen lockTime={lockTime} failedAttempts={failedAttempts} formatTime={formatTime} />
            ) : (
              <LoginForm
                identifier={identifier}
                setIdentifier={setIdentifier}
                password={password}
                setPassword={setPassword}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                setShowResetModal={setShowResetModal}
              />
            )}
          </div>
        </motion.div>
      </div>

      {showResetModal && (
        <PasswordResetModal
          show={showResetModal}
          setShow={setShowResetModal}
          resetStep={resetStep}
          setResetStep={setResetStep}
          resetEmail={resetEmail}
          setResetEmail={setResetEmail}
          resetCode={resetCode}
          setResetCode={setResetCode}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          handleResetRequest={handleResetRequest}
          handlePasswordReset={handlePasswordReset}
        />
      )}
    </div>
  );
};

export default Login;
