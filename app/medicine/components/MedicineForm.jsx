"use client";

import { useState, useEffect } from "react";
import { FaSave, FaPills, FaTimes } from "react-icons/fa";
import { Pill, Building2, Package, DollarSign, Hash } from "lucide-react";

export default function MedicineForm({ 
  clinics = [], 
  onSubmit, 
  loading = false, 
  submitText = "Simpan",
  initialData = null,
  onClose,
  isModal = false
}) {
  const [formData, setFormData] = useState({
    clinic_id: "",
    Detail: "",
    DetailDescription: "",
    HNA: "",
    HNAJual: "",
    SmallUnit: "",
    MediumUnit: "",
    LargeUnit: "",
    factor_3: "1",
    QtyMin: "0",
    KFA_Code: "",
    APLN_Code: "",
    Berlaku: true, // Add status field
  });
  const [errors, setErrors] = useState({});

  // Initialize form with initial data if provided (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        clinic_id: initialData.clinic_id?.toString() || "",
        Detail: initialData.Detail || "",
        DetailDescription: initialData.DetailDescription || "",
        HNA: initialData.HNA?.toString() || "",
        HNAJual: initialData.HNAJual?.toString() || "",
        SmallUnit: initialData.SmallUnit || "",
        MediumUnit: initialData.MediumUnit || "",
        LargeUnit: initialData.LargeUnit || "",
        factor_3: initialData.factor_3?.toString() || "1",
        QtyMin: initialData.QtyMin?.toString() || "0",
        KFA_Code: initialData.KFA_Code || "",
        APLN_Code: initialData.APLN_Code || "",
        Berlaku: initialData.Berlaku || true, // Initialize status
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clinic_id) {
      newErrors.clinic_id = "Klinik harus dipilih";
    }

    if (!formData.Detail.trim()) {
      newErrors.Detail = "Nama obat harus diisi";
    }

    if (formData.HNA && isNaN(parseFloat(formData.HNA))) {
      newErrors.HNA = "HNA harus berupa angka";
    }

    if (formData.HNAJual && isNaN(parseFloat(formData.HNAJual))) {
      newErrors.HNAJual = "HNA Jual harus berupa angka";
    }

    if (formData.factor_3 && isNaN(parseFloat(formData.factor_3))) {
      newErrors.factor_3 = "Factor harus berupa angka";
    }

    if (formData.QtyMin && isNaN(parseInt(formData.QtyMin))) {
      newErrors.QtyMin = "Qty Min harus berupa angka";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      clinic_id: parseInt(formData.clinic_id),
      HNA: parseFloat(formData.HNA) || 0,
      HNAJual: parseFloat(formData.HNAJual) || 0,
      factor_3: parseFloat(formData.factor_3) || 1,
      QtyMin: parseInt(formData.QtyMin) || 0,
      Berlaku: formData.Berlaku, // Include status in submission
    };

    onSubmit(submitData);
  };

  const handleInputChange = (e) => {
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

  const formatCurrency = (value) => {
    if (!value) return "";
    const number = parseFloat(value);
    if (isNaN(number)) return value;
    return number.toLocaleString('id-ID');
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^\d]/g, '');
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Clinic Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            Klinik *
          </div>
        </label>
        <select
          name="clinic_id"
          value={formData.clinic_id}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            errors.clinic_id ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading}
        >
          <option value="">Pilih Klinik</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
        {errors.clinic_id && (
          <p className="mt-1 text-sm text-red-600">{errors.clinic_id}</p>
        )}
      </div>

      {/* Medicine Name and Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <Pill className="h-4 w-4 mr-2" />
              Nama Obat *
            </div>
          </label>
          <input
            type="text"
            name="Detail"
            value={formData.Detail}
            onChange={handleInputChange}
            placeholder="Contoh: Paracetamol 500mg"
            className={`w-full px-3 py-2 border text-black rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.Detail ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.Detail && (
            <p className="mt-1 text-sm text-red-600">{errors.Detail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi
          </label>
          <input
            type="text"
            name="DetailDescription"
            value={formData.DetailDescription}
            onChange={handleInputChange}
            placeholder="Deskripsi obat"
            className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              HNA (Harga Netto)
            </div>
          </label>
          <input
            type="text"
            name="HNA"
            value={formatCurrency(formData.HNA)}
            onChange={handleCurrencyChange}
            placeholder="0"
            className={`w-full px-3 py-2 border text-black rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.HNA ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.HNA && (
            <p className="mt-1 text-sm text-red-600">{errors.HNA}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              HNA Jual
            </div>
          </label>
          <input
            type="text"
            name="HNAJual"
            value={formatCurrency(formData.HNAJual)}
            onChange={handleCurrencyChange}
            placeholder="0"
            className={`w-full px-3 py-2 border text-black rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.HNAJual ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.HNAJual && (
            <p className="mt-1 text-sm text-red-600">{errors.HNAJual}</p>
          )}
        </div>
      </div>

      {/* Units */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Satuan Kecil
            </div>
          </label>
          <input
            type="text"
            name="SmallUnit"
            value={formData.SmallUnit}
            onChange={handleInputChange}
            placeholder="Contoh: Tablet"
            className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Satuan Sedang
          </label>
          <input
            type="text"
            name="MediumUnit"
            value={formData.MediumUnit}
            onChange={handleInputChange}
            placeholder="Contoh: Strip"
            className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Satuan Besar
          </label>
          <input
            type="text"
            name="LargeUnit"
            value={formData.LargeUnit}
            onChange={handleInputChange}
            placeholder="Contoh: Box"
            className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>
      </div>

      {/* Factor and Qty Min */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Factor Konversi
          </label>
          <input
            type="number"
            name="factor_3"
            value={formData.factor_3}
            onChange={handleInputChange}
            placeholder="1"
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border text-black rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.factor_3 ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.factor_3 && (
            <p className="mt-1 text-sm text-red-600">{errors.factor_3}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qty Minimum
          </label>
          <input
            type="number"
            name="QtyMin"
            value={formData.QtyMin}
            onChange={handleInputChange}
            placeholder="0"
            min="0"
            className={`w-full px-3 py-2 border text-black rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.QtyMin ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.QtyMin && (
            <p className="mt-1 text-sm text-red-600">{errors.QtyMin}</p>
          )}
        </div>
      </div>

      {/* Codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              Kode KFA
            </div>
          </label>
          <input
            type="text"
            name="KFA_Code"
            value={formData.KFA_Code}
            onChange={handleInputChange}
            placeholder="Kode KFA"
            className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              Kode APLN
            </div>
          </label>
          <input
            type="text"
            name="APLN_Code"
            value={formData.APLN_Code}
            onChange={handleInputChange}
            placeholder="Kode APLN"
            className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>
      </div>

      {/* Status Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status Obat
          </label>
          <p className="text-xs text-gray-500">
            Obat aktif dapat digunakan dalam transaksi
          </p>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="Berlaku"
            checked={formData.Berlaku}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={loading}
          />
          <span className="ml-2 text-sm font-medium text-gray-700">
            {formData.Berlaku ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Menyimpan...
            </>
          ) : (
            <>
              <FaSave className="h-4 w-4 mr-2" />
              {submitText}
            </>
          )}
        </button>
      </div>
    </form>
  );

  // If it's a modal, wrap in modal structure
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <FaPills className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {initialData ? 'Edit Obat' : 'Tambah Obat Baru'}
                </h3>
                <p className="text-sm text-gray-500">
                  {initialData ? 'Perbarui informasi obat' : 'Masukkan informasi obat baru'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>

          {formContent}
        </div>
      </div>
    );
  }

  // Return just the form content for non-modal usage
  return formContent;
} 