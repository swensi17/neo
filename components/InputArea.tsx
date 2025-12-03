import React, { useState, useRef, useEffect } from 'react';
import { Mic, Paperclip, StopCircle, X, AudioLines, ArrowUp, Zap, BookOpen, FlaskConical, AlignLeft, AlignCenter, AlignJustify, FileText, Image as ImageIcon, FileCode, Check, ChevronDown, Search } from 'lucide-react';
import { Attachment, ChatMode, TRANSLATIONS, InterfaceLanguage } from '../types';

const STORAGE_KEY = 'neo_input_settings';

interface InputSettings {
  webSearch: boolean;
  mode: ChatMode;
  responseLength: 'brief' | 'balanced' | 'detailed';
}

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
  const loadSavedSettings = (): InputSettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { webSearch: parsed.webSearch ?? true, mode: parsed.mode ?? ChatMode.STANDARD, responseLength: parsed.responseLength ?? 'balanced' };
      }
    } catch (e) { console.error('Failed to load input settings:', e); }
    return { webSearch: true, mode: ChatMode.STANDARD, responseLength: 'balanced' };
  };

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const savedSettings = loadSavedSettings();
  const [useWebSearch, setUseWebSearch] = useState(savedSettings.webSearch);
  const [currentMode, setCurrentMode] = useState<ChatMode>(savedSettings.mode);
  const [responseLength, setResponseLength] = useState<'brief' | 'balanced' | 'detailed'>(savedSettings.responseLength);
  
  const [showModeMenu, setShowModeMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = externalFileInputRef || internalFileInputRef;
  const recognitionRef = useRef<any>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  // Theme classes
  const bgMain = isLight ? 'bg-white' : 'bg-black';
  const bgSurface = isLight ? 'bg-gray-100' : 'bg-surface';
  const textMain = isLight ? 'text-gray-900' : 'text-white';
  const textSecondary = isLight ? 'text-gray-500' : 'text-white/60';
  const border = isLight ? 'border-gray-200' : 'border-white/10';
  const hoverBg = isLight ? 'hover:bg-gray-100' : 'hover:bg-white/5';
  const activeBg = isLight ? 'bg-gray-200' : 'bg-white/10';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ webSearch: useWebSearch, mode: currentMode, responseLength }));
  }, [useWebSearch, currentMode, responseLength]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) setShowModeMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return;
    onSend(text, attachments, useWebSearch, currentMode, responseLength);
    setText(''); setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // Supported MIME types by Gemini API
  const SUPPORTED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff',
    'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm',
    'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp', 'video/quicktime',
    'application/pdf',
    'text/plain', 'text/html', 'text/css', 'text/javascript', 'text/x-python', 'text/markdown', 'text/csv',
    'text/x-c', 'text/x-c++', 'text/x-java', 'text/x-ruby', 'text/x-go', 'text/x-rust', 'text/x-php', 'text/x-swift', 'text/x-kotlin',
    'application/json', 'application/xml', 'application/javascript', 'application/x-javascript'
  ];

  const isSupportedFile = (mimeType: string, fileName: string): boolean => {
    // Check by MIME type
    if (SUPPORTED_MIME_TYPES.some(t => mimeType === t || mimeType.startsWith(t.split('/')[0] + '/'))) {
      // Exclude Office documents even if browser reports generic type
      if (mimeType.includes('officedocument') || mimeType.includes('msword') || 
          mimeType.includes('excel') || mimeType.includes('powerpoint') ||
          mimeType.includes('opendocument')) {
        return false;
      }
      return true;
    }
    // Check by extension for text files
    const ext = fileName.split('.').pop()?.toLowerCase();
    const textExtensions = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'rb', 'go', 'rs', 'php', 'swift', 'kt', 'csv', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'sh', 'bash', 'sql'];
    if (ext && textExtensions.includes(ext)) return true;
    return false;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: File) => {
        const mimeType = file.type || 'application/octet-stream';
        
        // Check if file is supported
        if (!isSupportedFile(mimeType, file.name)) {
          alert(language === 'ru' 
            ? `❌ Файл "${file.name}" не поддерживается.\n\nПоддерживаемые форматы:\n• Изображения (JPG, PNG, GIF, WebP)\n• Видео (MP4, WebM, MOV)\n• Аудио (MP3, WAV, OGG)\n• Документы (PDF)\n• Код и текст (TXT, JS, PY, JSON и др.)`
            : `❌ File "${file.name}" is not supported.\n\nSupported formats:\n• Images (JPG, PNG, GIF, WebP)\n• Video (MP4, WebM, MOV)\n• Audio (MP3, WAV, OGG)\n• Documents (PDF)\n• Code & text (TXT, JS, PY, JSON, etc.)`);
          return;
        }
        
        // Determine correct MIME type for text files
        let finalMimeType = mimeType;
        if (mimeType === 'application/octet-stream' || !mimeType) {
          const ext = file.name.split('.').pop()?.toLowerCase();
          const mimeMap: Record<string, string> = {
            'txt': 'text/plain', 'md': 'text/markdown', 'json': 'application/json', 'xml': 'application/xml',
            'html': 'text/html', 'css': 'text/css', 'js': 'text/javascript', 'ts': 'text/javascript',
            'py': 'text/x-python', 'java': 'text/x-java', 'c': 'text/x-c', 'cpp': 'text/x-c++',
            'rb': 'text/x-ruby', 'go': 'text/x-go', 'rs': 'text/x-rust', 'php': 'text/x-php',
            'csv': 'text/csv', 'yaml': 'text/plain', 'yml': 'text/plain', 'sql': 'text/plain'
          };
          finalMimeType = (ext && mimeMap[ext]) || 'text/plain';
        }
        
        // Read file
        const reader = new FileReader();
        reader.onload = () => setAttachments(prev => [...prev, { 
          name: file.name, 
          mimeType: finalMimeType, 
          data: reader.result as string 
        }]);
        reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));

  const startDictation = () => {
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ru' ? 'ru-RU' : 'en-US';
      recognition.continuous = false; recognition.interimResults = true;
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setText(prev => (prev ? prev + ' ' : '') + finalTranscript);
      };
      recognitionRef.current = recognition; recognition.start();
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={14} />;
    if (mimeType.includes('pdf')) return <FileText size={14} />;
    return <FileCode size={14} />;
  };

  const getModeIcon = (size = 14) => {
    switch (currentMode) {
      case ChatMode.RESEARCH: return <BookOpen size={size} />;
      case ChatMode.LABS: return <FlaskConical size={size} />;
      default: return <Zap size={size} />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 pb-2 relative font-sans">
      
      {/* Mode Menu */}
      {showModeMenu && (
        <div ref={modeMenuRef} className={`absolute bottom-full mb-2 left-2 z-50 ${bgMain} border ${border} rounded-xl shadow-2xl p-1 w-[200px] animate-slide-up`}>
          {[
            { m: ChatMode.STANDARD, icon: <Zap size={14} />, label: t.modeStandard },
            { m: ChatMode.RESEARCH, icon: <BookOpen size={14} />, label: t.modeResearch },
            { m: ChatMode.LABS, icon: <FlaskConical size={14} />, label: t.modeLabs }
          ].map((item) => (
            <button
              key={item.m}
              onClick={() => { setCurrentMode(item.m); setShowModeMenu(false); if (item.m === ChatMode.RESEARCH) setUseWebSearch(true); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${currentMode === item.m ? `${activeBg} ${textMain}` : `${textSecondary} ${hoverBg}`}`}
            >
              <div className="flex items-center gap-2">{item.icon}<span>{item.label}</span></div>
              {currentMode === item.m && <Check size={12} />}
            </button>
          ))}
        </div>
      )}

      {/* Hidden file input - only accept supported formats */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        multiple 
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.txt,.html,.css,.js,.ts,.py,.json,.xml,.csv,.md,.c,.cpp,.java,.rb,.go,.rs,.php,.swift,.kt"
      />

      {/* Attachments Preview - Improved */}
      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-3 px-1 pb-1 scrollbar-hide">
          {attachments.map((att, i) => (
            <div key={i} className={`relative ${bgSurface} border ${border} rounded-xl overflow-hidden flex-shrink-0 group`}>
              <button 
                onClick={() => removeAttachment(i)} 
                className={`absolute top-1 right-1 z-10 ${isLight ? 'bg-gray-800' : 'bg-black'} text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                <X size={12} />
              </button>
              {att.mimeType.startsWith('image/') ? (
                <img src={att.data} alt={att.name} className="h-20 w-20 object-cover" />
              ) : (
                <div className="h-20 w-32 flex flex-col items-center justify-center p-2 gap-1">
                  <div className={`p-2 rounded-lg ${isLight ? 'bg-gray-200' : 'bg-white/10'} ${textMain}`}>
                    {getFileIcon(att.mimeType)}
                  </div>
                  <span className={`text-[10px] ${textSecondary} truncate w-full text-center`}>{att.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Settings Bar - Full labels */}
      <div className="flex items-center gap-1.5 mb-2 px-1 overflow-x-auto scrollbar-hide">
        {/* Mode */}
        <button onClick={() => setShowModeMenu(!showModeMenu)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${bgSurface} border ${border} ${textSecondary} transition-all flex-shrink-0`}>
          {getModeIcon(12)}
          <span>{currentMode === ChatMode.STANDARD ? t.modeStandard : (currentMode === ChatMode.RESEARCH ? t.modeResearch : t.modeLabs)}</span>
          <ChevronDown size={10} />
        </button>

        {/* Search Toggle */}
        <button
          onClick={() => setUseWebSearch(!useWebSearch)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all flex-shrink-0 ${useWebSearch ? 'bg-blue-500/20 border-blue-500/30 text-blue-500' : `${bgSurface} ${border} ${textSecondary}`}`}
        >
          <Search size={12} />
          <span>{language === 'ru' ? 'Поиск' : 'Search'}</span>
        </button>

        {/* Response Length - Full labels */}
        <button
          onClick={() => {
            const lengths: Array<'brief' | 'balanced' | 'detailed'> = ['brief', 'balanced', 'detailed'];
            setResponseLength(lengths[(lengths.indexOf(responseLength) + 1) % 3]);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${bgSurface} border ${border} ${textSecondary} transition-all flex-shrink-0`}
        >
          {responseLength === 'brief' && <AlignLeft size={12} />}
          {responseLength === 'balanced' && <AlignCenter size={12} />}
          {responseLength === 'detailed' && <AlignJustify size={12} />}
          <span>
            {responseLength === 'brief' && t.brief}
            {responseLength === 'balanced' && t.balanced}
            {responseLength === 'detailed' && t.detailed}
          </span>
        </button>
      </div>

      {/* Input */}
      <div className={`relative ${bgSurface} flex items-center gap-1 p-1.5 rounded-[20px] border ${border} shadow-lg`}>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${attachments.length > 0 ? `${activeBg} ${textMain}` : `${textSecondary} ${hoverBg}`}`}
        >
          <Paperclip size={16} />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onInputFocus}
          placeholder={placeholderText}
          rows={1}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          enterKeyHint="send"
          className={`flex-1 bg-transparent ${textMain} placeholder-gray-400 py-2 px-1 focus:outline-none max-h-28 scrollbar-hide text-[16px] leading-relaxed resize-none min-h-[32px]`}
          style={{ fontSize: '16px' }}
        />

        <div className="flex items-center gap-1 flex-shrink-0">
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
              {/* Dictation button */}
              <button
                onClick={startDictation}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : `${textSecondary} ${hoverBg}`}`}
                title={language === 'ru' ? 'Диктовка' : 'Dictation'}
              >
                <Mic size={18} />
              </button>
              {/* Live voice button */}
              <button
                onClick={onStartLiveMode}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${textSecondary} ${hoverBg}`}
                title={language === 'ru' ? 'Живое общение' : 'Live chat'}
              >
                <AudioLines size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
