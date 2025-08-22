'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  FaArrowRight, FaImage, FaTimes, FaBold, FaItalic, FaUnderline, 
  FaStrikethrough, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaListOl, FaListUl, FaSubscript, FaSuperscript, FaLink, FaParagraph,
  FaCode, FaQuoteRight, FaTextHeight, FaIndent, FaOutdent, FaHighlighter,
  FaPalette, FaEraser, FaMagic, FaUndo, FaRedo, FaPlus, FaMinus, FaFont,
  FaLock, FaGlobe, FaUsers, FaUserFriends, FaTable, FaHeading, FaEye,
  FaRobot, FaRocket, FaBrain, FaAtom, FaFingerprint, FaChartLine,
  FaHashtag, FaRegSmile, FaPaperPlane, FaCog, FaLightbulb, 
} from 'react-icons/fa';
import { HexColorPicker } from 'react-colorful';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';

import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import {TextStyle} from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CharacterCount from '@tiptap/extension-character-count';
import { createLowlight  } from 'lowlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';

const lowlight = createLowlight();

lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('js', js);
lowlight.register('ts', ts);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  email: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [highlightColor, setHighlightColor] = useState('#10B981');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isFormattingMenuOpen, setIsFormattingMenuOpen] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');
  const [engagementScore, setEngagementScore] = useState(0);
  const [titleLength, setTitleLength] = useState(0);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [communityId, setCommunityId] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Superscript,
      Subscript,
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: 'Share something amazing with the world... ✨',
      }),
      Typography,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CharacterCount,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none p-4 min-h-[300px]',
      },
    },
    immediatelyRender: false,
    onUpdate: () => {
      // Calculate engagement score based on content
      if (!editor) return;
      const content = editor.getText();
      const wordCount = content.split(/\s+/).length;
      const headingCount = (content.match(/#+/g) || []).length;
      const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
      
      const score = Math.min(100, wordCount * 0.5 + headingCount * 5 + linkCount * 3);
      setEngagementScore(score);
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode<{ id: string; name: string; email: string }>(token);
      setUser({
        id: decoded.id,
        name: decoded.name,
        email: decoded.email
      });
    } catch (error) {
      console.error('Token decoding error:', error);
      setError('Session expired. Please login again');
      localStorage.removeItem('token');
      setTimeout(() => router.push('/login'), 2000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (imageUrl) {
      setImageLoading(true);
      setImageError(false);
      
      const img = new Image();
      img.src = imageUrl;
      
      img.onload = () => {
        setImageLoading(false);
      };
      
      img.onerror = () => {
        setImageLoading(false);
        setImageError(true);
      };
    }
  }, [imageUrl]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 100) {
      setTitle(value);
      setTitleLength(value.length);
    }
  };

  const handleCreatePost = async () => {
    setError(null);
    setIsSubmitting(true);
    
    if (!title.trim()) {
      setError('Title is required');
      setIsSubmitting(false);
      return;
    }
    
    if (!description.trim()) {
      setError('Description is required');
      setIsSubmitting(false);
      return;
    }
    
    if (!editor?.getText().trim()) {
      setError('Content is required');
      setIsSubmitting(false);
      return;
    }
    
    if (visibility === 'community' && !communityId.trim()) {
      setError('Community ID is required for community posts');
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/api/newpost`,
        {
          title,
          description,
          contentJson: editor?.getJSON(),
          imageUrl: imageUrl || undefined,
          visibility,
          ...(visibility === 'community' && { communityId })
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      setSuccess(true);
      setTitle('');
      setTitleLength(0);
      setDescription('');
      editor?.commands.clearContent();
      setImageUrl('');
      setVisibility('public');
      setCommunityId('');
      setTextColor('#FFFFFF');
      setHighlightColor('#10B981');
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Post creation error:', err);
      
      let errorMessage = 'Failed to create post';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again';
          localStorage.removeItem('token');
          setTimeout(() => router.push('/login'), 3000);
        } else if (err.response.status === 404) {
          errorMessage = 'API endpoint not found';
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        } else {
          errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageRemove = () => {
    setImageUrl('');
    setImageError(false);
  };

  const setLink = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
      setShowLinkInput(false);
      setLinkUrl('');
    }
  };

  const addCodeBlock = () => {
    editor?.chain().focus().setCodeBlock().run();
  };

  const toggleFormattingMenu = () => {
    setIsFormattingMenuOpen(!isFormattingMenuOpen);
  };

  const togglePreview = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
            Authenticating...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-500/10"
            initial={{
              scale: 0,
              opacity: 0,
              x: Math.random() * 100 - 50 + 'vw',
              y: Math.random() * 100 - 50 + 'vh'
            }}
            animate={{
              scale: [0, Math.random() * 2 + 1, 0],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            style={{
              width: Math.random() * 100 + 50 + 'px',
              height: Math.random() * 100 + 50 + 'px',
            }}
          />
        ))}
        
        {/* Animated particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-12"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"
            >
              +Me
            </motion.div>
            <div className="h-8 w-px bg-emerald-700/50 mx-2"></div>
            <h1 className="text-xl font-medium text-emerald-200">Create New Post</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={togglePreview}
                className="bg-emerald-900/50 hover:bg-emerald-800/50 backdrop-blur-md border border-emerald-700/30 rounded-lg px-4 py-2 text-sm flex items-center space-x-2"
              >
                <FaEye className="text-emerald-400" />
                <span>{isPreviewOpen ? 'Edit' : 'Preview'}</span>
              </Button>
            </motion.div>
            
          </div>
        </motion.header>

        <AnimatePresence>
          {(error || success) && (
            <motion.div
              key="alert"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`mb-8 p-4 rounded-xl border backdrop-blur-md ${
                success 
                  ? 'bg-emerald-900/20 border-emerald-500/30' 
                  : 'bg-rose-900/20 border-rose-500/30'
              }`}
            >
              <p className={success ? 'text-emerald-400 flex items-center' : 'text-rose-400 flex items-center'}>
                {success ? (
                  <>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 0.5 }}
                      className="mr-2"
                    >
                      🎉
                    </motion.div>
                    Post created successfully!
                  </>
                ) : (
                  <>
                    <motion.div
                      transition={{ duration: 0.5 }}
                      className="mr-2"
                    >
                      ⚠️
                    </motion.div>
                    {error}
                  </>
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Content Tabs */}
            <motion.div 
              className="flex border-b border-emerald-800/30"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                className={`px-4 py-2 text-sm font-medium relative ${activeTab === 'compose' ? 'text-emerald-400' : 'text-gray-400 hover:text-gray-300'}`}
                onClick={() => setActiveTab('compose')}
              >
                <motion.span
                  animate={activeTab === 'compose' ? { scale: 1.05 } : { scale: 1 }}
                  className="flex items-center"
                >
                  Compose
                </motion.span>
                {activeTab === 'compose' && (
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                    layoutId="activeTab"
                  />
                )}
              </button>
            </motion.div>

            {/* Title Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/20 backdrop-blur-md border border-emerald-700/30 rounded-xl p-6"
            >
              <div className="flex justify-between items-center mb-3">
                <Label className="text-emerald-400 text-sm font-medium uppercase tracking-wider">
                  Title *
                </Label>
                <span className={`text-xs ${titleLength > 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {titleLength}/100
                </span>
              </div>
              <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="Catchy title here..."
                className="bg-black/30 border border-emerald-700/30 text-white placeholder-emerald-700 h-12 text-lg px-5 rounded-lg hover:border-emerald-500/50 focus:border-emerald-400/50 transition-all duration-300"
                maxLength={100}
              />
            </motion.div>

            {/* Description Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-black/20 backdrop-blur-md border border-emerald-700/30 rounded-xl p-6"
            >
              <Label className="block mb-3 text-emerald-400 text-sm font-medium uppercase tracking-wider">
                Description *
              </Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your post..."
                className="w-full bg-black/30 border border-emerald-700/30 text-white placeholder-emerald-700 h-28 text-base px-5 py-3 rounded-lg hover:border-emerald-500/50 focus:border-emerald-400/50 transition-all duration-300 resize-none"
              />
            </motion.div>

            {/* Content Editor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border border-emerald-700/30 rounded-xl overflow-hidden bg-black/20 backdrop-blur-md"
            >
              {/* Floating Formatting Menu */}
              {editor && !isPreviewOpen && (
                <FloatingMenu
                  editor={editor}
                  className="bg-black/70 backdrop-blur-md border border-emerald-700/30 rounded-lg p-1 grid grid-cols-2 gap-1"
                >
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded-md ${editor.isActive('heading', { level: 1 }) ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                  >
                    H1
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded-md ${editor.isActive('heading', { level: 2 }) ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                  >
                    H2
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded-md ${editor.isActive('bulletList') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                  >
                    <FaListUl />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded-md ${editor.isActive('orderedList') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                  >
                    <FaListOl />
                  </button>
                  
                  <button
                    onClick={addCodeBlock}
                    className={`p-2 rounded-md ${editor.isActive('codeBlock') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                  >
                    <FaCode />
                  </button>
                </FloatingMenu>
              )}

              {/* Bubble Menu */}
              {editor && !isPreviewOpen && (
                <BubbleMenu
                  editor={editor}
                  className="bg-black/70 backdrop-blur-md border border-emerald-700/30 rounded-lg p-1 flex flex-wrap gap-1"
                >
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded-md ${editor.isActive('bold') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                    title="Bold"
                  >
                    <FaBold />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded-md ${editor.isActive('italic') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                    title="Italic"
                  >
                    <FaItalic />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded-md ${editor.isActive('underline') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                    title="Underline"
                  >
                    <FaUnderline />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-2 rounded-md ${editor.isActive('strike') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                    title="Strikethrough"
                  >
                    <FaStrikethrough />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleSuperscript().run()}
                    className={`p-2 rounded-md ${editor.isActive('superscript') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                    title="Superscript"
                  >
                    <FaSuperscript />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleSubscript().run()}
                    className={`p-2 rounded-md ${editor.isActive('subscript') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                    title="Subscript"
                  >
                    <FaSubscript />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().setHighlight({ color: highlightColor }).run()}
                    className={`p-2 rounded-md ${editor.isActive('highlight') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                    title="Highlight"
                  >
                    <FaHighlighter />
                  </button>
                  <button
                    onClick={() => setShowLinkInput(true)}
                    className={`p-2 rounded-md ${editor.isActive('link') ? 'bg-emerald-900/50' : 'hover:bg-emerald-900/30'}`}
                    title="Link"
                  >
                    <FaLink />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().unsetAllMarks().run()}
                    className={`p-2 rounded-md hover:bg-emerald-900/30`}
                    title="Clear Formatting"
                  >
                    <FaEraser />
                  </button>
                </BubbleMenu>
              )}

              {/* Formatting Toolbar */}
              {!isPreviewOpen && (
                <div className="bg-black/40 backdrop-blur-md p-3 border-b border-emerald-700/30 flex flex-wrap gap-2">
                  {/* History */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => editor?.chain().focus().undo().run()}
                      disabled={!editor?.can().undo()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 ${editor?.can().undo() ? 'hover:bg-emerald-900/30' : 'opacity-50'}`}
                      title="Undo"
                    >
                      <FaUndo className="text-emerald-400" />
                    </button>
                    <button 
                      onClick={() => editor?.chain().focus().redo().run()}
                      disabled={!editor?.can().redo()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 ${editor?.can().redo() ? 'hover:bg-emerald-900/30' : 'opacity-50'}`}
                      title="Redo"
                    >
                      <FaRedo className="text-emerald-400" />
                    </button>
                  </div>
                  
                  {/* Text Formatting */}
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 ${editor?.isActive('bold') ? 'bg-emerald-900/30' : 'hover:bg-emerald-900/30'}`}
                      title="Bold"
                    >
                      <FaBold className="text-emerald-400" />
                    </button>
                    <button 
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 ${editor?.isActive('italic') ? 'bg-emerald-900/30' : 'hover:bg-emerald-900/30'}`}
                      title="Italic"
                    >
                      <FaItalic className="text-emerald-400" />
                    </button>
                    <button 
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 ${editor?.isActive('underline') ? 'bg-emerald-900/30' : 'hover:bg-emerald-900/30'}`}
                      title="Underline"
                    >
                      <FaUnderline className="text-emerald-400" />
                    </button>
                    <button 
                      onClick={() => editor?.chain().focus().toggleStrike().run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 ${editor?.isActive('strike') ? 'bg-emerald-900/30' : 'hover:bg-emerald-900/30'}`}
                      title="Strikethrough"
                    >
                      <FaStrikethrough className="text-emerald-400" />
                    </button>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors flex items-center ${editor?.isActive('textStyle') ? 'bg-emerald-900/30' : ''}`}
                        title="Text Color"
                      >
                        <FaPalette className="text-emerald-400 mr-1" />
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: textColor }}
                        />
                      </button>
                      
                      <AnimatePresence>
                        {showColorPicker && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-10 mt-2 p-3 bg-black/90 backdrop-blur-md border border-emerald-700/30 rounded-xl shadow-lg"
                          >
                            <HexColorPicker color={textColor} onChange={setTextColor} />
                            <div className="mt-2 flex justify-between">
                              <button 
                                onClick={() => {
                                  editor?.chain().focus().setColor(textColor).run();
                                  setShowColorPicker(false);
                                }}
                                className="px-3 py-1 bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                Apply
                              </button>
                              <button 
                                onClick={() => {
                                  setTextColor('#FFFFFF');
                                  editor?.chain().focus().unsetColor().run();
                                  setShowColorPicker(false);
                                }}
                                className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                Reset
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <button 
                      onClick={() => editor?.chain().focus().toggleHighlight({ color: highlightColor }).run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors flex items-center ${editor?.isActive('highlight') ? 'bg-emerald-900/30' : ''}`}
                      title="Highlight"
                    >
                      <FaHighlighter className="text-emerald-400" />
                    </button>
                    
                    <button 
                      onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors ${editor?.isActive('superscript') ? 'bg-emerald-900/30' : ''}`}
                      title="Superscript"
                    >
                      <FaSuperscript className="text-emerald-400" />
                    </button>
                    <button 
                      onClick={() => editor?.chain().focus().toggleSubscript().run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors ${editor?.isActive('subscript') ? 'bg-emerald-900/30' : ''}`}
                      title="Subscript"
                    >
                      <FaSubscript className="text-emerald-400" />
                    </button>
                    
                    <button 
                      onClick={() => editor?.chain().focus().unsetAllMarks().run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors`}
                      title="Clear Formatting"
                    >
                      <FaEraser className="text-emerald-400" />
                    </button>
                  </div>
                  
                  {/* Block Formatting */}
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <button 
                        onClick={toggleFormattingMenu}
                        className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors flex items-center ${isFormattingMenuOpen ? 'bg-emerald-900/30' : ''}`}
                        title="Formatting Options"
                      >
                        <FaMagic className="text-emerald-400 mr-2" />
                        Format
                      </button>
                      
                      <AnimatePresence>
                        {isFormattingMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-10 mt-2 left-0 w-64 bg-black/90 backdrop-blur-md border border-emerald-700/30 rounded-xl shadow-lg p-3 grid grid-cols-2 gap-2"
                          >
                            <button 
                              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                              className={`p-2 rounded-lg text-left ${editor?.isActive('heading', { level: 1 }) ? 'bg-emerald-900/30' : 'hover:bg-emerald-900/30'}`}
                            >
                              <span className="font-bold text-lg">Heading 1</span>
                            </button>
                            <button 
                              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                              className={`p-2 rounded-lg text-left ${editor?.isActive('heading', { level: 2 }) ? 'bg-emerald-900/30' : 'hover:bg-emerald-900/30'}`}
                            >
                              <span className="font-bold">Heading 2</span>
                            </button>
                            <button 
                              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                              className={`p-2 rounded-lg text-left ${editor?.isActive('heading', { level: 3 }) ? 'bg-emerald-900/30' : 'hover:bg-emerald-900/30'}`}
                            >
                              <span className="font-bold text-sm">Heading 3</span>
                            </button>
                            <button 
                              onClick={() => editor?.chain().focus().setParagraph().run()}
                              className={`p-2 rounded-lg text-left ${editor?.isActive('paragraph') ? 'bg-emerald-900/30' : 'hover:bg-emerald-900/30'}`}
                            >
                              <FaParagraph className="inline mr-2" /> Paragraph
                            </button>
                            <button 
                              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                              className={`p-2 rounded-lg text-left ${editor?.isActive('blockquote') ? 'bg-emerald-900/30' : 'hover:bg-emerald-900/30'}`}
                            >
                              <FaQuoteRight className="inline mr-2" /> Quote
                            </button>
                            <button 
                              onClick={addCodeBlock}
                              className={`p-2 rounded-lg text-left ${editor?.isActive('codeBlock') ? 'bg-emerald-900/30' : 'hover:bg-emerald-900/30'}`}
                            >
                              <FaCode className="inline mr-2" /> Code
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <button 
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors ${editor?.isActive('orderedList') ? 'bg-emerald-900/30' : ''}`}
                      title="Numbered List"
                    >
                      <FaListOl className="text-emerald-400" />
                    </button>
                    <button 
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors ${editor?.isActive('bulletList') ? 'bg-emerald-900/30' : ''}`}
                      title="Bullet List"
                    >
                      <FaListUl className="text-emerald-400" />
                    </button>
                    
                    <button 
                      onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors ${editor?.isActive({ textAlign: 'left' }) ? 'bg-emerald-900/30' : ''}`}
                      title="Align Left"
                    >
                      <FaAlignLeft className="text-emerald-400" />
                    </button>
                    <button 
                      onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors ${editor?.isActive({ textAlign: 'center' }) ? 'bg-emerald-900/30' : ''}`}
                      title="Align Center"
                    >
                      <FaAlignCenter className="text-emerald-400" />
                    </button>
                    <button 
                      onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors ${editor?.isActive({ textAlign: 'right' }) ? 'bg-emerald-900/30' : ''}`}
                      title="Align Right"
                    >
                      <FaAlignRight className="text-emerald-400" />
                    </button>
                    <button 
                      onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-emerald-900/30' : ''}`}
                      title="Justify"
                    >
                      <FaAlignJustify className="text-emerald-400" />
                    </button>
                    
                    <button 
                      onClick={() => setShowLinkInput(true)}
                      className={`p-2 rounded-lg bg-black/30 border border-emerald-700/30 hover:bg-emerald-900/30 transition-colors ${editor?.isActive('link') ? 'bg-emerald-900/30' : ''}`}
                      title="Link"
                    >
                      <FaLink className="text-emerald-400" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Link Input */}
              {showLinkInput && !isPreviewOpen && (
                <div className="bg-black/40 backdrop-blur-md border-b border-emerald-700/30 p-3 flex gap-2">
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 bg-black/30 border border-emerald-700/30 text-white"
                  />
                  <Button onClick={setLink} className="bg-emerald-600 hover:bg-emerald-700">
                    Apply
                  </Button>
                  <Button 
                    onClick={() => {
                      editor?.chain().focus().unsetLink().run();
                      setShowLinkInput(false);
                    }}
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    Remove
                  </Button>
                  <Button 
                    onClick={() => setShowLinkInput(false)}
                    className="bg-gray-700 hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              
              {/* Editor Area */}
              <div className={`min-h-[400px] max-h-[70vh] overflow-y-auto ${isPreviewOpen ? 'bg-black/30' : 'bg-black/10'}`}>
                <EditorContent editor={editor} />
              </div>
              
              {/* Character Count */}
              {editor && (
                <div className="bg-black/40 backdrop-blur-md border-t border-emerald-700/30 p-3 text-sm text-emerald-500 flex justify-between">
                  <div>
                    {editor.storage.characterCount.characters()} characters
                  </div>
                  <div>
                    {editor.storage.characterCount.words()} words
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Settings */}
          <div className="lg:col-span-1 space-y-8">
            {/* Image Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-black/20 backdrop-blur-md border border-emerald-700/30 rounded-xl p-6"
            >
              <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <FaImage /> Featured Image
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="block mb-2 text-emerald-400 text-sm">
                    Image URL
                  </Label>
                  <div className="relative">
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-black/30 border border-emerald-700/30 text-white placeholder-emerald-700 h-10 px-4 rounded-lg pl-10"
                    />
                    <FaImage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500" />
                    {imageUrl && (
                      <button 
                        onClick={handleImageRemove}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-rose-500 hover:text-rose-400"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>

                {imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border border-emerald-700/30 rounded-lg overflow-hidden bg-black/20"
                  >
                    <div className="relative">
                      {imageLoading && !imageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
                        </div>
                      )}
                      
                      {imageError ? (
                        <div className="min-h-[150px] flex items-center justify-center">
                          <p className="text-rose-500">❌ Failed to load image</p>
                        </div>
                      ) : (
                        <img 
                          src={imageUrl} 
                          alt="Preview" 
                          className="w-full max-h-[250px] object-contain mx-auto"
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Visibility Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-black/20 backdrop-blur-md border border-emerald-700/30 rounded-xl p-6"
            >
              <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <FaLock /> Visibility & Publishing
              </h3>
              
              <div className="space-y-6">
                <div>
                  <Label className="block mb-2 text-emerald-400 text-sm">
                    Post Visibility
                  </Label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger className="bg-black/30 border border-emerald-700/30 text-white h-10 rounded-lg">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 backdrop-blur-md border border-emerald-700/30 text-white rounded-lg">
                      <SelectItem value="public" className="py-2 hover:bg-emerald-900/30 flex items-center gap-2">
                        <FaGlobe className="text-emerald-400" /> Public
                      </SelectItem>
                      <SelectItem value="private" className="py-2 hover:bg-emerald-900/30 flex items-center gap-2">
                        <FaLock className="text-emerald-400" /> Private
                      </SelectItem>
                      <SelectItem value="friends" className="py-2 hover:bg-emerald-900/30 flex items-center gap-2">
                        <FaUserFriends className="text-emerald-400" /> Friends Only
                      </SelectItem>
                      <SelectItem value="community" className="py-2 hover:bg-emerald-900/30 flex items-center gap-2">
                        <FaUsers className="text-emerald-400" /> Community
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {visibility === 'community' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label className="block mb-2 text-emerald-400 text-sm">
                      Community ID *
                    </Label>
                    <Input
                      value={communityId}
                      onChange={(e) => setCommunityId(e.target.value)}
                      placeholder="Enter community ID"
                      className="bg-black/30 border border-emerald-700/30 text-white h-10 rounded-lg"
                    />
                    <p className="mt-2 text-emerald-600 text-xs">
                      Find Community ID in community settings
                    </p>
                  </motion.div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="pt-4"
                >
                  <Button
                    onClick={handleCreatePost}
                    disabled={isSubmitting}
                    className={`w-full h-11 text-base font-medium rounded-lg ${
                      isSubmitting 
                        ? 'bg-emerald-800/50 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600'
                    } transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-900/30`}
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="flex items-center justify-center"
                      >
                        <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                        Publishing...
                      </motion.div>
                    ) : (
                      <>
                        <span className="mr-2">Publish</span>
                        <motion.span
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <FaPaperPlane className="text-sm" />
                        </motion.span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}