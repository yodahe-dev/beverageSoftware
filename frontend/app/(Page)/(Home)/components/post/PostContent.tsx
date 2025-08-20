// components/post/PostContent.tsx
import { RichTextRenderer } from "./RichTextRenderer"
import { FaMusic } from "react-icons/fa"
import { motion } from "framer-motion"

interface PostContentProps {
  title?: string;
  description?: string;
  fullDescription: string;
  showFullDescription: boolean;
  onToggleDescription: (e: React.MouseEvent) => void;
  contentJson: any;
  imageUrl?: string;
  song?: string;
  maxDescriptionLength: number;
}

export default function PostContent({
  title,
  description,
  fullDescription,
  showFullDescription,
  onToggleDescription,
  contentJson,
  imageUrl,
  song,
  maxDescriptionLength
}: PostContentProps) {
  return (
    <>
      {/* Title */}
      {title && (
        <h2 className="px-6 text-2xl font-bold text-violet-100 mb-3">{title}</h2>
      )}

      {/* Description */}
      {description && (
        <div className="px-6 text-violet-200 text-sm leading-relaxed mb-4">
          <p>{description}</p>
          {fullDescription.length > maxDescriptionLength && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleDescription}
              className="text-violet-400 hover:text-violet-300 text-xs mt-2"
            >
              {showFullDescription ? "Show less" : "Show more"}
            </motion.button>
          )}
        </div>
      )}

      {/* Post Image */}
      {imageUrl && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-h-[500px] overflow-hidden flex justify-center bg-black/20"
        >
          <img
            src={imageUrl}
            alt="Post"
            className="w-full h-full object-cover"
            onError={(e) => { 
              const target = e.target as HTMLImageElement;
              target.style.display = "none"; 
            }}
          />
        </motion.div>
      )}
    </>
  )
}