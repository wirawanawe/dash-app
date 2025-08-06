import { useState } from 'react';
import { 
  Code, 
  Copy, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight,
  Globe,
  Database,
  Smartphone,
  Users,
  Calendar,
  Stethoscope,
  Utensils,
  Activity,
  Heart,
  FileText,
  Settings,
  MapPin
} from 'lucide-react';

const ApiDocumentation = ({ pageType }) => {
  const [expanded, setExpanded] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(null);

  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:3000';

  const apiEndpoints = {
    users: [
      {
        method: 'GET',
        endpoint: '/api/users',
        description: 'Get all users with pagination and filtering',
        parameters: [
          { name: 'search', type: 'string', description: 'Search by name or email' },
          { name: 'role', type: 'string', description: 'Filter by role (SUPERADMIN, ADMIN, DOCTOR, STAFF)' },
          { name: 'page', type: 'number', description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', description: 'Items per page (default: 10)' }
        ],
        example: `${baseUrl}/api/users?search=admin&role=ADMIN&page=1&limit=10`
      },
      {
        method: 'GET',
        endpoint: '/api/users/[id]',
        description: 'Get specific user by ID',
        example: `${baseUrl}/api/users/1`
      },
      {
        method: 'POST',
        endpoint: '/api/users',
        description: 'Create new user',
        body: {
          name: 'string',
          email: 'string',
          password: 'string',
          role: 'string',
          clinic_id: 'number (optional)',
          is_active: 'boolean (optional)'
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/users/[id]',
        description: 'Update user',
        body: {
          name: 'string (optional)',
          email: 'string (optional)',
          password: 'string (optional)',
          role: 'string (optional)',
          clinic_id: 'number (optional)',
          is_active: 'boolean (optional)'
        }
      },
      {
        method: 'DELETE',
        endpoint: '/api/users/[id]',
        description: 'Delete user',
        example: `${baseUrl}/api/users/1`
      }
    ],
    patients: [
      {
        method: 'GET',
        endpoint: '/api/patients',
        description: 'Get all patients with pagination and search',
        parameters: [
          { name: 'search', type: 'string', description: 'Search by patient name or MRN' },
          { name: 'page', type: 'number', description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', description: 'Items per page (default: 10)' }
        ],
        example: `${baseUrl}/api/patients?search=john&page=1&limit=10`
      },
      {
        method: 'GET',
        endpoint: '/api/patients/[id]',
        description: 'Get specific patient by ID',
        example: `${baseUrl}/api/patients/12345`
      },
      {
        method: 'GET',
        endpoint: '/api/patients/search',
        description: 'Search patients by name or MRN',
        parameters: [
          { name: 'q', type: 'string', description: 'Search query' }
        ],
        example: `${baseUrl}/api/patients/search?q=john`
      },
      {
        method: 'POST',
        endpoint: '/api/patients',
        description: 'Create new patient',
        body: {
          mrn: 'string',
          name: 'string',
          date_of_birth: 'string (YYYY-MM-DD)',
          gender: 'string (male, female)',
          address: 'string',
          phone: 'string',
          email: 'string',
          emergency_contact: 'string',
          emergency_phone: 'string',
          blood_type: 'string',
          allergies: 'string',
          medical_history: 'string'
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/patients/[id]',
        description: 'Update patient information',
        body: {
          name: 'string',
          date_of_birth: 'string (YYYY-MM-DD)',
          gender: 'string (male, female)',
          address: 'string',
          phone: 'string',
          email: 'string',
          emergency_contact: 'string',
          emergency_phone: 'string',
          blood_type: 'string',
          allergies: 'string',
          medical_history: 'string'
        }
      },
      {
        method: 'DELETE',
        endpoint: '/api/patients/[id]',
        description: 'Delete patient'
      }
    ],
    visits: [
      {
        method: 'GET',
        endpoint: '/api/visits',
        description: 'Get all visits with filtering and pagination',
        parameters: [
          { name: 'search', type: 'string', description: 'Search by patient name or visit ID' },
          { name: 'searchDate', type: 'string', description: 'Search by specific date' },
          { name: 'tglawal', type: 'string', description: 'Start date filter' },
          { name: 'tglakhir', type: 'string', description: 'End date filter' },
          { name: 'page', type: 'number', description: 'Page number' },
          { name: 'limit', type: 'number', description: 'Items per page' }
        ],
        example: `${baseUrl}/api/visits?search=john&tglawal=2024-01-01&tglakhir=2024-12-31&page=1&limit=10`
      },
      {
        method: 'GET',
        endpoint: '/api/patients/[id]/visits',
        description: 'Get visits for specific patient',
        parameters: [
          { name: 'id', type: 'string', description: 'Patient ID/MRN' },
          { name: 'page', type: 'number', description: 'Page number' },
          { name: 'limit', type: 'number', description: 'Items per page' }
        ],
        example: `${baseUrl}/api/patients/12345/visits?page=1&limit=10`
      },
      {
        method: 'GET',
        endpoint: '/api/visits/[id]',
        description: 'Get specific visit by ID',
        example: `${baseUrl}/api/visits/123`
      },
      {
        method: 'POST',
        endpoint: '/api/visits',
        description: 'Create new visit',
        body: {
          patient_id: 'string',
          visit_date: 'string (YYYY-MM-DD)',
          visit_time: 'string (HH:mm)',
          doctor_id: 'number',
          clinic_id: 'number',
          visit_type: 'string',
          chief_complaint: 'string',
          diagnosis: 'string',
          treatment: 'string',
          notes: 'string',
          status: 'string (scheduled, in_progress, completed, cancelled)'
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/visits/[id]',
        description: 'Update visit information',
        body: {
          visit_date: 'string (YYYY-MM-DD)',
          visit_time: 'string (HH:mm)',
          doctor_id: 'number',
          clinic_id: 'number',
          visit_type: 'string',
          chief_complaint: 'string',
          diagnosis: 'string',
          treatment: 'string',
          notes: 'string',
          status: 'string (scheduled, in_progress, completed, cancelled)'
        }
      },
      {
        method: 'DELETE',
        endpoint: '/api/visits/[id]',
        description: 'Delete visit'
      }
    ],
    doctors: [
      {
        method: 'GET',
        endpoint: '/api/doctors',
        description: 'Get all doctors with search',
        parameters: [
          { name: 'search', type: 'string', description: 'Search by doctor name or specialist' }
        ],
        example: `${baseUrl}/api/doctors?search=cardiology`
      },
      {
        method: 'GET',
        endpoint: '/api/doctors/[id]',
        description: 'Get specific doctor by ID',
        example: `${baseUrl}/api/doctors/123`
      },
      {
        method: 'POST',
        endpoint: '/api/doctors',
        description: 'Create new doctor',
        body: {
          name: 'string',
          specialist: 'string',
          license_number: 'string',
          phone: 'string',
          email: 'string',
          address: 'string'
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/doctors/[id]',
        description: 'Update doctor information',
        body: {
          name: 'string',
          specialist: 'string',
          license_number: 'string',
          phone: 'string',
          email: 'string',
          address: 'string'
        }
      },
      {
        method: 'DELETE',
        endpoint: '/api/doctors/[id]',
        description: 'Delete doctor'
      }
    ],
    clinics: [
      {
        method: 'GET',
        endpoint: '/api/clinics',
        description: 'Get all clinics with pagination and search',
        parameters: [
          { name: 'search', type: 'string', description: 'Search by clinic name' },
          { name: 'page', type: 'number', description: 'Page number' },
          { name: 'limit', type: 'number', description: 'Items per page' }
        ],
        example: `${baseUrl}/api/clinics?search=hospital&page=1&limit=10`
      },
      {
        method: 'GET',
        endpoint: '/api/clinics/[id]',
        description: 'Get specific clinic by ID',
        example: `${baseUrl}/api/clinics/123`
      },
      {
        method: 'POST',
        endpoint: '/api/clinics',
        description: 'Create new clinic',
        body: {
          name: 'string',
          code: 'string',
          address: 'string',
          phone: 'string',
          email: 'string',
          is_active: 'boolean'
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/clinics/[id]',
        description: 'Update clinic',
        body: {
          name: 'string',
          code: 'string',
          address: 'string',
          phone: 'string',
          email: 'string',
          is_active: 'boolean'
        }
      },
      {
        method: 'DELETE',
        endpoint: '/api/clinics/[id]',
        description: 'Delete clinic'
      }
    ],
    examinations: [
      {
        method: 'GET',
        endpoint: '/api/examinations',
        description: 'Get all examinations',
        parameters: [
          { name: 'search', type: 'string', description: 'Search by examination name' },
          { name: 'page', type: 'number', description: 'Page number' },
          { name: 'limit', type: 'number', description: 'Items per page' }
        ],
        example: `${baseUrl}/api/examinations?search=blood&page=1&limit=10`
      },
      {
        method: 'GET',
        endpoint: '/api/examinations/[id]',
        description: 'Get specific examination by ID',
        example: `${baseUrl}/api/examinations/123`
      },
      {
        method: 'POST',
        endpoint: '/api/examinations',
        description: 'Create new examination',
        body: {
          name: 'string',
          description: 'string',
          category: 'string',
          preparation: 'string',
          duration: 'string',
          cost: 'number',
          is_active: 'boolean'
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/examinations/[id]',
        description: 'Update examination',
        body: {
          name: 'string',
          description: 'string',
          category: 'string',
          preparation: 'string',
          duration: 'string',
          cost: 'number',
          is_active: 'boolean'
        }
      },
      {
        method: 'DELETE',
        endpoint: '/api/examinations/[id]',
        description: 'Delete examination'
      }
    ],
    mobile: {
      food: [
        {
          method: 'GET',
          endpoint: '/api/mobile/food',
          description: 'Get food database with search and filtering',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by food name' },
            { name: 'category', type: 'string', description: 'Filter by category' },
            { name: 'limit', type: 'number', description: 'Items per page (default: 20)' },
            { name: 'offset', type: 'number', description: 'Offset for pagination' }
          ],
          example: `${baseUrl}/api/mobile/food?search=rice&category=fruits&limit=20&offset=0`
        },
        {
          method: 'GET',
          endpoint: '/api/mobile/food/[id]',
          description: 'Get specific food item by ID',
          example: `${baseUrl}/api/mobile/food/123`
        },
        {
          method: 'GET',
          endpoint: '/api/mobile/food/categories',
          description: 'Get all food categories',
          example: `${baseUrl}/api/mobile/food/categories`
        },
        {
          method: 'POST',
          endpoint: '/api/mobile/food',
          description: 'Create new food item',
          body: {
            name: 'string',
            name_indonesian: 'string',
            category: 'string',
            calories_per_100g: 'number',
            protein_per_100g: 'number',
            carbs_per_100g: 'number',
            fat_per_100g: 'number',
            fiber_per_100g: 'number',
            sugar_per_100g: 'number',
            sodium_per_100g: 'number',
            serving_size: 'string',
            serving_weight: 'number',
            barcode: 'string',
            image_url: 'string',
            is_verified: 'boolean',
            source: 'string'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/mobile/food/[id]',
          description: 'Update food item',
          body: {
            name: 'string',
            name_indonesian: 'string',
            category: 'string',
            calories_per_100g: 'number',
            protein_per_100g: 'number',
            carbs_per_100g: 'number',
            fat_per_100g: 'number',
            fiber_per_100g: 'number',
            sugar_per_100g: 'number',
            sodium_per_100g: 'number',
            serving_size: 'string',
            serving_weight: 'number',
            barcode: 'string',
            image_url: 'string',
            is_verified: 'boolean',
            source: 'string'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/mobile/food/[id]',
          description: 'Delete food item'
        }
      ],
      health_data: [
        {
          method: 'GET',
          endpoint: '/api/mobile/health_data',
          description: 'Get health data entries',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by patient name' },
            { name: 'data_type', type: 'string', description: 'Filter by data type (blood_pressure, heart_rate, blood_sugar, weight, temperature, oxygen_saturation)' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/mobile/health_data?search=john&data_type=blood_pressure&page=1&limit=10`
        },
        {
          method: 'GET',
          endpoint: '/api/mobile/health_data/[id]',
          description: 'Get specific health data entry',
          example: `${baseUrl}/api/mobile/health_data/123`
        },
        {
          method: 'POST',
          endpoint: '/api/mobile/health_data',
          description: 'Create health data entry',
          body: {
            user_id: 'number',
            data_type: 'string (blood_pressure, heart_rate, blood_sugar, weight, temperature, oxygen_saturation)',
            value: 'string',
            unit: 'string',
            recorded_at: 'string (YYYY-MM-DDTHH:mm)',
            notes: 'string'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/mobile/health_data/[id]',
          description: 'Update health data entry',
          body: {
            data_type: 'string',
            value: 'string',
            unit: 'string',
            recorded_at: 'string (YYYY-MM-DDTHH:mm)',
            notes: 'string'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/mobile/health_data/[id]',
          description: 'Delete health data entry'
        }
      ],
      missions: [
        {
          method: 'GET',
          endpoint: '/api/mobile/missions',
          description: 'Get missions',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by mission title' },
            { name: 'category', type: 'string', description: 'Filter by category' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/mobile/missions?search=exercise&category=fitness&page=1&limit=10`
        },
        {
          method: 'GET',
          endpoint: '/api/mobile/missions/[id]',
          description: 'Get specific mission details',
          example: `${baseUrl}/api/mobile/missions/123`
        },
        {
          method: 'POST',
          endpoint: '/api/mobile/missions',
          description: 'Create new mission',
          body: {
            title: 'string',
            description: 'string',
            category: 'string',
            difficulty: 'string (easy, medium, hard)',
            points: 'number',
            duration_days: 'number',
            requirements: 'string',
            rewards: 'string'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/mobile/missions/[id]',
          description: 'Update mission',
          body: {
            title: 'string',
            description: 'string',
            category: 'string',
            difficulty: 'string (easy, medium, hard)',
            points: 'number',
            duration_days: 'number',
            requirements: 'string',
            rewards: 'string'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/mobile/missions/[id]',
          description: 'Delete mission'
        }
      ],
      users: [
        {
          method: 'GET',
          endpoint: '/api/mobile/users',
          description: 'Get mobile app users',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by user name or email' },
            { name: 'gender', type: 'string', description: 'Filter by gender (male, female)' },
            { name: 'is_active', type: 'boolean', description: 'Filter by active status' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/mobile/users?search=john&gender=male&is_active=true&page=1&limit=10`
        },
        {
          method: 'GET',
          endpoint: '/api/mobile/users/[id]',
          description: 'Get specific user details',
          example: `${baseUrl}/api/mobile/users/123`
        },
        {
          method: 'POST',
          endpoint: '/api/mobile/users',
          description: 'Create new mobile user',
          body: {
            name: 'string',
            email: 'string',
            phone: 'string',
            date_of_birth: 'string (YYYY-MM-DD)',
            gender: 'string (male, female)',
            height: 'number',
            weight: 'number',
            blood_type: 'string',
            emergency_contact: 'string',
            emergency_phone: 'string',
            address: 'string',
            city: 'string',
            province: 'string',
            postal_code: 'string',
            is_active: 'boolean'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/mobile/users/[id]',
          description: 'Update mobile user',
          body: {
            name: 'string',
            email: 'string',
            phone: 'string',
            date_of_birth: 'string (YYYY-MM-DD)',
            gender: 'string (male, female)',
            height: 'number',
            weight: 'number',
            blood_type: 'string',
            emergency_contact: 'string',
            emergency_phone: 'string',
            address: 'string',
            city: 'string',
            province: 'string',
            postal_code: 'string',
            is_active: 'boolean'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/mobile/users/[id]',
          description: 'Delete mobile user'
        }
      ],

      user_missions: [
        {
          method: 'GET',
          endpoint: '/api/mobile/user_missions',
          description: 'Get user mission assignments',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by user name or mission title' },
            { name: 'status', type: 'string', description: 'Filter by status (pending, in_progress, completed, failed)' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/mobile/user_missions?search=john&status=completed&page=1&limit=10`
        },
        {
          method: 'GET',
          endpoint: '/api/mobile/user_missions/[id]',
          description: 'Get specific user mission details',
          example: `${baseUrl}/api/mobile/user_missions/123`
        },
        {
          method: 'POST',
          endpoint: '/api/mobile/user_missions',
          description: 'Assign mission to user',
          body: {
            user_id: 'number',
            mission_id: 'number',
            status: 'string (pending, in_progress, completed, failed)',
            progress: 'number (0-100)',
            start_date: 'string (YYYY-MM-DD)',
            end_date: 'string (YYYY-MM-DD)',
            notes: 'string'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/mobile/user_missions/[id]',
          description: 'Update user mission progress',
          body: {
            status: 'string (pending, in_progress, completed, failed)',
            progress: 'number (0-100)',
            notes: 'string'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/mobile/user_missions/[id]',
          description: 'Remove user mission assignment'
        }
      ],
      mood_tracking: [
        {
          method: 'GET',
          endpoint: '/api/mobile/mood_tracking',
          description: 'Get mood tracking entries',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by user name' },
            { name: 'mood', type: 'string', description: 'Filter by mood type' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/mobile/mood_tracking?search=john&mood=happy&page=1&limit=10`
        },
        {
          method: 'GET',
          endpoint: '/api/mobile/mood_tracking/[id]',
          description: 'Get specific mood tracking entry',
          example: `${baseUrl}/api/mobile/mood_tracking/123`
        },
        {
          method: 'POST',
          endpoint: '/api/mobile/mood_tracking',
          description: 'Create mood tracking entry',
          body: {
            user_id: 'number',
            mood: 'string (happy, sad, angry, excited, calm, anxious, tired, energetic)',
            energy_level: 'number (1-10)',
            recorded_at: 'string (YYYY-MM-DDTHH:mm)',
            notes: 'string'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/mobile/mood_tracking/[id]',
          description: 'Update mood tracking entry',
          body: {
            mood: 'string',
            energy_level: 'number (1-10)',
            recorded_at: 'string (YYYY-MM-DDTHH:mm)',
            notes: 'string'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/mobile/mood_tracking/[id]',
          description: 'Delete mood tracking entry'
        }
      ],
      sleep_tracking: [
        {
          method: 'GET',
          endpoint: '/api/mobile/sleep_tracking',
          description: 'Get sleep tracking entries',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by user name' },
            { name: 'quality', type: 'string', description: 'Filter by sleep quality' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/mobile/sleep_tracking?search=john&quality=good&page=1&limit=10`
        },
        {
          method: 'GET',
          endpoint: '/api/mobile/sleep_tracking/[id]',
          description: 'Get specific sleep tracking entry',
          example: `${baseUrl}/api/mobile/sleep_tracking/123`
        },
        {
          method: 'POST',
          endpoint: '/api/mobile/sleep_tracking',
          description: 'Create sleep tracking entry',
          body: {
            user_id: 'number',
            sleep_date: 'string (YYYY-MM-DD)',
            sleep_hours: 'number',
            sleep_minutes: 'number',
            sleep_quality: 'string (excellent, good, fair, poor)',
            bedtime: 'string (YYYY-MM-DDTHH:mm)',
            wake_time: 'string (YYYY-MM-DDTHH:mm)',
            notes: 'string'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/mobile/sleep_tracking/[id]',
          description: 'Update sleep tracking entry',
          body: {
            sleep_hours: 'number',
            sleep_minutes: 'number',
            sleep_quality: 'string (excellent, good, fair, poor)',
            bedtime: 'string (YYYY-MM-DDTHH:mm)',
            wake_time: 'string (YYYY-MM-DDTHH:mm)',
            notes: 'string'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/mobile/sleep_tracking/[id]',
          description: 'Delete sleep tracking entry'
        }
      ]
    },
    settings: {
      users: [
        {
          method: 'GET',
          endpoint: '/api/settings/users',
          description: 'Get system users',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by user name or email' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/settings/users?search=admin&page=1&limit=10`
        },
        {
          method: 'POST',
          endpoint: '/api/settings/users',
          description: 'Create system user',
          body: {
            name: 'string',
            email: 'string',
            password: 'string',
            role: 'string (SUPERADMIN, ADMIN, DOCTOR, STAFF)',
            clinic_id: 'number (optional)',
            is_active: 'boolean'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/settings/users/[id]',
          description: 'Update system user',
          body: {
            name: 'string',
            email: 'string',
            password: 'string (optional)',
            role: 'string',
            clinic_id: 'number (optional)',
            is_active: 'boolean'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/settings/users/[id]',
          description: 'Delete system user'
        }
      ],
      doctors: [
        {
          method: 'GET',
          endpoint: '/api/settings/doctors',
          description: 'Get doctors for settings',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by doctor name' }
          ],
          example: `${baseUrl}/api/settings/doctors?search=cardiology`
        },
        {
          method: 'POST',
          endpoint: '/api/settings/doctors',
          description: 'Create doctor',
          body: {
            name: 'string',
            specialist: 'string',
            license_number: 'string',
            phone: 'string',
            email: 'string',
            address: 'string'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/settings/doctors/[id]',
          description: 'Update doctor',
          body: {
            name: 'string',
            specialist: 'string',
            license_number: 'string',
            phone: 'string',
            email: 'string',
            address: 'string'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/settings/doctors/[id]',
          description: 'Delete doctor'
        }
      ],
      clinics: [
        {
          method: 'GET',
          endpoint: '/api/settings/clinics',
          description: 'Get clinics for settings',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by clinic name' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/settings/clinics?search=hospital&page=1&limit=10`
        },
        {
          method: 'POST',
          endpoint: '/api/settings/clinics',
          description: 'Create clinic',
          body: {
            name: 'string',
            code: 'string',
            address: 'string',
            phone: 'string',
            email: 'string',
            is_active: 'boolean'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/settings/clinics/[id]',
          description: 'Update clinic',
          body: {
            name: 'string',
            code: 'string',
            address: 'string',
            phone: 'string',
            email: 'string',
            is_active: 'boolean'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/settings/clinics/[id]',
          description: 'Delete clinic'
        }
      ],
      companies: [
        {
          method: 'GET',
          endpoint: '/api/settings/companies',
          description: 'Get companies',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by company name' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/settings/companies?search=phc&page=1&limit=10`
        },
        {
          method: 'POST',
          endpoint: '/api/settings/companies',
          description: 'Create company',
          body: {
            name: 'string',
            code: 'string',
            address: 'string',
            phone: 'string',
            email: 'string',
            website: 'string',
            is_active: 'boolean'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/settings/companies/[id]',
          description: 'Update company',
          body: {
            name: 'string',
            code: 'string',
            address: 'string',
            phone: 'string',
            email: 'string',
            website: 'string',
            is_active: 'boolean'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/settings/companies/[id]',
          description: 'Delete company'
        }
      ],
      icd: [
        {
          method: 'GET',
          endpoint: '/api/settings/icd',
          description: 'Get ICD codes',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by ICD code or description' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/settings/icd?search=A00&page=1&limit=10`
        },
        {
          method: 'POST',
          endpoint: '/api/settings/icd',
          description: 'Create ICD code',
          body: {
            code: 'string',
            description: 'string',
            category: 'string',
            is_active: 'boolean'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/settings/icd/[id]',
          description: 'Update ICD code',
          body: {
            code: 'string',
            description: 'string',
            category: 'string',
            is_active: 'boolean'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/settings/icd/[id]',
          description: 'Delete ICD code'
        }
      ],
      insurance: [
        {
          method: 'GET',
          endpoint: '/api/settings/insurance',
          description: 'Get insurance providers',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by insurance name' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/settings/insurance?search=bpjs&page=1&limit=10`
        },
        {
          method: 'POST',
          endpoint: '/api/settings/insurance',
          description: 'Create insurance provider',
          body: {
            name: 'string',
            code: 'string',
            type: 'string',
            description: 'string',
            is_active: 'boolean'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/settings/insurance/[id]',
          description: 'Update insurance provider',
          body: {
            name: 'string',
            code: 'string',
            type: 'string',
            description: 'string',
            is_active: 'boolean'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/settings/insurance/[id]',
          description: 'Delete insurance provider'
        }
      ],
      polyclinics: [
        {
          method: 'GET',
          endpoint: '/api/settings/polyclinics',
          description: 'Get polyclinics',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by polyclinic name' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/settings/polyclinics?search=internal&page=1&limit=10`
        },
        {
          method: 'POST',
          endpoint: '/api/settings/polyclinics',
          description: 'Create polyclinic',
          body: {
            name: 'string',
            description: 'string',
            status: 'string (Aktif, Tidak Aktif)'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/settings/polyclinics/[id]',
          description: 'Update polyclinic',
          body: {
            name: 'string',
            description: 'string',
            status: 'string (Aktif, Tidak Aktif)'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/settings/polyclinics/[id]',
          description: 'Delete polyclinic'
        }
      ],
      treatments: [
        {
          method: 'GET',
          endpoint: '/api/settings/treatments',
          description: 'Get treatments',
          parameters: [
            { name: 'search', type: 'string', description: 'Search by treatment name' },
            { name: 'page', type: 'number', description: 'Page number' },
            { name: 'limit', type: 'number', description: 'Items per page' }
          ],
          example: `${baseUrl}/api/settings/treatments?search=therapy&page=1&limit=10`
        },
        {
          method: 'POST',
          endpoint: '/api/settings/treatments',
          description: 'Create treatment',
          body: {
            name: 'string',
            description: 'string',
            category: 'string',
            duration: 'string',
            cost: 'number',
            is_active: 'boolean'
          }
        },
        {
          method: 'PUT',
          endpoint: '/api/settings/treatments/[id]',
          description: 'Update treatment',
          body: {
            name: 'string',
            description: 'string',
            category: 'string',
            duration: 'string',
            cost: 'number',
            is_active: 'boolean'
          }
        },
        {
          method: 'DELETE',
          endpoint: '/api/settings/treatments/[id]',
          description: 'Delete treatment'
        }
      ]
    },
    regions: [
      {
        method: 'GET',
        endpoint: '/api/regions/provinces',
        description: 'Get all provinces',
        example: `${baseUrl}/api/regions/provinces`
      },
      {
        method: 'GET',
        endpoint: '/api/regions/cities',
        description: 'Get cities by province ID',
        parameters: [
          { name: 'provinceId', type: 'string', description: 'Province ID' }
        ],
        example: `${baseUrl}/api/regions/cities?provinceId=32`
      },
      {
        method: 'GET',
        endpoint: '/api/regions/districts',
        description: 'Get districts by city ID',
        parameters: [
          { name: 'cityId', type: 'string', description: 'City ID' }
        ],
        example: `${baseUrl}/api/regions/districts?cityId=3201`
      },
      {
        method: 'GET',
        endpoint: '/api/regions/villages',
        description: 'Get villages by district ID',
        parameters: [
          { name: 'districtId', type: 'string', description: 'District ID' }
        ],
        example: `${baseUrl}/api/regions/villages?districtId=320101`
      },
      {
        method: 'GET',
        endpoint: '/api/postal-codes',
        description: 'Get postal codes',
        parameters: [
          { name: 'search', type: 'string', description: 'Search by postal code or area name' },
          { name: 'page', type: 'number', description: 'Page number' },
          { name: 'limit', type: 'number', description: 'Items per page' }
        ],
        example: `${baseUrl}/api/postal-codes?search=40100&page=1&limit=10`
      }
    ],
    laboratory: [
      {
        method: 'GET',
        endpoint: '/api/laboratory/results',
        description: 'Get laboratory results',
        parameters: [
          { name: 'search', type: 'string', description: 'Search by patient name or test type' },
          { name: 'test_type', type: 'string', description: 'Filter by test type' },
          { name: 'page', type: 'number', description: 'Page number' },
          { name: 'limit', type: 'number', description: 'Items per page' }
        ],
        example: `${baseUrl}/api/laboratory/results?search=john&test_type=blood&page=1&limit=10`
      },
      {
        method: 'GET',
        endpoint: '/api/laboratory/results/[id]',
        description: 'Get specific laboratory result',
        example: `${baseUrl}/api/laboratory/results/123`
      },
      {
        method: 'POST',
        endpoint: '/api/laboratory/results',
        description: 'Create laboratory result',
        body: {
          patient_id: 'string',
          test_type: 'string',
          test_name: 'string',
          result_value: 'string',
          reference_range: 'string',
          unit: 'string',
          test_date: 'string (YYYY-MM-DD)',
          notes: 'string'
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/laboratory/results/[id]',
        description: 'Update laboratory result',
        body: {
          test_type: 'string',
          test_name: 'string',
          result_value: 'string',
          reference_range: 'string',
          unit: 'string',
          test_date: 'string (YYYY-MM-DD)',
          notes: 'string'
        }
      },
      {
        method: 'DELETE',
        endpoint: '/api/laboratory/results/[id]',
        description: 'Delete laboratory result'
      }
    ],
    auth: [
      {
        method: 'POST',
        endpoint: '/api/auth/login',
        description: 'User login',
        body: {
          email: 'string',
          password: 'string'
        }
      },
      {
        method: 'POST',
        endpoint: '/api/auth/logout',
        description: 'User logout'
      },
      {
        method: 'GET',
        endpoint: '/api/auth/me',
        description: 'Get current user profile'
      },
      {
        method: 'POST',
        endpoint: '/api/auth/register',
        description: 'User registration',
        body: {
          name: 'string',
          email: 'string',
          password: 'string'
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/profile/update',
        description: 'Update user profile',
        body: {
          name: 'string',
          email: 'string',
          password: 'string (optional)'
        }
      }
    ],
    chat: [
      {
        method: 'GET',
        endpoint: '/api/chat',
        description: 'Get chat conversations',
        parameters: [
          { name: 'search', type: 'string', description: 'Search by conversation title' },
          { name: 'page', type: 'number', description: 'Page number' },
          { name: 'limit', type: 'number', description: 'Items per page' }
        ],
        example: `${baseUrl}/api/chat?search=consultation&page=1&limit=10`
      },
      {
        method: 'GET',
        endpoint: '/api/chat/[id]',
        description: 'Get specific chat conversation',
        example: `${baseUrl}/api/chat/123`
      },
      {
        method: 'GET',
        endpoint: '/api/chat/users',
        description: 'Get chat users',
        example: `${baseUrl}/api/chat/users`
      },
      {
        method: 'POST',
        endpoint: '/api/chat',
        description: 'Create new chat conversation',
        body: {
          title: 'string',
          participants: 'array of user IDs',
          type: 'string (private, group)'
        }
      },
      {
        method: 'PUT',
        endpoint: '/api/chat/[id]',
        description: 'Update chat conversation',
        body: {
          title: 'string',
          participants: 'array of user IDs'
        }
      },
      {
        method: 'DELETE',
        endpoint: '/api/chat/[id]',
        description: 'Delete chat conversation'
      }
    ]
  };

  const getEndpointsForPage = (pageType) => {
    // Return specific endpoints based on page type
    switch (pageType) {
      case 'users':
        return apiEndpoints.users;
      
      case 'patients':
        return apiEndpoints.patients;
      
      case 'visits':
        return apiEndpoints.visits;
      
      case 'doctors':
        return apiEndpoints.doctors;
      
      case 'clinics':
        return apiEndpoints.clinics;
      
      case 'examinations':
        return apiEndpoints.examinations;
      
      case 'chat':
        return apiEndpoints.chat;
      
      case 'laboratory':
        return apiEndpoints.laboratory;
      
      case 'mobile':
        return {
          food: apiEndpoints.mobile.food,
          health_data: apiEndpoints.mobile.health_data,
          missions: apiEndpoints.mobile.missions,
          users: apiEndpoints.mobile.users
        };
      
      case 'mobile-food':
        return apiEndpoints.mobile.food;
      
      case 'mobile-users':
        return apiEndpoints.mobile.users;
      
      case 'mobile-health-data':
        return apiEndpoints.mobile.health_data;
      
      case 'mobile-missions':
        return apiEndpoints.mobile.missions;
      
      case 'mobile-user-missions':
        return apiEndpoints.mobile.user_missions;
      
      case 'mobile-mood-tracking':
        return apiEndpoints.mobile.mood_tracking;
      
      case 'mobile-sleep-tracking':
        return apiEndpoints.mobile.sleep_tracking;
      

      
      case 'settings':
        return apiEndpoints.settings;
      
      case 'settings-users':
        return apiEndpoints.settings.users;
      
      case 'settings-doctors':
        return apiEndpoints.settings.doctors;
      
      case 'settings-clinics':
        return apiEndpoints.settings.clinics;
      
      case 'settings-companies':
        return apiEndpoints.settings.companies;
      
      case 'settings-insurance':
        return apiEndpoints.settings.insurance;
      
      case 'settings-polyclinics':
        return apiEndpoints.settings.polyclinics;
      
      case 'settings-treatments':
        return apiEndpoints.settings.treatments;
      
      case 'settings-icd':
        return apiEndpoints.settings.icd;
      
      case 'auth':
        return apiEndpoints.auth;
      
      case 'regions':
        return apiEndpoints.regions;
      
      default:
        return [];
    }
  };

  const copyToClipboard = async (text, endpoint) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(endpoint);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getIconForEndpoint = (endpoint) => {
    if (endpoint.includes('/users/')) return <Users className="w-4 h-4" />;
    if (endpoint.includes('/mobile/')) return <Smartphone className="w-4 h-4" />;
    if (endpoint.includes('/patients/')) return <Users className="w-4 h-4" />;
    if (endpoint.includes('/visits/')) return <Calendar className="w-4 h-4" />;
    if (endpoint.includes('/doctors/')) return <Stethoscope className="w-4 h-4" />;
    if (endpoint.includes('/food/')) return <Utensils className="w-4 h-4" />;
    if (endpoint.includes('/health_data/')) return <Activity className="w-4 h-4" />;

    if (endpoint.includes('/settings/')) return <Settings className="w-4 h-4" />;
    if (endpoint.includes('/regions/')) return <MapPin className="w-4 h-4" />;
    if (endpoint.includes('/laboratory/')) return <FileText className="w-4 h-4" />;
    if (endpoint.includes('/auth/')) return <Database className="w-4 h-4" />;
    if (endpoint.includes('/chat/')) return <Globe className="w-4 h-4" />;
    return <Code className="w-4 h-4" />;
  };

  const endpoints = getEndpointsForPage(pageType);

  if (!endpoints || (Array.isArray(endpoints) && endpoints.length === 0)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Code className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">API Documentation</span>
          <span className="text-sm text-gray-500">(Postman Ready)</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {expanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {Array.isArray(endpoints) ? (
            endpoints.map((endpoint, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getIconForEndpoint(endpoint.endpoint)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="font-mono text-sm text-gray-700">{endpoint.endpoint}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(endpoint.example || endpoint.endpoint, endpoint.endpoint)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy endpoint"
                    >
                      {copiedEndpoint === endpoint.endpoint ? (
                        <span className="text-green-600 text-xs">Copied!</span>
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <a
                      href={`https://www.postman.com/collections/import?url=${encodeURIComponent(baseUrl + endpoint.endpoint)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Open in Postman"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                
                {endpoint.parameters && endpoint.parameters.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Parameters:</p>
                    <div className="space-y-1">
                      {endpoint.parameters.map((param, paramIndex) => (
                        <div key={paramIndex} className="flex items-center space-x-2 text-xs">
                          <span className="font-mono bg-gray-200 px-1 rounded">{param.name}</span>
                          <span className="text-gray-500">({param.type})</span>
                          <span className="text-gray-600">- {param.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {endpoint.body && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Request Body:</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(endpoint.body, null, 2)}
                    </pre>
                  </div>
                )}
                
                {endpoint.example && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Example URL:</p>
                    <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                      {endpoint.example}
                    </code>
                  </div>
                )}
              </div>
            ))
          ) : (
            Object.entries(endpoints).map(([category, categoryEndpoints]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-gray-900 capitalize">{category.replace('_', ' ')}</h4>
                {categoryEndpoints.map((endpoint, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getIconForEndpoint(endpoint.endpoint)}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                          endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                          endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {endpoint.method}
                        </span>
                        <span className="font-mono text-sm text-gray-700">{endpoint.endpoint}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(endpoint.example || endpoint.endpoint, endpoint.endpoint)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Copy endpoint"
                        >
                          {copiedEndpoint === endpoint.endpoint ? (
                            <span className="text-green-600 text-xs">Copied!</span>
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <a
                          href={`https://www.postman.com/collections/import?url=${encodeURIComponent(baseUrl + endpoint.endpoint)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Open in Postman"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </a>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                    
                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Parameters:</p>
                        <div className="space-y-1">
                          {endpoint.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="flex items-center space-x-2 text-xs">
                              <span className="font-mono bg-gray-200 px-1 rounded">{param.name}</span>
                              <span className="text-gray-500">({param.type})</span>
                              <span className="text-gray-600">- {param.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {endpoint.body && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Request Body:</p>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(endpoint.body, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {endpoint.example && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Example URL:</p>
                        <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                          {endpoint.example}
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Click the copy icon to copy the endpoint URL, or click the external link icon to open directly in Postman.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiDocumentation; 