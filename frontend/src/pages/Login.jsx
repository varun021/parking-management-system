// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { requestOTP } from '../services/auth';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Local state to manage email, otp, and UI mode (request vs verify)
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Check for success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state after displaying it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Function to request OTP from backend
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Call the API to request OTP
      await requestOTP(email);
      setOtpSent(true);
      setSuccessMessage('OTP has been sent to your email.');
    } catch (err) {
      console.error('Error requesting OTP:', err);
      setError('Failed to send OTP. Please check your email and try again.');
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
      setError('Invalid OTP. Please try again or request a new one.');
    } finally {
      setLoading(false);
    }
  };

  // Function to go back to email input
  const handleBackToEmail = () => {
    setOtpSent(false);
    setOtp('');
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white border rounded-lg shadow-lg mt-10">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        {otpSent ? 'Enter Verification Code' : 'Sign In'}
      </h2>
      
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <form onSubmit={otpSent ? handleVerifyOTP : handleRequestOTP} className="space-y-6">
        {!otpSent ? (
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
            />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                We've sent a verification code to:
              </p>
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-800">{email}</span>
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none"
                >
                  Change
                </button>
              </div>
            </div>
            
            <label className="block text-gray-700 font-medium mb-2" htmlFor="otp">
              Verification Code
            </label>
            <input
              type="text"
              id="otp"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="Enter code"
              maxLength={6}
            />
          </div>
        )}
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 font-medium text-lg shadow-md"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {otpSent ? 'Verifying...' : 'Sending...'}
            </span>
          ) : (
            otpSent ? 'Sign In' : 'Send Verification Code'
          )}
        </button>
        
        {otpSent && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleRequestOTP}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none"
            >
              Didn't receive the code? Send again
            </button>
          </div>
        )}
        
        <div className="text-center mt-4">
          <p className="text-gray-600">
            {otpSent ? '' : "Don't have an account? "}
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              {otpSent ? 'Back to Sign In' : 'Create Account'}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;