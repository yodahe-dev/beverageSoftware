"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, UserCheck, Users, FileText, Check, Plus, Loader2, } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import axios from "axios";
import { cn } from "@/lib/utils";
import UserGrid from "@/components/users/UserGrid";
import SectionIntro from "@/components/users/SectionIntro";

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
        <SectionIntro
          title="Discover People"
          description="Connect with amazing people around the world"
        />

        <UserGrid
          initialLoad={initialLoad}
          users={users}
          userCounts={userCounts}
          following={following}
          followers={followers}
          updatingFollow={updatingFollow}
          handleUserClick={handleUserClick}
          handleFollowToggle={handleFollowToggle}
          lastUserRef={(node: HTMLDivElement | null) => { lastUserRef.current = node; }}
          loading={loading}
          hasMore={hasMore}
          searchQuery={searchQuery}
        />
      </div>
    </div>

  );
}