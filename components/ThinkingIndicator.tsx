import React from 'react';
import { ChatMode } from '../types';

interface ThinkingIndicatorProps {
  mode: ChatMode;
  lang?: string;
  isLight?: boolean;
  sourcesCount?: number;
  isSearching?: boolean;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ 
  lang = 'ru', 
  isLight = false,
  isSearching = false
}) => {
  const isRu = lang === 'ru';

  // Simple GPT-style pulsing dot
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="relative w-3 h-3">
        <span 
          className="absolute inset-0 rounded-full"
          style={{ 
            backgroundColor: isLight ? '#000000' : '#ffffff',
            animation: 'chatgpt-pulse 2s ease-in-out infinite'
          }} 
        />
      </div>
      {/* Show searching text only when web search is active */}
      {isSearching && (
        <span className={`text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
          {isRu ? 'Поиск в интернете...' : 'Searching the web...'}
        </span>
      )}
      <style>{`
        @keyframes chatgpt-pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.4; 
            transform: scale(0.85);
          }
        }
      `}</style>
    </div>
  );
};
