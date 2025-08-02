"use client";

import React, { useState, useEffect } from "react";
import ClinicForm from "./components/ClinicForm";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import ApiDocumentation from "@/components/ApiDocumentation";

export default function ClinicsPage() {
  const [clinics, setClinics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClinics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings/clinics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setClinics(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data klinik");
      setClinics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleEdit = (clinic) => {
    setSelectedClinic(clinic);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus klinik ini?")) {
      try {
        const response = await fetch(`/api/settings/clinics/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Gagal menghapus klinik");
        }

        toast.success("Klinik berhasil dihapus");
        fetchClinics();
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message);
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedClinic(null);
    fetchClinics();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedClinic(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-black font-bold">Data Klinik</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600"
          >
            Tambah Klinik
          </button>
        </div>

        {showForm && (
          <ClinicForm
            clinic={selectedClinic}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
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
                    Alamat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Telepon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Email
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
                {Array.isArray(clinics) &&
                  clinics.map((clinic) => (
                    <tr key={clinic.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {clinic.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {clinic.code}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {clinic.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {clinic.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        {clinic.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        <span
                          className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                            clinic.is_active
                              ? "text-green-800 bg-green-100"
                              : "text-red-800 bg-red-100"
                          }`}
                        >
                          {clinic.is_active ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-black">
                        <button
                          onClick={() => handleEdit(clinic)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(clinic.id)}
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
        <ApiDocumentation pageType="settings-clinics" />
      </div>
    </DashboardLayout>
  );
} 