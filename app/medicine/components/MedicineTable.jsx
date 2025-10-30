"use client";

import { useState } from "react";
import Link from "next/link";
import { FaEye, FaEdit, FaTrash, FaCode, FaCapsules } from "react-icons/fa";
import { useAuth } from "@/components/Providers";
import MedicineForm from "./MedicineForm";
import toast from "react-hot-toast";

export default function MedicineTable({ medicines, onRefresh }) {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState(null);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check if user is Superadmin for hard delete access
  const isSuperadmin = user?.role === "SUPERADMIN";

  // Fetch clinics for the edit form
  const fetchClinics = async () => {
    try {
      const response = await fetch('/api/clinics');
      if (response.ok) {
        const result = await response.json();
        setClinics(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const handleShowDetail = (medicine) => {
    setSelectedMedicine(medicine);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedMedicine(null);
  };

  const handleShowEdit = async (medicine) => {
    setSelectedMedicine(medicine);
    await fetchClinics();
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setSelectedMedicine(null);
  };

  const handleEditSubmit = async (medicineData) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/medicine/${selectedMedicine.ElementDetailKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...medicineData,
          UserIDModify: user?.username || 'system'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Obat berhasil diperbarui');
        handleCloseEdit();
        onRefresh();
      } else {
        toast.error(result.message || 'Gagal memperbarui obat');
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
      toast.error('Terjadi kesalahan saat memperbarui obat');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (medicine) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus obat "${medicine.Detail}"?`)) {
      return;
    }

    try {
      setDeletingId(medicine.ElementDetailKey);
      const response = await fetch(`/api/medicine/${medicine.ElementDetailKey}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Obat berhasil dihapus');
        onRefresh(); // Refresh the table
      } else {
        toast.error(result.message || 'Gagal menghapus obat');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error('Terjadi kesalahan saat menghapus obat');
    } finally {
      setDeletingId(null);
    }
  };

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (medicines.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data obat</h3>
        <p className="text-gray-500 mb-6">Mulai dengan menambahkan obat pertama</p>
        <Link
          href="/medicine/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaCapsules className="mr-2" />
          Tambah Obat
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full rounded-xl border border-gray-200 shadow-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Obat
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Klinik
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satuan
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medicines.map((medicine) => (
              <tr key={medicine.ElementDetailKey} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {medicine.Detail}
                    </div>
                    <div className="text-sm text-gray-500">
                      {medicine.DetailDescription}
                    </div>
                    <div className="flex items-center mt-1">
                      <FaCode className="text-xs text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">
                        {medicine.KFA_Code} | {medicine.APLN_Code}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{medicine.clinic_name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div>HNA: Rp {medicine.HNA?.toLocaleString()}</div>
                    <div>Jual: Rp {medicine.HNAJual?.toLocaleString()}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div>{medicine.SmallUnit} / {medicine.MediumUnit}</div>
                    <div className="text-xs text-gray-500">
                      Factor: {medicine.factor_3}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    medicine.Berlaku ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {medicine.Berlaku ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleShowDetail(medicine)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Detail"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleShowEdit(medicine)}
                      disabled={loading}
                      className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                      title="Edit"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(medicine)}
                      disabled={deletingId === medicine.ElementDetailKey}
                      className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                      title="Hapus"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet Table */}
      <div className="hidden md:block lg:hidden overflow-x-auto">
        <table className="w-full rounded-xl border border-gray-200 shadow-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Obat
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Klinik
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medicines.map((medicine) => (
              <tr key={medicine.ElementDetailKey} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {medicine.Detail}
                    </div>
                    <div className="text-xs text-gray-500">
                      {medicine.KFA_Code} | {medicine.APLN_Code}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">{medicine.clinic_name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">
                    <div>Rp {medicine.HNAJual?.toLocaleString()}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    medicine.Berlaku ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {medicine.Berlaku ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleShowDetail(medicine)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Detail"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleShowEdit(medicine)}
                      disabled={loading}
                      className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                      title="Edit"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(medicine)}
                      disabled={deletingId === medicine.ElementDetailKey}
                      className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                      title="Hapus"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {medicines.map((medicine) => (
          <div key={medicine.ElementDetailKey} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <FaCapsules className="text-blue-600 mr-2" />
                  <h3 className="text-sm font-medium text-gray-900">
                    {medicine.Detail}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {medicine.DetailDescription}
                </p>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <FaCode className="mr-1" />
                  <span>{medicine.KFA_Code} | {medicine.APLN_Code}</span>
                </div>
                <div className="text-xs text-gray-600">
                  <div>Klinik: {medicine.clinic_name}</div>
                  <div>HNA: Rp {medicine.HNA?.toLocaleString()}</div>
                  <div>Jual: Rp {medicine.HNAJual?.toLocaleString()}</div>
                  <div>Satuan: {medicine.SmallUnit} / {medicine.MediumUnit}</div>
                </div>
              </div>
              <div className="ml-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  medicine.Berlaku ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {medicine.Berlaku ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleShowDetail(medicine)}
                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                title="Detail"
              >
                <FaEye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleShowEdit(medicine)}
                disabled={loading}
                className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                title="Edit"
              >
                <FaEdit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(medicine)}
                disabled={deletingId === medicine.ElementDetailKey}
                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                title="Hapus"
              >
                <FaTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedMedicine && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FaCapsules className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Detail Obat
                  </h3>
                  <p className="text-sm text-gray-500">
                    ID: {selectedMedicine.ElementDetailKey}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Obat</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.Detail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Klinik</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.clinic_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.DetailDescription}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    selectedMedicine.Berlaku ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedMedicine.Berlaku ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HNA</label>
                  <p className="mt-1 text-sm text-gray-900">Rp {selectedMedicine.HNA?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HNA Jual</label>
                  <p className="mt-1 text-sm text-gray-900">Rp {selectedMedicine.HNAJual?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Satuan Kecil</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.SmallUnit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Satuan Sedang</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.MediumUnit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Satuan Besar</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.LargeUnit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Factor Konversi</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.factor_3}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Qty Minimum</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.QtyMin}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kode KFA</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.KFA_Code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kode APLN</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.APLN_Code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dibuat Oleh</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.UserIDInput}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diperbarui Oleh</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMedicine.UserIDModify || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Dibuat</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedMedicine.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Diperbarui</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedMedicine.updated_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Tutup
              </button>
              <button
                onClick={() => handleShowEdit(selectedMedicine)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMedicine && (
        <MedicineForm
          clinics={clinics}
          onSubmit={handleEditSubmit}
          loading={loading}
          submitText="Update Obat"
          initialData={selectedMedicine}
          onClose={handleCloseEdit}
          isModal={true}
        />
      )}
    </>
  );
} 