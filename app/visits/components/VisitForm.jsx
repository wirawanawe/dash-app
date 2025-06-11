"use client";

import { useState, useEffect } from "react";
import PatientSearch from "./PatientSearch";
import toast from "react-hot-toast";

export default function VisitForm({ visit, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    room: "",
    complaint: "",
    treatment: "",
    notes: "",
    status: "Menunggu",
  });
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    if (visit) {
      setFormData({
        patientId: visit.patientId.toString(),
        doctorId: visit.doctorId.toString(),
        room: visit.room || "",
        complaint: visit.complaint || "",
        treatment: visit.treatment || "",
        notes: visit.notes || "",
        status: visit.status || "Menunggu",
      });
    }
  }, [visit]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/settings/doctors");
      if (!response.ok) throw new Error("Failed to fetch doctors");
      const data = await response.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data dokter");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4 text-black">
        {visit ? "Edit Kunjungan" : "Tambah Kunjungan"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Pasien
            </label>
            <PatientSearch
              onSelect={(patient) => {
                setFormData((prev) => ({
                  ...prev,
                  patientId: patient.id.toString(),
                }));
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Dokter
            </label>
            <select
              name="doctorId"
              value={formData.doctorId}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            >
              <option value="">Pilih Dokter</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.speciality}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Ruangan
            </label>
            <select
              name="room"
              value={formData.room}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            >
              <option value="">Pilih Ruangan</option>
              <option value="Ruang 1">Ruang 1</option>
              <option value="Ruang 2">Ruang 2</option>
              <option value="Ruang 3">Ruang 3</option>
              <option value="Ruang 4">Ruang 4</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Keluhan
            </label>
            <textarea
              name="complaint"
              value={formData.complaint}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Tindakan
            </label>
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Catatan
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            >
              <option value="Menunggu">Menunggu</option>
              <option value="Dalam Pemeriksaan">Dalam Pemeriksaan</option>
              <option value="Selesai">Selesai</option>
              <option value="Batal">Batal</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border text-black rounded-lg hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400"
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
