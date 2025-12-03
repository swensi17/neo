import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

interface OfflineIndicatorProps {
  isLight?: boolean;
  lang?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isLight = false, lang = 'en' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Don't show anything if online and not just reconnected
  if (isOnline && !showReconnected) return null;

  const isRu = lang === 'ru';

  return (
    <div 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2.5 rounded-full flex items-center gap-2 shadow-lg transition-all duration-300 animate-slide-down ${
        isOnline 
          ? 'bg-green-500 text-white' 
          : (isLight ? 'bg-gray-900 text-white' : 'bg-white text-black')
      }`}
      style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
    >
      {isOnline ? (
        <>
          <Wifi size={16} />
          <span className="text-sm font-medium">
            {isRu ? 'Подключено' : 'Back online'}
          </span>
        </>
      ) : (
        <>
          <WifiOff size={16} className="animate-pulse" />
          <span className="text-sm font-medium">
            {isRu ? 'Нет подключения' : 'No connection'}
          </span>
        </>
      )}
    </div>
  );
};
