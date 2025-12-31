"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./Providers";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  FaUser,
  FaCaretDown,
  FaBell,
  FaSignOutAlt,
} from "react-icons/fa";

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout, mounted } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const dropdownRef = useRef(null);

  // Update username whenever user data changes
  useEffect(() => {
    if (!mounted) return;

    if (user && typeof user === "object") {
      // Try several possible fields for the name
      const name = user.name || user.FullName || user.fullName || user.username;

      if (name && typeof name === "string" && name.trim() !== "") {
        setUserName(name);
      } else {
        setUserName("User");
      }
    } else {
      setUserName("User");
    }
  }, [user, mounted]);

  // Force refresh user data when component mounts
  useEffect(() => {
    if (!mounted) return;

    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          // User data will be updated through the Providers context
        }
      } catch (error) {

      }
    };

    fetchUserData();
  }, [mounted]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!mounted) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen, mounted]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-800">PHC Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Get user's initial for avatar
  const getUserInitial = () => {
    if (!userName || userName === "User") return "U";
    return userName.charAt(0).toUpperCase();
  };

  // Get user's role display
  const getUserRole = () => {
    if (!user) return "Guest";
    return user.role || "User";
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {

    }
  };

  const handleProfileClick = () => {
    router.push("/profile");
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 lg:h-18">
          {/* Left section - Title with better mobile responsiveness */}
          <div className="flex items-center min-w-0 flex-1 gap-3">
            {/* Mobile Menu Button - Integrated in Navbar */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
              >
                {isSidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
              PHC Dashboard
            </h1>
          </div>

          {/* Right section - User menu with enhanced mobile support */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Notification icon - Enhanced for mobile with better touch targets */}
            

            {/* User dropdown - Enhanced for mobile with better touch targets */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 sm:space-x-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:bg-gray-50 p-2.5 sm:p-3 touch-manipulation min-h-[48px]"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {getUserInitial()}
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate max-w-20 lg:max-w-28 xl:max-w-32">
                      {userName}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-20 lg:max-w-28 xl:max-w-32">{getUserRole()}</div>
                  </div>
                  <FaCaretDown className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Enhanced Dropdown menu with better mobile positioning */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 lg:w-72 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 z-[9999] transition-all duration-200 ease-in-out">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                      <p className="text-sm text-gray-500 truncate">{getUserRole()}</p>
                    </div>
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 touch-manipulation min-h-[48px]"
                    >
                      <FaUser className="mr-3 h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">Profile</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 touch-manipulation min-h-[48px]"
                    >
                      <FaSignOutAlt className="mr-3 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
