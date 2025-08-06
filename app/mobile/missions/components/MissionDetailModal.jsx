'use client';

import { X } from 'lucide-react';

export default function MissionDetailModal({ mission, onClose }) {
  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="badge badge-success">Active</span>
    ) : (
      <span className="badge badge-destructive">Inactive</span>
    );
  };

  const getCategoryBadge = (category) => {
    const colors = {
      fitness: 'badge-primary',
      nutrition: 'badge-success',
      wellness: 'badge-warning',
      mental_health: 'badge-info',
      sleep: 'badge-secondary'
    };
    
    if (!category) return <span className="badge badge-default">UNKNOWN</span>;
    
    return (
      <span className={`badge ${colors[category] || 'badge-default'}`}>
        {category.replace('_', ' ').toUpperCase()}
      </span>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-xl text-black font-semibold">Mission Details</h2>
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Title</label>
                  <p className="text-sm text-gray-900 mt-1">{mission.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{mission.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Category</label>
                    <div className="mt-1">{getCategoryBadge(mission.category)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1 text-black">{getStatusBadge(mission.is_active)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mission Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Points</label>
                  <p className="text-sm text-gray-900 mt-1">{mission.points} points</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {mission.duration_days ? `${mission.duration_days} days` : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Target</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {mission.target_value && mission.target_unit 
                      ? `${mission.target_value} ${mission.target_unit}`
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDateTime(mission.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDateTime(mission.updated_at)}</p>
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