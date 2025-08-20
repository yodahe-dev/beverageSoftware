// components/Animation/LikeAnimation.tsx
import { motion } from "framer-motion"
import { FaHeart } from "react-icons/fa"

interface LikeAnimationProps {
  isLiked: boolean;
}

export default function LikeAnimation({ isLiked }: LikeAnimationProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isLiked ? [0, 1.2, 1] : 0, opacity: isLiked ? [0, 1, 0] : 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <motion.div
        className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center"
        animate={{ 
          scale: isLiked ? [0, 1, 0] : 0,
          rotate: isLiked ? [0, 20, -20, 0] : 0
        }}
        transition={{ duration: 0.8 }}
      >
        <FaHeart className="text-white text-2xl" />
      </motion.div>
    </motion.div>
  )
}