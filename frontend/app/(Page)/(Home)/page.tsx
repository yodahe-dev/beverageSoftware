'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  FaUser, 
  FaUsers, 
  FaGlobe, 
  FaLock, 
  FaHeart, 
  FaComment, 
  FaShare, 
  FaBookmark,
  FaEllipsisH,
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaSearch,
  FaPlus,
  FaCompass,
  FaBell,
  FaCog,
  FaHome,
  FaEnvelope,
  FaUserCircle,
  FaHashtag,
  FaBars
} from 'react-icons/fa';
import LeftSidebar  from './components/Leftbar'
import RightSidebar  from './components/RightBar'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

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
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface VisibilityIconProps {
  visibility: string;
  className?: string;
}

interface TextItem {
  type: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: { color?: string } }>;
  content?: TextItem[];
  attrs?: { level?: number };
}

interface ContentItem {
  type: string;
  content?: TextItem[];
  attrs?: { level?: number; src?: string; alt?: string; checked?: boolean };
}

interface BlockItem {
  type: string;
  text?: string;
  // Add other possible properties for different block types
}

export const VisibilityIcon = ({ visibility, className = "" }: { visibility: string; className?: string }) => {
  switch (visibility) {
    case 'public': return <FaGlobe className={className} />;
    case 'private': return <FaLock className={className} />;
    case 'friends': case 'community': return <FaUsers className={className} />;
    default: return <FaGlobe className={className} />;
  }
};

// Render text with marks
const renderText = (textItem: TextItem, key: number) => {
  if (!textItem || textItem.type !== 'text') return null;
  let className = "";
  let style: React.CSSProperties = {};

  textItem.marks?.forEach((mark: any) => {
    switch (mark.type) {
      case 'bold': className += " font-bold"; break;
      case 'italic': className += " italic"; break;
      case 'underline': className += " underline"; break;
      case 'strike': className += " line-through"; break;
      case 'code': className += " font-mono bg-gray-800 px-1 rounded"; break;
      case 'link': style.color = "#22c55e"; break;
      case 'textStyle':
        if (mark.attrs?.color) style.color = mark.attrs.color;
        break;
      case 'highlight':
        style.backgroundColor = mark.attrs?.color || "yellow";
        break;
      case 'subscript': className += " align-sub text-sm"; break;
      case 'superscript': className += " align-super text-sm"; break;
      case 'mention': className += " text-blue-400"; break;
      case 'hashtag': className += " text-cyan-400"; break;
      default: break;
    }
  });

  return <span key={key} className={className} style={style}>{textItem.text}</span>;
};

