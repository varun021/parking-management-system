import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Clock, MapPin, Calendar, CreditCard, Tag, AlertCircle } from 'lucide-react';
import apiClient from '../services/api';

const BookingDetails = ({ booking, onUpdate }) => {
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [pin, setPin] = useState('');

  const handlePinVerification = async (type) => {
    if (!pin) {
      toast.error('Please enter PIN');
      return;
    }

    setVerifyingPin(true);
    try {
      await apiClient.verifyBookingPin(booking.id, pin, type);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} verified successfully`);
      onUpdate && onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || 'PIN verification failed');
    } finally {
      setVerifyingPin(false);
      setPin('');
    }
  };

  // Format date for better readability
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Format date
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    // Format time
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateFormatter.format(date)} at ${timeFormatter.format(date)}`;
  };

  // Get status badge color based on booking status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5 mb-6 shadow-sm bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5">
        <h3 className="text-xl font-semibold text-gray-800">Booking Details</h3>
        <div className={`${getStatusColor(booking.status)} px-3 py-1 rounded-full text-sm font-medium mt-2 sm:mt-0`}>
          {booking.status}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-6">
        <div className="flex items-start">
          <MapPin className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-500 mb-1">Location</p>
            <p className="font-medium text-gray-900">{booking.location_name || 'Not specified'}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <Tag className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-500 mb-1">Slot Number</p>
            <p className="font-medium text-gray-900">{booking.slot_number || 'Not assigned'}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <Calendar className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-500 mb-1">Start Time</p>
            <p className="font-medium text-gray-900">{formatDate(booking.start_time)}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <Calendar className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-500 mb-1">End Time</p>
            <p className="font-medium text-gray-900">{formatDate(booking.end_time)}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <CreditCard className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-500 mb-1">Amount</p>
            <p className="font-medium text-gray-900">₹{(booking.total_amount || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {booking.pin && (
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mt-5">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            PIN Verification
          </h4>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full sm:w-32 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                maxLength={6}
              />
            </div>
            
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <button
                onClick={() => handlePinVerification('entry')}
                disabled={verifyingPin || booking.entry_time}
                className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-300 disabled:text-gray-500 transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {verifyingPin ? 'Verifying...' : 'Verify Entry'}
              </button>
              
              <button
                onClick={() => handlePinVerification('exit')}
                disabled={verifyingPin || !booking.entry_time || booking.exit_time}
                className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-300 disabled:text-gray-500 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {verifyingPin ? 'Verifying...' : 'Verify Exit'}
              </button>
            </div>
          </div>
          
          {(booking.entry_time || booking.exit_time) && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
              {booking.entry_time && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-green-600 mr-2" />
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Entry Time:</span>{' '}
                    <span className="text-gray-600">{formatDate(booking.entry_time)}</span>
                  </p>
                </div>
              )}
              
              {booking.exit_time && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-blue-600 mr-2" />
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">Exit Time:</span>{' '}
                    <span className="text-gray-600">{formatDate(booking.exit_time)}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingDetails;