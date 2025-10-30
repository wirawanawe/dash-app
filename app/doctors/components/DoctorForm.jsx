"use client";

import { useState, useEffect } from "react";

export default function DoctorForm({ doctor, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    specialist: "",
    license_number: "",
    phone: "",
    email: "",
    address: "",
    clinic_id: "",
    polyclinic_id: "",
  });
  const [errors, setErrors] = useState({});
  const [clinics, setClinics] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClinics();
    fetchPolyclinics();
  }, []);

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || "",
        specialist: doctor.specialist || "",
        license_number: doctor.license_number || "",
        phone: doctor.phone || "",
        email: doctor.email || "",
        address: doctor.address || "",
        clinic_id: doctor.clinic_id || "",
        polyclinic_id: doctor.polyclinic_id || "",
      });
    }
  }, [doctor]);

  const fetchClinics = async () => {
    try {
      const response = await fetch("/api/clinics");
      if (response.ok) {
        const result = await response.json();
        // The clinics API returns data in a nested structure
        setClinics(result.data || result);
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
    }
  };

  const fetchPolyclinics = async () => {
    try {
      const response = await fetch("/api/master/polyclinics");
      if (response.ok) {
        const data = await response.json();
        setPolyclinics(data);
      }
    } catch (error) {
      console.error("Error fetching polyclinics:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when field is edited
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
      newErrors.name = "Nama dokter harus diisi";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold mb-4 text-black">
        {doctor ? "Edit Dokter" : "Tambah Dokter Baru"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nama Dokter <span className="text-red-500">*</span>
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
              placeholder="Masukkan nama dokter"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="specialist"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Spesialis
            </label>
            <input
              type="text"
              id="specialist"
              name="specialist"
              value={formData.specialist}
              onChange={handleChange}
              className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.specialist ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan spesialisasi"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="license_number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nomor SIP
            </label>
            <input
              type="text"
              id="license_number"
              name="license_number"
              value={formData.license_number}
              onChange={handleChange}
              className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.license_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan nomor SIP"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Telepon
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan nomor telepon"
            />
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
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-4 md:col-span-2">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Alamat
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md"
            ></textarea>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Dokter */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Dokter <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Masukkan nama lengkap dokter"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Spesialisasi */}
            <div>
              <label htmlFor="specialist" className="block text-sm font-medium text-gray-700 mb-2">
                Spesialisasi
              </label>
              <input
                type="text"
                id="specialist"
                name="specialist"
                value={formData.specialist}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Contoh: Dokter Umum, Kardiologi, dll"
              />
            </div>

            {/* Nomor SIP */}
            <div>
              <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor SIP
              </label>
              <input
                type="text"
                id="license_number"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Contoh: SP.U-001"
              />
            </div>

            {/* Klinik */}
            <div>
              <label htmlFor="clinic_id" className="block text-sm font-medium text-gray-700 mb-2">
                Klinik
              </label>
              <select
                id="clinic_id"
                name="clinic_id"
                value={formData.clinic_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="">Pilih Klinik</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Poli */}
            <div>
              <label htmlFor="polyclinic_id" className="block text-sm font-medium text-gray-700 mb-2">
                Poli
              </label>
              <select
                id="polyclinic_id"
                name="polyclinic_id"
                value={formData.polyclinic_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="">Pilih Poli</option>
                {polyclinics.map((polyclinic) => (
                  <option key={polyclinic.id} value={polyclinic.id}>
                    {polyclinic.name} ({polyclinic.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Telepon */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telepon
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Contoh: 081234567890"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Contoh: dokter@phc.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Alamat */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Alamat
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                placeholder="Masukkan alamat lengkap dokter"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              disabled={isLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                doctor ? "Update Dokter" : "Simpan Dokter"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
