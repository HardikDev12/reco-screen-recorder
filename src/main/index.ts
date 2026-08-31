import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { WindowManager } from './windows/windowManager';
import { SourceManager } from './capture/sourceManager';
import { FFmpegRecorder } from './ffmpeg/recorder';
import { RecordingsStore } from './storage/recordingsStore';
import { RecorderSettings, RegionBounds } from '../shared/types';

// Fix Chromium SharedImage / Skia mailbox error on Windows
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,SharedImageMailbox');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('force-color-profile', 'srgb');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  const windowManager = new WindowManager();
  const sourceManager = new SourceManager();
  const ffmpegRecorder = new FFmpegRecorder();
  const recordingsStore = new RecordingsStore();

  app.on('second-instance', () => {
    const overlay = windowManager.getOverlayWindow();
    if (overlay) {
      if (overlay.isMinimized()) overlay.restore();
      overlay.focus();
    }
  });

  app.whenReady().then(() => {
    // Primary Launch: Transparent Recording Overlay directly over user desktop
    windowManager.createRecordingOverlayWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.createRecordingOverlayWindow();
      }
    });
  });

  // --- IPC Handlers ---

  // Mouse Pass-Through to Desktop Apps
  ipcMain.on('overlay:set-ignore-mouse', (_event, ignore: boolean) => {
    const overlay = windowManager.getOverlayWindow();
    if (overlay && !overlay.isDestroyed()) {
      overlay.setIgnoreMouseEvents(ignore, { forward: true });
    }
  });

  // Source Enumeration
  ipcMain.handle('capture:get-sources', async () => {
    return await sourceManager.getAvailableSources();
  });

  // Open Dashboard (Library / Settings)
  ipcMain.on('app:open-dashboard', (_event, view: 'library' | 'settings') => {
    windowManager.openDashboardWindow(view);
  });

  // Minimize / Exit
  ipcMain.on('app:minimize', () => {
    const overlay = windowManager.getOverlayWindow();
    if (overlay) overlay.minimize();
  });

  ipcMain.on('app:quit', () => {
    app.quit();
  });

  // Settings
  ipcMain.handle('settings:get', () => {
    return recordingsStore.getSettings();
  });

  ipcMain.handle('settings:save', (_event, newSettings: Partial<RecorderSettings>) => {
    return recordingsStore.saveSettings(newSettings);
  });

  ipcMain.handle('settings:select-directory', async () => {
    const overlay = windowManager.getOverlayWindow();
    const result = await dialog.showOpenDialog(overlay || (undefined as any), {
      properties: ['openDirectory', 'createDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Hardware Info
  ipcMain.handle('system:get-hardware-info', () => {
    return ffmpegRecorder.getHardwareInfo();
  });

  // Recording Lifecycle with Dynamic Region Crop
  ipcMain.handle(
    'recording:start',
    async (_event, settings: RecorderSettings, bounds?: RegionBounds | null) => {
      return await ffmpegRecorder.startRecording(settings, bounds);
    }
  );

  ipcMain.on('recording:chunk', (_event, chunkBuffer: Uint8Array) => {
    ffmpegRecorder.writeChunk(Buffer.from(chunkBuffer));
  });

  ipcMain.handle('recording:pause', () => {
    ffmpegRecorder.pauseRecording();
    return { success: true };
  });

  ipcMain.handle('recording:resume', () => {
    ffmpegRecorder.resumeRecording();
    return { success: true };
  });

  ipcMain.handle('recording:stop', async () => {
    const item = await ffmpegRecorder.stopRecording();
    if (item) {
      recordingsStore.addRecording(item);
    }

    const overlay = windowManager.getOverlayWindow();
    if (overlay) {
      overlay.webContents.send('recording:completed', item);
    }

    return item;
  });

  // History & File Actions
  ipcMain.handle('recordings:get-all', () => {
    return recordingsStore.getRecordings();
  });

  ipcMain.handle('recordings:delete', (_event, id: string) => {
    return recordingsStore.deleteRecording(id);
  });

  ipcMain.handle('recordings:open-in-folder', (_event, filePath: string) => {
    recordingsStore.openRecordingInFolder(filePath);
  });

  ipcMain.handle('recordings:play', (_event, filePath: string) => {
    recordingsStore.playRecording(filePath);
  });

  // Webcam Overlay
  ipcMain.on('webcam:toggle', (_event, show: boolean) => {
    if (show) {
      windowManager.createWebcamOverlay();
    } else {
      windowManager.closeWebcamOverlay();
    }
  });
}
