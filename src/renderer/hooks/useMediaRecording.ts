import { useState, useRef, useEffect, useCallback } from 'react';
import { CaptureSource, RecorderSettings, RecordingItem, RegionBounds } from '../../shared/types';

export function useMediaRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [isClipping, setIsClipping] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const activeStreamRef = useRef<MediaStream | null>(null);
  const isPreWarmedRef = useRef<boolean>(false);

  // Pre-warm the capture pipeline (WebRTC desktop + 48kHz AudioContext + Mic)
  const preWarmCapturePipeline = useCallback(async (settings: RecorderSettings) => {
    try {
      if (isPreWarmedRef.current && activeStreamRef.current) {
        return activeStreamRef.current;
      }

      // Get primary display screen
      const sources = await window.electronAPI.getSources();
      const primaryScreen = sources.find((s) => s.isScreen) || sources[0];

      if (!primaryScreen) {
        throw new Error('No display screen found');
      }

      // 1. WebRTC Screen Stream
      const desktopStream = await navigator.mediaDevices.getUserMedia({
        audio: settings.captureSystemAudio
          ? {
              mandatory: {
                chromeMediaSource: 'desktop'
              }
            } as any
          : false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: primaryScreen.id,
            minFrameRate: settings.framerate || 60,
            maxFrameRate: settings.framerate || 60
          }
        } as any
      });

      // 2. High Quality 48kHz AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 48000
      });
      audioContextRef.current = audioCtx;

      // Soft Limiter / Dynamic Compressor to prevent digital clipping
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
      compressor.knee.setValueAtTime(30, audioCtx.currentTime);
      compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

      const destination = audioCtx.createMediaStreamDestination();
      compressor.connect(destination);

      // Desktop system sound track
      const sysTracks = desktopStream.getAudioTracks();
      if (sysTracks.length > 0) {
        const sysSource = audioCtx.createMediaStreamSource(new MediaStream([sysTracks[0]]));
        sysSource.connect(compressor);
      }

      // 3. Microphone Track
      if (settings.captureMicrophone) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: settings.selectedMicrophoneId
              ? {
                  deviceId: { exact: settings.selectedMicrophoneId },
                  echoCancellation: false,
                  noiseSuppression: false,
                  autoGainControl: false,
                  sampleRate: 48000
                }
              : {
                  echoCancellation: false,
                  noiseSuppression: false,
                  autoGainControl: false,
                  sampleRate: 48000
                },
            video: false
          });

          const micSource = audioCtx.createMediaStreamSource(micStream);

          // Volume analyser for level meter
          const micAnalyser = audioCtx.createAnalyser();
          micAnalyser.fftSize = 64;
          micSource.connect(micAnalyser);
          micAnalyserRef.current = micAnalyser;

          micSource.connect(compressor);
        } catch (e) {
          console.warn('Microphone pre-warm warning:', e);
        }
      }

      // Start level meter polling
      const dataArray = new Uint8Array(32);
      const updateMeter = () => {
        if (micAnalyserRef.current) {
          micAnalyserRef.current.getByteFrequencyData(dataArray);
          let maxVal = 0;
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
            if (dataArray[i] > maxVal) maxVal = dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
          setIsClipping(maxVal >= 250);
        }
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

      const combinedTracks = [
        ...desktopStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ];
      const combinedStream = new MediaStream(combinedTracks);

      activeStreamRef.current = combinedStream;
      isPreWarmedRef.current = true;
      return combinedStream;
    } catch (err) {
      console.error('Pre-warm capture pipeline failed:', err);
      return null;
    }
  }, []);

  // Instant start recording (zero latency)
  const startRecording = async (settings: RecorderSettings, bounds?: RegionBounds | null) => {
    try {
      let stream = activeStreamRef.current;
      if (!stream || stream.getVideoTracks().length === 0 || !stream.getVideoTracks()[0].readyState) {
        stream = await preWarmCapturePipeline(settings);
      }

      if (!stream) {
        throw new Error('Failed to initialize screen recording stream');
      }

      // Convert logical bounds to physical DPI pixels if specified
      let physicalBounds: RegionBounds | null = null;
      if (bounds) {
        const dpr = window.devicePixelRatio || 1;
        physicalBounds = {
          x: Math.round(bounds.x * dpr),
          y: Math.round(bounds.y * dpr),
          width: Math.round(bounds.width * dpr),
          height: Math.round(bounds.height * dpr)
        };
      }

      // Spawn FFmpeg in Main Process
      await window.electronAPI.startRecording(settings, physicalBounds);

      // Start MediaRecorder piping
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm;codecs=vp8,opus';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: settings.framerate === 60 ? 16000000 : 10000000,
        audioBitsPerSecond: 192000
      });

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          const buffer = await e.data.arrayBuffer();
          window.electronAPI.sendRecordingChunk(buffer);
        }
      };

      recorder.start(100); // 100ms chunks for smooth real-time stream piping
      mediaRecorderRef.current = recorder;

      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Instant start recording failed:', err);
      throw err;
    }
  };

  const pauseRecording = async () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      await window.electronAPI.pauseRecording();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = async () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      await window.electronAPI.resumeRecording();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = async (): Promise<RecordingItem | null> => {
    if (!isRecording) return null;

    if (timerRef.current) clearInterval(timerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsPaused(false);

    const result = await window.electronAPI.stopRecording();
    return result;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    recordingDuration,
    micLevel,
    isClipping,
    preWarmCapturePipeline,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording
  };
}
