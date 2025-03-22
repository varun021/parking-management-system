export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/auth/register/',
    LOGIN: '/auth/login/',
    VERIFY_OTP: '/auth/otp/verify/',
    REFRESH_TOKEN: '/auth/refresh/',
    LOGOUT: '/auth/logout/',
    PROFILE: '/auth/profile/',
    UPDATE_PROFILE: '/auth/profile/update/',
  },
  
  // Parking endpoints
  PARKING: {
    LOCATIONS: '/parking/locations/',
    SLOTS: '/parking/slots/',
    BOOKINGS: '/parking/bookings/',
    PAYMENTS: '/parking/payments/',
    FEEDBACKS: '/parking/feedbacks/',
  },

  // Admin endpoints
  ADMIN: {
    DASHBOARD: '/parking/admin/dashboard/',
    REPORTS: '/parking/admin/reports/',
    USERS: '/parking/admin/users/',
    SETTINGS: '/parking/admin/settings/',
  }
};