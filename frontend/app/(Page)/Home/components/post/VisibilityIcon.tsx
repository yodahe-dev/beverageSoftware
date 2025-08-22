// components/post/VisibilityIcon.tsx
import { FaGlobe, FaLock, FaUsers } from "react-icons/fa"

interface VisibilityIconProps {
  visibility: string;
  className?: string;
}

export const VisibilityIcon = ({ visibility, className = "" }: VisibilityIconProps) => {
  switch (visibility) {
    case 'public': return <FaGlobe className={className} />;
    case 'private': return <FaLock className={className} />;
    case 'friends': case 'community': return <FaUsers className={className} />;
    default: return <FaGlobe className={className} />;
  }
};