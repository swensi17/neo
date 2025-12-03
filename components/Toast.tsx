import React, { useEffect, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
  isLight?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  isOpen, 
  onClose, 
  duration = 2500,
  isLight = false 
}) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen && duration > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onCloseRef.current(), duration);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [isOpen, message, duration]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <div 
        className={`
          pointer-events-auto px-4 py-2.5 rounded-full shadow-lg
          ${isLight ? 'bg-zinc-800 text-white' : 'bg-zinc-800 text-white'}
          animate-toast-down
        `}
      >
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};
