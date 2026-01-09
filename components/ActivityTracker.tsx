
import React, { useEffect, useRef, useState } from 'react';
import { FaceRecognitionService } from '../services/faceRecognition';

const ActivityTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>("INITIALIZING SENSORS...");
  const [logs, setLogs] = useState<string[]>([]);
  const processingRef = useRef<boolean>(true);
  
  // Ref to track the stream for cleanup in unmount
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    processingRef.current = true;
    startCamera();

    return () => {
      processingRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const addLog = (text: string) => {
    setLogs(prev => [text, ...prev].slice(0, 5));
  };

  const startCamera = async () => {
    try {
      // Ensure models are loaded before starting tracking loop
      const faceService = FaceRecognitionService.getInstance();
      await faceService.loadModels();

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      
      streamRef.current = mediaStream; // Save to ref for cleanup
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStatus("OPTICAL SENSORS ACTIVE");
      startTracking();
    } catch (err) {
      console.error("Camera failed", err);
      setStatus("SENSOR ERROR: NO SIGNAL");
      addLog("ERR: CAM_ACCESS_DENIED");
    }
  };

  const startTracking = () => {
    const faceService = FaceRecognitionService.getInstance();
    
    const track = async () => {
      if (!processingRef.current) return;
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        
        try {
            const result = await faceService.detectFace(videoRef.current);
            drawOverlay(result);

            if (result.detected) {
                // Capture image for potential registration usage
                if (canvasRef.current) {
                    // We can reuse the current canvas frame or draw a new hidden one
                    const captureData = canvasRef.current.toDataURL('image/jpeg', 0.8);
                    faceService.setLastSeenImage(captureData);
                }

                if (Math.random() > 0.95) {
                    let idLabel = result.name === "Unknown" ? "UNREGISTERED" : result.name;
                    // Log nickname if available
                    if (result.nickname) idLabel += ` (${result.nickname})`;
                    
                    addLog(`TARGET: ${idLabel} [${Math.random().toFixed(4)}]`);
                }
            } else {
                if (Math.random() > 0.98) addLog("SEARCHING_TARGET...");
            }
        } catch (e) {
            // Ignore frame errors
        }
      }
      requestAnimationFrame(track);
    };
    track();
  };

  const drawOverlay = (result: { detected: boolean, name?: string, nickname?: string, details?: any }) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw HUD Grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)'; // Indigo low opacity
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    if (result.detected && result.details && result.details.detection) {
       const box = result.details.detection.box;
       
       // Draw Box
       const isUnknown = !result.name || result.name === 'Unknown';
       const color = isUnknown ? '#ef4444' : '#00ff9d'; // Red if unknown, Green if known

       ctx.strokeStyle = color;
       ctx.lineWidth = 2;
       ctx.strokeRect(box.x, box.y, box.width, box.height);

       // Draw Corners decoration
       const lineLen = 20;
       ctx.lineWidth = 4;
       ctx.beginPath();
       
       // Top Left
       ctx.moveTo(box.x, box.y + lineLen);
       ctx.lineTo(box.x, box.y);
       ctx.lineTo(box.x + lineLen, box.y);
       
       // Bottom Right
       ctx.moveTo(box.x + box.width - lineLen, box.y + box.height);
       ctx.lineTo(box.x + box.width, box.y + box.height);
       ctx.lineTo(box.x + box.width, box.y + box.height - lineLen);
       
       ctx.stroke();

       // Label Logic: Nickname > Name > Unknown
       let displayName = "UNKNOWN";
       if (result.nickname) {
           displayName = result.nickname.toUpperCase();
       } else if (result.name && result.name !== "Unknown") {
           displayName = result.name.toUpperCase();
       }

       // Label
       ctx.fillStyle = color;
       ctx.font = '10px JetBrains Mono';
       ctx.fillText(`ID: ${displayName}`, box.x, box.y - 10);
       ctx.fillText(`CONF: ${(result.details.detection.score * 100).toFixed(1)}%`, box.x, box.y + box.height + 15);

       // Landmarks
       if (result.details.landmarks) {
            const landmarks = result.details.landmarks;
            ctx.fillStyle = isUnknown ? 'rgba(239, 68, 68, 0.6)' : 'rgba(99, 241, 255, 0.6)';
            landmarks.positions.forEach((point: any) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
            });
       }
    } else {
       // Scanning animation when no face
       const time = Date.now() / 1000;
       const y = (Math.sin(time) * 0.5 + 0.5) * canvas.height;
       
       ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'; // Red
       ctx.lineWidth = 2;
       ctx.beginPath();
       ctx.moveTo(0, y);
       ctx.lineTo(canvas.width, y);
       ctx.stroke();
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col overflow-hidden group">
        {/* Video Layer */}
        <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale contrast-125"
        />
        
        {/* Canvas Overlay */}
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full"
        />

        {/* HUD Data Overlay */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between items-start">
                <div className="bg-black/50 backdrop-blur border border-indigo-500/30 px-2 py-1 text-[10px] text-indigo-400 font-mono">
                    CAM_SOURCE: LOCAL_01<br/>
                    RES: 640x480
                </div>
                <div className="flex gap-1">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                     <span className="text-[10px] text-red-500 font-bold font-mono">REC</span>
                </div>
            </div>

            <div className="space-y-1">
                <div className="text-[10px] font-mono text-emerald-400 font-bold bg-black/60 w-fit px-2 py-0.5 border-l-2 border-emerald-500">
                    {status}
                </div>
                <div className="h-20 overflow-hidden flex flex-col-reverse">
                    {logs.map((log, i) => (
                        <div key={i} className="text-[9px] font-mono text-slate-500 truncate">
                            {`> ${log}`}
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
    </div>
  );
};

export default ActivityTracker;
