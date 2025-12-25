import React, { useRef, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface VirtualJoystickProps {
  socket: Socket;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ socket }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDragging && direction) {
      interval = setInterval(() => {
        socket.emit('move', direction);
      }, 150); // Emit move event every 150ms while dragging
    }
    return () => clearInterval(interval);
  }, [isDragging, direction, socket]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDirection(null);
    if (knobRef.current) {
        knobRef.current.style.transform = 'translate(0, 0)';
    }
    socket.emit('stop-move');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !joystickRef.current || !knobRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const size = rect.width;
    const halfSize = size / 2;

    let x = e.clientX - rect.left - halfSize;
    let y = e.clientY - rect.top - halfSize;

    const distance = Math.min(halfSize, Math.sqrt(x * x + y * y));
    const angle = Math.atan2(y, x);

    const boundedX = Math.cos(angle) * distance;
    const boundedY = Math.sin(angle) * distance;

    knobRef.current.style.transform = `translate(${boundedX}px, ${boundedY}px)`;

    // Determine direction
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    if (absX > absY) {
        setDirection(x > 0 ? 'right' : 'left');
    } else {
        setDirection(y > 0 ? 'back' : 'forward');
    }
  };

   useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);


  return (
    <div className="flex flex-col items-center">
        <p className="text-slate-400 mb-2 font-semibold">Movement</p>
        <div
            ref={joystickRef}
            className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center select-none relative"
            onMouseDown={handleMouseDown}
        >
            <div
                ref={knobRef}
                className="w-12 h-12 bg-cyan-500 rounded-full cursor-grab active:cursor-grabbing transition-transform duration-75"
            ></div>
        </div>
    </div>
  );
};

export default VirtualJoystick;
