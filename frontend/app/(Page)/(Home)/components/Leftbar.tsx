'use client';

import { useState } from 'react';
import { 
  FaCompass,
  FaBell,
  FaCog,
  FaHome,
  FaEnvelope,
  FaUserCircle,
  FaUsers
} from 'react-icons/fa';


const LeftSidebar = () => {
  const [activeTab, setActiveTab] = useState('home');

  const navItems = [
    { id: 'home', label: 'Home', icon: <FaHome /> },
    { id: 'explore', label: 'Explore', icon: <FaCompass /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'messages', label: 'Messages', icon: <FaEnvelope /> },
    { id: 'communities', label: 'Communities', icon: <FaUsers /> },
    { id: 'profile', label: 'Profile', icon: <FaUserCircle /> },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-20 z-30 flex flex-col">
      <div className="bg-black/80 backdrop-blur-xl h-full border-r border-white/10 flex flex-col items-center py-6">
        <div className="mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`p-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400' 
                  : 'text-gray-400 hover:text-emerald-400 hover:bg-white/5'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="text-xl">{item.icon}</span>
            </button>
          ))}
        </div>
        
        <div className="mt-auto">
          <button className="p-3 rounded-xl flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-white/5 transition-all duration-300">
            <FaCog className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;