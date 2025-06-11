"use client";

import { useState, useEffect } from "react";

export default function UserForm({ user, clinics, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    is_active: true,
    clinic_id: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "", // Don't show password in edit mode
        role: user.role?.toLowerCase() || "staff",
        is_active: user.is_active ?? true,
        clinic_id: user.clinic?.id ? user.clinic.id.toString() : "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
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
    if (!formData.name.trim()) {
      newErrors.name = "Nama harus diisi";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email harus diisi";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    // Only validate password for new users
    if (!user && !formData.password) {
      newErrors.password = "Password harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        // If editing and password is empty, don't include it in the request
        ...(user && !formData.password && { password: undefined }),
        clinic_id: formData.clinic_id ? parseInt(formData.clinic_id) : null,
      });
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
              className={`w-full p-2 text-black border rounded-md ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
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
              className={`w-full p-2 text-black border rounded-md ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
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
                className={`w-full p-2 text-black border rounded-md ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
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
              <option value="admin">Admin</option>
              <option value="doctor">Dokter</option>
              <option value="staff">Staff</option>
            </select>
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
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id.toString()}>
                  {clinic.name} ({clinic.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === "admin"
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
            className="px-4 py-2 bg-[#E22345] text-white rounded-md hover:bg-red-600"
          >
            {user ? "Update" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
