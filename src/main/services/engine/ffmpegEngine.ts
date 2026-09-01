import { spawn, ChildProcessWithoutNullStreams, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { app, screen } from 'electron';
import { IRecordingEngine, EngineCapabilities } from './types';
import { EncoderChoice, RecorderSettings, RegionBounds, RecordingItem } from '../../../shared/types';
import { FFmpegDetector } from '../ffmpeg/ffmpegDetector';

export class FFmpegRecordingEngine implements IRecordingEngine {
  public readonly engineType = 'ffmpeg';

  private ffmpegProcess: ChildProcessWithoutNullStreams | null = null;
  private currentTempPath: string | null = null;
  private currentFinalStagedPath: string | null = null;
  private startTime: number = 0;
  private lastResumeTime: number = 0;
  private activeDurationMs: number = 0;
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private tempStagingDir: string = path.join(app.getPath('temp'), 'reco-temp');
  private detector: FFmpegDetector;

  constructor(detector: FFmpegDetector) {
    this.detector = detector;
    if (!fs.existsSync(this.tempStagingDir)) {
      try {
        fs.mkdirSync(this.tempStagingDir, { recursive: true });
      } catch (e) {}
    }
  }

  public getCapabilities(): EngineCapabilities {
    const info = this.detector.detect();
    return {
      engineType: 'ffmpeg',
      supportsHardwareAcceleration: info.capabilities.hasNvidia || info.capabilities.hasAmd || info.capabilities.hasIntel,
      supportsH264: true,
      supportsAac: true,
      supportsCropping: true,
      supportsCustomFramerate: true,
      supportedFormats: ['MP4', 'MKV', 'WEBM']
    };
  }

  private getEncoderArgs(choice: EncoderChoice): string[] {
    const info = this.detector.detect();
    let selected = choice;
    if (selected === 'auto') {
      if (info.capabilities.hasNvidia) selected = 'nvenc';
      else if (info.capabilities.hasAmd) selected = 'amf';
      else if (info.capabilities.hasIntel) selected = 'qsv';
      else selected = 'x264';
    }

    switch (selected) {
      case 'nvenc':
        if (info.capabilities.hasNvidia) {
          return ['-c:v', 'h264_nvenc', '-preset', 'p4', '-tune', 'hq', '-rc', 'vbr', '-cq', '19', '-b:v', '8M', '-maxrate', '16M'];
        }
        break;
      case 'amf':
        if (info.capabilities.hasAmd) {
          return ['-c:v', 'h264_amf', '-quality', 'quality', '-rc', 'cbr', '-b:v', '8M'];
        }
        break;
      case 'qsv':
        if (info.capabilities.hasIntel) {
          return ['-c:v', 'h264_qsv', '-preset', 'veryfast', '-global_quality', '20'];
        }
        break;
      default:
        break;
    }

    return ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19'];
  }

  public async start(
    settings: RecorderSettings,
    cropBounds?: RegionBounds | null
  ): Promise<{ success: boolean; filePath: string }> {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    const info = this.detector.detect();
    if (!info.installed || !info.path) {
      throw new Error('FFmpeg is not installed or available on this system.');
    }

    if (!fs.existsSync(this.tempStagingDir)) {
      fs.mkdirSync(this.tempStagingDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const formatExt = settings.defaultFormat || 'mp4';
    const fileName = `Reco_${timestamp}.${formatExt}`;

    this.currentFinalStagedPath = path.join(this.tempStagingDir, fileName);
    this.currentTempPath = path.join(this.tempStagingDir, `raw_${fileName}`);

    const encoderArgs = this.getEncoderArgs(settings.encoder);
    const targetFps = settings.framerate || 60;

    let videoFilters = 'format=yuv420p';
    if (cropBounds && cropBounds.width > 20 && cropBounds.height > 20) {
      try {
        const primaryDisplay = screen.getPrimaryDisplay();
        const scale = primaryDisplay.scaleFactor || 1;
        const screenW = Math.round(primaryDisplay.bounds.width * scale);
        const screenH = Math.round(primaryDisplay.bounds.height * scale);

        let cx = Math.max(0, Math.floor(cropBounds.x * scale));
        let cy = Math.max(0, Math.floor(cropBounds.y * scale));
        let cw = Math.floor(cropBounds.width * scale);
        let ch = Math.floor(cropBounds.height * scale);

        if (cx + cw > screenW) cw = screenW - cx;
        if (cy + ch > screenH) ch = screenH - cy;

        cw = Math.floor(cw / 2) * 2;
        ch = Math.floor(ch / 2) * 2;

        if (cw >= 32 && ch >= 32) {
          videoFilters = `crop=${cw}:${ch}:${cx}:${cy},format=yuv420p`;
        }
      } catch (e) {
        console.warn('Crop calculation fallback:', e);
      }
    }

    const args: string[] = [
      '-y',
      '-loglevel', 'warning',
      '-f', 'webm',
      '-i', 'pipe:0',
      '-vf', videoFilters,
      ...encoderArgs,
      '-r', `${targetFps}`,
      '-colorspace', 'bt709',
      '-color_primaries', 'bt709',
      '-color_trc', 'bt709',
      '-color_range', 'tv',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '48000',
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
      this.currentTempPath
    ];

    console.log(`[FFmpegEngine] Spawning FFmpeg (${info.path}) from source (${info.source})`);

    this.ffmpegProcess = spawn(info.path, args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.startTime = Date.now();
    this.lastResumeTime = this.startTime;
    this.activeDurationMs = 0;
    this.isRecording = true;
    this.isPaused = false;

    this.ffmpegProcess.stderr.on('data', (chunk) => {
      console.log(`[FFmpeg]: ${chunk.toString()}`);
    });

    this.ffmpegProcess.on('error', (err) => {
      console.error('[FFmpegEngine] process error:', err);
    });

    this.ffmpegProcess.on('close', (code) => {
      console.log(`[FFmpegEngine] exited with code ${code}`);
      this.isRecording = false;
      this.isPaused = false;
    });

    return {
      success: true,
      filePath: this.currentFinalStagedPath
    };
  }

  public writeChunk(chunk: Buffer): void {
    if (this.isRecording && !this.isPaused && this.ffmpegProcess && this.ffmpegProcess.stdin.writable) {
      try {
        this.ffmpegProcess.stdin.write(chunk);
      } catch (err) {
        console.error('[FFmpegEngine] Error writing chunk to stdin:', err);
      }
    }
  }

  public pause(): void {
    if (this.isRecording && !this.isPaused) {
      this.activeDurationMs += (Date.now() - this.lastResumeTime);
      this.isPaused = true;
      console.log('[FFmpegEngine] Recording paused');
    }
  }

  public resume(): void {
    if (this.isRecording && this.isPaused) {
      this.lastResumeTime = Date.now();
      this.isPaused = false;
      console.log('[FFmpegEngine] Recording resumed');
    }
  }

  public async stop(): Promise<RecordingItem | null> {
    if (!this.isRecording && !this.ffmpegProcess) {
      return null;
    }

    if (!this.isPaused) {
      this.activeDurationMs += (Date.now() - this.lastResumeTime);
    }

    const duration = Math.max(1, Math.round(this.activeDurationMs / 1000));
    const tempPath = this.currentTempPath;
    const finalStagedPath = this.currentFinalStagedPath;
    const info = this.detector.detect();
    const ffmpegBinary = info.path || 'ffmpeg';

    return new Promise((resolve) => {
      if (!this.ffmpegProcess) {
        this.isRecording = false;
        this.isPaused = false;
        resolve(null);
        return;
      }

      const proc = this.ffmpegProcess;
      this.ffmpegProcess = null;
      this.isRecording = false;
      this.isPaused = false;

      try {
        proc.stdin.end();
      } catch (err) {
        console.warn('[FFmpegEngine] Error ending stdin:', err);
      }

      const finishTimeout = setTimeout(() => {
        try {
          proc.kill('SIGINT');
        } catch (e) {}
      }, 5000);

      proc.on('close', () => {
        clearTimeout(finishTimeout);

        if (tempPath && fs.existsSync(tempPath) && finalStagedPath) {
          try {
            execSync(`"${ffmpegBinary}" -y -i "${tempPath}" -c copy -movflags +faststart "${finalStagedPath}"`, {
              windowsHide: true,
              stdio: 'ignore'
            });
            try { fs.unlinkSync(tempPath); } catch (e) {}
          } catch (err) {
            console.warn('[FFmpegEngine] Faststart remux failed, renaming directly:', err);
            try { fs.renameSync(tempPath, finalStagedPath); } catch (e) {}
          }

          if (fs.existsSync(finalStagedPath)) {
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

            resolve(stagedItem);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }
}
