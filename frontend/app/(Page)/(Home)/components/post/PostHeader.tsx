// components/post/PostHeader.tsx
import { motion } from "framer-motion"
import { FaUser, FaEllipsisH } from "react-icons/fa"
import { formatDistanceToNow } from "date-fns"
import { VisibilityIcon } from "./VisibilityIcon"

interface PostHeaderProps {
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  visibility: string;
  communityId: string;
}

export default function PostHeader({ author, createdAt, visibility, communityId }: PostHeaderProps) {
  const safeAuthorId = author?.id || 'unknown';
  const safeAuthorName = author?.username || `User #${safeAuthorId.substring(0, 8)}`;

  return (
    <div className="flex justify-between items-start p-6">
      <div className="flex items-center space-x-4">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-violet-900/50 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-70"></div>
          {author?.avatar ? (
            <img
              src={author.avatar}
              alt={author.username}
              className="w-full h-full object-cover relative z-10"
            />
          ) : (
            <FaUser className="text-violet-200 text-lg relative z-10" />
          )}
        </motion.div>
        <div>
          <h3 className="font-semibold text-violet-200 text-lg">{safeAuthorName}</h3>
          <div className="flex items-center space-x-2 text-sm text-violet-400">
            <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
            <span>•</span>
            <VisibilityIcon visibility={visibility} className="text-xs" />
            {visibility === 'community' && communityId && (
              <>
                <span>•</span>
                <span>in Community #{communityId.substring(0, 8)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <FaEllipsisH className="text-violet-400" />
      </motion.button>
    </div>
  )
}