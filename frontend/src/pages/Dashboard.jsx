// src/pages/Dashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Fetch bookings; adjust endpoint if necessary (e.g., '/bookings/' or '/api/bookings/')
        const response = await apiClient.get('/bookings/');
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
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
      {loading ? (
        <p>Loading your bookings...</p>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="p-4 border rounded shadow">
              <p>
                <strong>Booking ID:</strong> {booking.id}
              </p>
              <p>
                <strong>Location:</strong> {booking.location_name}
              </p>
              <p>
                <strong>Slot:</strong> {booking.slot_number}
              </p>
              <p>
                <strong>Start Time:</strong> {new Date(booking.start_time).toLocaleString()}
              </p>
              <p>
                <strong>End Time:</strong> {new Date(booking.end_time).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {booking.status}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>No bookings found.</p>
      )}
    </div>
  );
};

export default Dashboard;
