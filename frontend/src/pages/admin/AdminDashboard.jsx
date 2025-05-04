import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';
import { API_ENDPOINTS } from '../../services/endpoints';
import { toast } from 'react-toastify';
import SlotManagement from '../../components/SlotManagement';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_bookings: 0,
    active_bookings: 0,
    completed_bookings: 0,
    cancelled_bookings: 0,
    total_revenue: 0,
    total_users: 0,
    total_locations: 0,
    total_slots: 0,
    occupied_slots: 0,
    recent_bookings: [],
    recent_payments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiClient.get('/parking/admin/dashboard/');
      setStats(response.data);
    } catch (err) {
      toast.error('Failed to fetch dashboard statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div>
          <Link
            to="/admin/locations"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Manage Locations
          </Link>
          <Link
            to="../slots" // Change this from "/admin/slots" to "../slots"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-4"
          >
            Manage Slots
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Summary Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold">₹{stats.total_revenue}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Active Bookings</h3>
          <p className="text-3xl font-bold">{stats.active_bookings}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Available Slots</h3>
          <p className="text-3xl font-bold">
            {stats.total_slots - stats.occupied_slots}/{stats.total_slots}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{stats.total_users}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Bookings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Slot</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_bookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="py-2">{booking.id}</td>
                    <td className="py-2">{booking.user}</td>
                    <td className="py-2">{booking.slot_number}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Payments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_payments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-2">{payment.payment_id}</td>
                    <td className="py-2">₹{payment.amount}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        payment.status === 'success' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-2">{new Date(payment.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;