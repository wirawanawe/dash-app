"use client";

import { FaTimes, FaEdit, FaPills, FaHospital, FaDollarSign, FaBox, FaHashtag } from "react-icons/fa";
import { Pill, Building2, Package, DollarSign, Hash, Calendar, User } from "lucide-react";

export default function MedicineDetailModal({ medicine, onClose, onEdit }) {
  if (!medicine) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (berlaku) => {
    return berlaku ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (berlaku) => {
    return berlaku ? 'Aktif' : 'Nonaktif';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Detail Obat</h3>
              <p className="text-sm text-gray-500">Informasi lengkap obat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FaPills className="h-4 w-4 mr-2" />
              Informasi Dasar
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Nama Obat
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {medicine.Detail || '-'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Deskripsi
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {medicine.DetailDescription || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Clinic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FaHospital className="h-4 w-4 mr-2" />
              Informasi Klinik
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Klinik
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {medicine.clinic_name || '-'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  ID Klinik
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {medicine.clinic_id || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FaDollarSign className="h-4 w-4 mr-2" />
              Informasi Harga
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  HNA (Harga Netto)
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {formatCurrency(medicine.HNA)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  HNA Jual
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {formatCurrency(medicine.HNAJual)}
                </p>
              </div>
            </div>
          </div>

          {/* Unit Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FaBox className="h-4 w-4 mr-2" />
              Informasi Satuan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Satuan Kecil
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {medicine.SmallUnit || '-'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Satuan Sedang
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {medicine.MediumUnit || '-'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Satuan Besar
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {medicine.LargeUnit || '-'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Factor Konversi
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {medicine.factor_3 || '-'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Qty Minimum
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {medicine.QtyMin || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Codes */}
          {(medicine.KFA_Code || medicine.APLN_Code) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FaHashtag className="h-4 w-4 mr-2" />
                Kode
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicine.KFA_Code && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Kode KFA
                    </label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">
                      {medicine.KFA_Code}
                    </p>
                  </div>
                )}
                {medicine.APLN_Code && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Kode APLN
                    </label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">
                      {medicine.APLN_Code}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status and Audit */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Status & Audit
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(medicine.Berlaku)}`}>
                  {getStatusText(medicine.Berlaku)}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  ID Obat
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {medicine.ElementDetailKey}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Dibuat Oleh
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {medicine.UserIDInput || '-'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Diperbarui Oleh
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {medicine.UserIDModify || '-'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Dibuat Pada
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(medicine.created_at)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Diperbarui Pada
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(medicine.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Tutup
          </button>
          <button
            onClick={onEdit}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaEdit className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
} 