"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface ProfileData {
  id: string;
  email: string;
  username: string;
  name?: string;
  createdAt: string;
  bio?: string;
  profileImageUrl?: string;
  openChat?: boolean;
  status?: string;
  visibility?: string;
  gender?: string;
  birthday?: string;
}

interface Post {
  id: string;
  title: string;
  imageUrl: string;
  contentJson?: any;
  visibility: string;
  createdAt: string;
  description?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    profileImageUrl: "",
    openChat: false,
    status: "",
    visibility: "public",
    gender: "",
    birthday: ""
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Floating particles state
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number}>>([]);

  // Initialize floating particles
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1
      });
    }
    setParticles(newParticles);
  }, []);

  const fetchProfileAndFollows = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [profileRes, countRes, postsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND_URL}/api/count/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND_URL}/api/myposts?order=${order}&page=1&limit=9`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      setProfile(profileRes.data.user);
      setFormData({
        name: profileRes.data.user.name || "",
        username: profileRes.data.user.username || "",
        bio: profileRes.data.user.bio || "",
        profileImageUrl: profileRes.data.user.profileImageUrl || "",
        openChat: profileRes.data.user.openChat || false,
        status: profileRes.data.user.status || "",
        visibility: profileRes.data.user.visibility || "public",
        gender: profileRes.data.user.gender || "",
        birthday: profileRes.data.user.birthday || ""
      });
      setFollowersCount(countRes.data.followers);
      setFollowingCount(countRes.data.following);
      setPosts(postsRes.data.data);
      setHasMore(postsRes.data.hasMore || false);
    } catch (error) {
      console.error("Failed to fetch profile, follow data, or posts:", error);
    } finally {
      setLoading(false);
    }
  }, [user, order]);

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore || !user) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const token = localStorage.getItem("token");
      
      const postsRes = await axios.get(
        `${BACKEND_URL}/api/myposts?order=${order}&page=${nextPage}&limit=9`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPosts(prev => [...prev, ...postsRes.data.data]);
      setPage(nextPage);
      setHasMore(postsRes.data.hasMore || false);
    } catch (err) {
      console.error("Error loading more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, user, order]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;
    
    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    }, options);
    
    if (lastPostRef.current) {
      observer.current.observe(lastPostRef.current);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, loadMorePosts, hasMore]);

  useEffect(() => {
    fetchProfileAndFollows();
  }, [fetchProfileAndFollows]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Name validation
    if (formData.name.length > 50) {
      errors.name = "Name must be 50 characters or less";
    }
    
    // Username validation
    if (formData.username.length > 50) {
      errors.username = "Username must be 50 characters or less";
    }
    
    // Bio validation
    if (formData.bio.length > 200) {
      errors.bio = "Bio must be 200 characters or less";
    }
    
    // Birthday validation (must be at least 18 years old)
    if (formData.birthday) {
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        errors.birthday = "You must be at least 18 years old";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BACKEND_URL}/api/update`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh profile data
      const profileRes = await axios.get(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setProfile(profileRes.data.user);
      setEditSheetOpen(false);
      
      // Show success message
      // You can implement a toast notification here if needed
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors.reduce((acc: Record<string, string>, err: string) => {
          // Extract field name from error message if possible
          if (err.includes('username')) acc.username = err;
          else if (err.includes('name')) acc.name = err;
          else if (err.includes('bio')) acc.bio = err;
          else acc.general = err;
          return acc;
        }, {}));
      } else {
        setFormErrors({ general: error.response?.data?.message || "Failed to update profile" });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 1.5, ease: "linear" },
              scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 mx-auto mb-4 flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-300 text-lg"
          >
            Loading your profile...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/70 backdrop-blur-md rounded-3xl shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-300">We couldn't load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pb-20 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-pink-500/20 to-violet-500/20"
            animate={{
              y: [0, -30, 0],
              x: [0, particle.id % 2 === 0 ? 20 : -20, 0],
              scale: [1, 1.2, 1],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 5 + particle.id * 0.5,
              repeat: Infinity,
              delay: particle.id * 0.7
            }}
            style={{
              width: particle.size * 10,
              height: particle.size * 10,
              top: `${particle.y}%`,
              left: `${particle.x}%`,
            }}
          />
        ))}
        
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik02MCAwSDBWNjBNNjAgMEwwNjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-20">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"
            animate={{
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 5,
              repeat: Infinity
            }}
          />
        </div>
      </div>

      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative pt-16 pb-10"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-violet-500/10 backdrop-blur-sm"></div>
        
        <div className="relative max-w-5xl mx-auto px-4 flex flex-col items-center">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative mb-6 group"
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur-xl opacity-70 group-hover:opacity-90 transition-opacity"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
            {profile.profileImageUrl ? (
              <motion.img
                src={profile.profileImageUrl}
                alt={profile.username}
                className="relative w-32 h-32 rounded-full object-cover border-4 border-gray-800 z-10"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            ) : (
              <motion.div 
                className="relative w-32 h-32 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center text-4xl font-bold text-white border-4 border-gray-800 z-10"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {profile.username.charAt(0).toUpperCase()}
                <motion.div 
                  className="absolute -inset-2 rounded-full border-2 border-pink-500/50"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity
                  }}
                />
              </motion.div>
            )}
            
            {/* Online status indicator */}
            <motion.div 
              className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 z-20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            />
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            @{profile.username}
          </motion.h1>
          
          <motion.p 
            className="text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {profile.email}
          </motion.p>
          
          {profile.bio && (
            <motion.p 
              className="text-gray-300 text-center max-w-2xl mb-6 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {profile.bio}
            </motion.p>
          )}
          
          <motion.div 
            className="flex space-x-8 text-center mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-violet-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative px-6 py-3 bg-gray-900/80 backdrop-blur-sm rounded-lg">
                <p className="text-2xl font-bold text-white">{posts.length}</p>
                <p className="text-gray-400 text-sm">Posts</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-violet-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative px-6 py-3 bg-gray-900/80 backdrop-blur-sm rounded-lg">
                <p className="text-2xl font-bold text-white">{followersCount}</p>
                <p className="text-gray-400 text-sm">Followers</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-violet-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative px-6 py-3 bg-gray-900/80 backdrop-blur-sm rounded-lg">
                <p className="text-2xl font-bold text-white">{followingCount}</p>
                <p className="text-gray-400 text-sm">Following</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-wrap gap-3 mt-6 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {profile.status && (
              <motion.span 
                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                Status: {profile.status}
              </motion.span>
            )}
            {profile.visibility && (
              <motion.span 
                className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                Visibility: {profile.visibility}
              </motion.span>
            )}
            {profile.gender && (
              <motion.span 
                className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                Gender: {profile.gender}
              </motion.span>
            )}
            {profile.birthday && (
              <motion.span 
                className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                Birthday: {new Date(profile.birthday).toLocaleDateString()}
              </motion.span>
            )}
            <motion.span 
              className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
            >
              Open Chat: {profile.openChat ? 'Enabled' : 'Disabled'}
            </motion.span>
            <motion.span 
              className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-sm backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
            >
              Joined: {new Date(profile.createdAt).toLocaleDateString()}
            </motion.span>
          </motion.div>

          {/* Edit Profile Button */}
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => setEditSheetOpen(true)}
              className="relative overflow-hidden group bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 border-0"
            >
              <span className="relative z-10 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </span>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{
                  x: [-100, 100],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Edit Profile Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 overflow-y-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-violet-500/5 pointer-events-none"></div>
          
          <SheetHeader className="mb-6 relative z-10">
            <SheetTitle className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
              Edit Profile
            </SheetTitle>
            <SheetDescription className="text-gray-400">
              Update your profile information below.
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleUpdateProfile} className="space-y-6 relative z-10">
            {formErrors.general && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm backdrop-blur-sm"
              >
                {formErrors.general}
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Name ({formData.name.length}/50)</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white focus:ring-2 focus:ring-pink-500"
                  maxLength={50}
                />
                {formErrors.name && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs"
                  >
                    {formErrors.name}
                  </motion.p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Username ({formData.username.length}/50)</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white focus:ring-2 focus:ring-pink-500"
                  maxLength={50}
                />
                {formErrors.username && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs"
                  >
                    {formErrors.username}
                  </motion.p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profileImageUrl" className="text-gray-300">Profile Image URL</Label>
              <Input
                id="profileImageUrl"
                name="profileImageUrl"
                value={formData.profileImageUrl}
                onChange={handleInputChange}
                className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-gray-300">Bio ({formData.bio.length}/200)</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white focus:ring-2 focus:ring-pink-500 min-h-[100px]"
                maxLength={200}
              />
              {formErrors.bio && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs"
                >
                  {formErrors.bio}
                </motion.p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-gray-300">Gender</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white focus:ring-2 focus:ring-pink-500">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday" className="text-gray-300">Birthday</Label>
                <Input
                  id="birthday"
                  name="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white focus:ring-2 focus:ring-pink-500"
                />
                {formErrors.birthday && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs"
                  >
                    {formErrors.birthday}
                  </motion.p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-300">Status</Label>
                <Input
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibility" className="text-gray-300">Visibility</Label>
                <Select 
                  value={formData.visibility} 
                  onValueChange={(value) => handleSelectChange("visibility", value)}
                >
                  <SelectTrigger className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white focus:ring-2 focus:ring-pink-500">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="openChat"
                  checked={formData.openChat}
                  onCheckedChange={(checked) => handleSwitchChange("openChat", checked)}
                  className="data-[state=checked]:bg-pink-500"
                />
                <Label htmlFor="openChat" className="text-gray-300">Enable Open Chat</Label>
              </div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 border-0"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : "Update Profile"}
                </Button>
              </motion.div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Posts Section */}
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <h2 className="text-2xl font-bold text-white">My Posts</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOrder(order === 'DESC' ? 'ASC' : 'DESC')}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full text-sm font-semibold flex items-center backdrop-blur-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
            {order === 'DESC' ? 'Newest First' : 'Oldest First'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {posts.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  ref={index === posts.length - 1 ? lastPostRef : null}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10, transition: { duration: 0.2 } }}
                  className="bg-gray-800/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl border border-white/10 flex flex-col group relative"
                >
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {post.imageUrl ? (
                    <div className="relative overflow-hidden h-56">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ) : (
                    <div className="h-56 bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1 relative z-10">
                    <h3 className="text-xl font-semibold text-white mb-3 line-clamp-2">{post.title}</h3>

                    {post.description && (
                      <p className="text-gray-300 text-sm mb-4 flex-1">
                        {post.description.length > 120
                          ? post.description.slice(0, 120) + "..."
                          : post.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
                      <p className="text-gray-400 text-xs">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      
                      <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs backdrop-blur-sm">
                        {post.visibility}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-center py-20"
            >
              <div className="bg-gray-800/40 backdrop-blur-md rounded-3xl p-10 max-w-md mx-auto border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                <p className="text-gray-400">You haven't created any posts yet.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading spinner for infinite scroll */}
        {loadingMore && (
          <div className="flex justify-center mt-10">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 rounded-full border-t-2 border-b-2 border-purple-500"
            ></motion.div>
          </div>
        )}

        {/* No more posts message */}
        {!hasMore && posts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12"
          >
            <div className="inline-flex items-center bg-gray-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-gray-400">You've reached the end of your posts</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}