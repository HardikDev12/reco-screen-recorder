import React, { useState, useEffect } from 'react';
import { Film, Play, Folder, Trash2, X, Clock, HardDrive, Calendar } from 'lucide-react';
import { RecordingItem } from '../../shared/types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose }) => {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const items = await window.electronAPI.getRecordings();
      setRecordings(items);
    } catch (err) {
      console.error('Failed to load recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecordings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handlePlay = (filePath: string) => {
    window.electronAPI.playRecording(filePath);
  };

  const handleOpenFolder = (filePath: string) => {
    window.electronAPI.openRecordingInFolder(filePath);
  };

  const handleDelete = async (id: string) => {
    const res = await window.electronAPI.deleteRecording(id);
    if (res.success) {
      setRecordings(res.recordings);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-[740px] max-h-[85vh] rounded-2xl p-6 flex flex-col shadow-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Recordings Library</h2>
              <p className="text-xs text-slate-400">View, play, and manage your captured videos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[420px] pr-1">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Loading library...</div>
          ) : recordings.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Film className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-300">No recordings yet</p>
              <p className="text-xs text-slate-500 mt-1">Your captured MP4 videos will automatically appear here.</p>
            </div>
          ) : (
            recordings.map((rec) => (
              <div
                key={rec.id}
                className="glass-panel rounded-xl p-3.5 flex items-center justify-between gap-4 border border-white/5 hover:border-white/15 transition group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    onClick={() => handlePlay(rec.filePath)}
                    className="w-12 h-12 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center cursor-pointer transition shadow-sm shrink-0"
                    title="Play Video"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition">
                      {rec.fileName}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
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

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenFolder(rec.filePath)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                    title="Open in File Explorer"
                  >
                    <Folder className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Recording"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
