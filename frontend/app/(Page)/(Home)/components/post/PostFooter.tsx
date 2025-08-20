import { formatDistanceToNow } from "date-fns"

interface PostFooterProps {
  createdAt: string;
}

export default function PostFooter({ createdAt }: PostFooterProps) {
  return (
    <div className="px-6 py-3 border-t border-white/10 text-xs text-violet-500">
      {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
    </div>
  )
}