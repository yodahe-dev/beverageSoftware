import { useState } from "react";

interface ChatHeaderProps {
  name: string;
  profileImageUrl: string | null;
  Backend_URL: any;
  online: boolean;
}

const ChatHeader = ({ name, profileImageUrl, Backend_URL, online }: ChatHeaderProps) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (fullName: string) => {
    if (!fullName) return "";
    const words = fullName.trim().split(" ");
    return words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : (words[0][0] + words[1][0]).toUpperCase();
  };
  const fullImageUrl = profileImageUrl
    ? `${Backend_URL.replace(/\/$/, "")}/${profileImageUrl.replace(/^\//, "")}`
    : null;

  return (
    <div
      className="flex items-center gap-3 p-4 border-b"
      style={{ borderColor: "var(--bg-dark-3)" }}
    >
      {/* Avatar container */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-700">
        {!imageError && fullImageUrl ? (
          <img
            src={fullImageUrl}
            alt={name}
            className="w-full h-full object-cover rounded-full border-2 border-[var(--bg-dark-3)]"
            onError={() => setImageError(true)} // Fallback if 404 or load error
          />
        ) : (
          <span className="text-white font-bold text-lg">
            {getInitials(name)}
          </span>
        )}

        {/* Online status indicator */}
        {online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></span>
        )}
      </div>

      {/* Name and status */}
      <div>
        <h2 className="font-semibold">{name}</h2>
        <p className="text-sm text-gray-400">
          {online ? "Online" : "Offline"}
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;
