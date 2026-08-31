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
    <div className="w-screen h-screen flex items-center justify-center p-1 bg-transparent select-none overflow-hidden font-sans">
      {/* Compact Floating Control Pill */}
      <div className="w-full h-[48px] bg-[#0c101a] text-slate-100 px-3 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between gap-2.5">
        {/* Left: Drag Grip + Status + REC Button (Tight Cohort) */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="app-draggable cursor-move p-1 text-slate-400 hover:text-white transition rounded-md hover:bg-white/10"
            title="Drag Toolbar Anywhere"
          >
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 h-[32px] px-2.5 bg-[#161c2c] rounded-lg border border-white/10 shrink-0 app-no-drag">
            {isStopping ? (
              <span className="text-[11px] font-bold text-amber-400 animate-pulse">Saving...</span>
            ) : isRecording ? (
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-ping'}`} />
                <span className="text-xs font-mono font-extrabold tracking-wider text-white">
                  {formatTime(recordingDuration)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-200">Ready</span>
              </div>
            )}
          </div>

          {/* REC / Pause / Done Button right next to Status */}
          <div className="app-no-drag shrink-0">
            {!isRecording ? (
              <button
                onClick={handleStartRecord}
                className="h-[32px] px-4 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-[11px] font-extrabold shadow-md shadow-rose-600/40 hover:shadow-rose-600/60 transition transform hover:scale-[1.03] active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>REC</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleTogglePause}
                  className={`h-[32px] px-2.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                    isPaused
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-[#161c2c] border-white/15 text-slate-200 hover:bg-slate-800'
                  }`}
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  onClick={handleStopRecord}
                  disabled={isStopping}
                  className="h-[32px] px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold transition shadow-md shadow-rose-600/30 active:scale-95 cursor-pointer flex items-center gap-1"
                  title="Stop & Save Recording"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Done</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="w-[1px] h-4 bg-white/15 shrink-0" />

        {/* Center: Audio Controls */}
        <div className="flex items-center gap-1.5 app-no-drag shrink-0">
          {/* Mic + Live Meter */}
          <div className="flex items-center gap-1.5 bg-[#161c2c] h-[32px] px-2.5 rounded-lg border border-white/10">
            <button
              onClick={toggleMic}
              className={`transition cursor-pointer ${
                settings.captureMicrophone ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={settings.captureMicrophone ? 'Microphone On' : 'Microphone Muted'}
            >
              {settings.captureMicrophone ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {settings.captureMicrophone && (
              <div className="w-8 h-1.5 bg-slate-800 rounded-full overflow-hidden flex items-center p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    isClipping ? 'bg-rose-500' : micLevel > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, micLevel))}%` }}
                />
              </div>
            )}
          </div>

          {/* System Sound */}
          <button
            onClick={toggleSystemAudio}
            className={`h-[32px] w-[32px] rounded-lg border transition cursor-pointer flex items-center justify-center ${
              settings.captureSystemAudio
                ? 'bg-[#161c2c] border-indigo-500/40 text-indigo-400'
                : 'bg-[#161c2c]/50 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
            title={settings.captureSystemAudio ? 'System Sound On' : 'System Sound Muted'}
          >
            {settings.captureSystemAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Webcam */}
          <button
            onClick={toggleWebcam}
            className={`h-[32px] w-[32px] rounded-lg border transition cursor-pointer flex items-center justify-center ${
              settings.showWebcam
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-[#161c2c]/50 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Webcam PIP"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-4 bg-white/15 shrink-0" />

        {/* Right: Full Screen, Library, Settings & Window Controls */}
        <div className="flex items-center gap-1.5 app-no-drag shrink-0">
          {/* Full Screen */}
          <button
            onClick={handleSetFullScreen}
            className="h-[32px] flex items-center gap-1.5 px-2.5 rounded-lg bg-[#161c2c] hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 transition text-[11px] font-semibold cursor-pointer"
            title="Expand Recording Frame to Full Screen"
          >
            <Maximize2 className="w-3 h-3 text-indigo-400" />
            <span>Full Screen</span>
          </button>

          {/* Library */}
          <button
            onClick={() => window.electronAPI.openDashboard('library')}
            className="h-[32px] w-[32px] flex items-center justify-center rounded-lg bg-[#161c2c]/60 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
            title="Recordings History"
          >
            <Film className="w-3.5 h-3.5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => window.electronAPI.openDashboard('settings')}
            className="h-[32px] w-[32px] flex items-center justify-center rounded-lg bg-[#161c2c]/60 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Close */}
          <button
            onClick={() => window.electronAPI.minimizeApp()}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer ml-1"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => window.electronAPI.quitApp()}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
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
