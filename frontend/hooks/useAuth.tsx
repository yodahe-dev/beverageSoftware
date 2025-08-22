"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {jwtDecode} from "jwt-decode";
import axios from "axios";

interface JwtPayload {
  id: string;
  username: string;
  email: string;
  exp: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      let token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          // Access token expired → try refresh
          const response = await axios.post(
            `${BACKEND_URL}/api/refresh-token`,
            {},
            { withCredentials: true } // send refresh token cookie
          );

          token = response.data.accessToken;
          localStorage.setItem("token", token);
        }

        setUser(jwtDecode<JwtPayload>(token));
        setLoading(false);
      } catch (error) {
        console.log("Token error:", error);
        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    validateToken();
  }, [router]);

  return { user, loading };
}
