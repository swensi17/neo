
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Role, UserProfile, ChatMode, TRANSLATIONS } from '../types';
import { Copy, RefreshCw, Volume2, Check, Sparkles, ThumbsUp, ThumbsDown, Square, BookOpen, FlaskConical, ChevronLeft, ChevronRight, Link as LinkIcon, ExternalLink, Play, FileCode, FileText, Image as ImageIcon, Download, Edit2, X } from 'lucide-react';
import { ThinkingIndicator } from './ThinkingIndicator';

interface MessageBubbleProps {
  message: Message;
  userProfile: UserProfile;
  isStreaming: boolean;
  onRegenerate: () => void;
  onRate?: (rating: 'like' | 'dislike') => void;
  onOpenPreview?: (code: string, language: string) => void;
  onEdit?: (newText: string) => void;
  onDelete?: () => void;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  editingText?: string;
  onEditingTextChange?: (text: string) => void;
  onFollowUpClick?: (question: string) => void; // Handle follow-up question click
  lang?: string;
  isLight?: boolean;
  searchHighlight?: string; // Text to highlight in message
}

// Hook for liquid smooth typing effect
const useSmoothTyping = (text: string | undefined, isStreaming: boolean) => {
    // FIX: Safeguard against undefined/null text to prevent 'length' error
    const safeText = text || '';
    const [displayedText, setDisplayedText] = useState(isStreaming ? '' : safeText);
    const indexRef = useRef(0);

    useEffect(() => {
        if (!isStreaming) {
            setDisplayedText(safeText);
            return;
        }

        const interval = setInterval(() => {
            if (indexRef.current < safeText.length) {
                const chunk = safeText.slice(indexRef.current, indexRef.current + 2);
                setDisplayedText(prev => prev + chunk);
                indexRef.current += 2;
            } else {
                setDisplayedText(safeText);
            }
        }, 8);

        return () => clearInterval(interval);
    }, [safeText, isStreaming]);

    return displayedText;
};

