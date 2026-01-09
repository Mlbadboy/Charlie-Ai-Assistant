
import React, { useEffect, useState, useRef } from 'react';
import { AppState } from '../types';

interface AvatarProps {
  state: AppState;
  audioLevel: number;
}

const Avatar: React.FC<AvatarProps> = ({ state, audioLevel }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthOpenness, setMouthOpenness] = useState(0);

  // --- CONFIGURATION FOR THE RED HOODIE BOY ---
  // You should replace the src below with your local file path if you save the image
  // e.g., src="/assets/charlie_avatar.png"
  const AVATAR_IMAGE_SRC = "https://i.imgur.com/7XqW9wP.png"; // Using the image you provided (hosted copy for demo)
  
  // Color of the face to hide the original mouth/eyes during animation
  const SKIN_COLOR = "#fcece2"; 
  
  // Coordinates (Percentage relative to image container)
  const MOUTH_POS = { top: '35%', left: '53%' }; 
  const LEFT_EYE_POS = { top: '27%', left: '46%' };
  const RIGHT_EYE_POS = { top: '27%', left: '60%' };

  // ---------------------------------------------

  // Blinking Logic
  useEffect(() => {
    const blinkLoop = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150); // Close eyes for 150ms
      
      // Random next blink between 2s and 6s
      const nextBlink = Math.random() * 4000 + 2000;
      setTimeout(blinkLoop, nextBlink);
    };
    
    const timeout = setTimeout(blinkLoop, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // Lip Sync Logic (Smoothing)
  useEffect(() => {
    let targetOpenness = 0;
    
    if (state === AppState.SPEAKING) {
        // Map audio level (0-1) to mouth openness (0-100%)
        // Amplify low signals
        targetOpenness = Math.min(1, audioLevel * 3); 
    } else if (state === AppState.PROCESSING) {
        // Slight mumbling/thinking movement
        targetOpenness = 0.1;
    }

    // Simple lerp for smoothness
    const interval = setInterval(() => {
        setMouthOpenness(prev => prev + (targetOpenness - prev) * 0.3);
    }, 16);

    return () => clearInterval(interval);
  }, [audioLevel, state]);

  // CSS for Floating Animation
  const floatStyle = {
    animation: 'float 3s ease-in-out infinite',
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes skate-vibration {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-1px, 1px); }
          40% { transform: translate(-1px, -1px); }
          60% { transform: translate(1px, 1px); }
          80% { transform: translate(1px, -1px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>

      {/* Main Character Container */}
      <div 
        className="relative w-[350px] h-[350px] transition-transform duration-500"
        style={{
            ...floatStyle,
            // Scale up slightly when listening to look attentive
            transform: state === AppState.LISTENING ? 'scale(1.1)' : 'scale(1)',
            filter: state === AppState.ERROR ? 'grayscale(100%) sepia(50%) hue-rotate(-50deg)' : 'none'
        }}
      >
        <img 
            src={AVATAR_IMAGE_SRC} 
            alt="Charlie Avatar" 
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
        />

        {/* --- EYES (Blinking Layer) --- */}
        {/* We overlay skin-colored eyelids when blinking */}
        <div 
            className="absolute bg-[#fcece2] rounded-full transition-all duration-75"
            style={{
                top: LEFT_EYE_POS.top,
                left: LEFT_EYE_POS.left,
                width: '12%',
                height: isBlinking ? '6%' : '0%', // Close eyelid
                opacity: isBlinking ? 1 : 0,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 2px 2px rgba(0,0,0,0.1)' // Eyelash shadow
            }}
        />
        <div 
            className="absolute bg-[#fcece2] rounded-full transition-all duration-75"
            style={{
                top: RIGHT_EYE_POS.top,
                left: RIGHT_EYE_POS.left,
                width: '12%',
                height: isBlinking ? '6%' : '0%',
                opacity: isBlinking ? 1 : 0,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 2px 2px rgba(0,0,0,0.1)'
            }}
        />

        {/* --- MOUTH (Lip Sync Layer) --- */}
        <div 
            className="absolute flex items-center justify-center"
            style={{
                top: MOUTH_POS.top,
                left: MOUTH_POS.left,
                width: '10%', // Width of the mouth area
                height: '8%', // Max height
                transform: 'translate(-50%, -50%)',
            }}
        >
             {/* 1. Skin Patch (Hides the original static mouth from the image) */}
             <div 
                className="absolute inset-0 rounded-full blur-[1px]"
                style={{ backgroundColor: SKIN_COLOR, transform: 'scale(1.2)' }}
             ></div>

             {/* 2. Dynamic Mouth Shape */}
             <div 
                className="relative bg-[#4a1c1c] overflow-hidden transition-all duration-75"
                style={{
                    width: Math.max(20, mouthOpenness * 100) + '%', // Widen slightly when loud
                    height: Math.max(5, mouthOpenness * 100) + '%', // Open height
                    borderRadius: mouthOpenness > 0.3 ? '50%' : '20px', // Round when open, flat when closed
                    borderBottom: '2px solid rgba(0,0,0,0.2)', // Lip shadow
                }}
             >
                {/* Teeth (Only visible when open wide) */}
                <div className="absolute top-0 left-0 right-0 h-[20%] bg-white opacity-80"></div>
                
                {/* Tongue */}
                <div 
                    className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-pink-500 rounded-t-full"
                    style={{
                        transform: `translate(-50%, ${mouthOpenness * 10}%)` // Tongue moves slightly
                    }}
                ></div>
             </div>
        </div>

      </div>
      
      {/* State Indicators (Floating Icons) */}
      <div className="absolute top-10 right-10">
         {state === AppState.LISTENING && (
             <span className="text-4xl animate-bounce">👂</span>
         )}
         {state === AppState.PROCESSING && (
             <span className="text-4xl animate-pulse">💭</span>
         )}
      </div>
    </div>
  );
};

export default Avatar;
