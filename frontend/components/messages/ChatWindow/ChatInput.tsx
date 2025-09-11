"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, StopCircle, Play, Pause, X } from "lucide-react";

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
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ---------------- Voice Recording ----------------
  const startRecording = async () => {
    if (!navigator.mediaDevices) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      // Check max size 20 MB
      if (blob.size > 20 * 1024 * 1024) {
        alert("Voice recording too large (max 20 MB)");
        return;
      }

      const url = URL.createObjectURL(blob);
      setVoiceUrl(url);
      setAudio(new Audio(url));
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  // ---------------- Send Voice ----------------
  const sendVoice = () => {
    if (!socket || !receiverId || !voiceUrl) return;

    fetch(voiceUrl)
      .then((res) => res.blob())
      .then((blob) => {
        // Convert to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result?.toString() || "";

          // Send via socket
          socket.emit(
            "message:file",
            { type: "voice", receiverId, file: base64data },
            (res: any) => {
              if (res.success) console.log("Voice uploaded:", res.message);
              else console.error("Voice upload failed:", res.error);
            }
          );
        };
        reader.readAsDataURL(blob);
      });

    setVoiceUrl(null);
  };

  // ---------------- Audio Player ----------------
  useEffect(() => {
    if (!audio) return;
    audio.addEventListener("timeupdate", () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    });
    audio.addEventListener("ended", () => setIsPlaying(false));
    return () => {
      audio.pause();
      setIsPlaying(false);
    };
  }, [audio]);

  const togglePlay = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  // ---------------- Send Message ----------------
  const canSend = newMessage.trim() !== "" || voiceUrl !== null;

  const handleSend = () => {
    if (voiceUrl) sendVoice();
    if (newMessage.trim()) onSend();
  };

  return (
    <div
      className="p-3 border-t bg-[var(--bg-input)]"
      style={{ borderColor: "var(--bg-dark-3)" }}
    >
      {/* Voice Preview */}
      {voiceUrl && (
        <div className="flex items-center gap-2 mb-2 bg-gray-800 p-2 rounded-lg">
          <button onClick={togglePlay} className="text-white">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className="flex-1 h-1 bg-gray-600 rounded">
            <div
              className="h-1 bg-green-500 rounded"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <button onClick={() => setVoiceUrl(null)} className="text-red-500">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-white px-3 py-2 rounded-2xl outline-none border border-transparent focus:border-[var(--color-brand-mid)]"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        {/* Voice Recording */}
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`p-2 rounded-full transition ${
            recording ? "bg-red-600 hover:bg-red-700" : "hover:bg-gray-700"
          }`}
        >
          {recording ? (
            <StopCircle size={20} className="text-white" />
          ) : (
            <Mic size={20} className="text-white" />
          )}
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="p-2 rounded-full bg-[var(--color-brand-mid)] hover:bg-[var(--color-brand-end)] transition text-white disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
