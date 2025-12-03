import React, { useState, useRef, useEffect } from 'react';
import { Mic, Plus, StopCircle, X, AudioLines, ArrowUp, ArrowDown, Zap, BookOpen, FlaskConical, Camera, Image as ImageIcon, FileText, Globe, Sparkles, ChevronRight, Check, Maximize2, Minimize2 } from 'lucide-react';
import { Attachment, ChatMode, TRANSLATIONS, InterfaceLanguage } from '../types';
import { haptic } from '../utils/haptic';
import { CameraModal } from './CameraModal';



// Draggable Bottom Sheet Component
interface DraggableSheetProps {
  children: React.ReactNode;
  isLight: boolean;
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

const DraggableSheet: React.FC<DraggableSheetProps> = ({ children, isLight, onClose, menuRef }) => {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Delay enabling close on overlay to prevent immediate close on mobile
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Global mouse/touch move handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientY: number) => {
      const delta = clientY - startY.current;
      // Only allow dragging down (positive delta) or slightly up
      setTranslateY(Math.max(-50, delta));
    };

    const handleEnd = () => {
      setIsDragging(false);
      // If dragged down more than 100px, close
      if (translateY > 100) {
        onClose();
      } else {
        setTranslateY(0);
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY);
    const onMouseUp = () => handleEnd();
    const onTouchEnd = () => handleEnd();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, translateY, onClose]);

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
  };

  return (
    <>
      {/* Mobile: full screen overlay */}
      <div className="md:hidden fixed inset-0 z-[100] flex flex-col justify-end">
        <div 
          className="absolute inset-0 bg-black/70" 
          onClick={() => isReady && onClose()} 
          onTouchEnd={(e) => { if (isReady) { e.preventDefault(); onClose(); } }}
        />
        <div 
          ref={(el) => {
            (sheetRef as any).current = el;
            if (menuRef) (menuRef as any).current = el;
          }}
          className={`relative ${isLight ? 'bg-zinc-100' : 'bg-[#0a0a0a]'} rounded-t-[16px] animate-slide-up w-full`}
          style={{ 
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            transform: `translateY(${translateY}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}>
          {/* Drag Handle */}
          <div 
            className="flex justify-center pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientY); }}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          >
            <div className={`w-8 h-1 rounded-full ${isLight ? 'bg-zinc-400' : 'bg-zinc-700'}`} />
          </div>
          {children}
        </div>
      </div>

      {/* Desktop: positioned above input - compact width */}
      <div className="hidden md:block absolute bottom-full left-0 mb-2 z-[100]">
        <div 
          ref={(el) => {
            if (menuRef) (menuRef as any).current = el;
          }}
          className={`${isLight ? 'bg-zinc-100' : 'bg-[#0a0a0a]'} rounded-xl animate-slide-up w-[320px] border ${isLight ? 'border-zinc-200' : 'border-zinc-800/50'} shadow-xl`}
          style={{ paddingBottom: '12px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top padding instead of drag handle */}
          <div className="pt-1.5" />
          {children}
        </div>
      </div>
      {/* Desktop backdrop */}
      <div className="hidden md:block fixed inset-0 z-[99]" onClick={onClose} />
    </>
  );
};

// Close Button Component
interface CloseButtonProps {
  onClick: () => void;
  isLight: boolean;
  isBack?: boolean;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClick, isLight, isBack = false }) => {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick();
  };

  return (
    <button 
      onClick={handleClick}
      onTouchEnd={handleClick}
      className={`w-8 h-8 flex items-center justify-center rounded-full ${isLight ? 'bg-zinc-200 active:bg-zinc-300' : 'bg-[#1a1a1a] active:bg-zinc-800'} transition-colors z-10`}
    >
      {isBack ? (
        <ChevronRight size={18} strokeWidth={2} className={`${isLight ? 'text-zinc-700' : 'text-zinc-400'} rotate-180`} />
      ) : (
        <ArrowDown size={18} strokeWidth={2} className={isLight ? 'text-zinc-700' : 'text-zinc-400'} />
      )}
    </button>
  );
};

// Mobile Expanded Sheet with swipe to close
interface MobileExpandedSheetProps {
  isLight: boolean;
  onClose: () => void;
  text_color: string;
  textMuted: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  onSend: () => void;
  canSend: boolean;
  sendLabel: string;
}

const MobileExpandedSheet: React.FC<MobileExpandedSheetProps> = ({
  isLight, onClose, text_color, value, onChange, placeholder, onSend, canSend, sendLabel
}) => {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.visualViewport?.height || window.innerHeight);
  const startY = useRef(0);

  // Track keyboard open/close via visualViewport
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      setViewportHeight(viewport.height);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientY: number) => {
      const delta = clientY - startY.current;
      setTranslateY(Math.max(0, delta));
    };

    const handleEnd = () => {
      setIsDragging(false);
      if (translateY > 120) {
        onClose();
      } else {
        setTranslateY(0);
      }
    };

    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, translateY, onClose]);

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
  };

  // Calculate if keyboard is open (viewport significantly smaller than window)
  const keyboardOpen = viewportHeight < window.innerHeight * 0.75;

  return (
    <div className="md:hidden fixed inset-0 z-[200]">
      {/* Dark overlay behind */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      {/* Sheet container - adapts to keyboard */}
      <div 
        className={`absolute inset-x-0 flex flex-col ${isLight ? 'bg-white border-t-2 border-x-2 border-gray-300' : 'bg-black border-t border-x border-zinc-700'} rounded-t-[20px] overflow-hidden`}
        style={{ 
          top: keyboardOpen ? '0' : '80px',
          height: viewportHeight - (keyboardOpen ? 0 : 0),
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out, top 0.2s ease-out'
        }}
      >
        {/* Drag handle area */}
        <div 
          className="flex items-center justify-between px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        >
          <div className="w-8" />
          <div className={`w-10 h-1 rounded-full ${isLight ? 'bg-zinc-300' : 'bg-zinc-600'}`} />
          <button
            onClick={onClose}
            className={`${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-500 hover:text-zinc-300'} transition-colors`}
          >
            <Minimize2 size={20} />
          </button>
        </div>
        
        {/* Textarea */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
          placeholder={placeholder}
          autoFocus
          className={`flex-1 w-full bg-transparent ${text_color} placeholder-zinc-500 focus:outline-none text-[16px] leading-7 resize-none px-4 py-2 overflow-y-auto`}
          style={{ fontSize: '16px' }}
        />
        
        {/* Bottom bar */}
        <div className={`flex items-center justify-end gap-2 px-4 py-3 border-t ${isLight ? 'border-gray-200' : 'border-zinc-800'}`} style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={onSend}
            disabled={!canSend}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              canSend
                ? (isLight ? 'bg-gray-900 text-white' : 'bg-white text-black')
                : (isLight ? 'bg-gray-200 text-gray-400' : 'bg-zinc-800 text-zinc-600')
            }`}
          >
            {sendLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const STORAGE_KEY = 'neo_input_settings';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[], webSearch: boolean, mode: ChatMode, responseLength: 'brief' | 'balanced' | 'detailed') => void;
  onStop: () => void;
  onStartLiveMode: () => void;
  onInputFocus?: () => void;
  isStreaming: boolean;
  language: InterfaceLanguage;
  placeholderText: string;
  isLight?: boolean;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  // Edit mode props
  editingMessageId?: string | null;
  editingText?: string;
  onEditingTextChange?: (text: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSend, onStop, onStartLiveMode, onInputFocus, isStreaming, language, placeholderText, isLight = false, fileInputRef: externalFileInputRef,
  editingMessageId, editingText, onEditingTextChange, onSaveEdit, onCancelEdit
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  // Single state for menu: null = closed, 'add' = main menu, 'style' = style selection, 'length' = length selection
  const [menuPage, setMenuPage] = useState<'add' | 'style' | 'length' | null>(null);
  // Expanded input mode for long text
  const [isExpanded, setIsExpanded] = useState(false);
  // Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Load saved settings
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { 
          webSearch: parsed.webSearch ?? false, 
          mode: parsed.mode ?? ChatMode.STANDARD, 
          responseLength: parsed.responseLength ?? 'balanced' 
        };
      }
    } catch (e) {}
    return { webSearch: false, mode: ChatMode.STANDARD, responseLength: 'balanced' as const };
  };
  
  const [settings, setSettings] = useState(loadSettings);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = externalFileInputRef || internalFileInputRef;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];
  const isRu = language === 'ru';

  // Theme - matte black style
  const bg = isLight ? 'bg-white' : 'bg-black';
  const bgCard = isLight ? 'bg-gray-100' : 'bg-[#1a1a1a]';
  const text_color = isLight ? 'text-gray-900' : 'text-white';
  const textMuted = isLight ? 'text-gray-500' : 'text-zinc-500';
  const divider = isLight ? 'border-gray-200' : 'border-zinc-800';

  // Save settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);



  // Auto-resize textarea - works for both normal and edit mode
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text, editingText, editingMessageId]);

  const handleSend = () => {
    const trimmedText = text.trim();
    if ((!trimmedText && attachments.length === 0) || isStreaming) return;
    haptic.medium();
    const effectiveLength = (settings.mode === ChatMode.RESEARCH || settings.mode === ChatMode.LABS) ? 'balanced' : settings.responseLength;
    const effectiveSearch = settings.mode === ChatMode.RESEARCH ? true : settings.webSearch;
    onSend(trimmedText, attachments, effectiveSearch, settings.mode, effectiveLength);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          data: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    setMenuPage(null);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Voice recording state
  const [interimText, setInterimText] = useState('');
  
  // Stop dictation
  const stopDictation = () => {
    haptic.medium();
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText('');
  };

  // Start dictation with auto language detection
  const startDictation = () => {
    haptic.medium(); // Vibration on start
    
    if (isRecording) {
      stopDictation();
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isRu ? 'Распознавание речи не поддерживается' : 'Speech recognition not supported');
      return;
    }
    
    const recognition = new SpeechRecognition();
    
    // Auto-detect language - use multiple languages
    // Setting to empty or specific codes for better multilingual support
    recognition.lang = ''; // Empty = auto-detect (works on some browsers)
    
    // Fallback: try to detect from browser/system
    const browserLang = navigator.language || 'en-US';
    if (browserLang.startsWith('ru')) recognition.lang = 'ru-RU';
    else if (browserLang.startsWith('en')) recognition.lang = 'en-US';
    else if (browserLang.startsWith('uk')) recognition.lang = 'uk-UA';
    else if (browserLang.startsWith('de')) recognition.lang = 'de-DE';
    else if (browserLang.startsWith('fr')) recognition.lang = 'fr-FR';
    else if (browserLang.startsWith('es')) recognition.lang = 'es-ES';
    else if (browserLang.startsWith('it')) recognition.lang = 'it-IT';
    else if (browserLang.startsWith('pt')) recognition.lang = 'pt-PT';
    else if (browserLang.startsWith('zh')) recognition.lang = 'zh-CN';
    else if (browserLang.startsWith('ja')) recognition.lang = 'ja-JP';
    else if (browserLang.startsWith('ko')) recognition.lang = 'ko-KR';
    else if (browserLang.startsWith('ar')) recognition.lang = 'ar-SA';
    else if (browserLang.startsWith('hi')) recognition.lang = 'hi-IN';
    else if (browserLang.startsWith('tr')) recognition.lang = 'tr-TR';
    else recognition.lang = browserLang;
    
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Show interim results
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsRecording(true);
      setInterimText('');
      haptic.light();
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
      haptic.light();
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setInterimText('');
      if (event.error === 'not-allowed') {
        alert(isRu ? 'Разрешите доступ к микрофону' : 'Please allow microphone access');
      }
    };
    
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Add punctuation if missing at the end
          let processed = transcript.trim();
          if (processed && !/[.!?,:;]$/.test(processed)) {
            // Check if it's a question (starts with question words)
            const questionWords = ['что', 'как', 'где', 'когда', 'почему', 'зачем', 'кто', 'какой', 'сколько', 'what', 'how', 'where', 'when', 'why', 'who', 'which'];
            const isQuestion = questionWords.some(w => processed.toLowerCase().startsWith(w));
            processed += isQuestion ? '?' : '.';
          }
          // Capitalize first letter
          processed = processed.charAt(0).toUpperCase() + processed.slice(1);
          final += processed + ' ';
        } else {
          interim = transcript;
        }
      }
      
      if (final) {
        setText(prev => (prev ? prev + ' ' : '') + final.trim());
        haptic.light(); // Light vibration on each recognized phrase
      }
      setInterimText(interim);
    };
    
    recognitionRef.current = recognition;
    recognition.start();
    setMenuPage(null);
  };

  const getModeLabel = () => {
    switch (settings.mode) {
      case ChatMode.RESEARCH: return isRu ? 'Исследование' : 'Research';
      case ChatMode.LABS: return isRu ? 'Лаборатория' : 'Labs';
      default: return isRu ? 'Стандарт' : 'Normal';
    }
  };

  // Supported file types
  const SUPPORTED_ACCEPT = "image/*,audio/*,video/*,.pdf,.txt,.md,.json,.xml,.html,.css,.js,.ts,.py,.java,.c,.cpp,.h,.hpp,.rb,.go,.rs,.php,.swift,.kt,.csv,.yaml,.yml,.toml,.ini,.cfg,.sh,.bash,.sql";

  return (
    <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-2 pb-2 relative">
      {/* Hidden inputs */}
      <input type="file" ref={fileInputRef} className="hidden" multiple accept={SUPPORTED_ACCEPT} onChange={(e) => handleFileSelect(e, 'file')} />
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleFileSelect(e, 'image')} />

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-3 pb-1 scrollbar-hide">
          {attachments.map((att, i) => (
            <div key={i} className={`relative ${bgCard} rounded-xl overflow-hidden flex-shrink-0 group`}>
              <button onClick={() => removeAttachment(i)} className="absolute top-1 right-1 z-10 bg-black/60 text-white rounded-full p-1">
                <X size={12} />
              </button>
              {att.mimeType.startsWith('image/') ? (
                <img src={att.data} alt={att.name} className="h-16 w-16 object-cover" />
              ) : (
                <div className="h-16 w-24 flex flex-col items-center justify-center p-2">
                  <FileText size={20} className={textMuted} />
                  <span className={`text-[10px] ${textMuted} truncate w-full text-center mt-1`}>{att.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Unified Menu Modal - Single DraggableSheet with page switching */}
      {menuPage && (
        <DraggableSheet isLight={isLight} onClose={() => setMenuPage(null)} menuRef={menuRef}>
          {/* Add to Chat Page */}
          {menuPage === 'add' && (
            <>
              <div className="flex items-center px-4 pb-2">
                <CloseButton onClick={() => setMenuPage(null)} isLight={isLight} />
                <span className={`flex-1 text-center text-[15px] font-medium ${text_color} -ml-8`}>
                  {isRu ? 'Добавить в чат' : 'Add to Chat'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 px-4 pb-2">
                <button onClick={() => { setMenuPage(null); setIsCameraOpen(true); }}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3.5 ${isLight ? 'bg-white' : 'bg-[#111111]'} rounded-xl active:opacity-70`}>
                  <Camera size={22} className={isLight ? 'text-zinc-600' : 'text-zinc-500'} />
                  <span className={`text-[12px] ${text_color}`}>{isRu ? 'Камера' : 'Camera'}</span>
                </button>
                <button onClick={() => { imageInputRef.current?.click(); setMenuPage(null); }}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3.5 ${isLight ? 'bg-white' : 'bg-[#111111]'} rounded-xl active:opacity-70`}>
                  <ImageIcon size={22} className={isLight ? 'text-zinc-600' : 'text-zinc-500'} />
                  <span className={`text-[12px] ${text_color}`}>{isRu ? 'Фото' : 'Photos'}</span>
                </button>
                <button onClick={() => { fileInputRef.current?.click(); setMenuPage(null); }}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3.5 ${isLight ? 'bg-white' : 'bg-[#111111]'} rounded-xl active:opacity-70`}>
                  <FileText size={22} className={isLight ? 'text-zinc-600' : 'text-zinc-500'} />
                  <span className={`text-[12px] ${text_color}`}>{isRu ? 'Файлы' : 'Files'}</span>
                </button>
              </div>
              <div className={`mx-4 mb-1.5 flex items-center justify-between py-2.5 px-3.5 ${isLight ? 'bg-white' : 'bg-[#111111]'} rounded-xl`}>
                <div className="flex items-center gap-2.5">
                  <Globe size={18} className={isLight ? 'text-zinc-600' : 'text-zinc-500'} />
                  <span className={`text-[14px] ${text_color}`}>{isRu ? 'Веб-поиск' : 'Web search'}</span>
                </div>
                <button onClick={() => {
                  const newSettings = { ...settings, webSearch: !settings.webSearch };
                  setSettings(newSettings);
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
                }}
                  className={`w-[44px] h-[26px] rounded-full p-[2px] transition-all ${settings.webSearch ? 'bg-blue-500' : (isLight ? 'bg-zinc-300' : 'bg-zinc-700')}`}>
                  <div className={`w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform ${settings.webSearch ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                </button>
              </div>
              <button 
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setMenuPage('style'); }}
                onClick={(e) => { e.stopPropagation(); setMenuPage('style'); }}
                className={`mx-4 mb-1.5 w-[calc(100%-32px)] flex items-center justify-between py-2.5 px-3.5 ${isLight ? 'bg-white' : 'bg-[#111111]'} rounded-xl active:opacity-70 touch-manipulation`}>
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className={isLight ? 'text-zinc-600' : 'text-zinc-500'} />
                  <span className={`text-[14px] ${text_color}`}>{isRu ? 'Режим' : 'Mode'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[14px] ${textMuted}`}>{getModeLabel()}</span>
                  <ChevronRight size={16} className={textMuted} />
                </div>
              </button>
              <button 
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setMenuPage('length'); }}
                onClick={(e) => { e.stopPropagation(); setMenuPage('length'); }}
                className={`mx-4 w-[calc(100%-32px)] flex items-center justify-between py-2.5 px-3.5 ${isLight ? 'bg-white' : 'bg-[#111111]'} rounded-xl active:opacity-70 touch-manipulation`}>
                <div className="flex items-center gap-2.5">
                  <Zap size={18} className={isLight ? 'text-zinc-600' : 'text-zinc-500'} />
                  <span className={`text-[14px] ${text_color}`}>{isRu ? 'Длина ответа' : 'Response length'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[14px] ${textMuted}`}>
                    {settings.responseLength === 'brief' ? (isRu ? 'Краткий' : 'Brief') : 
                     settings.responseLength === 'detailed' ? (isRu ? 'Подробный' : 'Detailed') : 
                     (isRu ? 'Баланс' : 'Balanced')}
                  </span>
                  <ChevronRight size={16} className={textMuted} />
                </div>
              </button>
            </>
          )}

          {/* Style Selection Page */}
          {menuPage === 'style' && (
            <>
              <div className="flex items-center px-4 pb-2">
                <CloseButton onClick={() => setMenuPage('add')} isLight={isLight} isBack />
                <span className={`flex-1 text-center text-[15px] font-medium ${text_color} -ml-9`}>
                  {isRu ? 'Выбрать режим' : 'Choose style'}
                </span>
              </div>
              <div className={`mx-4 rounded-xl overflow-hidden ${isLight ? 'bg-white' : 'bg-[#111111]'}`}>
                {[
                  { mode: ChatMode.STANDARD, icon: <Zap size={16} />, label: isRu ? 'Стандарт' : 'Normal' },
                  { mode: ChatMode.RESEARCH, icon: <BookOpen size={16} />, label: isRu ? 'Исследование' : 'Research' },
                  { mode: ChatMode.LABS, icon: <FlaskConical size={16} />, label: isRu ? 'Лаборатория' : 'Labs' },
                ].map((item, i, arr) => (
                  <button key={item.mode}
                    onClick={() => { 
                      const newSettings = { ...settings, mode: item.mode };
                      setSettings(newSettings);
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
                      setMenuPage('add'); 
                    }}
                    className={`w-full flex items-center justify-between py-2.5 px-3.5 active:opacity-70 touch-manipulation ${i < arr.length - 1 ? (isLight ? 'border-b border-zinc-100' : 'border-b border-zinc-800/50') : ''}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={isLight ? 'text-zinc-500' : 'text-zinc-500'}>{item.icon}</span>
                      <span className={`text-[14px] ${text_color}`}>{item.label}</span>
                    </div>
                    {settings.mode === item.mode && <Check size={18} className="text-blue-500" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Length Selection Page */}
          {menuPage === 'length' && (
            <>
              <div className="flex items-center px-4 pb-2">
                <CloseButton onClick={() => setMenuPage('add')} isLight={isLight} isBack />
                <span className={`flex-1 text-center text-[15px] font-medium ${text_color} -ml-9`}>
                  {isRu ? 'Длина ответа' : 'Response length'}
                </span>
              </div>
              <div className={`mx-4 rounded-xl overflow-hidden ${isLight ? 'bg-white' : 'bg-[#111111]'}`}>
                {[
                  { value: 'brief' as const, label: isRu ? 'Краткий' : 'Brief' },
                  { value: 'balanced' as const, label: isRu ? 'Баланс' : 'Balanced' },
                  { value: 'detailed' as const, label: isRu ? 'Подробный' : 'Detailed' },
                ].map((item, i, arr) => (
                  <button key={item.value}
                    onClick={() => { 
                      const newSettings = { ...settings, responseLength: item.value };
                      setSettings(newSettings);
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
                      setMenuPage('add'); 
                    }}
                    className={`w-full flex items-center justify-between py-2.5 px-3.5 active:opacity-70 touch-manipulation ${i < arr.length - 1 ? (isLight ? 'border-b border-zinc-100' : 'border-b border-zinc-800/50') : ''}`}>
                    <span className={`text-[14px] ${text_color}`}>{item.label}</span>
                    {settings.responseLength === item.value && <Check size={18} className="text-blue-500" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </DraggableSheet>
      )}

      {/* Edit Mode Indicator */}
      {editingMessageId && (
        <div className={`flex items-center gap-3 mb-2 px-3 py-2.5 rounded-xl ${isLight ? 'bg-gray-100 border border-gray-200' : 'bg-[#1a1a1a] border border-zinc-800'}`}>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-medium ${textMuted} mb-0.5`}>
              {isRu ? 'Редактирование' : 'Editing'}
            </div>
            <div className={`text-sm ${text_color} line-clamp-2`}>
              {editingText || ''}
            </div>
          </div>
          <button
            onClick={onCancelEdit}
            className={`p-2 rounded-full ${isLight ? 'hover:bg-gray-200' : 'hover:bg-zinc-800'} transition-colors flex-shrink-0`}
          >
            <X size={16} className={textMuted} />
          </button>
        </div>
      )}

      {/* Expanded Input Modal - Telegram style */}
      {isExpanded && (
        <>
          {/* Mobile: sheet with rounded top, swipe to close */}
          <MobileExpandedSheet 
            isLight={isLight}
            onClose={() => setIsExpanded(false)}
            text_color={text_color}
            textMuted={textMuted}
            value={editingMessageId ? (editingText || '') : text}
            onChange={(val) => editingMessageId ? onEditingTextChange?.(val) : setText(val)}
            placeholder={editingMessageId ? (isRu ? 'Редактировать сообщение...' : 'Edit message...') : placeholderText}
            onSend={() => {
              if (editingMessageId) {
                onSaveEdit?.();
              } else {
                handleSend();
              }
              setIsExpanded(false);
            }}
            canSend={!!(editingMessageId ? editingText?.trim() : (text.trim() || attachments.length > 0))}
            sendLabel={editingMessageId ? (isRu ? 'Сохранить' : 'Save') : (isRu ? 'Отправить' : 'Send')}
          />

          {/* Desktop: wide modal like Telegram */}
          <div className="hidden md:flex fixed inset-0 z-[200] items-center justify-center" onClick={() => setIsExpanded(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div 
              className={`relative w-full max-w-4xl mx-4 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'} rounded-2xl shadow-2xl overflow-hidden animate-slide-up`}
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: 'calc(100vh - 120px)' }}
            >
              {/* Close button - top right */}
              <button
                onClick={() => setIsExpanded(false)}
                className={`absolute top-3 right-3 p-2 rounded-full ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'} transition-colors z-10`}
              >
                <X size={18} />
              </button>
              
              {/* Textarea */}
              <textarea
                value={editingMessageId ? (editingText || '') : text}
                onChange={(e) => editingMessageId ? onEditingTextChange?.(e.target.value) : setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsExpanded(false);
                  }
                }}
                placeholder={editingMessageId ? (isRu ? 'Редактировать сообщение...' : 'Edit message...') : placeholderText}
                autoFocus
                className={`w-full bg-transparent ${text_color} placeholder-zinc-500 focus:outline-none text-[16px] leading-7 resize-none p-4 pt-14 min-h-[200px] max-h-[60vh] overflow-y-auto`}
                style={{ fontSize: '16px' }}
              />
              
              {/* Bottom bar with send button */}
              <div className={`flex items-center justify-end gap-2 px-4 py-3 border-t ${isLight ? 'border-gray-200' : 'border-zinc-800'}`}>
                <button
                  onClick={() => {
                    if (editingMessageId) {
                      onSaveEdit?.();
                    } else {
                      handleSend();
                    }
                    setIsExpanded(false);
                  }}
                  disabled={!(editingMessageId ? editingText?.trim() : (text.trim() || attachments.length > 0))}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                    (editingMessageId ? editingText?.trim() : (text.trim() || attachments.length > 0))
                      ? (isLight ? 'bg-gray-900 text-white' : 'bg-white text-black')
                      : (isLight ? 'bg-gray-200 text-gray-400' : 'bg-zinc-800 text-zinc-600')
                  }`}
                >
                  {editingMessageId ? (isRu ? 'Сохранить' : 'Save') : (isRu ? 'Отправить' : 'Send')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Input Bar - ChatGPT style thin bar */}
      <div className="flex items-center gap-2">
        {/* Plus Button - Hidden in edit mode */}
        {!editingMessageId && (
          <button
            onClick={() => setMenuPage(menuPage ? null : 'add')}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
              isLight ? 'bg-gray-200 text-gray-600' : 'bg-[#111111] text-zinc-500'
            } ${menuPage ? (isLight ? 'bg-gray-300' : 'bg-zinc-800 text-white') : ''}`}
          >
            <Plus size={20} strokeWidth={1.5} />
          </button>
        )}

        {/* Main Input Container - matte black, same height as plus button */}
        <div className={`relative flex-1 ${isLight ? 'bg-gray-100' : 'bg-[#111111]'} rounded-full flex items-center px-3.5 min-h-[40px] ${editingMessageId ? (isLight ? 'border border-gray-300' : 'border border-zinc-800') : ''}`}>
          {/* Expand button - show when text has 4+ lines (newlines) */}
          {(((editingMessageId ? editingText : text) || '').split('\n').length >= 4) && (
            <button
              onClick={() => setIsExpanded(true)}
              className={`absolute top-2 right-2 p-1 ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-500 hover:text-zinc-300'} transition-colors z-10`}
            >
              <Maximize2 size={16} />
            </button>
          )}
          <textarea
            ref={textareaRef}
            value={editingMessageId ? (editingText || '') : text}
            onChange={(e) => editingMessageId ? onEditingTextChange?.(e.target.value) : setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (editingMessageId) {
                  haptic.medium();
                  onSaveEdit?.();
                } else {
                  handleSend();
                }
              }
              if (e.key === 'Escape' && editingMessageId) {
                onCancelEdit?.();
              }
            }}
            onFocus={onInputFocus}
            placeholder={editingMessageId ? (isRu ? 'Редактировать сообщение...' : 'Edit message...') : placeholderText}
            rows={1}
            className={`flex-1 w-full bg-transparent ${text_color} placeholder-zinc-500 focus:outline-none max-h-32 scrollbar-hide text-[15px] leading-[22px] resize-none py-[11px] text-left`}
            style={{ fontSize: '15px' }}
          />

          {/* Right Icons */}
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {editingMessageId ? (
              /* Edit mode: show send arrow to save */
              <button 
                onClick={() => { haptic.medium(); onSaveEdit?.(); }} 
                disabled={!editingText?.trim()}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  editingText?.trim() 
                    ? (isLight ? 'bg-gray-900 text-white' : 'bg-white text-black') 
                    : (isLight ? 'bg-gray-300 text-gray-400' : 'bg-zinc-700 text-zinc-500')
                }`}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            ) : isStreaming ? (
              <button onClick={onStop} className="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full">
                <StopCircle size={14} fill="currentColor" />
              </button>
            ) : text.trim() || attachments.length > 0 ? (
              <button onClick={handleSend} className={`w-7 h-7 flex items-center justify-center rounded-full ${isLight ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            ) : (
              <>
                <button
                  onClick={startDictation}
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : textMuted}`}
                >
                  <Mic size={16} />
                </button>
                <button
                  onClick={onStartLiveMode}
                  className={`w-7 h-7 flex items-center justify-center rounded-full ${isLight ? 'bg-gray-200' : 'bg-zinc-800'}`}
                >
                  <AudioLines size={16} className={text_color} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(attachment) => {
          setAttachments(prev => [...prev, attachment]);
        }}
        isLight={isLight}
        language={isRu ? 'ru' : 'en'}
      />
    </div>
  );
};
