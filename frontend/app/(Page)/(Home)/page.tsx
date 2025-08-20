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

interface VisibilityIconProps {
  visibility: string;
  className?: string;
}

interface TextItem {
  type: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: { color?: string } }>;
  content?: TextItem[];
  attrs?: { level?: number };
}

interface ContentItem {
  type: string;
  content?: TextItem[];
  attrs?: { level?: number; src?: string; alt?: string; checked?: boolean };
}

interface BlockItem {
  type: string;
  text?: string;
}

interface JwtPayload {
  userId: string;
  username: string;
  exp: number;
}

export const VisibilityIcon = ({ visibility, className = "" }: { visibility: string; className?: string }) => {
  switch (visibility) {
    case 'public': return <FaGlobe className={className} />;
    case 'private': return <FaLock className={className} />;
    case 'friends': case 'community': return <FaUsers className={className} />;
    default: return <FaGlobe className={className} />;
  }
};

// Render text with marks
const renderText = (textItem: TextItem, key: number) => {
  if (!textItem || textItem.type !== 'text') return null;
  let className = "";
  let style: React.CSSProperties = {};

  textItem.marks?.forEach((mark: any) => {
    switch (mark.type) {
      case 'bold': className += " font-bold"; break;
      case 'italic': className += " italic"; break;
      case 'underline': className += " underline"; break;
      case 'strike': className += " line-through"; break;
      case 'code': className += " font-mono bg-gray-800 px-1 rounded"; break;
      case 'link': style.color = "#8B5CF6"; break;
      case 'textStyle':
        if (mark.attrs?.color) style.color = mark.attrs.color;
        break;
      case 'highlight':
        style.backgroundColor = mark.attrs?.color || "#DDD6FE";
        break;
      case 'subscript': className += " align-sub text-sm"; break;
      case 'superscript': className += " align-super text-sm"; break;
      case 'mention': className += " text-violet-400"; break;
      case 'hashtag': className += " text-cyan-400"; break;
      default: break;
    }
  });

  return <span key={key} className={className} style={style}>{textItem.text}</span>;
};

