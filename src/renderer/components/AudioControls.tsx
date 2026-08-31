import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff, ChevronDown } from 'lucide-react';
import { RecorderSettings } from '../../shared/types';

interface AudioControlsProps {
  settings: RecorderSettings;
  onUpdateSettings: (settings: Partial<RecorderSettings>) => void;
  micLevel: number;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  settings,
  onUpdateSettings,
  micLevel
}) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [showMicDropdown, setShowMicDropdown] = useState(false);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        setAudioDevices(audioInputs);
      } catch (err) {
        console.warn('Could not enumerate audio devices:', err);
      }
    };
    loadDevices();
  }, []);

  const toggleSystemAudio = () => {
    onUpdateSettings({ captureSystemAudio: !settings.captureSystemAudio });
  };

  const toggleMicrophone = () => {
    onUpdateSettings({ captureMicrophone: !settings.captureMicrophone });
  };

  return (
    <div className="flex items-center gap-3">
      {/* System Audio Toggle */}
      <button
        onClick={toggleSystemAudio}
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
          settings.captureSystemAudio
            ? 'bg-slate-800/80 border-indigo-500/40 text-slate-200 hover:bg-slate-800 shadow-sm'
            : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-400'
        }`}
        title={settings.captureSystemAudio ? 'Desktop Audio Enabled' : 'Desktop Audio Muted'}
      >
        {settings.captureSystemAudio ? (
          <Volume2 className="w-4 h-4 text-indigo-400" />
        ) : (
          <VolumeX className="w-4 h-4 text-slate-500" />
        )}
        <span>System Sound</span>
        <div
          className={`w-2 h-2 rounded-full ${
            settings.captureSystemAudio ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
          }`}
        />
      </button>

      {/* Microphone Toggle + Live Meter */}
      <div className="relative">
        <div
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
            settings.captureMicrophone
              ? 'bg-slate-800/80 border-indigo-500/40 text-slate-200'
              : 'bg-slate-900/40 border-white/5 text-slate-500'
          }`}
        >
          <button
            onClick={toggleMicrophone}
            className="flex items-center gap-2 hover:opacity-80 transition"
            title={settings.captureMicrophone ? 'Microphone Enabled' : 'Microphone Muted'}
          >
            {settings.captureMicrophone ? (
              <Mic className="w-4 h-4 text-emerald-400" />
            ) : (
              <MicOff className="w-4 h-4 text-slate-500" />
            )}
            <span>Microphone</span>
          </button>

          {/* Live Volume Meter Bar */}
          {settings.captureMicrophone && (
            <div className="w-14 h-2 bg-slate-700/60 rounded-full overflow-hidden flex items-center p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-75"
                style={{ width: `${Math.max(4, Math.min(100, micLevel))}%` }}
              />
            </div>
          )}

          {/* Device Selector Arrow */}
          {audioDevices.length > 1 && (
            <button
              onClick={() => setShowMicDropdown(!showMicDropdown)}
              className="p-0.5 hover:bg-white/10 rounded transition text-slate-400 hover:text-white"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Menu */}
        {showMicDropdown && (
          <div className="absolute top-full mt-2 left-0 w-64 glass-panel rounded-xl p-2 z-50 border border-white/10 shadow-xl">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
              Select Microphone
            </p>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {audioDevices.map((dev) => (
                <button
                  key={dev.deviceId}
                  onClick={() => {
                    onUpdateSettings({ selectedMicrophoneId: dev.deviceId });
                    setShowMicDropdown(false);
                  }}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-lg truncate transition ${
                    settings.selectedMicrophoneId === dev.deviceId || (!settings.selectedMicrophoneId && dev.deviceId === 'default')
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {dev.label || `Microphone ${dev.deviceId.slice(0, 5)}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
