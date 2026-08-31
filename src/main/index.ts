import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { WindowManager } from './windows/windowManager';
import { SourceManager } from './capture/sourceManager';
import { FFmpegRecorder } from './ffmpeg/recorder';
import { RecordingsStore } from './storage/recordingsStore';
import { RecorderSettings, RegionBounds } from '../shared/types';

// Fix Chromium GPU / Skia mailbox error on Windows
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
    const frame = windowManager.getFrameWindow();
    const toolbar = windowManager.getToolbarWindow();
    if (frame) {
      if (frame.isMinimized()) frame.restore();
      frame.focus();
    }
    if (toolbar) {
      if (toolbar.isMinimized()) toolbar.restore();
      toolbar.focus();
    }
  });

  app.whenReady().then(() => {
    // Launch Independent Frame & Toolbar Windows
    windowManager.launchRecordingMode();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.launchRecordingMode();
      }
    });
  });

  // --- IPC Handlers ---

  // Frame Bounds Management
  ipcMain.handle('frame:get-bounds', () => {
    return windowManager.getCurrentFrameBounds();
  });

  ipcMain.on('frame:set-fullscreen', () => {
    windowManager.setFrameFullScreen();
  });

  // Open Dashboard (Library / Settings)
  ipcMain.on('app:open-dashboard', (_event, view: 'library' | 'settings') => {
    windowManager.openDashboardWindow(view);
  });

  // Minimize / Exit
  ipcMain.on('app:minimize', () => {
    const toolbar = windowManager.getToolbarWindow();
    const frame = windowManager.getFrameWindow();
    if (toolbar) toolbar.minimize();
    if (frame) frame.minimize();
  });

  ipcMain.on('app:quit', () => {
    app.quit();
  });

  // Source Enumeration
  ipcMain.handle('capture:get-sources', async () => {
    return await sourceManager.getAvailableSources();
  });

  // Settings
  ipcMain.handle('settings:get', () => {
    return recordingsStore.getSettings();
  });

  ipcMain.handle('settings:save', (_event, newSettings: Partial<RecorderSettings>) => {
    return recordingsStore.saveSettings(newSettings);
  });

  ipcMain.handle('settings:select-directory', async () => {
    const toolbar = windowManager.getToolbarWindow();
    const result = await dialog.showOpenDialog(toolbar || (undefined as any), {
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

  // Recording Execution with Frame Coordinates
  ipcMain.handle('recording:start', async (_event, settings: RecorderSettings) => {
    const frameBounds = windowManager.getCurrentFrameBounds();
    const result = await ffmpegRecorder.startRecording(settings, frameBounds);

    const frame = windowManager.getFrameWindow();
    if (frame) frame.webContents.send('recording:state-changed', { status: 'recording' });

    return result;
  });

  ipcMain.on('recording:chunk', (_event, chunkBuffer: Uint8Array) => {
    ffmpegRecorder.writeChunk(Buffer.from(chunkBuffer));
  });

  ipcMain.handle('recording:pause', () => {
    ffmpegRecorder.pauseRecording();
    const frame = windowManager.getFrameWindow();
    if (frame) frame.webContents.send('recording:state-changed', { status: 'paused' });
    return { success: true };
  });

  ipcMain.handle('recording:resume', () => {
    ffmpegRecorder.resumeRecording();
    const frame = windowManager.getFrameWindow();
    if (frame) frame.webContents.send('recording:state-changed', { status: 'recording' });
    return { success: true };
  });

  ipcMain.handle('recording:stop', async () => {
    const item = await ffmpegRecorder.stopRecording();
    if (item) {
      recordingsStore.addRecording(item);
    }

    const frame = windowManager.getFrameWindow();
    const toolbar = windowManager.getToolbarWindow();
    if (frame) frame.webContents.send('recording:state-changed', { status: 'idle' });
    if (toolbar) toolbar.webContents.send('recording:completed', item);

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
