"use client";

import { AnimatePresence, motion } from "framer-motion";
import PostCard from "./PostCard";

interface Post {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  visibility: string;
}

interface PostsGridProps {
  posts: Post[];
  lastPostRef?: React.Ref<HTMLDivElement>;
  order: "ASC" | "DESC";
  setOrder: (order: "ASC" | "DESC") => void;
  loadingMore: boolean;
  hasMore: boolean;
}

export default function PostsGrid({ posts, lastPostRef, order, setOrder, loadingMore, hasMore }: PostsGridProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="flex justify-between items-center mb-8"
      >
        <h2 className="text-2xl font-bold text-[#E6EAF0]">Posts</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOrder(order === "DESC" ? "ASC" : "DESC")}
          className="px-4 py-2 bg-[#1A1F24] hover:bg-[#222832] rounded-xl text-sm font-semibold flex items-center backdrop-blur-sm border border-[#222832] text-[#E6EAF0]"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          {order === "DESC" ? "Newest First" : "Oldest First"}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {posts.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.5 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} lastPostRef={index === posts.length - 1 ? lastPostRef : undefined} />
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.5 }} className="text-center py-20">
            <div className="bg-[#14171A]/80 backdrop-blur-md rounded-2xl p-10 max-w-md mx-auto border border-[#222832]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#A9B4C2] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-[#E6EAF0] mb-2">No posts yet</h3>
              <p className="text-[#A9B4C2]">You haven't created any posts yet.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loadingMore && (
        <div className="flex justify-center mt-10">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 rounded-full border-t-2 border-b-2 border-[#12D6DF]"></motion.div>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-12">
          <div className="inline-flex items-center bg-[#14171A]/80 backdrop-blur-sm rounded-full px-4 py-2 border border-[#222832]">
            <svg className="w-5 h-5 mr-2 text-[#12D6DF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-[#A9B4C2]">You've reached the end of your posts</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
