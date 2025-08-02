"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import MedicineForm from "../components/MedicineForm";
import toast from "react-hot-toast";

export default function NewMedicinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Check if user has access to medicine page
  const hasAccess = user?.role === "SUPERADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    if (!hasAccess) {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.push('/dashboard');
      return;
    }

    // Fetch clinics for the form
    const fetchClinics = async () => {
      try {
        const response = await fetch('/api/clinics');
        if (response.ok) {
          const result = await response.json();
          setClinics(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching clinics:', error);
        toast.error('Gagal mengambil data klinik');
      }
    };

    fetchClinics();
  }, [hasAccess, router]);

  const handleSubmit = async (medicineData) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/medicine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...medicineData,
          UserIDInput: user?.username || 'system'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Obat berhasil ditambahkan');
        router.push('/medicine');
      } else {
        toast.error(result.message || 'Gagal menambahkan obat');
      }
    } catch (error) {
      console.error('Error creating medicine:', error);
      toast.error('Terjadi kesalahan saat menambahkan obat');
    } finally {
      setLoading(false);
    }
  };

  // Show access denied if user doesn't have permission
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
            <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-white">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
              <span className="mr-2">➕</span>
              Tambah Obat Baru
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4">
              Tambah <span className="text-yellow-300">Obat</span> Baru
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-2xl">
              Tambahkan obat baru ke dalam sistem dengan informasi lengkap
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900">
              Form Tambah Obat
            </h2>
            <p className="text-gray-600 mt-2">
              Isi informasi obat dengan lengkap dan akurat
            </p>
          </div>

          <div className="p-6">
            <MedicineForm
              clinics={clinics}
              onSubmit={handleSubmit}
              loading={loading}
              submitText="Tambah Obat"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 