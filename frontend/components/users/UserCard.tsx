import { motion } from "framer-motion";
import { Users, UserCheck, FileText, Check, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCardProps {
  user: {
    id: string;
    username: string;
    name?: string;
    bio?: string;
    profileImageUrl?: string;
    isBadgeVerified?: boolean;
  };
  counts: {
    followers: number;
    following: number;
    posts: number;
  };
  isFollowing: boolean;
  isFollower: boolean;
  isUpdating: boolean;
  onUserClick: (username: string) => void;
  onFollowToggle: (id: string) => void;
  cardRef?: (node: HTMLDivElement | null) => void;
  index: number;
}

const UserCard = ({
  user,
  counts,
  isFollowing,
  isFollower,
  isUpdating,
  onUserClick,
  onFollowToggle,
  cardRef,
  index,
}: UserCardProps) => {
  return (
    <motion.div
      key={user.id}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative"
      ref={cardRef || null}
    >
      <div className="bg-[#14171A] rounded-2xl border border-[#222832] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
        {/* Glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#1A1F24] opacity-20 pointer-events-none" />

        {/* Avatar and user info */}
        <div className="relative p-6 flex flex-col items-center">
          <div className="relative mb-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-28 h-28 rounded-2xl bg-gradient-to-r from-[#12D6DF] to-[#8B5CF6] p-1.5 cursor-pointer"
              onClick={() => onUserClick(user.username)}
            >
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.username}
                  className="w-full h-full rounded-2xl object-cover border-4 border-[#14171A]"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-[#1A1F24] flex items-center justify-center text-2xl font-bold text-[#A9B4C2]">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>

            {user.isBadgeVerified && (
              <div className="absolute -bottom-1 -right-1 bg-[#12D6DF] rounded-full p-1.5 shadow-lg">
                <Check className="h-4 w-4 text-[#0B0D10]" />
              </div>
            )}
          </div>

          {/* Username and bio */}
          <div className="text-center mb-5 w-full">
            <h2
              className="text-xl font-bold text-[#E6EAF0] mb-1 cursor-pointer hover:text-[#12D6DF] transition-colors"
              onClick={() => onUserClick(user.username)}
            >
              {user.username}
            </h2>
            {user.name && (
              <p className="text-[#A9B4C2] text-sm mb-2">{user.name}</p>
            )}
            {user.bio ? (
              <p className="text-[#A9B4C2] text-sm line-clamp-2">{user.bio}</p>
            ) : (
              <p className="text-[#5E6775] text-sm italic">No bio yet...</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-around w-full mb-5 border-t border-[#222832] pt-4">
            <div className="text-center">
              <div className="flex items-center justify-center text-[#E6EAF0] font-semibold">
                <Users className="h-4 w-4 mr-1 text-[#12D6DF]" />
                {counts.followers}
              </div>
              <p className="text-[#A9B4C2] text-xs mt-1">Followers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-[#E6EAF0] font-semibold">
                <UserCheck className="h-4 w-4 mr-1 text-[#8B5CF6]" />
                {counts.following}
              </div>
              <p className="text-[#A9B4C2] text-xs mt-1">Following</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-[#E6EAF0] font-semibold">
                <FileText className="h-4 w-4 mr-1 text-[#F59E0B]" />
                {counts.posts}
              </div>
              <p className="text-[#A9B4C2] text-xs mt-1">Posts</p>
            </div>
          </div>
        </div>

        {/* Follow button */}
        <div className="mt-auto p-4 pt-0 flex gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              onFollowToggle(user.id);
            }}
            disabled={isUpdating}
            className={cn(
              "flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center",
              isFollowing
                ? "bg-[#1A1F24] text-[#E6EAF0] hover:bg-[#222832] border border-[#222832]"
                : isFollower
                ? "bg-[#F59E0B] text-[#0B0D10] hover:bg-[#FBBF24]"
                : "bg-gradient-to-r from-[#12D6DF] to-[#8B5CF6] text-[#0B0D10] hover:from-[#0FB5BA] hover:to-[#7C3AED]"
            )}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
              "Following"
            ) : isFollower ? (
              "Follow Back"
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Follow
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default UserCard;
