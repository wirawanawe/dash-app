# 🔄 Auto-Refresh Implementation Guide

## Overview
This document describes the implementation of automatic data refresh after POST, PUT, and DELETE operations across the PHC Mobile application. The system ensures that data is always up-to-date after any CRUD operation.

## 🛠️ Implementation Details

### 1. Utility Functions (`/utils/refreshUtils.js`)

The core auto-refresh functionality is implemented in the `refreshUtils.js` file with the following key functions:

#### `withAutoRefresh(operation, refreshFunction, options)`
- **Purpose**: Wraps CRUD operations with automatic data refresh
- **Parameters**:
  - `operation`: The CRUD operation to perform (POST, PUT, DELETE)
  - `refreshFunction`: Function to call for data refresh
  - `options`: Additional options (delay, showLoading, setLoading)
- **Returns**: Promise that resolves when operation and refresh are complete

#### `createCrudOperation(method, url, data, refreshFunction, options)`
- **Purpose**: Creates a standardized CRUD operation with auto-refresh
- **Parameters**:
  - `method`: HTTP method (POST, PUT, DELETE)
  - `url`: API endpoint URL
  - `data`: Request body data
  - `refreshFunction`: Function to refresh data
  - `options`: Additional options
- **Returns**: Promise with auto-refresh functionality

#### `fetchWithRetry(url, options, retries)`
- **Purpose**: Enhanced fetch function with automatic retry and error handling
- **Parameters**:
  - `url`: The URL to fetch
  - `options`: Fetch options
  - `retries`: Number of retries (default: 2)
- **Returns**: Fetch response with retry logic

### 2. Standard Delay Times

```javascript
export const REFRESH_DELAYS = {
  POST: 300,    // 300ms for create operations
  PUT: 300,     // 300ms for update operations  
  DELETE: 200,  // 200ms for delete operations (faster since data is removed)
  BATCH: 500    // 500ms for batch operations
};
```

## 📁 Updated Files

### Dashboard Pages
1. **`/app/clinics/page.js`**
   - ✅ `handleDelete` - Auto-refresh after clinic deletion
   - ✅ `handleFormSubmit` - Auto-refresh after clinic creation/update

2. **`/app/doctors/page.js`**
   - ✅ `handleSubmit` - Auto-refresh after doctor creation/update
   - ✅ `handleDelete` - Auto-refresh after doctor deletion

3. **`/app/examinations/page.js`**
   - ✅ `handleSubmit` - Auto-refresh after examination creation/update
   - ✅ `handleDelete` - Auto-refresh after examination deletion

4. **`/app/users/page.js`**
   - ✅ `handleDeleteUser` - Auto-refresh after user deletion

### Mobile App Pages
1. **`/app/mobile/users/page.js`**
   - ✅ `handleDeleteUser` - Auto-refresh after mobile user deletion

2. **`/app/mobile/health_data/page.js`**
   - ✅ `handleFormSubmit` - Auto-refresh after health data creation/update
   - ✅ `handleDeleteHealthData` - Auto-refresh after health data deletion

### Form Components
1. **`/app/mobile/users/components/MobileUserForm.jsx`**
   - ✅ `handleSubmit` - Auto-refresh through parent callback

2. **`/app/mobile/food/components/FoodForm.jsx`**
   - ✅ `handleSubmit` - Auto-refresh through parent callback

3. **`/app/mobile/missions/components/MissionForm.jsx`**
   - ✅ `handleSubmit` - Auto-refresh through parent callback

## 🔧 Usage Examples

### Basic Usage
```javascript
import { createCrudOperation } from "@/utils/refreshUtils";

// DELETE operation with auto-refresh
const handleDelete = async (id) => {
  try {
    await createCrudOperation(
      "DELETE",
      `/api/items/${id}`,
      null,
      () => fetchItems(),
      { setLoading }
    );
    
    toast.success("Item berhasil dihapus");
  } catch (error) {
    toast.error("Gagal menghapus item");
  }
};
```

### POST/PUT Operation with Auto-refresh
```javascript
const handleSubmit = async (formData) => {
  try {
    const url = editingItem ? `/api/items/${editingItem.id}` : "/api/items";
    const method = editingItem ? "PUT" : "POST";

    await createCrudOperation(
      method,
      url,
      formData,
      () => fetchItems(),
      { setLoading }
    );

    toast.success("Item berhasil disimpan");
    setShowForm(false);
  } catch (error) {
    toast.error("Gagal menyimpan item");
  }
};
```

### Custom Refresh Function
```javascript
const handleComplexOperation = async (data) => {
  try {
    await createCrudOperation(
      "POST",
      "/api/complex-operation",
      data,
      async () => {
        // Multiple refresh operations
        await fetchPrimaryData();
        await fetchSecondaryData();
        await updateStats();
      },
      { setLoading }
    );
  } catch (error) {
    console.error("Operation failed:", error);
  }
};
```

## 🎯 Benefits

### 1. **Consistency**
- All CRUD operations automatically refresh data
- No manual refresh calls needed
- Consistent user experience across the application

### 2. **Reliability**
- Built-in retry mechanism for network failures
- Proper error handling and user feedback
- Cache busting to ensure fresh data

### 3. **Performance**
- Optimized delay times for different operations
- Loading states during refresh operations
- Efficient data fetching with proper error recovery

### 4. **Maintainability**
- Centralized refresh logic
- Easy to modify refresh behavior globally
- Consistent patterns across all components

## 🚀 Implementation Checklist

### For New Pages
- [ ] Import `createCrudOperation` from `@/utils/refreshUtils`
- [ ] Replace manual fetch calls with `createCrudOperation`
- [ ] Ensure proper error handling
- [ ] Test POST, PUT, and DELETE operations
- [ ] Verify data refresh after operations

### For Existing Pages
- [ ] Update import statements
- [ ] Replace `fetch()` calls with `createCrudOperation()`
- [ ] Remove manual `fetchData()` calls after operations
- [ ] Test all CRUD operations
- [ ] Verify loading states work correctly

## 🔍 Testing

### Manual Testing
1. **Create Operation**: Add new item → Verify data appears in list
2. **Update Operation**: Edit existing item → Verify changes are reflected
3. **Delete Operation**: Delete item → Verify item is removed from list
4. **Network Issues**: Test with poor connection → Verify retry mechanism

### Automated Testing
```javascript
// Example test for auto-refresh functionality
describe('Auto-refresh functionality', () => {
  it('should refresh data after POST operation', async () => {
    // Test implementation
  });
  
  it('should refresh data after PUT operation', async () => {
    // Test implementation
  });
  
  it('should refresh data after DELETE operation', async () => {
    // Test implementation
  });
});
```

## 📝 Notes

1. **Cache Busting**: The system automatically adds timestamps to prevent cached data
2. **Error Recovery**: Failed operations are retried up to 2 times
3. **Loading States**: Loading indicators are shown during refresh operations
4. **User Feedback**: Success/error messages are displayed appropriately

## 🔄 Future Enhancements

1. **Real-time Updates**: Consider WebSocket integration for live updates
2. **Optimistic Updates**: Update UI immediately, rollback on failure
3. **Batch Operations**: Support for multiple operations with single refresh
4. **Custom Delays**: Allow per-operation custom delay times
5. **Background Sync**: Sync data in background when app is offline

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: PHC Development Team
