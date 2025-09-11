import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, RotateCw } from "lucide-react";

interface VoicePlayerProps {
  url: string;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ url }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const animationRef = useRef<number>(0);

  useEffect(() => {
    // Initialize audio
    if (!audioRef.current) {
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        if (!isFinite(audio.duration)) return;
        setDuration(audio.duration);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        cancelAnimationFrame(animationRef.current);
        setProgress(100);
        setCurrentTime(audio.duration);
      });
    } else {
      audioRef.current.src = url;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [url]);

  const updateProgress = () => {
    if (!audioRef.current || !isFinite(audioRef.current.duration)) return;
    setCurrentTime(audioRef.current.currentTime);
    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    animationRef.current = requestAnimationFrame(updateProgress);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      requestAnimationFrame(updateProgress);
    }
  };

  const skip = (seconds: number) => {
    if (!audioRef.current || !isFinite(audioRef.current.duration)) return;
    audioRef.current.currentTime = Math.min(
      Math.max(0, audioRef.current.currentTime + seconds),
      audioRef.current.duration
    );
    setCurrentTime(audioRef.current.currentTime);
    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !isFinite(audioRef.current.duration)) return;
    const newTime = (Number(e.target.value) / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(Number(e.target.value));
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="flex items-center gap-2 w-full bg-[#1a1a1a] p-2 rounded-lg shadow-[var(--shadow-brand-1)]">
      

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="p-2 rounded-full bg-gradient-to-r from-[var(--color-brand-mid)] to-[var(--color-brand-end)] shadow-[var(--shadow-brand-2)] hover:scale-105 transition"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      {/* Waveform / Progress */}
      <div className="flex-1 flex flex-col ml-2">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-brand-start)] to-[var(--color-brand-end)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 mt-1 rounded-lg accent-[var(--color-brand-end)]"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
  );
};

export default VoicePlayer;
