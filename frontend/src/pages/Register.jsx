// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const Register = () => {
  const navigate = useNavigate();

  // Registration form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'customer', // default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update state when form inputs change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle registration form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Post registration data to backend
      const response = await apiClient.post('/auth/register/', formData);
      alert(response.data.message);
      // Redirect to login page after successful registration
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err.response?.data || err);
      setError(err.response?.data?.password || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 border rounded shadow-lg mt-10">
      <h2 className="text-3xl font-bold text-center mb-6">Register</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
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
              placeholder="Your username"
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
              placeholder="Your email"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
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
                placeholder="First name"
              />
            </div>
            <div className="flex-1">
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
                placeholder="Last name"
              />
            </div>
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
              placeholder="Phone number (optional)"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Password"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="password2">
              Confirm Password
            </label>
            <input
              type="password"
              id="password2"
              name="password2"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.password2}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
