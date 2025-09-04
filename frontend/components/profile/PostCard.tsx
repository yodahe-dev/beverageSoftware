"use client";

import { motion } from "framer-motion";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    createdAt: string;
    visibility: string;
  };
  lastPostRef?: React.Ref<HTMLDivElement>;
}

export default function PostCard({ post, lastPostRef }: PostCardProps) {
  return (
    <motion.div
      ref={lastPostRef ? lastPostRef : null}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-[#14171A]/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-[#222832] flex flex-col group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#12D6DF]/5 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {post.imageUrl ? (
        <div className="relative overflow-hidden h-56">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ) : (
        <div className="h-56 bg-[#1A1F24]/50 flex items-center justify-center text-[#A9B4C2]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 relative z-10">
        <h3 className="text-xl font-semibold text-[#E6EAF0] mb-3 line-clamp-2">{post.title}</h3>

        {post.description && (
          <p className="text-[#A9B4C2] text-sm mb-4 flex-1">
            {post.description.length > 120 ? post.description.slice(0, 120) + "..." : post.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#222832]">
          <p className="text-[#A9B4C2] text-xs">
            {new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
          <span className="px-2 py-1 bg-[#1A1F24] text-[#A9B4C2] rounded-full text-xs">{post.visibility}</span>
        </div>
      </div>
    </motion.div>
  );
}
