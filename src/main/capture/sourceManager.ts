import { desktopCapturer } from 'electron';
import { CaptureSource } from '../../shared/types';

export class SourceManager {
  public async getAvailableSources(): Promise<CaptureSource[]> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 480, height: 270 },
        fetchWindowIcons: true
      });

      return sources.map((source) => {
        const isScreen = source.id.startsWith('screen:');
        return {
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL(),
          appIcon: source.appIcon ? source.appIcon.toDataURL() : undefined,
          display_id: source.display_id,
          isScreen
        };
      });
    } catch (err) {
      console.error('Failed to get capture sources:', err);
      return [];
    }
  }
}
