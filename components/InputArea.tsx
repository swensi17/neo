import React, { useState, useRef, useEffect } from 'react';
import { Mic, Plus, StopCircle, X, AudioLines, ArrowUp, ArrowDown, Zap, BookOpen, FlaskConical, Camera, Image as ImageIcon, FileText, Globe, Sparkles, ChevronRight, Check, Maximize2, Minimize2 } from 'lucide-react';
import { Attachment, ChatMode, TRANSLATIONS, InterfaceLanguage } from '../types';
import { haptic } from '../utils/haptic';



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
          className="absolute inset-0 bg-black/60" 
          onClick={() => isReady && onClose()} 
          onTouchEnd={(e) => { if (isReady) { e.preventDefault(); onClose(); } }}
        />
        <div 
          ref={(el) => {
            (sheetRef as any).current = el;
            if (menuRef) (menuRef as any).current = el;
          }}
          className={`relative ${isLight ? 'bg-zinc-100' : 'bg-[#000000]'} rounded-t-[20px] animate-slide-up w-full`}
          style={{ 
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            transform: `translateY(${translateY}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}>
          {/* Drag Handle */}
          <div 
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientY); }}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          >
            <div className={`w-9 h-1 rounded-full ${isLight ? 'bg-zinc-400' : 'bg-zinc-600'}`} />
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
          className={`${isLight ? 'bg-zinc-100' : 'bg-[#000000]'} rounded-2xl animate-slide-up w-[360px] border ${isLight ? 'border-zinc-200' : 'border-zinc-800'} shadow-xl`}
          style={{ paddingBottom: '16px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top padding instead of drag handle */}
          <div className="pt-2" />
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
      className={`w-9 h-9 flex items-center justify-center rounded-full ${isLight ? 'bg-zinc-200 active:bg-zinc-300' : 'bg-zinc-800 active:bg-zinc-700'} transition-colors z-10`}
    >
      {isBack ? (
        <ChevronRight size={20} strokeWidth={2.5} className={`${isLight ? 'text-zinc-700' : 'text-zinc-300'} rotate-180`} />
      ) : (
        <ArrowDown size={20} strokeWidth={2.5} className={isLight ? 'text-zinc-700' : 'text-zinc-300'} />
      )}
    </button>
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

  // Close menu on outside click - only for desktop, mobile uses overlay
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPage(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  // Auto-resize textarea - works for both normal and edit mode
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text, editingText, editingMessageId]);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return;
    haptic.medium();
    const effectiveLength = (settings.mode === ChatMode.RESEARCH || settings.mode === ChatMode.LABS) ? 'balanced' : settings.responseLength;
    const effectiveSearch = settings.mode === ChatMode.RESEARCH ? true : settings.webSearch;
    onSend(text, attachments, effectiveSearch, settings.mode, effectiveLength);
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

  return (
    <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-2 pb-2 relative">
      {/* Hidden inputs */}
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleFileSelect(e, 'file')} />
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
              <div className="flex items-center px-4 pb-3">
                <CloseButton onClick={() => setMenuPage(null)} isLight={isLight} />
                <span className={`flex-1 text-center text-[17px] font-semibold ${text_color} -ml-8`}>
                  {isRu ? 'Добавить в чат' : 'Add to Chat'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 px-4 pb-3">
                <button onClick={() => { imageInputRef.current?.click(); setMenuPage(null); }}
                  className={`flex flex-col items-center justify-center gap-2 py-5 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'} rounded-xl active:opacity-70`}>
                  <Camera size={26} className={isLight ? 'text-zinc-600' : 'text-zinc-400'} />
                  <span className={`text-[13px] ${text_color}`}>{isRu ? 'Камера' : 'Camera'}</span>
                </button>
                <button onClick={() => { imageInputRef.current?.click(); setMenuPage(null); }}
                  className={`flex flex-col items-center justify-center gap-2 py-5 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'} rounded-xl active:opacity-70`}>
                  <ImageIcon size={26} className={isLight ? 'text-zinc-600' : 'text-zinc-400'} />
                  <span className={`text-[13px] ${text_color}`}>{isRu ? 'Фото' : 'Photos'}</span>
                </button>
                <button onClick={() => { fileInputRef.current?.click(); setMenuPage(null); }}
                  className={`flex flex-col items-center justify-center gap-2 py-5 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'} rounded-xl active:opacity-70`}>
                  <FileText size={26} className={isLight ? 'text-zinc-600' : 'text-zinc-400'} />
                  <span className={`text-[13px] ${text_color}`}>{isRu ? 'Файлы' : 'Files'}</span>
                </button>
              </div>
              <div className={`mx-4 mb-2 flex items-center justify-between py-3.5 px-4 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'} rounded-xl`}>
                <div className="flex items-center gap-3">
                  <Globe size={22} className={isLight ? 'text-zinc-600' : 'text-zinc-400'} />
                  <span className={`text-[15px] ${text_color}`}>{isRu ? 'Веб-поиск' : 'Web search'}</span>
                </div>
                <button onClick={() => setSettings(s => ({ ...s, webSearch: !s.webSearch }))}
                  className={`w-[51px] h-[31px] rounded-full p-[2px] transition-all ${settings.webSearch ? 'bg-blue-500' : (isLight ? 'bg-zinc-300' : 'bg-zinc-700')}`}>
                  <div className={`w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-transform ${settings.webSearch ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <button 
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setMenuPage('style'); }}
                onClick={(e) => { e.stopPropagation(); setMenuPage('style'); }}
                className={`mx-4 mb-2 w-[calc(100%-32px)] flex items-center justify-between py-3.5 px-4 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'} rounded-xl active:opacity-70 touch-manipulation`}>
                <div className="flex items-center gap-3">
                  <Sparkles size={22} className={isLight ? 'text-zinc-600' : 'text-zinc-400'} />
                  <span className={`text-[15px] ${text_color}`}>{isRu ? 'Режим' : 'Mode'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[15px] ${textMuted}`}>{getModeLabel()}</span>
                  <ChevronRight size={18} className={textMuted} />
                </div>
              </button>
              <button 
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setMenuPage('length'); }}
                onClick={(e) => { e.stopPropagation(); setMenuPage('length'); }}
                className={`mx-4 w-[calc(100%-32px)] flex items-center justify-between py-3.5 px-4 ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'} rounded-xl active:opacity-70 touch-manipulation`}>
                <div className="flex items-center gap-3">
                  <Zap size={22} className={isLight ? 'text-zinc-600' : 'text-zinc-400'} />
                  <span className={`text-[15px] ${text_color}`}>{isRu ? 'Длина ответа' : 'Response length'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[15px] ${textMuted}`}>
                    {settings.responseLength === 'brief' ? (isRu ? 'Краткий' : 'Brief') : 
                     settings.responseLength === 'detailed' ? (isRu ? 'Подробный' : 'Detailed') : 
                     (isRu ? 'Баланс' : 'Balanced')}
                  </span>
                  <ChevronRight size={18} className={textMuted} />
                </div>
              </button>
            </>
          )}

          {/* Style Selection Page */}
          {menuPage === 'style' && (
            <>
              <div className="flex items-center px-4 pb-3">
                <CloseButton onClick={() => setMenuPage('add')} isLight={isLight} isBack />
                <span className={`flex-1 text-center text-[17px] font-semibold ${text_color} -ml-9`}>
                  {isRu ? 'Выбрать режим' : 'Choose style'}
                </span>
              </div>
              <div className={`mx-4 rounded-xl overflow-hidden ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'}`}>
                {[
                  { mode: ChatMode.STANDARD, icon: <Zap size={18} />, label: isRu ? 'Стандарт' : 'Normal' },
                  { mode: ChatMode.RESEARCH, icon: <BookOpen size={18} />, label: isRu ? 'Исследование' : 'Research' },
                  { mode: ChatMode.LABS, icon: <FlaskConical size={18} />, label: isRu ? 'Лаборатория' : 'Labs' },
                ].map((item, i, arr) => (
                  <button key={item.mode}
                    onClick={() => { setSettings(s => ({ ...s, mode: item.mode })); setMenuPage('add'); }}
                    className={`w-full flex items-center justify-between py-3.5 px-4 active:opacity-70 touch-manipulation ${i < arr.length - 1 ? (isLight ? 'border-b border-zinc-100' : 'border-b border-zinc-800') : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>{item.icon}</span>
                      <span className={`text-[15px] ${text_color}`}>{item.label}</span>
                    </div>
                    {settings.mode === item.mode && <Check size={20} className="text-blue-500" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Length Selection Page */}
          {menuPage === 'length' && (
            <>
              <div className="flex items-center px-4 pb-3">
                <CloseButton onClick={() => setMenuPage('add')} isLight={isLight} isBack />
                <span className={`flex-1 text-center text-[17px] font-semibold ${text_color} -ml-9`}>
                  {isRu ? 'Длина ответа' : 'Response length'}
                </span>
              </div>
              <div className={`mx-4 rounded-xl overflow-hidden ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'}`}>
                {[
                  { value: 'brief' as const, label: isRu ? 'Краткий' : 'Brief' },
                  { value: 'balanced' as const, label: isRu ? 'Баланс' : 'Balanced' },
                  { value: 'detailed' as const, label: isRu ? 'Подробный' : 'Detailed' },
                ].map((item, i, arr) => (
                  <button key={item.value}
                    onClick={() => { setSettings(s => ({ ...s, responseLength: item.value })); setMenuPage('add'); }}
                    className={`w-full flex items-center justify-between py-3.5 px-4 active:opacity-70 touch-manipulation ${i < arr.length - 1 ? (isLight ? 'border-b border-zinc-100' : 'border-b border-zinc-800') : ''}`}>
                    <span className={`text-[15px] ${text_color}`}>{item.label}</span>
                    {settings.responseLength === item.value && <Check size={20} className="text-blue-500" />}
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

      {/* Expanded Input Modal - ChatGPT style */}
      {isExpanded && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center px-4 pb-4 md:pb-0" onClick={() => setIsExpanded(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />
          {/* Modal */}
          <div 
            className={`relative w-full max-w-2xl ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'} rounded-2xl shadow-2xl overflow-hidden animate-slide-up`}
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
      )}

      {/* Active Settings Indicators - only for modes (web search visible in toggle) */}
      {!editingMessageId && settings.mode !== ChatMode.STANDARD && (
        <div className="flex items-center gap-2 mb-2 px-1">
          {settings.mode === ChatMode.RESEARCH && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-400'}`}>
              <BookOpen size={12} />
              <span>{isRu ? 'Исследование' : 'Research'}</span>
              <button 
                onClick={() => setSettings(s => ({ ...s, mode: ChatMode.STANDARD }))}
                className="ml-0.5 hover:opacity-70"
              >
                <X size={12} />
              </button>
            </div>
          )}
          {settings.mode === ChatMode.LABS && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'}`}>
              <FlaskConical size={12} />
              <span>{isRu ? 'Лаборатория' : 'Labs'}</span>
              <button 
                onClick={() => setSettings(s => ({ ...s, mode: ChatMode.STANDARD }))}
                className="ml-0.5 hover:opacity-70"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Bar - buttons stay at bottom, textarea grows up */}
      <div className="flex items-end gap-2">
        {/* Plus Button - Hidden in edit mode, stays at bottom */}
        {!editingMessageId && (
          <button
            onClick={() => setMenuPage(menuPage ? null : 'add')}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all flex-shrink-0 self-end ${
              isLight ? 'bg-gray-200 text-gray-600' : 'bg-zinc-800 text-zinc-400'
            } ${menuPage ? (isLight ? 'bg-gray-300' : 'bg-zinc-700 text-white') : ''}`}
          >
            <Plus size={20} strokeWidth={1.5} />
          </button>
        )}

        {/* Main Input Container */}
        <div className={`relative flex-1 ${bgCard} rounded-2xl flex items-center px-4 py-2.5 min-h-[44px] ${editingMessageId ? (isLight ? 'border border-gray-300' : 'border border-zinc-700') : ''}`}>
          {/* Expand button - show when text has 4+ lines (newlines) */}
          {(((editingMessageId ? editingText : text) || '').split('\n').length >= 4) && (
            <button
              onClick={() => setIsExpanded(true)}
              className={`absolute top-2 right-2 p-1.5 rounded-lg ${isLight ? 'bg-gray-200 text-gray-500 hover:bg-gray-300' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'} transition-colors z-10`}
            >
              <Maximize2 size={14} />
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
            className={`flex-1 bg-transparent ${text_color} placeholder-zinc-500 focus:outline-none max-h-32 scrollbar-hide text-[16px] leading-6 resize-none self-center`}
            style={{ fontSize: '16px' }}
          />

          {/* Right Icons */}
          <div className="flex items-center gap-0.5 ml-2 flex-shrink-0">
            {editingMessageId ? (
              /* Edit mode: show send arrow to save */
              <button 
                onClick={onSaveEdit} 
                disabled={!editingText?.trim()}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  editingText?.trim() 
                    ? (isLight ? 'bg-gray-900 text-white' : 'bg-white text-black') 
                    : (isLight ? 'bg-gray-200 text-gray-400' : 'bg-zinc-800 text-zinc-600')
                }`}
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            ) : isStreaming ? (
              <button onClick={onStop} className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full">
                <StopCircle size={16} fill="currentColor" />
              </button>
            ) : text.trim() || attachments.length > 0 ? (
              <button onClick={handleSend} className={`w-8 h-8 flex items-center justify-center rounded-full ${isLight ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            ) : (
              <>
                <button
                  onClick={startDictation}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : textMuted}`}
                >
                  <Mic size={18} />
                </button>
                <button
                  onClick={onStartLiveMode}
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${isLight ? 'bg-gray-200' : 'bg-zinc-800'}`}
                >
                  <AudioLines size={18} className={text_color} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
