"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function PolyclinicForm({ polyclinic, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Aktif",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (polyclinic) {
      setFormData({
        name: polyclinic.name || "",
        description: polyclinic.description || "",
        status: polyclinic.status || "Aktif",
      });
    }
  }, [polyclinic]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Log data yang akan dikirim
      console.log("Sending data:", formData);

      const url = polyclinic
        ? `/api/settings/polyclinics/${polyclinic.id}`
        : "/api/settings/polyclinics";
      const method = polyclinic ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
        }),
      });

      // Log response status
      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.error || "Gagal menyimpan data");
      }

      const result = await response.json();
      console.log("Success response:", result);

      toast.success(
        polyclinic ? "Poli berhasil diupdate" : "Poli berhasil ditambahkan"
      );
      onSubmit();
    } catch (error) {
      console.error("Error details:", error);
      toast.error(error.message || "Gagal menyimpan data poli");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h2 className="text-xl text-black font-bold mb-4">
        {polyclinic ? "Edit Poli" : "Tambah Poli"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Nama
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
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
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
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
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
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
            className="px-4 py-2 text-black border rounded-lg hover:bg-gray-100"
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
