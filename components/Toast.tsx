import React, { useEffect } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

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
  duration = 3000,
  isLight = false 
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const icons = {
    success: <Check size={14} />,
    error: <AlertCircle size={14} />,
    info: <Info size={14} />
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <>
      {/* Desktop: top-right corner */}
      <div className="hidden md:block fixed top-4 right-4 z-[200] pointer-events-none">
        <div 
          className={`
            pointer-events-auto rounded-xl shadow-lg overflow-hidden
            ${isLight ? 'bg-white border border-gray-200' : 'bg-zinc-900 border border-white/10'}
            animate-toast-in
          `}
        >
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <div className={`${colors[type]} p-1.5 rounded-full text-white flex-shrink-0`}>
              {icons[type]}
            </div>
            <p className={`text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {message}
            </p>
          </div>
          <div className={`h-0.5 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
            <div 
              className={`h-full ${colors[type]} animate-shrink`}
              style={{ animationDuration: `${duration}ms` }}
            />
          </div>
        </div>
      </div>

      {/* Mobile: bottom center */}
      <div className="md:hidden fixed bottom-24 left-4 right-4 z-[200] pointer-events-none flex justify-center">
        <div 
          className={`
            pointer-events-auto rounded-xl shadow-lg overflow-hidden
            ${isLight ? 'bg-white border border-gray-200' : 'bg-zinc-900 border border-white/10'}
            animate-toast-up
          `}
        >
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <div className={`${colors[type]} p-1.5 rounded-full text-white flex-shrink-0`}>
              {icons[type]}
            </div>
            <p className={`text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {message}
            </p>
          </div>
          <div className={`h-0.5 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
            <div 
              className={`h-full ${colors[type]} animate-shrink`}
              style={{ animationDuration: `${duration}ms` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
