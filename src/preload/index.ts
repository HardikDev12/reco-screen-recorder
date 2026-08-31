import { contextBridge, ipcRenderer } from 'electron';
import { CaptureSource, RecorderSettings, RecordingItem, RegionBounds, SystemHardwareInfo } from '../shared/types';

export const electronAPI = {
  // Capture Sources & Frame
  getSources: (): Promise<CaptureSource[]> => ipcRenderer.invoke('capture:get-sources'),
  getFrameBounds: (): Promise<RegionBounds> => ipcRenderer.invoke('frame:get-bounds'),
  setFrameFullScreen: () => ipcRenderer.send('frame:set-fullscreen'),

  // Region Selector Legacy Helpers
  openRegionSelector: (): Promise<RegionBounds | null> => ipcRenderer.invoke('capture:open-region-selector'),
  sendRegionSelected: (bounds: RegionBounds) => ipcRenderer.send('capture:region-selected', bounds),
  cancelRegionSelection: () => ipcRenderer.send('capture:region-cancelled'),

  // Mouse Pass-Through
  setIgnoreMouseEvents: (ignore: boolean) => ipcRenderer.send('overlay:set-ignore-mouse', ignore),

  // Primary Recording Lifecycle
  startRecording: (
    settings: RecorderSettings,
    bounds?: RegionBounds | null
  ): Promise<{ success: boolean; filePath: string }> => ipcRenderer.invoke('recording:start', settings, bounds),
  sendRecordingChunk: (chunk: ArrayBuffer) => ipcRenderer.send('recording:chunk', new Uint8Array(chunk)),
  pauseRecording: () => ipcRenderer.invoke('recording:pause'),
  resumeRecording: () => ipcRenderer.invoke('recording:resume'),
  stopRecording: (): Promise<RecordingItem | null> => ipcRenderer.invoke('recording:stop'),

  // Window Actions
  openDashboard: (view: 'library' | 'settings' = 'library') => ipcRenderer.send('app:open-dashboard', view),
  minimizeApp: () => ipcRenderer.send('app:minimize'),
  quitApp: () => ipcRenderer.send('app:quit'),

  // Settings
  getSettings: (): Promise<RecorderSettings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Partial<RecorderSettings>): Promise<RecorderSettings> =>
    ipcRenderer.invoke('settings:save', settings),
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('settings:select-directory'),

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
