# Facility Statistics Breakdown Feature

## Overview
Added facility breakdown statistics to the visits page. Each stats card (Total Kunjungan, Kunjungan Bulan Ini, Kunjungan Hari Ini) now displays the count breakdown by facility code.

## Changes Made

### 1. New API Endpoint: `/api/visits/facility-stats/route.js`
- Created new API endpoint to fetch facility statistics
- Supports fetching total, monthly, and today stats grouped by facility
- Returns data in format: `{ facilityCode, facilityName, total, monthly, today }`
- Uses parallel queries for efficient data fetching

### 2. Updated Visits Page: `app/visits/page.js`
- Added `facilityStats` state to store facility breakdown data
- Updated `fetchStats()` function to also fetch facility statistics
- Modified all three stats cards to display facility breakdown
- Each card shows facility code with corresponding count

## Display Format

### Total Kunjungan Card
```
21765
Total Kunjungan
Semua waktu
---
KD  xxxxx
TSK xxxxx
UIT xxxxx
```

### Kunjungan Bulan Ini Card
```
5432
Kunjungan Bulan Ini
[Month Year]
---
KD  xxxxx
TSK xxxxx
UIT xxxxx
```

### Kunjungan Hari Ini Card
```
234
Kunjungan Hari Ini
[Date]
---
KD  xxxxx
TSK xxxxx
UIT xxxxx
```

## Implementation Details

- Facility breakdown displayed with horizontal divider
- Shows facility code on left, count on right
- All facilities displayed (not limited to top 3)
- Scrollable area with max height for many facilities
- Data sorted by count in descending order
- Automatically refreshes when stats are updated

## API Response Format

```json
{
  "success": true,
  "data": [
    {
      "facilityCode": "KD",
      "facilityName": "Klinik Dasar",
      "total": 10543,
      "monthly": 2100,
      "today": 95
    },
    {
      "facilityCode": "TSK",
      "facilityName": "Toko Sehat Karyawan",
      "total": 8798,
      "monthly": 1800,
      "today": 82
    },
    {
      "facilityCode": "UIT",
      "facilityName": "Unit Integrasi Terpadu",
      "total": 2424,
      "monthly": 453,
      "today": 57
    }
  ]
}
```

## Features
- ✅ Real-time facility breakdown
- ✅ Scrollable display for many facilities
- ✅ Clean, organized presentation
- ✅ Automatic data refresh
- ✅ Parallel data fetching for performance

