// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { requestOTP } from '../services/auth';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Local state to manage email, otp, and UI mode (request vs verify)
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to request OTP from backend
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Call the API to request OTP
      await requestOTP(email);
      setOtpSent(true);
      alert('OTP has been sent to your email.');
    } catch (err) {
      console.error('Error requesting OTP:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to verify OTP and log in
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, otp);
      navigate('/dashboard'); // Redirect to dashboard after successful login
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded shadow-lg mt-10">
      <h2 className="text-3xl font-bold text-center mb-6">Login</h2>
      <form onSubmit={otpSent ? handleVerifyOTP : handleRequestOTP}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        {otpSent && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="otp">
              OTP
            </label>
            <input
              type="text"
              id="otp"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="Enter the OTP"
            />
          </div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
          disabled={loading}
        >
          {loading ? 'Processing...' : otpSent ? 'Verify OTP' : 'Request OTP'}
        </button>
      </form>
    </div>
  );
};

export default Login;
