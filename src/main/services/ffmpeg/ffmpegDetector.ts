import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { FFmpegDependencyInfo, FFmpegSource } from '../../../shared/types';
import { FFMPEG_CONFIG } from './ffmpegConfig';

export class FFmpegDetector {
  private cachedInfo: FFmpegDependencyInfo | null = null;
  private lastCheckTime: number = 0;
  private readonly CACHE_TTL_MS = 10000; // 10s cache

  public detect(forceRefresh: boolean = false): FFmpegDependencyInfo {
    const now = Date.now();
    if (!forceRefresh && this.cachedInfo && (now - this.lastCheckTime < this.CACHE_TTL_MS)) {
      return this.cachedInfo;
    }

    // 1. Priority 1: RECO Managed FFmpeg in %LOCALAPPDATA%
    const managedPath = FFMPEG_CONFIG.getManagedExePath();
    if (fs.existsSync(managedPath)) {
      const info = this.validateAndExtractInfo(managedPath, 'managed');
      if (info.installed) {
        this.cachedInfo = info;
        this.lastCheckTime = now;
        return info;
      }
    }

    // 2. Priority 2: System Installed FFmpeg (PATH / where.exe)
    const systemPath = this.findSystemFFmpeg();
    if (systemPath) {
      const info = this.validateAndExtractInfo(systemPath, 'system');
      if (info.installed) {
        this.cachedInfo = info;
        this.lastCheckTime = now;
        return info;
      }
    }

    // 3. Priority 3: Bundled binary (fallback reference during migration)
    const bundledPath = this.findBundledFFmpeg();
    if (bundledPath) {
      const info = this.validateAndExtractInfo(bundledPath, 'bundled');
      if (info.installed) {
        this.cachedInfo = info;
        this.lastCheckTime = now;
        return info;
      }
    }

    // No FFmpeg found
    const noneInfo: FFmpegDependencyInfo = {
      installed: false,
      source: 'none',
      capabilities: {
        hasNvidia: false,
        hasAmd: false,
        hasIntel: false,
        hasLibx264: false,
        hasAac: false
      }
    };

    this.cachedInfo = noneInfo;
    this.lastCheckTime = now;
    return noneInfo;
  }

  private findSystemFFmpeg(): string | null {
    try {
      // Use Windows where.exe to safely lookup ffmpeg on PATH
      const output = execSync('where.exe ffmpeg', {
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf-8',
        windowsHide: true,
        timeout: 3000
      }).trim();

      const lines = output.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      for (const line of lines) {
        // Skip RECO managed path if it happens to be in output
        if (line.toLowerCase().includes('reco\\dependencies')) continue;
        if (fs.existsSync(line)) {
          return line;
        }
      }
    } catch (e) {
      // where.exe exits with code 1 if not found
    }

    // Check common manual system installation paths
    const commonPaths = [
      'C:\\ffmpeg\\bin\\ffmpeg.exe',
      'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
      path.join(process.env.USERPROFILE || '', 'scoop', 'shims', 'ffmpeg.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe')
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return null;
  }

  private findBundledFFmpeg(): string | null {
    const candidates = [
      path.join(process.resourcesPath, 'bin', 'win64', 'ffmpeg.exe'),
      path.join(process.resourcesPath, 'bin', 'ffmpeg.exe'),
      path.join(app.getAppPath(), 'bin', 'win64', 'ffmpeg.exe'),
      path.join(process.cwd(), 'bin', 'win64', 'ffmpeg.exe')
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private validateAndExtractInfo(exePath: string, source: FFmpegSource): FFmpegDependencyInfo {
    try {
      // 1. Run ffmpeg -version
      const versionOutput = execSync(`"${exePath}" -version`, {
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf-8',
        windowsHide: true,
        timeout: 4000
      });

      const firstLine = versionOutput.split(/\r?\n/)[0] || '';
      const versionMatch = firstLine.match(/ffmpeg version ([^\s]+)/i);
      const version = versionMatch ? versionMatch[1] : 'Unknown';

      // 2. Run ffmpeg -encoders
      const encodersOutput = execSync(`"${exePath}" -encoders`, {
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf-8',
        windowsHide: true,
        timeout: 4000
      });

      const hasNvidia = encodersOutput.includes('h264_nvenc');
      const hasAmd = encodersOutput.includes('h264_amf');
      const hasIntel = encodersOutput.includes('h264_qsv');
      const hasLibx264 = encodersOutput.includes('libx264');
      const hasAac = encodersOutput.includes('aac');

      return {
        installed: true,
        source,
        version,
        path: exePath,
        capabilities: {
          hasNvidia,
          hasAmd,
          hasIntel,
          hasLibx264,
          hasAac
        }
      };
    } catch (err) {
      console.warn(`Validation failed for FFmpeg at ${exePath}:`, err);
      return {
        installed: false,
        source: 'none',
        capabilities: {
          hasNvidia: false,
          hasAmd: false,
          hasIntel: false,
          hasLibx264: false,
          hasAac: false
        }
      };
    }
  }
}
