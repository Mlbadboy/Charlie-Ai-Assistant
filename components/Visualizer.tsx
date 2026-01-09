
import React, { useEffect, useRef } from 'react';
import { AppState } from '../types';

interface VisualizerProps {
  state: AppState;
  audioLevel: number;
}

const Visualizer: React.FC<VisualizerProps> = ({ state, audioLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const smoothAudioRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    let animationId: number;

    const render = () => {
      // 1. Time & Audio Physics
      const isActive = state === AppState.SPEAKING || state === AppState.LISTENING || state === AppState.PROCESSING;
      const speed = isActive ? 0.02 : 0.005;
      timeRef.current += speed;
      
      const targetAudio = (state === AppState.SPEAKING) ? Math.max(0.1, audioLevel) : (state === AppState.PROCESSING ? 0.3 : 0.05);
      smoothAudioRef.current += (targetAudio - smoothAudioRef.current) * 0.15; // Smooth smoothing
      const vol = smoothAudioRef.current;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;

      // 2. Clear & Blend Mode
      ctx.clearRect(0, 0, w, h);
      // 'lighter' creates the neon glow when lines overlap
      ctx.globalCompositeOperation = 'lighter';

      // 3. Configuration
      const baseRadius = Math.min(w, h) * 0.25;
      // The sphere breaths/expands with volume
      const radius = baseRadius * (1 + vol * 0.8);
      
      const numRibbons = 12; // Number of swirling filaments
      const segments = 60;   // Resolution of each filament

      // 4. Draw Ribbons
      for (let i = 0; i < numRibbons; i++) {
        const iNorm = i / numRibbons;
        
        // Alternating Colors: Cyan vs Magenta
        const isCyan = i % 2 === 0;
        const hue = isCyan ? 190 : 310; 
        
        ctx.beginPath();
        ctx.lineWidth = 2 + (vol * 3); // Lines get thicker with volume
        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.4 + vol * 0.6})`;

        // Draw a single filament path
        for (let j = 0; j <= segments; j++) {
            const t = j / segments * Math.PI * 2;
            
            // MATH: Lissajous curves on a sphere surface
            // We create chaos by offsetting angles with time and index
            const lat = t * 3 + (iNorm * Math.PI) + (timeRef.current * 0.5); // latitude swirls
            const long = t * 2 + (Math.sin(timeRef.current + iNorm) * 2);    // longitude swirls
            
            // Volumetric Noise (distortion)
            const turbulence = Math.sin(t * 10 + timeRef.current * 5) * (vol * radius * 0.3);
            
            const r = radius + turbulence;

            // 3D Spherical Coordinates
            let x = r * Math.sin(lat) * Math.cos(long);
            let y = r * Math.sin(lat) * Math.sin(long);
            let z = r * Math.cos(lat);

            // Rotate the entire sphere slowly
            const rotX = timeRef.current * 0.3;
            const rotY = timeRef.current * 0.2;

            // Rotation Matrix Y
            let tx = x * Math.cos(rotY) - z * Math.sin(rotY);
            let tz = x * Math.sin(rotY) + z * Math.cos(rotY);
            x = tx; z = tz;

            // Rotation Matrix X
            let ty = y * Math.cos(rotX) - z * Math.sin(rotX);
            tz = y * Math.sin(rotX) + z * Math.cos(rotX);
            y = ty; z = tz;

            // 3D Project to 2D
            const scale = 400 / (400 + z);
            const x2d = cx + x * scale;
            const y2d = cy + y * scale;

            if (j === 0) ctx.moveTo(x2d, y2d);
            else ctx.lineTo(x2d, y2d);
        }
        ctx.stroke();

        // 5. Ghosting/Blur effect for "Motion"
        if (vol > 0.2) {
             ctx.save();
             ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.1)`;
             ctx.lineWidth = 10;
             ctx.stroke(); // Re-stroke with low opacity wide line for glow
             ctx.restore();
        }
      }

      // 6. Central Core Glow (The Singularity)
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.5);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.3, state === AppState.ERROR ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 150, 255, 0.3)');
      grad.addColorStop(0.6, state === AppState.SPEAKING ? 'rgba(255, 0, 255, 0.2)' : 'rgba(0, 0, 255, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 7. Outer Ring (Optional "Containment Field")
      if (state === AppState.PROCESSING) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(timeRef.current * 10) * 0.1})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
          ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', updateSize);
    };
  }, [state, audioLevel]);

  return (
    <div className="w-full h-full relative flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full" style={{ minHeight: '350px' }} />
        {/* Vignette for cinematic depth */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_10%,rgba(0,0,0,0.5)_90%)]"></div>
    </div>
  );
};

export default Visualizer;
