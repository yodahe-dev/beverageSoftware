"use client";

import { motion } from "framer-motion";
import { FaBars, FaPlusCircle, FaBell, FaSearch } from "react-icons/fa";

// Mobile Navigation Component
const MobileNav = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="xl:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-violet-500/20"
    >
      <div className="flex items-center justify-between p-4">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-violet-900/50 text-violet-400"
        >
          <FaBars />
        </motion.button>
        
        <div className="flex items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent flex items-center"
          >
            <FaPlusCircle className="mr-1 text-fuchsia-400" />
            <span>Me</span>
          </motion.div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-violet-900/50 text-violet-400"
          >
            <FaSearch />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-violet-900/50 text-violet-400"
          >
            <FaBell />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileNav;