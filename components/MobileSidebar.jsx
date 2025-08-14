import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Utensils,
  Target,
  Activity,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Smartphone,
  Database,
  BarChart3,
  Heart,
  Clock,
  Award,
  MessageSquare,
  BookOpen,
  Newspaper,
  Calculator
} from "lucide-react";

const MobileSidebar = ({ isOpen, onClose }) => {
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

  const menuItems = [
    {
      title: "Dashboard Mobile",
      icon: <Home className="h-5 w-5" />,
      path: "/mobile",
      description: "Overview dan statistik utama"
    },
    {
      section: "User Management",
      items: [
        {
          title: "Mobile Users",
          icon: <Users className="h-5 w-5" />,
          path: "/mobile/users",
          description: "Kelola pengguna aplikasi mobile"
        }
      ]
    },
    {
      section: "Content Management",
      items: [
        {
          title: "Database Makanan",
          icon: <Utensils className="h-5 w-5" />,
          path: "/mobile/food",
          description: "Kelola database makanan dan nutrisi"
        },
        {
          title: "Sistem Misi",
          icon: <Target className="h-5 w-5" />,
          path: "/mobile/missions",
          description: "Kelola misi dan reward untuk user"
        },
        {
          title: "Activities",
          icon: <Activity className="h-5 w-5" />,
          path: "/mobile/activities",
          description: "Kelola aktivitas wellness"
        }
      ]
    },
    {
      section: "User Data & Tracking",
      items: [
        {
          title: "User Missions",
          icon: <Target className="h-5 w-5" />,
          path: "/mobile/user_missions",
          description: "Misi yang diambil user"
        },
        {
          title: "Wellness Progress",
          icon: <BarChart3 className="h-5 w-5" />,
          path: "/mobile/wellness-progress",
          description: "Pantau progress program wellness"
        },
        {
          title: "Health Data",
          icon: <Heart className="h-5 w-5" />,
          path: "/mobile/health_data",
          description: "Data kesehatan pengguna"
        },
        {
          title: "Sleep Tracking",
          icon: <Clock className="h-5 w-5" />,
          path: "/mobile/sleep_tracking",
          description: "Tracking tidur pengguna"
        },
        {
          title: "Mood Tracking",
          icon: <Award className="h-5 w-5" />,
          path: "/mobile/mood_tracking",
          description: "Tracking mood pengguna"
        }
      ]
    },
    {
      section: "Coming Soon",
      items: [
        {
          title: "Chat & Support",
          icon: <MessageSquare className="h-5 w-5" />,
          path: "/mobile/chat",
          description: "Chat dan dukungan pengguna",
          comingSoon: true
        },
        {
          title: "Education Center",
          icon: <BookOpen className="h-5 w-5" />,
          path: "/mobile/education",
          description: "Pusat edukasi kesehatan",
          comingSoon: true
        },
        {
          title: "News & Updates",
          icon: <Newspaper className="h-5 w-5" />,
          path: "/mobile/news",
          description: "Berita dan update terbaru",
          comingSoon: true
        },
        {
          title: "Health Calculator",
          icon: <Calculator className="h-5 w-5" />,
          path: "/mobile/calculator",
          description: "Kalkulator kesehatan",
          comingSoon: true
        }
      ]
    }
  ];

  const isActive = (path) => {
    return pathname === path;
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {/* Enhanced Backdrop with better mobile support */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Enhanced Sidebar with better mobile support */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] sm:max-w-[320px] bg-white/95 backdrop-blur-md shadow-2xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Enhanced Header with better mobile support */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Mobile App</h2>
                <p className="text-sm text-gray-500">Management Dashboard</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Enhanced Navigation with better mobile support */}
          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
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
                        className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation min-h-[48px] ${
                          isActive(subItem.path)
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        } ${subItem.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className={`mr-3 ${isActive(subItem.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          {subItem.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span>{subItem.title}</span>
                            {subItem.comingSoon && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{subItem.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              }

              return (
                <Link
                  key={index}
                  href={item.path}
                  onClick={handleLinkClick}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation min-h-[48px] ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  } ${item.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className={`mr-3 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span>{item.title}</span>
                      {item.comingSoon && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar; 