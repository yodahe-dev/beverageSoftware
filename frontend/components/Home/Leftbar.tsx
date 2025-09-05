'use client';

import { useState } from 'react';
import { 
  FaCompass, FaBell, FaHome, FaEnvelope, FaUserCircle, FaUsers,
  FaPlusCircle, FaSignOutAlt, 
  FaChevronLeft, FaUser
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const LeftSidebar = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const router = useRouter();

  const userInfo = { username: '', email: '' };

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

  interface NavItem { id: string; label: string; icon: React.ReactNode; route: string; badge?: number }

  const handleNavigation = (item: NavItem) => {
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
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'var(--bg-dark-1)' }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: -70, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed left-0 top-0 h-full z-50 flex"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <motion.div 
          layout
          className="h-full border-r flex flex-col items-start py-6 px-3"
          style={{
            width: isExpanded ? '16rem' : '5rem',
            background: 'var(--bg-dark-2)',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: 'rgba(255,255,255,0.1)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Brand Logo */}
          <motion.div className="mb-8 flex items-center justify-start w-full px-2" whileHover={{ scale: 1.02 }}>
            <motion.div whileHover={{ rotate: 5 }} transition={{ duration: 0.3 }} className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--bg-brand-1)' }}>
              <FaPlusCircle className="text-white text-xl" />
            </motion.div>
            <AnimatePresence>
              {isExpanded && (
                <motion.h1 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-2xl font-bold ml-3"
                  style={{
                    background: 'var(--text-brand-1)',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }}
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
                className="p-3 rounded-xl flex items-center transition-all duration-300 group relative overflow-hidden  hover:text-violet-200 hover:bg-white/5"
                style={{
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  color: activeTab === item.id ? 'var(--color-brand-end)' : 'var(--text-muted)',
                  background: activeTab === item.id ? 'var(--hover-gradient-brand)' : 'transparent'
                }}
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
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 rounded-full h-5 w-5 flex items-center justify-center" style={{ background: '#ef4444', color: 'var(--text-light)', fontSize: '0.65rem' }}>
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
              </motion.button>
            ))}
          </div>

          {/* Create Post Button */}
          <motion.button 
            onClick={() => router.push('/posts')} 
            className="mt-8 py-3 rounded-xl font-medium flex items-center relative overflow-hidden group justify-center"
            style={{
              width: isExpanded ? '100%' : '3rem',
              background: 'var(--bg-brand-2)',
              color: 'var(--text-light)'
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaPlusCircle className="text-2xl text-center" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="ml-2 text-sm">Create Post</motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Secondary Items */}
          <div className="mt-8 pt-6 border-t w-full" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            {secondaryItems.map((item, index) => (
              <motion.button 
                key={item.id} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                className="p-3 rounded-xl flex items-center w-full"
                style={{
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  color: activeTab === item.id ? 'var(--color-brand-end)' : 'var(--text-muted)',
                  background: activeTab === item.id ? 'var(--hover-gradient-brand)' : 'transparent'
                }}
                onClick={() => handleNavigation(item)}
                whileHover={{ background: 'var(--hover-gradient-brand)' }}
              >
                <span>{item.icon}</span>
                {isExpanded && <span className="ml-3 text-sm font-medium">{item.label}</span>}
              </motion.button>
            ))}
          </div>

          {/* User Profile */}
          <div className="mt-auto pt-6 border-t w-full" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <motion.button className="flex items-center w-full p-3 rounded-xl" style={{ justifyContent: isExpanded ? 'flex-start' : 'center', background: 'var(--bg-dark-3)', color: 'var(--text-light)' }} onClick={handleLogout} whileHover={{ background: 'var(--hover-gradient-brand)', scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-brand-3)', color: 'var(--text-light)' }}>
                {userInfo.username?.charAt(0).toUpperCase() || <FaUserCircle />}
              </div>
              {isExpanded && (
                <div className="ml-3 text-left flex-1">
                  <p className="text-sm font-medium truncate">{userInfo.username || 'User'}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{userInfo.email || 'Unknown profile'}</p>
                </div>
              )}
              {isExpanded && <FaSignOutAlt className="text-gray-400 ml-2" />}
            </motion.button>
          </div>
        </motion.div>

        {/* Expand/Collapse Button */}
        <motion.button onClick={() => setIsExpanded(!isExpanded)} className="self-center mt-4 w-6 h-12 rounded-r-lg flex items-center justify-center" style={{ background: 'var(--bg-dark-1)', color: 'var(--text-muted)' }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <FaChevronLeft className={`transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`} />
        </motion.button>
      </motion.div>
    </>
  );
};

export default LeftSidebar;
