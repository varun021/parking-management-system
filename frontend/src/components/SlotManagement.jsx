import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../services/endpoints';

const SlotManagement = () => {
  const [locations, setLocations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [newSlot, setNewSlot] = useState({
    slot_number: '',
    location: '',
    is_occupied: false,
    vehicle_type: 'car' // default value
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Fetch slots when location is selected
  useEffect(() => {
    if (selectedLocation) {
      fetchSlots(selectedLocation);
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PARKING.LOCATIONS);
      setLocations(response.data);
    } catch (err) {
      setError('Failed to fetch locations');
      console.error('Error fetching locations:', err);
    }
  };

  const fetchSlots = async (locationId) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.PARKING.SLOTS}?location=${locationId}`);
      setSlots(response.data);
    } catch (err) {
      setError('Failed to fetch slots');
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post(API_ENDPOINTS.PARKING.SLOTS, {
        ...newSlot,
        location: selectedLocation
      });
      setSlots([...slots, response.data]);
      toast.success('Slot added successfully');
      // Reset form
      setNewSlot({
        slot_number: '',
        location: '',
        is_occupied: false,
        vehicle_type: 'car'
      });
    } catch (err) {
      setError('Failed to add slot');
      toast.error('Failed to add slot');
      console.error('Error adding slot:', err);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    
    try {
      await apiClient.delete(`/parking-slots/${slotId}/`);
      setSlots(slots.filter(slot => slot.id !== slotId));
      toast.success('Slot deleted successfully');
    } catch (err) {
      toast.error('Failed to delete slot');
      console.error('Error deleting slot:', err);
    }
  };

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Slot Management</h2>
      
      {/* Location Selection */}
      <div className="mb-4">
        <label className="block mb-2">Select Location:</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">Select a location</option>
          {locations.map(location => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add New Slot Form */}
      <form onSubmit={handleAddSlot} className="mb-6 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-3">Add New Slot</h3>
        <div className="mb-3">
          <label className="block mb-1">Slot Number:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={newSlot.slot_number}
            onChange={(e) => setNewSlot({...newSlot, slot_number: e.target.value})}
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1">Vehicle Type:</label>
          <select
            className="w-full p-2 border rounded"
            value={newSlot.vehicle_type}
            onChange={(e) => setNewSlot({...newSlot, vehicle_type: e.target.value})}
          >
            <option value="car">Car</option>
            <option value="bike">Bike</option>
            <option value="truck">Truck</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Slot
        </button>
      </form>

      {/* Slots List */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-red-500 p-4 bg-red-100 rounded">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {slots.map(slot => (
            <div key={slot.id} className={`p-4 border rounded relative ${slot.is_occupied ? 'bg-red-100' : 'bg-green-100'}`}>
              <button
                onClick={() => handleDeleteSlot(slot.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <p><strong>Slot Number:</strong> {slot.slot_number}</p>
              <p><strong>Vehicle Type:</strong> {slot.vehicle_type}</p>
              <p><strong>Status:</strong> {slot.is_occupied ? 'Occupied' : 'Available'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SlotManagement;