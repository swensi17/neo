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
    <div className="fixed top-16 inset-x-0 z-[200] flex justify-center pointer-events-none px-4">
      <div 
        className="pointer-events-auto px-4 py-2 rounded-full shadow-lg bg-zinc-800 text-white animate-toast-down"
      >
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};
