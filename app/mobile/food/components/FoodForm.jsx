"use client";

import { useState, useEffect } from "react";
import { X, Utensils, Database, TrendingUp, Activity } from "lucide-react";
import toast from "react-hot-toast";

export default function FoodForm({ food, categories, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    name_indonesian: "",
    category: "",
    calories_per_100g: "",
    protein_per_100g: "",
    carbs_per_100g: "",
    fat_per_100g: "",
    fiber_per_100g: "",
    sugar_per_100g: "",
    sodium_per_100g: "",
    serving_size: "",
    serving_weight: "",
    barcode: "",
    image_url: "",
    is_verified: false,
    source: "manual"
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (food) {
      setFormData({
        name: food.name || "",
        name_indonesian: food.name_indonesian || "",
        category: food.category || "",
        calories_per_100g: food.calories_per_100g || "",
        protein_per_100g: food.protein_per_100g || "",
        carbs_per_100g: food.carbs_per_100g || "",
        fat_per_100g: food.fat_per_100g || "",
        fiber_per_100g: food.fiber_per_100g || "",
        sugar_per_100g: food.sugar_per_100g || "",
        sodium_per_100g: food.sodium_per_100g || "",
        serving_size: food.serving_size || "",
        serving_weight: food.serving_weight || "",
        barcode: food.barcode || "",
        image_url: food.image_url || "",
        is_verified: food.is_verified || false,
        source: food.source || "manual"
      });
    }
  }, [food]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama makanan wajib diisi";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Kategori wajib diisi";
    }

    if (!formData.calories_per_100g || formData.calories_per_100g < 0) {
      newErrors.calories_per_100g = "Kalori per 100g wajib diisi dan tidak boleh negatif";
    }

    // Validate numeric fields
    const numericFields = [
      'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 
      'fat_per_100g', 'fiber_per_100g', 'sugar_per_100g', 
      'sodium_per_100g', 'serving_weight'
    ];

    numericFields.forEach(field => {
      if (formData[field] !== "" && (isNaN(formData[field]) || formData[field] < 0)) {
        newErrors[field] = `${field.replace(/_/g, ' ')} harus berupa angka positif`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = food ? `/api/mobile/food/${food.id}` : "/api/mobile/food";
      const method = food ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        toast.success(data.message || `Makanan berhasil ${food ? 'diperbarui' : 'ditambahkan'}`);
        onSubmit();
      } else {
        const errorMessage = data.message || data.error || `Gagal ${food ? 'memperbarui' : 'menambahkan'} makanan`;
        toast.error(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(`Network error: Gagal ${food ? 'memperbarui' : 'menambahkan'} makanan. Please check your connection.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl text-black font-semibold">
            {food ? "Edit Makanan" : "Tambah Makanan Baru"}
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informasi Dasar</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Makanan *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan nama makanan"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Indonesia
                </label>
                <input
                  type="text"
                  name="name_indonesian"
                  value={formData.name_indonesian}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama dalam bahasa Indonesia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  list="categories"
                  className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan kategori makanan"
                />
                <datalist id="categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Barcode produk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Gambar
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Nutritional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informasi Nutrisi (per 100g)</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kalori *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="calories_per_100g"
                  value={formData.calories_per_100g}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.calories_per_100g ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.calories_per_100g && <p className="text-red-500 text-sm mt-1">{errors.calories_per_100g}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="protein_per_100g"
                    value={formData.protein_per_100g}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Karbohidrat (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="carbs_per_100g"
                    value={formData.carbs_per_100g}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lemak (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="fat_per_100g"
                    value={formData.fat_per_100g}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serat (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="fiber_per_100g"
                    value={formData.fiber_per_100g}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gula (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sugar_per_100g"
                    value={formData.sugar_per_100g}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sodium (mg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sodium_per_100g"
                    value={formData.sodium_per_100g}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ukuran Porsi
                  </label>
                  <input
                    type="text"
                    name="serving_size"
                    value={formData.serving_size}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1 mangkuk"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Berat Porsi (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="serving_weight"
                    value={formData.serving_weight}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="api">API</option>
                    <option value="ai_scan">AI Scan</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    name="is_verified"
                    checked={formData.is_verified}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Data Terverifikasi
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : (food ? "Perbarui" : "Simpan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 