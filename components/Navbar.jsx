"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "./Providers";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaCaretDown,
  FaBars,
  FaBell,
  FaSignOutAlt,
} from "react-icons/fa";

const Navbar = ({ onToggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState("");

  // Update username whenever user data changes
  useEffect(() => {
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
  }, [user]);

  // Force refresh user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          // User data will be updated through the Providers context
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

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
      console.error("Logout failed:", error);
    }
  };

  const handleProfileClick = () => {
    router.push("/profile");
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-[#E22345] shadow-lg border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section - Mobile menu button */}
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-md text-white hover:text-gray-900 hover:bg-gray-100"
            >
              <FaBars className="h-5 w-5" />
            </button>
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-white">
                PHC Dashboard
              </h1>
            </div>
          </div>

          {/* Right section - User menu */}
          <div className="flex items-center space-x-4">
            {/* Notification icon */}
            <button className="p-2 rounded-full text-white hover:text-gray-900 hover:bg-gray-100">
              <FaBell className="h-5 w-5" />
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#E22345] font-medium">
                    {getUserInitial()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-white">
                      {userName}
                    </div>
                    <div className="text-xs text-white">{getUserRole()}</div>
                  </div>
                  <FaCaretDown className="h-3 w-3 text-white" />
                </div>
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#E22345] ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white hover:text-gray-900"
                    >
                      <FaUser className="mr-3 h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white hover:text-gray-900"
                    >
                      <FaSignOutAlt className="mr-3 h-4 w-4" />
                      Logout
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
