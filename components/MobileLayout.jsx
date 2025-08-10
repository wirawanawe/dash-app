import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./Providers";
import MobileSidebar from "./MobileSidebar";
import { Menu, Bell, User, LogOut, Settings, ChevronDown } from "lucide-react";
import Link from "next/link";

const MobileLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
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
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="lg:ml-80 overflow-visible">
        {/* Enhanced Top Navigation with better mobile support */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            {/* Left side with enhanced mobile menu button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="hidden lg:block">
                <h1 className="text-lg font-semibold text-gray-900">Mobile App Management</h1>
                <p className="text-sm text-gray-500">PHC Healthcare Dashboard</p>
              </div>
            </div>

            {/* Right side with enhanced mobile user menu */}
            <div className="flex items-center space-x-3">
              {/* Enhanced Notifications with better touch targets */}
              <button className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center transition-all duration-200">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Enhanced User Menu with better mobile support */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center space-x-3">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    
                    {/* Enhanced Dropdown Menu */}
                    <div className="relative">
                      <button 
                        onClick={toggleDropdown}
                        className="p-2 text-gray-600 hover:text-gray-900 rounded-lg transition-all duration-200 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Enhanced Dropdown Content with better mobile positioning */}
                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] transition-all duration-200 ease-in-out">
                          <div className="py-1">
                            <Link
                              href="/profile"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 touch-manipulation min-h-[48px]"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <User className="h-4 w-4 mr-3" />
                              Profile
                            </Link>
                            <Link
                              href="/settings"
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 touch-manipulation min-h-[48px]"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <Settings className="h-4 w-4 mr-3" />
                              Settings
                            </Link>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                handleLogout();
                                setIsDropdownOpen(false);
                              }}
                              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 touch-manipulation min-h-[48px]"
                            >
                              <LogOut className="h-4 w-4 mr-3" />
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Page Content with better mobile spacing */}
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MobileLayout; 