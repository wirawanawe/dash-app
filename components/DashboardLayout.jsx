"use client";

import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { Menu, X } from "lucide-react";

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
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

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    );
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
      }`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
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
      <div className="flex-1 flex flex-col lg:ml-64 overflow-x-hidden">
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
