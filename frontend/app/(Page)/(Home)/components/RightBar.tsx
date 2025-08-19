'use client';

import { useState } from 'react';
import { 
  FaHashtag,
  FaUser,
  FaSearch
} from 'react-icons/fa';

const RightSidebar = () => {
  const [trendingTopics] = useState([
    { id: 1, topic: 'Technology', count: '125K' },
    { id: 2, topic: 'WebDevelopment', count: '87K' },
    { id: 3, topic: 'Design', count: '64K' },
    { id: 4, topic: 'React', count: '52K' },
    { id: 5, topic: 'TypeScript', count: '38K' },
  ]);

  const [suggestedUsers] = useState([
    { id: 1, name: 'Alex Johnson', username: '@alexj', followers: '12K' },
    { id: 2, name: 'Maria Garcia', username: '@mariag', followers: '8K' },
    { id: 3, name: 'Sam Wilson', username: '@samw', followers: '15K' },
  ]);

  return (
    <div className="fixed right-0 top-0 h-full w-80 z-30 hidden xl:block">
      <div className="bg-black/80 backdrop-blur-xl h-full border-l border-white/10 p-6 overflow-y-auto">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-emerald-400" />
            <input 
              type="text" 
              placeholder="Search Nexus..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30"
            />
          </div>
        </div>
        
        {/* Trending Topics */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Trending Topics</h3>
          <div className="space-y-3">
            {trendingTopics.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                <div className="flex items-center">
                  <FaHashtag className="text-emerald-400 mr-2" />
                  <span className="text-white">{topic.topic}</span>
                </div>
                <span className="text-emerald-400 text-sm">{topic.count} posts</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Suggested Users */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Suggested Users</h3>
          <div className="space-y-4">
            {suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-900/50 rounded-full flex items-center justify-center mr-3">
                    <FaUser className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-emerald-400 text-sm">{user.username} · {user.followers} followers</div>
                  </div>
                </div>
                <button className="text-emerald-400 hover:text-white transition-colors text-sm font-medium">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer Links */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-wrap gap-3">
            <a href="#" className="text-emerald-400 hover:text-white text-sm transition-colors">Terms</a>
            <a href="#" className="text-emerald-400 hover:text-white text-sm transition-colors">Privacy</a>
            <a href="#" className="text-emerald-400 hover:text-white text-sm transition-colors">Cookies</a>
            <a href="#" className="text-emerald-400 hover:text-white text-sm transition-colors">Ads</a>
            <a href="#" className="text-emerald-400 hover:text-white text-sm transition-colors">More</a>
          </div>
          <div className="text-emerald-400 text-sm mt-3">© 2023 Nexus</div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;