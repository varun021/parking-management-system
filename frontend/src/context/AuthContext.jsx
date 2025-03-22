import React, { createContext, useState, useEffect } from 'react';
import { requestOTP, verifyOTP, logoutUser } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const login = async (email, otp) => {
    const data = await verifyOTP(email, otp);
    setUser(data.user);
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, requestOTP }}>
      {children}
    </AuthContext.Provider>
  );
};
