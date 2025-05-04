import axios from 'axios';
import { API_ENDPOINTS } from './endpoints';

// const apiClient = axios.create({
//   baseURL: 'http://localhost:8000',
//   headers: { 
//     'Content-Type': 'application/json',
//     'Accept': 'application/json'
//   }
// });

const apiClient = axios.create({
  baseURL: window.location.hostname === 'localhost' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});


apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refresh: refreshToken });
          localStorage.setItem('accessToken', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return apiClient(originalRequest);
        } catch (err) {
          console.error('Token refresh failed:', err);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Add these methods to the api client
apiClient.verifyBookingPin = async (bookingId, pin, type) => {
  return await apiClient.post(`/parking/bookings/${bookingId}/verify-pin/`, {
    pin,
    type
  });
};

// Add this method to the api client
apiClient.checkSlotAvailability = async (slotId, startTime, endTime) => {
  return await apiClient.get(`/parking/slots/${slotId}/availability/`, {
    params: {
      start_time: startTime,
      end_time: endTime
    }
  });
};

const paymentEndpoints = {
  initiate: '/parking/payments/initiate/',
  verify: '/parking/payments/verify/',
  status: (paymentId) => `/parking/payments/${paymentId}/status/`,
};

export const initiatePayment = async (bookingId, paymentMethod, amount) => {
  return await apiClient.post(paymentEndpoints.initiate, {
    booking_id: bookingId,
    payment_method: paymentMethod,
    amount: amount
  });
};

export const verifyPayment = async (paymentId, orderId, bookingId) => {
  return await apiClient.post(paymentEndpoints.verify, {
    payment_id: paymentId,
    order_id: orderId,
    booking_id: bookingId
  });
};

export const getPaymentStatus = async (paymentId) => {
  return await apiClient.get(paymentEndpoints.status(paymentId));
};

export default apiClient;
