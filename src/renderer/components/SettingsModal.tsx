import React, { useState, useEffect } from 'react';
import { X, Folder, Cpu, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { RecorderSettings, SystemHardwareInfo, EncoderChoice } from '../../shared/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RecorderSettings;
  onSaveSettings: (settings: Partial<RecorderSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [hwInfo, setHwInfo] = useState<SystemHardwareInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      window.electronAPI.getHardwareInfo().then(setHwInfo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectDirectory = async () => {
    const dir = await window.electronAPI.selectDirectory();
    if (dir) {
      onSaveSettings({ outputPath: dir });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-[580px] rounded-2xl p-6 flex flex-col shadow-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Recording Preferences</h2>
              <p className="text-xs text-slate-400">Configure quality, hardware acceleration, and output storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-4 space-y-5">
          {/* Framerate & Resolution */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Target Frame Rate</label>
              <div className="grid grid-cols-2 gap-2">
                {[60, 30].map((fps) => (
                  <button
                    key={fps}
                    onClick={() => onSaveSettings({ framerate: fps as 30 | 60 })}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      settings.framerate === fps
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {fps} FPS {fps === 60 ? '⚡ Ultra' : 'Standard'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Resolution Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {['1080p', '720p'].map((res) => (
                  <button
                    key={res}
                    onClick={() => onSaveSettings({ resolution: res as any })}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                      settings.resolution === res
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {res === '1080p' ? '1080p FHD' : '720p HD'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hardware Encoder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Video Encoder Pipeline
              </label>
              {hwInfo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {hwInfo.hasNvidia ? 'NVIDIA NVENC Detected' : hwInfo.hasAmd ? 'AMD AMF Detected' : 'CPU Software'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto', name: 'Auto (Recommended)', sub: 'Best available GPU' },
                { id: 'nvenc', name: 'NVIDIA NVENC', sub: 'GeForce GPU', disabled: !hwInfo?.hasNvidia },
                { id: 'x264', name: 'Software (x264)', sub: 'CPU Encoding' }
              ].map((enc) => (
                <button
                  key={enc.id}
                  disabled={enc.disabled}
                  onClick={() => onSaveSettings({ encoder: enc.id as EncoderChoice })}
                  className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-center ${
                    enc.disabled
                      ? 'opacity-30 cursor-not-allowed bg-slate-900/20 border-white/5'
                      : settings.encoder === enc.id
                      ? 'bg-indigo-600/90 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-xs font-bold truncate">{enc.name}</span>
                  <span className="text-[10px] opacity-70 truncate">{enc.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Save Directory */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Save Destination Folder</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 truncate font-mono">
                {settings.outputPath}
              </div>
              <button
                onClick={handleSelectDirectory}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-white/10 transition shrink-0"
              >
                <Folder className="w-4 h-4 text-indigo-400" />
                Browse
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
