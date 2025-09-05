"use client";

import React, { useState, useEffect, useRef } from "react";

interface ChatItemProps {
  id: string;
  name: string;
  lastMessage?: string;
  avatar?: string | null;
  isSelected?: boolean;
  onClick: (id: string) => void;
  displayMode?: "icon-only" | "avatar-name" | "full";
  online?: boolean;
}

export default function ChatItem({
  id,
  name,
  lastMessage,
  avatar,
  isSelected = false,
  onClick,
  displayMode = "full",
  online = false,
}: ChatItemProps) {
  const [imgError, setImgError] = useState(false);

  // Extract last message safely
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
      onClick={() => onClick(id)}
      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-300 group
        ${
          isSelected
            ? "bg-[var(--bg-dark-3)] border border-[var(--color-brand-mid)] shadow-[var(--shadow-brand-1)]"
            : "hover:bg-[var(--bg-dark-3)] hover:shadow-[var(--shadow-brand-2)]"
        }
      `}
    >
      {/* Avatar */}
      <div
        className="relative rounded-full overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{
          width: displayMode === "icon-only" ? 40 : 48,
          height: displayMode === "icon-only" ? 40 : 48,
        }}
      >
        <img
          src={!imgError && avatar ? avatar : fallbackAvatar}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full border-2 border-[var(--bg-dark-3)] group-hover:border-[var(--color-brand-mid)] transition-all duration-300"
        />
        {online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></span>
        )}
      </div>

      {/* Name & Message */}
      {displayMode !== "icon-only" && (
        <div className="flex-1 min-w-0">
          <h4
            className={`font-medium truncate transition-colors ${
              isSelected
                ? "text-[var(--color-brand-mid)]"
                : "text-[var(--text-primary)]"
            }`}
          >
            {name}
          </h4>
          {displayMode === "full" && messageText && (
            <p className="text-sm text-[var(--text-secondary)] truncate">
              {messageText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}