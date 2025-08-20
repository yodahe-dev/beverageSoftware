// components/post/PostCard.tsx
'use client';

import { motion } from "framer-motion"
import PostHeader from "./PostHeader"
import PostContent from "./PostContent"
import PostActions from "./PostActions"
import PostFooter from "./PostFooter"
import LikeAnimation from "../Animation/LikeAnimation"
import { useState } from "react"

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

interface PostCardProps {
  post: Post;
  onClick: () => void;
  onLike: (postId: string) => void;
}

export default function PostCard({ post, onClick, onLike }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const maxDescriptionLength = 120;
  
  // Safe author ID handling
  const safeAuthorId = post.authorId || 'unknown';
  const safeAuthorName = post.author?.username || `User #${safeAuthorId.substring(0, 8)}`;
  
  // Safe description handling
  const safeDescription = post.description || '';
  const displayDescription = showFullDescription 
    ? safeDescription 
    : safeDescription.substring(0, maxDescriptionLength) + (safeDescription.length > maxDescriptionLength ? '...' : '');

  const toggleDescription = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullDescription(!showFullDescription);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiking(true);
    onLike(post.id);
    
    // Reset animation state after animation completes
    setTimeout(() => setIsLiking(false), 800);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-full max-w-3xl mx-auto bg-gradient-to-br from-gray-900/40 to-violet-950/30 
                 backdrop-blur-xl rounded-3xl overflow-hidden cursor-pointer 
                 shadow-lg hover:shadow-2xl transition-all duration-300 border border-violet-500/10 relative"
      onClick={onClick}
    >
      {/* Like Animation Overlay */}
      {isLiking && <LikeAnimation isLiked={post.isLiked || false} />}

      <PostHeader 
        author={post.author} 
        createdAt={post.createdAt}
        visibility={post.visibility}
        communityId={post.communityId}
      />
      
      <PostContent 
        title={post.title}
        description={displayDescription}
        fullDescription={safeDescription}
        showFullDescription={showFullDescription}
        onToggleDescription={toggleDescription}
        contentJson={post.contentJson}
        imageUrl={post.imageUrl}
        song={post.song}
        maxDescriptionLength={maxDescriptionLength}
      />
      
      <PostActions 
        likes={post.likes || 0}
        isLiked={post.isLiked || false}
        comments={post.comments || 0}
        shares={post.shares || 0}
        saved={saved}
        onLike={handleLike}
        onSave={handleSave}
      />
      
      <PostFooter createdAt={post.createdAt} />
    </motion.article>
  )
}