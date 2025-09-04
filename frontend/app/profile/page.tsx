"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PostsGrid from "@/components/profile/PostsGrid";
import EditProfileDialog from "@/components/profile/EditProfileDialog";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

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
      setEditModalOpen(false);
      
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setFormErrors({ ...formErrors, profileImage: 'Please select an image file' });
      return;
    }

    // Check file size (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      setFormErrors({ ...formErrors, profileImage: 'File size must be less than 4MB' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await axios.post(`${BACKEND_URL}/api/profile/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      // Update form data with the new image URL
      setFormData(prev => ({ ...prev, profileImageUrl: response.data.url }));
      
      // Update profile immediately with the new image
      setProfile(prev => prev ? { ...prev, profileImageUrl: response.data.url } : null);
      
      // Clear any previous errors
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.profileImage;
        return newErrors;
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setFormErrors({ 
        ...formErrors, 
        profileImage: error.response?.data?.error || 'Failed to upload image' 
      });
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] to-[#111318] flex items-center justify-center">
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
            className="w-16 h-16 rounded-full bg-[#1A1F24] mx-auto mb-4 flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-[#12D6DF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[#A9B4C2] text-lg"
          >
            Loading your profile...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] to-[#111318] flex items-center justify-center">
        <div className="text-center p-8 bg-[#14171A]/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#222832]">
          <h1 className="text-3xl font-bold text-[#E6EAF0] mb-4">Profile Not Found</h1>
          <p className="text-[#A9B4C2]">We couldn't load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] to-[#111318] pb-20 overflow-hidden relative">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        posts={posts}
        followersCount={followersCount}
        followingCount={followingCount}
        setEditModalOpen={setEditModalOpen}
        BACKEND_URL={BACKEND_URL}
      />

      {/* Posts Grid */}
      <PostsGrid
        posts={posts}
        lastPostRef={lastPostRef}
        order={order}
        setOrder={setOrder}
        loadingMore={loadingMore}
        hasMore={hasMore}
      />

      {/* Edit Profile Modal */}
      <EditProfileDialog
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        formData={formData}
        formErrors={formErrors}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleSwitchChange={handleSwitchChange}
        handleFileUpload={handleFileUpload}
        triggerFileInput={triggerFileInput}
        fileInputRef={fileInputRef}
        handleUpdateProfile={handleUpdateProfile}
        uploading={uploading}
        uploadProgress={uploadProgress}
        isUpdating={isUpdating}
        Backend_URL={BACKEND_URL}
      />
    </div>
  );
}
