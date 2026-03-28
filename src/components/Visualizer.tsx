import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  audioElement?: HTMLAudioElement | HTMLVideoElement | null;
  opacity: number;
  type: 'bars' | 'wave' | 'circle' | 'particles' | 'spectrum' | 'rings' | 'glitch' | 'nebula' | 'fireworks' | 'matrix';
  color: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ audioElement, opacity, type, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const time = Date.now() / 1000;
      const alpha = Math.floor(opacity * 255).toString(16).padStart(2, '0');
      const baseColor = color + alpha;
      ctx.fillStyle = baseColor;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;

      if (type === 'bars') {
        const barCount = 48;
        const barWidth = canvas.width / barCount;
        for (let i = 0; i < barCount; i++) {
          const noise = Math.sin(time * 5 + i * 0.2) * 20;
          const base = Math.sin(time * 2 + i * 0.1) * 40 + 60;
          const height = Math.max(10, base + noise);
          ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 4, height);
        }
      } else if (type === 'wave') {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        for (let i = 0; i < canvas.width; i++) {
          const y = canvas.height / 2 + Math.sin(i * 0.02 + time * 5) * 50 * Math.sin(time * 2);
          ctx.lineTo(i, y);
        }
        ctx.stroke();
      } else if (type === 'circle') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80 + Math.sin(time * 3) * 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + time;
          const x = centerX + Math.cos(angle) * (radius + 20);
          const y = centerY + Math.sin(angle) * (radius + 20);
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'particles') {
        for (let i = 0; i < 30; i++) {
          const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width;
          const y = (Math.cos(time * 0.5 + i * 2) * 0.5 + 0.5) * canvas.height;
          const size = Math.sin(time * 2 + i) * 5 + 8;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'spectrum') {
        const barCount = 64;
        const barWidth = canvas.width / barCount;
        for (let i = 0; i < barCount; i++) {
          const h = Math.abs(Math.sin(time * 3 + i * 0.1)) * canvas.height * 0.6;
          ctx.fillRect(i * barWidth, (canvas.height - h) / 2, barWidth - 2, h);
        }
      } else if (type === 'rings') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        for (let i = 0; i < 5; i++) {
          const r = ( (time * 100 + i * 100) % 500 );
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          ctx.globalAlpha = (1 - r / 500) * opacity;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (type === 'glitch') {
        for (let i = 0; i < 10; i++) {
          if (Math.random() > 0.8) {
            const w = Math.random() * 100;
            const h = Math.random() * 20;
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            ctx.fillRect(x, y, w, h);
          }
        }
      } else if (type === 'nebula') {
        for (let i = 0; i < 5; i++) {
          const x = canvas.width / 2 + Math.sin(time + i) * 100;
          const y = canvas.height / 2 + Math.cos(time * 0.8 + i) * 80;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, 150);
          grad.addColorStop(0, baseColor);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, 150, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'fireworks') {
        for (let i = 0; i < 20; i++) {
          const t = (time + i * 0.5) % 2;
          const x = (i * 50) % canvas.width;
          const y = canvas.height - (t * 200);
          const size = (1 - t / 2) * 10;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'matrix') {
        ctx.font = '10px monospace';
        for (let i = 0; i < canvas.width; i += 15) {
          const y = (time * 100 + i * 10) % canvas.height;
          ctx.fillText(Math.random() > 0.5 ? '1' : '0', i, y);
        }
      }
      
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [audioElement, opacity, type, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};
