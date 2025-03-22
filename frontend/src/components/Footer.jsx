// src/components/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-200 p-4 mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} Parking Management System. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
