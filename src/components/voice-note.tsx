"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Play, Pause, Volume2 } from "lucide-react";

interface VoiceNoteRecorderProps {
  onAudioRecorded: (base64Audio: string | null) => void;
  label?: string;
}

export function VoiceNoteRecorder({
  onAudioRecorded,
  label = "Record Voice Note",
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setRecordedAudioUrl(base64data);
          onAudioRecorded(base64data);
        };

        // Stop all audio tracks to free microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Please allow microphone permissions to record a voice note.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    setRecordedAudioUrl(null);
    setRecordDuration(0);
    onAudioRecorded(null);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-orange-500" />
          <span>{label}</span>
        </span>
        {isRecording && (
          <span className="text-xs font-bold text-red-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            {formatSeconds(recordDuration)}
          </span>
        )}
      </div>

      {!recordedAudioUrl ? (
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Mic className="w-4 h-4 text-orange-600" />
              <span>Record Voice (नेपाली वा English)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Recording ({formatSeconds(recordDuration)})</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50">
          <VoiceNotePlayer audioUrl={recordedAudioUrl} />
          <button
            type="button"
            onClick={deleteRecording}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            title="Delete Voice Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function VoiceNotePlayer({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        className="p-1 rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-colors cursor-pointer"
      >
        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-white" />}
      </button>
      <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
        <Volume2 className="w-3.5 h-3.5" />
        <span>{isPlaying ? "Playing Voice Note..." : "Voice Note"}</span>
      </div>
    </div>
  );
}
