"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/Providers";
import toast from "react-hot-toast";

export default function UserForm({ user, clinics, onSubmit, onCancel }) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    is_active: true,
    clinic_id: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Log clinics prop for debugging

  useEffect(() => {
    if (user) {

      const newFormData = {
        name: user.name || "",
        email: user.email || "",
        password: "", // Don't show password in edit mode
        role: user.role ? user.role.toLowerCase() : "staff",
        is_active: user.is_active ?? true,
        clinic_id: user.clinic_id ? user.clinic_id.toString() : (user.clinic?.id ? user.clinic.id.toString() : ""),
      };

      setFormData(newFormData);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = "Nama harus diisi";

    }
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = "Email harus diisi";

    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";

    }

    // Only validate password for new users
    if (!user && !formData.password) {
      newErrors.password = "Password harus diisi";

    }
    
    // For existing users, if password is provided, it should be at least 6 characters
    if (user && formData.password && formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form first
    if (!validateForm()) {

      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      // Ensure fields are not empty strings
      const name = (formData.name || "").trim();
      const email = (formData.email || "").trim();
      
      if (!name || !email) {
        toast.error("Nama dan Email harus diisi");
        setIsLoading(false);
        return;
      }

      const submitData = {
        name: name,
        email: email,
        role: formData.role || "staff",
        clinic_id: formData.clinic_id ? parseInt(formData.clinic_id) : null,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
      };

      // Only include password if it's provided
      if (formData.password && formData.password.trim()) {
        submitData.password = formData.password;
      }

      const url = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Gagal menyimpan data");
      }

      const result = await response.json();

      toast.success(
        user ? "User berhasil diupdate" : "User berhasil ditambahkan"
      );
      
      // Call onSubmit callback to signal success (no params to avoid double submit)
      if (onSubmit) {
        onSubmit();
      }
      
      // Close modal
      if (onCancel) {
        onCancel();
      }
    } catch (error) {

      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold mb-4 text-black">
        {user ? "Edit Pengguna" : "Tambah Pengguna Baru"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nama Lengkap
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan nama lengkap"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password {user && "(Kosongkan jika tidak ingin mengubah)"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Masukkan password"
              />
              <button
                type="button"
                className="absolute right-2 top-2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 text-black border border-gray-300 rounded-md"
            >
              {currentUser?.role?.toLowerCase() === "superadmin" ? (
                <>
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Admin</option>
                  <option value="doctor">Dokter</option>
                  <option value="staff">Staff</option>
                </>
              ) : currentUser?.role?.toLowerCase() === "admin" ? (
                <>
                  <option value="admin">Admin</option>
                  <option value="doctor">Dokter</option>
                  <option value="staff">Staff</option>
                </>
              ) : (
                <>
                  <option value="doctor">Dokter</option>
                  <option value="staff">Staff</option>
                </>
              )}
            </select>
            {currentUser?.role?.toLowerCase() !== "superadmin" && (
              <p className="text-xs text-gray-500 mt-1">
                Hanya Superadmin yang dapat mengatur role Superadmin
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="clinic_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Klinik
            </label>
            <select
              id="clinic_id"
              name="clinic_id"
              value={formData.clinic_id}
              onChange={handleChange}
              className="w-full p-2 text-black border border-gray-300 rounded-md"
            >
              <option value="">-- Pilih Klinik --</option>
              {clinics && Array.isArray(clinics) && clinics.length > 0 ? (
                clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id.toString()}>
                    {clinic.name} ({clinic.code})
                  </option>
                ))
              ) : (
                <option value="" disabled>Tidak ada klinik tersedia</option>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === "admin" || formData.role === "superadmin"
                ? "Admin dapat melihat semua klinik tanpa perlu memilih klinik tertentu"
                : "Staff harus dipilihkan klinik untuk membatasi akses data"}
            </p>
          </div>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="mr-2"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-gray-700"
            >
              Aktif
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-md transition-colors ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#E22345] hover:bg-red-600'
            } text-white`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {user ? "Updating..." : "Saving..."}
              </span>
            ) : (
              user ? "Update" : "Simpan"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
