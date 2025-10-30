"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import toast from "react-hot-toast";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  Calendar,
  Clock,
  Users,
  Award,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Minus
} from "lucide-react";

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polyclinics, setPolyclinics] = useState([]);
  const [selectedPolyclinics, setSelectedPolyclinics] = useState([]);
  const [editingPolyclinics, setEditingPolyclinics] = useState(false);
  const [loadingPolyclinics, setLoadingPolyclinics] = useState(false);

  const clinicId = params.id;

  // Check if user has access
  const isSuperadmin = user?.role === "SUPERADMIN";
  const isAdmin = user?.role === "ADMIN";
  const hasAccess = isSuperadmin || isAdmin;

  useEffect(() => {
    if (user && !hasAccess) {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.push("/dashboard");
    }
  }, [user, hasAccess, router]);

  const fetchClinic = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clinics/${clinicId}?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClinic(data);
        setSelectedPolyclinics(data.polyclinics?.map(p => p.id) || []);
      } else {
        toast.error("Gagal mengambil data klinik");
        router.push("/clinics");
      }
    } catch (error) {

      toast.error("Gagal mengambil data klinik");
      router.push("/clinics");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPolyclinics = async () => {
    try {
      setLoadingPolyclinics(true);
      const response = await fetch('/api/settings/polyclinics');
      if (response.ok) {
        const data = await response.json();
        setPolyclinics(data);
      }
    } catch (error) {

    } finally {
      setLoadingPolyclinics(false);
    }
  };

  useEffect(() => {
    if (hasAccess && clinicId) {
      fetchClinic();
      fetchAllPolyclinics();
    }
  }, [hasAccess, clinicId]);

  const handlePolyclinicToggle = (polyclinicId) => {
    setSelectedPolyclinics(prev => {
      if (prev.includes(polyclinicId)) {
        return prev.filter(id => id !== polyclinicId);
      } else {
        return [...prev, polyclinicId];
      }
    });
  };

  const handleSavePolyclinics = async () => {
    try {
      setLoadingPolyclinics(true);

      // Get current polyclinics for this clinic
      const currentResponse = await fetch(`/api/settings/clinics/${clinicId}/polyclinics`);
      if (currentResponse.ok) {
        const currentPolyclinics = await currentResponse.json();
        const currentSelected = currentPolyclinics.filter(p => p.is_available).map(p => p.id);

        // Remove polyclinics that are no longer selected
        for (const polyclinicId of currentSelected) {
          if (!selectedPolyclinics.includes(polyclinicId)) {
            await fetch(`/api/settings/clinics/${clinicId}/polyclinics?polyclinic_id=${polyclinicId}`, {
              method: 'DELETE'
            });
          }
        }

        // Add newly selected polyclinics
        for (const polyclinicId of selectedPolyclinics) {
          if (!currentSelected.includes(polyclinicId)) {
            await fetch(`/api/settings/clinics/${clinicId}/polyclinics`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ polyclinic_id: polyclinicId })
            });
          }
        }

        toast.success("Poli berhasil diperbarui");
        setEditingPolyclinics(false);
        
        // Force refresh clinic data with a small delay
        setTimeout(() => {
          fetchClinic();
          fetchAllPolyclinics(); // Also refresh polyclinics list
        }, 300);
      }
    } catch (error) {

      toast.error("Gagal memperbarui poli");
    } finally {
      setLoadingPolyclinics(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  const formatRating = (rating) => {
    if (!rating) return "Belum ada rating";
    return `${rating}/5.0`;
  };

  const formatOperatingHours = (operatingHours) => {
    if (!operatingHours) return "Tidak tersedia";
    
    try {
      const hours = typeof operatingHours === 'string' ? JSON.parse(operatingHours) : operatingHours;
      const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
      const todayHours = hours[today];
      
      if (todayHours && todayHours.open && todayHours.close) {
        return `${todayHours.open} - ${todayHours.close}`;
      }
      return "Tutup hari ini";
    } catch (error) {
      return "Tidak tersedia";
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Aktif
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Tidak Aktif
      </span>
    );
  };

  if (!hasAccess) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!clinic) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Klinik Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">Klinik yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <button
            onClick={() => router.push("/clinics")}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Klinik
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/clinics")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{clinic.name}</h1>
              <p className="text-gray-600">{clinic.city}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isSuperadmin && (
              <>
                <button
                  onClick={() => router.push(`/clinics/edit/${clinic.id}`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Klinik
                </button>
                <button
                  onClick={() => {
                    if (confirm("Apakah Anda yakin ingin menghapus klinik ini?")) {
                      // Handle delete
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </button>
              </>
            )}
          </div>
        </div>

        {/* Clinic Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-lg font-semibold text-gray-900">{getStatusBadge(clinic.is_active)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rating</p>
                <p className="text-lg font-semibold text-gray-900">{formatRating(clinic.rating)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ulasan</p>
                <p className="text-lg font-semibold text-gray-900">{clinic.total_reviews || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Poli Tersedia</p>
                <p className="text-lg font-semibold text-gray-900">{clinic.polyclinics?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clinic Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Dasar</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Alamat</p>
                    <p className="text-gray-900">{clinic.address}</p>
                  </div>
                </div>

                {clinic.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Telepon</p>
                      <p className="text-gray-900">{clinic.phone}</p>
                    </div>
                  </div>
                )}

                {clinic.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-900">{clinic.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Jam Operasional Hari Ini</p>
                    <p className="text-gray-900">{formatOperatingHours(clinic.operating_hours)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Terdaftar Sejak</p>
                    <p className="text-gray-900">{formatDate(clinic.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {clinic.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Deskripsi</h2>
                <p className="text-gray-700 leading-relaxed">{clinic.description}</p>
              </div>
            )}
          </div>

          {/* Polyclinics */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Poli yang Tersedia</h2>
                {isSuperadmin && (
                  <button
                    onClick={() => setEditingPolyclinics(!editingPolyclinics)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {editingPolyclinics ? 'Batal' : 'Edit'}
                  </button>
                )}
              </div>

              {editingPolyclinics ? (
                <div className="space-y-4">
                  {loadingPolyclinics ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {polyclinics.map((polyclinic) => (
                          <div
                            key={polyclinic.id}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                              selectedPolyclinics.includes(polyclinic.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handlePolyclinicToggle(polyclinic.id)}
                          >
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{polyclinic.name}</h4>
                              <p className="text-sm text-gray-600">{polyclinic.description}</p>
                            </div>
                            <div className="ml-3">
                              {selectedPolyclinics.includes(polyclinic.id) ? (
                                <Minus className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Plus className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-2 pt-4">
                        <button
                          onClick={handleSavePolyclinics}
                          disabled={loadingPolyclinics}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loadingPolyclinics ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                          onClick={() => setEditingPolyclinics(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Batal
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {clinic.polyclinics && clinic.polyclinics.length > 0 ? (
                    clinic.polyclinics.map((polyclinic) => (
                      <div
                        key={polyclinic.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{polyclinic.name}</h4>
                          <p className="text-sm text-gray-600">{polyclinic.description}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          polyclinic.status === 'Aktif' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {polyclinic.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Tidak ada poli yang tersedia</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 