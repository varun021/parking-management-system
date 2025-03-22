import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../services/api';

const PaymentService = ({ booking, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Calculate booking details when component mounts
  useEffect(() => {
    if (booking) {
      const duration = Math.ceil((new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60));
      const ratePerHour = 50;
      const total = duration * ratePerHour;
      
      setPaymentDetails({
        duration_hours: duration,
        rate_per_hour: ratePerHour,
        calculated_amount: total
      });
    }
  }, [booking]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      
      // Create the booking first
      const bookingResponse = await apiClient.post('/parking/bookings/', {
        slot: booking.slot,
        start_time: booking.start_time,
        end_time: booking.end_time,
        amount: paymentDetails.calculated_amount
      });

      // Then initiate payment
      const paymentResponse = await apiClient.post('/parking/payments/initiate/', {
        booking_id: bookingResponse.data.id,
        payment_method: 'fake_payment'
      });

      // Verify payment
      const verification = await apiClient.post('/parking/payments/verify/', {
        payment_id: 'fake_payment_' + Date.now(),
        order_id: paymentResponse.data.order_id,
        signature: 'fake_signature'
      });
      
      if (verification.data.success) {
        toast.success('Payment successful!');
        onSuccess({ ...verification.data, booking: bookingResponse.data });
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(error.response?.data?.error || 'Payment failed');
      
      // If booking was created but payment failed, delete the booking
      if (error.response?.data?.booking_id) {
        try {
          await apiClient.delete(`/parking/bookings/${error.response.data.booking_id}/`);
        } catch (deleteError) {
          console.error('Error deleting failed booking:', deleteError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Payment Details</h2>
        
        <div className="space-y-4">
          {paymentDetails && (
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Booking ID:</span>
                <span>{booking.id}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Duration:</span>
                <span>{paymentDetails.duration_hours} hours</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Rate per hour:</span>
                <span>₹{paymentDetails.rate_per_hour}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span>₹{paymentDetails.calculated_amount}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 disabled:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={initializePayment}
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentService;