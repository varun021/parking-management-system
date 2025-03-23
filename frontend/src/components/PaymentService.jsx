import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../services/api';
import { CreditCard, Smartphone, Globe, Wallet } from 'lucide-react'; // Import icons

const PaymentService = ({ booking, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');

  const PAYMENT_METHODS = [
    { value: 'card', label: 'Credit/Debit Card', icon: <CreditCard size={20} /> },
    { value: 'upi', label: 'UPI', icon: <Smartphone size={20} /> },
    { value: 'netbanking', label: 'Net Banking', icon: <Globe size={20} /> },
    { value: 'wallet', label: 'Digital Wallet', icon: <Wallet size={20} /> }
  ];

  useEffect(() => {
    if (booking) {
      const duration = Math.ceil(
        (new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60)
      );
      const ratePerHour = 50;
      const total = duration * ratePerHour;

      setPaymentDetails({
        duration_hours: duration,
        rate_per_hour: ratePerHour,
        calculated_amount: total,
      });
    }
  }, [booking]);

  const formatDateForBackend = (dateString) => {
    return new Date(dateString).toISOString();
  };

  const checkSlotAvailability = async (slotId, startTime, endTime) => {
    try {
      const { data } = await apiClient.get(`/parking/slots/${slotId}/availability/`, {
        params: {
          start_time: formatDateForBackend(startTime),
          end_time: formatDateForBackend(endTime)
        }
      });
      return data.available;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  };

  const initializePayment = async () => {
    if (!booking || !paymentDetails) return;

    try {
      setLoading(true);
      setPaymentStatus('processing');

      // Check slot availability first
      const isAvailable = await checkSlotAvailability(
        booking.slot,
        booking.start_time,
        booking.end_time
      );

      if (!isAvailable) {
        throw new Error('Selected slot is no longer available for the chosen time period');
      }

      // Create booking first with properly formatted dates
      const { data: bookingResponse } = await apiClient.post('/parking/bookings/', {
        slot: booking.slot,
        start_time: formatDateForBackend(booking.start_time),
        end_time: formatDateForBackend(booking.end_time),
        amount: paymentDetails.calculated_amount,
      });

      // Initiate payment
      const { data: paymentResponse } = await apiClient.post('/parking/payments/initiate/', {
        booking_id: bookingResponse.id,
        payment_method: selectedPaymentMethod,
        amount: paymentDetails.calculated_amount
      });

      if (paymentResponse.success) {
        // Handle successful payment initiation
        const verificationResult = await handlePaymentVerification(
          paymentResponse.payment_id,
          paymentResponse.order_id,
          bookingResponse.id
        );

        if (verificationResult) {
          setPaymentStatus('success');
          toast.success('Payment successful!');
          onSuccess({ booking: bookingResponse, payment: paymentResponse });
        }
      } else {
        throw new Error(paymentResponse.error || 'Payment initialization failed');
      }

    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(error.message || error.response?.data?.error || 'Booking failed');
      setPaymentStatus('failed');

      // Cleanup if needed
      if (error.response?.data?.booking_id) {
        await handleFailedBooking(error.response.data.booking_id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentVerification = async (paymentId, orderId, bookingId) => {
    try {
      const { data } = await apiClient.post('/parking/payments/verify/', {
        payment_id: paymentId,
        order_id: orderId,
        booking_id: bookingId
      });

      if (data.success) {
        setPaymentStatus('success');
        toast.success('Payment verified successfully!');
        return true;
      } else {
        throw new Error(data.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error(error.response?.data?.error || 'Payment verification failed');
      return false;
    }
  };

  const handleFailedBooking = async (bookingId) => {
    try {
      await apiClient.delete(`/parking/bookings/${bookingId}/`);
    } catch (error) {
      console.error('Error cleaning up failed booking:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Complete Payment</h2>
          <button 
            onClick={onCancel} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {paymentDetails && (
          <div className="bg-blue-50 p-5 rounded-lg mb-6 border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-3">Booking Summary</h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Booking ID:</span>
                <span className="font-medium">{booking?.id || 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{paymentDetails.duration_hours} hours</span>
              </div>
              <div className="flex justify-between">
                <span>Rate per hour:</span>
                <span className="font-medium">₹{paymentDetails.rate_per_hour.toFixed(2)}</span>
              </div>
              <div className="h-px bg-blue-200 my-2"></div>
              <div className="flex justify-between text-lg font-bold text-blue-900">
                <span>Total Amount:</span>
                <span>₹{paymentDetails.calculated_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map(method => (
              <button
                key={method.value}
                onClick={() => setSelectedPaymentMethod(method.value)}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  selectedPaymentMethod === method.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                {method.icon}
                <span>{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {paymentStatus === 'failed' && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Payment failed. Please try again.
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={initializePayment}
            disabled={loading || paymentStatus === 'processing'}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                Pay Now
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Your payment information is securely processed</p>
          <div className="flex justify-center gap-2 mt-2">
            <span>🔒 Secure Payment</span>
            <span>•</span>
            <span>256-bit SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentService;