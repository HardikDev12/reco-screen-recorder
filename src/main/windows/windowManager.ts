import { BrowserWindow, screen, ipcMain, app } from 'electron';
import path from 'node:path';
import { RegionBounds } from '../../shared/types';

export class WindowManager {
  private frameWindow: BrowserWindow | null = null;
  private toolbarWindow: BrowserWindow | null = null;
  private dashboardWindow: BrowserWindow | null = null;
  private webcamWindow: BrowserWindow | null = null;

  // Track the physical bounds of the recording frame
  private currentFrameBounds: RegionBounds = { x: 100, y: 100, width: 1280, height: 720 };

  public getCurrentFrameBounds(): RegionBounds {
    if (this.frameWindow && !this.frameWindow.isDestroyed()) {
      const b = this.frameWindow.getBounds();
      this.currentFrameBounds = { x: b.x, y: b.y, width: b.width, height: b.height };
    }
    return this.currentFrameBounds;
  }

  public launchRecordingMode(): void {
    this.createRecordingFrameWindow();
    this.createFloatingToolbarWindow();
  }

  private hardenWindowSecurity(win: BrowserWindow): void {
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith('file:') && !url.startsWith('http://localhost:')) {
        event.preventDefault();
      }
    });
  }

  // 1. Independent Recording Frame Window
  public createRecordingFrameWindow(): BrowserWindow {
    if (this.frameWindow) {
      this.frameWindow.show();
      return this.frameWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const frameW = Math.min(1280, Math.round(width * 0.75));
    const frameH = Math.min(720, Math.round(height * 0.75));
    const frameX = Math.round((width - frameW) / 2);
    const frameY = Math.round((height - frameH) / 2 - 30);

    this.currentFrameBounds = { x: frameX, y: frameY, width: frameW, height: frameH };

    const appIcon = path.join(__dirname, '../../asset/icon.png');

    this.frameWindow = new BrowserWindow({
      width: frameW,
      height: frameH,
      x: frameX,
      y: frameY,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: true,
      minWidth: 240,
      minHeight: 180,
      hasShadow: false,
      skipTaskbar: true,
      icon: appIcon,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false
      }
    });

    this.hardenWindowSecurity(this.frameWindow);

    try {
      this.frameWindow.setContentProtection(true);
    } catch (err) {}

    this.frameWindow.on('move', () => {
      if (this.frameWindow && !this.frameWindow.isDestroyed()) {
        const b = this.frameWindow.getBounds();
        this.currentFrameBounds = { x: b.x, y: b.y, width: b.width, height: b.height };
        this.frameWindow.webContents.send('frame:bounds-updated', this.currentFrameBounds);
      }
    });

    this.frameWindow.on('resize', () => {
      if (this.frameWindow && !this.frameWindow.isDestroyed()) {
        const b = this.frameWindow.getBounds();
        this.currentFrameBounds = { x: b.x, y: b.y, width: b.width, height: b.height };
        this.frameWindow.webContents.send('frame:bounds-updated', this.currentFrameBounds);
      }
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      this.frameWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/frame.html`);
    } else {
      this.frameWindow.loadFile(path.join(__dirname, '../../dist/frame.html'));
    }

    this.frameWindow.on('closed', () => {
      this.frameWindow = null;
    });

    return this.frameWindow;
  }

  // 2. Compact Floating Control Toolbar Window
  public createFloatingToolbarWindow(): BrowserWindow {
    if (this.toolbarWindow) {
      this.toolbarWindow.show();
      return this.toolbarWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const toolbarW = 840;
    const toolbarH = 68;
    const appIcon = path.join(__dirname, '../../asset/icon.png');

    this.toolbarWindow = new BrowserWindow({
      width: toolbarW,
      height: toolbarH,
      x: Math.round(width / 2 - toolbarW / 2),
      y: height - toolbarH - 24,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      hasShadow: false,
      skipTaskbar: false,
      icon: appIcon,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.hardenWindowSecurity(this.toolbarWindow);

    try {
      this.toolbarWindow.setContentProtection(true);
    } catch (err) {}

    if (process.env.VITE_DEV_SERVER_URL) {
      this.toolbarWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/toolbar.html`);
    } else {
      this.toolbarWindow.loadFile(path.join(__dirname, '../../dist/toolbar.html'));
    }

    this.toolbarWindow.on('closed', () => {
      this.toolbarWindow = null;
      app.quit();
    });

    return this.toolbarWindow;
  }

  public getFrameWindow(): BrowserWindow | null {
    return this.frameWindow;
  }

  public getToolbarWindow(): BrowserWindow | null {
    return this.toolbarWindow;
  }

  public setFrameFullScreen(): void {
    if (this.frameWindow && !this.frameWindow.isDestroyed()) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { x, y, width, height } = primaryDisplay.bounds;
      this.frameWindow.setBounds({ x, y, width, height });
    }
  }

  public openDashboardWindow(view: 'library' | 'settings' = 'library'): BrowserWindow {
    if (this.dashboardWindow) {
      this.dashboardWindow.show();
      this.dashboardWindow.focus();
      this.dashboardWindow.webContents.send('dashboard:view', view);
      return this.dashboardWindow;
    }

    const appIcon = path.join(__dirname, '../../asset/icon.png');

    this.dashboardWindow = new BrowserWindow({
      width: 960,
      height: 640,
      minWidth: 840,
      minHeight: 560,
      title: 'Reco — Settings & Library',
      backgroundColor: '#0d1117',
      frame: true,
      autoHideMenuBar: true,
      icon: appIcon,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.hardenWindowSecurity(this.dashboardWindow);

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
    const appIcon = path.join(__dirname, '../../asset/icon.png');

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
      icon: appIcon,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    this.hardenWindowSecurity(this.webcamWindow);

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
    if (this.frameWindow) {
      this.frameWindow.close();
      this.frameWindow = null;
    }
    if (this.toolbarWindow) {
      this.toolbarWindow.close();
      this.toolbarWindow = null;
    }
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