// Recursive render for nested content
const renderContent = (item: ContentItem, key: number): JSX.Element | null => {
  if (!item) return null;

  switch (item.type) {
    case 'paragraph':
      return <p key={key} className="mb-4">{item.content?.map((textItem, i) => renderText(textItem, i))}</p>;

    case 'heading':
      const HeadingTag = `h${item.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag key={key} className={`text-emerald-300 font-bold my-4 
          ${item.attrs?.level === 1 ? 'text-2xl' : item.attrs?.level === 2 ? 'text-xl' : 'text-lg'}`}>
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </HeadingTag>
      );

    case 'blockquote':
      return (
        <blockquote key={key} className="border-l-4 border-emerald-500 pl-4 italic my-4 text-gray-300">
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </blockquote>
      );

    case 'codeBlock':
      return (
        <pre key={key} className="bg-gray-800 text-rose-300 p-4 rounded my-4 overflow-x-auto">
          <code>{item.content?.map((t: any, i: number) => t.text).join('')}</code>
        </pre>
      );

    case 'horizontalRule':
      return <hr key={key} className="border-t border-gray-700 my-4" />;

    case 'hardBreak':
      return <br key={key} />;

    case 'bulletList':
    case 'orderedList':
      const ListTag = item.type === 'bulletList' ? 'ul' : 'ol';
      return React.createElement(ListTag, { key, className: `my-4 ${item.type==='bulletList'?'list-disc':'list-decimal'} pl-6` },
        item.content?.map((li: ContentItem, i: number) => 
          <li key={i}>{li.content?.map((contentItem, j) => renderContent(contentItem, j))}</li>)
      );

    case 'table':
      return (
        <table key={key} className="w-full border border-emerald-500 my-4 rounded overflow-hidden">
          <tbody>
            {item.content?.map((row: ContentItem, rIdx: number) => (
              <tr key={rIdx}>
                {row.content?.map((cell: ContentItem, cIdx: number) => {
                  const CellTag = cell.type === 'tableHeader' ? 'th' : 'td';
                  return React.createElement(CellTag, { 
                    key: cIdx, 
                    className: "border-b border-emerald-400 px-2 py-1 text-left" 
                  }, cell.content?.map((textItem, i) => renderText(textItem, i)));
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case 'image':
      return (
        <div key={key} className="my-4 flex justify-center">
          <img 
            src={item.attrs?.src} 
            alt={item.attrs?.alt || ""} 
            className="rounded object-contain max-h-96"
          />
        </div>
      );

    case 'iframe':
      return (
        <div key={key} className="my-4 aspect-video w-full">
          <iframe src={item.attrs?.src} className="w-full h-full rounded" title="Embedded content" />
        </div>
      );

    case 'callout':
      return (
        <div key={key} className="border-dashed border-emerald-500 p-4 rounded my-4 bg-green-900/10">
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </div>
      );

    case 'panel':
      return (
        <div key={key} className="bg-gray-800/50 p-4 rounded my-4 border-l-4 border-emerald-500">
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </div>
      );

    case 'taskList':
      return (
        <ul key={key} className="my-4 list-none pl-4">
          {item.content?.map((task: ContentItem, i: number) => (
            <li key={i} className="flex items-start my-2">
              <input 
                type="checkbox" 
                checked={task.attrs?.checked} 
                readOnly 
                className="mt-1 mr-2"
              />
              <span>{task.content?.map((textItem, j) => renderText(textItem, j))}</span>
            </li>
          ))}
        </ul>
      );

    default:
      // For unsupported types, try to render text content
      if (item.content) {
        return (
          <div key={key} className="my-4">
            {item.content.map((contentItem, i) => renderContent(contentItem, i))}
          </div>
        );
      }
      return null;
  }
};

// Render blocks format content (like {"blocks":[{"type":"paragraph","text":"Nature’s mystery."}]})
const renderBlocksContent = (blocks: BlockItem[]) => {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={index} className="mb-4">{block.text}</p>;
          case 'heading':
            return <h2 key={index} className="text-xl font-bold text-emerald-300 my-4">{block.text}</h2>;
          case 'blockquote':
            return <blockquote key={index} className="border-l-4 border-emerald-500 pl-4 italic my-4">{block.text}</blockquote>;
          default:
            return <p key={index} className="mb-4">{block.text}</p>;
        }
      })}
    </div>
  );
};

// Main Renderer
export const RichTextRenderer = ({ contentJson }: { contentJson: any }) => {
  if (!contentJson) return null;
  
  let content;
  try {
    content = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;
  } catch (e) {
    console.error("Error parsing content JSON:", e);
    return <div>Error rendering content</div>;
  }

  // Handle different content formats
  if (content.type === 'doc' && Array.isArray(content.content)) {
    return <div className="rich-text-content space-y-4">{content.content.map((item: ContentItem, i: number) => renderContent(item, i))}</div>;
  } else if (Array.isArray(content.blocks)) {
    return renderBlocksContent(content.blocks);
  } else if (Array.isArray(content)) {
    return <div className="rich-text-content space-y-4">{content.map((item: ContentItem, i: number) => renderContent(item, i))}</div>;
  }

  return <div>Unsupported content format</div>;
};

// Floating Action Button Component
const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              className="absolute -top-16 right-0 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-lg mb-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaComment className="text-white" />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.05 }}
              className="absolute -top-32 right-0 w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center shadow-lg mb-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus className="text-white" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      <motion.button
        className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaPlus className="text-white text-xl" />
        </motion.div>
      </motion.button>
    </div>
  );
};

// Post Modal Component
const PostModal = ({ post, isOpen, onClose }: { post: Post | null, isOpen: boolean, onClose: () => void }) => {
  if (!post || !isOpen) return null;

  const safeAuthorId = post.authorId || 'unknown';
  const safeAuthorName = post.author?.username || `User #${safeAuthorId.substring(0, 8)}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900/95 backdrop-blur-lg rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-emerald-500/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-emerald-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-900/50 rounded-full flex items-center justify-center overflow-hidden">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
                ) : (
                  <FaUser className="text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-emerald-300">{safeAuthorName}</h3>
                <div className="flex items-center space-x-2 text-sm text-emerald-500">
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <VisibilityIcon visibility={post.visibility} className="text-xs" />
                    <span>
                      {post.visibility === 'community' && post.communityId 
                        ? `in Community #${post.communityId.substring(0, 8)}` 
                        : post.visibility
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <FaTimes className="text-gray-400" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {post.title && (
              <h2 className="text-2xl font-bold text-emerald-100 mb-4">{post.title}</h2>
            )}
            
            {post.description && (
              <p className="text-emerald-200 mb-6">{post.description}</p>
            )}

            <div className="mb-6">
              <RichTextRenderer contentJson={post.contentJson} />
            </div>

            {post.imageUrl && (
              <div className="mb-6 rounded-lg overflow-hidden flex justify-center">
                <img 
                  src={post.imageUrl} 
                  alt="Post" 
                  className="w-full max-w-md h-auto object-contain max-h-96"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="p-4 border-t border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-emerald-400 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-white/5">
                  <FaHeart />
                  <span>Like</span>
                </button>
                <button className="flex items-center space-x-2 text-emerald-400 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-white/5">
                  <FaComment />
                  <span>Comment</span>
                </button>
                <button className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition-colors p-2 rounded-lg hover:bg-white/5">
                  <FaShare />
                  <span>Share</span>
                </button>
              </div>
              <button className="text-emerald-400 hover:text-amber-400 transition-colors p-2 rounded-lg hover:bg-white/5">
                <FaBookmark />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Post Card Component
const PostCard = ({ post, onClick }: { post: Post, onClick: () => void }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const maxDescriptionLength = 150;
  
  // Safe author ID handling
  const safeAuthorId = post.authorId || 'unknown';
  const safeAuthorName = post.author?.username || `User #${safeAuthorId.substring(0, 8)}`;
  
  // Safe description handling
  const safeDescription = post.description || '';
  const displayDescription = showFullDescription 
    ? safeDescription 
    : safeDescription.substring(0, maxDescriptionLength) + (safeDescription.length > maxDescriptionLength ? '...' : '');

  const toggleDescription = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullDescription(!showFullDescription);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300"
      onClick={onClick}
      whileHover={{ y: -5 }}
    >
      {/* Post Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-900/50 rounded-full flex items-center justify-center overflow-hidden">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
              ) : (
                <FaUser className="text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-emerald-300">{safeAuthorName}</h3>
              <div className="flex items-center space-x-2 text-sm text-emerald-500">
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <VisibilityIcon visibility={post.visibility} className="text-xs" />
                  <span>
                    {post.visibility === 'community' && post.communityId 
                      ? `in Community #${post.communityId.substring(0, 8)}` 
                      : post.visibility
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <FaEllipsisH className="text-emerald-400" />
          </button>
        </div>

        {post.title && (
          <h2 className="text-xl font-bold text-emerald-100 mb-2">{post.title}</h2>
        )}
        
        {safeDescription && (
          <div className="text-emerald-200">
            <p>{displayDescription}</p>
            {safeDescription.length > maxDescriptionLength && (
              <button 
                onClick={toggleDescription}
                className="text-emerald-400 hover:text-emerald-300 text-sm mt-1"
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Post Preview Image */}
      {post.imageUrl && (
        <div className="w-full aspect-square overflow-hidden flex justify-center bg-black/20">
          <img 
            src={post.imageUrl} 
            alt="Post" 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-emerald-400 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-white/5">
              <FaHeart />
              <span>Like</span>
            </button>
            <button className="flex items-center space-x-2 text-emerald-400 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-white/5">
              <FaComment />
              <span>Comment</span>
            </button>
            <button className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition-colors p-2 rounded-lg hover:bg-white/5">
              <FaShare />
              <span>Share</span>
            </button>
          </div>
          <button className="text-emerald-400 hover:text-amber-400 transition-colors p-2 rounded-lg hover:bg-white/5">
            <FaBookmark />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

// Mobile Navigation Component
const MobileNav = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  return (
    <div className="xl:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-emerald-500/20">
      <div className="flex items-center justify-between p-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-emerald-900/50 text-emerald-400"
        >
          <FaBars />
        </button>
        
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          +Me
        </h1>
        
        <div className="w-8"></div> {/* Spacer for balance */}
      </div>
    </div>
  );
};

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const observer = useRef<IntersectionObserver>();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Load more posts when reaching the bottom
  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/post`);
        // Add mock author data for demonstration
        const postsWithAuthors = response.data.map((post: Post) => ({
          ...post,
          author: {
            id: post.authorId || 'unknown',
            username: `User${(post.authorId || 'unknown').substring(0, 4)}`,
            avatar: Math.random() > 0.5 ? `https://i.pravatar.cc/150?u=${post.authorId}` : undefined
          }
        }));
        setPosts(postsWithAuthors);
        setHasMore(false); // Since we're getting all posts at once
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-emerald-950 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-6"
          ></motion.div>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-emerald-400 text-lg"
          >
            Loading posts...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-emerald-950 flex items-center justify-center">
        <div className="text-center p-8 bg-rose-900/20 border border-rose-500/30 rounded-xl backdrop-blur-md">
          <p className="text-rose-400 text-xl">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-emerald-950 text-white">
      {/* Background decorative elements */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <MobileNav toggleSidebar={toggleSidebar} />
      
      <div className={`fixed inset-0 z-20 bg-black/70 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}>
      </div>
      
      <div className={`fixed left-0 top-0 bottom-0 z-30 w-72 transform transition-transform duration-300 xl:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <LeftSidebar />
      </div>
      
      <div className="hidden xl:block fixed left-0 top-0 bottom-0 z-10 w-20">
        <LeftSidebar />
      </div>
      
      <div className="hidden xl:block fixed right-0 top-0 bottom-0 z-10 w-80">
        <RightSidebar />
      </div>
      
      <FloatingActionButton />

      <div className="pt-16 xl:pt-0 xl:ml-20 xl:mr-0 2xl:mr-80 px-4 xl:px-6 py-8 lg:py-12 relative z-10">
        {/* Header for desktop */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 xl:mb-12 hidden xl:block"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            +Me
          </h1>
          <p className="text-emerald-200 text-lg">
            Discover what matters to you
          </p>
        </motion.header>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {posts.map((post, index) => (
              <div
                key={post.id}
                ref={index === posts.length - 1 ? lastPostRef : null}
              >
                <PostCard 
                  post={post} 
                  onClick={() => setSelectedPost(post)}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loading more indicator */}
        {loading && posts.length > 0 && (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"
            ></motion.div>
          </div>
        )}

        {/* Empty state */}
        {posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-emerald-900/50 rounded-full flex items-center justify-center backdrop-blur-md">
              <FaUsers className="text-4xl text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-200 mb-2">No posts yet</h3>
            <p className="text-emerald-400">Be the first to share something with the community!</p>
          </motion.div>
        )}
      </div>

      {/* Post Modal */}
      <PostModal 
        post={selectedPost} 
        isOpen={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
      />
    </div>
  );
}