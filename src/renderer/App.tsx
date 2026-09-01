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
  AlertTriangle,
  Download,
  Check,
  RefreshCw,
  XCircle,
  Zap,
  Boxes
} from 'lucide-react';
import {
  RecorderSettings,
  RecordingItem,
  SystemHardwareInfo,
  EncoderChoice,
  CountdownChoice,
  OutputFormatChoice,
  EngineChoice,
  EngineInfo,
  FFmpegDownloadProgress
} from '../shared/types';

export const App: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'library' | 'settings' | 'about'>('library');
  const [activeSettingsSection, setActiveSettingsSection] = useState<'general' | 'engine' | 'audio' | 'gpu' | 'storage' | 'shortcuts'>('general');
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [hwInfo, setHwInfo] = useState<SystemHardwareInfo | null>(null);
  const [engineInfo, setEngineInfo] = useState<EngineInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<FFmpegDownloadProgress | null>(null);
  const [isInstallingFFmpeg, setIsInstallingFFmpeg] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<'license' | 'thirdparty' | 'privacy' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [settings, setSettings] = useState<RecorderSettings>({
    outputPath: '',
    framerate: 60,
    resolution: '1080p',
    encoder: 'auto',
    recordingEngine: 'auto',
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
    if (window.electronAPI.getEngineInfo) {
      const eng = await window.electronAPI.getEngineInfo();
      setEngineInfo(eng);
    }
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

    let unsubProgress: (() => void) | undefined;
    if (window.electronAPI.onFFmpegDownloadProgress) {
      unsubProgress = window.electronAPI.onFFmpegDownloadProgress((prog) => {
        setDownloadProgress(prog);
        if (prog.status === 'completed' || prog.status === 'error' || prog.status === 'cancelled') {
          setIsInstallingFFmpeg(false);
          loadData();
        }
      });
    }

    return () => {
      unsubView();
      unsubCompleted();
      if (unsubProgress) unsubProgress();
    };
  }, []);

  const handleUpdateSettings = async (newSettings: Partial<RecorderSettings>) => {
    const updated = await window.electronAPI.saveSettings(newSettings);
    setSettings(updated);
    if (newSettings.recordingEngine && window.electronAPI.setEnginePreference) {
      const eng = await window.electronAPI.setEnginePreference(newSettings.recordingEngine);
      setEngineInfo(eng);
    }
  };

  const handleInstallFFmpeg = async () => {
    if (!window.electronAPI.installManagedFFmpeg) return;
    setIsInstallingFFmpeg(true);
    setDownloadProgress({
      status: 'downloading',
      percent: 0,
      downloadedBytes: 0,
      totalBytes: 0
    });
    try {
      const res = await window.electronAPI.installManagedFFmpeg();
      if (!res.success && res.error) {
        setDownloadProgress({
          status: 'error',
          percent: 0,
          downloadedBytes: 0,
          totalBytes: 0,
          error: res.error
        });
      }
    } catch (e: any) {
      setDownloadProgress({
        status: 'error',
        percent: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        error: e?.message || 'Download failed'
      });
    } finally {
      setIsInstallingFFmpeg(false);
      loadData();
    }
  };

  const handleCancelDownload = () => {
    if (window.electronAPI.cancelFFmpegDownload) {
      window.electronAPI.cancelFFmpegDownload();
      setIsInstallingFFmpeg(false);
      setDownloadProgress(null);
    }
  };

  const handleRemoveFFmpeg = async () => {
    if (window.electronAPI.removeManagedFFmpeg) {
      await window.electronAPI.removeManagedFFmpeg();
      loadData();
    }
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
      {/* Top Header Bar with Clean Proportional Spacing */}
      <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-slate-950/80 backdrop-blur-md app-draggable shrink-0 gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3 app-no-drag shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Reco
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                MANAGER
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">by Hardik Prajapati</p>
          </div>
        </div>

        {/* Right Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 app-no-drag shrink-0">
          <button
            onClick={() => setActiveMainTab('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeMainTab === 'library'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Library ({recordings.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeMainTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>

          <button
            onClick={() => setActiveMainTab('about')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeMainTab === 'about'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About & Legal</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* 1. RECORDINGS LIBRARY VIEW */}
        {activeMainTab === 'library' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-4">
            {/* View Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-3">
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">Recordings History</h1>
                <p className="text-xs text-slate-400 mt-0.5">Review, play, open in explorer, and manage your captured clips</p>
              </div>
              <button
                onClick={handleOpenDirectory}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition border border-white/10 shrink-0"
              >
                <Folder className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open Folder</span>
              </button>
            </div>

            {/* Recordings List */}
            {recordings.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <Film className="w-7 h-7 stroke-1 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-200">No recordings yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
                  Your completed recordings will appear here after previewing and saving.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-xl p-3.5 flex items-center justify-between gap-3 border border-white/10 hover:border-white/20 transition group bg-slate-900/60"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => window.electronAPI.playRecording(rec.filePath)}
                        className="w-10 h-10 rounded-lg bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center transition shadow-sm shrink-0"
                        title="Play Video"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition">
                          {rec.fileName}
                        </p>
                        <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatDuration(rec.duration)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3 text-slate-500" />
                            {formatSize(rec.fileSize)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {formatDate(rec.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => window.electronAPI.openRecordingInFolder(rec.filePath)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/10"
                        title="Show in File Explorer"
                      >
                        <Folder className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(rec.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition border border-white/10"
                        title="Delete Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="flex-1 flex overflow-hidden max-w-4xl mx-auto w-full min-h-0">
            {/* Left Sidebar Sub-Navigation */}
            <aside className="w-48 p-4 border-r border-white/10 space-y-1 shrink-0">
              <button
                onClick={() => setActiveSettingsSection('general')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition text-left ${
                  activeSettingsSection === 'general'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Recording & Timer</span>
              </button>

              <button
                onClick={() => setActiveSettingsSection('engine')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition text-left ${
                  activeSettingsSection === 'engine'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Engine & FFmpeg</span>
              </button>

              <button
                onClick={() => setActiveSettingsSection('audio')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition text-left ${
                  activeSettingsSection === 'audio'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Audio Devices</span>
              </button>

              <button
                onClick={() => setActiveSettingsSection('gpu')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition text-left ${
                  activeSettingsSection === 'gpu'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>GPU & Encoding</span>
              </button>

              <button
                onClick={() => setActiveSettingsSection('storage')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition text-left ${
                  activeSettingsSection === 'storage'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Storage & Export</span>
              </button>

              <button
                onClick={() => setActiveSettingsSection('shortcuts')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition text-left ${
                  activeSettingsSection === 'shortcuts'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Shortcuts</span>
              </button>
            </aside>

            {/* Right Settings Content Panels */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              {/* ENGINE & FFMPEG ESSENTIALS SECTION */}
              {activeSettingsSection === 'engine' && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white">Recording Engine & Dependencies</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure the active capture engine and optional FFmpeg Essentials dependency
                    </p>
                  </div>

                  {/* Engine Selection Card */}
                  <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-200 block">Recording Engine</label>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Select your preferred capture and encoding architecture
                        </p>
                      </div>
                      {engineInfo && (
                        <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold border ${
                          engineInfo.currentEngine === 'ffmpeg'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          Active: {engineInfo.currentEngine === 'ffmpeg' ? 'FFmpeg Engine' : 'Windows Native'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        {
                          id: 'auto',
                          title: 'Automatic (Recommended)',
                          desc: 'Uses Windows capabilities offline; automatically uses FFmpeg when available'
                        },
                        {
                          id: 'native',
                          title: 'Windows Native',
                          desc: '100% Offline, zero external dependencies, native direct file streaming'
                        },
                        {
                          id: 'ffmpeg',
                          title: 'FFmpeg Engine',
                          desc: 'Hardware NVENC/AMF/QSV encoding and faststart MP4 remuxing'
                        }
                      ].map((eng) => (
                        <button
                          key={eng.id}
                          onClick={() => handleUpdateSettings({ recordingEngine: eng.id as EngineChoice })}
                          className={`p-3 rounded-lg text-left border transition flex flex-col justify-between ${
                            (settings.recordingEngine || 'auto') === eng.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                              : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-200 mb-1">{eng.title}</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{eng.desc}</p>
                          </div>
                          {(settings.recordingEngine || 'auto') === eng.id && (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold mt-2">
                              <Check className="w-3 h-3" /> Selected
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FFmpeg Essentials Manager Card */}
                  <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-200">FFmpeg Essentials</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Optional component for GPU hardware acceleration and advanced codec processing
                        </p>
                      </div>

                      {engineInfo?.ffmpegInfo.installed ? (
                        <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold border ${
                          engineInfo.ffmpegInfo.source === 'managed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {engineInfo.ffmpegInfo.source === 'managed'
                            ? 'Installed (RECO Managed)'
                            : engineInfo.ffmpegInfo.source === 'system'
                            ? 'Detected on System PATH'
                            : 'Bundled'}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 font-bold border border-white/10">
                          Not Installed
                        </span>
                      )}
                    </div>

                    {/* Installed Details */}
                    {engineInfo?.ffmpegInfo.installed ? (
                      <div className="space-y-2.5 bg-slate-950/60 p-3 rounded-lg border border-white/5 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Version:</span>
                          <span className="font-mono text-[11px] text-indigo-300 font-bold">
                            {engineInfo.ffmpegInfo.version || '9.0.1-essentials'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Location:</span>
                          <span className="font-mono text-[10px] text-slate-300 truncate max-w-xs" title={engineInfo.ffmpegInfo.path}>
                            {engineInfo.ffmpegInfo.path}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Hardware Encoders:</span>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {engineInfo.ffmpegInfo.capabilities.hasNvidia && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">NVENC</span>
                            )}
                            {engineInfo.ffmpegInfo.capabilities.hasAmd && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">AMF</span>
                            )}
                            {engineInfo.ffmpegInfo.capabilities.hasIntel && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">QSV</span>
                            )}
                            {engineInfo.ffmpegInfo.capabilities.hasLibx264 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">x264</span>
                            )}
                          </div>
                        </div>

                        {/* Actions for Managed FFmpeg */}
                        {engineInfo.ffmpegInfo.source === 'managed' && (
                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <button
                              onClick={handleInstallFFmpeg}
                              disabled={isInstallingFFmpeg}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition border border-white/10 flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3 h-3 text-indigo-400" /> Check for Updates
                            </button>
                            <button
                              onClick={handleRemoveFFmpeg}
                              disabled={isInstallingFFmpeg}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold transition border border-rose-500/20 flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3 h-3" /> Remove FFmpeg
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Not Installed - Download Flow */
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          RECO works 100% offline using Windows Native recording. You can optionally download our official FFmpeg Essentials package for advanced GPU acceleration and direct NVENC/AMF encoding.
                        </p>

                        {downloadProgress && downloadProgress.status !== 'completed' ? (
                          <div className="bg-slate-950/80 p-3.5 rounded-lg border border-indigo-500/30 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-200 capitalize">
                                {downloadProgress.status === 'downloading' && `Downloading FFmpeg Essentials (${downloadProgress.percent}%)`}
                                {downloadProgress.status === 'verifying' && 'Verifying SHA-256 integrity...'}
                                {downloadProgress.status === 'extracting' && 'Extracting and installing...'}
                                {downloadProgress.status === 'error' && `Error: ${downloadProgress.error || 'Failed'}`}
                              </span>
                              {downloadProgress.totalBytes > 0 && (
                                <span className="font-mono text-[11px] text-slate-400">
                                  {(downloadProgress.downloadedBytes / (1024 * 1024)).toFixed(1)} / {(downloadProgress.totalBytes / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                            </div>

                            {downloadProgress.status !== 'error' && (
                              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 transition-all duration-200"
                                  style={{ width: `${downloadProgress.percent}%` }}
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                              {downloadProgress.status === 'downloading' && (
                                <button
                                  onClick={handleCancelDownload}
                                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                                >
                                  Cancel
                                </button>
                              )}
                              {downloadProgress.status === 'error' && (
                                <button
                                  onClick={handleInstallFFmpeg}
                                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                                >
                                  Retry Download
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={handleInstallFFmpeg}
                            disabled={isInstallingFFmpeg}
                            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Download & Install FFmpeg Essentials
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeSettingsSection === 'general' && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white">Recording & Countdown</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Configure pre-recording countdown and framerate</p>
                  </div>

                  {/* Pre-recording Countdown Setting */}
                  <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-2.5">
                    <label className="text-xs font-bold text-slate-200 block">Pre-Recording Countdown</label>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Shows an animated 3-2-1 overlay and pauses at the GO confirmation screen.
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
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                            settings.countdownSeconds === item.val
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                              : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Framerate */}
                  <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-2.5">
                    <label className="text-xs font-bold text-slate-200 block">Target Framerate</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[60, 30].map((fps) => (
                        <button
                          key={fps}
                          onClick={() => handleUpdateSettings({ framerate: fps as 30 | 60 })}
                          className={`py-2.5 rounded-lg text-xs font-bold border transition ${
                            settings.framerate === fps
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
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
                <div className="space-y-5">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white">Audio Capture Devices</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Manage microphone input and system sound loopback</p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-200">Record Microphone Input</p>
                        <p className="text-xs text-slate-400 mt-0.5">Captures external voice over 48kHz audio graph</p>
                      </div>
                      <button
                        onClick={() => handleUpdateSettings({ captureMicrophone: !settings.captureMicrophone })}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition border shrink-0 ${
                          settings.captureMicrophone
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-800 border-white/10 text-slate-400'
                        }`}
                      >
                        {settings.captureMicrophone ? 'Enabled' : 'Muted'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                      <div>
                        <p className="text-xs font-bold text-slate-200">Record System Sound (Loopback)</p>
                        <p className="text-xs text-slate-400 mt-0.5">Captures desktop applications, games, and browser audio</p>
                      </div>
                      <button
                        onClick={() => handleUpdateSettings({ captureSystemAudio: !settings.captureSystemAudio })}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition border shrink-0 ${
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
                <div className="space-y-5">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white">GPU & Hardware Encoding</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Hardware acceleration and encoder engine configuration</p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        Hardware Encoder
                      </label>
                      {hwInfo && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
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
                          className={`py-2.5 rounded-lg text-xs font-bold border transition ${
                            settings.encoder === enc.id
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
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
                <div className="space-y-5">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white">Storage & Export</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Default save location and recording output format</p>
                  </div>

                  {/* Default Save Directory */}
                  <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-2.5">
                    <label className="text-xs font-bold text-slate-200 block">Default Save Destination</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono truncate">
                        {settings.outputPath}
                      </div>
                      <button
                        onClick={handleSelectDirectory}
                        className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm shrink-0"
                      >
                        Change
                      </button>
                      <button
                        onClick={handleResetDirectory}
                        className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition border border-white/10 shrink-0"
                        title="Reset to default (%USERPROFILE%\Videos\Reco)"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Default Format */}
                  <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-2.5">
                    <label className="text-xs font-bold text-slate-200 block">Default Video Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['mp4', 'mkv', 'webm'] as OutputFormatChoice[]).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => handleUpdateSettings({ defaultFormat: fmt })}
                          className={`py-2 rounded-lg text-xs font-bold uppercase border transition ${
                            settings.defaultFormat === fmt
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
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
                <div className="space-y-5">
                  <div className="pb-3 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white">Keyboard Shortcuts</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Global system-wide hotkeys and local controls</p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 divide-y divide-white/5">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-slate-300 font-medium">Record / Stop / Confirm GO</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-slate-950 border border-white/15 text-xs font-mono font-bold text-indigo-300">
                        Ctrl + Shift + R
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-slate-300 font-medium">Pause / Resume Recording</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-slate-950 border border-white/15 text-xs font-mono font-bold text-amber-300">
                        Ctrl + Shift + P
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-slate-300 font-medium">Cancel Countdown / Cancel GO</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-slate-950 border border-white/15 text-xs font-mono font-bold text-rose-300">
                        Esc
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-slate-300 font-medium">Preview Play / Pause</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-slate-950 border border-white/15 text-xs font-mono font-bold text-emerald-300">
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
          <div className="flex-1 p-6 overflow-y-auto max-w-3xl mx-auto w-full space-y-5">
            <div className="p-5 rounded-2xl border border-white/10 text-center relative overflow-hidden bg-slate-900/50">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">RECO</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Modern Offline Desktop Screen Recorder</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">Version 1.0.0 • 64-bit Windows</p>
              <p className="text-xs text-slate-400 mt-2">
                Copyright © 2026 <strong className="text-slate-200">Hardik Prajapati</strong>. Licensed under the <strong className="text-indigo-400">MIT License</strong>.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedLegalDoc(selectedLegalDoc === 'license' ? null : 'license')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  selectedLegalDoc === 'license'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Scale className="w-4 h-4 text-indigo-400 mb-1.5" />
                <h3 className="text-xs font-bold">MIT License</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Software license terms</p>
              </button>

              <button
                onClick={() => setSelectedLegalDoc(selectedLegalDoc === 'thirdparty' ? null : 'thirdparty')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  selectedLegalDoc === 'thirdparty'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-400 mb-1.5" />
                <h3 className="text-xs font-bold">Third-Party Notices</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Open source attributions</p>
              </button>

              <button
                onClick={() => setSelectedLegalDoc(selectedLegalDoc === 'privacy' ? null : 'privacy')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  selectedLegalDoc === 'privacy'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4 text-emerald-400 mb-1.5" />
                <h3 className="text-xs font-bold">Privacy Guarantee</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">100% offline & zero telemetry</p>
              </button>
            </div>

            {selectedLegalDoc && (
              <div className="p-4 rounded-xl border border-white/15 max-h-72 overflow-y-auto text-xs text-slate-300 font-sans leading-relaxed space-y-2.5 bg-slate-950/70">
                {selectedLegalDoc === 'license' && (
                  <div>
                    <h3 className="text-xs font-bold text-white mb-1.5">MIT License</h3>
                    <p className="font-mono text-[10px] bg-black/40 p-3 rounded-lg text-slate-300 border border-white/5">
                      Copyright (c) 2026 Hardik Prajapati<br /><br />
                      Permission is hereby granted, free of charge, to any person obtaining a copy
                      of this software and associated documentation files (the "Software"), to deal
                      in the Software without restriction...
                    </p>
                  </div>
                )}

                {selectedLegalDoc === 'thirdparty' && (
                  <div>
                    <h3 className="text-xs font-bold text-white mb-1.5">Third-Party Software Attribution</h3>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
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
                    <h3 className="text-xs font-bold text-white mb-1.5">Privacy & Offline Data Guarantee</h3>
                    <p className="text-[11px]"> All recordings and audio are processed exclusively on your local computer.</p>
                    <p className="text-[11px]"> RECO contains no analytics probes or tracking SDKs.</p>
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
          <div className="bg-slate-900 border border-white/15 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">Delete Recording?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This recording file will be permanently removed from your computer.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition border border-white/5"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteRecording(deleteTargetId)}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm"
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
