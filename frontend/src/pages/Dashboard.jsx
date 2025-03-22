// src/pages/Dashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { API_ENDPOINTS } from '../services/endpoints';

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.PARKING.BOOKINGS);
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError('Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome, {user?.first_name || user?.username}!</p>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {loading ? (
        <p>Loading your bookings...</p>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="p-6 border rounded-lg shadow-md bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Booking ID</p>
                  <p className="font-semibold">#{booking.id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className={`font-semibold capitalize ${
                    booking.status === 'confirmed' ? 'text-green-600' :
                    booking.status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {booking.status}
                  </p>
                </div>
                {booking.location_name && (
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-semibold">{booking.location_name}</p>
                  </div>
                )}
                {booking.slot_number && (
                  <div>
                    <p className="text-gray-600">Slot Number</p>
                    <p className="font-semibold">#{booking.slot_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-semibold">
                    {Math.ceil((new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60))} hours
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Rate per hour</p>
                  <p className="font-semibold">₹50.00</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Amount</p>
                  <p className="font-semibold text-lg">₹{booking.total_amount || booking.amount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Booking Time</p>
                  <p className="font-semibold">{new Date(booking.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No bookings found.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
