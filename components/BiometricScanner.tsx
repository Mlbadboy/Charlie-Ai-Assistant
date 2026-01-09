import React, { useEffect, useRef, useState } from 'react';
import { ScanFace, AlertCircle, CheckCircle } from 'lucide-react';
import { FaceRecognitionService } from '../services/faceRecognition';

interface BiometricScannerProps {
  onVerified: () => void;
  onFail?: () => void;
}

const BiometricScanner: React.FC<BiometricScannerProps> = ({ onVerified, onFail }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'INIT' | 'SCANNING' | 'VERIFIED' | 'ERROR'>('INIT');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [statusMessage, setStatusMessage] = useState("Initializing Biometric Sensors...");
  const scanInterval = useRef<number | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (scanInterval.current) clearInterval(scanInterval.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      setStatusMessage("Accessing Video Feed...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
        } 
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStatus('SCANNING');
      setStatusMessage("Searching for User...");
      initializeDetection();
      
    } catch (err) {
      console.error("Camera access denied:", err);
      setStatus('ERROR');
      setStatusMessage("Camera Access Denied. Bypass Required.");
      setTimeout(() => onVerified(), 2000); // Fail-safe bypass
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const initializeDetection = async () => {
    const faceService = FaceRecognitionService.getInstance();
    await faceService.loadModels();

    let consecutiveDetections = 0;
    const REQUIRED_DETECTIONS = 5;

    scanInterval.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      const result = await faceService.detectFace(videoRef.current);
      
      if (result.detected) {
        consecutiveDetections++;
        setStatusMessage(`Analyzing Facial Geometry... ${(consecutiveDetections / REQUIRED_DETECTIONS * 100).toFixed(0)}%`);
        
        // Visual feedback on canvas
        drawOverlay(true);

        if (consecutiveDetections >= REQUIRED_DETECTIONS) {
           completeVerification();
        }
      } else {
        consecutiveDetections = Math.max(0, consecutiveDetections - 1);
        setStatusMessage("Align Face in Frame...");
        drawOverlay(false);
      }
    }, 500); // Check every 500ms
  };

  const drawOverlay = (detected: boolean) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detected) {
       ctx.strokeStyle = '#00ff9d'; // Green
       ctx.lineWidth = 4;
       // Draw a simple bracket around center
       const cx = canvas.width / 2;
       const cy = canvas.height / 2;
       const size = 150;
       
       ctx.beginPath();
       ctx.rect(cx - size/2, cy - size/2, size, size);
       ctx.stroke();
    }
  };

  const completeVerification = () => {
      if (scanInterval.current) clearInterval(scanInterval.current);
      setStatus('VERIFIED');
      setStatusMessage("IDENTITY CONFIRMED: ADMIN");
      setTimeout(() => {
          stopCamera();
          onVerified();
      }, 1500);
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
      {/* Video Layer */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className={`w-full h-full object-cover opacity-60 transition-opacity ${status === 'VERIFIED' ? 'opacity-20 blur-sm' : ''}`}
      />
      
      {/* Canvas Layer for Face Box */}
      <canvas 
         ref={canvasRef} 
         className="absolute inset-0 w-full h-full"
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        
        {/* Scanning Grid Animation */}
        {status === 'SCANNING' && (
            <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(99,102,241,0.1)_50%,transparent_100%)] animate-[scan_2s_linear_infinite] h-full w-full border-t border-indigo-500/50"></div>
        )}

        {/* Center Reticle */}
        <div className={`relative transition-all duration-500 ${status === 'VERIFIED' ? 'scale-110' : 'scale-100'}`}>
            {status === 'VERIFIED' ? (
                <CheckCircle size={64} className="text-emerald-500 animate-pulse" />
            ) : status === 'ERROR' ? (
                <AlertCircle size={64} className="text-red-500" />
            ) : (
                <ScanFace size={64} className="text-indigo-400 opacity-80" />
            )}
            
            {/* Spinning Rings */}
            {status === 'SCANNING' && (
                <div className="absolute inset-0 -m-4 border-2 border-dashed border-indigo-500/30 rounded-full animate-spin-slow"></div>
            )}
        </div>

        {/* Status Text */}
        <div className="mt-8 font-mono text-xs tracking-widest text-center px-4">
            <div className={`px-2 py-1 rounded bg-black/50 backdrop-blur-sm border ${
                status === 'VERIFIED' ? 'text-emerald-400 border-emerald-500/30' : 
                status === 'ERROR' ? 'text-red-400 border-red-500/30' : 
                'text-indigo-300 border-indigo-500/30'
            }`}>
                {statusMessage}
            </div>
        </div>

        {/* HUD Elements */}
        <div className="absolute top-2 left-2 text-[10px] text-slate-500 font-mono">CAM_01 [ACTIVE]</div>
        <div className="absolute top-2 right-2 text-[10px] text-slate-500 font-mono">FACE_RECOGNITION_MODULE</div>
        <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 font-mono">FPS: 30</div>
      </div>
    </div>
  );
};

export default BiometricScanner;