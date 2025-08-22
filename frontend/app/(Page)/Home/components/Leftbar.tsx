'use client';

import { useState } from 'react';
import { 
  FaCompass,
  FaBell,
  FaHome,
  FaEnvelope,
  FaUserCircle,
  FaUsers,
  FaPlusCircle,
  FaHeart,
  FaBookmark
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const LeftSidebar = () => {
  const [activeTab, setActiveTab] = useState('home');
  const router = useRouter();

  const navItems = [
    { id: 'home', label: 'Home', icon: <FaHome />, route: '/' },
    { id: 'explore', label: 'Explore', icon: <FaCompass />, route: '/explore' },
    { id: 'notifications', label: 'Notifications', icon: <FaBell />, route: '/notifications' },
    { id: 'messages', label: 'Messages', icon: <FaEnvelope />, route: '/messages' },
    { id: 'communities', label: 'Communities', icon: <FaUsers />, route: '/communities' },
    { id: 'profile', label: 'Profile', icon: <FaUserCircle />, route: '/profile' },
  ];

  const handleNavigation = (item: { id: string; route: string }) => {
    setActiveTab(item.id);
    router.push(item.route);
  };

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed left-0 top-0 h-full z-30 flex"
    >
      <div className="bg-gray-900/95 backdrop-blur-2xl h-full border-r border-violet-500/20 flex flex-col items-start py-8 px-5 w-62">
        {/* Brand Logo */}
        <motion.div 
          className="mb-12 flex items-center justify-start w-full pl-2"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            whileHover={{ rotate: 5 }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <FaPlusCircle className="text-white text-2xl" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent ml-4"
          >
            +Me
          </motion.h1>
        </motion.div>

        {/* Navigation Items */}
        <div className="flex flex-col space-y-2 w-full">
          {navItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
              className={`p-4 rounded-xl flex items-center transition-all duration-300 group relative overflow-hidden ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 text-violet-200 shadow-lg"
                  : "text-violet-400 hover:text-violet-200 hover:bg-white/5"
              }`}
              onClick={() => handleNavigation(item)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className={`text-xl transition-transform duration-300 ${activeTab === item.id ? 'transform scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              
              <motion.span 
                className="text-lg ml-4 font-medium whitespace-nowrap"
              >
                {item.label}
              </motion.span>
              
              {activeTab === item.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-2 h-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full"
                />
              )}
              
              {/* Hover effect line */}
              <motion.div 
                className="absolute left-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-400 to-fuchsia-400"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          ))}
        </div>

        {/* Create Post Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
          whileHover={{ 
            scale: 1.03,
            boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.4), 0 5px 10px -5px rgba(217, 70, 239, 0.4)"
          }}
          whileTap={{ scale: 0.98 }}
          className="mt-8 w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white font-medium flex items-center justify-center shadow-lg relative overflow-hidden group"
        >
          {/* Shine effect on hover */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
          
          <FaPlusCircle className="text-xl" />
          <span className="ml-2">Create Post</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default LeftSidebar;