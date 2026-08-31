import { spawn, ChildProcessWithoutNullStreams, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { app, screen } from 'electron';
import { EncoderChoice, RecorderSettings, RecordingItem, SystemHardwareInfo, RegionBounds } from '../../shared/types';

export class FFmpegRecorder {
  private ffmpegProcess: ChildProcessWithoutNullStreams | null = null;
  private currentTempPath: string | null = null;
  private currentFinalPath: string | null = null;
  private startTime: number = 0;
  private lastResumeTime: number = 0;
  private activeDurationMs: number = 0;
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private detectedHardware: SystemHardwareInfo | null = null;
  private resolvedFFmpegPath: string = 'ffmpeg';

  constructor() {
    this.resolvedFFmpegPath = this.getFFmpegBinaryPath();
    this.detectHardware();
    this.registerProcessCleanup();
  }

  public getFFmpegBinaryPath(): string {
    const candidates = [
      // Production packaged electron extraResources
      path.join(process.resourcesPath, 'bin', 'win64', 'ffmpeg.exe'),
      path.join(process.resourcesPath, 'bin', 'ffmpeg.exe'),
      path.join(process.resourcesPath, 'ffmpeg.exe'),
      // Local development paths
      path.join(app.getAppPath(), 'bin', 'win64', 'ffmpeg.exe'),
      path.join(__dirname, '../../../../bin/win64/ffmpeg.exe'),
      path.join(__dirname, '../../../bin/win64/ffmpeg.exe'),
      path.join(process.cwd(), 'bin', 'win64', 'ffmpeg.exe')
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return 'ffmpeg';
  }

  public getHardwareInfo(): SystemHardwareInfo {
    if (!this.detectedHardware) {
      this.detectHardware();
    }
    return this.detectedHardware!;
  }

  private detectHardware(): void {
    let hasNvidia = false;
    let hasAmd = false;
    let hasIntel = false;
    let ffmpegFound = false;
    const ffmpegPath = this.resolvedFFmpegPath;

    try {
      const output = execSync(`"${ffmpegPath}" -encoders`, {
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf-8',
        windowsHide: true
      });
      ffmpegFound = true;
      if (output.includes('h264_nvenc')) hasNvidia = true;
      if (output.includes('h264_amf')) hasAmd = true;
      if (output.includes('h264_qsv')) hasIntel = true;
    } catch (err) {
      console.warn('FFmpeg detection check:', err);
    }

    let recommended: EncoderChoice = 'x264';
    if (hasNvidia) recommended = 'nvenc';
    else if (hasAmd) recommended = 'amf';
    else if (hasIntel) recommended = 'qsv';

    this.detectedHardware = {
      hasNvidia,
      hasAmd,
      hasIntel,
      recommendedEncoder: recommended,
      ffmpegFound,
      ffmpegPath
    };
  }

  private getEncoderArgs(choice: EncoderChoice): string[] {
    const hw = this.getHardwareInfo();
    let selected = choice;
    if (selected === 'auto') {
      selected = hw.recommendedEncoder;
    }

    switch (selected) {
      case 'nvenc':
        if (hw.hasNvidia) {
          return ['-c:v', 'h264_nvenc', '-preset', 'p4', '-tune', 'hq', '-rc', 'vbr', '-cq', '19', '-b:v', '8M', '-maxrate', '16M'];
        }
        break;
      case 'amf':
        if (hw.hasAmd) {
          return ['-c:v', 'h264_amf', '-quality', 'quality', '-rc', 'cbr', '-b:v', '8M'];
        }
        break;
      case 'qsv':
        if (hw.hasIntel) {
          return ['-c:v', 'h264_qsv', '-preset', 'veryfast', '-global_quality', '20'];
        }
        break;
      default:
        break;
    }

    // Default high-performance software fallback with clean BT.709 colors
    return ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19'];
  }

  public async startRecording(
    settings: RecorderSettings,
    cropBounds?: RegionBounds | null
  ): Promise<{ success: boolean; filePath: string }> {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Reco_${timestamp}.mp4`;
    const finalDir = settings.outputPath || path.join(app.getPath('videos'), 'Reco');

    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    this.currentFinalPath = path.join(finalDir, fileName);
    this.currentTempPath = path.join(finalDir, `temp_${fileName}`);

    const encoderArgs = this.getEncoderArgs(settings.encoder);
    const targetFps = settings.framerate || 60;

    // Construct Video Filter: Clamped Region Crop + Even dimensions + Standard BT.709 sRGB Color Matrix
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

        if (cx + cw > screenW) {
          cw = screenW - cx;
        }
        if (cy + ch > screenH) {
          ch = screenH - cy;
        }

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
      // Color consistency flags (prevent over-brightness/gamma mismatch)
      '-colorspace', 'bt709',
      '-color_primaries', 'bt709',
      '-color_trc', 'bt709',
      '-color_range', 'tv',
      // Pristine 48kHz audio encoding
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '48000',
      // Fragmented MP4 for instant crash resilience
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
      this.currentTempPath
    ];

    console.log(`Spawning FFmpeg (${this.resolvedFFmpegPath}) with args:`, args.join(' '));

    this.ffmpegProcess = spawn(this.resolvedFFmpegPath, args, {
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
      console.error('FFmpeg process error:', err);
    });

    this.ffmpegProcess.on('close', (code) => {
      console.log(`FFmpeg process exited with code ${code}`);
      this.isRecording = false;
      this.isPaused = false;
    });

    return {
      success: true,
      filePath: this.currentFinalPath
    };
  }

  public writeChunk(chunk: Buffer): void {
    if (this.isRecording && !this.isPaused && this.ffmpegProcess && this.ffmpegProcess.stdin.writable) {
      try {
        this.ffmpegProcess.stdin.write(chunk);
      } catch (err) {
        console.error('Error writing chunk to FFmpeg stdin:', err);
      }
    }
  }

  public pauseRecording(): void {
    if (this.isRecording && !this.isPaused) {
      this.activeDurationMs += (Date.now() - this.lastResumeTime);
      this.isPaused = true;
      console.log(`Recording paused. Accumulated active duration: ${this.activeDurationMs}ms`);
    }
  }

  public resumeRecording(): void {
    if (this.isRecording && this.isPaused) {
      this.lastResumeTime = Date.now();
      this.isPaused = false;
      console.log('Recording resumed.');
    }
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public async stopRecording(): Promise<RecordingItem | null> {
    if (!this.isRecording && !this.ffmpegProcess) {
      return null;
    }

    if (!this.isPaused) {
      this.activeDurationMs += (Date.now() - this.lastResumeTime);
    }

    const duration = Math.max(1, Math.round(this.activeDurationMs / 1000));
    const tempPath = this.currentTempPath;
    const finalPath = this.currentFinalPath;
    const ffmpegBinary = this.resolvedFFmpegPath;

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

      // Close stdin so FFmpeg completes cleanly
      try {
        proc.stdin.end();
      } catch (err) {
        console.warn('Error ending stdin:', err);
      }

      const finishTimeout = setTimeout(() => {
        try {
          proc.kill('SIGINT');
        } catch (e) {}
      }, 5000);

      proc.on('close', () => {
        clearTimeout(finishTimeout);

        if (tempPath && fs.existsSync(tempPath) && finalPath) {
          try {
            // Remux to faststart finalized MP4
            execSync(`"${ffmpegBinary}" -y -i "${tempPath}" -c copy -movflags +faststart "${finalPath}"`, {
              windowsHide: true,
              stdio: 'ignore'
            });
            // Clean up temp file
            try {
              fs.unlinkSync(tempPath);
            } catch (e) {}
          } catch (err) {
            console.warn('Faststart remux failed, renaming temp file directly:', err);
            fs.renameSync(tempPath, finalPath);
          }

          const stats = fs.statSync(finalPath);
          const recordingItem: RecordingItem = {
            id: `rec_${Date.now()}`,
            filePath: finalPath,
            fileName: path.basename(finalPath),
            duration,
            fileSize: stats.size,
            timestamp: Date.now(),
            resolution: 'Custom Region',
            fps: 60
          };

          resolve(recordingItem);
        } else {
          resolve(null);
        }
      });
    });
  }

  private registerProcessCleanup(): void {
    const killChild = () => {
      if (this.ffmpegProcess) {
        try {
          this.ffmpegProcess.kill('SIGKILL');
        } catch (e) {}
        this.ffmpegProcess = null;
      }
    };

    app.on('before-quit', killChild);
    process.on('exit', killChild);
    process.on('SIGINT', killChild);
    process.on('SIGTERM', killChild);
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception in main process:', err);
      killChild();
    });
  }
}
