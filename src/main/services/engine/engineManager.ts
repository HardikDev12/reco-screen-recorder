import { app } from 'electron';
import { IRecordingEngine } from './types';
import { NativeRecordingEngine } from './nativeEngine';
import { FFmpegRecordingEngine } from './ffmpegEngine';
import { FFmpegDetector } from '../ffmpeg/ffmpegDetector';
import { FFmpegDownloader } from '../ffmpeg/ffmpegDownloader';
import {
  EngineChoice,
  EngineInfo,
  EngineType,
  RecorderSettings,
  RegionBounds,
  RecordingItem,
  FFmpegDownloadProgress
} from '../../../shared/types';

export class EngineManager {
  private nativeEngine: NativeRecordingEngine;
  private ffmpegEngine: FFmpegRecordingEngine;
  private detector: FFmpegDetector;
  private downloader: FFmpegDownloader;
  private activeEngine: IRecordingEngine;

  constructor() {
    this.detector = new FFmpegDetector();
    this.downloader = new FFmpegDownloader();
    this.nativeEngine = new NativeRecordingEngine();
    this.ffmpegEngine = new FFmpegRecordingEngine(this.detector);
    this.activeEngine = this.nativeEngine;

    this.registerProcessCleanup();
  }

  public getEngineInfo(userPreference: EngineChoice = 'auto'): EngineInfo {
    const ffmpegInfo = this.detector.detect();
    const resolvedEngine = this.resolveActiveEngineType(userPreference, ffmpegInfo.installed);

    return {
      currentEngine: resolvedEngine,
      selectedPreference: userPreference,
      nativeAvailable: true,
      ffmpegInfo
    };
  }

  private resolveActiveEngineType(preference: EngineChoice, ffmpegInstalled: boolean): EngineType {
    if (preference === 'native') {
      return 'native';
    }
    if (preference === 'ffmpeg') {
      return ffmpegInstalled ? 'ffmpeg' : 'native';
    }
    // 'auto' mode: prefer FFmpeg if installed on system/managed, otherwise native
    return ffmpegInstalled ? 'ffmpeg' : 'native';
  }

  public async startRecording(
    settings: RecorderSettings,
    bounds?: RegionBounds | null
  ): Promise<{ success: boolean; filePath: string; engine: EngineType }> {
    const preference = settings.recordingEngine || 'auto';
    const ffmpegInfo = this.detector.detect();
    const selectedType = this.resolveActiveEngineType(preference, ffmpegInfo.installed);

    if (selectedType === 'ffmpeg' && ffmpegInfo.installed) {
      this.activeEngine = this.ffmpegEngine;
    } else {
      this.activeEngine = this.nativeEngine;
    }

    console.log(`[EngineManager] Starting recording with engine: ${this.activeEngine.engineType}`);
    const result = await this.activeEngine.start(settings, bounds);

    return {
      ...result,
      engine: this.activeEngine.engineType
    };
  }

  public writeChunk(chunk: Buffer): void {
    if (this.activeEngine && this.activeEngine.getIsRecording()) {
      this.activeEngine.writeChunk(chunk);
    }
  }

  public pauseRecording(): void {
    if (this.activeEngine) {
      this.activeEngine.pause();
    }
  }

  public resumeRecording(): void {
    if (this.activeEngine) {
      this.activeEngine.resume();
    }
  }

  public async stopRecording(): Promise<RecordingItem | null> {
    if (this.activeEngine) {
      return await this.activeEngine.stop();
    }
    return null;
  }

  public getIsRecording(): boolean {
    return this.activeEngine ? this.activeEngine.getIsRecording() : false;
  }

  public getIsPaused(): boolean {
    return this.activeEngine ? this.activeEngine.getIsPaused() : false;
  }

  // --- Managed FFmpeg Lifecycle ---

  public async installManagedFFmpeg(
    onProgress?: (progress: FFmpegDownloadProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.downloader.downloadAndInstall(onProgress);
    if (result.success) {
      // Refresh detection cache
      this.detector.detect(true);
    }
    return result;
  }

  public cancelFFmpegDownload(): void {
    this.downloader.cancel();
  }

  public async removeManagedFFmpeg(): Promise<boolean> {
    const success = await this.downloader.remove();
    if (success) {
      this.detector.detect(true);
    }
    return success;
  }

  public getDetector(): FFmpegDetector {
    return this.detector;
  }

  private registerProcessCleanup(): void {
    const cleanup = () => {
      try {
        if (this.downloader.getIsDownloading()) {
          this.downloader.cancel();
        }
      } catch (e) {}
    };

    app.on('before-quit', cleanup);
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
}
