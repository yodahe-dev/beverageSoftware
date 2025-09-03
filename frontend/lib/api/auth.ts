import axios from "axios";

const Backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface LoginData {
  identifier: string;
  password: string;
}

export interface ResetRequestData {
  email: string;
}

export interface ResetPasswordData {
  resetToken: string;
  code: string;
  newPassword: string;
}

// Login
export const login = async (data: LoginData) => {
  const res = await axios.post(`${Backend}/api/login`, data);
  return res.data;
};

// Request password reset
export const requestPasswordReset = async (data: ResetRequestData) => {
  const res = await axios.post(`${Backend}/api/forgot-password`, data);
  return res.data;
};

// Reset password
export const resetPassword = async (data: ResetPasswordData) => {
  const res = await axios.post(`${Backend}/api/reset-password`, data);
  return res.data;
};
