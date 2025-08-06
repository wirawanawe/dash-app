'use client';

import { X } from 'lucide-react';

export default function ActivityDetailModal({ activity, onClose }) {
  const getMoodBadge = (mood) => {
    if (!mood) return <span className="badge badge-default">Not Set</span>;
    
    const colors = {
      very_happy: 'badge-success',
      happy: 'badge-success',
      neutral: 'badge-warning',
      sad: 'badge-error',
      very_sad: 'badge-error'
    };
    
    return (
      <span className={`badge ${colors[mood] || 'badge-default'}`}>
        {mood.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getStressBadge = (stress) => {
    if (!stress) return <span className="badge badge-default">Not Set</span>;
    
    const colors = {
      low: 'badge-success',
      moderate: 'badge-warning',
      high: 'badge-error',
      very_high: 'badge-error'
    };
    
    return (
      <span className={`badge ${colors[stress] || 'badge-default'}`}>
        {stress.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    if (!category) return <span className="badge badge-default">UNKNOWN</span>;
    
    const colors = {
      fitness: 'badge-primary',
      nutrition: 'badge-success',
      wellness: 'badge-warning',
      mindfulness: 'badge-info',
      health: 'badge-secondary',
      sports: 'badge-primary',
      meditation: 'badge-info',
      yoga: 'badge-warning'
    };
    
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
          <h2 className="text-xl text-black font-semibold">Activity Details</h2>
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
                  <label className="block text-sm font-medium text-gray-500">Activity Name</label>
                  <p className="text-sm text-gray-900 mt-1">{activity.activity_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Activity Type</label>
                  <p className="text-sm text-gray-900 mt-1">{activity.activity_type}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Category</label>
                    <div className="mt-1">{getCategoryBadge(activity.activity_category)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">User ID</label>
                    <p className="text-sm text-gray-900 mt-1">{activity.user_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-sm text-gray-900 mt-1">{activity.duration} minutes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Points Earned</label>
                  <p className="text-sm text-gray-900 mt-1">{activity.points_earned} points</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Activity ID</label>
                  <p className="text-sm text-gray-900 mt-1">{activity.activity_id}</p>
                </div>
              </div>
            </div>

            {/* Mood & Stress Tracking */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mood & Stress Tracking</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mood Before</label>
                  <div className="mt-1">{getMoodBadge(activity.mood_before)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mood After</label>
                  <div className="mt-1">{getMoodBadge(activity.mood_after)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Stress Before</label>
                  <div className="mt-1">{getStressBadge(activity.stress_level_before)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Stress After</label>
                  <div className="mt-1">{getStressBadge(activity.stress_level_after)}</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {activity.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Activity Notes</label>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{activity.notes}</p>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Completed At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDateTime(activity.completed_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDateTime(activity.created_at)}</p>
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