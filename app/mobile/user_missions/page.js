"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Target, RefreshCw, BarChart3, TrendingUp, Activity, Zap, Award,
  Plus, Search, Filter, Eye, Edit, Trash, Calendar, User, CheckCircle, AlertCircle
} from 'lucide-react';
import UserMissionForm from "./components/UserMissionForm";
import UserMissionDetailModal from "./components/UserMissionDetailModal";
import ApiDocumentation from "@/components/ApiDocumentation";

export default function UserMissionsPage() {
  const [userMissions, setUserMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUserMission, setEditingUserMission] = useState(null);
  const [selectedUserMission, setSelectedUserMission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);

  const fetchUserMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : ""
      });

      const response = await fetch(`/api/mobile/user_missions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUserMissions(data.userMissions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);
      } else {
        throw new Error(data.message || 'Gagal memuat data user missions');
      }
    } catch (err) {
      console.error('Error fetching user missions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchUserMissions();
  }, [currentPage, searchTerm, statusFilter]);

  const handleCreate = () => {
    setEditingUserMission(null);
    setShowForm(true);
  };

  const handleEdit = (userMission) => {
    setEditingUserMission(userMission);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user mission ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/mobile/user_missions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUserMissions();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Gagal menghapus user mission');
      }
    } catch (err) {
      console.error('Error deleting user mission:', err);
      alert(err.message);
    }
  };

  const handleShowDetail = (userMission) => {
    setSelectedUserMission(userMission);
    setShowDetailModal(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      const url = editingUserMission 
        ? `/api/mobile/user_missions/${editingUserMission.id}`
        : '/api/mobile/user_missions';
      
      const method = editingUserMission ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingUserMission(null);
        fetchUserMissions();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Gagal menyimpan user mission');
      }
    } catch (err) {
      console.error('Error saving user mission:', err);
      alert(err.message);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUserMission(null);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedUserMission(null);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'failed': 'bg-red-100 text-red-800 border-red-200'
    };
    
    const statusLabels = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'failed': 'Failed'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const stats = [
    {
      label: "Total User Missions",
      value: totalRecords.toLocaleString(),
      icon: Target,
      gradient: "from-blue-500 to-blue-600",
      trend: "All Time",
      isPositive: true
    },
    {
      label: "Completed",
      value: userMissions.filter(um => um.status === 'completed').length.toLocaleString(),
      icon: CheckCircle,
      gradient: "from-green-500 to-green-600",
      trend: "Success",
      isPositive: true
    },
    {
      label: "In Progress",
      value: userMissions.filter(um => um.status === 'in_progress').length.toLocaleString(),
      icon: Activity,
      gradient: "from-purple-500 to-purple-600",
      trend: "Active",
      isPositive: true
    },
    {
      label: "Pending",
      value: userMissions.filter(um => um.status === 'pending').length.toLocaleString(),
      icon: Award,
      gradient: "from-orange-500 to-orange-600",
      trend: "Waiting",
      isPositive: false
    }
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Target className="w-8 h-8" />
                User Missions Management
              </h1>
              <p className="text-blue-100 mt-2">
                Kelola misi pengguna dan tracking progress mereka
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={fetchUserMissions}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/30"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-6 py-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium"
              >
                <Plus className="w-4 h-4" />
                Tambah User Mission
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.isPositive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari user mission..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          {searchTerm && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                Menampilkan hasil pencarian untuk: <span className="font-medium">"{searchTerm}"</span>
              </p>
            </div>
          )}
        </div>

        {/* Data Table Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Data User Missions
            </h3>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-500 mb-4">
                  <AlertCircle className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchUserMissions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
                >
                  Coba Lagi
                </button>
              </div>
            ) : userMissions.length === 0 ? (
              <div className="p-8 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada data user missions</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User & Mission
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userMissions.map((userMission) => (
                    <tr key={userMission.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {userMission.user_name || `User ${userMission.user_id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userMission.mission_title || `Mission ${userMission.mission_id}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(userMission.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${userMission.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {userMission.progress || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {userMission.start_date ? new Date(userMission.start_date).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShowDetail(userMission)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(userMission)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(userMission.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Hapus"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 pagination-safe-area">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Menampilkan {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalRecords)} dari {totalRecords} data
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <UserMissionForm
          userMission={editingUserMission}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUserMission && (
        <UserMissionDetailModal
          userMission={selectedUserMission}
          onClose={handleCloseDetail}
        />
      )}

      {/* API Documentation */}
      <ApiDocumentation pageType="mobile-user-missions" />
    </DashboardLayout>
  );
} 