import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import { toast } from 'react-toastify';

const Subscription = () => {
  const [locations, setLocations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  
  const [formData, setFormData] = useState({
    location: '',
    slot: '',
    duration: 'monthly',
    start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchLocations();
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchSlots(selectedLocation);
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await apiClient.get('/parking/locations/');
      setLocations(response.data);
    } catch (error) {
      toast.error(`Failed to fetch locations: ${error.message}`);
    }
  };

  const fetchSlots = async (locationId) => {
    try {
      const response = await apiClient.get(`/parking/slots/?location=${locationId}&is_occupied=false`);
      setSlots(response.data);
    } catch (error) {
        toast.error(`Failed to fetch slots: ${error.message}`);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PARKING.SUBSCRIPTIONS);
      setSubscriptions(response.data);
    } catch (error) {
        toast.error(`Failed to fetch subscriptions: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.PARKING.SUBSCRIPTIONS, formData);
      toast.success('Subscription created successfully');
      fetchSubscriptions();
      setFormData({
        location: '',
        slot: '',
        duration: 'monthly',
        start_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
        toast.error(`Failed to create subscription: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await apiClient.post(`/parking/subscriptions/${id}/cancel/`);
      toast.success('Subscription cancelled successfully');
      fetchSubscriptions();
    } catch (error) {
        toast.error(`Failed to cancel subscription: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Parking Subscriptions</h2>

      {/* Subscription Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Location</label>
            <select
              className="w-full p-2 border rounded"
              value={formData.location}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setFormData({ ...formData, location: e.target.value });
              }}
              required
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Slot</label>
            <select
              className="w-full p-2 border rounded"
              value={formData.slot}
              onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
              required
            >
              <option value="">Select Slot</option>
              {slots.map(slot => (
                <option key={slot.id} value={slot.id}>
                  {slot.slot_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Duration</label>
            <select
              className="w-full p-2 border rounded"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Start Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Subscription'}
        </button>
      </form>

      {/* Active Subscriptions */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Your Subscriptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map(subscription => (
            <div
              key={subscription.id}
              className="bg-white p-4 rounded-lg shadow border"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{subscription.location_name}</h4>
                  <p className="text-sm text-gray-600">Slot: {subscription.slot_number}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    subscription.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {subscription.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Duration: {subscription.duration}</p>
                <p>Start Date: {new Date(subscription.start_date).toLocaleDateString()}</p>
                <p>End Date: {new Date(subscription.end_date).toLocaleDateString()}</p>
                <p className="font-semibold mt-2">Amount: ₹{subscription.amount}</p>
              </div>
              {subscription.status === 'active' && (
                <button
                  onClick={() => handleCancel(subscription.id)}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscription;