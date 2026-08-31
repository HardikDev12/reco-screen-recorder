import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Square,
  Pause,
  Play,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  Settings,
  Film,
  Minus,
  X,
  GripHorizontal
} from 'lucide-react';
import { useMediaRecording } from './hooks/useMediaRecording';
import { RecorderSettings } from '../shared/types';
import './index.css';

const ToolbarApp: React.FC = () => {
  const [settings, setSettings] = useState<RecorderSettings>({
    outputPath: '',
    framerate: 60,
    resolution: '1080p',
    encoder: 'auto',
    captureMicrophone: true,
    captureSystemAudio: true,
    showWebcam: false,
    hardwareAcceleration: true,
    countdownSeconds: 0,
    highlightClicks: false
  });

  const [isStopping, setIsStopping] = useState(false);

  const {
    isRecording,
    isPaused,
    recordingDuration,
    micLevel,
    isClipping,
    preWarmCapturePipeline,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording
  } = useMediaRecording();

  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      setSettings(s);
      preWarmCapturePipeline(s);
    });

    const unsubscribe = window.electronAPI.onRecordingCompleted(() => {
      setIsStopping(false);
    });

    return () => {
      unsubscribe();
    };
  }, [preWarmCapturePipeline]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecord = async () => {
    try {
      await startRecording(settings);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleTogglePause = async () => {
    if (isPaused) {
      await resumeRecording();
    } else {
      await pauseRecording();
    }
  };

  const handleStopRecord = async () => {
    setIsStopping(true);
    try {
      await stopRecording();
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsStopping(false);
    }
  };

  const toggleMic = async () => {
    const updated = { ...settings, captureMicrophone: !settings.captureMicrophone };
    setSettings(updated);
    await window.electronAPI.saveSettings(updated);
    preWarmCapturePipeline(updated);
  };

  const toggleSystemAudio = async () => {
    const updated = { ...settings, captureSystemAudio: !settings.captureSystemAudio };
    setSettings(updated);
    await window.electronAPI.saveSettings(updated);
    preWarmCapturePipeline(updated);
  };

  const toggleWebcam = () => {
    const nextVal = !settings.showWebcam;
    setSettings((prev) => ({ ...prev, showWebcam: nextVal }));
    window.electronAPI.toggleWebcamOverlay(nextVal);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center p-1 bg-transparent select-none">
      <div className="w-full h-full bg-slate-950/95 text-slate-100 px-4 rounded-2xl shadow-2xl border border-white/15 backdrop-blur-2xl flex items-center justify-between gap-3">
        {/* Left: Drag Handle + Status Indicator */}
        <div className="flex items-center gap-3">
          <div
            className="app-draggable cursor-move p-1 text-slate-500 hover:text-slate-300 transition"
            title="Drag Toolbar Anywhere (Any Screen)"
          >
            <GripHorizontal className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 pr-3 border-r border-white/10 app-no-drag">
            {isStopping ? (
              <span className="text-xs font-bold text-amber-400 animate-pulse">Saving...</span>
            ) : isRecording ? (
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-ping'}`} />
                <span className="text-sm font-mono font-extrabold tracking-wider text-white">
                  {formatTime(recordingDuration)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <span className="text-xs font-bold text-slate-300">Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Record / Pause / Stop Controls */}
        <div className="flex items-center gap-2 app-no-drag">
          {!isRecording ? (
            <button
              onClick={handleStartRecord}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-extrabold shadow-lg shadow-rose-600/40 hover:shadow-rose-600/60 transition-all transform hover:scale-[1.03] active:scale-[0.97] animate-record-pulse"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>REC</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleTogglePause}
                className={`p-2 rounded-xl border transition ${
                  isPaused
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                onClick={handleStopRecord}
                disabled={isStopping}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition shadow-lg shadow-rose-600/30 active:scale-95"
                title="Stop & Save Recording"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Done</span>
              </button>
            </>
          )}
        </div>

        {/* Audio Toggles with Live Volume Meter */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10 app-no-drag">
          {/* Microphone Toggle + Meter */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMic}
              className={`p-2 rounded-xl border transition ${
                settings.captureMicrophone
                  ? 'bg-slate-800/80 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-900/60 border-white/5 text-slate-500 hover:text-slate-400'
              }`}
              title={settings.captureMicrophone ? 'Microphone On' : 'Microphone Muted'}
            >
              {settings.captureMicrophone ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {settings.captureMicrophone && (
              <div className="w-10 h-2 bg-slate-800 rounded-full overflow-hidden flex items-center p-0.5 border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    isClipping ? 'bg-rose-500' : micLevel > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, micLevel))}%` }}
                />
              </div>
            )}
          </div>

          {/* System Audio Toggle */}
          <button
            onClick={toggleSystemAudio}
            className={`p-2 rounded-xl border transition ${
              settings.captureSystemAudio
                ? 'bg-slate-800/80 border-indigo-500/30 text-indigo-400'
                : 'bg-slate-900/60 border-white/5 text-slate-500 hover:text-slate-400'
            }`}
            title={settings.captureSystemAudio ? 'System Audio On' : 'System Audio Muted'}
          >
            {settings.captureSystemAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Webcam Toggle */}
          <button
            onClick={toggleWebcam}
            className={`p-2 rounded-xl border transition ${
              settings.showWebcam
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Webcam Picture-in-Picture"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Library, Settings & Window Controls */}
        <div className="flex items-center gap-1 pl-3 border-l border-white/10 app-no-drag">
          <button
            onClick={() => window.electronAPI.openDashboard('library')}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Open Recordings Library"
          >
            <Film className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.electronAPI.openDashboard('settings')}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Preferences & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.electronAPI.minimizeApp()}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.electronAPI.quitApp()}
            className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
            title="Close Reco"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('toolbar-root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ToolbarApp />
  </React.StrictMode>
);