// Recursive render for nested content
const renderContent = (item: ContentItem, key: number): JSX.Element | null => {
  if (!item) return null;

  switch (item.type) {
    case 'paragraph':
      return <p key={key} className="mb-4">{item.content?.map((textItem, i) => renderText(textItem, i))}</p>;

    case 'heading':
      const HeadingTag = `h${item.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag key={key} className={`text-violet-300 font-bold my-4 
          ${item.attrs?.level === 1 ? 'text-2xl' : item.attrs?.level === 2 ? 'text-xl' : 'text-lg'}`}>
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </HeadingTag>
      );

    case 'blockquote':
      return (
        <blockquote key={key} className="border-l-4 border-violet-500 pl-4 italic my-4 text-gray-300">
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </blockquote>
      );

    case 'codeBlock':
      return (
        <pre key={key} className="bg-gray-800 text-pink-300 p-4 rounded my-4 overflow-x-auto">
          <code>{item.content?.map((t: any, i: number) => t.text).join('')}</code>
        </pre>
      );

    case 'horizontalRule':
      return <hr key={key} className="border-t border-gray-700 my-4" />;

    case 'hardBreak':
      return <br key={key} />;

    case 'bulletList':
    case 'orderedList':
      const ListTag = item.type === 'bulletList' ? 'ul' : 'ol';
      return React.createElement(ListTag, { key, className: `my-4 ${item.type==='bulletList'?'list-disc':'list-decimal'} pl-6` },
        item.content?.map((li: ContentItem, i: number) => 
          <li key={i}>{li.content?.map((contentItem, j) => renderContent(contentItem, j))}</li>)
      );

    case 'table':
      return (
        <table key={key} className="w-full border border-violet-500 my-4 rounded overflow-hidden">
          <tbody>
            {item.content?.map((row: ContentItem, rIdx: number) => (
              <tr key={rIdx}>
                {row.content?.map((cell: ContentItem, cIdx: number) => {
                  const CellTag = cell.type === 'tableHeader' ? 'th' : 'td';
                  return React.createElement(CellTag, { 
                    key: cIdx, 
                    className: "border-b border-violet-400 px-2 py-1 text-left" 
                  }, cell.content?.map((textItem, i) => renderText(textItem, i)));
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case 'image':
      return (
        <div key={key} className="my-4 flex justify-center">
          <img 
            src={item.attrs?.src} 
            alt={item.attrs?.alt || ""} 
            className="rounded-xl object-contain max-h-96"
          />
        </div>
      );

    case 'iframe':
      return (
        <div key={key} className="my-4 aspect-video w-full">
          <iframe src={item.attrs?.src} className="w-full h-full rounded-xl" title="Embedded content" />
        </div>
      );

    case 'callout':
      return (
        <div key={key} className="border-dashed border-violet-500 p-4 rounded-xl my-4 bg-violet-900/20">
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </div>
      );

    case 'panel':
      return (
        <div key={key} className="bg-gray-800/50 p-4 rounded-xl my-4 border-l-4 border-violet-500">
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </div>
      );

    case 'taskList':
      return (
        <ul key={key} className="my-4 list-none pl-4">
          {item.content?.map((task: ContentItem, i: number) => (
            <li key={i} className="flex items-start my-2">
              <input 
                type="checkbox" 
                checked={task.attrs?.checked} 
                readOnly 
                className="mt-1 mr-2"
              />
              <span>{task.content?.map((textItem, j) => renderText(textItem, j))}</span>
            </li>
          ))}
        </ul>
      );

    default:
      // For unsupported types, try to render text content
      if (item.content) {
        return (
          <div key={key} className="my-4">
            {item.content.map((contentItem, i) => renderContent(contentItem, i))}
          </div>
        );
      }
      return null;
  }
};


const renderBlocksContent = (blocks: BlockItem[]) => {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={index} className="mb-4">{block.text}</p>;
          case 'heading':
            return <h2 key={index} className="text-xl font-bold text-violet-300 my-4">{block.text}</h2>;
          case 'blockquote':
            return <blockquote key={index} className="border-l-4 border-violet-500 pl-4 italic my-4">{block.text}</blockquote>;
          default:
            return <p key={index} className="mb-4">{block.text}</p>;
        }
      })}
    </div>
  );
};

// Main Renderer
export const RichTextRenderer = ({ contentJson }: { contentJson: any }) => {
  if (!contentJson) return null;
  
  let content;
  try {
    content = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;
  } catch (e) {
    console.error("Error parsing content JSON:", e);
    return <div>Error rendering content</div>;
  }

  // Handle different content formats
  if (content.type === 'doc' && Array.isArray(content.content)) {
    return <div className="rich-text-content space-y-4">{content.content.map((item: ContentItem, i: number) => renderContent(item, i))}</div>;
  } else if (Array.isArray(content.blocks)) {
    return renderBlocksContent(content.blocks);
  } else if (Array.isArray(content)) {
    return <div className="rich-text-content space-y-4">{content.map((item: ContentItem, i: number) => renderContent(item, i))}</div>;
  }

  return <div>Unsupported content format</div>;
};

// Comment Component
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

// Comment Section Component
const CommentSection = ({ comments, onClose }: { comments: Comment[], onClose: () => void }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      // Here you would typically send the comment to the server
      setNewComment('');
    }
  };

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25 }}
      className="bg-gray-900/95 backdrop-blur-lg rounded-2xl w-full max-w-md h-[90vh] overflow-hidden flex flex-col border border-violet-500/20"
    >
      <div className="flex items-center justify-between p-4 border-b border-violet-500/20">
        <h3 className="font-bold text-violet-300">Comments ({comments.length})</h3>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <FaTimes className="text-gray-400" />
        </motion.button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {comments.length > 0 ? (
          comments.map(comment => (
            <Comment key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-8 text-violet-400/70">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-violet-500/20">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-gray-800/50 border border-violet-500/30 rounded-full px-4 py-2 text-sm text-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!newComment.trim()}
            className="p-2 rounded-full bg-violet-500/20 text-violet-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

// Post Modal Component
const PostModal = ({ post, isOpen, onClose, onLike }: { post: Post | null, isOpen: boolean, onClose: () => void, onLike: (postId: string) => void }) => {
  const [showComments, setShowComments] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Mock comments data
  const [comments] = useState<Comment[]>([
    {
      id: '1',
      author: {
        id: 'user2',
        username: 'TravelLover',
        avatar: 'https://i.pravatar.cc/150?u=user2'
      },
      content: 'This is amazing! Where was this taken?',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      likes: 12,
      replies: []
    },
    {
      id: '2',
      author: {
        id: 'user3',
        username: 'NaturePhotographer',
        avatar: 'https://i.pravatar.cc/150?u=user3'
      },
      content: 'The lighting in this shot is perfect!',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      likes: 8,
      replies: []
    },
    {
      id: '3',
      author: {
        id: 'user4',
        username: 'AdventureSeeker',
        avatar: 'https://i.pravatar.cc/150?u=user4'
      },
      content: 'I need to visit this place! Adding to my bucket list.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      likes: 15,
      replies: []
    }
  ]);

  if (!post || !isOpen) return null;

  const safeAuthorId = post.authorId || 'unknown';
  const safeAuthorName = post.author?.username || `User #${safeAuthorId.substring(0, 8)}`;

  const handleLike = () => {
    onLike(post.id);
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900/95 backdrop-blur-lg rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex border border-violet-500/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Post Content */}
          <div className={`flex-1 ${showComments ? 'hidden md:flex' : 'flex'} flex-col`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-violet-500/20">
              <div className="flex items-center space-x-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 bg-violet-900/50 rounded-full flex items-center justify-center overflow-hidden"
                >
                  {post.author?.avatar ? (
                    <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
                  ) : (
                    <FaUser className="text-violet-400" />
                  )}
                </motion.div>
                <div>
                  <h3 className="font-medium text-violet-300">{safeAuthorName}</h3>
                  <div className="flex items-center space-x-2 text-sm text-violet-500">
                    <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <VisibilityIcon visibility={post.visibility} className="text-xs" />
                      <span>
                        {post.visibility === 'community' && post.communityId 
                          ? `in Community #${post.communityId.substring(0, 8)}` 
                          : post.visibility
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <FaTimes className="text-gray-400" />
              </motion.button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {post.title && (
                <h2 className="text-2xl font-bold text-violet-100 mb-4">{post.title}</h2>
              )}
              
              {post.description && (
                <p className="text-violet-200 mb-6">{post.description}</p>
              )}

              <div className="mb-6">
                <RichTextRenderer contentJson={post.contentJson} />
              </div>

              {post.imageUrl && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6 rounded-xl overflow-hidden flex justify-center"
                >
                  <img 
                    src={post.imageUrl} 
                    alt="Post" 
                    className="w-full max-w-md h-auto object-contain max-h-96"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </motion.div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-violet-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLike}
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${post.isLiked ? 'text-rose-500 bg-rose-500/10' : 'text-violet-400 hover:text-rose-400 hover:bg-white/5'}`}
                  >
                    <motion.div
                      animate={{ scale: post.isLiked ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FaHeart className={post.isLiked ? 'fill-rose-500' : ''} />
                    </motion.div>
                    <span>{post.likes || 0}</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowComments(true)}
                    className="flex items-center space-x-2 text-violet-400 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                  >
                    <FaComment />
                    <span>{post.comments || 0}</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 text-violet-400 hover:text-violet-300 transition-colors p-2 rounded-lg hover:bg-white/5"
                  >
                    <FaShare />
                    <span>{post.shares || 0}</span>
                  </motion.button>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className={`p-2 rounded-lg transition-colors ${saved ? 'text-amber-400 bg-amber-500/10' : 'text-violet-400 hover:text-amber-400 hover:bg-white/5'}`}
                >
                  <FaBookmark className={saved ? 'fill-amber-400' : ''} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <CommentSection comments={comments} onClose={() => setShowComments(false)} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};



















export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [page, setPage] = useState(1);
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

  // Load more posts when reaching the bottom
  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`fixed inset-0 z-20 bg-black/70 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      ></motion.div>

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
                ref={index === posts.length - 1 ? lastPostRef : null}
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