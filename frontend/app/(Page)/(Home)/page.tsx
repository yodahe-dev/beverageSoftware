'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { 
  FaUser, 
  FaUsers, 
  FaGlobe, 
  FaLock, 
  FaHeart, 
  FaComment, 
  FaShare, 
  FaBookmark,
  FaEllipsisH,
  FaTimes,
  FaPlus,
  FaBars,
  FaPaperPlane,
  FaMusic,
  FaSearch,
  FaBell,
  FaPlusCircle,
  FaRocket,
} from 'react-icons/fa';
import type { JSX } from "react";

// components
import LeftSidebar  from './components/Leftbar';
import RightSidebar  from './components/RightBar';
import PostCard from './components/post/PostCard';
import GradientOrbs from './components/Animation/AnimatedGradient';
import FloatingParticles from './components/Animation/AnimatedFloating';
import MobileNav from './components/Mobile/MobileNavigation'
import PostModal from './components/PostModal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Post {
  id: string;
  authorId: string;
  title: string;
  description: string;
  contentJson: any;
  imageUrl: string;
  visibility: string;
  communityId: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
  likes?: number;
  isLiked?: boolean;
  comments?: number;
  shares?: number;
  song?: string;
}

interface Comment {
  id: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  replies: Comment[];
}

interface TextItem {
  type: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: { color?: string } }>;
  content?: TextItem[];
  attrs?: { level?: number };
}

interface JwtPayload {
  userId: string;
  username: string;
  exp: number;
}



// Comment Component



// PostModal Component





  const Comment = ({ comment }: { comment: Comment }) => {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likes);
  
    const handleLike = () => {
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    };
  
    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex space-x-3 py-4 border-b border-gray-700/50"
      >
        <div className="flex-shrink-0">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 bg-violet-900/50 rounded-full flex items-center justify-center overflow-hidden"
          >
            {comment.author.avatar ? (
              <img src={comment.author.avatar} alt={comment.author.username} className="w-full h-full object-cover" />
            ) : (
              <FaUser className="text-violet-400" />
            )}
          </motion.div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-violet-300">{comment.author.username}</h4>
            <span className="text-xs text-violet-500/70">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-violet-200 text-sm mt-1">{comment.content}</p>
          <div className="flex items-center space-x-4 mt-2">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className={`flex items-center space-x-1 text-xs ${liked ? 'text-rose-500' : 'text-violet-400/70'}`}
            >
              <FaHeart className={liked ? 'fill-rose-500' : ''} />
              <span>{likeCount}</span>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-1 text-xs text-violet-400/70"
            >
              <FaComment />
              <span>Reply</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };
















