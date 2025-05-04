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
    SLOTS: '/parking/slots/',  // Changed from /parking-slots/
    BOOKINGS: '/parking/bookings/',
    PAYMENTS: '/parking/payments/',
    FEEDBACKS: '/parking/feedbacks/',
    SUBSCRIPTIONS: '/parking/subscriptions/',
    SUBSCRIPTION_DETAILS: (id) => `/parking/subscriptions/${id}/`,
    CANCEL_SUBSCRIPTION: (id) => `/parking/subscriptions/${id}/cancel/`,
  },

  // Admin endpoints
  ADMIN: {
    DASHBOARD: '/parking/admin/dashboard/',
    USERS: '/parking/admin/users/',
    USER_DETAILS: (id) => `/parking/admin/users/${id}/`,
    UPDATE_USER: (id) => `/parking/admin/users/${id}/update/`,
    DELETE_USER: (id) => `/parking/admin/users/${id}/delete/`,
    REPORTS: {
      OVERVIEW: '/parking/admin/reports/', // Updated path
      REVENUE: '/parking/admin/reports/revenue/',
      BOOKINGS: '/parking/admin/reports/bookings/',
      USERS: '/parking/admin/reports/users/',
      EXPORT: '/parking/admin/reports/export/',
    },
    SLOTS: '/parking/admin/slots/',
    SLOT_DETAILS: (id) => `/parking/admin/slots/${id}/`,
  }
};