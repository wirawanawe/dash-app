"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Calendar,
  Stethoscope,
  UserMd,
  ClinicMedical,
  Settings,
  Shield,
  UserTie,
  Mobile,
  Flask,
  Comments,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Utensils,
  Target,
  Activity,
  Heart,
  Clock,
  Award,
  MessageSquare,
  BookOpen,
  Newspaper,
  Calculator,
  Database,
  BarChart3
} from "lucide-react";

const MobileNavigation = ({ isOpen, onClose, user }) => {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Close navigation when route changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname, isOpen, onClose]);

  // Prevent body scroll when navigation is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = [
    {
      title: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      path: "/dashboard",
      roles: ["SUPERADMIN", "ADMIN", "DOCTOR", "STAFF"],
    },
    {
      section: "Pelayanan Medis",
      items: [
        {
          title: "Kunjungan",
          icon: <Calendar className="h-5 w-5" />,
          path: "/visits",
          roles: ["SUPERADMIN", "ADMIN", "DOCTOR", "STAFF"],
        },
        {
          title: "Pemeriksaan",
          icon: <Stethoscope className="h-5 w-5" />,
          path: "/examinations",
          roles: ["SUPERADMIN", "DOCTOR"],
        },
        {
          title: "Chat Konsultasi",
          icon: <Comments className="h-5 w-5" />,
          path: "/chat",
          roles: ["SUPERADMIN", "DOCTOR"],
        },
      ],
    },
    {
      title: "Pasien",
      icon: <Users className="h-5 w-5" />,
      path: "/patients",
      roles: ["SUPERADMIN", "ADMIN", "DOCTOR", "STAFF"],
    },
    {
      title: "Dokter",
      icon: <UserMd className="h-5 w-5" />,
      path: "/doctors",
      roles: ["SUPERADMIN", "ADMIN"],
    },
    {
      title: "Klinik",
      icon: <ClinicMedical className="h-5 w-5" />,
      path: "/clinics",
      roles: ["SUPERADMIN", "ADMIN"],
    },
    {
      title: "Mobile App",
      icon: <Mobile className="h-5 w-5" />,
      path: "/mobile",
      submenu: [
        {
          title: "Dashboard Mobile",
          path: "/mobile",
          description: "Overview dan statistik utama",
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Mobile Users",
          path: "/mobile/users",
          description: "Kelola pengguna aplikasi mobile",
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Database Makanan",
          path: "/mobile/food",
          description: "Kelola database makanan dan nutrisi",
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Sistem Misi",
          path: "/mobile/missions",
          description: "Kelola misi dan reward untuk user",
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "User Missions",
          path: "/mobile/user_missions",
          description: "Misi yang diambil user",
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Activities",
          path: "/mobile/activities",
          description: "Kelola aktivitas wellness",
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Wellness Progress",
          path: "/mobile/wellness-progress",
          description: "Pantau progress program wellness",
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Health Data",
          path: "/mobile/health_data",
          description: "Data kesehatan pengguna",
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Sleep Tracking",
          path: "/mobile/sleep_tracking",
          description: "Tracking tidur pengguna",
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Mood Tracking",
          path: "/mobile/mood_tracking",
          description: "Tracking mood pengguna",
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Chat & Support",
          path: "/mobile/chat",
          description: "Chat dan dukungan pengguna",
          comingSoon: true,
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Education Center",
          path: "/mobile/education",
          description: "Pusat edukasi kesehatan",
          comingSoon: true,
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "News & Updates",
          path: "/mobile/news",
          description: "Berita dan update terbaru",
          comingSoon: true,
          roles: ["SUPERADMIN", "ADMIN"],
        },
        {
          title: "Health Calculator",
          path: "/mobile/calculator",
          description: "Kalkulator kesehatan",
          comingSoon: true,
          roles: ["SUPERADMIN", "ADMIN"],
        }
      ],
      roles: ["SUPERADMIN", "ADMIN"],
    },
    {
      title: "Pengguna",
      icon: <Users className="h-5 w-5" />,
      path: "/users",
      roles: ["SUPERADMIN", "ADMIN"],
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      path: "/settings",
      roles: ["SUPERADMIN", "ADMIN"],
    },
    {
      title: "Role Management",
      icon: <Shield className="h-5 w-5" />,
      path: "/role-management",
      roles: ["SUPERADMIN"],
    },
    {
      title: "Role Info",
      icon: <UserTie className="h-5 w-5" />,
      path: "/role-info",
      roles: ["SUPERADMIN"],
    },
    {
      title: "Laboratorium",
      icon: <Flask className="h-5 w-5" />,
      submenu: [
        {
          title: "Hasil Laboratorium",
          path: "/laboratory/results",
          roles: ["SUPERADMIN", "ADMIN", "DOCTOR"],
        },
      ],
      roles: ["SUPERADMIN", "ADMIN", "DOCTOR"],
    },
  ];

  const toggleSubmenu = (title) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  // Filter menu items based on user role
  const filteredMenuItems = menuItems
    .map(item => {
      if (item.section) {
        return {
          ...item,
          items: item.items.filter(subItem => 
            subItem.roles && subItem.roles.includes(user?.role)
          )
        };
      }
      return item;
    })
    .filter(item => {
      if (item.section) {
        return item.items.length > 0;
      }
      return item.roles && item.roles.includes(user?.role);
    });

  const isActive = (path) => {
    return pathname === path;
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Navigation Panel - FIXED POSITION */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Home className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">PHC Dashboard</h2>
                <p className="text-sm text-blue-100">Mobile Navigation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role?.toLowerCase() || 'Guest'}</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu - Scrollable */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
            {filteredMenuItems.map((item, index) => {
              if (item.section) {
                return (
                  <div key={index} className="space-y-2">
                    <div className="px-3 py-2">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {item.section}
                      </h3>
                    </div>
                    {item.items.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.path}
                        onClick={handleLinkClick}
                        className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] ${
                          isActive(subItem.path)
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className={`mr-3 ${isActive(subItem.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          {subItem.icon}
                        </div>
                        <span className="truncate">{subItem.title}</span>
                      </Link>
                    ))}
                  </div>
                );
              }

              if (item.submenu) {
                return (
                  <div key={index}>
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className={`mr-3 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-400'}`}>
                          {item.icon}
                        </div>
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="flex-shrink-0">
                        {openSubmenu === item.title ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                    {openSubmenu === item.title && (
                      <div className="ml-8 mt-2 space-y-1">
                        {item.submenu
                          .filter(subItem => subItem.roles && subItem.roles.includes(user?.role))
                          .map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            href={subItem.path}
                            onClick={handleLinkClick}
                            className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] ${
                              isActive(subItem.path)
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            } ${subItem.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="truncate">{subItem.title}</span>
                                {subItem.comingSoon && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                    Soon
                                  </span>
                                )}
                              </div>
                              {subItem.description && (
                                <p className="text-xs text-gray-500 mt-1 truncate">{subItem.description}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={index}
                  href={item.path}
                  onClick={handleLinkClick}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className={`mr-3 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {item.icon}
                  </div>
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">PHC System</p>
                  <p className="text-xs text-gray-500">Healthcare Management</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <p className="font-semibold text-blue-600">Active</p>
                  <p className="text-gray-500">System</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-green-600">Secure</p>
                  <p className="text-gray-500">Access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation; 