import { app, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import {
  RecorderSettings,
  RecordingItem,
  SettingsHistoryItem
} from '../../shared/types';

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
  highlightClicks: false,
  defaultFormat: 'mp4',
  autoConvert: 'never'
};

const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm', '.mov', '.avi']);

interface DatabaseSchema {
  version: number;
  settings: RecorderSettings;
  settings_history: SettingsHistoryItem[];
  recordings: RecordingItem[];
}

export class RecordingsStore {
  private configDir: string;
  private dbFile: string;
  private tempDir: string;

  constructor() {
    this.configDir = app.getPath('userData');
    this.dbFile = path.join(this.configDir, 'reco_db.json');
    this.tempDir = path.join(app.getPath('temp'), 'reco-temp');

    this.ensureDirs();
    this.runMigrations();
  }

  private ensureDirs(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    const settings = this.getSettings();
    if (!fs.existsSync(settings.outputPath)) {
      try {
        fs.mkdirSync(settings.outputPath, { recursive: true });
      } catch (e) {}
    }
  }

  public getTempDir(): string {
    return this.tempDir;
  }

  private readDb(): DatabaseSchema {
    try {
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('DB read fallback:', err);
    }

    // Migrate from legacy files if they exist
    const legacySettingsFile = path.join(this.configDir, 'settings.json');
    const legacyRecordingsFile = path.join(this.configDir, 'recordings.json');

    let migratedSettings = { ...defaultSettings };
    let migratedRecordings: RecordingItem[] = [];

    if (fs.existsSync(legacySettingsFile)) {
      try {
        migratedSettings = { ...defaultSettings, ...JSON.parse(fs.readFileSync(legacySettingsFile, 'utf-8')) };
      } catch (e) {}
    }
    if (fs.existsSync(legacyRecordingsFile)) {
      try {
        migratedRecordings = JSON.parse(fs.readFileSync(legacyRecordingsFile, 'utf-8'));
      } catch (e) {}
    }

    const initialDb: DatabaseSchema = {
      version: 3,
      settings: migratedSettings,
      settings_history: [],
      recordings: migratedRecordings
    };

    this.writeDb(initialDb);
    return initialDb;
  }

  private writeDb(db: DatabaseSchema): void {
    try {
      fs.writeFileSync(this.dbFile, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database:', err);
    }
  }

  private runMigrations(): void {
    const db = this.readDb();
    let modified = false;

    if (!db.version || db.version < 3) {
      db.version = 3;
      db.settings = { ...defaultSettings, ...(db.settings || {}) };
      if (!Array.isArray(db.settings_history)) db.settings_history = [];
      if (!Array.isArray(db.recordings)) db.recordings = [];
      modified = true;
    }

    if (modified) {
      this.writeDb(db);
    }
  }

  public getSettings(): RecorderSettings {
    const db = this.readDb();
    return { ...defaultSettings, ...(db.settings || {}) };
  }

  public saveSettings(newSettings: Partial<RecorderSettings>): RecorderSettings {
    const db = this.readDb();
    const oldSettings = db.settings || defaultSettings;
    const updated = { ...oldSettings, ...newSettings };

    // Record settings change history audit
    for (const key of Object.keys(newSettings) as (keyof RecorderSettings)[]) {
      const oldVal = String(oldSettings[key] ?? '');
      const newVal = String(newSettings[key] ?? '');
      if (oldVal !== newVal) {
        db.settings_history.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          key,
          oldValue: oldVal,
          newValue: newVal,
          changedAt: new Date().toISOString()
        });
      }
    }

    db.settings = updated;
    this.writeDb(db);

    if (!fs.existsSync(updated.outputPath)) {
      try {
        fs.mkdirSync(updated.outputPath, { recursive: true });
      } catch (e) {}
    }

    return updated;
  }

  public resetDefaultOutputPath(): string {
    const defaultPath = path.join(app.getPath('videos'), 'Reco');
    this.saveSettings({ outputPath: defaultPath });
    return defaultPath;
  }

  public getRecordings(): RecordingItem[] {
    const db = this.readDb();
    const items = db.recordings || [];
    return items.filter(
      (item) =>
        typeof item.filePath === 'string' &&
        ALLOWED_EXTENSIONS.has(path.extname(item.filePath).toLowerCase()) &&
        fs.existsSync(item.filePath)
    );
  }

  public addRecording(item: RecordingItem): RecordingItem[] {
    const db = this.readDb();
    const current = db.recordings || [];
    db.recordings = [item, ...current.filter((r) => r.id !== item.id)];
    this.writeDb(db);
    return db.recordings;
  }

  public deleteRecording(id: string): { success: boolean; recordings: RecordingItem[] } {
    const db = this.readDb();
    const current = db.recordings || [];
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

    db.recordings = current.filter((r) => r.id !== id);
    this.writeDb(db);
    return { success: true, recordings: db.recordings };
  }

  public commitTempRecording(tempPath: string, customDestPath?: string): RecordingItem | null {
    if (!fs.existsSync(tempPath)) return null;

    const settings = this.getSettings();
    const targetDir = customDestPath ? path.dirname(customDestPath) : settings.outputPath;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const finalPath = customDestPath || path.join(targetDir, path.basename(tempPath).replace(/^temp_/, ''));

    try {
      if (tempPath !== finalPath) {
        fs.copyFileSync(tempPath, finalPath);
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {}
      }

      const stats = fs.statSync(finalPath);
      const newItem: RecordingItem = {
        id: `rec_${Date.now()}`,
        filePath: finalPath,
        fileName: path.basename(finalPath),
        duration: 0, // Updated by caller or ffmpeg
        fileSize: stats.size,
        timestamp: Date.now(),
        resolution: 'Custom Region',
        fps: settings.framerate || 60,
        format: path.extname(finalPath).replace('.', '').toUpperCase()
      };

      this.addRecording(newItem);
      return newItem;
    } catch (err) {
      console.error('Failed to commit temporary recording:', err);
      return null;
    }
  }

  public discardTempRecording(tempPath: string): boolean {
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
        return true;
      } catch (err) {
        console.error('Failed to discard temp recording:', err);
      }
    }
    return false;
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
