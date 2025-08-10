"use client";

import { X, User, Target, Calendar, BarChart3, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function UserMissionDetailModal({ userMission, onClose }) {
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
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-6 h-6 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">User Mission Detail</h2>
                <p className="text-blue-100 text-sm">ID: {userMission.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* Status Section */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(userMission.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Status Mission</h3>
                    <p className="text-gray-600">Current progress and status</p>
                  </div>
                </div>
                {getStatusBadge(userMission.status)}
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                  <span className="text-lg font-bold text-blue-600">{userMission.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${userMission.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* User & Mission Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">User ID:</span>
                    <p className="text-gray-900 font-semibold">{userMission.user_id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">User Name:</span>
                    <p className="text-gray-900">{userMission.user_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">User Email:</span>
                    <p className="text-gray-900">{userMission.user_email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Mission Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Mission Information</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Mission ID:</span>
                    <p className="text-gray-900 font-semibold">{userMission.mission_id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Mission Title:</span>
                    <p className="text-gray-900">{userMission.mission_title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Mission Category:</span>
                    <p className="text-gray-900">{userMission.mission_category || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <span className="text-sm font-medium text-gray-600">Started At</span>
                  <p className="text-gray-900 font-semibold">
                    {userMission.started_at ? new Date(userMission.started_at).toLocaleString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Not started'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <span className="text-sm font-medium text-gray-600">Completed At</span>
                  <p className="text-gray-900 font-semibold">
                    {userMission.completed_at ? new Date(userMission.completed_at).toLocaleString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Not completed'}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Created At</span>
                  <p className="text-gray-900">
                    {userMission.created_at ? new Date(userMission.created_at).toLocaleString('id-ID') : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Updated At</span>
                  <p className="text-gray-900">
                    {userMission.updated_at ? new Date(userMission.updated_at).toLocaleString('id-ID') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Always Visible */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 