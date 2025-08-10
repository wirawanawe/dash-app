"use client";

import { X, User, Activity, Calendar, Thermometer, Heart, Activity as ActivityIcon } from "lucide-react";

export default function HealthDataDetailModal({ healthData, onClose }) {
  const getTypeBadge = (type) => {
    const typeColors = {
      'blood_pressure': 'bg-red-100 text-red-800 border-red-200',
      'heart_rate': 'bg-pink-100 text-pink-800 border-pink-200',
      'blood_sugar': 'bg-blue-100 text-blue-800 border-blue-200',
      'weight': 'bg-green-100 text-green-800 border-green-200',
      'temperature': 'bg-orange-100 text-orange-800 border-orange-200',
      'oxygen_saturation': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    const typeLabels = {
      'blood_pressure': 'Blood Pressure',
      'heart_rate': 'Heart Rate',
      'blood_sugar': 'Blood Sugar',
      'weight': 'Weight',
      'temperature': 'Temperature',
      'oxygen_saturation': 'Oxygen Saturation'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${typeColors[type] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {typeLabels[type] || type}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'blood_pressure':
        return <Heart className="w-6 h-6 text-red-600" />;
      case 'heart_rate':
        return <ActivityIcon className="w-6 h-6 text-pink-600" />;
      case 'blood_sugar':
        return <Thermometer className="w-6 h-6 text-blue-600" />;
      case 'weight':
        return <Activity className="w-6 h-6 text-green-600" />;
      case 'temperature':
        return <Thermometer className="w-6 h-6 text-orange-600" />;
      case 'oxygen_saturation':
        return <Activity className="w-6 h-6 text-purple-600" />;
      default:
        return <Activity className="w-6 h-6 text-gray-600" />;
    }
  };

  const getValueDisplay = (type, value, unit) => {
    const displayValue = value || 'N/A';
    const displayUnit = unit || '';
    
    switch (type) {
      case 'blood_pressure':
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{displayValue}</div>
            <div className="text-sm text-gray-600">{displayUnit}</div>
          </div>
        );
      case 'heart_rate':
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-600">{displayValue}</div>
            <div className="text-sm text-gray-600">{displayUnit}</div>
          </div>
        );
      case 'blood_sugar':
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{displayValue}</div>
            <div className="text-sm text-gray-600">{displayUnit}</div>
          </div>
        );
      case 'weight':
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{displayValue}</div>
            <div className="text-sm text-gray-600">{displayUnit}</div>
          </div>
        );
      case 'temperature':
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{displayValue}</div>
            <div className="text-sm text-gray-600">{displayUnit}</div>
          </div>
        );
      case 'oxygen_saturation':
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{displayValue}</div>
            <div className="text-sm text-gray-600">{displayUnit}</div>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{displayValue}</div>
            <div className="text-sm text-gray-600">{displayUnit}</div>
          </div>
        );
    }
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

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold">Health Data Details</h2>
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
                  <label className="block text-sm font-medium text-gray-500">Type</label>
                  <p className="text-sm text-gray-900 mt-1">{healthData.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Value</label>
                  <p className="text-sm text-gray-900 mt-1">{healthData.value}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Unit</label>
                  <p className="text-sm text-gray-900 mt-1">{healthData.unit || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{healthData.notes || '-'}</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDateTime(healthData.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDateTime(healthData.updated_at)}</p>
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