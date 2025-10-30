"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import DoctorForm from "./components/DoctorForm";
import ApiDocumentation from "@/components/ApiDocumentation";
import toast from "react-hot-toast";
import { 
  FaEdit, 
  FaTrash, 
  FaSearch 
} from "react-icons/fa";
import { 
  Stethoscope, 
  UserPlus, 
  Search, 
  BarChart3, 
  TrendingUp,
  Activity,
  Heart,
  Users,
  Mail,
  Phone,
  Award,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
  Star,
  Shield,
  Download,
  Cloud,
  RotateCcw,
  AlertTriangle,
  Building
} from 'lucide-react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchDoctors();
    setIsLoaded(true);
  }, []);

  const fetchClinics = async () => {
    try {
      const response = await fetch("/api/clinics");
      if (response.ok) {
        const result = await response.json();
        setClinics(result.data || result);
      }
    } catch (error) {

    }
  };

  const fetchPolyclinics = async () => {
    try {
      const response = await fetch("/api/master/polyclinics");
      if (response.ok) {
        const data = await response.json();
        setPolyclinics(data);
      }
    } catch (error) {

    }
  };

  const fetchDoctors = async (search = "", clinicId = "", polyclinicId = "") => {
    try {
      setIsLoading(true);

      let url = "/api/doctors?";
      const params = new URLSearchParams();
      
      if (search) {
        params.append("search", search);
      }
      if (clinicId) {
        params.append("clinic_id", clinicId);
      }
      if (polyclinicId) {
        params.append("polyclinic_id", polyclinicId);
      }

      url += params.toString();

      let response;
      try {
        response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          throw new Error(
            `HTTP error! Status: ${response.status}. ${errorData.message || ""}`
          );
        }
      } catch (networkError) {

        setDoctors([]);
        setIsLoading(false);

        if (
          networkError.message.includes("ER_ACCESS_DENIED_ERROR") ||
          networkError.message.includes("ECONNREFUSED")
        ) {
          toast.error(
            "Database connection error. Please check MySQL credentials."
          );
        } else if (networkError.message.includes("500")) {
          toast.error(
            "Server error: Database query failed. Please check server logs."
          );
        } else {
          toast.error("Tidak dapat terhubung ke server. Coba lagi nanti.");
        }
        return;
      }

      const data = await response.json();
      setDoctors(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (error) {

      setDoctors([]);
      setIsLoading(false);
      toast.error("Gagal mengambil data dokter");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const url = "/api/doctors" + (selectedDoctor ? `/${selectedDoctor.id}` : "");
      const method = selectedDoctor ? "PUT" : "POST";

      await createCrudOperation(
        method,
        url,
        formData,
        () => fetchDoctors(),
        { setLoading: setIsLoading }
      );

      toast.success(
        selectedDoctor
          ? "Dokter berhasil diupdate"
          : "Dokter berhasil ditambahkan"
      );
      setShowForm(false);
    } catch (error) {

      toast.error(error.message || "Gagal menyimpan dokter");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus dokter ini?")) {
      try {
        await createCrudOperation(
          "DELETE",
          `/api/doctors/${id}`,
          null,
          () => fetchDoctors(),
          { setLoading: setIsLoading }
        );
        
        toast.success("Dokter berhasil dihapus");
      } catch (error) {

        toast.error("Gagal menghapus dokter");
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors(searchTerm, selectedClinic, selectedPolyclinic);
  };

  const handleClinicFilter = (clinicId) => {
    setSelectedClinic(clinicId);
    fetchDoctors(searchTerm, clinicId, selectedPolyclinic);
  };

  const handlePolyclinicFilter = (polyclinicId) => {
    setSelectedPolyclinic(polyclinicId);
    fetchDoctors(searchTerm, selectedClinic, polyclinicId);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedClinic("");
    setSelectedPolyclinic("");
    fetchDoctors();
  };

  // Calculate doctor statistics
  const doctorStats = {
    total: doctors.length,
    specialists: doctors.filter(d => d.specialist && d.specialist !== "").length,
    active: doctors.length, // Assuming all doctors are active
    averageExperience: Math.round(doctors.reduce((acc, d) => acc + (d.experience_years || 0), 0) / Math.max(1, doctors.length)),
    byClinic: doctors.reduce((acc, d) => {
      const clinicName = d.clinic_name || "Tidak Ditetapkan";
      acc[clinicName] = (acc[clinicName] || 0) + 1;
      return acc;
    }, {}),
    byPolyclinic: doctors.reduce((acc, d) => {
      const polyclinicName = d.polyclinic_name || "Tidak Ditetapkan";
      acc[polyclinicName] = (acc[polyclinicName] || 0) + 1;
      return acc;
    }, {})
  };

  const handleSyncFromAPI = async () => {
    if (isSyncing) return;
    
    if (!confirm('Apakah Anda yakin ingin melakukan sinkronisasi data dokter dari API eksternal? Proses ini mungkin memakan waktu beberapa menit.')) {
      return;
    }
    
    setIsSyncing(true);
    const loadingToast = toast.loading('Melakukan sinkronisasi data dokter dari API eksternal...');
    
    try {
      const response = await fetch('/api/doctors/sync', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(result.message, { id: loadingToast });
        // Refresh the doctors list
        fetchDoctors();
      } else {
        throw new Error(result.message || 'Gagal melakukan sinkronisasi');
      }
    } catch (error) {

      toast.error(error.message || 'Gagal melakukan sinkronisasi dokter', { id: loadingToast });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetAndSync = async () => {
    if (isResetting) return;
    
    // Konfirmasi pertama
    if (!confirm('⚠️ PERINGATAN: Anda akan menghapus SEMUA data dokter yang ada dan menggantinya dengan data dari API!\n\nApakah Anda yakin ingin melanjutkan?')) {
      return;
    }
    
    // Konfirmasi kedua untuk keamanan
    if (!confirm('Konfirmasi sekali lagi: Semua data dokter akan dihapus permanen dan diganti dengan data dari API eksternal. Proses ini tidak dapat dibatalkan!\n\nLanjutkan?')) {
      return;
    }
    
    setIsResetting(true);
    const loadingToast = toast.loading('Menghapus data dokter lama dan melakukan sinkronisasi dari API eksternal...');
    
    try {
      const response = await fetch('/api/doctors/reset-sync', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(result.message, { id: loadingToast });
        // Refresh the doctors list
        fetchDoctors();
      } else {
        throw new Error(result.message || 'Gagal melakukan reset dan sinkronisasi');
      }
    } catch (error) {

      toast.error(error.message || 'Gagal melakukan reset dan sinkronisasi dokter', { id: loadingToast });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <DashboardLayout>
              <div className="space-y-6 sm:space-y-8">
        {/* Modern Header */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                <Stethoscope className="w-4 h-4 mr-2" />
                Manajemen Dokter
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Daftar <span className="text-yellow-300">Dokter</span>
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Kelola data dokter, spesialisasi, dan informasi kontak dalam sistem terintegrasi
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fetchDoctors()}
                className="group flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-all duration-300 font-semibold border border-white/30"
              >
                <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                Refresh Data
              </button>
              
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '0ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8%
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {doctorStats.total}
              </p>
              <p className="text-sm text-gray-600 font-medium">Total Dokter</p>
              <p className="text-xs text-gray-500 mt-1">
                Terdaftar dalam sistem
              </p>
            </div>
          </div>

          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600">
                <Star className="w-4 h-4 mr-1" />
                Spesialis
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {doctorStats.specialists}
              </p>
              <p className="text-sm text-gray-600 font-medium">Dokter Spesialis</p>
              <p className="text-xs text-gray-500 mt-1">
                Dengan spesialisasi
              </p>
            </div>
          </div>

          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                Aktif
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600 mb-1">
                {doctorStats.active}
              </p>
              <p className="text-sm text-gray-600 font-medium">Dokter Aktif</p>
              <p className="text-xs text-gray-500 mt-1">
                Sedang praktik
              </p>
            </div>
          </div>

          <div 
            className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              isLoaded ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-sm font-medium text-orange-600">
                <Heart className="w-4 h-4 mr-1" />
                Rata-rata
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {doctorStats.averageExperience}
              </p>
              <p className="text-sm text-gray-600 font-medium">Tahun Pengalaman</p>
              <p className="text-xs text-gray-500 mt-1">
                Rata-rata tim dokter
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                  <Search className="w-5 h-5 text-white" />
                </div>
                Pencarian Dokter
              </h2>
              <p className="text-gray-600 mt-2">Cari dokter berdasarkan nama, spesialisasi, atau nomor SIP</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari dokter berdasarkan nama, spesialisasi, atau nomor SIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-12 bg-white/50 backdrop-blur-sm shadow-sm"
              />
              <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
            </div>
            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Search className="w-5 h-5 mr-2" />
              Cari Dokter
            </button>
          </form>
        </div>

        {/* Data Table Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  Data Dokter
                </h2>
                <p className="text-gray-600 mt-2">
                  Daftar lengkap dokter yang terdaftar dalam sistem
                </p>
              </div>
              <div className="hidden lg:flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Aktif</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Spesialis</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <div className="loading-spinner h-8 w-8 text-blue-600 mx-auto mb-4"></div>
                <p className="text-xl font-medium text-gray-700 mb-2">Memuat Data Dokter</p>
                <p className="text-gray-500">Mengambil informasi terkini...</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Dokter
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Spesialisasi
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Klinik
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poli
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nomor SIP
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kontak
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {doctors.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Stethoscope className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Data Dokter</h3>
                            <p className="text-gray-500">Belum ada dokter yang terdaftar dalam sistem</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      doctors.map((doctor) => (
                        <tr key={doctor.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {doctor.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {doctor.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {doctor.specialist ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Award className="w-3 h-3 mr-1" />
                                {doctor.specialist}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {doctor.clinics_from_visits ? (
                              <div className="flex flex-wrap gap-1">
                                {doctor.clinics_from_visits.split(', ').map((clinic, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Building className="w-3 h-3 mr-1" />
                                    {clinic}
                                  </span>
                                ))}
                              </div>
                            ) : doctor.clinic_name ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  <Building className="w-3 h-3 mr-1" />
                                  {doctor.clinic_name}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  (Belum ada kunjungan)
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {doctor.polyclinics_from_visits ? (
                              <div className="flex flex-wrap gap-1">
                                {doctor.polyclinics_from_visits.split(', ').map((poli, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Stethoscope className="w-3 h-3 mr-1" />
                                    {poli}
                                  </span>
                                ))}
                              </div>
                            ) : doctor.polyclinic_name ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  <Stethoscope className="w-3 h-3 mr-1" />
                                  {doctor.polyclinic_name}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  (Belum ada kunjungan)
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {doctor.license_number || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {doctor.phone && (
                                <div className="flex items-center text-sm text-gray-900">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                  {doctor.phone}
                                </div>
                              )}
                              {doctor.email && (
                                <div className="flex items-center text-sm text-gray-900">
                                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                  {doctor.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedDoctor(doctor);
                                  setShowForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Edit Dokter"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(doctor.id)}
                                className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Hapus Dokter"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* API Documentation */}
        <ApiDocumentation pageType="doctors" />

        {/* Doctor Form Modal */}
        {showForm && (
          <DoctorForm
            doctor={selectedDoctor}
            onSubmit={handleSubmit}
            onCancel={() => {
              setSelectedDoctor(null);
              setShowForm(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
