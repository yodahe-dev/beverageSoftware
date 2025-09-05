"use client";

import ChatItem from "./ChatItem";
import { useState, useRef, useEffect } from "react";

interface ChatUser {
  id: string;
  username: string;
  name: string;
  profileImageUrl: string | null;
  lastMessage: string;
  online: boolean;
}

interface ChatListProps {
  chats: ChatUser[];
  mobileOpen?: boolean;
  onChatSelect?: (chat: ChatUser) => void; // send chat data when clicked
}

export default function ChatList({
  chats,
  mobileOpen = true,
  onChatSelect,
}: ChatListProps) {
  const [width, setWidth] = useState(320); // default width
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth >= 128 && newWidth <= 600) {
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const getDisplayMode = () => {
    if (width <= 160) return "icon-only";
    if (width <= 280) return "avatar-name";
    return "full";
  };

  const displayMode = getDisplayMode();

  const handleChatClick = (id: string) => {
    const selectedChat = chats.find((c) => c.id === id);
    setSelectedChatId(id);

    // Send to parent
    if (onChatSelect && selectedChat) {
      onChatSelect(selectedChat);
    }

    console.log("Selected chat:", selectedChat);
  };

  return (
    <div
      ref={sidebarRef}
      className="h-screen p-4 border-r overflow-y-auto fixed md:relative transition-transform duration-300"
      style={{
        width,
        minWidth: 128,
        maxWidth: 600,
        background: "var(--bg-dark-2)",
        borderColor: "var(--bg-dark-3)",
      }}
    >
      {/* Header */}
      {displayMode !== "icon-only" && (
        <h2
          className="text-xl font-bold mb-4 text-transparent bg-clip-text"
          style={{ backgroundImage: "var(--text-brand-1)" }}
        >
          Messages
        </h2>
      )}

      {/* Chat list */}
      {chats.map((chat) => (
        <ChatItem
          key={chat.id}
          id={chat.id}
          name={chat.name || chat.username}
          lastMessage={chat.lastMessage}
          avatar={chat.profileImageUrl}
          online={chat.online}
          displayMode={displayMode}
          isSelected={selectedChatId === chat.id}
          onClick={handleChatClick}
        />
      ))}

      {/* Resizer */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-[var(--text-muted)] hover:bg-[var(--text-secondary)] transition-colors"
      />
    </div>
  );
}
