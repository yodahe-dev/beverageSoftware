'use client';

import { useState } from 'react';
import { 
  FaCompass, FaBell, FaHome, FaEnvelope, FaUserCircle, FaUsers,
  FaPlusCircle, FaHeart, FaBookmark, FaSignOutAlt, FaCog, FaSearch,
  FaTimes, FaChevronLeft, FaMoon, FaSun, FaUser
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';

const LeftSidebar = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const router = useRouter();
  const { user: userInfo, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  const navItems = [
    { id: 'home', label: 'Home', icon: <FaHome />, route: '/' },
    { id: 'explore', label: 'Explore', icon: <FaCompass />, route: '/explore' },
    { id: 'notifications', label: 'Notifications', icon: <FaBell />, route: '/notifications', badge: 3 },
    { id: 'messages', label: 'Messages', icon: <FaEnvelope />, route: '/messages', badge: 7 },
    { id: 'communities', label: 'Communities', icon: <FaUsers />, route: '/communities' },
    { id: 'users', label: 'Users', icon: <FaUser />, route: '/users' },
  ];

  const secondaryItems = [
    { id: 'profile', label: 'Profile', icon: <FaUserCircle />, route: '/profile' },
  ];

  interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    route: string;
    badge?: number;
  }

  const handleNavigation = (item: NavItem): void => {
    setActiveTab(item.id);
    router.push(item.route);
    setIsExpanded(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 lg:hidden"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: -70, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed left-0 top-0 h-full z-50 flex`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <motion.div 
          layout
          className={`bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900 h-full border-r border-violet-500/20 flex flex-col items-start py-6 px-3 ${isExpanded ? 'w-64' : 'w-20'}`}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Brand Logo */}
          <motion.div className="mb-8 flex items-center justify-start w-full px-2" whileHover={{ scale: 1.02 }}>
            <motion.div whileHover={{ rotate: 5 }} transition={{ duration: 0.3 }} className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaPlusCircle className="text-white text-xl" />
            </motion.div>
            <AnimatePresence>
              {isExpanded && (
                <motion.h1 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-2xl font-bold bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent ml-3"
                >
                  +Me
                </motion.h1>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Navigation Items */}
          <div className="flex flex-col space-y-2 w-full">
            {navItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                className={`p-3 rounded-xl flex items-center transition-all duration-300 group relative overflow-hidden ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 text-violet-200 shadow-lg"
                    : "text-gray-400 hover:text-violet-200 hover:bg-white/5"
                } ${isExpanded ? 'justify-start' : 'justify-center'}`}
                onClick={() => handleNavigation(item)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                onMouseEnter={() => setShowTooltip(item.id)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <div className="relative">
                  <span className={`text-xl transition-transform duration-300 ${activeTab === item.id ? 'transform scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  {item.badge && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </motion.span>
                  )}
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-sm ml-3 font-medium whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {activeTab === item.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`${isExpanded ? 'ml-auto' : 'hidden'} w-2 h-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full`} />
                )}
                
                <motion.div className="absolute left-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-400 to-fuchsia-400" initial={{ width: 0 }} whileHover={{ width: '100%' }} transition={{ duration: 0.3 }} />

                <AnimatePresence>
                  {!isExpanded && showTooltip === item.id && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 20 }} exit={{ opacity: 0, x: 10 }} className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-50">
                      {item.label}
                      {item.badge && <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center inline-block">{item.badge}</span>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>

          {/* Create Post Button */}
          <motion.button onClick={() => router.push('/posts')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, type: "spring", stiffness: 100 }} whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.4), 0 5px 10px -5px rgba(217, 70, 239, 0.4)" }} whileTap={{ scale: 0.98 }} className={`mt-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white font-medium flex items-center relative overflow-hidden group ${isExpanded ? 'w-full px-4' : 'w-12 justify-center'}`}>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <FaPlusCircle className="text-lg" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="ml-2 text-sm">Create Post</motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Secondary Navigation Items */}
          <div className="mt-8 pt-6 border-t border-gray-800 w-full">
            <div className="flex flex-col space-y-2 w-full">
              {secondaryItems.map((item, index) => (
                <motion.button key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index, duration: 0.3 }} className={`p-3 rounded-xl flex items-center transition-all duration-300 group relative overflow-hidden ${activeTab === item.id ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 text-violet-200 shadow-lg" : "text-gray-400 hover:text-violet-200 hover:bg-white/5"} ${isExpanded ? 'justify-start' : 'justify-center'}`} onClick={() => handleNavigation(item)} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}>
                  <span className={`text-xl transition-transform duration-300 ${activeTab === item.id ? 'transform scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-sm ml-3 font-medium whitespace-nowrap">{item.label}</motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          </div>

          {/* User Profile Section */}
          <div className="mt-auto pt-6 border-t border-gray-800 w-full">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`flex items-center w-full p-3 rounded-xl bg-gray-800/30 hover:bg-white/5 transition-colors ${isExpanded ? 'justify-start' : 'justify-center'}`} onClick={handleLogout}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-white">
                {userInfo ? (userInfo.username?.charAt(0).toUpperCase() || 'U') : <FaUserCircle className="text-lg" />}
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="ml-3 text-left flex-1">
                    <p className="text-sm font-medium text-white truncate">{userInfo?.username || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{userInfo?.email || 'View profile'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isExpanded && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}><FaSignOutAlt className="text-gray-400" /></motion.div>}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {/* Expand/Collapse Button */}
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsExpanded(!isExpanded)} className="self-center mt-4 w-6 h-12 bg-gray-800 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-white">
          <FaChevronLeft className={`transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`} />
        </motion.button>
      </motion.div>
    </>
  );
};

export default LeftSidebar;
