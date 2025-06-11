"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function DoctorForm({ doctor, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    nip: "",
    nik: "",
    name: "",
    speciality: "",
    phone: "",
    email: "",
    polyclinicId: "",
    status: "Aktif",
  });
  const [polyclinics, setPolyclinics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const hideNumberInputArrows = {
    WebkitAppearance: "none",
    MozAppearance: "textfield",
    appearance: "textfield",
    margin: 0,
  };

  useEffect(() => {
    fetchPolyclinics();
    if (doctor) {
      setFormData({
        nip: doctor.nip || "",
        nik: doctor.nik || "",
        name: doctor.name || "",
        speciality: doctor.speciality || "",
        phone: doctor.phone || "",
        email: doctor.email || "",
        polyclinicId: doctor.polyclinicId?.toString() || "",
        status: doctor.status || "Aktif",
      });
    }
  }, [doctor]);

  const fetchPolyclinics = async () => {
    try {
      const response = await fetch("/api/settings/polyclinics");
      if (!response.ok) {
        throw new Error("Failed to fetch polyclinics");
      }
      const data = await response.json();
      setPolyclinics(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data poli");
      setPolyclinics([]);
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
      // Log data sebelum dikirim
      // console.log("Sending data:", formData);

      const url = doctor
        ? `/api/settings/doctors/${doctor.id}`
        : "/api/settings/doctors";

      const response = await fetch(url, {
        method: doctor ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nip: formData.nip,
          nik: formData.nik || null,
          name: formData.name,
          speciality: formData.speciality,
          phone: formData.phone || "",
          email: formData.email || "",
          polyclinicId: parseInt(formData.polyclinicId) || null,
          status: formData.status,
        }),
      });

      // Log response untuk debugging
      const result = await response.json();
      // console.log("Response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan data");
      }

      toast.success(
        doctor ? "Dokter berhasil diupdate" : "Dokter berhasil ditambahkan"
      );
      onSubmit();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Gagal menyimpan data dokter");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h2 className="text-xl text-black font-bold mb-4">
        {doctor ? "Edit Dokter" : "Tambah Dokter"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              NIP
            </label>
            <input
              type="text"
              name="nip"
              value={formData.nip}
              onChange={handleChange}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              No. KTP
            </label>
            <input
              type="number"
              name="nik"
              value={formData.nik}
              onChange={handleChange}
              placeholder="Masukkan Nomor KTP"
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
              style={hideNumberInputArrows}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Spesialisasi
            </label>
            <input
              type="text"
              name="speciality"
              value={formData.speciality}
              onChange={handleChange}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Poli
            </label>
            <select
              name="polyclinicId"
              value={formData.polyclinicId}
              onChange={handleChange}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            >
              <option value="">Pilih Poli</option>
              {polyclinics.map((poli) => (
                <option key={poli.id} value={poli.id}>
                  {poli.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              No. Telepon
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
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
              className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:border-[#E22345]"
              required
            >
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-black border rounded-lg hover:bg-gray-100"
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
