import { contextBridge, ipcRenderer } from 'electron';
import { CaptureSource, RecorderSettings, RecordingItem, RegionBounds, SystemHardwareInfo } from '../shared/types';

export const electronAPI = {
  // Capture Sources & Frame
  getSources: (): Promise<CaptureSource[]> => ipcRenderer.invoke('capture:get-sources'),
  getFrameBounds: (): Promise<RegionBounds> => ipcRenderer.invoke('frame:get-bounds'),
  setFrameFullScreen: () => ipcRenderer.send('frame:set-fullscreen'),

  // Countdown & GO Lifecycle
  triggerCountdown: (seconds: number) => ipcRenderer.send('recording:trigger-countdown', seconds),
  confirmStartRecording: () => ipcRenderer.send('recording:confirm-start'),
  cancelCountdown: () => ipcRenderer.send('recording:cancel-countdown'),
  notifyCountdownReady: () => ipcRenderer.send('recording:countdown-ready'),

  onTriggerCountdown: (callback: (seconds: number) => void): (() => void) => {
    const subscription = (_event: any, seconds: number) => callback(seconds);
    ipcRenderer.on('recording:trigger-countdown', subscription);
    return () => {
      ipcRenderer.removeListener('recording:trigger-countdown', subscription);
    };
  },

  onCountdownReady: (callback: () => void): (() => void) => {
    const subscription = () => callback();
    ipcRenderer.on('recording:countdown-ready', subscription);
    return () => {
      ipcRenderer.removeListener('recording:countdown-ready', subscription);
    };
  },

  onCountdownCancelled: (callback: () => void): (() => void) => {
    const subscription = () => callback();
    ipcRenderer.on('recording:cancel-countdown', subscription);
    return () => {
      ipcRenderer.removeListener('recording:cancel-countdown', subscription);
    };
  },

  onStartRecordingConfirmed: (callback: () => void): (() => void) => {
    const subscription = () => callback();
    ipcRenderer.on('recording:confirm-start', subscription);
    return () => {
      ipcRenderer.removeListener('recording:confirm-start', subscription);
    };
  },

  // Primary Recording Lifecycle
  startRecording: (
    settings: RecorderSettings,
    bounds?: RegionBounds | null
  ): Promise<{ success: boolean; filePath: string }> => ipcRenderer.invoke('recording:start', settings, bounds),
  sendRecordingChunk: (chunk: ArrayBuffer) => ipcRenderer.send('recording:chunk', new Uint8Array(chunk)),
  pauseRecording: () => ipcRenderer.invoke('recording:pause'),
  resumeRecording: () => ipcRenderer.invoke('recording:resume'),
  stopRecording: (): Promise<RecordingItem | null> => ipcRenderer.invoke('recording:stop'),

  // Preview Actions
  savePreviewRecording: (filePath: string): Promise<RecordingItem | null> =>
    ipcRenderer.invoke('preview:save', filePath),
  saveAsPreviewRecording: (filePath: string): Promise<RecordingItem | null> =>
    ipcRenderer.invoke('preview:save-as', filePath),
  recordAgainPreview: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('preview:record-again', filePath),
  discardPreviewRecording: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('preview:discard', filePath),

  onPreviewData: (callback: (item: RecordingItem) => void): (() => void) => {
    const subscription = (_event: any, item: RecordingItem) => callback(item);
    ipcRenderer.on('preview:data', subscription);
    return () => {
      ipcRenderer.removeListener('preview:data', subscription);
    };
  },

  // Window Actions
  openDashboard: (view: 'library' | 'settings' = 'library') => ipcRenderer.send('app:open-dashboard', view),
  minimizeApp: () => ipcRenderer.send('app:minimize'),
  quitApp: () => ipcRenderer.send('app:quit'),

  // Settings
  getSettings: (): Promise<RecorderSettings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Partial<RecorderSettings>): Promise<RecorderSettings> =>
    ipcRenderer.invoke('settings:save', settings),
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('settings:select-directory'),
  resetDefaultSaveLocation: (): Promise<string> => ipcRenderer.invoke('settings:reset-default-location'),
  openSaveLocationFolder: () => ipcRenderer.invoke('settings:open-folder'),

  // Hardware Info
  getHardwareInfo: (): Promise<SystemHardwareInfo> => ipcRenderer.invoke('system:get-hardware-info'),

  // History & Recordings
  getRecordings: (): Promise<RecordingItem[]> => ipcRenderer.invoke('recordings:get-all'),
  deleteRecording: (id: string): Promise<{ success: boolean; recordings: RecordingItem[] }> =>
    ipcRenderer.invoke('recordings:delete', id),
  openRecordingInFolder: (filePath: string) => ipcRenderer.invoke('recordings:open-in-folder', filePath),
  playRecording: (filePath: string) => ipcRenderer.invoke('recordings:play', filePath),

  // Events
  onRecordingCompleted: (callback: (item: RecordingItem | null) => void): (() => void) => {
    const subscription = (_event: any, item: RecordingItem | null) => callback(item);
    ipcRenderer.on('recording:completed', subscription);
    return () => {
      ipcRenderer.removeListener('recording:completed', subscription);
    };
  },

  onRecordingStateChanged: (callback: (state: { status: string }) => void): (() => void) => {
    const subscription = (_event: any, state: { status: string }) => callback(state);
    ipcRenderer.on('recording:state-changed', subscription);
    return () => {
      ipcRenderer.removeListener('recording:state-changed', subscription);
    };
  },

  onTogglePause: (callback: () => void): (() => void) => {
    const subscription = () => callback();
    ipcRenderer.on('recording:toggle-pause', subscription);
    return () => {
      ipcRenderer.removeListener('recording:toggle-pause', subscription);
    };
  },

  onFrameBoundsUpdated: (callback: (bounds: RegionBounds) => void): (() => void) => {
    const subscription = (_event: any, bounds: RegionBounds) => callback(bounds);
    ipcRenderer.on('frame:bounds-updated', subscription);
    return () => {
      ipcRenderer.removeListener('frame:bounds-updated', subscription);
    };
  },

  onDashboardView: (callback: (view: 'library' | 'settings') => void): (() => void) => {
    const subscription = (_event: any, view: 'library' | 'settings') => callback(view);
    ipcRenderer.on('dashboard:view', subscription);
    return () => {
      ipcRenderer.removeListener('dashboard:view', subscription);
    };
  },

  // Webcam Overlay
  toggleWebcamOverlay: (show: boolean) => ipcRenderer.send('webcam:toggle', show)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
