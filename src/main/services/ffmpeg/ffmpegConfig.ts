import { app } from 'electron';
import path from 'node:path';

export const FFMPEG_CONFIG = {
  // GitHub Release configuration
  GITHUB_OWNER: 'HardikDev12',
  GITHUB_REPO: 'reco-screen-recorder',
  RELEASE_TAG: 'v1.0.0-dependencies',
  ASSET_NAME: 'RECO-FFmpeg-Essentials.zip',
  
  // Official fallback source if GitHub Release is being published
  FALLBACK_DIRECT_URL: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
  
  // Version metadata & Pinned SHA-256
  VERSION: '9.0.1-essentials',
  EXPECTED_SHA256: '0d372aa805828ad19d11b7558b87c78aff589ed47254bd9ed0060f9ac34b469a',
  
  // Target Managed Dependency Paths in LocalAppData (per-user, no admin required)
  getManagedBaseDir(): string {
    const localAppData = process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local');
    return path.join(localAppData, 'RECO', 'dependencies', 'ffmpeg');
  },
  
  getManagedCurrentDir(): string {
    return path.join(this.getManagedBaseDir(), 'current');
  },
  
  getManagedExePath(): string {
    return path.join(this.getManagedCurrentDir(), 'ffmpeg.exe');
  },

  getVersionFilePath(): string {
    return path.join(this.getManagedCurrentDir(), 'version.json');
  },

  getTempDownloadDir(): string {
    return path.join(app.getPath('temp'), 'reco-ffmpeg-download');
  },

  getTempExtractDir(): string {
    return path.join(app.getPath('temp'), 'reco-ffmpeg-extract');
  }
};
