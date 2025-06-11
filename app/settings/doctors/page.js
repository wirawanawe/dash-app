"use client";

import { useState, useEffect } from "react";
import DoctorForm from "./components/DoctorForm";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/settings/doctors");
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      const data = await response.json();
      setDoctors(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data dokter");
      setDoctors([]);
      setIsLoading(false);
    }
  };

  const handleEdit = (doctor) => {
    setSelectedDoctor(doctor);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus dokter ini?")) {
      try {
        const response = await fetch(`/api/settings/doctors/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Gagal menghapus dokter");

        toast.success("Dokter berhasil dihapus");
        fetchDoctors();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal menghapus dokter");
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedDoctor(null);
    fetchDoctors();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedDoctor(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-black font-bold">Data Dokter</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600"
          >
            Tambah Dokter
          </button>
        </div>

        {showForm && (
          <DoctorForm
            doctor={selectedDoctor}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider w-32">
                    NIP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Spesialisasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Poli
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider w-28">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(doctors) &&
                  doctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-black whitespace-nowrap text-sm">
                        {doctor.nip}
                      </td>
                      <td className="px-6 py-4 text-black whitespace-nowrap text-sm">
                        {doctor.name}
                      </td>
                      <td className="px-6 py-4 text-black whitespace-nowrap text-sm">
                        {doctor.speciality}
                      </td>
                      <td className="px-6 py-4 text-black whitespace-nowrap text-sm">
                        {doctor.polyclinic?.name}
                      </td>
                      <td className="px-6 py-4 text-black whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                            doctor.status === "Aktif"
                              ? "text-green-800 bg-green-100"
                              : "text-red-800 bg-red-100"
                          }`}
                        >
                          {doctor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-black whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEdit(doctor)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
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
      </div>
    </DashboardLayout>
  );
}
