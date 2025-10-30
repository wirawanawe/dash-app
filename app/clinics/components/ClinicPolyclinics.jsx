"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function ClinicPolyclinics({ clinicId, clinicName }) {
  const [polyclinics, setPolyclinics] = useState([]);
  const [availablePolyclinics, setAvailablePolyclinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (clinicId) {
      fetchClinicPolyclinics();
      fetchAvailablePolyclinics();
    }
  }, [clinicId]);

  const fetchClinicPolyclinics = async () => {
    try {
      const response = await fetch(`/api/settings/clinics/${clinicId}/polyclinics`);
      if (response.ok) {
        const data = await response.json();
        setPolyclinics(data.filter(p => p.is_available));
      }
    } catch (error) {

    }
  };

  const fetchAvailablePolyclinics = async () => {
    try {
      const response = await fetch("/api/settings/polyclinics");
      if (response.ok) {
        const data = await response.json();
        setAvailablePolyclinics(data.filter(p => p.status === 'Aktif'));
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleAddPolyclinic = async (polyclinicId) => {
    try {
      const response = await fetch(`/api/settings/clinics/${clinicId}/polyclinics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ polyclinic_id: polyclinicId }),
      });

      if (response.ok) {
        toast.success("Poli berhasil ditambahkan ke klinik");
        fetchClinicPolyclinics();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        toast.error(error.message || "Gagal menambahkan poli");
      }
    } catch (error) {

      toast.error("Gagal menambahkan poli");
    }
  };

  const handleRemovePolyclinic = async (polyclinicId) => {
    if (confirm("Apakah Anda yakin ingin menghapus poli ini dari klinik?")) {
      try {
        const response = await fetch(
          `/api/settings/clinics/${clinicId}/polyclinics?polyclinic_id=${polyclinicId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          toast.success("Poli berhasil dihapus dari klinik");
          fetchClinicPolyclinics();
        } else {
          const error = await response.json();
          toast.error(error.message || "Gagal menghapus poli");
        }
      } catch (error) {

        toast.error("Gagal menghapus poli");
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Poli yang Tersedia di {clinicName}
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600 text-sm"
        >
          Tambah Poli
        </button>
      </div>

      {polyclinics.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Belum ada poli yang ditambahkan ke klinik ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {polyclinics.map((polyclinic) => (
            <div
              key={polyclinic.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{polyclinic.name}</h4>
                <button
                  onClick={() => handleRemovePolyclinic(polyclinic.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                  title="Hapus poli"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">{polyclinic.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {polyclinic.code}
                </span>
                <span className="text-xs text-gray-500">
                  Ditambahkan: {new Date(polyclinic.added_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Polyclinic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Tambah Poli ke Klinik</h3>
            
            <div className="max-h-60 overflow-y-auto">
              {availablePolyclinics
                .filter(p => !polyclinics.find(cp => cp.id === p.id))
                .map((polyclinic) => (
                  <div
                    key={polyclinic.id}
                    className="border rounded p-3 mb-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAddPolyclinic(polyclinic.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{polyclinic.name}</h4>
                        <p className="text-sm text-gray-600">{polyclinic.description}</p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {polyclinic.code}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {availablePolyclinics.filter(p => !polyclinics.find(cp => cp.id === p.id)).length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Semua poli sudah ditambahkan ke klinik ini
              </p>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 