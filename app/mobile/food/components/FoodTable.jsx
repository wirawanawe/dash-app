"use client";

export default function FoodTable({ foods, onEdit, onDelete, pagination, onPageChange }) {
  const formatNumber = (value) => {
    if (!value) return "-";
    return parseFloat(value).toFixed(1);
  };

  const getVerifiedBadge = (isVerified) => {
    return isVerified ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✓ Verified
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
    );
  };

  const getSourceBadge = (source) => {
    const badges = {
      manual: { bg: "bg-blue-100", text: "text-blue-800", label: "Manual" },
      api: { bg: "bg-purple-100", text: "text-purple-800", label: "API" },
      ai_scan: { bg: "bg-orange-100", text: "text-orange-800", label: "AI Scan" }
    };
    
    const badge = badges[source] || badges.manual;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    onPageChange(newOffset);
  };

  const handleNextPage = () => {
    const newOffset = pagination.offset + pagination.limit;
    onPageChange(newOffset);
  };

  if (foods.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">🍽️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tidak ada data makanan
        </h3>
        <p className="text-gray-500">
          Tambahkan makanan pertama untuk memulai database makanan.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Data Makanan ({pagination.total} items)
          </h3>
          <div className="text-sm text-gray-500">
            Menampilkan {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} dari {pagination.total} makanan
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Makanan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nutrisi (per 100g)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {foods.map((food) => (
              <tr key={food.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {food.image_url && (
                      <div className="flex-shrink-0 h-12 w-12 mr-4">
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={food.image_url}
                          alt={food.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {food.name}
                      </div>
                      {food.name_indonesian && (
                        <div className="text-sm text-gray-500">
                          {food.name_indonesian}
                        </div>
                      )}
                      {food.barcode && (
                        <div className="text-xs text-gray-400">
                          Barcode: {food.barcode}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {food.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div className="grid grid-cols-2 gap-2">
                      <div>Kalori: <span className="font-medium">{formatNumber(food.calories_per_100g)}</span></div>
                      <div>Protein: <span className="font-medium">{formatNumber(food.protein_per_100g)}g</span></div>
                      <div>Karbo: <span className="font-medium">{formatNumber(food.carbs_per_100g)}g</span></div>
                      <div>Lemak: <span className="font-medium">{formatNumber(food.fat_per_100g)}g</span></div>
                    </div>
                  </div>
                  {food.serving_size && (
                    <div className="text-xs text-gray-500 mt-1">
                      Porsi: {food.serving_size}
                      {food.serving_weight && ` (${formatNumber(food.serving_weight)}g)`}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {getVerifiedBadge(food.is_verified)}
                    {getSourceBadge(food.source)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(food)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit makanan"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(food.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Hapus makanan"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t bg-gray-50 pagination-safe-area">
        <div className="mobile-pagination-compact">
          <div className="mobile-pagination-info">
            Menampilkan {pagination.offset + 1} sampai {Math.min(pagination.offset + pagination.limit, pagination.total)} dari {pagination.total} makanan
          </div>
          <div className="mobile-pagination-controls">
            <button
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              className="mobile-pagination-text-button mobile-pagination-touch"
            >
              Sebelumnya
            </button>
            <span className="mobile-pagination-page-info">
              Halaman {Math.floor(pagination.offset / pagination.limit) + 1} dari {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!pagination.hasMore}
              className="mobile-pagination-text-button mobile-pagination-touch"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 