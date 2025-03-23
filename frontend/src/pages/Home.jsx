import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Clock, CreditCard, Shield, Map, HelpCircle, Search, ChevronRight } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Smart Parking
                <span className="block">Made Simple</span>
              </h1>
              <p className="text-xl opacity-90 mb-8">
                Find, book, and manage parking spots in real-time.
                No more circling the block.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/spots" 
                  className="bg-white text-blue-700 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-50 transition duration-200 shadow-lg"
                >
                  <Search size={20} />
                  Find Parking
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-900 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-950 transition duration-200 border border-blue-700"
                >
                  Get Started
                  <ChevronRight size={20} />
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <img 
                  src="src/assets/toolxox.com-iscout-CGeqarfxYl.png" 
                  alt="Parking illustration" 
                  className="rounded-lg w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Why Choose Our Platform</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our parking management system offers everything you need for a seamless parking experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-200 border border-gray-100">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg inline-block mb-4">
              <Car size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Easy Booking</h3>
            <p className="text-gray-600">
              Book parking spots in seconds with our intuitive interface. No complicated forms or processes.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-200 border border-gray-100">
            <div className="bg-green-100 text-green-600 p-3 rounded-lg inline-block mb-4">
              <Clock size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Real-time Availability</h3>
            <p className="text-gray-600">
              See available spots in real-time. No more guessing or driving around looking for parking.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-200 border border-gray-100">
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg inline-block mb-4">
              <CreditCard size={28} />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Secure Payments</h3>
            <p className="text-gray-600">
              Pay securely online with multiple payment options. Receipts automatically emailed to you.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to start using our parking system
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Find a Spot</h3>
              <p className="text-gray-600">Search for parking locations near your destination</p>
            </div>
            
            <div className="hidden md:block text-blue-300">
              <ChevronRight size={36} />
            </div>
            
            <div className="text-center max-w-xs">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Book & Pay</h3>
              <p className="text-gray-600">Reserve your spot and pay securely online</p>
            </div>
            
            <div className="hidden md:block text-blue-300">
              <ChevronRight size={36} />
            </div>
            
            <div className="text-center max-w-xs">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Park & Go</h3>
              <p className="text-gray-600">Use QR code for access and enjoy stress-free parking</p>
            </div>
          </div>
        </div>

        {/* Customer Benefits Section */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 rounded-xl shadow-md md:w-1/2">
            <h3 className="text-2xl font-semibold mb-6">For Customers</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-blue-400 bg-opacity-30 p-1 rounded mt-1">
                  <Shield size={18} />
                </div>
                <div>
                  <span className="font-medium block mb-1">Guaranteed Parking</span>
                  <span className="text-blue-100 text-sm">No more searching for spots - reserve ahead of time</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-400 bg-opacity-30 p-1 rounded mt-1">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="font-medium block mb-1">24/7 Access</span>
                  <span className="text-blue-100 text-sm">Book and access parking any time of day or night</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-400 bg-opacity-30 p-1 rounded mt-1">
                  <CreditCard size={18} />
                </div>
                <div>
                  <span className="font-medium block mb-1">Contactless Payments</span>
                  <span className="text-blue-100 text-sm">Pay online securely - no cash or ticket machines</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-400 bg-opacity-30 p-1 rounded mt-1">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <span className="font-medium block mb-1">Support When You Need It</span>
                  <span className="text-blue-100 text-sm">Customer service team available to assist you</span>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-800 text-white p-8 rounded-xl shadow-md md:w-1/2">
            <h3 className="text-2xl font-semibold mb-6">Premium Features</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-gray-700 p-1 rounded mt-1">
                  <Map size={18} />
                </div>
                <div>
                  <span className="font-medium block mb-1">Multiple Locations</span>
                  <span className="text-gray-300 text-sm">Access parking spots across multiple cities and venues</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-gray-700 p-1 rounded mt-1">
                  <Car size={18} />
                </div>
                <div>
                  <span className="font-medium block mb-1">Priority Spots</span>
                  <span className="text-gray-300 text-sm">Get access to premium locations closer to entrances</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-gray-700 p-1 rounded mt-1">
                  <CreditCard size={18} />
                </div>
                <div>
                  <span className="font-medium block mb-1">Flexible Pricing</span>
                  <span className="text-gray-300 text-sm">Hourly, daily, weekly, and monthly rates available</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-gray-700 p-1 rounded mt-1">
                  <Shield size={18} />
                </div>
                <div>
                  <span className="font-medium block mb-1">Enhanced Security</span>
                  <span className="text-gray-300 text-sm">24/7 monitored parking areas with camera surveillance</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Ready to simplify your parking experience?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who have transformed how they park.
            Get started today and never worry about parking again.
          </p>
          <Link 
            to="/register" 
            className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg inline-flex items-center justify-center gap-2 hover:bg-blue-700 transition duration-200 shadow-md text-lg"
          >
            Create Your Account
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;