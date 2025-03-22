import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';

const ParkingSpots = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (locationId) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.PARKING.SLOTS}?location=${locationId}`);
      setSlots(response.data);
    } catch (err) {
      setError('Failed to fetch slots');
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Parking Spots</h1>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Select Location</label>
        <select 
          className="w-full p-2 border rounded"
          onChange={(e) => setSelectedLocation(e.target.value)}
          value={selectedLocation || ''}
        >
          <option value="">Select a location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name} - {location.available_slots} spots available
            </option>
          ))}
        </select>
      </div>

      {selectedLocation && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => (
            <div 
              key={slot.id} 
              className={`p-4 rounded-lg border ${
                slot.is_occupied ? 'bg-red-100' : 'bg-green-100'
              }`}
            >
              <h3 className="font-semibold">Slot {slot.slot_number}</h3>
              <p>Status: {slot.is_occupied ? 'Occupied' : 'Available'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParkingSpots;