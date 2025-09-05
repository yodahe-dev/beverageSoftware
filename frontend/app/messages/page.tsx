"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import ChatList from "@/components/messages/sidebar/ChatList";
import useAuth from "@/hooks/useAuth";

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

  // Compute conversation ID
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

    socket.on("connect", () => {
      console.log("✅ Socket connected", socket?.id);
    });

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

    // Typing event received from other user
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
        // Join conversation room
        const chatId = getConversationId(userId!, chat.id);
        socket?.emit("join:chat", { chatId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !activeChat || !socket || !userId) return;

    const chatId = getConversationId(userId, activeChat.id);

    socket.emit("message:send", {
      receiverId: activeChat.id,
      message: newMessage.trim(),
    });

    setNewMessage("");
    // Stop typing when message sent
    socket.emit("typing", { chatId, isTyping: false });
  };

  // Seen messages
  useEffect(() => {
    if (!activeChat || !socket) return;
    messages.forEach((m) => {
      if (m.receiverId === userId && !m.isSeen) {
        if (socket) {
          socket.emit("message:seen", { messageId: m.id });
        }
      }
    });
  }, [messages, activeChat, userId]);

  // Handle typing input
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

  // Avatar fallback
  const getAvatar = (chat: ChatUser) => {
    if (chat.profileImageUrl) return chat.profileImageUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      chat.name || chat.username
    )}&background=0D0D0D&color=FFFFFF&bold=true&size=128`;
  };

  return (
    <div className="flex h-screen bg-black text-white">
      <ChatList chats={chats} onChatSelect={fetchMessages} />

      <div className="flex-1 flex flex-col">
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a chat to start messaging
          </div>
        ) : (
          <>
            <div
              className="flex items-center gap-3 p-4 border-b"
              style={{ borderColor: "var(--bg-dark-3)" }}
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={getAvatar(activeChat)}
                  alt={activeChat.name}
                  className="w-full h-full object-cover rounded-full border-2 border-[var(--bg-dark-3)]"
                />
                {activeChat.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></span>
                )}
              </div>
              <div>
                <h2 className="font-semibold">{activeChat.name}</h2>
                <p className="text-sm text-gray-400">
                  {activeChat.online ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.senderId === userId;

                let messageText = "";
                if (msg.content) {
                  if (typeof msg.content === "string") {
                    try {
                      const parsed = JSON.parse(msg.content);
                      messageText = parsed.body || "";
                    } catch {
                      messageText = msg.content;
                    }
                  } else if (typeof msg.content === "object") {
                    messageText = msg.content.body || "";
                  }
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-xs break-words ${
                        isMe
                          ? "bg-gradient-to-r from-[var(--color-brand-mid)] to-[var(--color-brand-end)] text-white shadow-[var(--shadow-brand-1)]"
                          : "bg-[#1a1a1a] text-gray-200"
                      }`}
                    >
                      <p className="text-sm">{messageText}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && (
                          <span className="text-xs">{msg.isSeen ? "✅✅" : "✅"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {typingUser && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-2xl max-w-xs bg-[#1a1a1a] text-gray-400 flex items-center gap-1">
                    <p className="text-sm">{activeChat.name} is typing</p>
                    <span className="typing-dots flex gap-1">
                      <span className="dot w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0"></span>
                      <span className="dot w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                      <span className="dot w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-400"></span>
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div
              className="p-3 flex gap-2 border-t"
              style={{ borderColor: "var(--bg-dark-3)" }}
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                className="flex-1 bg-[var(--bg-input)] text-white px-3 py-2 rounded-2xl outline-none border border-transparent focus:border-[var(--color-brand-mid)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 rounded-2xl bg-[var(--color-brand-mid)] hover:bg-[var(--color-brand-end)] transition text-white disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .typing-dots .dot {
          animation: bounce 0.6s infinite;
        }
        .typing-dots .dot.delay-0 { animation-delay: 0s; }
        .typing-dots .dot.delay-200 { animation-delay: 0.2s; }
        .typing-dots .dot.delay-400 { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
