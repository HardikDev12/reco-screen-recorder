import React, { useState, useEffect } from 'react';
import { Monitor, AppWindow, Crop, X, Check, RefreshCw } from 'lucide-react';
import { CaptureSource, RegionBounds } from '../../shared/types';

interface SourcePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSource: (source: CaptureSource) => void;
  onSelectRegion: () => void;
  currentSource: CaptureSource | null;
}

export const SourcePickerModal: React.FC<SourcePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSource,
  onSelectRegion,
  currentSource
}) => {
  const [sources, setSources] = useState<CaptureSource[]>([]);
  const [tab, setTab] = useState<'screen' | 'window'>('screen');
  const [loading, setLoading] = useState(false);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const items = await window.electronAPI.getSources();
      setSources(items);
    } catch (err) {
      console.error('Failed to load capture sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSources();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const screens = sources.filter((s) => s.isScreen);
  const windows = sources.filter((s) => !s.isScreen);
  const displayed = tab === 'screen' ? screens : windows;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-[720px] max-h-[85vh] rounded-2xl p-6 flex flex-col shadow-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Select Capture Source</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose a display screen, specific application window, or custom region</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSources}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
              title="Refresh sources"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab & Region Selector */}
        <div className="flex items-center justify-between my-4 gap-3">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setTab('screen')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                tab === 'screen'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Screens ({screens.length})
            </button>
            <button
              onClick={() => setTab('window')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                tab === 'window'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AppWindow className="w-4 h-4" />
              Windows ({windows.length})
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onSelectRegion();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-900/30"
          >
            <Crop className="w-4 h-4" />
            Select Custom Region
          </button>
        </div>

        {/* Sources Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-4 py-2 max-h-[380px]">
          {loading ? (
            <div className="col-span-2 py-16 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm">Enumerating available sources...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="col-span-2 py-16 text-center text-slate-400 text-sm">
              No capture sources found in this category.
            </div>
          ) : (
            displayed.map((source) => {
              const isSelected = currentSource?.id === source.id;
              return (
                <div
                  key={source.id}
                  onClick={() => {
                    onSelectSource(source);
                    onClose();
                  }}
                  className={`group relative rounded-xl border p-3 cursor-pointer transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'border-white/10 bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/60 border border-white/5">
                    {source.thumbnail ? (
                      <img
                        src={source.thumbnail}
                        alt={source.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Monitor className="w-8 h-8" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    {source.appIcon && (
                      <img src={source.appIcon} alt="" className="w-4 h-4 rounded shrink-0" />
                    )}
                    <span className="text-xs font-medium text-slate-200 truncate">{source.name}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
