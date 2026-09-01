import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { IRecordingEngine, EngineCapabilities } from './types';
import { RecorderSettings, RegionBounds, RecordingItem } from '../../../shared/types';

export class NativeRecordingEngine implements IRecordingEngine {
  public readonly engineType = 'native';

  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private lastResumeTime: number = 0;
  private activeDurationMs: number = 0;
  private fileWriteStream: fs.WriteStream | null = null;
  private currentTempPath: string | null = null;
  private currentFinalStagedPath: string | null = null;
  private tempStagingDir: string = path.join(app.getPath('temp'), 'reco-temp');

  constructor() {
    if (!fs.existsSync(this.tempStagingDir)) {
      try {
        fs.mkdirSync(this.tempStagingDir, { recursive: true });
      } catch (e) {}
    }
  }

  public getCapabilities(): EngineCapabilities {
    return {
      engineType: 'native',
      supportsHardwareAcceleration: true, // Chromium WebRTC uses D3D11 / Media Foundation GPU acceleration
      supportsH264: true,
      supportsAac: true,
      supportsCropping: true,
      supportsCustomFramerate: true,
      supportedFormats: ['MP4', 'WEBM']
    };
  }

  public async start(
    settings: RecorderSettings,
    _bounds?: RegionBounds | null
  ): Promise<{ success: boolean; filePath: string }> {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    if (!fs.existsSync(this.tempStagingDir)) {
      fs.mkdirSync(this.tempStagingDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const formatExt = settings.defaultFormat || 'mp4';
    const fileName = `Reco_${timestamp}.${formatExt}`;

    this.currentFinalStagedPath = path.join(this.tempStagingDir, fileName);
    this.currentTempPath = path.join(this.tempStagingDir, `raw_${fileName}`);

    // Create high-performance append stream for incoming media chunks
    this.fileWriteStream = fs.createWriteStream(this.currentTempPath, {
      flags: 'w',
      highWaterMark: 1024 * 1024 // 1 MB buffer
    });

    this.startTime = Date.now();
    this.lastResumeTime = this.startTime;
    this.activeDurationMs = 0;
    this.isRecording = true;
    this.isPaused = false;

    console.log(`[NativeEngine] Recording started -> ${this.currentTempPath}`);

    return {
      success: true,
      filePath: this.currentFinalStagedPath
    };
  }

  public writeChunk(chunk: Buffer): void {
    if (this.isRecording && !this.isPaused && this.fileWriteStream && this.fileWriteStream.writable) {
      try {
        this.fileWriteStream.write(chunk);
      } catch (err) {
        console.error('[NativeEngine] Error writing chunk:', err);
      }
    }
  }

  public pause(): void {
    if (this.isRecording && !this.isPaused) {
      this.activeDurationMs += (Date.now() - this.lastResumeTime);
      this.isPaused = true;
      console.log('[NativeEngine] Recording paused');
    }
  }

  public resume(): void {
    if (this.isRecording && this.isPaused) {
      this.lastResumeTime = Date.now();
      this.isPaused = false;
      console.log('[NativeEngine] Recording resumed');
    }
  }

  public async stop(): Promise<RecordingItem | null> {
    if (!this.isRecording) {
      return null;
    }

    if (!this.isPaused) {
      this.activeDurationMs += (Date.now() - this.lastResumeTime);
    }

    const duration = Math.max(1, Math.round(this.activeDurationMs / 1000));
    const tempPath = this.currentTempPath;
    const finalStagedPath = this.currentFinalStagedPath;

    this.isRecording = false;
    this.isPaused = false;

    return new Promise((resolve) => {
      if (this.fileWriteStream) {
        this.fileWriteStream.end(() => {
          this.fileWriteStream = null;
          this.finalizeRecordingFile(tempPath, finalStagedPath, duration, resolve);
        });
      } else {
        this.finalizeRecordingFile(tempPath, finalStagedPath, duration, resolve);
      }
    });
  }

  private finalizeRecordingFile(
    tempPath: string | null,
    finalStagedPath: string | null,
    duration: number,
    resolve: (item: RecordingItem | null) => void
  ): void {
    if (tempPath && fs.existsSync(tempPath) && finalStagedPath) {
      try {
        if (tempPath !== finalStagedPath) {
          if (fs.existsSync(finalStagedPath)) {
            try { fs.unlinkSync(finalStagedPath); } catch (e) {}
          }
          fs.renameSync(tempPath, finalStagedPath);
        }

        const stats = fs.statSync(finalStagedPath);
        const stagedItem: RecordingItem = {
          id: `rec_${Date.now()}`,
          filePath: finalStagedPath,
          fileName: path.basename(finalStagedPath),
          duration,
          fileSize: stats.size,
          timestamp: Date.now(),
          resolution: '1920 × 1080',
          fps: 60,
          format: path.extname(finalStagedPath).replace('.', '').toUpperCase()
        };

        console.log('[NativeEngine] Recording finalized successfully:', stagedItem.fileName, `(${stats.size} bytes)`);
        resolve(stagedItem);
      } catch (err) {
        console.error('[NativeEngine] Finalize error:', err);
        resolve(null);
      }
    } else {
      resolve(null);
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }
}
