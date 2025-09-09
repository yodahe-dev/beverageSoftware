"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import ChatList from "@/components/messages/sidebar/ChatList";
import useAuth from "@/hooks/useAuth";
import ChatHeader from "@/components/messages/ChatWindow/ChatHeader";
import MessagesList from "@/components/messages/ChatWindow/MessagesList";
import ChatInput from "@/components/messages/ChatWindow/ChatInput";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface ChatUser {
  id: string;
  username: string;
  name: string;
  profileImageUrl: string | null;
  lastMessage: any;
  online: boolean;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: { type: string; body: string; meta: any } | string;
  createdAt: string;
  isSeen: boolean;
  seenAt?: string | null;
}

let socket: Socket | null = null;

export default function Page() {
  const [chats, setChats] = useState<ChatUser[]>([]);
  const [activeChat, setActiveChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const userId = user?.id;

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const getConversationId = (a: string, b: string) => {
    const sorted = [a, b].sort();
    return `${sorted[0]}-${sorted[1]}`;
  };

  // Socket setup
  useEffect(() => {
    if (!userId) return;

    socket = io(BACKEND_URL!, {
      auth: { token: localStorage.getItem("token") },
    });

    socket.on("connect", () => console.log("✅ Socket connected", socket?.id));

    socket.on("presence:update", ({ userId: uid, status }) => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === uid ? { ...c, online: status === "online" } : c
        )
      );
    });

    socket.on("message:new", (msg: Message) => {
      if (
        (msg.senderId === activeChat?.id && msg.receiverId === userId) ||
        (msg.receiverId === activeChat?.id && msg.senderId === userId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("message:seen", ({ messageId, seenAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isSeen: true, seenAt } : m
        )
      );
    });

    socket.on("typing", ({ from, chatId, isTyping }) => {
      if (!activeChat || !userId) return;
      const currentChatId = getConversationId(userId, activeChat.id);
      if (chatId === currentChatId && from !== userId) {
        setTypingUser(isTyping ? from : null);
      }
    });

    return () => {
      socket?.disconnect();
    };
  }, [userId, activeChat]);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/list`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (data.success) setChats(data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChats();
  }, []);

  // Fetch messages
  const fetchMessages = async (chat: ChatUser) => {
    setActiveChat(chat);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/conversation/${chat.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!data.error) {
        setMessages(data.messages.reverse());
        const chatId = getConversationId(userId!, chat.id);
        socket?.emit("join:chat", { chatId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeChat || !socket || !userId) return;

    const chatId = getConversationId(userId, activeChat.id);

    socket.emit("message:send", {
      receiverId: activeChat.id,
      message: newMessage.trim(),
    });

    setNewMessage("");
    socket.emit("typing", { chatId, isTyping: false });
  };

  // Seen messages
  useEffect(() => {
    if (!activeChat || !socket) return;
    messages.forEach((m) => {
      if (m.receiverId === userId && !m.isSeen) {
        socket?.emit("message:seen", { messageId: m.id });
      }
    });
  }, [messages, activeChat, userId]);

  // Typing handler
  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (!activeChat || !socket || !userId) return;
    const chatId = getConversationId(userId, activeChat.id);

    socket.emit("typing", { chatId, isTyping: true });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit("typing", { chatId, isTyping: false });
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-black text-white">
      <ChatList chats={chats} onChatSelect={fetchMessages} />

      <div className="flex-1 flex flex-col gap-4">
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a chat to start messaging
          </div>
        ) : (
          <>
            <ChatHeader
              name={activeChat.name}
              profileImageUrl={activeChat.profileImageUrl}
              Backend_URL={BACKEND_URL}
              online={activeChat.online}
            />

            <MessagesList              
              activeChat={activeChat}
              messages={messages}
              userId={userId}
              typingUser={typingUser}
              activeChatName={activeChat.name}
              messagesEndRef={messagesEndRef}
              BACKEND_URL={BACKEND_URL}
            />

            <ChatInput
              newMessage={newMessage}
              onChange={handleTyping}
              onSend={sendMessage}
              receiverId={activeChat.id}
              socket={socket}
            />
          </>
        )}
      </div>
    </div>
  );
}
