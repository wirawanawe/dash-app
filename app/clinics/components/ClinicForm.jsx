"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function ClinicForm({ clinic, onSubmit, onCancel, selectedPolyclinics, onPolyclinicsChange }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    rating: 0,
    total_reviews: 0,
    latitude: "",
    longitude: "",
    operating_hours: {
      monday: { open: "08:00", close: "17:00" },
      tuesday: { open: "08:00", close: "17:00" },
      wednesday: { open: "08:00", close: "17:00" },
      thursday: { open: "08:00", close: "17:00" },
      friday: { open: "08:00", close: "17:00" },
      saturday: { open: "09:00", close: "15:00" },
      sunday: { open: null, close: null },
    },
    description: "",
    image_url: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [polyclinics, setPolyclinics] = useState([]);
  const [localSelectedPolyclinics, setLocalSelectedPolyclinics] = useState(selectedPolyclinics || []);
  const [loadingPolyclinics, setLoadingPolyclinics] = useState(false);

  // Fetch all available polyclinics
  const fetchPolyclinics = async () => {
    try {
      setLoadingPolyclinics(true);
      const response = await fetch('/api/settings/polyclinics');
      if (response.ok) {
        const data = await response.json();
        setPolyclinics(data);
      }
    } catch (error) {

    } finally {
      setLoadingPolyclinics(false);
    }
  };

  // Fetch clinic's polyclinics if editing
  const fetchClinicPolyclinics = async (clinicId) => {
    try {
      const response = await fetch(`/api/settings/clinics/${clinicId}/polyclinics`);
      if (response.ok) {
        const data = await response.json();
        const availablePolyclinics = data.filter(p => p.is_available).map(p => p.id);
        setSelectedPolyclinics(availablePolyclinics);
      }
    } catch (error) {

    }
  };

  useEffect(() => {
    fetchPolyclinics();
  }, []);

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || "",
        address: clinic.address || "",
        city: clinic.city || "",
        phone: clinic.phone || "",
        email: clinic.email || "",
        rating: clinic.rating || 0,
        total_reviews: clinic.total_reviews || 0,
        latitude: clinic.latitude || "",
        longitude: clinic.longitude || "",
        operating_hours: clinic.operating_hours 
          ? (typeof clinic.operating_hours === 'string' 
              ? JSON.parse(clinic.operating_hours) 
              : clinic.operating_hours)
          : {
              monday: { open: "08:00", close: "17:00" },
              tuesday: { open: "08:00", close: "17:00" },
              wednesday: { open: "08:00", close: "17:00" },
              thursday: { open: "08:00", close: "17:00" },
              friday: { open: "08:00", close: "17:00" },
              saturday: { open: "09:00", close: "15:00" },
              sunday: { open: null, close: null },
            },
        description: clinic.description || "",
        image_url: clinic.image_url || "",
        is_active: clinic.is_active !== undefined ? clinic.is_active : true,
      });

              // Fetch clinic's polyclinics
        fetchClinicPolyclinics(clinic.id);
      }
    }, [clinic]);

    // Update local selected polyclinics when prop changes
    useEffect(() => {
      setLocalSelectedPolyclinics(selectedPolyclinics || []);
    }, [selectedPolyclinics]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: {
          ...prev.operating_hours[day],
          [field]: value
        }
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama klinik harus diisi";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Alamat harus diisi";
    }

    if (!formData.city.trim()) {
      newErrors.city = "Kota harus diisi";
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (formData.rating < 0 || formData.rating > 5) {
      newErrors.rating = "Rating harus antara 0-5";
    }

    if (formData.total_reviews < 0) {
      newErrors.total_reviews = "Jumlah ulasan tidak boleh negatif";
    }

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
      // Convert operating_hours to JSON string
      const submitData = {
        ...formData,
        operating_hours: JSON.stringify(formData.operating_hours),
        rating: parseFloat(formData.rating),
        total_reviews: parseInt(formData.total_reviews),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      await onSubmit(submitData);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const days = [
    { key: 'monday', label: 'Senin' },
    { key: 'tuesday', label: 'Selasa' },
    { key: 'wednesday', label: 'Rabu' },
    { key: 'thursday', label: 'Kamis' },
    { key: 'friday', label: 'Jumat' },
    { key: 'saturday', label: 'Sabtu' },
    { key: 'sunday', label: 'Minggu' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl text-black font-semibold">
            {clinic ? 'Edit Klinik' : 'Tambah Klinik Baru'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Klinik *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama klinik"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kota *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan kota"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan alamat lengkap klinik"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nomor telepon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Rating and Reviews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating (0-5)
              </label>
              <input
                type="number"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                min="0"
                max="5"
                step="0.1"
                className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.rating ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {errors.rating && (
                <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Ulasan
              </label>
              <input
                type="number"
                name="total_reviews"
                value={formData.total_reviews}
                onChange={handleChange}
                min="0"
                className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.total_reviews ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.total_reviews && (
                <p className="mt-1 text-sm text-red-600">{errors.total_reviews}</p>
              )}
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="any"
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: -6.2088"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="any"
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: 106.8456"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jam Operasional
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {days.map((day) => (
                <div key={day.key} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">{day.label}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Buka</label>
                      <input
                        type="time"
                        value={formData.operating_hours[day.key]?.open || ""}
                        onChange={(e) => handleOperatingHoursChange(day.key, 'open', e.target.value)}
                        className="w-full px-2 py-1 text-sm border text-black border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tutup</label>
                      <input
                        type="time"
                        value={formData.operating_hours[day.key]?.close || ""}
                        onChange={(e) => handleOperatingHoursChange(day.key, 'close', e.target.value)}
                        className="w-full px-2 py-1 text-sm border text-black border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description and Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan deskripsi klinik"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Gambar
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-black focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Klinik Aktif
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : (clinic ? 'Update Klinik' : 'Buat Klinik')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
