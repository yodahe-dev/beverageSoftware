"use client";

import React, { useState } from "react";

interface ChatItemProps {
  name: string;
  lastMessage?: string;
  avatar?: string | null;
  active?: boolean;
  displayMode?: "icon-only" | "avatar-name" | "full";
}

export default function ChatItem({
  name,
  lastMessage,
  avatar,
  active = false,
  displayMode = "full",
}: ChatItemProps) {
  const [imgError, setImgError] = useState(false);

  // Extract text from JSON message
  let messageText = "";
  if (lastMessage) {
    if (typeof lastMessage === "string") {
      try {
        const parsed = JSON.parse(lastMessage);
        messageText = parsed.body || "";
      } catch {
        messageText = lastMessage;
      }
    } else if (typeof lastMessage === "object") {
      messageText = lastMessage || "";
    }
  }

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random&bold=true&size=128`;

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-300 group
        ${active ? "border border-[var(--bg-brand-3)]" : ""}
      `}
      style={{
        background: active ? "var(--bg-dark-3)" : "transparent",
      }}
    >
      {/* Avatar */}
      <div className={`relative rounded-full overflow-hidden`} style={{ width: displayMode === "icon-only" ? 40 : 48, height: displayMode === "icon-only" ? 40 : 48 }}>
        <img
          src={!imgError && avatar ? avatar : fallbackAvatar}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full border-2 border-[var(--bg-dark-3)] group-hover:border-[var(--color-brand-mid)] transition-all duration-300"
        />
        {active && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></span>
        )}
      </div>

      {/* Info */}
      {(displayMode === "avatar-name" || displayMode === "full") && (
        <div className="flex-1 min-w-0">
          <h4 className="text-[var(--text-primary)] font-medium truncate">{name}</h4>
          {displayMode === "full" && (
            <p className="text-sm text-[var(--text-muted)] truncate">
              {messageText || "No message"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
