"use client";

import React, { useState, useRef } from "react";

interface ChatInputProps {
  newMessage: string;
  onChange: (value: string) => void;
  onSend: () => void;
  receiverId: string;
  socket?: any;
}

const ChatInput: React.FC<ChatInputProps> = ({
  newMessage,
  onChange,
  onSend,
  receiverId,
  socket,
}) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      uploadVoice(blob);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const uploadVoice = (blob: Blob) => {
    if (!socket || !receiverId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result?.toString() || "";
      socket.emit(
        "message:file",
        { type: "voice", receiverId, file: base64data },
        (res: any) => {
          if (res.success) {
            console.log("Voice message uploaded:", res.message);
          } else {
            console.error("Voice message failed:", res.error);
          }
        }
      );
    };
    reader.readAsDataURL(blob);
  };

  return (
    <div className="p-3 flex gap-2 border-t" style={{ borderColor: "var(--bg-dark-3)" }}>
      <input
        type="text"
        placeholder="Type a message..."
        value={newMessage}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-[var(--bg-input)] text-white px-3 py-2 rounded-2xl outline-none border border-transparent focus:border-[var(--color-brand-mid)]"
        onKeyDown={(e) => {
          if (e.key === "Enter") onSend();
        }}
      />

      <button
        onClick={onSend}
        className="px-4 py-2 rounded-2xl bg-[var(--color-brand-mid)] hover:bg-[var(--color-brand-end)] transition text-white disabled:opacity-50"
      >
        Send
      </button>

      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded-2xl ${
          recording ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"
        } text-white transition`}
      >
        {recording ? "Stop" : "🎤"}
      </button>
    </div>
  );
};

export default ChatInput;
