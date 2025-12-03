import React, { useState, useRef, useEffect } from 'react';
import { Mic, Plus, StopCircle, X, AudioLines, ArrowUp, ArrowDown, Zap, BookOpen, FlaskConical, Camera, Image as ImageIcon, FileText, Globe, Sparkles, ChevronRight, Check } from 'lucide-react';
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
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

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
      <div className="md:hidden fixed inset-0 z-[100] flex flex-col justify-end" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60" />
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
        >
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

      {/* Desktop: positioned above input */}
      <div className="hidden md:block absolute bottom-full left-0 right-0 mb-2 z-[100]">
        <div 
          ref={(el) => {
            if (menuRef) (menuRef as any).current = el;
          }}
          className={`${isLight ? 'bg-zinc-100' : 'bg-[#000000]'} rounded-2xl animate-slide-up w-full border ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}
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

// Add to Chat Sheet Component
interface AddToChatSheetProps {
  isLight: boolean;
  isRu: boolean;
  menuRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onCamera: () => void;
  onPhoto: () => void;
  onFiles: () => void;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  onOpenStyleMenu: () => void;
  getModeLabel: () => string;
  text_color: string;
  textMuted: string;
}

const AddToChatSheet: React.FC<AddToChatSheetProps> = ({
  isLight, isRu, menuRef, onClose, onCamera, onPhoto, onFiles,
  webSearch, onToggleWebSearch, onOpenStyleMenu, getModeLabel, text_color, textMuted
}) => {
  const cardBg = isLight ? 'bg-white' : 'bg-[#1a1a1a]';
  const iconColor = isLight ? 'text-zinc-600' : 'text-zinc-400';

  return (
    <DraggableSheet isLight={isLight} onClose={onClose} menuRef={menuRef}>
      {/* Header */}
      <div className="flex items-center px-4 pb-3">
        <CloseButton onClick={onClose} isLight={isLight} />
        <span className={`flex-1 text-center text-[17px] font-semibold ${text_color} -ml-8`}>
          {isRu ? 'Добавить в чат' : 'Add to Chat'}
        </span>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <button 
          onClick={onCamera}
          className={`flex flex-col items-center justify-center gap-2 py-5 ${cardBg} rounded-xl active:opacity-70`}
        >
          <Camera size={26} className={iconColor} />
          <span className={`text-[13px] ${text_color}`}>{isRu ? 'Камера' : 'Camera'}</span>
        </button>
        <button 
          onClick={onPhoto}
          className={`flex flex-col items-center justify-center gap-2 py-5 ${cardBg} rounded-xl active:opacity-70`}
        >
          <ImageIcon size={26} className={iconColor} />
          <span className={`text-[13px] ${text_color}`}>{isRu ? 'Фото' : 'Photos'}</span>
        </button>
        <button 
          onClick={onFiles}
          className={`flex flex-col items-center justify-center gap-2 py-5 ${cardBg} rounded-xl active:opacity-70`}
        >
          <FileText size={26} className={iconColor} />
          <span className={`text-[13px] ${text_color}`}>{isRu ? 'Файлы' : 'Files'}</span>
        </button>
      </div>

      {/* Web Search */}
      <div className={`mx-4 mb-2 flex items-center justify-between py-3.5 px-4 ${cardBg} rounded-xl`}>
        <div className="flex items-center gap-3">
          <Globe size={22} className={iconColor} />
          <span className={`text-[15px] ${text_color}`}>{isRu ? 'Веб-поиск' : 'Web search'}</span>
        </div>
        <button 
          onClick={onToggleWebSearch}
          className={`w-[51px] h-[31px] rounded-full p-[2px] transition-all ${webSearch ? 'bg-blue-500' : (isLight ? 'bg-zinc-300' : 'bg-zinc-700')}`}
        >
          <div className={`w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-transform ${webSearch ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Choose Style */}
      <button 
        onClick={onOpenStyleMenu}
        className={`mx-4 w-[calc(100%-32px)] flex items-center justify-between py-3.5 px-4 ${cardBg} rounded-xl active:opacity-70`}
      >
        <div className="flex items-center gap-3">
          <Sparkles size={22} className={iconColor} />
          <span className={`text-[15px] ${text_color}`}>{isRu ? 'Выбрать режим' : 'Choose style'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[15px] ${textMuted}`}>{getModeLabel()}</span>
          <ChevronRight size={18} className={textMuted} />
        </div>
      </button>
    </DraggableSheet>
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
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSend, onStop, onStartLiveMode, onInputFocus, isStreaming, language, placeholderText, isLight = false, fileInputRef: externalFileInputRef
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  
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

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
        setShowStyleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text]);

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
    setShowAddMenu(false);
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
    setShowAddMenu(false);
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

      {/* Add to Chat Modal - Bottom sheet with drag */}
      {showAddMenu && (
        <AddToChatSheet
          isLight={isLight}
          isRu={isRu}
          menuRef={menuRef}
          onClose={() => setShowAddMenu(false)}
          onCamera={() => { imageInputRef.current?.click(); setShowAddMenu(false); }}
          onPhoto={() => { imageInputRef.current?.click(); setShowAddMenu(false); }}
          onFiles={() => { fileInputRef.current?.click(); setShowAddMenu(false); }}
          webSearch={settings.webSearch}
          onToggleWebSearch={() => setSettings(s => ({ ...s, webSearch: !s.webSearch }))}
          onOpenStyleMenu={() => { setShowAddMenu(false); setShowStyleMenu(true); }}
          getModeLabel={getModeLabel}
          text_color={text_color}
          textMuted={textMuted}
        />
      )}



      {/* Style Selection Modal */}
      {showStyleMenu && (
        <DraggableSheet isLight={isLight} onClose={() => setShowStyleMenu(false)} menuRef={menuRef}>
          {/* Header */}
          <div className="flex items-center px-4 pb-3">
            <CloseButton onClick={() => { setShowStyleMenu(false); setShowAddMenu(true); }} isLight={isLight} isBack />
            <span className={`flex-1 text-center text-[17px] font-semibold ${text_color} -ml-9`}>
              {isRu ? 'Выбрать режим' : 'Choose style'}
            </span>
          </div>

          {/* Options */}
          <div className="px-4 space-y-2 pb-2">
            {[
              { mode: ChatMode.STANDARD, icon: <Zap size={24} />, label: isRu ? 'Стандарт' : 'Normal', desc: isRu ? 'Быстрые ответы' : 'Quick responses' },
              { mode: ChatMode.RESEARCH, icon: <BookOpen size={24} />, label: isRu ? 'Исследование' : 'Research', desc: isRu ? 'Глубокий анализ' : 'Deep analysis' },
              { mode: ChatMode.LABS, icon: <FlaskConical size={24} />, label: isRu ? 'Лаборатория' : 'Labs', desc: isRu ? 'Код и документы' : 'Code & docs' },
            ].map(item => (
              <button
                key={item.mode}
                onClick={() => { setSettings(s => ({ ...s, mode: item.mode })); setShowStyleMenu(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'} active:opacity-70`}
              >
                <div className={`w-12 h-12 rounded-xl ${isLight ? 'bg-zinc-100' : 'bg-zinc-800'} flex items-center justify-center ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {item.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className={`text-[16px] font-medium ${text_color}`}>{item.label}</div>
                  <div className={`text-[13px] ${textMuted}`}>{item.desc}</div>
                </div>
                {settings.mode === item.mode && <Check size={24} className="text-blue-500" />}
              </button>
            ))}
          </div>
        </DraggableSheet>
      )}

      {/* Input Bar - Thin elegant design */}
      <div className="flex items-center gap-2">
        {/* Plus Button - Centered with input */}
        <button
          onClick={() => { setShowAddMenu(!showAddMenu); setShowStyleMenu(false); }}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
            isLight ? 'bg-gray-200 text-gray-600' : 'bg-zinc-800 text-zinc-400'
          } ${showAddMenu ? (isLight ? 'bg-gray-300' : 'bg-zinc-700 text-white') : ''}`}
        >
          <Plus size={22} strokeWidth={1.5} />
        </button>

        {/* Main Input Container */}
        <div className={`flex-1 ${bgCard} rounded-full flex items-center px-4 py-2 min-h-[44px]`}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onInputFocus}
            placeholder={placeholderText}
            rows={1}
            className={`flex-1 bg-transparent ${text_color} placeholder-zinc-500 focus:outline-none max-h-24 scrollbar-hide text-[16px] leading-6 resize-none py-0.5`}
            style={{ fontSize: '16px' }}
          />

          {/* Right Icons inside input */}
          <div className="flex items-center gap-0.5 ml-2 flex-shrink-0">
            {isStreaming ? (
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
