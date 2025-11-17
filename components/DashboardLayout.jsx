"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { Menu, X } from "lucide-react";
import { useAuth } from "./Providers";

const DashboardLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const loginHref = useMemo(() => {
    if (!pathname || pathname === "/login") {
      return "/login";
    }
    const params = new URLSearchParams({ redirect: pathname });
    return `/login?${params.toString()}`;
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;

    // Only redirect if we're sure user is not authenticated
    // Give auth check time to complete (wait for loading to finish)
    // Don't redirect immediately - allow time for token verification
    if (!loading && !user && !redirecting) {
      // Add a small delay to allow auth check to complete
      // This prevents race conditions where auth is still checking
      const timeoutId = setTimeout(() => {
        setRedirecting(true);
        router.replace(loginHref);
      }, 1000); // 1 second delay to allow auth check to complete

      return () => clearTimeout(timeoutId);
    }
    
    // Reset redirecting flag if user becomes available
    if (user && redirecting) {
      setRedirecting(false);
    }
  }, [loading, user, router, loginHref, mounted, redirecting]);

  // Mark as mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle responsive behavior with improved breakpoints
  useEffect(() => {
    if (!mounted) return;
    
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768); // md breakpoint
      setIsTablet(width >= 768 && width < 1024); // lg breakpoint
      
      // Auto-close sidebar on larger screens
      if (width >= 1024) { // lg breakpoint
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted]);

  // Load persisted collapsed state
  useEffect(() => {
    if (!mounted) return;
    
    try {
      const stored = localStorage.getItem('sidebar:collapsed');
      if (stored !== null) {
        setIsSidebarCollapsed(stored === '1');
      }
    } catch (_) {
      // ignore
    }
  }, [mounted]);

  // Persist collapsed state
  useEffect(() => {
    if (!mounted) return;
    
    try {
      localStorage.setItem('sidebar:collapsed', isSidebarCollapsed ? '1' : '0');
    } catch (_) {
      // ignore
    }
  }, [isSidebarCollapsed, mounted]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!mounted) return;
    
    const handleClickOutside = (event) => {
      if (isMobile && isSidebarOpen && 
          !event.target.closest('.sidebar-container') && 
          !event.target.closest('.mobile-menu-button')) {
        setIsSidebarOpen(false);
      }
    };

    if (isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, isSidebarOpen, mounted]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (!mounted) return;
    
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isSidebarOpen, mounted]);

  if (!mounted || loading || (!user && redirecting)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center space-y-3 text-gray-600">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-x-hidden dashboard-container">
      {/* Enhanced Mobile Menu Button - Better positioning and touch targets */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="mobile-menu-button fixed top-4 left-4 z-50 md:hidden p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
        aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
      >
        {isSidebarOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Enhanced Sidebar with better mobile support - FIXED POSITION */}
      <div className={`sidebar-container fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar 
          onClose={() => setIsSidebarOpen(false)} 
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* Enhanced Backdrop for mobile/tablet with better z-index */}
      {isSidebarOpen && (isMobile || isTablet) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Main Content - Enhanced responsive padding and spacing */}
      <div className={`flex-1 flex flex-col overflow-x-hidden ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-16 sm:pb-20 lg:pb-28">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
