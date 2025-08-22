import { motion } from "framer-motion"
import { FaHeart, FaComment, FaShare, FaBookmark } from "react-icons/fa"

interface PostActionsProps {
  likes: number;
  isLiked: boolean;
  comments: number;
  shares: number;
  saved: boolean;
  onLike: (e: React.MouseEvent) => void;
  onSave: (e: React.MouseEvent) => void;
}

export default function PostActions({
  likes,
  isLiked,
  comments,
  shares,
  saved,
  onLike,
  onSave
}: PostActionsProps) {
  return (
    <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
      <div className="flex space-x-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLike}
          className={`flex items-center space-x-2 text-sm relative ${
            isLiked ? "text-rose-500" : "text-violet-400 hover:text-rose-400"
          }`}
        >
          <motion.div
            animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <FaHeart className={isLiked ? "fill-rose-500" : ""} />
          </motion.div>
          <span>{likes}</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 text-sm text-violet-400 hover:text-blue-400"
        >
          <FaComment />
          <span>{comments}</span>
        </motion.button>

        <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSave}
        className={`p-2 rounded-full ${
          saved ? "text-amber-400 bg-amber-500/10" : "text-violet-400 hover:text-amber-400 hover:bg-white/10"
        }`}
      >
        <FaBookmark className={saved ? "fill-amber-400" : ""} />
      </motion.button>
      </div>

      <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 text-sm text-violet-400 hover:text-violet-300"
        >
          <FaShare />
        </motion.button>
    </div>
  )
}