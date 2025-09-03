"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, UserCheck, Users, FileText, Check, Plus, Loader2, Search, Filter } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import axios from "axios";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface UserCard {
  id: string;
  username: string;
  name?: string;
  bio?: string;
  profileImageUrl?: string;
  isBadgeVerified?: boolean;
}

interface UserCounts {
  followers: number;
  following: number;
  posts: number;
}

export default function AllUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followers, setFollowers] = useState<Set<string>>(new Set());
  const [userCounts, setUserCounts] = useState<Record<string, UserCounts>>({});
  const [updatingFollow, setUpdatingFollow] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastUserRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async (reset = false) => {
    if (!user || loading || (!hasMore && !reset)) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const currentOffset = reset ? 0 : offset;

      const resUsers = await axios.get(`${BACKEND_URL}/api/NotFollowingUsers`, {
        params: { limit: 20, offset: currentOffset, search: searchQuery || undefined },
        headers: { Authorization: `Bearer ${token}` },
      });

      interface FetchedUserApiResponse {
        users: UserCard[];
        hasMore?: boolean;
      }

      const resUsersTyped = resUsers as { data: FetchedUserApiResponse };
      const fetchedUsers: UserCard[] = resUsersTyped.data.users.filter((u: UserCard) => u.id !== user.id);

      if (fetchedUsers.length === 0) {
        setHasMore(false);
        if (reset) {
          setUsers([]);
        }
        return;
      }

      if (reset) {
        setUsers(fetchedUsers);
        setOffset(fetchedUsers.length);
      } else {
        setUsers(prev => [...prev, ...fetchedUsers]);
        setOffset(prev => prev + fetchedUsers.length);
      }

      setHasMore(resUsersTyped.data.hasMore !== undefined ? resUsersTyped.data.hasMore : fetchedUsers.length === 20);

      // Fetch following/follower sets once on first load or after reset
      if (currentOffset === 0) {
        const [resFollowing, resFollowers] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/user/${user.id}/following`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }).catch(() => ({ data: { following: [] } })),
          axios.get(`${BACKEND_URL}/api/user/${user.id}/followers`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }).catch(() => ({ data: { followers: [] } })),
        ]);

        setFollowing(new Set(resFollowing.data.following.map((f: any) => f.FollowingUser?.id || f.id)));
        setFollowers(new Set(resFollowers.data.followers.map((f: any) => f.FollowerUser?.id || f.id)));
      }

      // Fetch counts for new users
      const countsPromises = fetchedUsers.map(async (u) => {
        try {
          const [followCountsRes, postCountsRes] = await Promise.all([
            axios.get(`${BACKEND_URL}/api/count/${u.id}`, { 
              headers: { Authorization: `Bearer ${token}` } 
            }).catch(() => ({ data: { followers: 0, following: 0 } })),
            axios.get(`${BACKEND_URL}/api/users/${u.id}`, { 
              headers: { Authorization: `Bearer ${token}` } 
            }).catch(() => ({ data: { posts: 0 } })),
          ]);

          return {
            id: u.id,
            counts: {
              followers: followCountsRes.data.followers || 0,
              following: followCountsRes.data.following || 0,
              posts: postCountsRes.data.posts || 0,
            }
          };
        } catch {
          return {
            id: u.id,
            counts: { followers: 0, following: 0, posts: 0 }
          };
        }
      });

      const countsResults = await Promise.all(countsPromises);
      const newCounts = countsResults.reduce((acc, { id, counts }) => {
        acc[id] = counts;
        return acc;
      }, {} as Record<string, UserCounts>);

      setUserCounts(prev => ({ ...prev, ...newCounts }));
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [user, offset, loading, hasMore, searchQuery]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (initialLoad || loading || !hasMore) return;

    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        fetchUsers();
      }
    }, options);

    if (lastUserRef.current) {
      observer.current.observe(lastUserRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [initialLoad, loading, hasMore, fetchUsers]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchUsers(true);
    }
  }, [user, searchQuery]);

  const handleFollowToggle = async (targetId: string) => {
    setUpdatingFollow(prev => new Set(prev).add(targetId));
    const token = localStorage.getItem("token");
    
    try {
      if (following.has(targetId)) {
        await axios.delete(`${BACKEND_URL}/api/unfollow`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { FollowingId: targetId },
        });
        setFollowing(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetId);
          return newSet;
        });
        setUserCounts(prev => ({
          ...prev,
          [targetId]: {
            ...prev[targetId],
            followers: Math.max(0, (prev[targetId]?.followers || 1) - 1),
          },
        }));
      } else {
        await axios.post(
          `${BACKEND_URL}/api/follow`, 
          { FollowingId: targetId }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFollowing(prev => new Set(prev).add(targetId));
        setUserCounts(prev => ({
          ...prev,
          [targetId]: {
            ...prev[targetId],
            followers: (prev[targetId]?.followers || 0) + 1,
          },
        }));
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setFollowing(prev => new Set(prev).add(targetId));
        setUserCounts(prev => ({
          ...prev,
          [targetId]: {
            ...prev[targetId],
            followers: (prev[targetId]?.followers || 0) + 1,
          },
        }));
      } else {
        console.error("Follow error:", err);
      }
    } finally {
      setUpdatingFollow(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetId);
        return newSet;
      });
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/${username}`);
  };

  const handleMessageUser = (username: string) => {
    router.push(`/messages?user=${username}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(true);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#0B0D10] to-[#111318]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-12 w-12 border-t-2 border-b-2 border-[#12D6DF] mx-auto"
          />
          <p className="mt-4 text-[#A9B4C2]">Loading user auth...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] to-[#111318] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold text-[#E6EAF0] mb-2 font-[geist]">Discover People</h1>
          <p className="text-[#A9B4C2]">Connect with amazing people around the world</p>
        </motion.div>

        {initialLoad ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#14171A] rounded-2xl border border-[#222832] overflow-hidden h-80">
                <div className="animate-pulse">
                  <div className="h-32 bg-[#1A1F24]"></div>
                  <div className="p-6">
                    <div className="rounded-full bg-[#1A1F24] h-20 w-20 mx-auto -mt-12"></div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-[#1A1F24] rounded w-3/4 mx-auto"></div>
                      <div className="h-3 bg-[#1A1F24] rounded w-1/2 mx-auto"></div>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-2">
                      <div className="h-10 bg-[#1A1F24] rounded"></div>
                      <div className="h-10 bg-[#1A1F24] rounded"></div>
                      <div className="h-10 bg-[#1A1F24] rounded"></div>
                    </div>
                    <div className="mt-6 h-12 bg-[#1A1F24] rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {users.map((u, idx) => {
                  const isFollowing = following.has(u.id);
                  const isFollower = followers.has(u.id);
                  const counts = userCounts[u.id] || { followers: 0, following: 0, posts: 0 };
                  const isUpdating = updatingFollow.has(u.id);

                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="group relative"
                      ref={idx === users.length - 1 ? lastUserRef : null}
                    >
                      <div className="bg-[#14171A] rounded-2xl border border-[#222832] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                        {/* Glass effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#1A1F24] opacity-20 pointer-events-none" />
                        
                        {/* Header with avatar */}
                        <div className="relative p-6 flex flex-col items-center">
                          <div className="relative mb-4">
                            <motion.div 
                              whileHover={{ scale: 1.05 }}
                              className="w-28 h-28 rounded-2xl bg-gradient-to-r from-[#12D6DF] to-[#8B5CF6] p-1.5 cursor-pointer"
                              onClick={() => handleUserClick(u.username)}
                            >
                              {u.profileImageUrl ? (
                                <img
                                  src={u.profileImageUrl}
                                  alt={u.username}
                                  className="w-full h-full rounded-2xl object-cover border-4 border-[#14171A]"
                                />
                              ) : (
                                <div className="w-full h-full rounded-2xl bg-[#1A1F24] flex items-center justify-center text-2xl font-bold text-[#A9B4C2]">
                                  {u.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </motion.div>
                            {u.isBadgeVerified && (
                              <div className="absolute -bottom-1 -right-1 bg-[#12D6DF] rounded-full p-1.5 shadow-lg">
                                <Check className="h-4 w-4 text-[#0B0D10]" />
                              </div>
                            )}
                          </div>

                          <div className="text-center mb-5 w-full">
                            <h2 
                              className="text-xl font-bold text-[#E6EAF0] mb-1 font-[geist] cursor-pointer hover:text-[#12D6DF] transition-colors"
                              onClick={() => handleUserClick(u.username)}
                            >
                              {u.username}
                            </h2>
                            {u.name && (
                              <p className="text-[#A9B4C2] text-sm mb-2">{u.name}</p>
                            )}
                            {u.bio ? (
                              <p className="text-[#A9B4C2] text-sm line-clamp-2">{u.bio}</p>
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

                        {/* Action buttons */}
                        <div className="mt-auto p-4 pt-0 flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={(e) => { e.stopPropagation(); handleFollowToggle(u.id); }}
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

                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={(e) => { e.stopPropagation(); handleMessageUser(u.username); }}
                            className="p-3 bg-[#1A1F24] rounded-xl text-[#E6EAF0] hover:bg-[#222832] transition-colors border border-[#222832]"
                            title="Message"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
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
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[#A9B4C2] mt-10 py-4"
              >
                You've reached the end of the list
              </motion.div>
            )}

            {!initialLoad && users.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="bg-[#14171A] rounded-2xl border border-[#222832] p-8 max-w-md mx-auto">
                  <Users className="h-16 w-16 text-[#5E6775] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#E6EAF0] mb-2">No users found</h3>
                  <p className="text-[#A9B4C2]">
                    {searchQuery 
                      ? `No results found for "${searchQuery}". Try a different search term.`
                      : "There are no users to display at the moment."
                    }
                  </p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}