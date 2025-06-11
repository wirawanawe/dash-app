"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import UserForm from "./components/UserForm";

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [clinics, setClinics] = useState([]);

  // Check if user is admin, otherwise redirect
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (user && !isAdmin) {
      toast.error("Hanya admin yang dapat mengakses halaman ini");
      router.push("/dashboard");
    }
  }, [user, isAdmin, router]);

  // Fetch clinics for dropdown
  const fetchClinics = useCallback(async () => {
    try {
      // Get token from localStorage or cookies
      const token = localStorage.getItem("token");

      const response = await fetch("/api/settings/clinics", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch clinics");
      }

      const data = await response.json();
      console.log("Clinics fetched successfully:", data.length);
      setClinics(data);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      toast.error("Gagal memuat data klinik");
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/users?search=${encodeURIComponent(searchQuery)}&page=${
          pagination.page
        }&limit=${pagination.limit}`
      );

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, pagination.page, pagination.limit]);

  // Initial fetch
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchClinics();
    }
  }, [isAdmin, fetchUsers, fetchClinics]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInputValue);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle input change for search
  const handleInputChange = (e) => {
    setSearchInputValue(e.target.value);
  };

  // Handle add user
  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  // Handle delete user
  const handleDeleteUser = async (id) => {
    if (!confirm("Anda yakin ingin menghapus pengguna ini?")) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      toast.success("Pengguna berhasil dihapus");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Gagal menghapus pengguna");
    }
  };

  // Handle form submit
  const handleFormSubmit = async (formData) => {
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save user");
      }

      toast.success(
        editingUser
          ? "Pengguna berhasil diperbarui"
          : "Pengguna berhasil ditambahkan"
      );

      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(error.message || "Gagal menyimpan data pengguna");
    }
  };

  if (!isAdmin) {
    return null; // Don't render anything if not admin
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Manajemen Pengguna</h1>
          {!showForm && (
            <button
              onClick={handleAddUser}
              className="bg-[#E22345] text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Tambah Pengguna
            </button>
          )}
        </div>

        {showForm && (
          <UserForm
            user={editingUser}
            clinics={clinics}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={searchInputValue}
              onChange={handleInputChange}
              className="p-2 border rounded-l-lg w-full text-black"
            />
            <button
              type="submit"
              className="bg-[#E22345] text-white px-4 py-2 rounded-r-lg hover:bg-red-600"
            >
              Cari
            </button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Klinik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : user.role === "DOCTOR"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          {user.clinic ? user.clinic.name : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.is_active ? "Aktif" : "Tidak Aktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-black"
                      >
                        Tidak ada data pengguna
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    {"<<"}
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    {"<"}
                  </button>
                  <span className="px-3 py-1">
                    Halaman {pagination.page} dari {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    {">"}
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    {">>"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
