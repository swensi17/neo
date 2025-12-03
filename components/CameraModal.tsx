import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, RotateCcw, Zap, ZapOff, Circle } from 'lucide-react';
import { Attachment } from '../types';
import { haptic } from '../utils/haptic';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (attachment: Attachment) => void;
  isLight?: boolean;
  language?: 'ru' | 'en';
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  isLight = false,
  language = 'ru'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const isRu = language === 'ru';

  // Start camera
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setError(null);
    setIsReady(false);
    
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
        setIsReady(true);
      }

      // Check for flash/torch support
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      setHasFlash(capabilities?.torch === true);
      
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError(isRu ? 'Разрешите доступ к камере' : 'Please allow camera access');
      } else if (err.name === 'NotFoundError') {
        setError(isRu ? 'Камера не найдена' : 'Camera not found');
      } else {
        setError(isRu ? 'Ошибка камеры' : 'Camera error');
      }
    }
  }, [isRu]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsReady(false);
  }, []);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  // Switch camera
  const switchCamera = useCallback(() => {
    haptic.light();
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current || !hasFlash) return;
    
    haptic.light();
    const track = streamRef.current.getVideoTracks()[0];
    const newFlashState = !flashEnabled;
    
    try {
      await track.applyConstraints({
        advanced: [{ torch: newFlashState } as any]
      });
      setFlashEnabled(newFlashState);
    } catch (err) {
      console.error('Flash toggle error:', err);
    }
  }, [flashEnabled, hasFlash]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;
    
    haptic.medium();
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0);
    
    // Convert to base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    const attachment: Attachment = {
      name: `photo_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      data: dataUrl
    };

    // Flash effect
    setTimeout(() => {
      setIsCapturing(false);
      onCapture(attachment);
      onClose();
    }, 150);
  }, [isReady, facingMode, onCapture, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    haptic.light();
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Video preview - full screen */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      />

      {/* Flash overlay when capturing */}
      {isCapturing && (
        <div className="absolute inset-0 bg-white animate-flash z-10" />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-center px-8">
            <Camera size={48} className="mx-auto mb-4 text-zinc-500" />
            <p className="text-white text-lg mb-2">{error}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="mt-4 px-6 py-2 bg-white text-black rounded-full font-medium"
            >
              {isRu ? 'Повторить' : 'Retry'}
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-30" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
        >
          <X size={24} className="text-white" />
        </button>

        {/* Flash toggle (if available) */}
        {hasFlash && (
          <button
            onClick={toggleFlash}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm ${flashEnabled ? 'bg-yellow-500' : 'bg-black/50'}`}
          >
            {flashEnabled ? (
              <Zap size={20} className="text-black" fill="currentColor" />
            ) : (
              <ZapOff size={20} className="text-white" />
            )}
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div 
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 pb-8 z-30"
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
      >
        {/* Switch camera */}
        <button
          onClick={switchCamera}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
        >
          <RotateCcw size={22} className="text-white" />
        </button>

        {/* Capture button */}
        <button
          onClick={capturePhoto}
          disabled={!isReady}
          className={`w-20 h-20 flex items-center justify-center rounded-full border-4 border-white transition-transform active:scale-95 ${isReady ? '' : 'opacity-50'}`}
        >
          <Circle size={64} className="text-white" fill="white" />
        </button>

        {/* Placeholder for symmetry */}
        <div className="w-12 h-12" />
      </div>
    </div>
  );
};
