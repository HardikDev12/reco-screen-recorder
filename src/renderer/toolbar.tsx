import React, { useState, useEffect, useCallback } from 'react';
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
    togglePause,
    stopRecording
  } = useMediaRecording();

  const handleTogglePause = useCallback(async () => {
    if (!isRecording) return;
    await togglePause();
  }, [isRecording, togglePause]);

  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      setSettings(s);
      preWarmCapturePipeline(s);
    });

    const unsubCompleted = window.electronAPI.onRecordingCompleted(() => {
      setIsStopping(false);
    });

    const unsubTogglePause = window.electronAPI.onTogglePause(() => {
      handleTogglePause();
    });

    // Local keyboard listener for Ctrl+Shift+P
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleTogglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubCompleted();
      unsubTogglePause();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [preWarmCapturePipeline, handleTogglePause]);

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
    <div className="w-screen h-screen flex items-center justify-center p-2 bg-transparent select-none overflow-hidden font-sans">
      {/* Normalized Toolbar Container */}
      <div className="toolbar-container">
        {/* GROUP 1: Drag + Status + Record/Stop */}
        <div className="toolbar-group">
          {/* Horizontal Drag Grip */}
          <div
            className="app-draggable toolbar-drag-handle cursor-grab active:cursor-grabbing"
            title="Drag Toolbar Anywhere"
          >
            <GripHorizontal className="w-4 h-4" />
          </div>

          {/* Status Badge */}
          <div className="toolbar-pill-status app-no-drag">
            {isStopping ? (
              <span className="text-amber-400 animate-pulse font-medium">Saving...</span>
            ) : isRecording ? (
              isPaused ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80 shrink-0" />
                  <span className="text-amber-400 font-semibold text-xs uppercase tracking-wider">Paused</span>
                  <span className="font-mono text-amber-200 tracking-wider">
                    {formatTime(recordingDuration)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="font-mono text-white tracking-wider font-semibold">
                    {formatTime(recordingDuration)}
                  </span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse shrink-0" />
                <span className="font-medium text-slate-300">Ready</span>
              </div>
            )}
          </div>

          {/* Primary REC / Controls Button Group */}
          <div className="app-no-drag shrink-0">
            {!isRecording ? (
              <button
                onClick={handleStartRecord}
                className="toolbar-btn-rec"
                title="Start Screen Recording"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                <span>REC</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Pause / Resume Button */}
                <button
                  onClick={handleTogglePause}
                  className={`toolbar-btn-text transition-colors duration-150 ${
                    isPaused
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'hover:bg-white/10 text-slate-200'
                  }`}
                  title={isPaused ? 'Resume Recording (Ctrl+Shift+P)' : 'Pause Recording (Ctrl+Shift+P)'}
                >
                  {isPaused ? (
                    <Play className="w-3.5 h-3.5 fill-current text-amber-400 shrink-0" />
                  ) : (
                    <Pause className="w-3.5 h-3.5 shrink-0 text-slate-200" />
                  )}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                {/* Stop & Save Button */}
                <button
                  onClick={handleStopRecord}
                  disabled={isStopping}
                  className="toolbar-btn-done"
                  title="Stop & Save Recording"
                >
                  <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Done</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Group Divider */}
        <div className="toolbar-divider" />

        {/* GROUP 2: Audio & Media Group */}
        <div className="toolbar-group app-no-drag">
          {/* Microphone + Level Meter */}
          <div className="toolbar-mic-container">
            <button
              onClick={toggleMic}
              className={`cursor-pointer transition shrink-0 ${
                settings.captureMicrophone ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={settings.captureMicrophone ? 'Microphone On' : 'Microphone Muted'}
            >
              {settings.captureMicrophone ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-slate-500" />}
            </button>

            {settings.captureMicrophone && (
              <div className="w-14 h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5 shrink-0 flex items-center">
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
            className={`toolbar-icon-btn ${
              settings.captureSystemAudio ? 'text-indigo-400 border-indigo-500/40' : 'text-slate-500'
            }`}
            title={settings.captureSystemAudio ? 'System Sound On' : 'System Sound Muted'}
          >
            {settings.captureSystemAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Webcam Toggle */}
          <button
            onClick={toggleWebcam}
            className={`toolbar-icon-btn ${
              settings.showWebcam ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/30' : 'text-slate-400'
            }`}
            title="Toggle Webcam Picture-in-Picture"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Group Divider */}
        <div className="toolbar-divider" />

        {/* GROUP 3: Tools & Secondary Group */}
        <div className="toolbar-group app-no-drag">
          {/* Full Screen Button */}
          <button
            onClick={handleSetFullScreen}
            className="toolbar-btn-text"
            title="Expand Recording Frame to Full Screen"
          >
            <Maximize2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Full Screen</span>
          </button>

          {/* Library Button */}
          <button
            onClick={() => window.electronAPI.openDashboard('library')}
            className="toolbar-icon-btn"
            title="Recordings History"
          >
            <Film className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => window.electronAPI.openDashboard('settings')}
            className="toolbar-icon-btn"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Group Divider */}
        <div className="toolbar-divider" />

        {/* GROUP 4: Window Controls */}
        <div className="toolbar-group app-no-drag">
          <button
            onClick={() => window.electronAPI.minimizeApp()}
            className="toolbar-window-btn"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.electronAPI.quitApp()}
            className="toolbar-window-btn hover:!bg-rose-500/20 hover:!text-rose-400"
            title="Exit Reco"
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
