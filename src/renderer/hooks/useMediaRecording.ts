import { useState, useRef, useEffect, useCallback } from 'react';
import { RecorderSettings, RecordingItem, RegionBounds } from '../../shared/types';

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
  const micStreamRef = useRef<MediaStream | null>(null);
  const activeRecordingStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize or update microphone level monitor (isolated from heavy screen capture)
  const initMicrophoneMeter = useCallback(async (settings: RecorderSettings) => {
    try {
      // Clean up previous mic stream if disabled or changing
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (!settings.captureMicrophone) {
        setMicLevel(0);
        setIsClipping(false);
        return;
      }

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

      micStreamRef.current = micStream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 48000
      });
      const micSource = audioCtx.createMediaStreamSource(micStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      micSource.connect(analyser);
      micAnalyserRef.current = analyser;

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
    } catch (err) {
      console.warn('Microphone meter initialization notice:', err);
    }
  }, []);

  // Construct recording capture pipeline on-demand when recording starts
  const createRecordingStream = async (settings: RecorderSettings): Promise<MediaStream> => {
    const sources = await window.electronAPI.getSources();
    const primaryScreen = sources.find((s) => s.isScreen) || sources[0];

    if (!primaryScreen) {
      throw new Error('No display screen found for capture');
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

    // 2. Audio Processing Graph
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 48000
    });
    audioContextRef.current = audioCtx;

    // Studio Dynamics Limiter / Compressor
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

    // Microphone track
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
        micSource.connect(compressor);
      } catch (e) {
        console.warn('Microphone capture stream notice:', e);
      }
    }

    const combinedTracks = [
      ...desktopStream.getVideoTracks(),
      ...destination.stream.getAudioTracks()
    ];
    const combinedStream = new MediaStream(combinedTracks);
    activeRecordingStreamRef.current = combinedStream;

    return combinedStream;
  };

  // Instant start recording
  const startRecording = async (settings: RecorderSettings, bounds?: RegionBounds | null) => {
    try {
      const stream = await createRecordingStream(settings);

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

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Start recording failed:', err);
      // Clean up any partially created stream
      if (activeRecordingStreamRef.current) {
        activeRecordingStreamRef.current.getTracks().forEach((t) => t.stop());
        activeRecordingStreamRef.current = null;
      }
      throw err;
    }
  };

  const pauseRecording = async () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      await window.electronAPI.pauseRecording();
      setIsPaused(true);
    }
  };

  const resumeRecording = async () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      await window.electronAPI.resumeRecording();
      setIsPaused(false);
    }
  };

  const togglePause = async () => {
    if (!isRecording) return;
    if (isPaused) {
      await resumeRecording();
    } else {
      await pauseRecording();
    }
  };

  const stopRecording = async (): Promise<RecordingItem | null> => {
    if (!isRecording) return null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    // Stop and release desktop capture stream tracks immediately
    if (activeRecordingStreamRef.current) {
      activeRecordingStreamRef.current.getTracks().forEach((t) => t.stop());
      activeRecordingStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
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
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (activeRecordingStreamRef.current) {
        activeRecordingStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    recordingDuration,
    micLevel,
    isClipping,
    initMicrophoneMeter,
    startRecording,
    pauseRecording,
    resumeRecording,
    togglePause,
    stopRecording
  };
}
