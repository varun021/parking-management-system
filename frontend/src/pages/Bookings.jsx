import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import { AuthContext } from '../context/AuthContext';
import PaymentService from '../components/PaymentService';
import { useNavigate } from 'react-router-dom';

const Bookings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [formData, setFormData] = useState({
    slot: '',
    start_time: '',
    end_time: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    durationHours: 0,
    ratePerHour: 50,
    totalAmount: 0
  });

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
      toast.error('Failed to fetch locations');
    }
  };

  const fetchSlots = async (locationId) => {
    try {
      // Get all slots for the location
      const response = await apiClient.get(`${API_ENDPOINTS.PARKING.LOCATIONS}${locationId}/slots/`);
      
      // Filter only unoccupied slots
      const availableSlots = response.data.filter(slot => !slot.is_occupied);
      setSlots(availableSlots);
      
      // Reset selected slot when location changes
      setFormData(prev => ({
        ...prev,
        slot: ''
      }));
    } catch (err) {
      setError('Failed to fetch slots');
      toast.error('Failed to fetch slots');
    }
  };

  const calculateAmount = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = Math.ceil((end - start) / (1000 * 60 * 60));
    const ratePerHour = 50; // ₹50 per hour
    
    return {
      durationHours,
      ratePerHour,
      totalAmount: durationHours * ratePerHour
    };
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if ((name === 'start_time' || name === 'end_time') && newData.start_time && newData.end_time) {
        const calculation = calculateAmount(newData.start_time, newData.end_time);
        newData.amount = calculation.totalAmount;
        setBookingDetails(calculation);
      }
      return newData;
    });
  };

  const handleSlotChange = (e) => {
    const slotId = e.target.value;
    setFormData(prev => ({
      ...prev,
      slot: slotId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Just prepare the booking data without creating it
      setCurrentBooking({
        slot: formData.slot,
        start_time: formData.start_time,
        end_time: formData.end_time,
        amount: bookingDetails.totalAmount
      });
      setShowPayment(true);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to process booking');
      setError('Failed to process booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    // Payment and booking are already created, just update UI
    toast.success('Booking confirmed!');
    setShowPayment(false);
    setCurrentBooking(null);
    setFormData({
      slot: '',
      start_time: '',
      end_time: '',
      amount: ''
    });
    navigate('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Booking</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Location</label>
          <select
            className="w-full p-2 border rounded"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            required
          >
            <option value="">Select a location</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Parking Slot</label>
          <select
            name="slot"
            value={formData.slot}
            onChange={handleSlotChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select a slot</option>
            {slots.map(slot => (
              <option key={slot.id} value={slot.id}>
                Slot {slot.slot_number} - {slot.location_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Start Time</label>
          <input
            type="datetime-local"
            name="start_time"
            value={formData.start_time}
            onChange={handleDateChange}
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
            onChange={handleDateChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Amount (₹)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            readOnly
            className="w-full p-2 border rounded bg-gray-100"
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

      {formData.start_time && formData.end_time && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Booking Summary</h3>
          <div className="space-y-2">
            <p>Duration: {bookingDetails.durationHours} hours</p>
            <p>Rate per hour: ₹{bookingDetails.ratePerHour}</p>
            <p className="text-lg font-bold">Total Amount: ₹{bookingDetails.totalAmount}</p>
          </div>
        </div>
      )}

      {showPayment && currentBooking && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Complete Payment</h3>
          <PaymentService
            booking={currentBooking}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPayment(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Bookings;