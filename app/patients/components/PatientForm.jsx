"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function PatientForm({ patient, isEdit = false }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nik: "",
    birthDate: "",
    gender: "",
    address: "",
    phone: "",
    email: "",
    provinceId: "",
    provinceName: "",
    cityId: "",
    cityName: "",
    districtId: "",
    districtName: "",
    villageId: "",
    villageName: "",
    postalCode: "",
    companyId: "",
    insurance: {
      provider: "",
      number: "",
      type: "",
      status: "Aktif",
    },
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || "",
        nik: patient.nik || "",
        birthDate: patient.birthDate ? patient.birthDate.split("T")[0] : "",
        gender: patient.gender || "",
        address: patient.address || "",
        phone: patient.phone || "",
        email: patient.email || "",
        provinceId: patient.provinceId || "",
        provinceName: patient.provinceName || "",
        cityId: patient.cityId || "",
        cityName: patient.cityName || "",
        districtId: patient.districtId || "",
        districtName: patient.districtName || "",
        villageId: patient.villageId || "",
        villageName: patient.villageName || "",
        postalCode: patient.postalCode || "",
        companyId: patient.companyId || "",
        insurance: patient.insurance || {
          provider: "",
          number: "",
          type: "",
          status: "Aktif",
        },
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("insurance.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        insurance: {
          ...prev.insurance,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEdit ? `/api/patients/${patient.id}` : "/api/patients";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan data pasien");
      }

      toast.success(
        isEdit ? "Data berhasil diperbarui" : "Data berhasil disimpan"
      );
      router.push("/patients");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Pribadi */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Data Pribadi</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border focus:border-[#E22345] focus:ring-[#E22345]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                NIK
              </label>
              <input
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border focus:border-[#E22345] focus:ring-[#E22345]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tanggal Lahir
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border focus:border-[#E22345] focus:ring-[#E22345]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Jenis Kelamin
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border focus:border-[#E22345] focus:ring-[#E22345]"
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Kontak */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Data Kontak</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Alamat
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border focus:border-[#E22345] focus:ring-[#E22345]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                No. Telepon
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border focus:border-[#E22345] focus:ring-[#E22345]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border focus:border-[#E22345] focus:ring-[#E22345]"
              />
            </div>
          </div>
        </div>

        {/* Data Asuransi */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Data Asuransi</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Provider Asuransi
              </label>
              <input
                type="text"
                name="insurance.provider"
                value={formData.insurance.provider}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border focus:border-[#E22345] focus:ring-[#E22345]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nomor Asuransi
              </label>
              <input
                type="text"
                name="insurance.number"
                value={formData.insurance.number}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border focus:border-[#E22345] focus:ring-[#E22345]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipe Asuransi
              </label>
              <input
                type="text"
                name="insurance.type"
                value={formData.insurance.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border focus:border-[#E22345] focus:ring-[#E22345]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-white bg-[#E22345] rounded-md hover:bg-red-600 disabled:bg-gray-400"
        >
          {isLoading ? "Menyimpan..." : isEdit ? "Update" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
