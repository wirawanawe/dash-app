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
  Shield
} from 'lucide-react';
import { createCrudOperation } from "@/utils/refreshUtils";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedPolyclinic, setSelectedPolyclinic] = useState("");

  useEffect(() => {
    fetchDoctors();
    fetchClinics();
    fetchPolyclinics();
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
      console.error("Error fetching clinics:", error);
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
      console.error("Error fetching polyclinics:", error);
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
          console.error("Server error:", response.status, errorData);
          throw new Error(
            `HTTP error! Status: ${response.status}. ${errorData.message || ""}`
          );
        }
      } catch (networkError) {
        console.error("Network error:", networkError);
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
      console.error("Error in fetchDoctors:", error);
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
      console.error("Error:", error);
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
        console.error("Error:", error);
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
              <button
                onClick={() => {
                  setSelectedDoctor(null);
                  setShowForm(true);
                }}
                className="flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Tambah Dokter
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

        {/* Summary Section */}
        {doctors.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution by Clinic */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mr-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Distribusi Dokter per Klinik
              </h3>
              <div className="space-y-3">
                {Object.entries(doctorStats.byClinic).map(([clinicName, count]) => (
                  <div key={clinicName} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">{clinicName}</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {count} dokter
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution by Polyclinic */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mr-3">
                  <Award className="w-5 h-5 text-white" />
                </div>
                Distribusi Dokter per Poli
              </h3>
              <div className="space-y-3">
                {Object.entries(doctorStats.byPolyclinic).map(([polyclinicName, count]) => (
                  <div key={polyclinicName} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">{polyclinicName}</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {count} dokter
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                  <Search className="w-5 h-5 text-white" />
                </div>
                Pencarian & Filter Dokter
              </h2>
              <p className="text-gray-600 mt-2">Cari dan filter dokter berdasarkan berbagai kriteria</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama, spesialisasi, atau SIP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-12 bg-white/50 backdrop-blur-sm shadow-sm"
                />
                <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
              </div>

              {/* Clinic Filter */}
              <div>
                <select
                  value={selectedClinic}
                  onChange={(e) => handleClinicFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm shadow-sm"
                >
                  <option value="">Semua Klinik</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Polyclinic Filter */}
              <div>
                <select
                  value={selectedPolyclinic}
                  onChange={(e) => handlePolyclinicFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm shadow-sm"
                >
                  <option value="">Semua Poli</option>
                  {polyclinics.map((polyclinic) => (
                    <option key={polyclinic.id} value={polyclinic.id}>
                      {polyclinic.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Cari
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  title="Clear Filters"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>

          {/* Active Filters Display */}
          {(searchTerm || selectedClinic || selectedPolyclinic) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-800">Filter Aktif:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      Pencarian: "{searchTerm}"
                    </span>
                  )}
                  {selectedClinic && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                      Klinik: {clinics.find(c => c.id == selectedClinic)?.name}
                    </span>
                  )}
                  {selectedPolyclinic && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                      Poli: {polyclinics.find(p => p.id == selectedPolyclinic)?.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
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
                  {doctors.length > 0 
                    ? `Menampilkan ${doctors.length} dokter${searchTerm || selectedClinic || selectedPolyclinic ? ' (hasil filter)' : ''}`
                    : 'Daftar lengkap dokter yang terdaftar dalam sistem'
                  }
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
                        Nomor SIP
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Klinik & Poli
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
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Stethoscope className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                              {searchTerm || selectedClinic || selectedPolyclinic 
                                ? "Tidak Ada Hasil Pencarian" 
                                : "Tidak Ada Data Dokter"
                              }
                            </h3>
                            <p className="text-gray-500">
                              {searchTerm || selectedClinic || selectedPolyclinic 
                                ? "Coba ubah filter atau kata kunci pencarian Anda"
                                : "Belum ada dokter yang terdaftar dalam sistem"
                              }
                            </p>
                            {(searchTerm || selectedClinic || selectedPolyclinic) && (
                              <button
                                onClick={clearFilters}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              >
                                Clear Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      doctors.map((doctor, index) => (
                        <tr 
                          key={doctor.id} 
                          className="hover:bg-blue-50 transition-colors"
                          style={{ 
                            animationDelay: `${index * 50}ms`,
                            animation: 'fadeInUp 0.5s ease-out forwards'
                          }}
                        >
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
                                {doctor.address && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    📍 {doctor.address}
                                  </div>
                                )}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {doctor.license_number ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {doctor.license_number}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {doctor.clinic_name && (
                                <div className="flex items-center text-sm text-gray-900">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                  <span className="font-medium">{doctor.clinic_name}</span>
                                </div>
                              )}
                              {doctor.polyclinic_name && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                  <span>{doctor.polyclinic_name}</span>
                                  {doctor.polyclinic_code && (
                                    <span className="ml-1 text-xs text-gray-400">
                                      ({doctor.polyclinic_code})
                                    </span>
                                  )}
                                </div>
                              )}
                              {!doctor.clinic_name && !doctor.polyclinic_name && (
                                <span className="text-sm text-gray-500">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {doctor.phone && (
                                <div className="flex items-center text-sm text-gray-900">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                  <a href={`tel:${doctor.phone}`} className="hover:text-blue-600 transition-colors">
                                    {doctor.phone}
                                  </a>
                                </div>
                              )}
                              {doctor.email && (
                                <div className="flex items-center text-sm text-gray-900">
                                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                  <a href={`mailto:${doctor.email}`} className="hover:text-blue-600 transition-colors">
                                    {doctor.email}
                                  </a>
                                </div>
                              )}
                              {!doctor.phone && !doctor.email && (
                                <span className="text-sm text-gray-500">-</span>
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
