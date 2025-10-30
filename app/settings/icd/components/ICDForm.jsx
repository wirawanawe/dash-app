"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function ICDForm({ icd, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    disease: "",
    description: "",
    status: "Aktif",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (icd) {
      setFormData({
        name: icd.name || "",
        disease: icd.disease || "",
        description: icd.description || "",
        status: icd.status || "Aktif",
      });
    }
  }, [icd]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Kode ICD harus diisi";
    }

    if (!formData.disease.trim()) {
      newErrors.disease = "Nama penyakit harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const url = icd ? `/api/settings/icd/${icd.id}` : "/api/settings/icd";
      const method = icd ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menyimpan data");
      }

      toast.success(icd ? "ICD berhasil diupdate" : "ICD berhasil ditambahkan");
      onSubmit();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Gagal menyimpan data ICD");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h2 className="text-xl text-black font-bold mb-4">
        {icd ? "Edit ICD" : "Tambah ICD"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Kode ICD
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345] ${
                errors.name ? "border-red-500" : ""
              }`}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Disease
            </label>
            <input
              type="text"
              name="disease"
              value={formData.disease}
              onChange={handleChange}
              className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345] ${
                errors.disease ? "border-red-500" : ""
              }`}
              required
            />
            {errors.disease && (
              <p className="mt-1 text-sm text-red-500">{errors.disease}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-black mb-2">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            >
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border text-black rounded-lg hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400"
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
