import React, { useState, useEffect } from 'react';
import { ChatMode } from '../types';
import { Sparkles, BookOpen, Search, Globe, FileText, Brain, Zap } from 'lucide-react';

interface ThinkingIndicatorProps {
  mode: ChatMode;
  lang?: string;
  isLight?: boolean;
  sourcesCount?: number;
}

// Animated atom/orbital logo component - like the image
const AnimatedLogo = ({ isLight }: { isLight: boolean }) => {
  const strokeColor = isLight ? '#374151' : '#71717a';
  const dotColor = isLight ? '#374151' : '#a1a1aa';
  
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg viewBox="0 0 48 48" className="w-full h-full">
        {/* Orbital rings with animation */}
        <g className="animate-spin-slow" style={{ transformOrigin: 'center' }}>
          <ellipse cx="24" cy="24" rx="18" ry="7" fill="none" stroke={strokeColor} strokeWidth="1.5" 
            style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
        </g>
        <g className="animate-spin-slow" style={{ transformOrigin: 'center', animationDirection: 'reverse', animationDuration: '12s' }}>
          <ellipse cx="24" cy="24" rx="18" ry="7" fill="none" stroke={strokeColor} strokeWidth="1.5" 
            style={{ transform: 'rotate(45deg)', transformOrigin: 'center' }} />
        </g>
        <g className="animate-spin-slow" style={{ transformOrigin: 'center', animationDuration: '10s' }}>
          <ellipse cx="24" cy="24" rx="18" ry="7" fill="none" stroke={strokeColor} strokeWidth="1.5" 
            style={{ transform: 'rotate(0deg)', transformOrigin: 'center' }} />
        </g>
        {/* Center pulsing dot */}
        <circle cx="24" cy="24" r="3" fill={dotColor} className="animate-pulse" />
        {/* Orbiting dots */}
        <g className="animate-spin-slow" style={{ transformOrigin: 'center' }}>
          <circle cx="42" cy="24" r="2" fill={dotColor} className="animate-pulse" />
        </g>
        <g className="animate-spin-slow" style={{ transformOrigin: 'center', animationDirection: 'reverse' }}>
          <circle cx="6" cy="24" r="2" fill={dotColor} className="animate-pulse" style={{ animationDelay: '0.5s' }} />
        </g>
      </svg>
    </div>
  );
};

// Progress stages for different modes
const getThinkingStages = (mode: ChatMode, lang: string) => {
  const isRu = lang === 'ru';
  
  if (mode === ChatMode.LABS) {
    return isRu ? [
      { text: 'Активно...', icon: Brain },
      { text: 'Анализирую запрос...', icon: Search },
      { text: 'Генерирую решение...', icon: Zap },
      { text: 'Создаю артефакт...', icon: FileText },
      { text: 'Финализирую...', icon: Sparkles },
    ] : [
      { text: 'Active...', icon: Brain },
      { text: 'Analyzing request...', icon: Search },
      { text: 'Generating solution...', icon: Zap },
      { text: 'Creating artifact...', icon: FileText },
      { text: 'Finalizing...', icon: Sparkles },
    ];
  }
  
  if (mode === ChatMode.RESEARCH) {
    return isRu ? [
      { text: 'Активно...', icon: Brain },
      { text: 'Поиск источников...', icon: Search },
      { text: 'Анализ данных...', icon: Globe },
      { text: 'Синтез информации...', icon: BookOpen },
      { text: 'Формирую отчёт...', icon: FileText },
    ] : [
      { text: 'Active...', icon: Brain },
      { text: 'Searching sources...', icon: Search },
      { text: 'Analyzing data...', icon: Globe },
      { text: 'Synthesizing info...', icon: BookOpen },
      { text: 'Generating report...', icon: FileText },
    ];
  }
  
  // Standard mode
  return isRu ? [
    { text: 'Думаю...', icon: Brain },
  ] : [
    { text: 'Thinking...', icon: Brain },
  ];
};

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ 
  mode, 
  lang = 'ru', 
  isLight = false,
  sourcesCount = 0
}) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [dots, setDots] = useState('');
  const stages = getThinkingStages(mode, lang);
  
  // Animate dots
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(dotsInterval);
  }, []);
  
  // Progress through stages for Labs and Research
  useEffect(() => {
    if (mode === ChatMode.STANDARD) return;
    
    const stageInterval = setInterval(() => {
      setStageIndex(prev => (prev + 1) % stages.length);
    }, 3000);
    
    return () => clearInterval(stageInterval);
  }, [mode, stages.length]);
  
  const currentStage = stages[stageIndex];
  const isRu = lang === 'ru';
  
  // Theme classes
  const textSecondary = isLight ? 'text-gray-500' : 'text-white/50';

  // Standard mode - simple indicator
  if (mode === ChatMode.STANDARD) {
    return (
      <div className="flex items-center gap-3 py-4">
        <div className={`flex items-center gap-2 ${textSecondary}`}>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // Labs and Research - full thinking UI (like the image with "Активен...")
  return (
    <div className="py-4">
      <div className="flex items-center gap-4">
        {/* Animated Logo */}
        <AnimatedLogo isLight={isLight} />
        
        {/* Status Text - Large italic style like the image */}
        <div className="flex-1">
          <span className={`text-xl font-light italic tracking-wide ${textSecondary}`} style={{ fontFamily: 'Georgia, serif' }}>
            {currentStage.text.replace('...', '')}{dots}
          </span>
          
          {/* Progress info for Research mode */}
          {mode === ChatMode.RESEARCH && sourcesCount > 0 && (
            <div className={`text-sm ${textSecondary} flex items-center gap-2 mt-2`}>
              <Globe size={12} />
              <span>
                {isRu 
                  ? `Найдено ${sourcesCount} источников` 
                  : `Found ${sourcesCount} sources`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
