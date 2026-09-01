import { RecorderSettings, RegionBounds, RecordingItem, EngineType } from '../../../shared/types';

export interface EngineCapabilities {
  engineType: EngineType;
  supportsHardwareAcceleration: boolean;
  supportsH264: boolean;
  supportsAac: boolean;
  supportsCropping: boolean;
  supportsCustomFramerate: boolean;
  supportedFormats: string[];
}

export interface IRecordingEngine {
  readonly engineType: EngineType;
  
  start(
    settings: RecorderSettings,
    bounds?: RegionBounds | null
  ): Promise<{ success: boolean; filePath: string }>;

  writeChunk(chunk: Buffer): void;

  pause(): void;

  resume(): void;

  stop(): Promise<RecordingItem | null>;

  getIsRecording(): boolean;

  getIsPaused(): boolean;

  getCapabilities(): EngineCapabilities;
}
