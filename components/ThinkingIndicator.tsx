import React, { useState, useEffect } from 'react';
import { ChatMode } from '../types';
import { Sparkles, BookOpen, FlaskConical, Search, Globe, FileText, Brain, Zap } from 'lucide-react';

interface ThinkingIndicatorProps {
  mode: ChatMode;
  lang?: string;
  isLight?: boolean;
  sourcesCount?: number;
}

// Animated logo component
const AnimatedLogo = ({ isLight }: { isLight: boolean }) => (
  <div className="relative w-10 h-10">
    <svg viewBox="0 0 40 40" className="w-full h-full animate-spin-slow">
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isLight ? '#374151' : '#ffffff'} stopOpacity="0.8" />
          <stop offset="100%" stopColor={isLight ? '#6b7280' : '#a1a1aa'} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Orbital rings */}
      <ellipse cx="20" cy="20" rx="16" ry="6" fill="none" stroke="url(#gradient1)" strokeWidth="1.5" 
        className="animate-pulse" style={{ transformOrigin: 'center', transform: 'rotate(-30deg)' }} />
      <ellipse cx="20" cy="20" rx="16" ry="6" fill="none" stroke="url(#gradient1)" strokeWidth="1.5" 
        className="animate-pulse" style={{ transformOrigin: 'center', transform: 'rotate(30deg)', animationDelay: '0.2s' }} />
      <ellipse cx="20" cy="20" rx="16" ry="6" fill="none" stroke="url(#gradient1)" strokeWidth="1.5" 
        className="animate-pulse" style={{ transformOrigin: 'center', transform: 'rotate(90deg)', animationDelay: '0.4s' }} />
      {/* Center dot */}
      <circle cx="20" cy="20" r="3" fill={isLight ? '#374151' : '#ffffff'} className="animate-pulse" />
    </svg>
  </div>
);

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
  const Icon = currentStage.icon;
  const isRu = lang === 'ru';
  
  // Theme classes
  const textMain = isLight ? 'text-gray-800' : 'text-white';
  const textSecondary = isLight ? 'text-gray-500' : 'text-white/50';
  const bgSurface = isLight ? 'bg-gray-100' : 'bg-zinc-900';
  const border = isLight ? 'border-gray-200' : 'border-white/10';

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

  // Labs and Research - full thinking UI
  return (
    <div className="py-6">
      <div className="flex items-start gap-4">
        {/* Animated Logo */}
        <AnimatedLogo isLight={isLight} />
        
        {/* Status Text */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon size={16} className={`${textMain} animate-pulse`} />
            <span className={`text-lg font-medium ${textMain} tracking-wide`}>
              {currentStage.text.replace('...', '')}{dots}
            </span>
          </div>
          
          {/* Progress info for Research mode */}
          {mode === ChatMode.RESEARCH && sourcesCount > 0 && (
            <div className={`text-sm ${textSecondary} flex items-center gap-2`}>
              <Globe size={12} />
              <span>
                {isRu 
                  ? `Найдено ${sourcesCount} источников` 
                  : `Found ${sourcesCount} sources`}
              </span>
            </div>
          )}
          
          {/* Mode badge */}
          <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full ${bgSurface} border ${border}`}>
            {mode === ChatMode.LABS ? (
              <>
                <FlaskConical size={12} className={textSecondary} />
                <span className={`text-xs font-medium ${textSecondary}`}>
                  {isRu ? 'Лаборатория' : 'Labs'}
                </span>
              </>
            ) : (
              <>
                <BookOpen size={12} className={textSecondary} />
                <span className={`text-xs font-medium ${textSecondary}`}>
                  {isRu ? 'Исследование' : 'Research'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
