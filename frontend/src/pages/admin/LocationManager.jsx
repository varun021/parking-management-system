import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import { API_ENDPOINTS } from '../../services/endpoints';

const LocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    total_slots: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PARKING.LOCATIONS);
      setLocations(response.data);
    } catch (err) {
      setError('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(API_ENDPOINTS.PARKING.LOCATIONS, formData);
      fetchLocations();
      setFormData({ name: '', address: '', total_slots: '' });
    } catch (err) {
      setError('Failed to create location');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await apiClient.delete(`${API_ENDPOINTS.PARKING.LOCATIONS}${id}/`);
        fetchLocations();
      } catch (err) {
        setError('Failed to delete location');
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Locations</h2>

      {/* Add Location Form */}
      <form onSubmit={handleSubmit} className="mb-8 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Slots</label>
            <input
              type="number"
              value={formData.total_slots}
              onChange={(e) => setFormData({ ...formData, total_slots: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Location
          </button>
        </div>
      </form>

      {/* Locations List */}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p>Loading locations...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <div key={location.id} className="border rounded-lg p-4 shadow">
              <h3 className="font-bold">{location.name}</h3>
              <p className="text-gray-600">{location.address}</p>
              <p>Total Slots: {location.total_slots}</p>
              <p>Available: {location.available_slots}</p>
              <div className="mt-4 space-x-2">
                <button
                  onClick={() => handleDelete(location.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationManager;