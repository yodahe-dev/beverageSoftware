'use client';

import { useState } from 'react';
import { 
  FaHashtag,
  FaUser,
  FaSearch,
  FaFire,
  FaCalendar,
  FaEllipsisH,
  FaPlus,
  FaBell,
  FaRegBell,
  FaChevronRight,
  FaRegClock,
  FaUsers,
  FaRegComment,
  FaHeart,
  FaCheck
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

const RightSidebar = () => {
  const [activeTab, setActiveTab] = useState('trending');
  const [followedUsers, setFollowedUsers] = useState<number[]>([]);

  const trendingTopics = [
    { id: 1, topic: 'WebDevelopment', tweets: '42.5K', category: 'Technology' },
    { id: 2, topic: 'UXDesign', tweets: '38.2K', category: 'Design' },
    { id: 3, topic: 'AI', tweets: '56.7K', category: 'Technology' },
  ];

  const suggestedUsers = [
    { id: 1, name: 'Alex Johnson', username: '@alexj', followers: '12K', avatar: '', isVerified: true },
    { id: 2, name: 'Maria Garcia', username: '@mariag', followers: '8K', avatar: '', isVerified: false },
    { id: 3, name: 'Sam Wilson', username: '@samw', followers: '15K', avatar: '', isVerified: true },
    { id: 4, name: 'Taylor Kim', username: '@tayk', followers: '23K', avatar: '', isVerified: true },
    { id: 5, name: 'Jordan Lee', username: '@jordanl', followers: '17K', avatar: '', isVerified: false },
     { id: 6, name: 'Taylor Kim', username: '@tayk', followers: '23K', avatar: '', isVerified: true },
    { id: 7, name: 'Jordan Lee', username: '@jordanl', followers: '17K', avatar: '', isVerified: false },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Web3 Conference', date: 'Tomorrow, 2:00 PM', participants: '1.2K' },
    { id: 2, title: 'Design Workshop', date: 'Aug 25, 4:00 PM', participants: '850' },
    { id: 3, title: 'Developer Meetup', date: 'Aug 28, 6:00 PM', participants: '1.5K' },
  ];

  const recentActivity = [
    { id: 1, user: 'Alex Johnson', action: 'liked your post', time: '2 min ago' },
    { id: 2, user: 'Maria Garcia', action: 'commented on your post', time: '15 min ago' },
    { id: 3, user: 'Sam Wilson', action: 'started following you', time: '1 hour ago' },
  ];

  const toggleFollow = (userId: number) => {
    if (followedUsers.includes(userId)) {
      setFollowedUsers(followedUsers.filter(id => id !== userId));
    } else {
      setFollowedUsers([...followedUsers, userId]);
    }
  };

  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed right-0 top-0 h-full w-[300px] xl:w-[400px] z-30 hidden lg:block"
    >
      <div className="bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-2xl h-full border-l border-violet-500/20 flex flex-col py-6 px-5">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-violet-400/70 z-10" />
            <input
              type="text"
              placeholder="Search +Me..."
              className="w-full bg-gray-800/60 border border-violet-500/20 rounded-xl py-3 pl-12 pr-4 text-violet-100 placeholder-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all duration-300 backdrop-blur-md"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-5 bg-gray-800/40 rounded-xl p-1 backdrop-blur-md border border-gray-700/50">
          {[
            { key: 'trending', icon: <FaFire className="text-sm" /> },
            { key: 'people', icon: <FaUsers className="text-sm" /> },
            { key: 'events', icon: <FaCalendar className="text-sm" /> },
            { key: 'activity', icon: <FaBell className="text-sm" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1.5",
                activeTab === tab.key
                  ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 text-violet-200 shadow-sm"
                  : "text-violet-400 hover:text-violet-200 hover:bg-white/5"
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}</span>
            </button>
          ))}
        </div>

        {/* Content Area with Scroll */}
        <div className="flex-1 overflow-y-auto scrollbar-dark pr-3">
          <div className="pr-2">
            <AnimatePresence mode="wait">
              {/* Trending Topics */}
              {activeTab === 'trending' && (
                <motion.div
                  key="trending"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-violet-200 flex items-center gap-2">
                      <FaFire className="text-orange-400" />
                      Trending Now
                    </h3>
                    <button className="text-violet-400 hover:text-violet-200 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                      <FaEllipsisH className="text-sm" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {trendingTopics.map((topic, index) => (
                      <motion.div 
                        key={topic.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/60 cursor-pointer transition-all duration-300 backdrop-blur-md border border-gray-700/30 hover:border-violet-500/20 group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-violet-200 font-medium group-hover:text-violet-100 transition-colors">
                                {topic.topic}
                              </span>
                              {index < 3 && (
                                <span className={cn(
                                  "text-xs px-1.5 py-0.5 rounded-full text-white",
                                  index === 0 ? "bg-rose-500" : 
                                  index === 1 ? "bg-amber-500" : 
                                  "bg-blue-500"
                                )}>
                                  #{index + 1}
                                </span>
                              )}
                            </div>
                            <div className="text-violet-400 text-sm mb-1">{topic.tweets} posts</div>
                            <div className="text-xs text-violet-500/80 font-medium">{topic.category}</div>
                          </div>
                          <button className="text-violet-400 hover:text-violet-200 p-1.5 rounded-full hover:bg-white/5 transition-colors ml-2">
                            <FaPlus className="text-xs" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Suggested Users */}
              {activeTab === 'people' && (
                <motion.div
                  key="people"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-violet-200 flex items-center gap-2">
                      <FaUsers className="text-blue-400" />
                      People to Follow
                    </h3>
                    <button className="text-violet-400 hover:text-violet-200 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                      <FaEllipsisH className="text-sm" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {suggestedUsers.map((user, index) => (
                      <motion.div 
                        key={user.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/60 transition-all duration-300 backdrop-blur-md border border-gray-700/30 hover:border-violet-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-11 h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <FaUser className="text-white text-sm" />
                              )}
                            </div>
                            {user.isVerified && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <FaCheck className="text-white text-[8px]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <div className="text-violet-200 font-medium text-sm">{user.name}</div>
                            </div>
                            <div className="text-violet-400 text-xs">{user.username}</div>
                            <div className="text-xs text-violet-500/80 mt-0.5">{user.followers} followers</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleFollow(user.id)}
                          className={cn(
                            "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                            followedUsers.includes(user.id)
                              ? "bg-gray-700 text-violet-300 border border-gray-600"
                              : "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-500/20"
                          )}
                        >
                          {followedUsers.includes(user.id) ? 'Following' : 'Follow'}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Upcoming Events */}
              {activeTab === 'events' && (
                <motion.div
                  key="events"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-violet-200 flex items-center gap-2">
                      <FaCalendar className="text-green-400" />
                      Upcoming Events
                    </h3>
                    <button className="text-violet-400 hover:text-violet-200 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                      <FaEllipsisH className="text-sm" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {upcomingEvents.map((event, index) => (
                      <motion.div 
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-gray-800/40 to-gray-800/10 hover:from-gray-800/50 hover:to-gray-800/20 cursor-pointer transition-all duration-300 backdrop-blur-md border border-violet-500/10 hover:border-violet-500/20 group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="text-violet-200 font-medium group-hover:text-violet-100 transition-colors">
                            {event.title}
                          </div>
                          <button className="text-violet-400 hover:text-violet-200 p-1.5 rounded-full hover:bg-white/5 transition-colors">
                            <FaRegBell className="text-xs" />
                          </button>
                        </div>
                        <div className="flex items-center text-violet-400 text-sm mb-3 gap-2">
                          <FaRegClock className="flex-shrink-0" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-violet-500/80 font-medium">{event.participants} interested</div>
                          <button className="text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-3.5 py-2 rounded-full flex items-center gap-1.5 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300">
                            Join <FaChevronRight className="text-[10px]" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recent Activity */}
              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-violet-200 flex items-center gap-2">
                      <FaBell className="text-yellow-400" />
                      Recent Activity
                    </h3>
                    <button className="text-violet-400 hover:text-violet-200 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                      <FaEllipsisH className="text-sm" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <motion.div 
                        key={activity.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/60 transition-all duration-300 backdrop-blur-md border border-gray-700/30 hover:border-violet-500/20 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 group-hover:from-violet-600/40 group-hover:to-fuchsia-600/40 transition-colors">
                            {activity.action.includes('liked') ? (
                              <FaHeart className="text-rose-400 text-xs" />
                            ) : activity.action.includes('commented') ? (
                              <FaRegComment className="text-blue-400 text-xs" />
                            ) : (
                              <FaUser className="text-violet-400 text-xs" />
                            )}
                          </div>
                          <div>
                            <div className="text-violet-200 text-sm">
                              <span className="font-medium">{activity.user}</span> {activity.action}
                            </div>
                            <div className="text-xs text-violet-500/80 mt-1.5">{activity.time}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-dark::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-dark::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-dark::-webkit-scrollbar-thumb {
          background: #4c1d95;
          border-radius: 4px;
        }
        .scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #5b21b6;
        }
      `}</style>
    </motion.div>
  );
};

export default RightSidebar;