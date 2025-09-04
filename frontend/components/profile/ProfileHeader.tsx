"use client";

import { motion } from "framer-motion";

interface ProfileHeaderProps {
  profile: {
    profileImageUrl?: string;
    username: string;
    name?: string;
    bio?: string;
    createdAt: string;
    status?: string;
    openChat?: boolean;
  };
  posts: any[];
  followersCount: number;
  followingCount: number;
  setEditModalOpen: (value: boolean) => void;
  BACKEND_URL: string;
}

export default function ProfileHeader({
  profile,
  posts,
  followersCount,
  followingCount,
  setEditModalOpen,
  BACKEND_URL,
}: ProfileHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative pt-16 pb-10"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10]/70 to-[#111318]/90 backdrop-blur-sm"></div>

      <div className="relative max-w-5xl mx-auto px-4 flex flex-col items-center">
        {/* Profile Image */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative mb-6 group"
        >
          <motion.div 
            className="absolute inset-0 bg-[#12D6DF] rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {profile.profileImageUrl ? (
            <motion.img
              src={`${BACKEND_URL}${profile.profileImageUrl}`}
              alt={profile.username}
              className="relative w-32 h-32 rounded-full object-cover border-4 border-[#1A1F24] z-10"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          ) : (
            <motion.div 
              className="relative w-32 h-32 rounded-full bg-gradient-to-r from-[#1A1F24] to-[#14171A] flex items-center justify-center text-4xl font-bold text-[#E6EAF0] border-4 border-[#1A1F24] z-10"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {profile.username.charAt(0).toUpperCase()}
              <motion.div 
                className="absolute -inset-2 rounded-full border-2 border-[#12D6DF]/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
          )}

          {/* Online Status */}
          <motion.div 
            className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1A1F24] z-20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          />
        </motion.div>

        {/* Name & Username */}
        <motion.h1 
          className="text-4xl font-bold text-[#E6EAF0] mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {profile.name || `@${profile.username}`}
        </motion.h1>
        <motion.p 
          className="text-[#A9B4C2]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          @{profile.username}
        </motion.p>

        {/* Bio */}
        {profile.bio && (
          <motion.p 
            className="text-[#A9B4C2] text-center max-w-2xl mb-6 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {profile.bio}
          </motion.p>
        )}

        {/* Stats */}
        <motion.div 
          className="flex space-x-8 text-center mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { label: "Posts", value: posts.length, color: "#12D6DF" },
            { label: "Followers", value: followersCount, color: "#8B5CF6" },
            { label: "Following", value: followingCount, color: "#F59E0B" },
          ].map((stat) => (
            <div key={stat.label} className="relative group">
              <div className={`absolute -inset-1 bg-[${stat.color}]/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300`}></div>
              <div className="relative px-6 py-3 bg-[#14171A]/80 backdrop-blur-sm rounded-lg border border-[#222832]">
                <p className="text-2xl font-bold text-[#E6EAF0]">{stat.value}</p>
                <p className="text-[#A9B4C2] text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Tags */}
        <motion.div 
          className="flex flex-wrap gap-3 mt-6 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.span className="px-3 py-1 bg-[#12D6DF]/10 text-[#12D6DF] rounded-full text-sm backdrop-blur-sm border border-[#12D6DF]/20" whileHover={{ scale: 1.05 }}>
            Joined: {new Date(profile.createdAt).toLocaleDateString()}
          </motion.span>
          {profile.status && (
            <motion.span className="px-3 py-1 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-full text-sm backdrop-blur-sm border border-[#8B5CF6]/20" whileHover={{ scale: 1.05 }}>
              Status: {profile.status}
            </motion.span>
          )}
          {profile.openChat && (
            <motion.span className="px-3 py-1 bg-[#F59E0B]/10 text-[#F59E0B] rounded-full text-sm backdrop-blur-sm border border-[#F59E0B]/20" whileHover={{ scale: 1.05 }}>
              Open Chat: Enabled
            </motion.span>
          )}
        </motion.div>

        {/* Action Button */}
        <motion.div 
          className="flex gap-3 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditModalOpen(true)}
            className="px-3 py-2 bg-[#1A1F24] text-[#E6EAF0] font-semibold rounded-xl border border-[#222832] flex items-center"
          >
            Edit Profile
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
