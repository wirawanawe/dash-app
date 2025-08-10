'use client';

import { X } from 'lucide-react';

export default function MobileUserDetailModal({ user, onClose }) {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="badge badge-success">Active</span>
    ) : (
      <span className="badge badge-destructive">Inactive</span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-xl text-black font-semibold">User Details</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900 mt-1">{user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900 mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900 mt-1">{user.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(user.date_of_birth)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-sm text-gray-900 mt-1">{user.gender || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1 text-black">{getStatusBadge(user.is_active)}</div>
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Health Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Height</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {user.height ? `${user.height} cm` : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Weight</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {user.weight ? `${user.weight} kg` : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Blood Type</label>
                  <p className="text-sm text-gray-900 mt-1">{user.blood_type || '-'}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Contact Name</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {user.emergency_contact_name || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Contact Phone</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {user.emergency_contact_phone || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDateTime(user.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDateTime(user.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Always Visible */}
        <div className="flex justify-end p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 