import { app, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { RecorderSettings, RecordingItem } from '../../shared/types';

const defaultSettings: RecorderSettings = {
  outputPath: path.join(app.getPath('videos'), 'Reco'),
  framerate: 60,
  resolution: '1080p',
  encoder: 'auto',
  captureMicrophone: true,
  captureSystemAudio: true,
  showWebcam: false,
  hardwareAcceleration: true,
  countdownSeconds: 3,
  highlightClicks: false
};

const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm', '.mov', '.avi']);

export class RecordingsStore {
  private configDir: string;
  private settingsFile: string;
  private recordingsFile: string;

  constructor() {
    this.configDir = app.getPath('userData');
    this.settingsFile = path.join(this.configDir, 'settings.json');
    this.recordingsFile = path.join(this.configDir, 'recordings.json');

    this.ensureDirs();
  }

  private ensureDirs(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    const settings = this.getSettings();
    if (!fs.existsSync(settings.outputPath)) {
      fs.mkdirSync(settings.outputPath, { recursive: true });
    }
  }

  public getSettings(): RecorderSettings {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const raw = fs.readFileSync(this.settingsFile, 'utf-8');
        return { ...defaultSettings, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Failed to read settings, using default:', err);
    }
    return defaultSettings;
  }

  public saveSettings(newSettings: Partial<RecorderSettings>): RecorderSettings {
    const updated = { ...this.getSettings(), ...newSettings };
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(updated, null, 2), 'utf-8');
      if (!fs.existsSync(updated.outputPath)) {
        fs.mkdirSync(updated.outputPath, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
    return updated;
  }

  public getRecordings(): RecordingItem[] {
    try {
      if (fs.existsSync(this.recordingsFile)) {
        const raw = fs.readFileSync(this.recordingsFile, 'utf-8');
        const items: RecordingItem[] = JSON.parse(raw);
        // Verify files still exist on disk and have valid video extension
        return items.filter(
          (item) =>
            typeof item.filePath === 'string' &&
            ALLOWED_EXTENSIONS.has(path.extname(item.filePath).toLowerCase()) &&
            fs.existsSync(item.filePath)
        );
      }
    } catch (err) {
      console.error('Failed to read recordings list:', err);
    }
    return [];
  }

  public addRecording(item: RecordingItem): RecordingItem[] {
    const current = this.getRecordings();
    const updated = [item, ...current.filter((r) => r.id !== item.id)];
    try {
      fs.writeFileSync(this.recordingsFile, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save recording history:', err);
    }
    return updated;
  }

  public deleteRecording(id: string): { success: boolean; recordings: RecordingItem[] } {
    const current = this.getRecordings();
    const target = current.find((r) => r.id === id);
    if (
      target &&
      typeof target.filePath === 'string' &&
      ALLOWED_EXTENSIONS.has(path.extname(target.filePath).toLowerCase()) &&
      fs.existsSync(target.filePath)
    ) {
      try {
        fs.unlinkSync(target.filePath);
      } catch (err) {
        console.error('Failed to delete file on disk:', err);
      }
    }
    const updated = current.filter((r) => r.id !== id);
    try {
      fs.writeFileSync(this.recordingsFile, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to update recordings list after deletion:', err);
    }
    return { success: true, recordings: updated };
  }

  public openRecordingInFolder(filePath: string): void {
    if (
      typeof filePath === 'string' &&
      ALLOWED_EXTENSIONS.has(path.extname(filePath).toLowerCase()) &&
      fs.existsSync(filePath)
    ) {
      shell.showItemInFolder(filePath);
    }
  }

  public playRecording(filePath: string): void {
    if (
      typeof filePath === 'string' &&
      ALLOWED_EXTENSIONS.has(path.extname(filePath).toLowerCase()) &&
      fs.existsSync(filePath)
    ) {
      shell.openPath(filePath);
    }
  }
}
