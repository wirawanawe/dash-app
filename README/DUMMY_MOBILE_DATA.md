# 📱 Dummy Mobile Data - PHC Mobile Application

## Overview
This document describes the comprehensive dummy data created for the PHC Mobile application to simulate real user scenarios and program participation.

## 🎯 Data Specifications

### User Distribution
- **Total Users**: 5 mobile users
- **Program Participants**: 4 users (80%)
- **Non-Participants**: 1 user (20%)

### Program Participation Details

#### User 1: Active Program Participant (7 Days)
- **Status**: Following wellness program for 7 days
- **Tracking Data**: 7 days of comprehensive tracking
- **Missions**: 3 active missions (70% progress)
- **Activities**: Water tracking, sleep tracking, mood tracking, fitness tracking

#### User 2: Long-term Participant (20 Days)
- **Status**: Following wellness program for 20 days
- **Tracking Data**: 10 days of tracking data (days 11-20)
- **Missions**: 4 active missions (85% progress)
- **Activities**: Consistent high-quality tracking data

#### User 3: Veteran Participant (30 Days)
- **Status**: Following wellness program for 30 days
- **Tracking Data**: 5 days of tracking data (days 26-30)
- **Missions**: 5 active missions (90% progress)
- **Activities**: Excellent compliance and performance

#### User 4: Program Graduate (Completed)
- **Status**: Completed 7-day program with satisfactory results
- **Tracking Data**: 7 days of comprehensive tracking
- **Missions**: 3 completed missions (100% progress)
- **Results**: Weight loss progress, excellent compliance

#### User 5: Non-Participant
- **Status**: Not following any wellness program
- **Tracking Data**: None
- **Missions**: None
- **Purpose**: Control group for comparison

## 📊 Data Categories Created

### 1. User Profiles
- **Basic Info**: Name, email, phone, password
- **Demographics**: Date of birth, gender, height, weight, blood type
- **Status**: Active/inactive status

### 2. Missions & Challenges
- **Mission Types**: Nutrition, fitness, sleep, mental health
- **Progress Tracking**: Active, completed, progress percentage
- **Points System**: Reward points for completion

### 3. Health Tracking Data
- **Water Intake**: Daily water consumption in ml
- **Sleep Quality**: Bedtime, wake time, duration, quality rating
- **Mood Tracking**: Mood levels, stress levels, energy levels
- **Fitness Activities**: Exercise type, duration, calories burned

### 4. Health Metrics
- **Weight Tracking**: Progressive weight changes
- **Activity Logs**: Exercise and wellness activities
- **Compliance Data**: Program adherence metrics

## 🚀 How to Run

### Option 1: Using Shell Script (Recommended)
```bash
cd dash-app
./scripts/create-dummy-mobile-data.sh
```

### Option 2: Using npm Script
```bash
cd dash-app
npm run create-dummy-mobile
```

### Option 3: Direct Node.js Execution
```bash
cd dash-app
node scripts/create-dummy-mobile-data.js
```

## 🔑 Test Credentials

| User | Email | Password | Program Status |
|------|-------|----------|----------------|
| User 1 | dummy1@example.com | password123 | Active (7 days) |
| User 2 | dummy2@example.com | password123 | Active (20 days) |
| User 3 | dummy3@example.com | password123 | Active (30 days) |
| User 4 | dummy4@example.com | password123 | Completed |
| User 5 | dummy5@example.com | password123 | Non-participant |

## 📈 Data Patterns

### User 1 (7 Days Active)
- **Water**: 2000-2500ml daily
- **Sleep**: 8-9 hours, good quality
- **Mood**: Happy, low stress, high energy
- **Fitness**: 30min walking, 150 calories

### User 2 (20 Days Active)
- **Water**: 2200-2500ml daily
- **Sleep**: 8.5 hours, excellent quality
- **Mood**: Very happy, low stress, very high energy
- **Fitness**: 45min running, 300 calories

### User 3 (30 Days Active)
- **Water**: 2500-2700ml daily
- **Sleep**: 10 hours, excellent quality
- **Mood**: Very happy, low stress, very high energy
- **Fitness**: 60min cycling, 400 calories

### User 4 (Completed Program)
- **Water**: 2500ml daily (perfect compliance)
- **Sleep**: 10 hours, excellent quality
- **Mood**: Very happy, low stress, very high energy
- **Fitness**: 60min mixed workout, 350 calories
- **Weight**: Progressive loss (0.2kg/day)

## 🗄️ Database Tables Populated

### Core Tables
- `mobile_users` - User profiles
- `missions` - Available wellness missions
- `user_missions` - User mission progress

### Tracking Tables
- `water_tracking` - Daily water intake
- `sleep_tracking` - Sleep quality and duration
- `mood_tracking` - Mood and stress levels
- `fitness_tracking` - Exercise activities
- `health_data` - Health metrics

## 🧹 Data Cleanup

The script automatically cleans up existing dummy data before creating new data:
- Removes users with email containing 'dummy'
- Cleans related tracking data
- Ensures fresh data for each run

## 🔄 Data Refresh

To refresh the dummy data:
```bash
cd dash-app
npm run create-dummy-mobile
```

This will:
1. Remove existing dummy data
2. Create fresh user profiles
3. Generate new tracking data
4. Set up mission progress

## 📝 Notes

- All dates are relative to current date
- Tracking data shows realistic patterns
- Mission progress reflects typical user behavior
- Data supports testing of all mobile app features
- Users represent different engagement levels

## 🎯 Use Cases

This dummy data supports testing of:
- User authentication and profiles
- Mission progress tracking
- Health data visualization
- Analytics and reporting
- Program completion workflows
- Dashboard statistics
- Mobile app features
