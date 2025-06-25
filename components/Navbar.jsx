"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "./Providers";
import { useRouter } from "next/navigation";
import { FaUser, FaCaretDown, FaBars, FaBell } from "react-icons/fa";

const Navbar = ({ onToggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState("");

  // Update username whenever user data changes
  useEffect(() => {
    console.log("Current user data:", user);

    if (user && typeof user === "object") {
      // Try several possible fields for the name
      const name = user.name || user.FullName || user.fullName || user.username;

      if (name && typeof name === "string" && name.trim() !== "") {
        setUserName(name);
      } else {
        setUserName("User");
        console.warn("User name not found in user object:", user);
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
          console.log("Fetched user data:", data);
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

  return (
    <nav className="bg-[#E22345] shadow-md fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo dan Brand dengan Hamburger Menu */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu untuk Mobile */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-red-600 transition-colors"
            >
              <FaBars className="h-5 w-5 text-white" />
            </button>

            <span className="text-lg lg:text-xl font-semibold text-white">
              Dashboard
            </span>
          </div>

          {/* Menu Kanan */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            <button className="p-2 rounded-full hover:bg-red-600 transition-colors">
              <FaBell className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </button>

            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 text-white bg-red-600 hover:bg-red-700 py-2 px-3 rounded-full focus:outline-none transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex items-center justify-center h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-white text-red-600 font-semibold mr-2">
                    {getUserInitial()}
                  </div>
                  <span className="hidden sm:inline text-sm lg:text-base">
                    {userName || "User"}
                  </span>
                  <FaCaretDown className="ml-2" />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      router.push("/profile");
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <svg
                        className="mr-3 h-5 w-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <p className="text-black">Profile Settings</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <svg
                        className="mr-3 h-5 w-5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <p className="text-black">Logout</p>
                    </div>
                  </button>
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
