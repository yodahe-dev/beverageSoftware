"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import axios from "axios";

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
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followers, setFollowers] = useState<Set<string>>(new Set());
  const [userCounts, setUserCounts] = useState<Record<string, UserCounts>>({});
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!user || loading || !hasMore) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const resUsers = await axios.get(`${BACKEND_URL}/api/NotFollowingUsers`, {
        params: { limit: 20, offset },
        headers: { Authorization: `Bearer ${token}` },
      });

      interface FetchedUserApiResponse {
        users: UserCard[];
      }

      const resUsersTyped = resUsers as { data: FetchedUserApiResponse };
      const fetchedUsers: UserCard[] = resUsersTyped.data.users.filter((u: UserCard) => u.id !== user.id);

      if (fetchedUsers.length === 0) {
        setHasMore(false);
        return;
      }

      setUsers(prev => [...prev, ...fetchedUsers]);
      setOffset(prev => prev + fetchedUsers.length);

      // Fetch following/follower sets once on first load
      if (offset === 0) {
        const [resFollowing, resFollowers] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/user/${user.id}/following`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BACKEND_URL}/api/user/${user.id}/followers`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setFollowing(new Set(resFollowing.data.following.map((f: any) => f.FollowingUser.id)));
        setFollowers(new Set(resFollowers.data.followers.map((f: any) => f.FollowerUser.id)));
      }

      // Fetch counts for new users
      for (const u of fetchedUsers) {
        try {
          const [followCountsRes, postCountsRes] = await Promise.all([
            axios.get(`${BACKEND_URL}/api/count/${u.id}`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${BACKEND_URL}/api/users/${u.id}`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);

          setUserCounts(prev => ({
            ...prev,
            [u.id]: {
              followers: followCountsRes.data.followers || 0,
              following: followCountsRes.data.following || 0,
              posts: postCountsRes.data.posts || 0,
            },
          }));
        } catch {
          setUserCounts(prev => ({
            ...prev,
            [u.id]: { followers: 0, following: 0, posts: 0 },
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [user, offset, loading, hasMore]);

  const lastUserRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) fetchUsers();
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, fetchUsers]
  );

  useEffect(() => {
    if (user) fetchUsers();
  }, [user]);

  const handleFollowToggle = async (targetId: string) => {
    const token = localStorage.getItem("token");
    if (following.has(targetId)) {
      try {
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
      } catch (err) {
        console.error("Unfollow error:", err);
      }
    } else {
      try {
        await axios.post(`${BACKEND_URL}/api/follow`, { FollowingId: targetId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFollowing(prev => new Set(prev).add(targetId));
        setUserCounts(prev => ({
          ...prev,
          [targetId]: {
            ...prev[targetId],
            followers: (prev[targetId]?.followers || 0) + 1,
          },
        }));
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
      }
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/${username}`);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading user auth...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Discover People</h1>
        <p className="text-gray-400 text-center mb-10">Connect with amazing people around the world</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map((u, idx) => {
            const isFollowing = following.has(u.id);
            const isFollower = followers.has(u.id);
            const counts = userCounts[u.id] || { followers: 0, following: 0, posts: 0 };

            let btnText = "Follow";
            let btnClass = "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700";

            if (isFollowing) {
              btnText = "Following";
              btnClass = "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700";
            } else if (!isFollowing && isFollower) {
              btnText = "Follow Back";
              btnClass = "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700";
            }

            return (
              <div
                key={u.id}
                ref={idx === users.length - 1 ? lastUserRef : null}
                onClick={() => handleUserClick(u.username)}
                className="group relative cursor-pointer bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black opacity-20"></div>

                <div className="relative p-6 flex flex-col items-center h-full">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 p-1">
                      {u.profileImageUrl ? (
                        <img
                          src={u.profileImageUrl}
                          alt={u.username}
                          className="w-full h-full rounded-2xl object-cover border-4 border-gray-800"
                        />
                      ) : (
                        <div className="w-full h-full rounded-2xl bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-300">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {u.isBadgeVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="text-center mb-5">
                    <h2 className="text-xl font-bold text-white mb-1 flex items-center justify-center">
                      <span>{u.username}</span>
                    </h2>
                    {u.name && <p className="text-gray-400 text-sm mb-2">{u.name}</p>}
                    {u.bio ? (
                      <p className="text-gray-400 text-sm line-clamp-2">{u.bio}</p>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No bio yet...</p>
                    )}
                  </div>

                  <div className="flex justify-around w-full mb-5 border-t border-gray-700 pt-4">
                    <div className="text-center">
                      <p className="text-white font-semibold">{counts.followers}</p>
                      <p className="text-gray-400 text-xs">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold">{counts.following}</p>
                      <p className="text-gray-400 text-xs">Following</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold">{counts.posts}</p>
                      <p className="text-gray-400 text-xs">Posts</p>
                    </div>
                  </div>

                  <div className="mt-auto w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFollowToggle(u.id); }}
                      className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 ${btnClass}`}
                    >
                      {btnText}
                    </button>
                  </div>
                </div>

                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            );
          })}

          {loading && <div className="col-span-full text-center text-gray-300 mt-4">Loading more users...</div>}
        </div>
      </div>
    </div>
  );
}
