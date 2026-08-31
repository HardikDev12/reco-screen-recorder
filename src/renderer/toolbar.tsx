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
  Maximize2,
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

  const handleSetFullScreen = () => {
    window.electronAPI.setFrameFullScreen();
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center p-1 bg-transparent select-none">
      <div className="w-full h-full bg-slate-950/95 text-slate-100 px-4 py-2 rounded-2xl shadow-2xl border border-white/15 backdrop-blur-2xl flex items-center justify-between gap-3">
        {/* Section 1: Drag Grip + State Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="app-draggable cursor-move p-1.5 text-slate-500 hover:text-slate-200 transition rounded-lg hover:bg-white/5"
            title="Drag Toolbar Anywhere (Multi-Monitor Supported)"
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

        {/* Section 2: Big Record / Pause / Stop Controls */}
        <div className="flex items-center gap-2.5 app-no-drag shrink-0">
          {!isRecording ? (
            <button
              onClick={handleStartRecord}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-extrabold shadow-lg shadow-rose-600/40 hover:shadow-rose-600/60 transition-all transform hover:scale-[1.03] active:scale-[0.97] animate-record-pulse cursor-pointer"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>REC</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleTogglePause}
                className={`p-2 rounded-xl border transition cursor-pointer ${
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer"
                title="Stop & Save Recording"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Done</span>
              </button>
            </>
          )}
        </div>

        {/* Section 3: Audio Toggles with Live Volume Meter */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10 app-no-drag shrink-0">
          {/* Microphone Toggle + Level Meter */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/5">
            <button
              onClick={toggleMic}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                settings.captureMicrophone
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={settings.captureMicrophone ? 'Microphone Enabled' : 'Microphone Muted'}
            >
              {settings.captureMicrophone ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>

            {settings.captureMicrophone && (
              <div className="w-9 h-2 bg-slate-800 rounded-full overflow-hidden flex items-center p-0.5 border border-white/5 mr-1">
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
            className={`p-2 rounded-xl border transition cursor-pointer ${
              settings.captureSystemAudio
                ? 'bg-slate-900/90 border-indigo-500/40 text-indigo-400'
                : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300'
            }`}
            title={settings.captureSystemAudio ? 'System Audio Enabled' : 'System Audio Muted'}
          >
            {settings.captureSystemAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Webcam Toggle */}
          <button
            onClick={toggleWebcam}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              settings.showWebcam
                ? 'bg-indigo-600/90 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Webcam Picture-in-Picture"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section 4: Full Screen & Display Tools */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-white/10 app-no-drag shrink-0">
          {/* Full Screen Option */}
          <button
            onClick={handleSetFullScreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 transition text-xs font-semibold cursor-pointer shadow-sm"
            title="Expand Recording Frame to Full Screen"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Full Screen</span>
          </button>

          {/* Library */}
          <button
            onClick={() => window.electronAPI.openDashboard('library')}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Recordings History"
          >
            <Film className="w-3.5 h-3.5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => window.electronAPI.openDashboard('settings')}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section 5: Window Controls */}
        <div className="flex items-center gap-1 pl-2 border-l border-white/10 app-no-drag shrink-0">
          <button
            onClick={() => window.electronAPI.minimizeApp()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => window.electronAPI.quitApp()}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            title="Exit Reco"
          >
            <X className="w-3.5 h-3.5" />
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
