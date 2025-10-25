'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Coffee, Beer, Glasses } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-login if token exists
  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    if (token) router.push('/');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('erp_token', data.token); // Save token
        localStorage.setItem('erp_user_email', email); // optional for autocomplete
        router.push('/');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="bg-gray-900 p-10 rounded-3xl shadow-xl w-full max-w-md border-r border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-white text-center flex items-center justify-center gap-2">
          <Beer size={28} className="text-yellow-400" /> Beverage ERP Login
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col">
            <Label className="text-gray-300">Email</Label>
            <div className="relative">
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                autoComplete="email"
                className="pr-10 bg-gray-800 text-white placeholder-gray-400 focus:ring-yellow-400 focus:border-yellow-400"
              />
              <Coffee className="absolute right-2 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          <div className="flex flex-col">
            <Label className="text-gray-300">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="pr-10 bg-gray-800 text-white placeholder-gray-400 focus:ring-yellow-400 focus:border-yellow-400"
              />
              <button
                type="button"
                className="absolute right-2 top-2.5 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-4 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-600 hover:scale-105 transition-transform text-white font-bold"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {error && (
          <AlertDialog open={!!error} onOpenChange={() => setError('')}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-500">Login Error</AlertDialogTitle>
                <AlertDialogDescription>{error}</AlertDialogDescription>
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <div className="mt-6 text-center text-gray-400 text-sm">
          Secure ERP for
          <span className="text-yellow-400 mx-1">Soft Drink</span>,
          <span className="text-red-400 mx-1">Alcohol</span>,
          <span className="text-blue-400 mx-1">Other Beverages</span>.
        </div>

        <div className="mt-6 flex justify-center gap-4 text-gray-400">
          <Coffee size={24} aria-label="Soft Drink" role="img" className="hover:text-yellow-400 transition-colors" />
          <Beer size={24} aria-label="Alcohol" role="img" className="hover:text-red-400 transition-colors" />
          <Glasses size={24} aria-label="Other" role="img" className="hover:text-blue-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}
