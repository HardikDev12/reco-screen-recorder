import React, { useState, useEffect } from 'react';
import {
  Video,
  Settings,
  Film,
  Folder,
  Trash2,
  Play,
  Clock,
  HardDrive,
  Calendar,
  Sliders,
  ShieldCheck,
  Cpu,
  Info,
  Scale,
  FileText,
  Lock,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Layers,
  Mic,
  Volume2,
  Monitor,
  Keyboard,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  RecorderSettings,
  RecordingItem,
  SystemHardwareInfo,
  EncoderChoice,
  CountdownChoice,
  OutputFormatChoice
} from '../shared/types';

export const App: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'library' | 'settings' | 'about'>('library');
  const [activeSettingsSection, setActiveSettingsSection] = useState<'general' | 'audio' | 'gpu' | 'storage' | 'shortcuts'>('general');
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [hwInfo, setHwInfo] = useState<SystemHardwareInfo | null>(null);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<'license' | 'thirdparty' | 'privacy' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [settings, setSettings] = useState<RecorderSettings>({
    outputPath: '',
    framerate: 60,
    resolution: '1080p',
    encoder: 'auto',
    captureMicrophone: true,
    captureSystemAudio: true,
    showWebcam: false,
    hardwareAcceleration: true,
    countdownSeconds: 3,
    highlightClicks: false,
    defaultFormat: 'mp4',
    autoConvert: 'never'
  });

  const loadData = async () => {
    const s = await window.electronAPI.getSettings();
    setSettings(s);
    const recs = await window.electronAPI.getRecordings();
    setRecordings(recs);
    const hw = await window.electronAPI.getHardwareInfo();
    setHwInfo(hw);
  };

  useEffect(() => {
    loadData();

    const unsubView = window.electronAPI.onDashboardView((view) => {
      setActiveMainTab(view);
      loadData();
    });

    const unsubCompleted = window.electronAPI.onRecordingCompleted(() => {
      loadData();
    });

    return () => {
      unsubView();
      unsubCompleted();
    };
  }, []);

  const handleUpdateSettings = async (newSettings: Partial<RecorderSettings>) => {
    const updated = await window.electronAPI.saveSettings(newSettings);
    setSettings(updated);
  };

  const handleSelectDirectory = async () => {
    const dir = await window.electronAPI.selectDirectory();
    if (dir) {
      handleUpdateSettings({ outputPath: dir });
    }
  };

  const handleResetDirectory = async () => {
    const defaultPath = await (window.electronAPI as any).resetDefaultSaveLocation?.();
    if (defaultPath) {
      setSettings((prev) => ({ ...prev, outputPath: defaultPath }));
    }
  };

  const handleOpenDirectory = async () => {
    await (window.electronAPI as any).openSaveLocationFolder?.();
  };

  const handleDeleteRecording = async (id: string) => {
    const res = await window.electronAPI.deleteRecording(id);
    if (res.success) {
      setRecordings(res.recordings);
      setDeleteTargetId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Header Bar with Clean Optical Tab Navigation */}
      <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-slate-950/80 backdrop-blur-md app-draggable shrink-0">
        <div className="flex items-center gap-3.5 app-no-drag">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Reco
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                MANAGER
              </span>
            </div>
            <p className="text-[11px] text-slate-400">by Hardik Prajapati</p>
          </div>
        </div>

        {/* Fixed Header Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 app-no-drag">
          <button
            onClick={() => setActiveMainTab('library')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeMainTab === 'library'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Library ({recordings.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('settings')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeMainTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Preferences</span>
          </button>

          <button
            onClick={() => setActiveMainTab('about')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeMainTab === 'about'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About & Legal</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* 1. SEPARATE RECORDINGS LIBRARY VIEW */}
        {activeMainTab === 'library' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Recordings History</h1>
                <p className="text-xs text-slate-400">Review, play, open in explorer, and manage your captured clips</p>
              </div>
              <button
                onClick={handleOpenDirectory}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition border border-white/10"
              >
                <Folder className="w-4 h-4 text-indigo-400" />
                Open Videos Folder
              </button>
            </div>

            {recordings.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-500">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Film className="w-8 h-8 stroke-1 text-slate-400" />
                </div>
                <p className="text-base font-bold text-slate-200">No recordings yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                  Your completed recordings will appear here after previewing and saving them.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4 border border-white/10 hover:border-white/20 transition group bg-slate-900/60"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <button
                        onClick={() => window.electronAPI.playRecording(rec.filePath)}
                        className="w-12 h-12 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center transition shadow-sm shrink-0"
                        title="Play Video"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition">
                          {rec.fileName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {formatDuration(rec.duration)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                            {formatSize(rec.fileSize)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {formatDate(rec.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => window.electronAPI.openRecordingInFolder(rec.filePath)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/10"
                        title="Show in File Explorer"
                      >
                        <Folder className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(rec.id)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition border border-white/10"
                        title="Delete Video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. EXPANDED MULTI-SECTION SETTINGS VIEW */}
        {activeMainTab === 'settings' && (
          <div className="flex-1 flex overflow-hidden max-w-5xl mx-auto w-full">
            {/* Left Sidebar Sub-Navigation */}
            <aside className="w-56 p-5 border-r border-white/10 space-y-1.5 shrink-0">
              <button
                onClick={() => setActiveSettingsSection('general')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                  activeSettingsSection === 'general'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Recording & Timer</span>
              </button>

              <button
                onClick={() => setActiveSettingsSection('audio')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                  activeSettingsSection === 'audio'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Audio Devices</span>
              </button>

              <button
                onClick={() => setActiveSettingsSection('gpu')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                  activeSettingsSection === 'gpu'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>GPU & Encoding</span>
              </button>

              <button
                onClick={() => setActiveSettingsSection('storage')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                  activeSettingsSection === 'storage'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Folder className="w-4 h-4" />
                <span>Storage & Export</span>
              </button>

              <button
                onClick={() => setActiveSettingsSection('shortcuts')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                  activeSettingsSection === 'shortcuts'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Shortcuts</span>
              </button>
            </aside>

            {/* Right Settings Content Panels */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {activeSettingsSection === 'general' && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-base font-bold text-white">Recording & Countdown</h2>
                    <p className="text-xs text-slate-400">Configure pre-recording countdown and framerate</p>
                  </div>

                  {/* Pre-recording Countdown Setting */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/50 space-y-3">
                    <label className="text-xs font-bold text-slate-200 block">Pre-Recording Countdown</label>
                    <p className="text-xs text-slate-400">
                      Shows a visual 3-2-1 overlay and waits on the GO screen before actual recording begins.
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        { val: 0, label: 'Off (Direct GO)' },
                        { val: 3, label: '3 Seconds (Default)' },
                        { val: 5, label: '5 Seconds' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => handleUpdateSettings({ countdownSeconds: item.val as CountdownChoice })}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                            settings.countdownSeconds === item.val
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Framerate */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/50 space-y-3">
                    <label className="text-xs font-bold text-slate-200 block">Target Framerate</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[60, 30].map((fps) => (
                        <button
                          key={fps}
                          onClick={() => handleUpdateSettings({ framerate: fps as 30 | 60 })}
                          className={`py-3 rounded-xl text-xs font-bold border transition ${
                            settings.framerate === fps
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {fps} FPS {fps === 60 ? '⚡ Ultra Smooth' : 'Standard'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsSection === 'audio' && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-base font-bold text-white">Audio Capture Devices</h2>
                    <p className="text-xs text-slate-400">Manage microphone input and system sound loopback</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-200">Record Microphone Input</p>
                        <p className="text-xs text-slate-400">Captures external voice over 48kHz audio graph</p>
                      </div>
                      <button
                        onClick={() => handleUpdateSettings({ captureMicrophone: !settings.captureMicrophone })}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border ${
                          settings.captureMicrophone
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-800 border-white/10 text-slate-400'
                        }`}
                      >
                        {settings.captureMicrophone ? 'Enabled' : 'Muted'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div>
                        <p className="text-xs font-bold text-slate-200">Record System Sound (Loopback)</p>
                        <p className="text-xs text-slate-400">Captures desktop applications, games, and browser audio</p>
                      </div>
                      <button
                        onClick={() => handleUpdateSettings({ captureSystemAudio: !settings.captureSystemAudio })}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border ${
                          settings.captureSystemAudio
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-800 border-white/10 text-slate-400'
                        }`}
                      >
                        {settings.captureSystemAudio ? 'Enabled' : 'Muted'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsSection === 'gpu' && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-base font-bold text-white">GPU & Hardware Encoding</h2>
                    <p className="text-xs text-slate-400">Hardware acceleration and encoder engine configuration</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-400" />
                        Hardware Encoder
                      </label>
                      {hwInfo && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          {hwInfo.hasNvidia ? 'NVENC Active' : hwInfo.hasAmd ? 'AMF Active' : 'x264 Active'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'auto', name: 'Auto GPU (Recommended)' },
                        { id: 'x264', name: 'Software (CPU x264)' }
                      ].map((enc) => (
                        <button
                          key={enc.id}
                          onClick={() => handleUpdateSettings({ encoder: enc.id as EncoderChoice })}
                          className={`py-3 rounded-xl text-xs font-bold border transition ${
                            settings.encoder === enc.id
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {enc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsSection === 'storage' && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-base font-bold text-white">Storage & Export</h2>
                    <p className="text-xs text-slate-400">Default save location and recording output format</p>
                  </div>

                  {/* Default Save Directory */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/50 space-y-3">
                    <label className="text-xs font-bold text-slate-200 block">Default Save Destination</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono truncate">
                        {settings.outputPath}
                      </div>
                      <button
                        onClick={handleSelectDirectory}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm shrink-0"
                      >
                        Change
                      </button>
                      <button
                        onClick={handleResetDirectory}
                        className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition border border-white/10 shrink-0"
                        title="Reset to default (%USERPROFILE%\Videos\Reco)"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Default Format */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/50 space-y-3">
                    <label className="text-xs font-bold text-slate-200 block">Default Video Container Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['mp4', 'mkv', 'webm'] as OutputFormatChoice[]).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => handleUpdateSettings({ defaultFormat: fmt })}
                          className={`py-2.5 rounded-xl text-xs font-bold uppercase border transition ${
                            settings.defaultFormat === fmt
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsSection === 'shortcuts' && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-base font-bold text-white">Keyboard Shortcuts</h2>
                    <p className="text-xs text-slate-400">Global system-wide hotkeys and local controls</p>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/50 divide-y divide-white/5">
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-xs text-slate-300 font-medium">Record / Stop / Confirm GO</span>
                      <kbd className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/15 text-xs font-mono font-bold text-indigo-300">
                        Ctrl + Shift + R
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-xs text-slate-300 font-medium">Pause / Resume Recording</span>
                      <kbd className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/15 text-xs font-mono font-bold text-amber-300">
                        Ctrl + Shift + P
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-xs text-slate-300 font-medium">Cancel Countdown / Cancel GO</span>
                      <kbd className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/15 text-xs font-mono font-bold text-rose-300">
                        Esc
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-xs text-slate-300 font-medium">Preview Play / Pause</span>
                      <kbd className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/15 text-xs font-mono font-bold text-emerald-300">
                        Space
                      </kbd>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. ABOUT & LEGAL VIEW */}
        {activeMainTab === 'about' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-3xl mx-auto w-full space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center relative overflow-hidden bg-slate-900/50">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-xl shadow-indigo-600/30 mb-4">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">RECO</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Modern Offline Desktop Screen Recorder</p>
              <p className="text-xs text-slate-500 mt-2 font-mono">Version 1.0.0 • 64-bit Windows</p>
              <p className="text-xs text-slate-400 mt-3">
                Copyright © 2026 <strong className="text-slate-200">Hardik Prajapati</strong>. Licensed under the <strong className="text-indigo-400">MIT License</strong>.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedLegalDoc(selectedLegalDoc === 'license' ? null : 'license')}
                className={`p-4 rounded-2xl border text-left transition ${
                  selectedLegalDoc === 'license'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Scale className="w-5 h-5 text-indigo-400 mb-2" />
                <h3 className="text-xs font-bold">MIT License</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Software license terms</p>
              </button>

              <button
                onClick={() => setSelectedLegalDoc(selectedLegalDoc === 'thirdparty' ? null : 'thirdparty')}
                className={`p-4 rounded-2xl border text-left transition ${
                  selectedLegalDoc === 'thirdparty'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5 text-indigo-400 mb-2" />
                <h3 className="text-xs font-bold">Third-Party Notices</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Open source attributions</p>
              </button>

              <button
                onClick={() => setSelectedLegalDoc(selectedLegalDoc === 'privacy' ? null : 'privacy')}
                className={`p-4 rounded-2xl border text-left transition ${
                  selectedLegalDoc === 'privacy'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Lock className="w-5 h-5 text-emerald-400 mb-2" />
                <h3 className="text-xs font-bold">Privacy Guarantee</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">100% offline & zero telemetry</p>
              </button>
            </div>

            {selectedLegalDoc && (
              <div className="glass-panel p-6 rounded-2xl border border-white/15 max-h-80 overflow-y-auto text-xs text-slate-300 font-sans leading-relaxed space-y-3 bg-slate-950/70">
                {selectedLegalDoc === 'license' && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">MIT License</h3>
                    <p className="font-mono text-[11px] bg-black/40 p-4 rounded-xl text-slate-300 border border-white/5">
                      Copyright (c) 2026 Hardik Prajapati<br /><br />
                      Permission is hereby granted, free of charge, to any person obtaining a copy
                      of this software and associated documentation files (the "Software"), to deal
                      in the Software without restriction, including without limitation the rights
                      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                      copies of the Software...
                    </p>
                  </div>
                )}

                {selectedLegalDoc === 'thirdparty' && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Third-Party Software Attribution</h3>
                    <ul className="space-y-1.5 text-slate-300">
                      <li>• <strong>Electron & Chromium</strong> — OpenJS Foundation / Google LLC (MIT / BSD)</li>
                      <li>• <strong>React 19 & React DOM</strong> — Meta Platforms, Inc. (MIT)</li>
                      <li>• <strong>FFmpeg & FFprobe</strong> — FFmpeg developers (GPL v3 / LGPL v2.1+)</li>
                      <li>• <strong>Lucide Icons</strong> — Lucide Contributors (ISC)</li>
                      <li>• <strong>Tailwind CSS</strong> — Tailwind Labs, Inc. (MIT)</li>
                      <li>• <strong>Vite</strong> — Evan You & Vite Contributors (MIT)</li>
                    </ul>
                  </div>
                )}

                {selectedLegalDoc === 'privacy' && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Privacy & Offline Data Guarantee</h3>
                    <p>• <strong>Zero Cloud Uploads</strong>: All recordings and audio are processed exclusively on your local computer.</p>
                    <p>• <strong>Zero Telemetry</strong>: RECO contains no analytics probes or tracking SDKs.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Delete Recording?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This recording file will be permanently removed from your computer.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition border border-white/5"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteRecording(deleteTargetId)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
