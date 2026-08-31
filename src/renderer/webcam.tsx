import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Camera, X, GripVertical } from 'lucide-react';
import './index.css';

const WebcamApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: 30 },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error('Failed to open webcam:', err);
        setError('No camera available or access denied');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleClose = () => {
    window.electronAPI.toggleWebcamOverlay(false);
  };

  return (
    <div className="w-screen h-screen p-2 flex flex-col items-center justify-center bg-transparent select-none">
      <div className="relative w-full h-full rounded-2xl overflow-hidden glass-panel border border-white/20 shadow-2xl bg-black/80 flex flex-col group">
        {/* Top Floating Drag Bar */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="app-draggable p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-slate-400 hover:text-white cursor-move">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-500 text-slate-300 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Video feed */}
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs p-4 text-center">
            <Camera className="w-8 h-8 mb-2 stroke-1" />
            <p>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover -scale-x-100 rounded-2xl"
          />
        )}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('webcam-root') as HTMLElement);
root.render(
  <React.StrictMode>
    <WebcamApp />
  </React.StrictMode>
);
