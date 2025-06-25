"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Helper function to get cookie
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Tambahkan state untuk tracking aktivitas
  const [lastActivity, setLastActivity] = useState(Date.now());
  const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 jam (60 menit)

  useEffect(() => {
    // Only check auth if there's a token in cookies
    const token = getCookie("token");
    const apiToken = getCookie("api_token");

    if (token || apiToken) {
      checkAuth();
    } else {
      // No tokens found, set loading to false immediately
      setLoading(false);
    }

    // Reset timer setiap ada aktivitas
    const resetTimer = () => {
      setLastActivity(Date.now());
    };

    // Event listeners untuk aktivitas user
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    // Cek session timeout setiap 30 detik
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity >= SESSION_TIMEOUT && user) {
        handleSessionTimeout();
      }
    }, 30000);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      clearInterval(interval);
    };
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk handle session timeout
  const handleSessionTimeout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout request failed");
      }

      setUser(null);
      toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if there's an error, clear the user state and redirect to login
      setUser(null);
      toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
      router.push("/login");
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout request failed");
      }

      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if there's an error, clear the user state and redirect to login
      setUser(null);
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E22345]"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
      <Toaster position="top-right" />
    </AuthContext.Provider>
  );
}
