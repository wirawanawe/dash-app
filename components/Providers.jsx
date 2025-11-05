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

  // Stateless authentication - no session tracking on client

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
    if (!mounted) return;
    
    // Sync when user navigates to a new page
    syncOnNavigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, mounted]);

  // No session timeout - stateless server, only JWT token authentication

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
