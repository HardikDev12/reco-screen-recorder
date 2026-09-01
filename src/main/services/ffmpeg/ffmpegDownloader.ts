import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { exec, execSync, ChildProcess } from 'node:child_process';
import { FFmpegDownloadProgress } from '../../../shared/types';
import { FFMPEG_CONFIG } from './ffmpegConfig';

export class FFmpegDownloader {
  private activeDownloadRequest: http.ClientRequest | null = null;
  private activeExecProcess: ChildProcess | null = null;
  private isCancelled: boolean = false;
  private isDownloading: boolean = false;

  public getIsDownloading(): boolean {
    return this.isDownloading;
  }

  public async downloadAndInstall(
    onProgress?: (progress: FFmpegDownloadProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    if (this.isDownloading) {
      return { success: false, error: 'A download is already in progress.' };
    }

    this.isDownloading = true;
    this.isCancelled = false;

    const tempDownloadDir = FFMPEG_CONFIG.getTempDownloadDir();
    const tempExtractDir = FFMPEG_CONFIG.getTempExtractDir();
    const zipPath = path.join(tempDownloadDir, 'ffmpeg_download.zip');

    try {
      // 1. Clean and ensure temp dirs
      this.cleanDir(tempDownloadDir);
      this.cleanDir(tempExtractDir);
      fs.mkdirSync(tempDownloadDir, { recursive: true });
      fs.mkdirSync(tempExtractDir, { recursive: true });

      // 2. Determine download URL
      // Direct GitHub Release asset URL or verified fallback URL
      const githubUrl = `https://github.com/${FFMPEG_CONFIG.GITHUB_OWNER}/${FFMPEG_CONFIG.GITHUB_REPO}/releases/download/${FFMPEG_CONFIG.RELEASE_TAG}/${FFMPEG_CONFIG.ASSET_NAME}`;
      const downloadUrl = FFMPEG_CONFIG.FALLBACK_DIRECT_URL || githubUrl;

      // 3. Download Archive with real-time progress
      onProgress?.({
        status: 'downloading',
        percent: 0,
        downloadedBytes: 0,
        totalBytes: 0
      });

      await this.downloadFile(downloadUrl, zipPath, (downloaded, total) => {
        if (this.isCancelled) return;
        const percent = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
        onProgress?.({
          status: 'downloading',
          percent,
          downloadedBytes: downloaded,
          totalBytes: total
        });
      });

      if (this.isCancelled) {
        this.cleanup(tempDownloadDir, tempExtractDir);
        return { success: false, error: 'Download was cancelled.' };
      }

      // 4. Verifying & Extracting
      onProgress?.({
        status: 'verifying',
        percent: 100,
        downloadedBytes: fs.statSync(zipPath).size,
        totalBytes: fs.statSync(zipPath).size
      });

      onProgress?.({
        status: 'extracting',
        percent: 100,
        downloadedBytes: fs.statSync(zipPath).size,
        totalBytes: fs.statSync(zipPath).size
      });

      // Extract archive using PowerShell Expand-Archive
      await this.extractArchive(zipPath, tempExtractDir);

      if (this.isCancelled) {
        this.cleanup(tempDownloadDir, tempExtractDir);
        return { success: false, error: 'Download was cancelled.' };
      }

      // 5. Locate ffmpeg.exe in extracted folder
      const foundExe = this.findFileRecursive(tempExtractDir, 'ffmpeg.exe');
      if (!foundExe || !fs.existsSync(foundExe)) {
        throw new Error('ffmpeg.exe was not found inside the downloaded archive.');
      }

      // 6. Validate ffmpeg.exe execution
      try {
        execSync(`"${foundExe}" -version`, {
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 4000,
          windowsHide: true
        });
      } catch (valErr) {
        throw new Error('Downloaded ffmpeg.exe failed execution verification test.');
      }

      // 7. Atomic Install into %LOCALAPPDATA%\RECO\dependencies\ffmpeg\current\
      const managedCurrentDir = FFMPEG_CONFIG.getManagedCurrentDir();
      fs.mkdirSync(managedCurrentDir, { recursive: true });

      const targetExePath = FFMPEG_CONFIG.getManagedExePath();
      const targetVersionPath = FFMPEG_CONFIG.getVersionFilePath();

      // Copy verified binary
      fs.copyFileSync(foundExe, targetExePath);

      // Write version metadata
      const versionMetadata = {
        version: FFMPEG_CONFIG.VERSION,
        installedAt: new Date().toISOString(),
        source: 'RECO GitHub Release',
        asset: FFMPEG_CONFIG.ASSET_NAME
      };
      fs.writeFileSync(targetVersionPath, JSON.stringify(versionMetadata, null, 2), 'utf-8');

      // 8. Cleanup temp files
      this.cleanup(tempDownloadDir, tempExtractDir);

      onProgress?.({
        status: 'completed',
        percent: 100,
        downloadedBytes: 0,
        totalBytes: 0
      });

      this.isDownloading = false;
      return { success: true };
    } catch (err: any) {
      this.cleanup(tempDownloadDir, tempExtractDir);
      this.isDownloading = false;
      const errorMsg = err?.message || String(err);
      onProgress?.({
        status: 'error',
        percent: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        error: errorMsg
      });
      return { success: false, error: errorMsg };
    }
  }

  public cancel(): void {
    this.isCancelled = true;
    if (this.activeDownloadRequest) {
      try {
        this.activeDownloadRequest.destroy();
      } catch (e) {}
      this.activeDownloadRequest = null;
    }
    if (this.activeExecProcess) {
      try {
        this.activeExecProcess.kill('SIGKILL');
      } catch (e) {}
      this.activeExecProcess = null;
    }
    this.cleanup(FFMPEG_CONFIG.getTempDownloadDir(), FFMPEG_CONFIG.getTempExtractDir());
    this.isDownloading = false;
  }

  public async remove(): Promise<boolean> {
    try {
      const managedBaseDir = FFMPEG_CONFIG.getManagedBaseDir();
      if (fs.existsSync(managedBaseDir)) {
        fs.rmSync(managedBaseDir, { recursive: true, force: true });
      }
      return true;
    } catch (e) {
      console.error('Failed to remove managed FFmpeg:', e);
      return false;
    }
  }

  private downloadFile(
    urlStr: string,
    destPath: string,
    onProgress: (downloaded: number, total: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const handleRequest = (currentUrl: string, redirectCount = 0) => {
        if (redirectCount > 5) {
          return reject(new Error('Too many redirects while downloading FFmpeg.'));
        }

        const isHttps = currentUrl.startsWith('https://');
        const client = isHttps ? https : http;

        const req = client.get(currentUrl, { headers: { 'User-Agent': 'RECO-Screen-Recorder' } }, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextUrl = res.headers.location;
            if (!nextUrl.startsWith('http')) {
              const urlObj = new URL(currentUrl);
              nextUrl = new URL(nextUrl, urlObj.origin).href;
            }
            return handleRequest(nextUrl, redirectCount + 1);
          }

          if (res.statusCode !== 200) {
            return reject(new Error(`Server returned HTTP ${res.statusCode} ${res.statusMessage || ''}`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let downloadedBytes = 0;

          const fileStream = fs.createWriteStream(destPath);

          res.on('data', (chunk) => {
            if (this.isCancelled) {
              req.destroy();
              fileStream.close();
              return;
            }
            downloadedBytes += chunk.length;
            onProgress(downloadedBytes, totalBytes);
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => {
              if (this.isCancelled) {
                reject(new Error('Download cancelled by user.'));
              } else {
                resolve();
              }
            });
          });

          fileStream.on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
          });
        });

        req.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });

        this.activeDownloadRequest = req;
      };

      handleRequest(urlStr);
    });
  }

  private extractArchive(zipPath: string, destinationDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const escapedZip = zipPath.replace(/'/g, "''");
      const escapedDest = destinationDir.replace(/'/g, "''");
      const cmd = `powershell -Command "Expand-Archive -Path '${escapedZip}' -DestinationPath '${escapedDest}' -Force"`;

      const proc = exec(cmd, { windowsHide: true }, (error) => {
        this.activeExecProcess = null;
        if (error) {
          reject(new Error(`Failed to extract archive: ${error.message}`));
        } else {
          resolve();
        }
      });

      this.activeExecProcess = proc;
    });
  }

  private findFileRecursive(dir: string, targetName: string): string | null {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = this.findFileRecursive(fullPath, targetName);
        if (found) return found;
      } else if (entry.isFile() && entry.name.toLowerCase() === targetName.toLowerCase()) {
        return fullPath;
      }
    }
    return null;
  }

  private cleanDir(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (e) {}
  }

  private cleanup(tempDownload: string, tempExtract: string): void {
    this.cleanDir(tempDownload);
    this.cleanDir(tempExtract);
  }
}
