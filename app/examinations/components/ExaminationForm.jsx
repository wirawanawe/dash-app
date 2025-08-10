"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function ExaminationForm({ examination, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    visitId: "",
    icdId: "",
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    weight: "",
    height: "",
    notes: "",
  });
  const [visits, setVisits] = useState([]);
  const [icds, setICDs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchVisits();
    fetchICDs();
    if (examination) {
      setFormData({
        visitId: examination.visitId.toString(),
        icdId: examination.icdId.toString(),
        bloodPressure: examination.bloodPressure || "",
        heartRate: examination.heartRate || "",
        temperature: examination.temperature || "",
        weight: examination.weight?.toString() || "",
        height: examination.height?.toString() || "",
        notes: examination.notes || "",
      });
    }
  }, [examination]);

  const fetchVisits = async () => {
    try {
      const response = await fetch("/api/visits");
      if (!response.ok) throw new Error("Failed to fetch visits");
      const data = await response.json();
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data kunjungan");
      setVisits([]);
    }
  };

  const fetchICDs = async () => {
    try {
      const response = await fetch("/api/settings/icd");
      if (!response.ok) throw new Error("Failed to fetch ICDs");
      const data = await response.json();
      setICDs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data ICD");
      setICDs([]);
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
        {examination ? "Edit Pemeriksaan" : "Tambah Pemeriksaan"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Kunjungan
            </label>
            <select
              name="visitId"
              value={formData.visitId}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            >
              <option value="">Pilih Kunjungan</option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.patient.name} -{" "}
                  {new Date(visit.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Diagnosa (ICD)
            </label>
            <select
              name="icdId"
              value={formData.icdId}
              onChange={handleChange}
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            >
              <option value="">Pilih ICD</option>
              {Array.isArray(icds) &&
                icds.map((icd) => (
                  <option key={icd.id} value={icd.id}>
                    {icd.name} - {icd.disease}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Tekanan Darah
            </label>
            <input
              type="text"
              name="bloodPressure"
              value={formData.bloodPressure}
              onChange={handleChange}
              placeholder="Contoh: 120/80 mmHg"
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Detak Jantung
            </label>
            <input
              type="text"
              name="heartRate"
              value={formData.heartRate}
              onChange={handleChange}
              placeholder="Contoh: 80 bpm"
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Suhu Tubuh
            </label>
            <input
              type="text"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              placeholder="Contoh: 36.5 °C"
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Berat Badan (kg)
            </label>
            <input
              type="number"
              step="0.1"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="Contoh: 65.5"
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Tinggi Badan (cm)
            </label>
            <input
              type="number"
              step="0.1"
              name="height"
              value={formData.height}
              onChange={handleChange}
              placeholder="Contoh: 170"
              className="w-full px-4 py-2 border text-black rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
          </div>

          <div className="md:col-span-2">
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
