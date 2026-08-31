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
  Cpu
} from 'lucide-react';
import { RecorderSettings, RecordingItem, SystemHardwareInfo, EncoderChoice } from '../shared/types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'settings'>('library');
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [hwInfo, setHwInfo] = useState<SystemHardwareInfo | null>(null);
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
      setActiveTab(view);
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

  const handleDeleteRecording = async (id: string) => {
    const res = await window.electronAPI.deleteRecording(id);
    if (res.success) {
      setRecordings(res.recordings);
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
    <div className="flex flex-col h-screen w-screen bg-[#0b0f17] text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-16 px-8 border-b border-white/5 flex items-center justify-between bg-slate-950/60 backdrop-blur-md app-draggable">
        <div className="flex items-center gap-3.5 app-no-drag">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Reco
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                MANAGER
              </span>
            </div>
            <p className="text-[11px] text-slate-400">by Hardik Prajapati</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5 app-no-drag">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            Recordings ({recordings.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Preferences
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'library' ? (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h1 className="text-xl font-bold text-white">Captured Videos</h1>
                <p className="text-xs text-slate-400">Instant playback and file location management</p>
              </div>
              <button
                onClick={() => handleSelectDirectory()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition border border-white/5"
              >
                <Folder className="w-4 h-4 text-indigo-400" />
                Change Save Folder
              </button>
            </div>

            {recordings.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-500">
                <Film className="w-16 h-16 mb-4 stroke-1 text-slate-600" />
                <p className="text-base font-semibold text-slate-300">No recordings yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Use the transparent overlay frame on your desktop to record videos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4 border border-white/5 hover:border-white/15 transition group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <button
                        onClick={() => window.electronAPI.playRecording(rec.filePath)}
                        className="w-12 h-12 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center transition shadow-sm shrink-0"
                        title="Play in Default Player"
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
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition border border-white/5"
                        title="Show in File Explorer"
                      >
                        <Folder className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecording(rec.id)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition border border-white/5"
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
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="pb-3 border-b border-white/5">
              <h1 className="text-xl font-bold text-white">Recording Preferences</h1>
              <p className="text-xs text-slate-400">Configure framerate, encoding engine, and storage directory</p>
            </div>

            {/* Framerate & Resolution */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-white/10">
                <label className="text-xs font-bold text-slate-300 block mb-3">Target Framerate</label>
                <div className="grid grid-cols-2 gap-2">
                  {[60, 30].map((fps) => (
                    <button
                      key={fps}
                      onClick={() => handleUpdateSettings({ framerate: fps as 30 | 60 })}
                      className={`py-3 rounded-xl text-xs font-bold border transition ${
                        settings.framerate === fps
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {fps} FPS {fps === 60 ? '⚡ Ultra' : 'Standard'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    GPU Encoder
                  </label>
                  {hwInfo && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                      {hwInfo.hasNvidia ? 'NVENC Active' : hwInfo.hasAmd ? 'AMF Active' : 'x264'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'auto', name: 'Auto GPU' },
                    { id: 'x264', name: 'Software (CPU)' }
                  ].map((enc) => (
                    <button
                      key={enc.id}
                      onClick={() => handleUpdateSettings({ encoder: enc.id as EncoderChoice })}
                      className={`py-3 rounded-xl text-xs font-bold border transition ${
                        settings.encoder === enc.id
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {enc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Directory */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10">
              <label className="text-xs font-bold text-slate-300 block mb-3">Save Destination Folder</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 font-mono truncate">
                  {settings.outputPath}
                </div>
                <button
                  onClick={handleSelectDirectory}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 shrink-0"
                >
                  <Folder className="w-4 h-4" />
                  Browse
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
