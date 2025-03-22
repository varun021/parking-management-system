// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-2xl text-gray-700 mb-6">Oops! Page not found.</p>
      <p className="mb-8 text-gray-600">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600 transition duration-200"
      >
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;
