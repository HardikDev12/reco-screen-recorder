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
    <div className="w-screen h-screen flex items-center justify-center p-2 bg-transparent select-none overflow-hidden font-sans">
      {/* Normalized Floating Toolbar Container */}
      <div className="h-[52px] px-3 py-2 bg-[#090d16] text-slate-100 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 mx-auto">
        {/* GROUP 1: Drag + Status + Record/Stop (8px internal gap) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Drag Handle (36x36px with 16px icon) */}
          <div
            className="app-draggable cursor-move w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition rounded-[10px] hover:bg-white/10"
            title="Drag Toolbar Anywhere"
          >
            <GripHorizontal className="w-4 h-4" />
          </div>

          {/* Status Badge (36px height, 12px px, 8px gap) */}
          <div className="h-9 px-3 bg-[#131927] rounded-[10px] border border-white/10 flex items-center gap-2 shrink-0 app-no-drag">
            {isStopping ? (
              <span className="text-xs font-bold text-amber-400 animate-pulse">Saving...</span>
            ) : isRecording ? (
              <>
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-ping'}`} />
                <span className="text-xs font-mono font-extrabold tracking-wider text-white">
                  {formatTime(recordingDuration)}
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Ready</span>
              </>
            )}
          </div>

          {/* Primary Record / Pause / Done Action (36px height, 16px px, 8px gap) */}
          <div className="app-no-drag shrink-0">
            {!isRecording ? (
              <button
                onClick={handleStartRecord}
                className="h-9 px-4 rounded-[10px] bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-extrabold shadow-md shadow-rose-600/40 hover:shadow-rose-600/60 transition transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer shrink-0 animate-record-pulse"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>REC</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePause}
                  className={`h-9 px-3 rounded-[10px] border transition cursor-pointer flex items-center gap-2 text-xs font-bold ${
                    isPaused
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-[#131927] border-white/15 text-slate-200 hover:bg-slate-800'
                  }`}
                  title={isPaused ? 'Resume Recording' : 'Pause Recording'}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  onClick={handleStopRecord}
                  disabled={isStopping}
                  className="h-9 px-3.5 rounded-[10px] bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition shadow-md shadow-rose-600/30 active:scale-95 cursor-pointer flex items-center gap-2"
                  title="Stop & Save Recording"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Done</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Group Divider (1px width, 20px height) */}
        <div className="w-[1px] h-5 bg-white/15 shrink-0" />

        {/* GROUP 2: Audio & Media Group (8px internal gap) */}
        <div className="flex items-center gap-2 app-no-drag shrink-0">
          {/* Microphone + Live Level Meter (36px height, 10px px, 8px gap) */}
          <div className="h-9 px-2.5 bg-[#131927] rounded-[10px] border border-white/10 flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`transition cursor-pointer ${
                settings.captureMicrophone ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={settings.captureMicrophone ? 'Microphone On' : 'Microphone Muted'}
            >
              {settings.captureMicrophone ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-slate-500" />}
            </button>

            {settings.captureMicrophone && (
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden flex items-center p-0.5 border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    isClipping ? 'bg-rose-500' : micLevel > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, micLevel))}%` }}
                />
              </div>
            )}
          </div>

          {/* System Audio Toggle (36x36px) */}
          <button
            onClick={toggleSystemAudio}
            className={`w-9 h-9 rounded-[10px] border transition cursor-pointer flex items-center justify-center ${
              settings.captureSystemAudio
                ? 'bg-[#131927] border-indigo-500/40 text-indigo-400'
                : 'bg-[#131927]/60 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
            title={settings.captureSystemAudio ? 'System Sound On' : 'System Sound Muted'}
          >
            {settings.captureSystemAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Webcam Toggle (36x36px) */}
          <button
            onClick={toggleWebcam}
            className={`w-9 h-9 rounded-[10px] border transition cursor-pointer flex items-center justify-center ${
              settings.showWebcam
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-[#131927]/60 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Webcam Picture-in-Picture"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Group Divider */}
        <div className="w-[1px] h-5 bg-white/15 shrink-0" />

        {/* GROUP 3: Tools & Secondary Group (8px internal gap) */}
        <div className="flex items-center gap-2 app-no-drag shrink-0">
          {/* Full Screen Button (36px height, 12px px, 8px gap) */}
          <button
            onClick={handleSetFullScreen}
            className="h-9 px-3 rounded-[10px] bg-[#131927] hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 transition text-xs font-semibold flex items-center gap-2 cursor-pointer"
            title="Expand Recording Frame to Full Screen"
          >
            <Maximize2 className="w-4 h-4 text-indigo-400" />
            <span>Full Screen</span>
          </button>

          {/* Library Button (36x36px) */}
          <button
            onClick={() => window.electronAPI.openDashboard('library')}
            className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#131927]/70 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
            title="Recordings History"
          >
            <Film className="w-4 h-4" />
          </button>

          {/* Settings Button (36x36px) */}
          <button
            onClick={() => window.electronAPI.openDashboard('settings')}
            className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#131927]/70 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Group Divider */}
        <div className="w-[1px] h-5 bg-white/15 shrink-0" />

        {/* GROUP 4: Window Controls (32x32px secondary controls, 8px gap) */}
        <div className="flex items-center gap-2 app-no-drag shrink-0">
          <button
            onClick={() => window.electronAPI.minimizeApp()}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.electronAPI.quitApp()}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
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
