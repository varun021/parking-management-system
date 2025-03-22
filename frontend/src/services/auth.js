import apiClient from './api';

export const requestOTP = async (email) => {
  const response = await apiClient.post('/auth/login/', { email });
  return response.data;
};

export const verifyOTP = async (email, otp) => {
  const response = await apiClient.post('/auth/otp/verify/', { email, otp });
  if (response.data.access) {
    localStorage.setItem('accessToken', response.data.access);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};
