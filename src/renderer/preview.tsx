import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Folder,
  Trash2,
  Save,
  Film,
  X,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { RecordingItem } from '../shared/types';
import './index.css';

const PreviewApp: React.FC = () => {
  const [recording, setRecording] = useState<RecordingItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Listen for staged recording item from main process
    const unsub = (window.electronAPI as any).onPreviewData?.((item: RecordingItem) => {
      setRecording(item);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Escape') {
        if (showDiscardModal) {
          setShowDiscardModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (unsub) unsub();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDiscardModal]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || recording?.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSave = async () => {
    if (!recording || isSaving) return;
    setIsSaving(true);
    try {
      await (window.electronAPI as any).savePreviewRecording(recording.filePath);
    } catch (err) {
      console.error('Failed to save recording:', err);
      setIsSaving(false);
    }
  };

  const handleSaveAs = async () => {
    if (!recording || isSaving) return;
    setIsSaving(true);
    try {
      await (window.electronAPI as any).saveAsPreviewRecording(recording.filePath);
    } catch (err) {
      console.error('Failed to save as recording:', err);
      setIsSaving(false);
    }
  };

  const handleRecordAgain = async () => {
    if (!recording) return;
    await (window.electronAPI as any).recordAgainPreview(recording.filePath);
  };

  const handleConfirmDiscard = async () => {
    if (!recording) return;
    await (window.electronAPI as any).discardPreviewRecording(recording.filePath);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-14 px-6 border-b border-white/10 flex items-center justify-between bg-slate-950/80 backdrop-blur-md app-draggable shrink-0">
        <div className="flex items-center gap-3 app-no-drag">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-600/30">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Recording Preview</h1>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-sm">
              {recording?.fileName || 'Review your captured video before saving'}
            </p>
          </div>
        </div>

        {/* Metadata Badges */}
        {recording && (
          <div className="flex items-center gap-2 app-no-drag text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
              {recording.resolution || '1920 × 1080'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
              {recording.fps || 60} FPS
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold">
              {recording.format || 'MP4'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              {formatSize(recording.fileSize || 0)}
            </span>
          </div>
        )}
      </header>

      {/* Center Video Player Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-6 min-h-0 bg-black/50">
        <div className="relative w-full h-full max-w-5xl max-h-[calc(100vh-180px)] rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl flex items-center justify-center group">
          {recording?.filePath ? (
            <video
              ref={videoRef}
              src={`file://${recording.filePath}`}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <Film className="w-16 h-16 stroke-1 mb-2 animate-pulse" />
              <p className="text-xs">Loading captured stream...</p>
            </div>
          )}

          {/* Floating Center Play/Pause Overlay Icon on Hover */}
          <button
            onClick={togglePlay}
            className="absolute w-16 h-16 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-2xl opacity-0 group-hover:opacity-100 hover:scale-105"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>
        </div>

        {/* Video Scrubber & Playback Controls Bar */}
        <div className="w-full max-w-5xl mt-4 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-4 backdrop-blur-md">
          <button
            onClick={togglePlay}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/30"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={handleReplay}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/5"
            title="Replay from Beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Scrubber Range */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-300 min-w-[42px]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.05}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs font-mono font-bold text-slate-500 min-w-[42px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 text-slate-400 hover:text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </main>

      {/* Bottom Action Footer */}
      <footer className="h-16 px-8 border-t border-white/10 flex items-center justify-between bg-slate-950/90 backdrop-blur-md shrink-0">
        {/* Left Actions: Record Again & Discard */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRecordAgain}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition border border-white/10"
            title="Discard temporary file and record another clip"
          >
            <RotateCcw className="w-4 h-4 text-indigo-400" />
            <span>Record Again</span>
          </button>

          <button
            onClick={() => setShowDiscardModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-bold transition border border-white/10"
            title="Delete this recording permanently"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard</span>
          </button>
        </div>

        {/* Right Actions: Save As & Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAs}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition border border-white/15 shadow-sm"
          >
            <Folder className="w-4 h-4 text-indigo-400" />
            <span>Save As...</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-extrabold tracking-wide transition shadow-lg shadow-indigo-600/40"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Recording'}</span>
          </button>
        </div>
      </footer>

      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Discard this recording?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This temporary recording file will be permanently deleted and cannot be recovered.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition border border-white/5"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDiscard}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/30"
              >
                Discard Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('preview-root') as HTMLElement);
root.render(
  <React.StrictMode>
    <PreviewApp />
  </React.StrictMode>
);
