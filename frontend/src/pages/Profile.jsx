// src/pages/Profile.jsx
import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/api';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Handle input changes in the profile form
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle profile update submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Update profile using your backend API endpoint (assumed to be /auth/profile/update/)
      const response = await apiClient.put('/auth/profile/update/', formData);
      setUser(response.data); // Update context with new user data if available
      setMessage('Profile updated successfully.');
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 border rounded shadow-lg mt-10">
      <h2 className="text-3xl font-bold text-center mb-6">Your Profile</h2>
      {message && <p className="text-center text-green-500 mb-4">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.email}
              onChange={handleChange}
              required
              disabled // Typically, email remains uneditable after registration
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="first_name">
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="last_name">
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="phone">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