export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired
        localStorage.removeItem('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]);



  // Function to handle liking/unliking a post
  const handleLike = async (postId: string) => {
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Verify token is still valid
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          // Token expired
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      // Make API call to like/unlike the post
      const response = await axios.post(
        `${BACKEND_URL}/api/${postId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Update the post in state
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const newLikes = response.data.liked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1);
            return {
              ...post,
              likes: newLikes,
              isLiked: response.data.liked
            };
          }
          return post;
        })
      );

      // Also update the selected post if it's the one being liked/unliked
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => {
          if (!prev) return prev;
          const newLikes = response.data.liked ? (prev.likes || 0) + 1 : Math.max(0, (prev.likes || 0) - 1);
          return {
            ...prev,
            likes: newLikes,
            isLiked: response.data.liked
          };
        });
      }
    } catch (err: any) {
      console.error('Error toggling like:', err);
      if (err.response?.status === 401) {
        // Unauthorized - token expired or invalid
        setError('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError('Failed to like post. Please try again.');
      }
    }
  };

  // Function to fetch like counts for posts
  const fetchLikeCounts = async (postIds: string[]) => {
    try {
      const likeCounts = await Promise.all(
        postIds.map(async (id) => {
          try {
            const response = await axios.get(`${BACKEND_URL}/api/${id}/likes/count`);
            return { id, likes: response.data.likes };
          } catch (err) {
            console.error(`Error fetching like count for post ${id}:`, err);
            return { id, likes: 0 };
          }
        })
      );
      
      return likeCounts;
    } catch (err) {
      console.error('Error fetching like counts:', err);
      return [];
    }
  };

  // Function to check if current user has liked posts
  const fetchUserLikes = async (postIds: string[]) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];
      
      const response = await axios.get(`${BACKEND_URL}/api/my/likes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Extract the post IDs that the user has liked
      const likedPostIds = response.data.data.map((like: any) => like.postId);
      
      return postIds.map(id => ({
        id,
        isLiked: likedPostIds.includes(id)
      }));
    } catch (err) {
      console.error('Error fetching user likes:', err);
      return [];
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/post`);
        
        // Add mock author data for demonstration
        const postsWithAuthors = response.data.map((post: Post) => ({
          ...post,
          author: {
            id: post.authorId || 'unknown',
            username: `User${(post.authorId || 'unknown').substring(0, 4)}`,
            avatar: Math.random() > 0.5 ? `https://i.pravatar.cc/150?u=${post.authorId}` : undefined
          },
          comments: Math.floor(Math.random() * 50),
          shares: Math.floor(Math.random() * 30),
          song: Math.random() > 0.7 ? 'User' + (post.authorId || 'unknown').substring(0, 4) : undefined
        }));

        // Get post IDs for fetching like data
        const postIds = postsWithAuthors.map((post: Post) => post.id);
        
        // Fetch like counts and user likes in parallel
        const [likeCounts, userLikes] = await Promise.all([
          fetchLikeCounts(postIds),
          fetchUserLikes(postIds)
        ]);

        // Combine the data
        const postsWithLikes = postsWithAuthors.map((post: Post) => {
          const likeCount = likeCounts.find(lc => lc.id === post.id)?.likes || 0;
          const isLiked = userLikes.find(ul => ul.id === post.id)?.isLiked || false;
          
          return {
            ...post,
            likes: likeCount,
            isLiked
          };
        });

        setPosts(postsWithLikes);
        setHasMore(false); // Since we're getting all posts at once
      } catch (err: any) {
        if (err.response?.status === 401) {
          // Unauthorized - redirect to login
          router.push('/login');
        } else {
          setError(err.response?.data?.error || 'Failed to fetch posts');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-violet-950 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-6"
          ></motion.div>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-violet-400 text-lg"
          >
            Loading posts...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-violet-950 flex items-center justify-center">
        <div className="text-center p-8 bg-rose-900/20 border border-rose-500/30 rounded-xl backdrop-blur-md">
          <p className="text-rose-400 text-xl">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-violet-950 text-white overflow-x-hidden">
      <GradientOrbs />
      <FloatingParticles />

      <MobileNav toggleSidebar={toggleSidebar} />

      

      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 25 }}
        className={`fixed left-0 top-0 bottom-0 z-30 w-72 xl:translate-x-0 xl:static xl:z-0`}
      >
        <LeftSidebar />
      </motion.div>

      <div className="hidden xl:block fixed left-0 top-0 bottom-0 z-10 w-20">
        <LeftSidebar />
      </div>

      <div className="hidden xl:block fixed right-0 top-0 bottom-0 z-10 w-80">
        <RightSidebar />
      </div>

      <div className="pt-16 xl:pt-0 xl:ml-20 xl:mr-0 2xl:mr-80 px-4 xl:px-6 py-8 lg:py-12 relative z-10">
        {/* Header for desktop */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 xl:mb-12 hidden xl:block"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center mb-4"
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="text-5xl mr-2 text-fuchsia-400"
            >
              <FaPlusCircle />
            </motion.div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Me
            </h1>
          </motion.div>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-violet-200 text-lg flex items-center justify-center"
          >
            
            Express your unique self
          </motion.p>
        </motion.header>

        {/* Posts Grid - Single Column Layout */}
        <div className="max-w-5xl mx-auto space-y-8">
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PostCard 
                  post={post} 
                  onClick={() => setSelectedPost(post)} 
                  onLike={handleLike}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loading more indicator */}
        {loading && posts.length > 0 && (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full"
            ></motion.div>
          </div>
        )}

        {/* Empty state */}
        {posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div 
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 mx-auto mb-6 bg-violet-900/50 rounded-full flex items-center justify-center backdrop-blur-md"
            >
              <FaRocket className="text-4xl text-violet-400" />
            </motion.div>
            <h3 className="text-2xl font-bold text-violet-200 mb-2">
              Your journey begins here
            </h3>
            <p className="text-violet-400 mb-6">
              Share your first post and connect with others
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/create-post')}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full font-medium flex items-center mx-auto"
            >
              <FaPlusCircle className="mr-2" />
              Create Post
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onLike={handleLike}
      />
    </div>
  );
}

