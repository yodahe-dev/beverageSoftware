"use client";

import { useEffect, useState } from "react";
import ChatList from "@/components/messages/sidebar/ChatList";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface ChatUser {
  id: string;
  username: string;
  name: string;
  profileImageUrl: string | null;
  isBadgeVerified: boolean;
  lastMessage: any;
  isSeen: boolean;
  seenAt: string | null;
  lastMessageAt: string;
  online: boolean;
  lastActive: string | null;
}

export default function Page() {
  const [chats, setChats] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/list`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // auth token
          },
        });
        const data = await res.json();
        if (data.success) {
          setChats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch chats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  if (loading) {
    return <div className="text-gray-400 text-center p-4">Loading chats...</div>;
  }

  return <ChatList chats={chats} />;
}
