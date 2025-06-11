"use client";

import { useState, useEffect } from "react";

export default function ClinicForm({ clinic, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || "",
        code: clinic.code || "",
        description: clinic.description || "",
      });
    }
  }, [clinic]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
      newErrors.name = "Nama klinik harus diisi";
    }
    if (!formData.code.trim()) {
      newErrors.code = "Kode klinik harus diisi";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold mb-4 text-black">
        {clinic ? "Edit Klinik" : "Tambah Klinik Baru"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nama Klinik
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
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Kode Klinik
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className={`w-full p-2 text-black border rounded-md ${
                errors.code ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.code && (
              <p className="text-red-500 text-xs mt-1">{errors.code}</p>
            )}
          </div>

          <div className="mb-4 md:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 text-black border border-gray-300 rounded-md"
            ></textarea>
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
            {clinic ? "Update" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
