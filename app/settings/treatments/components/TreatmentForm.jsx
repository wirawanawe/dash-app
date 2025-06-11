"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function TreatmentForm({ treatment, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    status: "Aktif",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (treatment) {
      setFormData({
        name: treatment.name || "",
        description: treatment.description || "",
        price: treatment.price?.toString() || "",
        status: treatment.status || "Aktif",
      });
    }
  }, [treatment]);

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
      const url = treatment
        ? `/api/settings/treatments/${treatment.id}`
        : "/api/settings/treatments";
      const method = treatment ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      if (!response.ok) throw new Error("Gagal menyimpan data");

      toast.success(
        treatment
          ? "Tindakan berhasil diupdate"
          : "Tindakan berhasil ditambahkan"
      );
      onSubmit();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal menyimpan data tindakan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h2 className="text-xl text-black font-bold mb-4">
        {treatment ? "Edit Tindakan" : "Tambah Tindakan"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Nama Tindakan
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
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
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Tarif
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
              min="0"
              step="1000"
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
