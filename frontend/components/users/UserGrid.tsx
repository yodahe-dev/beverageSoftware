import { AnimatePresence, motion } from "framer-motion";
import UserCardSkeleton from "./UserCardSkeleton";
import UserCard from "./UserCard";
import { Loader2, Users } from "lucide-react";

interface UserGridProps {
  initialLoad: boolean;
  users: Array<{
    id: string;
    username: string;
    name?: string;
    bio?: string;
    profileImageUrl?: string;
    isBadgeVerified?: boolean;
  }>;
  userCounts: Record<string, { followers: number; following: number; posts: number }>;
  following: Set<string>;
  followers: Set<string>;
  updatingFollow: Set<string>;
  handleUserClick: (username: string) => void;
  handleFollowToggle: (id: string) => void;
  lastUserRef?: (node: HTMLDivElement | null) => void;
  loading: boolean;
  hasMore: boolean;
  searchQuery: string;
}

const UserGrid = ({
  initialLoad,
  users,
  userCounts,
  following,
  followers,
  updatingFollow,
  handleUserClick,
  handleFollowToggle,
  lastUserRef,
  loading,
  hasMore,
  searchQuery,
}: UserGridProps) => {
  if (initialLoad) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {users.map((user, idx) => {
            const isFollowing = following.has(user.id);
            const isFollower = followers.has(user.id);
            const counts = userCounts[user.id] || { followers: 0, following: 0, posts: 0 };
            const isUpdating = updatingFollow.has(user.id);

            return (
              <UserCard
                key={user.id}
                user={user}
                counts={counts}
                isFollowing={isFollowing}
                isFollower={isFollower}
                isUpdating={isUpdating}
                onUserClick={handleUserClick}
                onFollowToggle={handleFollowToggle}
                cardRef={idx === users.length - 1 ? lastUserRef : undefined}
                index={idx}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="flex justify-center mt-10">
          <div className="flex items-center text-[#A9B4C2]">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading more users...
          </div>
        </div>
      )}

      {!hasMore && users.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[#A9B4C2] mt-10 py-4">
          You've reached the end of the list
        </motion.div>
      )}

      {!initialLoad && users.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="bg-[#14171A] rounded-2xl border border-[#222832] p-8 max-w-md mx-auto">
            <Users className="h-16 w-16 text-[#5E6775] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#E6EAF0] mb-2">No users found</h3>
            <p className="text-[#A9B4C2]">
              {searchQuery
                ? `No results found for "${searchQuery}". Try a different search term.`
                : "There are no users to display at the moment."}
            </p>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default UserGrid;
