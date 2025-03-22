import React from 'react';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">Welcome to Parking Management System</h1>
      <div className="text-center">
        <p className="text-xl mb-4">Find and book parking spots with ease</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="p-6 border rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">For Customers</h2>
            <ul className="text-left list-disc list-inside">
              <li>Easy booking process</li>
              <li>Real-time availability</li>
              <li>Secure payments</li>
              <li>QR code access</li>
            </ul>
          </div>
          <div className="p-6 border rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <ul className="text-left list-disc list-inside">
              <li>Multiple locations</li>
              <li>24/7 access</li>
              <li>Online payments</li>
              <li>Customer support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;