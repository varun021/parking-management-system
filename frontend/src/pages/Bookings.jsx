import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import { AuthContext } from '../context/AuthContext';
import PaymentService from '../components/PaymentService';
import { useNavigate } from 'react-router-dom';

// Import shadcn components
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Alert,
  AlertDescription,
  AlertTitle 
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Car, CreditCard, Check } from 'lucide-react';

const Bookings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
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
  
  // State for date picker
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState('12:00');
  const [endDate, setEndDate] = useState(null);
  const [endTime, setEndTime] = useState('13:00');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("new-booking");

  useEffect(() => {
    fetchLocations();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchSlots(selectedLocation);
    }
  }, [selectedLocation]);
  
  // Effect to handle datetime changes
  useEffect(() => {
    if (startDate && endDate && startTime && endTime) {
      const startDateTime = new Date(startDate);
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);
      
      const endDateTime = new Date(endDate);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes);
      
      const start = startDateTime.toISOString();
      const end = endDateTime.toISOString();
      
      setFormData(prev => {
        const newData = { 
          ...prev, 
          start_time: start, 
          end_time: end 
        };
        
        const calculation = calculateAmount(start, end);
        newData.amount = calculation.totalAmount;
        setBookingDetails(calculation);
        
        return newData;
      });
    }
  }, [startDate, startTime, endDate, endTime]);

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

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PARKING.BOOKINGS);
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast.error('Failed to fetch bookings');
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

  const handleSlotChange = (slotId) => {
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
    setStartDate(null);
    setEndDate(null);
    setStartTime('12:00');
    setEndTime('13:00');
    fetchBookings(); // Refresh bookings after successful payment
    setActiveTab("my-bookings"); // Switch to my bookings tab
  };

  const handleVerifyPin = async (bookingId, pin, type) => {
    setLoading(true);
    try {
      const response = await apiClient.verifyBookingPin(bookingId, pin, type);
      toast.success(response.data.message);
      // Refresh booking data
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: {
        className: "bg-green-100 text-green-800 hover:bg-green-200",
        icon: <Check className="w-3 h-3 mr-1" />
      },
      pending: {
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        icon: <Clock className="w-3 h-3 mr-1" />
      },
      cancelled: {
        className: "bg-red-100 text-red-800 hover:bg-red-200",
        icon: <Clock className="w-3 h-3 mr-1" />
      }
    };
    
    const config = statusConfig[status] || { className: "bg-gray-100", icon: null };
    
    return (
      <Badge className={`flex items-center ${config.className}`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left">Parking Reservations</h1>
      
      <Tabs defaultValue="new-booking" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="new-booking">New Booking</TabsTrigger>
          <TabsTrigger value="my-bookings">My Bookings {bookings.length > 0 && <Badge className="ml-2 bg-blue-100 text-blue-800">{bookings.length}</Badge>}</TabsTrigger>
        </TabsList>
        
        {/* New Booking Tab */}
        <TabsContent value="new-booking" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center text-xl">
                <Car className="mr-2 h-5 w-5 text-blue-500" />
                Reserve a Parking Slot
              </CardTitle>
              <CardDescription>Complete the form below to secure your parking space</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Location Selector */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                    Location
                  </Label>
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Slot Selector - Only shown when location is selected */}
                {selectedLocation && (
                  <div className="space-y-2">
                    <Label htmlFor="slot" className="flex items-center">
                      <Car className="mr-2 h-4 w-4 text-gray-500" />
                      Parking Slot
                    </Label>
                    <Select
                      value={formData.slot}
                      onValueChange={handleSlotChange}
                      disabled={slots.length === 0}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder={slots.length === 0 ? "No available slots" : "Select a slot"} />
                      </SelectTrigger>
                      <SelectContent>
                        {slots.map(slot => (
                          <SelectItem key={slot.id} value={slot.id.toString()}>
                            Slot {slot.slot_number} - {slot.location_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {slots.length === 0 && selectedLocation && (
                      <p className="text-sm text-amber-600 mt-1">
                        No available slots at this location. Please try another location.
                      </p>
                    )}
                  </div>
                )}

                {/* Start and End Times */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date and Time */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-500" />
                      Start Time
                    </h3>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-white"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                            {startDate ? format(startDate, 'PPP') : <span className="text-gray-400">Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select
                        value={startTime}
                        onValueChange={setStartTime}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, hour) => (
                            <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                              {hour.toString().padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* End Date and Time */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-500" />
                      End Time
                    </h3>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-white"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                            {endDate ? format(endDate, 'PPP') : <span className="text-gray-400">Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            disabled={(date) => date < (startDate || new Date())}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select
                        value={endTime}
                        onValueChange={setEndTime}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, hour) => (
                            <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                              {hour.toString().padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Booking Summary */}
                {formData.start_time && formData.end_time && (
                  <Card className="mt-4 bg-gray-50 border border-blue-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <CreditCard className="mr-2 h-5 w-5 text-blue-500" />
                        Booking Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">{bookingDetails.durationHours} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate per hour:</span>
                          <span className="font-medium">₹{bookingDetails.ratePerHour}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-lg">
                          <span>Total Amount:</span>
                          <span className="font-bold text-blue-600">₹{bookingDetails.totalAmount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading || !formData.slot || !formData.start_time || !formData.end_time}
                >
                  {loading ? 'Processing...' : 'Reserve Now'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Payment Section */}
          {showPayment && currentBooking && (
            <Card className="mt-6 shadow-md border-t-4 border-blue-500">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-blue-500" />
                  Complete Payment
                </CardTitle>
                <CardDescription>Secure your booking by completing the payment</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <PaymentService
                  booking={currentBooking}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPayment(false)}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* My Bookings Tab */}
        <TabsContent value="my-bookings">
          <Card className="shadow-md">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center text-xl">
                <Car className="mr-2 h-5 w-5 text-blue-500" />
                Your Bookings
              </CardTitle>
              <CardDescription>View and manage your parking reservations</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {bookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                  {bookings.map(booking => (
                    <Card key={booking.id} className="border-l-4 hover:shadow-md transition-shadow" style={{ 
                      borderLeftColor: booking.status === 'confirmed' ? '#10b981' : 
                                      booking.status === 'pending' ? '#f59e0b' : '#ef4444' 
                    }}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mr-2">#{booking.id}</span>
                            {booking.location_name}
                          </CardTitle>
                          {getStatusBadge(booking.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 pt-0">
                        <div className="text-sm space-y-2 text-gray-600">
                          <div className="flex items-start">
                            <Car className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                            <div>
                              <div className="font-medium">Slot #{booking.slot_number}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <Clock className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {format(new Date(booking.start_time), 'MMM d, h:mma')} - {format(new Date(booking.end_time), 'h:mma')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center bg-blue-50 p-2 rounded mt-2">
                            <CreditCard className="w-4 h-4 mr-2 text-blue-500" />
                            <span className="font-medium text-blue-800">₹{booking.amount}</span>
                          </div>
                          
                          {booking.entry_time && (
                            <div className="flex items-center bg-green-50 p-2 rounded">
                              <Check className="w-4 h-4 mr-2 text-green-500" />
                              <div>
                                <span className="text-xs text-green-700">ENTRY</span>
                                <div className="font-medium text-green-800">
                                  {format(new Date(booking.entry_time), 'MMM d, h:mma')}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {booking.exit_time && (
                            <div className="flex items-center bg-blue-50 p-2 rounded">
                              <Check className="w-4 h-4 mr-2 text-blue-500" />
                              <div>
                                <span className="text-xs text-blue-700">EXIT</span>
                                <div className="font-medium text-blue-800">
                                  {format(new Date(booking.exit_time), 'MMM d, h:mma')}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      {booking.pin && (
                        <CardFooter className="border-t bg-gray-50 flex flex-col items-start pt-3">
                          <div className="w-full mb-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-600">Access PIN: </span>
                              <span className="font-mono bg-gray-200 px-3 py-1 rounded text-lg tracking-wider">{booking.pin}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 w-full">
                            <Button
                              onClick={() => handleVerifyPin(booking.id, booking.pin, 'entry')}
                              variant="outline"
                              className="flex-1 bg-green-500 text-white hover:bg-green-600"
                              disabled={booking.entry_time || loading}
                            >
                              {booking.entry_time ? 'Entry Complete' : 'Verify Entry'}
                            </Button>
                            <Button
                              onClick={() => handleVerifyPin(booking.id, booking.pin, 'exit')}
                              variant="outline"
                              className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                              disabled={!booking.entry_time || booking.exit_time || loading}
                            >
                              {booking.exit_time ? 'Exit Complete' : 'Verify Exit'}
                            </Button>
                          </div>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Car className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No bookings found</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Your parking reservations will appear here once you make a booking.
                  </p>
                  <Button 
                    className="mt-6 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActiveTab("new-booking")}
                  >
                    Create New Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Bookings;