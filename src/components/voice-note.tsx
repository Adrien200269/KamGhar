"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Square,
  Trash2,
  Play,
  Pause,
  Volume2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

/**
 * Detect the best supported audio MIME type across browsers (Chrome, Edge, Firefox, Safari/iOS)
 */
function getBestAudioMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }
  const candidateTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/wav",
  ];
  for (const type of candidateTypes) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch {
      // ignore
    }
  }
  return "";
}

interface VoiceNoteRecorderProps {
  onAudioRecorded: (base64Audio: string | null) => void;
  label?: string;
  initialAudioUrl?: string | null;
}

export function VoiceNoteRecorder({
  onAudioRecorded,
  label = "Record Voice Proposal",
  initialAudioUrl = null,
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(initialAudioUrl);
  const [recordDuration, setRecordDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasVoiceActivity, setHasVoiceActivity] = useState(false);
  const [audioMeterLevels, setAudioMeterLevels] = useState<number[]>([15, 20, 15, 20, 15]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chosenMimeRef = useRef<string>("");

  // Sync initialAudioUrl if updated externally
  useEffect(() => {
    if (initialAudioUrl !== undefined) {
      setRecordedAudioUrl(initialAudioUrl);
    }
  }, [initialAudioUrl]);

  // Clean up all audio streams, timers, and Web Audio resources
  const cleanupResources = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  // Setup Web Audio Analyser to provide live volume visualizer bars
  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;

      // Resume context if suspended (common in modern browsers)
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sample 5 frequency bins across the spectrum
        const b0 = dataArray[1] || 0;
        const b1 = dataArray[3] || 0;
        const b2 = dataArray[6] || 0;
        const b3 = dataArray[10] || 0;
        const b4 = dataArray[14] || 0;

        const avg = (b0 + b1 + b2 + b3 + b4) / 5;
        if (avg > 18) {
          setHasVoiceActivity(true);
        }

        // Scale to 15% - 100% height
        setAudioMeterLevels([
          Math.min(100, Math.max(15, Math.round((b0 / 255) * 100))),
          Math.min(100, Math.max(15, Math.round((b1 / 255) * 100))),
          Math.min(100, Math.max(15, Math.round((b2 / 255) * 100))),
          Math.min(100, Math.max(15, Math.round((b3 / 255) * 100))),
          Math.min(100, Math.max(15, Math.round((b4 / 255) * 100))),
        ]);

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } catch (e) {
      console.warn("Audio meter initialization skipped:", e);
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setHasVoiceActivity(false);

    if (
      typeof window === "undefined" ||
      !navigator?.mediaDevices?.getUserMedia
    ) {
      setErrorMsg(
        "Microphone access requires a secure connection (HTTPS or localhost) or is not supported by your browser."
      );
      return;
    }

    try {
      // Request audio with standard enhancement constraints for clear voice capture
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = getBestAudioMimeType();
      chosenMimeRef.current = mimeType;

      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMime =
          mediaRecorder.mimeType || chosenMimeRef.current || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });

        if (audioBlob.size === 0) {
          setErrorMsg(
            "No audio data was recorded. Please check your microphone connection and try again."
          );
          cleanupResources();
          setIsRecording(false);
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setRecordedAudioUrl(base64Audio);
          onAudioRecorded(base64Audio);
        };

        cleanupResources();
      };

      // Dispatches data chunks every 250ms to ensure buffer is always flushed
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordDuration(0);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);

      // Connect live audio volume meter
      setupAudioMeter(stream);
    } catch (err: unknown) {
      cleanupResources();
      setIsRecording(false);
      console.error("Microphone access error:", err);

      const error = err as Error;
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setErrorMsg(
          "Microphone permission was denied. Please click the lock or camera/mic icon in your browser URL bar to allow microphone access."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setErrorMsg(
          "No microphone found on your device. Please plug in or enable a microphone."
        );
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        setErrorMsg(
          "Your microphone is currently in use by another application (e.g. Zoom, Teams, or another tab)."
        );
      } else {
        setErrorMsg(
          `Unable to access microphone: ${error.message || "Unknown error"}. Please check device permissions.`
        );
      }
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    cleanupResources();
    setIsRecording(false);
    setRecordDuration(0);
    audioChunksRef.current = [];
  };

  const deleteRecording = () => {
    setRecordedAudioUrl(null);
    setRecordDuration(0);
    setErrorMsg(null);
    setHasVoiceActivity(false);
    onAudioRecorded(null);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="space-y-2">
      {/* Header Label and Live Status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-orange-500" />
          <span>{label}</span>
        </span>

        {isRecording && (
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-red-600 dark:text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>{formatSeconds(recordDuration)}</span>
          </span>
        )}
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-600 text-xs font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── State 1: Idle (Not recording, no audio recorded yet) ── */}
      {!isRecording && !recordedAudioUrl && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-orange-500/20 cursor-pointer active:scale-98"
          >
            <Mic className="w-4 h-4" />
            <span>Click to Record Voice (नेपाली / English)</span>
          </button>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Up to 2 minutes voice pitch
          </span>
        </div>
      )}

      {/* ── State 2: Actively Recording ── */}
      {isRecording && (
        <div className="p-3.5 rounded-2xl bg-red-50/90 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Live Audio Visualizer Waveform */}
            <div className="flex items-center gap-1.5 h-8 px-2 py-1 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-red-200 dark:border-red-900">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider mr-1">
                REC
              </span>
              {audioMeterLevels.map((lvl, idx) => (
                <span
                  key={idx}
                  style={{ height: `${lvl}%` }}
                  className="w-1.5 bg-gradient-to-t from-red-600 to-orange-400 rounded-full transition-all duration-75 min-h-[4px]"
                />
              ))}
            </div>

            {/* Action Buttons: Stop & Save or Cancel */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Done ({formatSeconds(recordDuration)})</span>
              </button>

              <button
                type="button"
                onClick={cancelRecording}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-red-100/70 dark:hover:bg-red-900/40 text-xs font-semibold transition cursor-pointer"
                title="Cancel recording"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Voice Activity Indicator / Mute Warning */}
          <div className="text-[11px] flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>
              {hasVoiceActivity ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Voice detected — speak clearly into your mic
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Listening for your voice... speak now
                </span>
              )}
            </span>
            <span className="text-slate-400 text-[10px]">
              Click &quot;Done&quot; when finished
            </span>
          </div>
        </div>
      )}

      {/* ── State 3: Recorded & Ready (Player Preview) ── */}
      {recordedAudioUrl && !isRecording && (
        <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Voice Note Recorded Successfully</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 text-[11px] font-bold transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                title="Re-record voice note"
              >
                <RotateCcw className="w-3 h-3 text-orange-500" />
                <span>Re-record</span>
              </button>
              <button
                type="button"
                onClick={deleteRecording}
                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="Delete voice note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <VoiceNotePlayer audioUrl={recordedAudioUrl} />
        </div>
      )}
    </div>
  );
}

/**
 * Cross-browser Audio Player with live progress scrubber, duration formatting, and error recovery
 */
export function VoiceNotePlayer({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      console.warn("Audio element failed to load source:", audioUrl?.slice(0, 50));
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    // Explicitly load the media source
    try {
      audio.load();
    } catch {
      // ignore
    }

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Audio playback error:", err);
          setHasError(true);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return "0:00";
    const mins = Math.floor(sec / 60);
    const remaining = Math.floor(sec % 60);
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  if (hasError) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
        <MicOff className="w-4 h-4 shrink-0" />
        <span>Audio format preview unavailable on this browser. The proposal file is safely attached.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs w-full max-w-md">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-90 cursor-pointer"
        aria-label={isPlaying ? "Pause audio note" : "Play audio note"}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-white" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
        )}
      </button>

      {/* Scrubber / Progress Bar */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          aria-label="Seek audio"
        />
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : isPlaying ? "Playing" : "Voice Note"}</span>
        </div>
      </div>

      <Volume2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
    </div>
  );
}
