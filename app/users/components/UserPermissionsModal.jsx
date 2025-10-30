"use client";

import { useState, useEffect } from "react";
import {
  FaHome,
  FaCalendarCheck,
  FaStethoscope,
  FaComments,
  FaUserInjured,
  FaUserMd,
  FaClinicMedical,
  FaPills,
  FaMobile,
  FaUsers,
  FaCog,
  FaFlask,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import toast from "react-hot-toast";

export default function UserPermissionsModal({ user, onClose, onSaved }) {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Available menu items with icons and descriptions
  const availableMenus = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: FaHome,
      description: "Halaman utama dengan statistik dan ringkasan",
    },
    {
      key: "visits",
      label: "Kunjungan",
      icon: FaCalendarCheck,
      description: "Kelola data kunjungan pasien",
    },
    {
      key: "examinations",
      label: "Pemeriksaan",
      icon: FaStethoscope,
      description: "Data pemeriksaan medis pasien",
    },
    {
      key: "chat",
      label: "Chat Konsultasi",
      icon: FaComments,
      description: "Fitur chat konsultasi dengan dokter",
    },
    {
      key: "patients",
      label: "Pasien",
      icon: FaUserInjured,
      description: "Kelola data pasien",
    },
    {
      key: "doctors",
      label: "Dokter",
      icon: FaUserMd,
      description: "Kelola data dokter",
    },
    {
      key: "clinics",
      label: "Klinik",
      icon: FaClinicMedical,
      description: "Kelola data klinik",
    },
    {
      key: "medicine",
      label: "Obat",
      icon: FaPills,
      description: "Kelola data obat dan farmasi",
    },
    {
      key: "mobile",
      label: "Mobile App",
      icon: FaMobile,
      description: "Kelola konten mobile app",
    },
    {
      key: "users",
      label: "Pengguna",
      icon: FaUsers,
      description: "Kelola pengguna dan hak akses",
    },
    {
      key: "settings",
      label: "Settings",
      icon: FaCog,
      description: "Pengaturan sistem",
    },
    {
      key: "laboratory",
      label: "Laboratorium",
      icon: FaFlask,
      description: "Hasil dan data laboratorium",
    },
  ];

  useEffect(() => {
    fetchPermissions();
  }, [user]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/permissions`);
      
      if (!response.ok) {
        throw new Error("Gagal mengambil data permission");
      }

      const data = await response.json();
      
      // If no permissions set, default all to false
      const defaultPermissions = {};
      availableMenus.forEach(menu => {
        defaultPermissions[menu.key] = data[menu.key] || false;
      });
      
      setPermissions(defaultPermissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Gagal memuat permission");
      
      // Set default empty permissions
      const defaultPermissions = {};
      availableMenus.forEach(menu => {
        defaultPermissions[menu.key] = false;
      });
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (menuKey) => {
    setPermissions(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleSelectAll = () => {
    const newPermissions = {};
    availableMenus.forEach(menu => {
      newPermissions[menu.key] = true;
    });
    setPermissions(newPermissions);
  };

  const handleDeselectAll = () => {
    const newPermissions = {};
    availableMenus.forEach(menu => {
      newPermissions[menu.key] = false;
    });
    setPermissions(newPermissions);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/users/${user.id}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(permissions),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan permission");
      }

      toast.success("Permission berhasil disimpan");
      
      if (onSaved) {
        onSaved();
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Gagal menyimpan permission");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Kelola Akses Menu</h2>
              <p className="text-blue-100">
                Pilih menu yang dapat diakses oleh <span className="font-semibold">{user.name}</span>
              </p>
              <div className="mt-2 inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                {activeCount} dari {availableMenus.length} menu dipilih
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Pilih Semua
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Hapus Semua
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat permission...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableMenus.map((menu) => {
                const Icon = menu.icon;
                const isChecked = permissions[menu.key] || false;
                
                return (
                  <div
                    key={menu.key}
                    onClick={() => handleTogglePermission(menu.key)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isChecked
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(menu.key)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center mb-2">
                          <Icon className={`w-5 h-5 mr-2 ${isChecked ? "text-blue-600" : "text-gray-400"}`} />
                          <h3 className={`font-semibold ${isChecked ? "text-blue-900" : "text-gray-900"}`}>
                            {menu.label}
                          </h3>
                        </div>
                        <p className={`text-sm ${isChecked ? "text-blue-700" : "text-gray-600"}`}>
                          {menu.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            disabled={saving}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Simpan Permission
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

