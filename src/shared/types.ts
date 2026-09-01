export type CaptureType = 'screen' | 'window' | 'region';

export interface CaptureSource {
  id: string;
  name: string;
  thumbnail: string;
  appIcon?: string;
  display_id?: string;
  isScreen: boolean;
}

export interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type EncoderChoice = 'auto' | 'nvenc' | 'amf' | 'qsv' | 'x264';
export type FramerateChoice = 30 | 60;
export type ResolutionChoice = '1080p' | '720p' | 'original';
export type CountdownChoice = 0 | 3 | 5;
export type OutputFormatChoice = 'mp4' | 'mkv' | 'webm';
export type AutoConvertChoice = 'never' | 'ask' | 'always';

export type EngineChoice = 'auto' | 'native' | 'ffmpeg';
export type EngineType = 'native' | 'ffmpeg';
export type FFmpegSource = 'managed' | 'system' | 'bundled' | 'none';

export interface FFmpegDependencyInfo {
  installed: boolean;
  source: FFmpegSource;
  version?: string;
  path?: string;
  capabilities: {
    hasNvidia: boolean;
    hasAmd: boolean;
    hasIntel: boolean;
    hasLibx264: boolean;
    hasAac: boolean;
  };
}

export interface EngineInfo {
  currentEngine: EngineType;
  selectedPreference: EngineChoice;
  nativeAvailable: boolean;
  ffmpegInfo: FFmpegDependencyInfo;
}

export interface FFmpegDownloadProgress {
  status: 'idle' | 'downloading' | 'verifying' | 'extracting' | 'completed' | 'error' | 'cancelled';
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  error?: string;
}

export interface RecorderSettings {
  outputPath: string;
  framerate: FramerateChoice;
  resolution: ResolutionChoice;
  encoder: EncoderChoice;
  recordingEngine?: EngineChoice;
  captureMicrophone: boolean;
  captureSystemAudio: boolean;
  selectedMicrophoneId?: string;
  showWebcam: boolean;
  selectedWebcamId?: string;
  hardwareAcceleration: boolean;
  countdownSeconds: CountdownChoice;
  highlightClicks: boolean;
  defaultFormat: OutputFormatChoice;
  autoConvert: AutoConvertChoice;
  lastSaveLocation?: string;
}

export interface RecordingItem {
  id: string;
  filePath: string;
  fileName: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  timestamp: number; // unix ms
  thumbnailUrl?: string;
  resolution: string;
  fps: number;
  format?: string;
}

export interface SettingsHistoryItem {
  id: number;
  key: string;
  oldValue: string | null;
  newValue: string;
  changedAt: string;
}

export type RecordingStatus =
  | 'idle'
  | 'countdown'
  | 'ready'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'preview';

export interface RecordingStatePayload {
  status: RecordingStatus;
  duration: number; // in seconds
  currentFilePath?: string;
}

export interface SystemHardwareInfo {
  hasNvidia: boolean;
  hasAmd: boolean;
  hasIntel: boolean;
  recommendedEncoder: EncoderChoice;
  ffmpegFound: boolean;
  ffmpegPath?: string;
}

