"use client";

import React, { useState, useEffect } from "react";
import PolyclinicForm from "./components/PolyclinicForm";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import ApiDocumentation from "@/components/ApiDocumentation";

export default function PolyclinicsPage() {
  const [polyclinics, setPolyclinics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPolyclinic, setSelectedPolyclinic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState("");

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    fetchPolyclinics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinic]);

  const fetchClinics = async () => {
    try {
      const response = await fetch("/api/clinics?limit=1000");
      if (response.ok) {
        const result = await response.json();
        const clinicsList = result.data || [];
        setClinics(clinicsList);
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
    }
  };

  const fetchPolyclinics = async () => {
    try {
      setIsLoading(true);
      const url = selectedClinic 
        ? `/api/settings/polyclinics?clinic_code=${encodeURIComponent(selectedClinic)}`
        : "/api/settings/polyclinics";
        
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setPolyclinics(Array.isArray(data) ? data : []);
    } catch (error) {

      toast.error("Gagal mengambil data poli");
      setPolyclinics([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (polyclinic) => {
    setSelectedPolyclinic(polyclinic);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus poli ini?")) {
      try {
        const response = await fetch(`/api/settings/polyclinics/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Gagal menghapus poli");
        }

        toast.success("Poli berhasil dihapus");
        fetchPolyclinics();
      } catch (error) {

        toast.error(error.message || "Gagal menghapus poli");
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedPolyclinic(null);
    fetchPolyclinics();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedPolyclinic(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl text-black font-bold">Data Poli</h1>
            <p className="text-sm text-gray-600 mt-1">Jumlah dokter berdasarkan data kunjungan per klinik</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
            >
              <option value="">Semua Klinik</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.code}>
                  {clinic.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600 whitespace-nowrap"
            >
              Tambah Poli
            </button>
          </div>
        </div>

        {showForm && (
          <PolyclinicForm
            polyclinic={selectedPolyclinic}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Kode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Klinik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Dokter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(polyclinics) &&
                  polyclinics.map((polyclinic) => (
                    <tr key={polyclinic.id}>
                      <td className="px-6 py-4 text-black whitespace-nowrap">
                        {polyclinic.name}
                      </td>
                      <td className="px-6 py-4 text-black whitespace-nowrap">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {polyclinic.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-black">
                        <div className="max-w-xs truncate" title={polyclinic.description}>
                          {polyclinic.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-black whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {polyclinic.clinic_count || 0} klinik
                        </span>
                      </td>
                      <td className="px-6 py-4 text-black whitespace-nowrap">
                        <span 
                          className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs cursor-help" 
                          title={`Total ${polyclinic.doctor_count || 0} dokter unik yang pernah melayani di poli ${polyclinic.name} dari semua klinik berdasarkan data kunjungan`}
                        >
                          {polyclinic.doctor_count || 0} dokter
                        </span>
                      </td>
                      <td className="px-6 py-4 text-black whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs ${
                          polyclinic.status === 'Aktif' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {polyclinic.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-black whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(polyclinic)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(polyclinic.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* API Documentation */}
        <ApiDocumentation pageType="settings-polyclinics" />
      </div>
    </DashboardLayout>
  );
}
