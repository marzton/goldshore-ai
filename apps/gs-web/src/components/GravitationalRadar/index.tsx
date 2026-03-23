import React, { useRef, useEffect, useState } from 'react';
import type { FC } from 'react';
import { createClient } from '@supabase/supabase-js';

// As per the spec, RKLB is the fixed origin. All other variables are satellites.

// Placeholder for Supabase credentials - should be in environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


interface GravitationalRadarProps {
  // RKLB's implied volatility will drive the pulse frequency.
  rklbIV: number;
}

const GravitationalRadar: FC<GravitationalRadarProps> = ({ rklbIV }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [marketSignals, setMarketSignals] = useState<any[]>([]);
  const [mode, setMode] = useState<'Thermal' | 'Astral'>('Thermal');
  const pressTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // State: Tie the "unassigned" Supabase auth check to the postCreateCommand.
    // No data renders until the marstonr6@gmail.com handshake is valid.
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === 'marstonr6@gmail.com') {
        setIsAuth(true);
      } else {
        setIsAuth(false);
        console.warn("Authentication failed: Required user not logged in.");
      }
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email === 'marstonr6@gmail.com') {
        setIsAuth(true);
      } else {
        setIsAuth(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Web Worker communication
  useEffect(() => {
    if (!isAuth) return;
    const worker = new Worker(new URL('./data.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
      if (event.data.type === 'DATA_READY') setMarketSignals(event.data.payload);
    };
    const fetchData = () => worker.postMessage({ type: 'FETCH_DATA' });
    fetchData();
    const intervalId = setInterval(fetchData, 2400);
    return () => {
      worker.terminate();
      clearInterval(intervalId);
    };
  }, [isAuth]);

  // Long-press event handlers for mode switching
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    // Only trigger if press is near the center
    if (Math.sqrt((x - centerX)**2 + (y - centerY)**2) < 20) {
      pressTimer.current = setTimeout(() => {
        setMode(prevMode => {
          const newMode = prevMode === 'Thermal' ? 'Astral' : 'Thermal';
          console.log(`Recalibrating. Mode switched to: ${newMode}`);
          return newMode;
        });
      }, 500); // 500ms for a long press
    }
  };

  const handlePressEnd = () => {
    clearTimeout(pressTimer.current);
  };

  useEffect(() => {
    if (!isAuth || marketSignals.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = Math.min(window.innerWidth, 300);
    canvas.width = size;
    canvas.height = size;
    const center = { x: size / 2, y: size / 2 };
    const maxRadius = size / 2;
    const k = maxRadius;
    const fadeBuffer = 50;

    const calculatePulse = (time: number) => (time % 2400) / 2400 * maxRadius;
    const mapCorrelationToRadius = (rho: number) => k * (1 - Math.abs(rho));
    const mapCategoryToAngle = (category: string) => {
      switch (category) {
        case 'Macro': return Math.PI / 4;
        case 'Sector': return Math.PI * 0.75;
        case 'Competitor': return Math.PI * 1.25;
        default: return 0;
      }
    };
    
    const getAssetPosition = (asset: any) => {
        const distance = mapCorrelationToRadius(asset.rho);
        const angle = mapCategoryToAngle(asset.category);
        return {
            x: center.x + distance * Math.cos(angle),
            y: center.y + distance * Math.sin(angle),
        };
    };

    const renderAsset = (asset: any, pulseRadius: number) => {
      const position = getAssetPosition(asset);
      const distance = mapCorrelationToRadius(asset.rho);
      const opacity = Math.max(0, 1 - Math.abs(distance - pulseRadius) / fadeBuffer);
      if (opacity <= 0) return;

      if (asset.isAnomaly) {
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(position.x, position.y);
        ctx.stroke();
        ctx.fillStyle = '#D4AF37';
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      }
      
      ctx.beginPath();
      ctx.arc(position.x, position.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    };

    const renderAstralMode = () => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < marketSignals.length; i++) {
            for (let j = i + 1; j < marketSignals.length; j++) {
                const signalA = marketSignals[i];
                const signalB = marketSignals[j];
                // Draw line if correlation is high enough (e.g. > 0.6)
                if (Math.abs(signalA.rho) > 0.6 && Math.abs(signalB.rho) > 0.6) {
                    const posA = getAssetPosition(signalA);
                    const posB = getAssetPosition(signalB);
                    ctx.beginPath();
                    ctx.moveTo(posA.x, posA.y);
                    ctx.lineTo(posB.x, posB.y);
                    ctx.stroke();
                }
            }
        }
    };
    
    let animationFrameId: number;
    const render = (time: number) => {
      ctx.clearRect(0, 0, size, size);

      // --- Render Gridlines ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.5;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, (maxRadius / 4) * i, 0, 2 * Math.PI);
        ctx.stroke();
      }
      
      // --- Render Astral Mode vectors ---
      if (mode === 'Astral') {
        renderAstralMode();
      }

      // --- Render Pulse ---
      const pulseRadius = calculatePulse(time);
      ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(center.x, center.y, pulseRadius, 0, 2 * Math.PI);
      ctx.stroke();

      // --- Render Assets ---
      marketSignals.forEach(asset => renderAsset(asset, pulseRadius));

      // --- Render Center Anchor (Placeholder) ---
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(center.x, center.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      animationFrameId = requestAnimationFrame(render);
    };
    render(0);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isAuth, marketSignals, mode]);


  if (!isAuth) {
    // Per spec, no data renders until auth is valid.
    return <div style={{ width: 300, height: 300, background: '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Authenticating...</div>;
  }

  return (
    <canvas 
      ref={canvasRef} 
      onMouseDown={handlePressStart} 
      onMouseUp={handlePressEnd} 
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    />
  );
};

export default GravitationalRadar;
