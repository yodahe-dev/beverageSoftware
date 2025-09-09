import React from "react";

interface Message {
  id: string;
  senderId: string;
  content: string | { body?: string; type?: string; url?: string };
  createdAt: string;
  isSeen?: boolean;
}

interface MessagesListProps {
  messages: Message[];
  userId?: string;
  typingUser: string | null;
  activeChat: any;
  activeChatName: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  BACKEND_URL: any;
}

// Format date labels
const formatDateLabel = (date: Date) => {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  if (date >= startOfWeek) {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const diffMonths =
    now.getMonth() -
    date.getMonth() +
    12 * (now.getFullYear() - date.getFullYear());
  if (diffMonths < 12) {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Convert URLs in text to clickable links
const linkify = (text: string) => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.split(urlRegex).map((part, idx) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  userId,
  typingUser,
  activeChatName,
  messagesEndRef,
  BACKEND_URL,
}) => {
  const getMessageContent = (content: any) => {
    if (!content) return null;

    let parsedContent: any = content;

    // Parse JSON string if needed
    if (typeof content === "string") {
      try {
        parsedContent = JSON.parse(content);
      } catch {
        parsedContent = { body: content };
      }
    }

    // Voice message
    if (parsedContent.type === "voice" && parsedContent.url) {
      const voiceUrl =
        parsedContent.url.startsWith("http") || parsedContent.url.startsWith("https")
          ? parsedContent.url
          : `${BACKEND_URL}${parsedContent.url}`;

      return (
        <audio
          controls
          preload="metadata"
          className="w-full rounded-lg"
        >
          <source src={voiceUrl} type="audio/webm" />
          Your browser does not support the audio element.
        </audio>
      );
    }

    // Text message
    const text = parsedContent.body || "";
    return <p className="text-sm">{linkify(text)}</p>;
  };

  // Group messages by day/week/month
  const groupedMessages: { label: string; messages: Message[] }[] = [];
  let lastLabel = "";

  messages.forEach((msg) => {
    const date = new Date(msg.createdAt);
    const label = formatDateLabel(date);

    if (label !== lastLabel) {
      groupedMessages.push({ label, messages: [msg] });
      lastLabel = label;
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {groupedMessages.map((group) => (
        <div key={group.label}>
          <div className="flex justify-center mb-2">
            <span className="px-3 py-1 bg-gray-600 text-gray-200 text-xs rounded-full">
              {group.label}
            </span>
          </div>

          {group.messages.map((msg) => {
            const isMe = msg.senderId === userId;

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
                  {getMessageContent(msg.content)}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      <span className="text-xs">
                        {msg.isSeen ? "👀" : "🙈"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {typingUser && (
        <div className="flex justify-start">
          <div className="px-4 py-2 rounded-2xl max-w-xs bg-[#1a1a1a] text-gray-400 flex items-center gap-1">
            <p className="text-sm">{activeChatName} is typing</p>
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
  );
};

export default MessagesList;
