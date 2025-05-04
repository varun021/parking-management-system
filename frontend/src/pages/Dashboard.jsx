import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { API_ENDPOINTS } from '../services/endpoints';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const [activeFilter, setActiveFilter] = useState('all');
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, subscriptionsRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.PARKING.BOOKINGS),
          apiClient.get(API_ENDPOINTS.PARKING.SUBSCRIPTIONS)
        ]);
        setBookings(bookingsRes.data);
        setSubscriptions(subscriptionsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
      await apiClient.post(`${API_ENDPOINTS.PARKING.SUBSCRIPTIONS}${subscriptionId}/cancel/`);
      setSubscriptions(subscriptions.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: 'cancelled' } : sub
      ));
      toast.success('Subscription cancelled successfully');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeFilter === 'all') return true;
    return booking.status === activeFilter;
  });

  const getStatusBadgeClasses = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'confirmed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, <span className="font-semibold">{user?.first_name || user?.username}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0 space-x-2">
            <button
              onClick={() => navigate('/bookings')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              + New Booking
            </button>
            <button
              onClick={() => navigate('/subscriptions')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              + New Subscription
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-2 px-1 ${
              activeTab === 'bookings'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-2 px-1 ${
              activeTab === 'subscriptions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Subscriptions
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'bookings' ? (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <p>{error}</p>
              </div>
            )}

            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Bookings
              </button>
              <button
                onClick={() => setActiveFilter('confirmed')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeFilter === 'confirmed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setActiveFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveFilter('cancelled')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                  activeFilter === 'cancelled'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Cancelled
              </button>
            </div>
          </>

        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {subscriptions.length > 0 ? (
              subscriptions.map((subscription) => (
                <div key={subscription.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{subscription.location_name}</h3>
                      <p className="text-sm text-gray-600">Slot: {subscription.slot_number}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      subscription.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subscription.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 my-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Duration</p>
                      <p className="font-medium capitalize">{subscription.duration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Amount</p>
                      <p className="font-medium">₹{subscription.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Start Date</p>
                      <p className="font-medium">{new Date(subscription.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">End Date</p>
                      <p className="font-medium">{new Date(subscription.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {subscription.status === 'active' && (
                    <button
                      onClick={() => handleCancelSubscription(subscription.id)}
                      className="mt-4 text-red-600 hover:text-red-700 font-medium text-sm flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Subscription
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No active subscriptions</h3>
                <p className="text-gray-500 mb-4">Subscribe to a parking slot for regular access.</p>
                <button
                  onClick={() => navigate('/subscriptions')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Get Started with Subscription
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="animate-pulse flex flex-col items-center justify-center">
            <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Booking ID:</span>
                    <h3 className="text-lg font-bold">#{booking.id}</h3>
                  </div>
                  <span className={getStatusBadgeClasses(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                
                {booking.location_name && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Location</div>
                    <div className="font-medium">{booking.location_name}</div>
                    {booking.slot_number && (
                      <div className="text-sm text-gray-700 mt-1">Slot #{booking.slot_number}</div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Start</div>
                    <div className="font-medium">{formatDate(booking.start_time)}</div>
                    <div className="text-sm text-gray-700">{formatTime(booking.start_time)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">End</div>
                    <div className="font-medium">{formatDate(booking.end_time)}</div>
                    <div className="text-sm text-gray-700">{formatTime(booking.end_time)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">Total Amount</span>
                    <div className="text-lg font-bold text-blue-600">₹{booking.total_amount || booking.amount}</div>
                    <div className="text-xs text-gray-500">
                      {Math.ceil((new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60))} hours × ₹50.00
                    </div>
                  </div>
                  
                  {booking.status === 'confirmed' && (
                    <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                      View QR
                    </button>
                  )}
                  {booking.status === 'pending' && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
          <p className="text-gray-500 mb-4">You haven't made any bookings yet.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
            Make Your First Booking
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;