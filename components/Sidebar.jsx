import React, { useState } from "react";
import Link from "next/link";
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
} from "react-icons/fa";
import { useAuth } from "./Providers";

const Sidebar = () => {
  const { user } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const menuItems = [
    {
      title: "Dashboard",
      icon: <FaHome />,
      path: "/dashboard",
    },
    {
      section: "Pelayanan Medis",
      items: [
        {
          title: "Kunjungan",
          icon: <FaCalendarCheck />,
          path: "/visits",
          roles: ["ADMIN", "DOCTOR"],
        },
        {
          title: "Pemeriksaan",
          icon: <FaStethoscope />,
          path: "/examinations",
          roles: ["DOCTOR"],
        },
      ],
    },
    {
      title: "Pasien",
      icon: <FaUserInjured />,
      path: "/patients",
    },
    {
      title: "Dokter",
      icon: <FaUserMd />,
      path: "/doctors",
    },
    {
      title: "Klinik",
      icon: <FaClinicMedical />,
      path: "/clinics",
    },
    (user?.role === "ADMIN" || user?.role === "admin") && {
      title: "Pengguna",
      icon: <FaUsers />,
      path: "/users",
    },
    user?.role === "ADMIN" && {
      title: "Settings",
      icon: <FaCog />,
      path: "/settings",
    },
    user?.role === "PHARMACIST" && {
      title: "Farmasi",
      icon: <FaPills />,
      path: "/pharmacy",
    },
    {
      title: "Laboratorium",
      icon: <FaFlask />,
      submenu: [
        {
          title: "Hasil Laboratorium",
          path: "/laboratory/results",
        },
      ],
    },
  ].filter(Boolean);

  const toggleSubmenu = (title) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  return (
    <div className="bg-[#E22345] text-white w-64 min-h-screen fixed left-0">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <ul>
          {menuItems.map((item, index) => (
            <li key={index} className="mb-4">
              {item.section ? (
                <>
                  <div className="text-sm font-semibold mb-2 px-2 text-gray-300">
                    {item.section}
                  </div>
                  <ul className="ml-2">
                    {item.items.map((subItem, subIndex) => (
                      <li key={subIndex} className="mb-2">
                        <Link
                          href={subItem.path}
                          className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <span className="mr-3">{subItem.icon}</span>
                          <span>{subItem.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.title}</span>
                    </div>
                    <span>
                      {openSubmenu === item.title ? (
                        <FaChevronUp size={12} />
                      ) : (
                        <FaChevronDown size={12} />
                      )}
                    </span>
                  </button>
                  {openSubmenu === item.title && (
                    <ul className="ml-8 mt-2">
                      {item.submenu.map((subItem, subIndex) => (
                        <li key={subIndex} className="mb-2">
                          <Link
                            href={subItem.path}
                            className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.path}
                  className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
