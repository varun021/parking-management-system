import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  LayoutDashboard,
  Car,
  CalendarDays,
  User,
  Settings,
  LogOut,
  Shield,
  Map,
  BookOpen,
  CreditCard,
  MessageSquare,
  UserCog,
  Building,
  ChevronDown,
  ChevronRight,
  Activity,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ isMobile = false }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Define user role - if not logged in, consider as 'guest'
  const userRole = user?.role || 'guest';

  const navigation = [
    // Public navigation
    {
      name: 'Public',
      items: [
        { name: 'Home', icon: Home, path: '/', allowedRoles: ['guest', 'user', 'admin'] },
        { name: 'Login', icon: User, path: '/login', allowedRoles: ['guest'] },
        { name: 'Register', icon: UserCog, path: '/register', allowedRoles: ['guest'] },
      ]
    },
    // User navigation (only shown when logged in)
    {
      name: 'User',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', allowedRoles: ['customer', 'admin'] },
        { name: 'Parking Spots', icon: Car, path: '/spots', allowedRoles: ['customer', 'admin'] },
        { name: 'My Bookings', icon: BookOpen, path: '/bookings', allowedRoles: ['customer', 'admin'] },
        { name: 'Profile', icon: User, path: '/profile', allowedRoles: ['customer', 'admin'] },
      ]
    },
    // Admin navigation - Updated paths
    {
      name: 'Admin',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin', allowedRoles: ['admin'] },
        { name: 'Manage Locations', icon: Map, path: '/admin/locations', allowedRoles: ['admin'] },
        { name: 'Users', icon: UserCog, path: '/admin/users', allowedRoles: ['admin'] },
        { name: 'Reports', icon: Activity, path: '/admin/reports', allowedRoles: ['admin'] },
      ]
    }
  ];

  // Update the filter logic to show appropriate items based on role
  const filteredNavigation = navigation.map(group => ({
    ...group,
    items: group.items.filter(item => item.allowedRoles.includes(userRole))
  })).filter(group => group.items.length > 0);

  const toggleGroup = (groupName) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName);
  };

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    
    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
          ${isActive 
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md' 
            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
          }`}
      >
        <item.icon size={20} className={isActive ? 'text-white' : 'text-blue-500'} />
        {(!isCollapsed || isMobile) && (
          <span className="truncate">{item.name}</span>
        )}
        {isActive && !isCollapsed && (
          <motion.div 
            className="absolute left-0 w-1 h-8 bg-white rounded-r-full" 
            layoutId="activeIndicator"
          />
        )}
      </Link>
    );
  };

  const MobileMenu = () => (
    <AnimatePresence>
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 bg-white z-50 p-4 overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Car size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900">ParkEasy</span>
            </div>
            <button 
              onClick={() => setShowMobileMenu(false)}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-6">
            {filteredNavigation.map((group) => (
              <div key={group.name} className="space-y-2">
                <div className="text-sm font-medium text-gray-500 px-4">{group.name}</div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavItem key={item.name} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {user && (
            <div className="border-t mt-6 pt-6">
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all w-full font-medium"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Mobile Bottom Navigation Bar
  if (isMobile) {
    return (
      <>
        <button 
          onClick={() => setShowMobileMenu(true)}
          className="fixed top-4 right-4 z-40 bg-white p-2 rounded-full shadow-lg text-blue-600"
        >
          <Menu size={24} />
        </button>
        
        <MobileMenu />
        
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-40 shadow-lg"
        >
          {filteredNavigation.flatMap(group => group.items).slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex flex-col items-center justify-center p-2"
              >
                <div className={`p-2 rounded-full ${isActive ? 'bg-blue-100' : ''}`}>
                  <item.icon 
                    size={22} 
                    className={isActive ? 'text-blue-600' : 'text-gray-600'} 
                  />
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </motion.div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <>
      <motion.div 
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white h-screen fixed left-0 top-0 border-r shadow-sm p-4 transition-all duration-300 z-40 overflow-y-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and App Name */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Car size={24} />
              </div>
              {!isCollapsed && <span className="ml-3 text-xl font-bold">ParkEasy</span>}
            </div>
            {!isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(true)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <ChevronRight size={20} />
              </button>
            )}
            {isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(false)}
                className="absolute -right-3 top-20 bg-white border border-gray-200 text-blue-500 p-1 rounded-full shadow-md"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
            )}
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-6">
            {filteredNavigation.map((group) => (
              <div key={group.name} className="space-y-1">
                {!isCollapsed ? (
                  <div 
                    className="flex items-center justify-between text-sm font-medium text-gray-500 px-4 cursor-pointer"
                    onClick={() => toggleGroup(group.name)}
                  >
                    <span>{group.name}</span>
                    <ChevronDown 
                      size={16} 
                      className={`transform transition-transform ${expandedGroup === group.name ? 'rotate-180' : ''}`} 
                    />
                  </div>
                ) : (
                  <div className="border-b border-gray-100 mx-2 my-4"></div>
                )}
                <AnimatePresence initial={false}>
                  <motion.div 
                    className="space-y-1"
                    initial={false}
                    animate={{ height: expandedGroup === group.name || isCollapsed || expandedGroup === null ? 'auto' : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {group.items.map((item) => (
                      <NavItem key={item.name} item={item} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            ))}
          </nav>
          
          {/* User Profile and Logout */}
          {user && (
            <div className={`mt-6 pt-6 border-t border-gray-100 ${isCollapsed ? 'text-center' : ''}`}>
              {!isCollapsed && (
                <div className="flex items-center mb-4 px-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                    <User size={20} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                  </div>
                </div>
              )}
              <button
                onClick={logout}
                className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''} px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all w-full`}
              >
                <LogOut size={20} />
                {!isCollapsed && <span>Logout</span>}
              </button>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Add main content padding to avoid sidebar overlap */}
      <div className={`${isCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
        {/* Your main content here */}
      </div>
    </>
  );
};

export default Sidebar;