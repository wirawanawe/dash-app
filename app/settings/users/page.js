"use client";

import React, { useState, useEffect } from "react";
import UserForm from "./components/UserForm";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/settings/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal mengambil data pengguna");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      try {
        const response = await fetch(`/api/settings/users/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Gagal menghapus pengguna");
        }

        toast.success("Pengguna berhasil dihapus");
        fetchUsers();
      } catch (error) {
        console.error("Error:", error);
        toast.error(error.message);
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedUser(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-black font-bold">Data Pengguna</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#E22345] text-white rounded-lg hover:bg-red-600"
          >
            Tambah Pengguna
          </button>
        </div>

        {showForm && (
          <UserForm
            user={selectedUser}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
