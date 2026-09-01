import { app, BrowserWindow, ipcMain, dialog, globalShortcut, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { WindowManager } from './windows/windowManager';
import { SourceManager } from './capture/sourceManager';
import { EngineManager } from './services/engine/engineManager';
import { RecordingsStore } from './storage/recordingsStore';
import { RecorderSettings, RegionBounds, RecordingItem, EngineChoice, FFmpegDownloadProgress } from '../shared/types';

// Set application identity for Windows Shell and Task Manager
app.name = 'Reco';
app.setName('Reco');
app.setAppUserModelId('com.hardikprajapati.reco');

// Optimize hardware color profile and rasterization for Windows
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('force-color-profile', 'srgb');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  const windowManager = new WindowManager();
  const sourceManager = new SourceManager();
  const engineManager = new EngineManager();
  const recordingsStore = new RecordingsStore();

  app.on('second-instance', () => {
    const frame = windowManager.getFrameWindow();
    const toolbar = windowManager.getToolbarWindow();
    if (toolbar && !toolbar.isDestroyed()) {
      if (toolbar.isMinimized()) toolbar.restore();
      toolbar.show();
      toolbar.focus();
    }
    if (frame && !frame.isDestroyed()) {
      frame.show();
      frame.setAlwaysOnTop(true);
    }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('com.hardikprajapati.reco');

    // Launch Independent Frame & Toolbar Windows
    windowManager.launchRecordingMode();

    // Register global shortcuts
    try {
      // Ctrl+Shift+P (Pause / Resume toggle)
      globalShortcut.register('CommandOrControl+Shift+P', () => {
        if (engineManager.getIsRecording()) {
          const toolbar = windowManager.getToolbarWindow();
          if (toolbar && !toolbar.isDestroyed()) {
            toolbar.webContents.send('recording:toggle-pause');
          }
        }
      });

      // Ctrl+Shift+R (Record / Stop / Confirm GO toggle)
      globalShortcut.register('CommandOrControl+Shift+R', () => {
        const toolbar = windowManager.getToolbarWindow();
        if (toolbar && !toolbar.isDestroyed()) {
          toolbar.webContents.send('recording:toggle-record-shortcut');
        }
      });
    } catch (err) {
      console.warn('Failed to register global shortcuts:', err);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.launchRecordingMode();
      }
    });
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    windowManager.closeAllAuxiliaryWindows();
  });

  // --- Engine & FFmpeg Dependency Handlers ---
  ipcMain.handle('engine:get-info', () => {
    const settings = recordingsStore.getSettings();
    return engineManager.getEngineInfo(settings.recordingEngine || 'auto');
  });

  ipcMain.handle('engine:set-preference', (_event, preference: EngineChoice) => {
    recordingsStore.saveSettings({ recordingEngine: preference });
    return engineManager.getEngineInfo(preference);
  });

  ipcMain.handle('ffmpeg:install', async (event) => {
    return await engineManager.installManagedFFmpeg((progress: FFmpegDownloadProgress) => {
      try {
        event.sender.send('ffmpeg:download-progress', progress);
      } catch (e) {}
    });
  });

  ipcMain.on('ffmpeg:cancel-download', () => {
    engineManager.cancelFFmpegDownload();
  });

  ipcMain.handle('ffmpeg:remove', async () => {
    return await engineManager.removeManagedFFmpeg();
  });

  // --- Countdown & GO Coordination Handlers ---
  ipcMain.on('recording:trigger-countdown', (_event, seconds: number) => {
    const frame = windowManager.getFrameWindow();
    if (frame && !frame.isDestroyed()) {
      frame.webContents.send('recording:trigger-countdown', seconds);
    }
  });

  ipcMain.on('recording:countdown-ready', () => {
    const frame = windowManager.getFrameWindow();
    const toolbar = windowManager.getToolbarWindow();
    if (frame && !frame.isDestroyed()) frame.webContents.send('recording:state-changed', { status: 'ready' });
    if (toolbar && !toolbar.isDestroyed()) toolbar.webContents.send('recording:state-changed', { status: 'ready' });
  });

  ipcMain.on('recording:cancel-countdown', () => {
    const frame = windowManager.getFrameWindow();
    const toolbar = windowManager.getToolbarWindow();
    if (frame && !frame.isDestroyed()) frame.webContents.send('recording:state-changed', { status: 'idle' });
    if (toolbar && !toolbar.isDestroyed()) toolbar.webContents.send('recording:state-changed', { status: 'idle' });
  });

  ipcMain.on('recording:confirm-start', () => {
    const toolbar = windowManager.getToolbarWindow();
    if (toolbar && !toolbar.isDestroyed()) {
      toolbar.webContents.send('recording:confirm-start');
    }
  });

  // --- Preview & Save Handlers ---
  ipcMain.handle('preview:save', async (_event, filePath: string) => {
    const item = recordingsStore.commitTempRecording(filePath);
    windowManager.closePreviewWindow();

    const toolbar = windowManager.getToolbarWindow();
    if (toolbar && !toolbar.isDestroyed()) {
      toolbar.webContents.send('recording:completed', item);
    }
    return item;
  });

  ipcMain.handle('preview:save-as', async (_event, filePath: string) => {
    const previewWin = BrowserWindow.getFocusedWindow();
    const ext = path.extname(filePath) || '.mp4';
    const result = await dialog.showSaveDialog(previewWin || (undefined as any), {
      title: 'Save Recording As',
      defaultPath: path.join(recordingsStore.getSettings().outputPath, path.basename(filePath).replace(/^temp_/, '')),
      filters: [{ name: 'Video Files', extensions: [ext.replace('.', ''), 'mp4', 'mkv', 'webm'] }]
    });

    if (!result.canceled && result.filePath) {
      const item = recordingsStore.commitTempRecording(filePath, result.filePath);
      windowManager.closePreviewWindow();

      const toolbar = windowManager.getToolbarWindow();
      if (toolbar && !toolbar.isDestroyed()) {
        toolbar.webContents.send('recording:completed', item);
      }
      return item;
    }
    return null;
  });

  ipcMain.handle('preview:record-again', async (_event, filePath: string) => {
    recordingsStore.discardTempRecording(filePath);
    windowManager.closePreviewWindow();

    const toolbar = windowManager.getToolbarWindow();
    const frame = windowManager.getFrameWindow();
    if (toolbar && !toolbar.isDestroyed()) {
      toolbar.show();
      toolbar.focus();
    }
    if (frame && !frame.isDestroyed()) {
      frame.show();
      frame.setAlwaysOnTop(true);
    }
  });

  ipcMain.handle('preview:discard', async (_event, filePath: string) => {
    recordingsStore.discardTempRecording(filePath);
    windowManager.closePreviewWindow();
  });

  // --- Frame Bounds Management ---
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
    const frame = windowManager.getFrameWindow();
    const toolbar = windowManager.getToolbarWindow();
    if (frame && !frame.isDestroyed()) frame.hide();
    if (toolbar && !toolbar.isDestroyed()) toolbar.minimize();
  });

  ipcMain.on('app:quit', () => {
    windowManager.closeAllAuxiliaryWindows();
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

  ipcMain.handle('settings:reset-default-location', () => {
    return recordingsStore.resetDefaultOutputPath();
  });

  ipcMain.handle('settings:open-folder', () => {
    const settings = recordingsStore.getSettings();
    if (fs.existsSync(settings.outputPath)) {
      shell.openPath(settings.outputPath);
    }
  });

  // Hardware Info / Capabilities
  ipcMain.handle('system:get-hardware-info', () => {
    const detector = engineManager.getDetector();
    const info = detector.detect();
    let recommended: any = 'x264';
    if (info.capabilities.hasNvidia) recommended = 'nvenc';
    else if (info.capabilities.hasAmd) recommended = 'amf';
    else if (info.capabilities.hasIntel) recommended = 'qsv';

    return {
      hasNvidia: info.capabilities.hasNvidia,
      hasAmd: info.capabilities.hasAmd,
      hasIntel: info.capabilities.hasIntel,
      recommendedEncoder: recommended,
      ffmpegFound: info.installed,
      ffmpegPath: info.path
    };
  });

  // Recording Execution with Unified Engine Architecture
  ipcMain.handle('recording:start', async (_event, settings: RecorderSettings) => {
    const frameBounds = windowManager.getCurrentFrameBounds();
    const result = await engineManager.startRecording(settings, frameBounds);

    const frame = windowManager.getFrameWindow();
    const toolbar = windowManager.getToolbarWindow();
    if (frame && !frame.isDestroyed()) frame.webContents.send('recording:state-changed', { status: 'recording' });
    if (toolbar && !toolbar.isDestroyed()) toolbar.webContents.send('recording:state-changed', { status: 'recording' });

    return result;
  });

  ipcMain.on('recording:chunk', (_event, chunkBuffer: Uint8Array) => {
    engineManager.writeChunk(Buffer.from(chunkBuffer));
  });

  ipcMain.handle('recording:pause', () => {
    engineManager.pauseRecording();
    const frame = windowManager.getFrameWindow();
    const toolbar = windowManager.getToolbarWindow();
    if (frame && !frame.isDestroyed()) frame.webContents.send('recording:state-changed', { status: 'paused' });
    if (toolbar && !toolbar.isDestroyed()) toolbar.webContents.send('recording:state-changed', { status: 'paused' });
    return { success: true };
  });

  ipcMain.handle('recording:resume', () => {
    engineManager.resumeRecording();
    const frame = windowManager.getFrameWindow();
    const toolbar = windowManager.getToolbarWindow();
    if (frame && !frame.isDestroyed()) frame.webContents.send('recording:state-changed', { status: 'recording' });
    if (toolbar && !toolbar.isDestroyed()) toolbar.webContents.send('recording:state-changed', { status: 'recording' });
    return { success: true };
  });

  ipcMain.handle('recording:stop', async () => {
    const stagedItem = await engineManager.stopRecording();

    const frame = windowManager.getFrameWindow();
    const toolbar = windowManager.getToolbarWindow();
    if (frame && !frame.isDestroyed()) frame.webContents.send('recording:state-changed', { status: 'idle' });
    if (toolbar && !toolbar.isDestroyed()) toolbar.webContents.send('recording:state-changed', { status: 'idle' });

    // Open Recording Preview Window
    if (stagedItem) {
      windowManager.createPreviewWindow(stagedItem);
    }

    return stagedItem;
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
