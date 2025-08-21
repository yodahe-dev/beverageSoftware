'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { FaUser, FaHeart, FaComment, FaShare, FaBookmark, FaTimes, FaReply, FaEdit, FaTrash, FaEllipsisV, FaCheck, FaTimesCircle } from 'react-icons/fa';
import { RichTextRenderer } from './post/RichTextRenderer';
import { VisibilityIcon } from './post/VisibilityIcon';

const API = (process.env.Backend_url as string) || 'http://localhost:8000';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; profileImageUrl?: string };
  likes: number;
  isLiked?: boolean;
  replies: Comment[];
}

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
  author?: { id: string; username: string; avatar?: string };
  likes?: number;
  isLiked?: boolean;
  comments?: number;
  shares?: number;
}

// -----------------------------
// Helpers for auth & token
// -----------------------------
function getToken(): string | null {
  try {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      null
    );
  } catch (e) {
    return null;
  }
}

function getDecodedUser(): any | null {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (e) {
    return null;
  }
}

function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// -----------------------------
// Custom Scrollbar Component
// -----------------------------
const CustomScrollbar: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`custom-scrollbar ${className}`}>
      {children}
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.5) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

// -----------------------------
// CommentSection Component
// -----------------------------
interface CommentSectionProps {
  postId: string;
  onClose: () => void;
  updatePostComments: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, onClose, updatePostComments }) => {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [editContent, setEditContent] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const currentUser = getDecodedUser();

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthRedirect = () => {
    router.push('/login');
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/${postId}/comments`);
      const commentsWithLikes = await Promise.all(
        (data.data || []).map(async (comment: Comment) => {
          const likesResponse = await axios.get(`${API}/api/comment/${comment.id}/likes`);
          const repliesWithLikes = await Promise.all(
            (comment.replies || []).map(async (reply: Comment) => {
              const replyLikesResponse = await axios.get(`${API}/api/comment/${reply.id}/likes`);
              return {
                ...reply,
                likes: replyLikesResponse.data.likes || 0
              };
            })
          );
          return {
            ...comment,
            likes: likesResponse.data.likes || 0,
            replies: repliesWithLikes
          };
        })
      );
      setComments(commentsWithLikes);
    } catch (err: any) {
      console.error('fetchComments error', err);
      if (err?.response?.status === 401) {
        handleAuthRedirect();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    const token = getToken();
    const user = getDecodedUser();
    if (!token || !user) {
      handleAuthRedirect();
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API}/api/${postId}/comment`,
        { content: newComment.trim() },
        { headers: authHeaders(token) }
      );
      setNewComment('');
      await fetchComments();
      updatePostComments();
    } catch (err: any) {
      console.error('handleCommentSubmit error', err);
      if (err?.response?.status === 401) handleAuthRedirect();
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    const content = replyContent[parentId];
    if (!content || !content.trim()) return;

    const token = getToken();
    const user = getDecodedUser();
    if (!token || !user) {
      handleAuthRedirect();
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API}/api/${postId}/comment`,
        { content: content.trim(), parentId },
        { headers: authHeaders(token) }
      );
      setReplyContent((prev) => ({ ...prev, [parentId]: '' }));
      await fetchComments();
      updatePostComments();
    } catch (err: any) {
      console.error('handleReplySubmit error', err);
      if (err?.response?.status === 401) handleAuthRedirect();
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    const token = getToken();
    const user = getDecodedUser();
    if (!token || !user) {
      handleAuthRedirect();
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API}/api/comment/${commentId}/like`, {}, { headers: authHeaders(token) });
      await fetchComments();
    } catch (err: any) {
      console.error('toggleLike error', err);
      if (err?.response?.status === 401) handleAuthRedirect();
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    const token = getToken();
    const user = getDecodedUser();
    if (!token || !user) {
      handleAuthRedirect();
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${API}/api/comment/${commentId}`, { headers: authHeaders(token) });
      await fetchComments();
      updatePostComments();
    } catch (err: any) {
      console.error('deleteComment error', err);
      if (err?.response?.status === 401) handleAuthRedirect();
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (commentId: string, currentContent: string) => {
    setEditingId(commentId);
    setEditContent((prev) => ({ ...prev, [commentId]: currentContent }));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent({});
  };

  const handleEditSubmit = async (commentId: string) => {
    const content = editContent[commentId];
    if (!content || !content.trim()) return;

    const token = getToken();
    const user = getDecodedUser();
    if (!token || !user) {
      handleAuthRedirect();
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `${API}/api/comment/${commentId}`,
        { content: content.trim() },
        { headers: authHeaders(token) }
      );
      setEditingId(null);
      setEditContent({});
      await fetchComments();
    } catch (err: any) {
      console.error('handleEditSubmit error', err);
      if (err?.response?.status === 401) handleAuthRedirect();
    } finally {
      setLoading(false);
    }
  };

  const isCommentOwner = (commentUserId: string) => {
    return currentUser && currentUser.id === commentUserId;
  };

  return (
    <div className="w-full md:w-1/3 bg-gray-900/95 text-violet-200 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-violet-500/20">
        <h3 className="font-bold text-lg">Comments</h3>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          aria-label="Close comments"
        >
          <FaTimes />
        </motion.button>
      </div>

      <CustomScrollbar className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {loading && comments.length === 0 && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
            </div>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-700 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {comment.user.profileImageUrl ? (
                    <img 
                      src={comment.user.profileImageUrl} 
                      alt={comment.user.username} 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-violet-900/50 flex items-center justify-center">
                      <FaUser className="text-violet-400 text-sm" />
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-sm">{comment.user.username}</span>
                    <span className="text-xs text-gray-400 block">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                  </div>
                </div>
                
                {isCommentOwner(comment.user.id) && (
                  <div className="relative group">
                    <button className="p-1 text-gray-400 hover:text-violet-300">
                      <FaEllipsisV className="text-sm" />
                    </button>
                    <div className="absolute right-0 top-6 bg-gray-800 rounded-lg shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <button 
                        onClick={() => startEditing(comment.id, comment.content)}
                        className="flex items-center px-3 py-1.5 text-sm hover:bg-gray-700 w-full"
                      >
                        <FaEdit className="mr-2 text-xs" /> Edit
                      </button>
                      <button 
                        onClick={() => deleteComment(comment.id)}
                        className="flex items-center px-3 py-1.5 text-sm text-rose-500 hover:bg-gray-700 w-full"
                      >
                        <FaTrash className="mr-2 text-xs" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="ml-10 mt-2 flex flex-col space-y-2">
                  <textarea
                    value={editContent[comment.id] || ''}
                    onChange={(e) => setEditContent((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                    className="flex-1 bg-gray-800 p-2 rounded resize-none"
                    rows={3}
                  />
                  <div className="flex space-x-2 self-end">
                    <button 
                      onClick={cancelEditing}
                      className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 flex items-center"
                    >
                      <FaTimesCircle className="mr-1" /> Cancel
                    </button>
                    <button 
                      onClick={() => handleEditSubmit(comment.id)}
                      className="px-3 py-1.5 text-sm rounded bg-violet-600 hover:bg-violet-500 flex items-center"
                    >
                      <FaCheck className="mr-1" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="ml-10 mt-1 text-sm">{comment.content}</p>
              )}

              <div className="ml-10 flex space-x-4 mt-2 text-sm">
                <button 
                  onClick={() => toggleLike(comment.id)} 
                  className="flex items-center space-x-1 transition-colors hover:text-rose-400"
                >
                  <FaHeart className={comment.isLiked ? 'text-rose-500' : 'text-violet-400'} />
                  <span>{comment.likes || 0}</span>
                </button>

                <button 
                  onClick={() => setReplyContent((prev) => ({ ...prev, [comment.id]: prev[comment.id] ?? '' }))} 
                  className="flex items-center space-x-1 transition-colors hover:text-blue-400"
                >
                  <FaReply />
                  <span>Reply</span>
                </button>
              </div>

              {Object.prototype.hasOwnProperty.call(replyContent, comment.id) && (
                <div className="ml-10 mt-2 flex space-x-2">
                  <input
                    type="text"
                    value={replyContent[comment.id] || ''}
                    onChange={(e) => setReplyContent((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                    className="flex-1 bg-gray-800 p-2 rounded text-sm"
                    placeholder="Write a reply..."
                  />
                  <button 
                    onClick={() => handleReplySubmit(comment.id)} 
                    className="bg-violet-600 hover:bg-violet-500 px-3 py-2 rounded text-sm transition-colors"
                  >
                    Send
                  </button>
                </div>
              )}

              {comment.replies?.map((reply) => (
                <div key={reply.id} className="ml-10 mt-3 border-l-2 border-violet-500/30 pl-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {reply.user.profileImageUrl ? (
                        <img 
                          src={reply.user.profileImageUrl} 
                          alt={reply.user.username} 
                          className="w-6 h-6 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-violet-900/50 flex items-center justify-center">
                          <FaUser className="text-violet-400 text-xs" />
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-sm">{reply.user.username}</span>
                        <span className="text-xs text-gray-400 block">{formatDistanceToNow(new Date(reply.createdAt))} ago</span>
                      </div>
                    </div>
                    
                    {isCommentOwner(reply.user.id) && (
                      <div className="relative group">
                        <button className="p-1 text-gray-400 hover:text-violet-300">
                          <FaEllipsisV className="text-xs" />
                        </button>
                        <div className="absolute right-0 top-6 bg-gray-800 rounded-lg shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                          <button 
                            onClick={() => startEditing(reply.id, reply.content)}
                            className="flex items-center px-3 py-1.5 text-xs hover:bg-gray-700 w-full"
                          >
                            <FaEdit className="mr-2" /> Edit
                          </button>
                          <button 
                            onClick={() => deleteComment(reply.id)}
                            className="flex items-center px-3 py-1.5 text-xs text-rose-500 hover:bg-gray-700 w-full"
                          >
                            <FaTrash className="mr-2" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {editingId === reply.id ? (
                    <div className="ml-8 mt-2 flex flex-col space-y-2">
                      <textarea
                        value={editContent[reply.id] || ''}
                        onChange={(e) => setEditContent((prev) => ({ ...prev, [reply.id]: e.target.value }))}
                        className="flex-1 bg-gray-800 p-2 rounded resize-none text-sm"
                        rows={2}
                      />
                      <div className="flex space-x-2 self-end">
                        <button 
                          onClick={cancelEditing}
                          className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 flex items-center"
                        >
                          <FaTimesCircle className="mr-1" /> Cancel
                        </button>
                        <button 
                          onClick={() => handleEditSubmit(reply.id)}
                          className="px-2 py-1 text-xs rounded bg-violet-600 hover:bg-violet-500 flex items-center"
                        >
                          <FaCheck className="mr-1" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="ml-8 mt-1 text-sm">{reply.content}</p>
                  )}

                  <div className="ml-8 flex space-x-4 mt-1 text-xs">
                    <button 
                      onClick={() => toggleLike(reply.id)} 
                      className="flex items-center space-x-1 transition-colors hover:text-rose-400"
                    >
                      <FaHeart className={reply.isLiked ? 'text-rose-500' : 'text-violet-400'} />
                      <span>{reply.likes || 0}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {!loading && comments.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-6">No comments yet. Be the first to comment.</div>
          )}
        </div>
      </CustomScrollbar>

      <div className="p-4 border-t border-violet-500/20">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-gray-800 p-2 rounded text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
          />
          <button 
            onClick={handleCommentSubmit} 
            disabled={!newComment.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded text-sm transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------
// PostModal Component
// -----------------------------
interface PostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (postId: string) => void;
}

const PostModal: React.FC<PostModalProps> = ({ post, isOpen, onClose, onLike }) => {
  const [showComments, setShowComments] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [postComments, setPostComments] = useState<number>(post?.comments || 0);
  const [postLikes, setPostLikes] = useState<number>(post?.likes || 0);
  const [isLiked, setIsLiked] = useState<boolean>(post?.isLiked || false);

  useEffect(() => {
    const fetchPostData = async () => {
      if (!post) return;
      
      try {
        // Fetch comment count
        const commentResponse = await axios.get(`${API}/api/${post.id}/comment-count`);
        setPostComments(commentResponse.data.comments);

        // Fetch save status and count
        const token = getToken();
        if (token) {
          const saveStatusResponse = await axios.get(`${API}/api/posts/${post.id}/saved`, {
            headers: authHeaders(token)
          });
          setSaved(saveStatusResponse.data.saved);
        }
        
        const saveCountResponse = await axios.get(`${API}/api/posts/${post.id}/saves/count`);
        setSaveCount(saveCountResponse.data.saves);
      } catch (error) {
        console.error('Error fetching post data:', error);
      }
    };

    if (isOpen && post) {
      fetchPostData();
    }
  }, [isOpen, post]);

  if (!post || !isOpen) return null;

  const safeAuthorId = post.authorId || 'unknown';
  const safeAuthorName = post.author?.username || `User #${safeAuthorId.substring(0, 8)}`;

  const handleLike = async () => {
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/login';
        return;
      }

      onLike(post.id);
      setIsLiked(!isLiked);
      setPostLikes(isLiked ? postLikes - 1 : postLikes + 1);
    } catch (err) {
      console.error('handleLike error', err);
    }
  };

  const handleSave = async () => {
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await axios.post(
        `${API}/api/posts/${post.id}/save`,
        {},
        { headers: authHeaders(token) }
      );

      setSaved(response.data.saved);
      
      // Update save count
      if (response.data.saved) {
        setSaveCount(prev => prev + 1);
      } else {
        setSaveCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('handleSave error', err);
    }
  };

  const updatePostComments = () => {
    setPostComments((c) => c + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900/95 backdrop-blur-lg rounded-xl md:rounded-2xl max-w-6xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-violet-500/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Post Content */}
          <div className={`flex-1 ${showComments ? 'hidden md:flex' : 'flex'} flex-col`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-violet-500/20">
              <div className="flex items-center space-x-3">
                <motion.div whileHover={{ scale: 1.05 }} className="w-8 h-8 md:w-10 md:h-10 bg-violet-900/50 rounded-full flex items-center justify-center overflow-hidden">
                  {post.author?.avatar ? (
                    <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
                  ) : (
                    <FaUser className="text-violet-400 text-sm md:text-base" />
                  )}
                </motion.div>

                <div>
                  <h3 className="font-medium text-violet-300 text-sm md:text-base">{safeAuthorName}</h3>
                  <div className="flex items-center space-x-2 text-xs md:text-sm text-violet-500">
                    <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <VisibilityIcon visibility={post.visibility} className="text-xs" />
                      <span>
                        {post.visibility === 'community' && post.communityId
                          ? `in Community #${post.communityId.substring(0, 8)}`
                          : post.visibility}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-1 md:p-2 rounded-full hover:bg-gray-800 transition-colors">
                <FaTimes className="text-gray-400 text-base md:text-lg" />
              </motion.button>
            </div>

            {/* Modal Content */}
            <CustomScrollbar className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6">
                {post.title && <h2 className="text-xl md:text-2xl font-bold text-violet-100 mb-3 md:mb-4">{post.title}</h2>}
                {post.description && <p className="text-violet-200 text-sm md:text-base mb-4 md:mb-6">{post.description}</p>}

                <div className="mb-4 md:mb-6">
                  <RichTextRenderer contentJson={post.contentJson} />
                </div>

                {post.imageUrl && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="mb-4 md:mb-6 rounded-xl overflow-hidden flex justify-center">
                    <img 
                      src={post.imageUrl} 
                      alt="Post" 
                      className="w-full max-w-md h-auto object-contain max-h-64 md:max-h-96" 
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                    />
                  </motion.div>
                )}
              </div>
            </CustomScrollbar>

            {/* Modal Actions */}
            <div className="p-3 md:p-4 border-t border-violet-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 md:space-x-4">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLike} className={`flex items-center space-x-1 md:space-x-2 p-1 md:p-2 rounded-lg transition-colors ${isLiked ? 'text-rose-500 bg-rose-500/10' : 'text-violet-400 hover:text-rose-400 hover:bg-white/5'}`}>
                    <motion.div animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.3 }}>
                      <FaHeart className={isLiked ? 'fill-rose-500 text-sm md:text-base' : 'text-sm md:text-base'} />
                    </motion.div>
                    <span className="text-sm md:text-base">{postLikes}</span>
                  </motion.button>

                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowComments(true)} className="flex items-center space-x-1 md:space-x-2 text-violet-400 hover:text-blue-400 transition-colors p-1 md:p-2 rounded-lg hover:bg-white/5">
                    <FaComment className="text-sm md:text-base" />
                    <span className="text-sm md:text-base">{postComments}</span>
                  </motion.button>

                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center space-x-1 md:space-x-2 text-violet-400 hover:text-violet-300 transition-colors p-1 md:p-2 rounded-lg hover:bg-white/5">
                    <FaShare className="text-sm md:text-base" />
                    <span className="text-sm md:text-base">{post.shares || 0}</span>
                  </motion.button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-violet-400">{saveCount}</span>
                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={handleSave} 
                    className={`p-1 md:p-2 rounded-lg transition-colors ${saved ? 'text-amber-400 bg-amber-500/10' : 'text-violet-400 hover:text-amber-400 hover:bg-white/5'}`}
                  >
                    <FaBookmark className={saved ? 'fill-amber-400 text-sm md:text-base' : 'text-sm md:text-base'} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && <CommentSection postId={post.id} onClose={() => setShowComments(false)} updatePostComments={updatePostComments} />}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PostModal;