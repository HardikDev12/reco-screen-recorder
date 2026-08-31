import { BrowserWindow, screen, ipcMain, app } from 'electron';
import path from 'node:path';

export class WindowManager {
  private overlayWindow: BrowserWindow | null = null;
  private dashboardWindow: BrowserWindow | null = null;
  private webcamWindow: BrowserWindow | null = null;

  public createRecordingOverlayWindow(): BrowserWindow {
    if (this.overlayWindow) {
      this.overlayWindow.show();
      this.overlayWindow.focus();
      return this.overlayWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;

    this.overlayWindow = new BrowserWindow({
      width,
      height,
      x: 0,
      y: 0,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      fullscreen: false,
      resizable: false,
      skipTaskbar: false,
      title: 'Reco Screen Recorder',
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false
      }
    });

    // Exclude Reco's overlay and toolbars from screen capture (Windows DWM WDA_EXCLUDEFROMCAPTURE)
    try {
      this.overlayWindow.setContentProtection(true);
    } catch (err) {
      console.warn('setContentProtection failed on overlay window:', err);
    }

    if (process.env.VITE_DEV_SERVER_URL) {
      this.overlayWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/overlay.html`);
    } else {
      this.overlayWindow.loadFile(path.join(__dirname, '../../dist/overlay.html'));
    }

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
      this.closeAllAuxiliaryWindows();
      app.quit();
    });

    return this.overlayWindow;
  }

  public getOverlayWindow(): BrowserWindow | null {
    return this.overlayWindow;
  }

  public openDashboardWindow(view: 'library' | 'settings' = 'library'): BrowserWindow {
    if (this.dashboardWindow) {
      this.dashboardWindow.show();
      this.dashboardWindow.focus();
      this.dashboardWindow.webContents.send('dashboard:view', view);
      return this.dashboardWindow;
    }

    this.dashboardWindow = new BrowserWindow({
      width: 960,
      height: 640,
      minWidth: 840,
      minHeight: 560,
      title: 'Reco — Settings & Library',
      backgroundColor: '#0d1117',
      frame: true,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      this.dashboardWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/index.html`);
    } else {
      this.dashboardWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    this.dashboardWindow.on('closed', () => {
      this.dashboardWindow = null;
    });

    return this.dashboardWindow;
  }

  public createWebcamOverlay(): BrowserWindow {
    if (this.webcamWindow) {
      this.webcamWindow.show();
      return this.webcamWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    this.webcamWindow = new BrowserWindow({
      width: 280,
      height: 210,
      x: width - 300,
      y: height - 230,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: true,
      minWidth: 160,
      minHeight: 120,
      maxWidth: 640,
      maxHeight: 480,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    try {
      this.webcamWindow.setContentProtection(true);
    } catch (err) {}

    if (process.env.VITE_DEV_SERVER_URL) {
      this.webcamWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/webcam.html`);
    } else {
      this.webcamWindow.loadFile(path.join(__dirname, '../../dist/webcam.html'));
    }

    this.webcamWindow.on('closed', () => {
      this.webcamWindow = null;
    });

    return this.webcamWindow;
  }

  public closeWebcamOverlay(): void {
    if (this.webcamWindow) {
      this.webcamWindow.close();
      this.webcamWindow = null;
    }
  }

  public closeAllAuxiliaryWindows(): void {
    if (this.dashboardWindow) {
      this.dashboardWindow.close();
      this.dashboardWindow = null;
    }
    if (this.webcamWindow) {
      this.webcamWindow.close();
      this.webcamWindow = null;
    }
  }
}
