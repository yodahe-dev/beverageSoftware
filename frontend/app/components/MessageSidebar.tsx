"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  MessageSquare, 
  Users, 
  MoreHorizontal,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  username: string;
  profilePicture?: string;
}

interface Conversation {
  conversationId: string;
  lastMessageId: string;
  content: any;
  lastAt: string;
  userId: string;
  username: string;
  profilePicture?: string;
  unread: number;
}

interface MessageSidebarProps {
  onSelectConversation: (conversationId: string, user: User) => void;
  selectedConversationId?: string;
  conversations: Conversation[];
  fetchConversations: () => void;
}

export default function MessageSidebar({ 
  onSelectConversation, 
  selectedConversationId,
  conversations,
  fetchConversations
}: MessageSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Load conversations on mount
  useEffect(() => {
    if (conversations.length > 0) {
      setLoading(false);
    }
  }, [conversations]);

  // Format message content for display
  const formatMessageContent = (content: any) => {
    if (!content) return 'No messages yet';
    
    if (content.type === 'text') {
      return content.body || 'Message';
    } else if (content.type === 'image') {
      return '📷 Image';
    } else if (content.type === 'file') {
      return '📎 File';
    }
    
    return 'Message';
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Create or select conversation when clicking on a user
  const handleUserClick = async (user: User) => {
    try {
      const token = localStorage.getItem("token");
      const currentUserId = localStorage.getItem('userId');
      
      if (!currentUserId) {
        console.error('No user ID found');
        return;
      }

      // Generate conversation ID (same as backend)
      const sorted = [currentUserId, user.id].sort();
      const conversationId = sorted.join('_');
      
      // Check if conversation already exists
      const existingConversation = conversations.find(c => c.conversationId === conversationId);
      
      if (existingConversation) {
        // Select existing conversation
        onSelectConversation(conversationId, user);
      } else {
        // Create a new conversation by sending a welcome message
        const response = await fetch(`${BACKEND_URL}/api/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiverId: user.id,
            message: "👋 Hello! I'd like to chat with you."
          }),
        });
        
        if (response.ok) {
          // Refresh conversations list
          fetchConversations();
          // Select the new conversation
          onSelectConversation(conversationId, user);
        } else {
          console.error('Failed to start conversation');
        }
      }
      
      setSearchQuery('');
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <div className="w-80 h-full bg-gradient-to-b from-[#0F1116] to-[#151925] border-r border-[#222832] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#222832]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#E6EAF0] flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-[#12D6DF]" />
            Messages
          </h2>
          <Button variant="ghost" size="icon" className="text-[#A9B4C2] hover:text-[#E6EAF0]">
            <Users className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A9B4C2]" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1A1F24] border-[#222832] text-[#E6EAF0] placeholder:text-[#A9B4C2] focus:ring-2 focus:ring-[#12D6DF]"
          />
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-[#222832]"
          >
            <div className="p-2">
              <h3 className="text-sm font-semibold text-[#A9B4C2] px-2 py-1">Search Results</h3>
              {isSearching ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#12D6DF] mr-2"></div>
                    <span className="text-[#A9B4C2] text-sm">Searching...</span>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center p-2 rounded-lg hover:bg-[#1A1F24] cursor-pointer transition-colors"
                      onClick={() => handleUserClick(user)}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        {user.profilePicture ? (
                          <AvatarImage src={`${BACKEND_URL}${user.profilePicture}`} />
                        ) : null}
                        <AvatarFallback className="bg-[#12D6DF]/20 text-[#12D6DF]">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#E6EAF0] font-medium truncate">{user.username}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A9B4C2]">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#A9B4C2] text-sm">No users found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center p-2 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-[#1A1F24] animate-pulse mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-[#1A1F24] rounded animate-pulse mb-2 w-3/4"></div>
                  <div className="h-3 bg-[#1A1F24] rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div className="p-2">
            {conversations.map((conversation) => (
              <motion.div
                key={conversation.conversationId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                  selectedConversationId === conversation.conversationId
                    ? 'bg-gradient-to-r from-[#12D6DF]/20 to-[#8B5CF6]/20 border border-[#12D6DF]/30'
                    : 'hover:bg-[#1A1F24]'
                }`}
                onClick={() => onSelectConversation(conversation.conversationId, {
                  id: conversation.userId,
                  username: conversation.username,
                  profilePicture: conversation.profilePicture
                })}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 mr-3">
                    {conversation.profilePicture ? (
                      <AvatarImage src={`${BACKEND_URL}${conversation.profilePicture}`} />
                    ) : null}
                    <AvatarFallback className="bg-[#12D6DF]/20 text-[#12D6DF]">
                      {conversation.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.unread > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-[#12D6DF] text-[#0B0D10]">
                      {conversation.unread}
                    </Badge>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[#E6EAF0] font-semibold truncate">{conversation.username}</h3>
                    <div className="flex items-center text-xs text-[#A9B4C2]">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(conversation.lastAt)}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <p className="text-[#A9B4C2] text-sm truncate">
                      {formatMessageContent(conversation.content)}
                    </p>
                    
                    {/* Message status indicator */}
                    <div className="ml-2">
                      {conversation.unread > 0 ? (
                        <div className="h-2 w-2 rounded-full bg-[#12D6DF]"></div>
                      ) : (
                        <CheckCheck className="h-3 w-3 text-[#12D6DF]" />
                      )}
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A9B4C2]">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="rounded-full bg-[#1A1F24] p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-[#A9B4C2]" />
            </div>
            <h3 className="text-lg font-semibold text-[#E6EAF0] mb-2">No conversations yet</h3>
            <p className="text-[#A9B4C2] text-sm">
              Start a conversation by searching for users above
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}