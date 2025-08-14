"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Adicionar state para tracking de atividade
  const [lastActivity, setLastActivity] = useState(Date.now());
  const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hora (60 minutos)

  // Prevent hydration mismatch by only running client-side code after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Always check auth on mount - no need to check cookies since they're httpOnly
    checkAuth();

    // Reset timer a cada atividade
    const resetTimer = () => {
      setLastActivity(Date.now());
    };

    // Event listeners para atividade do usuário
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    // Verificar session timeout a cada 60 segundos (increased from 30 seconds to reduce server load)
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity >= SESSION_TIMEOUT && user) {
        handleSessionTimeout();
      }
    }, 60000); // Increased from 30000 to 60000ms

    // Cleanup event listeners
    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      clearInterval(interval);
    };
  }, [mounted]); // Add mounted dependency

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

  // Função para lidar com session timeout
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
      toast.error("Sua sessão expirou. Faça login novamente.");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if there's an error, clear the user state and redirect to login
      setUser(null);
      toast.error("Sua sessão expirou. Faça login novamente.");
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

  const value = {
    user,
    setUser,
    loading,
    logout,
    mounted,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "500",
          },
        }}
      />
    </AuthContext.Provider>
  );
}
