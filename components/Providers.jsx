"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { syncOnPageLoad, syncOnNavigation } from "@/utils/syncUtils";

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

      // Even if there's an error, clear the user state and redirect to login
      setUser(null);
      router.push("/login");
    }
  };

  // Check auth on mount and trigger initial sync
  useEffect(() => {
    if (!mounted) return;
    checkAuth();
    
    // Trigger sync on page load/refresh
    syncOnPageLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Trigger sync on page navigation
  useEffect(() => {
    if (!mounted || !user) return;
    
    // Sync when user navigates to a new page
    syncOnNavigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, mounted, user]);

  // Setup activity tracking and session timeout
  useEffect(() => {
    if (!mounted) return;

    // Reset timer a cada atividade
    const resetTimer = () => {
      setLastActivity(Date.now());
    };

    // Event listeners para atividade do usuário
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    // Verificar session timeout a cada 60 segundos
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity >= SESSION_TIMEOUT && user) {
        handleSessionTimeout();
      }
    }, 60000);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

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
