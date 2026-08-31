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

export interface RecorderSettings {
  outputPath: string;
  framerate: FramerateChoice;
  resolution: ResolutionChoice;
  encoder: EncoderChoice;
  captureMicrophone: boolean;
  captureSystemAudio: boolean;
  selectedMicrophoneId?: string;
  showWebcam: boolean;
  selectedWebcamId?: string;
  hardwareAcceleration: boolean;
  countdownSeconds: number;
  highlightClicks: boolean;
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
}

export type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopping' | 'saved';

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