// Blockquote component - plain text only, no markdown formatting
const BlockquoteBox = ({ contentText, isLight, lang }: { contentText: string, isLight: boolean, lang: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    const isRu = lang === 'ru';
    
    const handleCopy = () => {
        navigator.clipboard.writeText(contentText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    // Remove markdown formatting for display
    const cleanText = contentText
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
        .replace(/\*(.*?)\*/g, '$1')       // Remove *italic*
        .replace(/__(.*?)__/g, '$1')       // Remove __bold__
        .replace(/_(.*?)_/g, '$1')         // Remove _italic_
        .replace(/`(.*?)`/g, '$1')         // Remove `code`
        .replace(/^#+\s*/gm, '')           // Remove # headers
        .replace(/^>\s*/gm, '')            // Remove > quotes
        .replace(/^[-*+]\s*/gm, '• ')      // Convert list markers to bullets
        .replace(/^\d+\.\s*/gm, (m) => m); // Keep numbered lists
    
    return (
        <div className="relative my-4">
            <div 
                className="rounded-xl p-4 relative overflow-hidden"
                style={{
                    backgroundColor: isLight ? '#f4f4f5' : '#0a0a0a',
                    border: 'none'
                }}
            >
                <div 
                    className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                    style={{ backgroundColor: isLight ? '#a1a1aa' : '#3f3f46' }}
                />
                <pre 
                    className="text-sm pl-4 pr-20 whitespace-pre-wrap font-sans"
                    style={{ 
                        color: isLight ? '#3f3f46' : '#d4d4d8',
                        margin: 0,
                        fontFamily: 'inherit'
                    }}
                >
                    {cleanText}
                </pre>
            </div>
            <button 
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1 transition-all hover:opacity-70"
                style={{ color: isCopied ? '#22c55e' : (isLight ? '#71717a' : '#71717a') }}
            >
                {isCopied ? <Check size={18} /> : <Copy size={18} />}
            </button>
        </div>
    );
};

const WebPreview = ({ code, lang = 'en' }: { code: string, lang?: string }) => {
    const isRu = lang === 'ru';
    return (
        <div className="w-full mt-2 rounded-lg overflow-hidden border border-white/10 bg-white">
            <div className="bg-black px-4 py-2 text-xs font-mono text-white/50 border-b border-white/10 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                <span className="ml-2 font-semibold text-white/70">{isRu ? 'Превью' : 'Preview'}</span>
            </div>
            <iframe 
                srcDoc={code}
                className="w-full h-64 border-none"
                title={isRu ? 'Превью' : 'Preview'}
                sandbox="allow-scripts"
            />
        </div>
    );
};

// Helper to get favicon URL
const getFaviconUrl = (uri: string) => {
    try {
        const url = new URL(uri);
        return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch {
        return null;
    }
};

// Helper to get domain category/type
const getDomainType = (hostname: string): { type: string; color: string } => {
    const domain = hostname.toLowerCase().replace('www.', '');
    
    // News sources
    if (['bbc.com', 'cnn.com', 'reuters.com', 'nytimes.com', 'theguardian.com', 'ria.ru', 'tass.ru', 'lenta.ru', 'rbc.ru', 'kommersant.ru', 'vedomosti.ru', 'forbes.ru', 'forbes.com'].some(d => domain.includes(d))) {
        return { type: 'News', color: 'text-red-400' };
    }
    // Wikipedia
    if (domain.includes('wikipedia.org')) {
        return { type: 'Wiki', color: 'text-blue-400' };
    }
    // Academic/Research
    if (['arxiv.org', 'scholar.google', 'researchgate.net', 'academia.edu', 'pubmed', 'nature.com', 'science.org', 'springer.com'].some(d => domain.includes(d))) {
        return { type: 'Research', color: 'text-purple-400' };
    }
    // Tech/Dev
    if (['github.com', 'stackoverflow.com', 'dev.to', 'medium.com', 'hackernews', 'techcrunch.com', 'habr.com', 'geeksforgeeks.org'].some(d => domain.includes(d))) {
        return { type: 'Tech', color: 'text-green-400' };
    }
    // Official/Gov
    if (['.gov', '.edu', '.mil'].some(d => domain.includes(d))) {
        return { type: 'Official', color: 'text-yellow-400' };
    }
    // E-commerce
    if (['amazon.', 'ebay.', 'aliexpress.', 'ozon.ru', 'wildberries.ru'].some(d => domain.includes(d))) {
        return { type: 'Shop', color: 'text-orange-400' };
    }
    
    return { type: 'Web', color: 'text-zinc-400' };
};

// Sources section - collapsible like ChatGPT/Claude
const SOURCES_COLLAPSED_KEY = 'neo_sources_collapsed';

const SourcesCarousel = ({ sources, lang, searchHighlight, isLight }: { sources: Array<{ title: string; uri: string }>, lang: string, searchHighlight?: string, isLight?: boolean }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    
    // Load collapsed state from localStorage
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem(SOURCES_COLLAPSED_KEY) === 'true';
        } catch { return false; }
    });

    // Save collapsed state
    const toggleCollapsed = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        try {
            localStorage.setItem(SOURCES_COLLAPSED_KEY, String(newState));
        } catch { /* ignore */ }
    };

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        if (!isCollapsed) {
            checkScroll();
            const el = scrollRef.current;
            if (el) el.addEventListener('scroll', checkScroll);
            return () => { if (el) el.removeEventListener('scroll', checkScroll); };
        }
    }, [isCollapsed]);

    const scroll = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    // Deduplicate sources
    const uniqueSources = sources.filter((s, i, arr) => 
        arr.findIndex(x => x.uri === s.uri) === i
    );

    return (
        <div className="mt-3 w-full">
            {/* Header - clickable to collapse/expand */}
            <div className="flex items-center gap-2 px-1 py-1 w-full">
                <div 
                    onClick={toggleCollapsed}
                    className="flex items-center gap-2 cursor-pointer group"
                >
                    <ChevronRight 
                        size={14} 
                        className={`text-zinc-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} 
                    />
                    <BookOpen size={14} className="text-zinc-500" />
                    <span className="text-[11px] font-medium text-zinc-500">
                        {lang === 'ru' ? 'Источники' : 'Sources'}
                    </span>
                    <span className="text-[10px] text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                        {uniqueSources.length}
                    </span>
                </div>
                
                {/* Scroll arrows - only when expanded */}
                {!isCollapsed && (
                    <div className="ml-auto hidden sm:flex items-center gap-1">
                        <div 
                            onClick={() => scroll('left')}
                            className={`p-1 rounded transition-all cursor-pointer ${canScrollLeft ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'text-zinc-700 cursor-default'}`}
                        >
                            <ChevronLeft size={14} />
                        </div>
                        <div 
                            onClick={() => scroll('right')}
                            className={`p-1 rounded transition-all cursor-pointer ${canScrollRight ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'text-zinc-700 cursor-default'}`}
                        >
                            <ChevronRight size={14} />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Sources list - collapsible */}
            {!isCollapsed && (
                <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide snap-x">
                    {uniqueSources.map((g, i) => {
                        // Get real hostname, filter out Google proxy URLs
                        let hostname = 'source';
                        let realUri = g.uri;
                        try {
                            const url = new URL(g.uri);
                            hostname = url.hostname.replace('www.', '');
                            // If it's a Google proxy URL, try to extract real domain from title
                            if (hostname.includes('vertexaisearch') || hostname.includes('googleapis') || hostname.includes('google.com/url')) {
                                const titleDomain = g.title?.match(/([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2})?)/)?.[0];
                                if (titleDomain) {
                                    hostname = titleDomain.toLowerCase();
                                }
                            }
                        } catch { /* ignore */ }
                        
                        // Get favicon from real hostname
                        const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
                        
                        return (
                            <a 
                                key={i} 
                                href={realUri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-shrink-0 w-40 sm:w-44 p-2 bg-[#0a0a0a] border border-zinc-800/40 rounded-lg hover:bg-[#111111] hover:border-zinc-700/50 transition-all group/source snap-start"
                            >
                                {/* Favicon + Domain */}
                                <div className="flex items-center gap-1.5 mb-1">
                                    <img 
                                        src={favicon} 
                                        alt="" 
                                        className="w-3.5 h-3.5 rounded-full flex-shrink-0" 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2371717a" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                                        }} 
                                    />
                                    <span className="text-[10px] text-zinc-600 truncate">{hostname}</span>
                                </div>
                                
                                {/* Title */}
                                <div className="text-[12px] text-zinc-400 line-clamp-2 group-hover/source:text-zinc-200 transition-colors leading-snug">
                                    <HighlightText text={g.title || hostname} highlight={searchHighlight} isLight={isLight || false} />
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Copy button component with its own state for text blocks
const CopyButton = ({ code, codeId }: { code: string, codeId: number }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button 
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 bg-surface-hover text-text-secondary rounded-lg hover:text-text border border-white/5 transition-all opacity-0 group-hover/textblock:opacity-100"
            title="Copy"
        >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
    );
};

// Copy button for code blocks with label
const CodeCopyButton = ({ code, codeId, lang = 'en' }: { code: string, codeId: number, lang?: string }) => {
    const [copied, setCopied] = useState(false);
    const isRu = lang === 'ru';
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[10px] text-white/50 hover:text-white transition-colors"
        >
            {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
            <span>{copied ? (isRu ? 'Скопировано' : 'Copied') : (isRu ? 'Копировать' : 'Copy')}</span>
        </button>
    );
};

// Helper to highlight search text in string
const HighlightText: React.FC<{ text: string; highlight?: string; isLight?: boolean }> = ({ text, highlight, isLight }) => {
  if (!highlight || !highlight.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark 
            key={i} 
            className="bg-amber-500/30 text-inherit rounded px-0.5"
            style={{ boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.2)' }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  userProfile,
  isStreaming,
  onRegenerate,
  onRate,
  onOpenPreview,
  onEdit,
  onDelete,
  isEditing,
  onStartEdit,
  onCancelEdit,
  editingText,
  onEditingTextChange,
  onFollowUpClick,
  lang = 'en',
  isLight = false,
  searchHighlight
}) => {
  const isUser = message.role === Role.USER;
  
  // Theme classes
  const bgUser = isLight ? 'bg-gray-100' : 'bg-[#1a1a1a]';
  const textMain = isLight ? 'text-gray-900' : 'text-white';
  const textSecondary = isLight ? 'text-gray-500' : 'text-text-secondary';
  const border = isLight ? 'border-gray-200' : 'border-white/10';
  const hoverBg = isLight ? 'hover:bg-gray-100' : 'hover:bg-white/5';
  const bgCode = isLight ? 'bg-gray-50' : 'bg-black';
  const bgSurface = isLight ? 'bg-gray-100' : 'bg-surface';
  const [isCopiedMessage, setIsCopiedMessage] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewStates, setPreviewStates] = useState<Record<number, boolean>>({});

  // Always call the hook (Rules of Hooks), but only use typing effect for AI messages
  const shouldAnimate = !isUser && isStreaming;
  const typedText = useSmoothTyping(message.text, shouldAnimate);
  const displayText = shouldAnimate ? typedText : (message.text || '');

  useEffect(() => {
    const interval = setInterval(() => {
        if (!window.speechSynthesis.speaking && isPlaying) {
            setIsPlaying(false);
        }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text || '').then(() => {
        setIsCopiedMessage(true);
        setTimeout(() => setIsCopiedMessage(false), 2000);
    });
  };

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window) || !message.text) return;

    if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
    } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message.text);
        
        // Auto-detect language from text content
        const detectLanguage = (text: string): string => {
            // Check for Cyrillic characters (Russian)
            const cyrillicPattern = /[\u0400-\u04FF]/;
            // Check for Chinese characters
            const chinesePattern = /[\u4E00-\u9FFF]/;
            // Check for Japanese characters
            const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
            // Check for Korean characters
            const koreanPattern = /[\uAC00-\uD7AF]/;
            // Check for Arabic characters
            const arabicPattern = /[\u0600-\u06FF]/;
            
            if (cyrillicPattern.test(text)) return 'ru';
            if (chinesePattern.test(text)) return 'zh';
            if (japanesePattern.test(text)) return 'ja';
            if (koreanPattern.test(text)) return 'ko';
            if (arabicPattern.test(text)) return 'ar';
            return 'en';
        };
        
        const detectedLang = detectLanguage(message.text);
        
        // Use voice based on detected language
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            v.lang.startsWith(detectedLang) && (
                v.name.includes('Google') || 
                v.name.includes('Natural') || 
                v.name.includes('Premium')
            )
        ) || voices.find(v => v.lang.startsWith(detectedLang));
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
            utterance.lang = preferredVoice.lang;
        } else {
            utterance.lang = detectedLang;
        }
        
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
    }
  };

  const handleDownloadCode = (code: string, langCode: string) => {
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Guess extension
      let ext = 'txt';
      if(langCode === 'python') ext = 'py';
      if(langCode === 'javascript' || langCode === 'js') ext = 'js';
      if(langCode === 'html') ext = 'html';
      if(langCode === 'css') ext = 'css';
      if(langCode === 'csv') ext = 'csv';
      if(langCode === 'json') ext = 'json';
      if(langCode === 'markdown' || langCode === 'md') ext = 'md';

      a.download = `neo_generated.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const togglePreview = (index: number) => {
      setPreviewStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const renderModeBadge = () => {
      const badgeClass = `flex items-center gap-1 text-[9px] ${bgSurface} ${textSecondary} px-2 py-0.5 rounded border ${border} uppercase tracking-widest font-mono`;
      if (message.mode === ChatMode.RESEARCH) {
          return <span className={badgeClass}><BookOpen size={8} /> Research</span>;
      }
      if (message.mode === ChatMode.LABS) {
          return <span className={badgeClass}><FlaskConical size={8} /> Labs</span>;
      }
      return null;
  };

  const getFileIcon = (mimeType: string) => {
      if (mimeType.startsWith('image/')) return <ImageIcon size={20} />;
      if (mimeType.includes('pdf')) return <FileText size={20} />;
      return <FileCode size={20} />;
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 group animate-slide-up`}>
      <div className={`flex flex-col max-w-full md:max-w-[85%] lg:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Name / Role Label with Avatar */}
        <div className="flex items-center gap-2 mb-1.5 px-1">
            {isUser ? (
                <div className="flex items-center gap-2">
                    {userProfile.avatar ? (
                        <img 
                            src={userProfile.avatar} 
                            alt="" 
                            className="w-5 h-5 rounded-full object-cover"
                        />
                    ) : (
                        <div className={`w-5 h-5 rounded-full ${isLight ? 'bg-gray-300' : 'bg-zinc-700'} flex items-center justify-center`}>
                            <span className={`text-[9px] font-semibold ${isLight ? 'text-gray-600' : 'text-zinc-300'}`}>
                                {userProfile.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <span className={`text-[10px] font-semibold ${textSecondary} uppercase tracking-wider`}>{userProfile.name}</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full ${isLight ? 'bg-gray-200' : 'bg-zinc-800'} flex items-center justify-center`}>
                        <Sparkles size={10} className={isLight ? 'text-gray-700' : 'text-white'} />
                    </div>
                    <span className={`text-[10px] font-semibold ${textSecondary} uppercase tracking-wider`}>
                        NEO
                    </span>
                    {renderModeBadge()}
                </div>
            )}
        </div>

        {/* Bubble */}
        <div 
          className={`
            relative text-sm sm:text-[15px] leading-relaxed transition-all duration-200
            ${isUser 
              ? `${isLight ? 'bg-gray-100' : 'bg-[#111111]'} ${textMain} rounded-2xl px-3.5 py-2 max-w-[85%] break-words` 
              : `${textMain} w-full`
            }
          `}
        >
          {/* Attachments Grid - Improved like Claude/ChatGPT */}
          {message.attachments && message.attachments.length > 0 && (
              <div className={`flex flex-wrap gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {message.attachments.map((att, idx) => (
                      <div 
                          key={idx} 
                          className={`relative overflow-hidden rounded-2xl border ${border} ${bgSurface} cursor-pointer hover:opacity-90 transition-all group/att`}
                          onClick={() => {
                              if (att.mimeType.startsWith('image/')) {
                                  window.open(att.data, '_blank');
                              } else {
                                  // Download file
                                  const a = document.createElement('a');
                                  a.href = att.data;
                                  a.download = att.name;
                                  a.click();
                              }
                          }}
                      >
                          {att.mimeType.startsWith('image/') ? (
                              <div className="relative">
                                  <img 
                                      src={att.data} 
                                      alt={att.name} 
                                      className="max-w-[240px] max-h-[180px] w-auto h-auto object-contain rounded-xl"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover/att:bg-black/10 transition-all rounded-xl" />
                              </div>
                          ) : (
                              <div className={`flex items-center gap-2.5 px-3 py-2.5 min-w-[160px] max-w-[240px]`}>
                                  <div className={`p-2 rounded-lg ${isLight ? 'bg-gray-200' : 'bg-white/10'} ${textMain} flex-shrink-0`}>
                                      {getFileIcon(att.mimeType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className={`text-[13px] font-medium truncate ${textMain}`}>{att.name}</p>
                                      <p className={`text-[11px] ${textSecondary}`}>
                                          {att.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                                      </p>
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          )}

          {isUser ? (
            <div className={`whitespace-pre-line font-sans break-words ${isEditing ? 'opacity-50' : ''}`}>
              <HighlightText text={displayText} highlight={searchHighlight} isLight={isLight} />
            </div>
          ) : (
            <div className="font-sans markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeText = String(children).replace(/\n$/, '');
                    const isRunnable = match && (match[1] === 'html' || match[1] === 'css' || match[1] === 'javascript' || match[1] === 'js');
                    const isMermaid = match && match[1] === 'mermaid';
                    // Stable ID based on code content hash
                    const codeId = codeText.length + codeText.charCodeAt(0) + (codeText.charCodeAt(codeText.length - 1) || 0);

                    // Render Mermaid Diagrams as Images
                    if (!inline && isMermaid) {
                        // Use pako-like compression for mermaid.ink
                        // First try simple base64, fallback to showing code
                        try {
                            // mermaid.ink expects base64 encoded diagram
                            const encoded = btoa(codeText);
                            const mermaidUrl = `https://mermaid.ink/img/base64:${encoded}?bgColor=000000`;
                            return (
                                <div className="my-6 rounded-xl border border-white/10 overflow-hidden">
                                    <div className="bg-black px-4 py-2 border-b border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-white/50">mermaid</span>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(codeText)}
                                            className="text-[10px] text-white/50 hover:text-white transition-colors flex items-center gap-1"
                                        >
                                            <Copy size={12} /> {lang === 'ru' ? 'Копировать' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="bg-white p-4 flex justify-center">
                                        <img 
                                            src={mermaidUrl} 
                                            alt="Mermaid Diagram" 
                                            className="max-w-full h-auto"
                                            onError={(e) => {
                                                // If image fails, hide it and show code instead
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <details className="bg-black">
                                        <summary className="px-4 py-2 text-[10px] text-white/40 cursor-pointer hover:text-white/60">
                                            {lang === 'ru' ? 'Показать код' : 'Show code'}
                                        </summary>
                                        <pre className="px-4 pb-4 text-xs text-white/60 overflow-x-auto">{codeText}</pre>
                                    </details>
                                </div>
                            );
                        } catch {
                            // Fallback: show as code block
                            return (
                                <div className="my-6 rounded-xl border border-white/10 bg-black p-4">
                                    <div className="text-[10px] font-mono text-white/50 mb-2">{lang === 'ru' ? 'mermaid (превью недоступно)' : 'mermaid (preview unavailable)'}</div>
                                    <pre className="text-xs text-white/70 overflow-x-auto whitespace-pre-wrap">{codeText}</pre>
                                </div>
                            );
                        }
                    }

                    // Text/plaintext blocks OR code blocks without language - render as styled box
                    const isTextBlock = match && (match[1] === 'text' || match[1] === 'plaintext' || match[1] === 'txt');
                    const isCodeBlockWithoutLang = !inline && !match && codeText.includes('\n');
                    
                    if (!inline && (isTextBlock || isCodeBlockWithoutLang)) {
                      // Plain text block - matte black style, no border, clean markdown
                      const [copied, setCopied] = React.useState(false);
                      const handleCopyText = () => {
                          navigator.clipboard.writeText(codeText); // Copy original with formatting
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                      };
                      // Clean markdown for display only
                      const cleanDisplayText = codeText
                          .replace(/\*\*(.*?)\*\*/g, '$1')  // **bold** -> bold
                          .replace(/__(.*?)__/g, '$1')       // __bold__ -> bold
                          .replace(/\*(.*?)\*/g, '$1')       // *italic* -> italic
                          .replace(/_(.*?)_/g, '$1')         // _italic_ -> italic
                          .replace(/`{3}[\s\S]*?`{3}/g, '')  // Remove code blocks
                          .replace(/`(.*?)`/g, '$1')         // `code` -> code
                          .replace(/^#{1,6}\s*/gm, '')       // # headers -> text
                          .replace(/^>\s*/gm, '')            // > quotes -> text
                          .replace(/^---+$/gm, '')           // --- horizontal line -> remove
                          .replace(/^\s*\*\s+/gm, '• ')      // * list item -> • (with leading spaces)
                          .replace(/^\s*-\s+/gm, '• ')       // - list item -> •
                          .replace(/^\s*\+\s+/gm, '• ')      // + list item -> •
                          .replace(/\n{3,}/g, '\n\n')        // Multiple newlines -> double
                          .trim();
                      return (
                        <div className="relative my-3 sm:my-4 w-full">
                            <div 
                                className="rounded-xl relative overflow-hidden"
                                style={{ backgroundColor: isLight ? '#f4f4f5' : '#0a0a0a' }}
                            >
                                <button 
                                    onClick={handleCopyText}
                                    className="absolute top-3 right-3 z-10 p-1 transition-all hover:opacity-70"
                                    style={{ color: copied ? '#22c55e' : (isLight ? '#71717a' : '#71717a') }}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                                <div className="max-h-[400px] overflow-y-auto p-4 pr-12 scrollbar-hide">
                                    <div 
                                        className="text-sm leading-relaxed font-sans whitespace-pre-wrap break-words"
                                        style={{ color: isLight ? '#3f3f46' : '#d4d4d8' }}
                                    >
                                        {cleanDisplayText}
                                    </div>
                                </div>
                            </div>
                        </div>
                      );
                    }

                    if (!inline && match) {
                      return (
                        <div className="rounded-xl overflow-hidden my-6 border border-white/10 bg-black shadow-md w-full group/code">
                           <div className="flex items-center justify-between px-4 py-2.5 bg-black border-b border-white/10">
                              <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-mono text-white/50 lowercase">{match[1]}</span>
                                  {isRunnable && onOpenPreview && (
                                      <button 
                                        onClick={() => onOpenPreview(codeText, match[1])}
                                        className="flex items-center gap-1 text-[10px] text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded"
                                      >
                                          <Play size={10} fill="currentColor"/> {lang === 'ru' ? 'Запуск' : 'Run'}
                                      </button>
                                  )}

                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleDownloadCode(codeText, match[1])}
                                    className="flex items-center gap-1.5 text-[10px] text-white/50 hover:text-white transition-colors px-2"
                                    title="Download File"
                                >
                                    <Download size={12} />
                                </button>
                                <CodeCopyButton code={codeText} codeId={codeId} lang={lang} />
                              </div>
                           </div>
                           <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              showLineNumbers={true}
                              lineNumberStyle={{minWidth: '2.5em', paddingRight: '1em', color: 'rgba(255,255,255,0.3)', fontSize: '11px'}}
                              customStyle={{
                                  margin: 0, 
                                  padding: '1.25rem', 
                                  background: 'transparent', 
                                  fontSize: '13px', 
                                  lineHeight: '1.6',
                                  fontFamily: '"JetBrains Mono", monospace'
                              }}
                              {...props}
                            >
                              {codeText}
                            </SyntaxHighlighter>
                            {isRunnable && previewStates[codeId] && (
                                <WebPreview code={codeText} lang={lang} />
                            )}
                        </div>
                      )
                    }
                    // Inline code - use theme-aware colors
                    return (
                      <code className={`${isLight ? 'bg-gray-200 text-gray-800 border-gray-300' : 'bg-white/10 text-white/80 border-white/10'} px-1.5 py-0.5 rounded text-[0.85em] font-mono border`} {...props}>
                        {children}
                      </code>
                    )
                  },
                  h1: ({node, ...props}) => <h1 {...props} className="text-xl font-bold text-text mt-8 mb-4 first:mt-0 tracking-tight" />,
                  h2: ({node, ...props}) => <h2 {...props} className="text-lg font-bold text-text mt-6 mb-3 tracking-tight" />,
                  h3: ({node, ...props}) => <h3 {...props} className="text-base font-semibold text-text mt-5 mb-2" />,
                  p: ({node, ...props}) => <p {...props} className="text-text-secondary mb-4 last:mb-0 leading-7 text-sm sm:text-[15px]" />,
                  ul: ({node, ...props}) => <ul {...props} className="list-disc pl-5 my-4 space-y-1 text-text-secondary marker:text-text-secondary text-sm sm:text-[15px]" />,
                  ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-5 my-4 space-y-1 text-text-secondary marker:text-text-secondary text-sm sm:text-[15px]" />,
                  
                  // Gray Box Artifact - plain text only, no markdown
                  blockquote: ({node, ...props}) => {
                      const getCleanText = (children: any): string => {
                        let txt = '';
                        React.Children.forEach(children, child => {
                            if (typeof child === 'string') txt += child;
                            else if (child.props && child.props.children) txt += getCleanText(child.props.children);
                        });
                        return txt;
                      };
                      const contentText = getCleanText(props.children);
                      return <BlockquoteBox contentText={contentText} isLight={isLight} lang={lang} />;
                  },
                  a: ({node, ...props}) => (
                      <a {...props} className="text-blue-400 hover:underline font-medium inline-flex items-center gap-0.5" target="_blank" rel="noopener noreferrer">
                          {props.children} <ExternalLink size={10} className="opacity-70"/>
                      </a>
                  ),
                  table: ({node, ...props}) => <div className="overflow-x-auto my-6 border border-white/10 rounded-lg"><table {...props} className="w-full text-left text-sm" /></div>,
                  thead: ({node, ...props}) => <thead {...props} className="bg-surface text-text border-b border-white/10" />,
                  th: ({node, ...props}) => <th {...props} className="px-4 py-3 font-semibold whitespace-nowrap" />,
                  td: ({node, ...props}) => <td {...props} className="px-4 py-3 border-t border-white/5 text-text-secondary" />,
                  hr: ({node, ...props}) => <hr {...props} className="my-8 border-white/5" />,
                  text: ({node, ...props}: any) => {
                    const textContent = String(props.children || node?.value || '');
                    if (searchHighlight && searchHighlight.trim()) {
                      return <HighlightText text={textContent} highlight={searchHighlight} isLight={isLight} />;
                    }
                    return <>{textContent}</>;
                  },
                }}
              >
                {displayText}
              </ReactMarkdown>
              {message.isThinking && !displayText && (
                <ThinkingIndicator 
                  mode={message.mode || ChatMode.STANDARD} 
                  lang={lang} 
                  isLight={isLight}
                  sourcesCount={message.groundingUrls?.length || 0}
                  isSearching={message.isSearching}
                />
              )}
            </div>
          )}
        </div>

        {/* Action Row */}
        {!message.isThinking && !isEditing && (
          <div className="flex items-center gap-1 mt-1 ml-1 animate-fade-in opacity-80 hover:opacity-100 transition-opacity">
             <button 
               onClick={handleCopyMessage} 
               className={`p-1.5 ${isLight ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'} rounded-md transition-all`}
               title={lang === 'ru' ? 'Копировать' : 'Copy'}
             >
                {isCopiedMessage ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
             </button>
             
             {/* Edit button for user messages */}
             {isUser && onEdit && onStartEdit && (
               <button 
                 onClick={onStartEdit}
                 className={`p-1.5 ${isLight ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'} rounded-md transition-all`}
                 title={lang === 'ru' ? 'Редактировать' : 'Edit'}
               >
                 <Edit2 size={14} />
               </button>
             )}
             
             <button 
                 onClick={onRegenerate} 
                 className={`p-1.5 ${isLight ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'} rounded-md transition-all`}
                 title={lang === 'ru' ? 'Перегенерировать' : 'Regenerate'}
             >
                 <RefreshCw size={14} />
             </button>

             {/* Speak button - only show if message has text */}
             {message.text && (
               <button 
                  onClick={handleToggleSpeak} 
                  className={`p-1.5 rounded-md transition-all ${isPlaying ? `${textMain} animate-pulse` : (isLight ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800')}`}
                  title={isPlaying ? (lang === 'ru' ? 'Стоп' : 'Stop') : (lang === 'ru' ? 'Озвучить' : 'Speak')}
               >
                  {isPlaying ? <Square size={14} fill="currentColor"/> : <Volume2 size={14} />}
               </button>
             )}
             
             {!isUser && onRate && (
                 <>
                    <button 
                        onClick={() => onRate('like')} 
                        className={`p-1.5 rounded-md transition-all ${message.rating === 'like' ? 'text-green-500' : (isLight ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800')}`}
                    >
                        <ThumbsUp size={14} />
                    </button>
                    <button 
                        onClick={() => onRate('dislike')} 
                        className={`p-1.5 rounded-md transition-all ${message.rating === 'dislike' ? 'text-red-500' : (isLight ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800')}`}
                    >
                        <ThumbsDown size={14} />
                    </button>
                 </>
             )}
          </div>
        )}

        {/* Sources Section - Horizontal Carousel with arrows */}
        {message.groundingUrls && message.groundingUrls.length > 0 && !message.isThinking && (
             <SourcesCarousel sources={message.groundingUrls} lang={lang} searchHighlight={searchHighlight} isLight={isLight} />
        )}

        {/* Follow-up Questions - Perplexity style */}
        {message.suggestedQuestions && message.suggestedQuestions.length > 0 && !message.isThinking && onFollowUpClick && (
          <div className="mt-3 w-full">
            <div className={`text-[11px] font-medium ${textSecondary} mb-1.5 px-1`}>
              {lang === 'ru' ? 'Связанные вопросы' : 'Related questions'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUpClick(q)}
                  className={`px-2.5 py-1.5 text-[13px] rounded-lg border transition-all ${
                    isLight 
                      ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300' 
                      : 'bg-[#0f0f0f] border-zinc-800/50 text-zinc-400 hover:bg-[#141414] hover:border-zinc-700'
                  }`}
                >
                  <HighlightText text={q} highlight={searchHighlight} isLight={isLight} />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
