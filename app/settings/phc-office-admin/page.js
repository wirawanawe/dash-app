"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Save, 
  Edit, 
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle
} from "lucide-react";

export default function PHCOfficeAdminPage() {
  const [officeData, setOfficeData] = useState({
    office_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postal_code: '',
    contact_person: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingData, setExistingData] = useState(null);

  useEffect(() => {
    fetchOfficeData();
  }, []);

  const fetchOfficeData = async () => {
    try {
      const response = await fetch('/api/phc-office-admin');
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        const data = result.data[0];
        setExistingData(data);
        setOfficeData({
          office_name: data.office_name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          contact_person: data.contact_person || ''
        });
      }
    } catch (error) {

      setMessage({ type: 'error', text: 'Gagal mengambil data kantor PHC' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const url = '/api/phc-office-admin';
      const method = existingData ? 'PUT' : 'POST';
      const body = existingData ? { ...officeData, id: existingData.id } : officeData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setIsEditing(false);
        fetchOfficeData();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {

      setMessage({ type: 'error', text: 'Gagal menyimpan data kantor PHC' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingData || !confirm('Apakah Anda yakin ingin menghapus data kantor PHC ini?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/phc-office-admin?id=${existingData.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setExistingData(null);
        setOfficeData({
          office_name: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          postal_code: '',
          contact_person: ''
        });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {

      setMessage({ type: 'error', text: 'Gagal menghapus data kantor PHC' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOfficeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Data Kantor PHC
          </h1>
          <p className="text-gray-600">
            Kelola informasi kontak dan alamat kantor pusat PHC
          </p>
        </div>

        {message.text && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Informasi Kantor PHC
                  </h2>
                  <p className="text-sm text-gray-600">
                    {existingData ? 'Edit data kantor yang ada' : 'Tambahkan data kantor baru'}
                  </p>
                </div>
              </div>
              
              {existingData && !isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Office Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Kantor *
                  </label>
                  <input
                    type="text"
                    name="office_name"
                    value={officeData.office_name}
                    onChange={handleInputChange}
                    disabled={!isEditing && existingData}
                    required
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Contoh: Kantor Pusat PHC"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={officeData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing && existingData}
                      required
                      className="w-full pl-10 pr-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="+62-21-12345678"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={officeData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing && existingData}
                      required
                      className="w-full pl-10 pr-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="admin@phc.com"
                    />
                  </div>
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kontak Person
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="contact_person"
                      value={officeData.contact_person}
                      onChange={handleInputChange}
                      disabled={!isEditing && existingData}
                      className="w-full pl-10 pr-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="Nama kontak person"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kota
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={officeData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing && existingData}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Jakarta Pusat"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={officeData.postal_code}
                    onChange={handleInputChange}
                    disabled={!isEditing && existingData}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="12190"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    name="address"
                    value={officeData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing && existingData}
                    required
                    rows={3}
                    className="w-full pl-10 pr-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Jl. Sudirman No. 123, Jakarta Pusat"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      fetchOfficeData();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                )}
                
                {(isEditing || !existingData) && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {existingData ? 'Update' : 'Simpan'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
