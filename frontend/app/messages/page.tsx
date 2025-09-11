"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import ChatList from "@/components/messages/sidebar/ChatList";
import useAuth from "@/hooks/useAuth";
import ChatHeader from "@/components/messages/ChatWindow/ChatHeader";
import MessagesList from "@/components/messages/ChatWindow/MessagesList";
import ChatInput from "@/components/messages/ChatWindow/ChatInput";
import _ from "lodash";

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
  content: { type: string; body?: string; meta?: any } | string;
  createdAt: string;
  isSeen: boolean;
  seenAt?: string | null;
}

export default function Page() {
  const [chats, setChats] = useState<ChatUser[]>([]);
  const [activeChat, setActiveChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const { user } = useAuth();
  const userId = user?.id;

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const getConversationId = (a: string, b: string) => [a, b].sort().join("-");

  // ---------------- Socket Setup ----------------
  useEffect(() => {
    if (!userId) return;

    const socket = io(BACKEND_URL!, {
      auth: { token: localStorage.getItem("token") },
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("✅ Socket connected", socket.id));

    socket.on("presence:update", ({ userId: uid, status }) => {
      setChats((prev) =>
        prev.map((c) => (c.id === uid ? { ...c, online: status === "online" } : c))
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
        prev.map((m) => (m.id === messageId ? { ...m, isSeen: true, seenAt } : m))
      );
    });

    socket.on("typing", ({ from, chatId, isTyping }) => {
      if (!activeChat || !userId) return;
      if (chatId === getConversationId(userId, activeChat.id) && from !== userId) {
        setTypingUser(isTyping ? from : null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, activeChat]);

  // ---------------- Fetch Chats ----------------
  const fetchChats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/list`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data.success) setChats(data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // ---------------- Fetch Messages ----------------
  const fetchMessages = useCallback(
    async (chat: ChatUser) => {
      setActiveChat(chat);
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/chat/conversation/${chat.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!data.error) {
          setMessages(data.messages.reverse());
          socketRef.current?.emit("join:chat", { chatId: getConversationId(userId!, chat.id) });
        }
      } catch (err) {
        console.error(err);
      }
    },
    [userId]
  );

  // ---------------- Send Message ----------------
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !activeChat || !socketRef.current || !userId) return;

    const chatId = getConversationId(userId, activeChat.id);
    socketRef.current.emit("message:send", {
      receiverId: activeChat.id,
      message: newMessage.trim(),
    });

    setNewMessage("");
    socketRef.current.emit("typing", { chatId, isTyping: false });
  }, [newMessage, activeChat, userId]);

  // ---------------- Seen Messages ----------------
  useEffect(() => {
    if (!activeChat || !socketRef.current) return;

    messages.forEach((m) => {
      if (m.receiverId === userId && !m.isSeen) {
        socketRef.current?.emit("message:seen", { messageId: m.id });
      }
    });
  }, [messages, activeChat, userId]);

  // ---------------- Typing Handler ----------------
  const debounceTyping = useRef(
    _.debounce((chatId: string, socket: Socket) => {
      socket.emit("typing", { chatId, isTyping: false });
    }, 1000)
  ).current;

  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (!activeChat || !socketRef.current || !userId) return;

    const chatId = getConversationId(userId, activeChat.id);
    socketRef.current.emit("typing", { chatId, isTyping: true });
    debounceTyping(chatId, socketRef.current);
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
              socket={socketRef.current}
            />
          </>
        )}
      </div>
    </div>
  );
}
