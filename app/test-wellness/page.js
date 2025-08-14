"use client";

import React, { useState, useEffect } from "react";

export default function TestWellnessPage() {
  const [wellnessData, setWellnessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWellnessData();
  }, []);

  const fetchWellnessData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/wellness-activities?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setWellnessData(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wellness activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Wellness Activities Test Page</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900">Total Activities</h3>
              <p className="text-3xl font-bold text-blue-600">{wellnessData?.summary?.total_activities || 0}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900">Categories</h3>
              <p className="text-3xl font-bold text-green-600">{wellnessData?.summary?.categories || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-purple-900">Avg Duration</h3>
              <p className="text-3xl font-bold text-purple-600">{wellnessData?.summary?.avg_duration || 0} min</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-orange-900">Avg Points</h3>
              <p className="text-3xl font-bold text-orange-600">{wellnessData?.summary?.avg_points || 0}</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Activities List</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wellnessData?.data?.map((activity) => (
              <div key={activity.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{activity.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Category:</span>
                    <span className="text-sm font-medium text-blue-600">{activity.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Duration:</span>
                    <span className="text-sm font-medium">{activity.duration_minutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Difficulty:</span>
                    <span className="text-sm font-medium">{activity.difficulty || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Points:</span>
                    <span className="text-sm font-medium text-orange-600">{activity.points}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Category Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wellnessData?.summary?.category_distribution?.map((cat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{cat.category}</h3>
                <p className="text-sm text-gray-600">Count: {cat.count}</p>
                <p className="text-sm text-gray-600">Avg Duration: {Math.round(cat.avg_duration)} min</p>
                <p className="text-sm text-gray-600">Avg Points: {Math.round(cat.avg_points)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
