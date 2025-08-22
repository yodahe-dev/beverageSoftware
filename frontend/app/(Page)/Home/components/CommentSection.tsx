'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHeart, FaReply, FaTimes } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const API = process.env.Backend_url || 'http://localhost:8000';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
  likes: number;
  isLiked?: boolean;
  replies: Comment[];
}

interface CommentSectionProps {
  postId: string;
  onClose: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, onClose }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`${API}/api${postId}/comments`);
      setComments(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      await axios.post(`${API}/api${postId}/comment`, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    const content = replyContent[parentId];
    if (!content || !content.trim()) return;

    try {
      await axios.post(`${API}/api${postId}/comment`, { content, parentId });
      setReplyContent((prev) => ({ ...prev, [parentId]: '' }));
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLike = async (commentId: string) => {
    try {
      await axios.post(`${API}/api/comment/${commentId}/like`);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await axios.delete(`${API}/api/comment/${commentId}`);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full md:w-1/3 bg-gray-900/95 text-violet-200 flex flex-col">
      <div className="flex justify-between p-4 border-b border-violet-500/20">
        <h3 className="font-bold text-lg">Comments</h3>
        <button onClick={onClose}><FaTimes /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-700 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src={comment.user.profileImageUrl} className="w-8 h-8 rounded-full" />
                <span className="font-medium">{comment.user.username}</span>
                <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(comment.createdAt))}</span>
              </div>
              <button onClick={() => deleteComment(comment.id)} className="text-red-500 text-sm">Delete</button>
            </div>
            <p className="ml-10 mt-1">{comment.content}</p>
            <div className="ml-10 flex space-x-4 mt-1 text-sm">
              <button onClick={() => toggleLike(comment.id)}>
                <FaHeart className={comment.isLiked ? 'text-rose-500' : 'text-violet-400'} /> {comment.likes || 0}
              </button>
              <button onClick={() => setReplyContent((prev) => ({ ...prev, [comment.id]: '' }))}>
                <FaReply /> Reply
              </button>
            </div>

            {/* Reply input */}
            {replyContent.hasOwnProperty(comment.id) && (
              <div className="ml-10 mt-2 flex space-x-2">
                <input
                  type="text"
                  value={replyContent[comment.id]}
                  onChange={(e) => setReplyContent((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                  className="flex-1 bg-gray-800 p-2 rounded"
                  placeholder="Write a reply..."
                />
                <button onClick={() => handleReplySubmit(comment.id)} className="bg-violet-600 p-2 rounded">Send</button>
              </div>
            )}

            {/* Render replies */}
            {comment.replies?.map((reply) => (
              <div key={reply.id} className="ml-10 mt-2 border-l border-gray-700 pl-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img src={reply.user.profileImageUrl} className="w-6 h-6 rounded-full" />
                    <span className="font-medium">{reply.user.username}</span>
                    <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(reply.createdAt))}</span>
                  </div>
                  <button onClick={() => deleteComment(reply.id)} className="text-red-500 text-sm">Delete</button>
                </div>
                <p className="ml-8 mt-1">{reply.content}</p>
                <div className="ml-8 flex space-x-4 mt-1 text-sm">
                  <button onClick={() => toggleLike(reply.id)}>
                    <FaHeart className={reply.isLiked ? 'text-rose-500' : 'text-violet-400'} /> {reply.likes || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* New comment input */}
      <div className="p-4 border-t border-violet-500/20 flex space-x-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 bg-gray-800 p-2 rounded"
        />
        <button onClick={handleCommentSubmit} className="bg-violet-600 p-2 rounded">Send</button>
      </div>
    </div>
  );
};

export default CommentSection;
