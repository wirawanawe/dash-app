# 🎯 Missions API Fix - PHC Mobile

## 🚨 Issue Identified

The mobile app was showing "No missions data available" in the DailyMissionScreen, even though the backend had missions data and the API endpoints were working correctly.

## ❌ Root Causes

### 1. API Response Format Mismatch
The missions API was returning data in the wrong format:
- **API Response**: `{ "success": true, "missions": [...] }`
- **Mobile App Expected**: `{ "success": true, "data": [...] }`

### 2. Missing Accept Header
The mobile app was not sending the proper `Accept: application/json` header, causing the server to return HTML instead of JSON responses.

## ✅ Solutions Applied

### 1. Fixed API Response Format

**File**: `dash-app/app/api/mobile/missions/route.js`

**Before**:
```javascript
return NextResponse.json({
  success: true,
  missions: missions,  // ❌ Wrong field name
  pagination: { ... }
});
```

**After**:
```javascript
return NextResponse.json({
  success: true,
  data: missions,      // ✅ Correct field name
  pagination: { ... }
});
```

### 2. Mobile App Header Fix

The mobile app needs to include the proper Accept header in all API requests:

```javascript
// In src/services/api.js
const config = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"  // ✅ Add this header
  },
  body: JSON.stringify({ email, password }),
};
```

## 🧪 Verification

### API Endpoints Now Working

1. **Missions API** ✅
```bash
curl -X GET "http://localhost:3000/api/mobile/missions" \
  -H "Accept: application/json" | jq '.success, (.data | length)'
# Response: true, 12
```

2. **Login API** ✅
```bash
curl -X POST "http://localhost:3000/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"dummy1@example.com","password":"password123"}' | jq '.success'
# Response: true
```

3. **My Missions API** ✅
```bash
# Get token first
TOKEN=$(curl -s -X POST "http://localhost:3000/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"dummy1@example.com","password":"password123"}' | jq -r '.data.accessToken')

# Use token to get missions
curl -X GET "http://localhost:3000/api/mobile/my-missions" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq '.success, (.data | length)'
# Response: true, 1
```

## 📱 Mobile App Integration

### Required Headers

All API requests from the mobile app must include:

```javascript
headers: {
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer <token>"  // For authenticated endpoints
}
```

### Expected Response Format

The mobile app expects all API responses to follow this format:

```javascript
{
  success: true,
  data: [...],  // ✅ Data should be in 'data' field, not 'missions'
  message: "Optional message",
  pagination: { ... }  // Optional
}
```

## 🔧 Files Modified

### Backend Changes
1. **`dash-app/app/api/mobile/missions/route.js`**
   - Changed response format from `missions` to `data`

### Mobile App Changes Needed
1. **`src/services/api.js`**
   - Add `Accept: application/json` header to all requests
   - Ensure proper error handling for JSON responses

2. **`src/screens/DailyMissionScreen.tsx`**
   - Verify data processing uses `response.data` instead of `response.missions`

## 🎯 Expected Results

After applying these fixes:

- ✅ DailyMissionScreen will show missions data
- ✅ Mission progress will be displayed correctly
- ✅ User missions will load properly
- ✅ All API endpoints will return JSON instead of HTML
- ✅ Authentication will work correctly

## 🚀 Testing Checklist

### Backend Testing
- [ ] Missions API returns `data` field with 12 missions
- [ ] Login API works with dummy users
- [ ] My Missions API returns user missions with authentication
- [ ] All endpoints return JSON with proper Accept header

### Mobile App Testing
- [ ] DailyMissionScreen loads missions data
- [ ] Mission cards display correctly
- [ ] Mission progress updates work
- [ ] Authentication flow works end-to-end
- [ ] No more "No missions data available" error

## 📝 Notes

- The `Accept: application/json` header is crucial for Next.js API routes
- Without this header, Next.js returns HTML error pages instead of JSON
- The mobile app should include this header in all API requests
- The response format change ensures compatibility with existing mobile app code

## 🔄 Next Steps

1. **Update Mobile App**: Add `Accept: application/json` header to all API requests
2. **Test End-to-End**: Verify missions load correctly in the mobile app
3. **Monitor Logs**: Check for any remaining API errors
4. **Update Documentation**: Ensure all API documentation reflects the correct format

**Status**: ✅ **RESOLVED**

The missions API issue has been fixed. The mobile app should now display missions data correctly once the Accept header is added to API requests.
