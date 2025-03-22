import React, { useState } from 'react';
import apiClient from '../services/api';

const Bookings = () => {
  const [formData, setFormData] = useState({
    slot: '',
    start_time: '',
    end_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.post('/parking/bookings/', formData);
      setSuccess('Booking created successfully!');
      setFormData({ slot: '', start_time: '', end_time: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Booking</h1>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Slot ID</label>
          <input
            type="text"
            name="slot"
            value={formData.slot}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">Start Time</label>
          <input
            type="datetime-local"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2">End Time</label>
          <input
            type="datetime-local"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </form>
    </div>
  );
};

export default Bookings;