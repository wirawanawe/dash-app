import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaCalendarCheck,
  FaStethoscope,
  FaHome,
  FaUserInjured,
  FaCog,
  FaPills,
  FaFlask,
  FaChevronDown,
  FaChevronUp,
  FaUsers,
  FaUserMd,
  FaClinicMedical,
  FaMobile,
  FaComments,
  FaCrown,
  FaUserTie,
  FaUser,
  FaUserGraduate,
  FaTimes,
} from "react-icons/fa";
import { FaShield } from "react-icons/fa6";
import { useAuth } from "./Providers";

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});

  // Fetch user permissions on mount
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch('/api/auth/permissions');
        if (response.ok) {
          const data = await response.json();
          setUserPermissions(data);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    fetchPermissions();
  }, [user]);

  // Check if user has permission to access a menu
  const hasPermission = (menuKey) => {
    // If no permissions set, show all menus (backward compatibility)
    if (Object.keys(userPermissions).length === 0) {
      return true;
    }
    
    return userPermissions[menuKey] === true;
  };

  const getRoleIcon = (role) => {
    switch (role?.toUpperCase()) {
      case "SUPERADMIN":
        return <FaCrown className="text-yellow-400" />;
      case "ADMIN":
        return <FaShield className="text-blue-400" />;
      case "DOCTOR":
        return <FaUserMd className="text-green-400" />;
      case "STAFF":
        return <FaUserGraduate className="text-purple-400" />;
      default:
        return <FaUser className="text-gray-400" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toUpperCase()) {
      case "SUPERADMIN":
        return "text-yellow-400";
      case "ADMIN":
        return "text-blue-400";
      case "DOCTOR":
        return "text-green-400";
      case "STAFF":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: <FaHome />,
      path: "/dashboard",
      menuKey: "dashboard",
    },
    {
      section: "Pelayanan Medis",
      items: [
        {
          title: "Kunjungan",
          icon: <FaCalendarCheck />,
          path: "/visits",
          menuKey: "visits",
        },
        {
          title: "Pemeriksaan",
          icon: <FaStethoscope />,
          path: "/examinations",
          menuKey: "examinations",
        },
        {
          title: "Chat Konsultasi",
          icon: <FaComments />,
          path: "/chat",
          menuKey: "chat",
        },
      ],
    },
    {
      title: "Pasien",
      icon: <FaUserInjured />,
      path: "/patients",
      menuKey: "patients",
    },
    {
      title: "Dokter",
      icon: <FaUserMd />,
      path: "/doctors",
      menuKey: "doctors",
    },
    {
      title: "Klinik",
      icon: <FaClinicMedical />,
      path: "/clinics",
      menuKey: "clinics",
    },
    {
      title: "Obat",
      icon: <FaPills />,
      path: "/medicine",
      menuKey: "medicine",
    },
    {
      title: "Mobile App",
      icon: <FaMobile />,
      path: "/mobile",
      menuKey: "mobile",
    },
    {
      title: "Pengguna",
      icon: <FaUsers />,
      path: "/users",
      menuKey: "users",
    },
    {
      title: "Settings",
      icon: <FaCog />,
      path: "/settings",
      menuKey: "settings",
    },
    {
      title: "Laboratorium",
      icon: <FaFlask />,
      submenu: [
        {
          title: "Hasil Laboratorium",
          path: "/laboratory/results",
          menuKey: "laboratory",
        },
      ],
      menuKey: "laboratory",
    },
  ].filter(Boolean);

  const toggleSubmenu = (title) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.map(item => {
    if (item.section) {
      return {
        ...item,
        items: item.items.filter(subItem => 
          hasPermission(subItem.menuKey)
        )
      };
    }
    return item;
  }).filter(item => {
    if (item.section) {
      return item.items.length > 0;
    }
    return hasPermission(item.menuKey);
  });

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-[#E22345] text-white w-64 h-screen fixed left-0 top-0 overflow-hidden shadow-2xl">
      <div className="p-4 h-full flex flex-col">
        {/* Enhanced Mobile Header with better touch targets */}
        <div className="flex items-center justify-between mb-6 lg:hidden flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold">Admin Panel</h2>
          <button
            onClick={onClose}
            className="p-3 text-white hover:bg-white/10 rounded-lg transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop Header */}
        <h2 className="text-xl sm:text-2xl font-bold mb-6 lg:mb-8 hidden lg:block flex-shrink-0">Admin Panel</h2>
        
        {/* Enhanced User Info with better mobile layout */}
        <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20 flex-shrink-0">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              {getRoleIcon(user?.role)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <div className="flex items-center">
                <span className={`text-xs font-medium ${getRoleColor(user?.role)} capitalize`}>
                  {user?.role?.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Role Permissions Info - Hidden on very small screens */}
          <div className="text-xs text-gray-300 space-y-1 hidden sm:block">
            {user?.role === "SUPERADMIN" && (
              <p>✓ Akses penuh ke semua fitur</p>
            )}
            {user?.role === "ADMIN" && (
              <p>✓ Admin untuk klinik tertentu</p>
            )}
            {user?.role === "DOCTOR" && (
              <p>✓ Dokter dengan akses terbatas</p>
            )}
            {user?.role === "STAFF" && (
              <p>✓ Staff dengan akses minimal</p>
            )}
          </div>
        </div>

        {/* Navigation Menu - Scrollable with enhanced touch targets */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar">
          <ul className="space-y-1 sm:space-y-2">
            {filteredMenuItems.map((item, index) => (
              <li key={index}>
                {item.section ? (
                  <>
                    <div className="text-xs sm:text-sm font-semibold mb-2 px-2 text-gray-300">
                      {item.section}
                    </div>
                    <ul className="ml-2 space-y-1">
                      {item.items.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link
                            href={subItem.path}
                            onClick={handleLinkClick}
                            className="flex items-center p-3 sm:p-3 rounded-lg hover:bg-white/10 transition-colors text-sm touch-manipulation min-h-[48px]"
                          >
                            <span className="mr-3 flex-shrink-0">{subItem.icon}</span>
                            <span className="truncate">{subItem.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className="w-full flex items-center justify-between p-3 sm:p-3 rounded-lg hover:bg-white/10 transition-colors text-sm touch-manipulation min-h-[48px]"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <span className="mr-3 flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.title}</span>
                      </div>
                      <span className="flex-shrink-0">
                        {openSubmenu === item.title ? (
                          <FaChevronUp size={12} />
                        ) : (
                          <FaChevronDown size={12} />
                        )}
                      </span>
                    </button>
                    {openSubmenu === item.title && (
                      <ul className="ml-8 mt-2 space-y-1">
                        {item.submenu.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              href={subItem.path}
                              onClick={handleLinkClick}
                              className="flex items-center p-3 sm:p-3 rounded-lg hover:bg-white/10 transition-colors text-sm touch-manipulation min-h-[48px]"
                            >
                              <span className="truncate">{subItem.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.path}
                    onClick={handleLinkClick}
                    className="flex items-center p-3 sm:p-3 rounded-lg hover:bg-white/10 transition-colors text-sm touch-manipulation min-h-[48px]"
                  >
                    <span className="mr-3 flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.title}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
