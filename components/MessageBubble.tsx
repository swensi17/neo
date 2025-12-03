
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
  lang?: string;
  isLight?: boolean;
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

// Sources carousel with scroll arrows
const SourcesCarousel = ({ sources, lang }: { sources: Array<{ title: string; uri: string }>, lang: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) el.addEventListener('scroll', checkScroll);
        return () => { if (el) el.removeEventListener('scroll', checkScroll); };
    }, []);

    const scroll = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === 'left' ? -250 : 250, behavior: 'smooth' });
        }
    };

    return (
        <div className="mt-4 w-full">
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-text-secondary" />
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        {lang === 'ru' ? 'Источники' : 'Sources'}
                    </span>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                    <button 
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className={`p-1 rounded-lg transition-all ${canScrollLeft ? 'hover:bg-white/10 text-text-secondary hover:text-text' : 'text-white/20 cursor-default'}`}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button 
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className={`p-1 rounded-lg transition-all ${canScrollRight ? 'hover:bg-white/10 text-text-secondary hover:text-text' : 'text-white/20 cursor-default'}`}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
            
            <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {sources.map((g, i) => (
                    <a 
                        key={i} 
                        href={g.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-52 sm:w-56 p-3 bg-surface border border-white/10 rounded-xl hover:bg-surface-hover transition-all group/source snap-start"
                    >
                        <div className="text-[10px] text-text-secondary truncate mb-1 flex items-center gap-1">
                            <LinkIcon size={10} /> {new URL(g.uri).hostname.replace('www.', '')}
                        </div>
                        <div className="text-xs font-medium text-text line-clamp-2 group-hover/source:text-accent transition-colors">
                            {g.title || (lang === 'ru' ? 'Результат поиска' : 'Web Result')}
                        </div>
                    </a>
                ))}
            </div>
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
  lang = 'en',
  isLight = false
}) => {
  const isUser = message.role === Role.USER;
  
  // Theme classes
  const bgUser = isLight ? 'bg-gray-100' : 'bg-black';
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
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 group animate-slide-up`}>
      <div className={`flex flex-col max-w-full md:max-w-[85%] lg:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Name / Role Label */}
        <div className="flex items-center gap-2 mb-1.5 px-1">
            {isUser ? (
                <span className={`text-[10px] font-semibold ${textSecondary} uppercase tracking-wider`}>{userProfile.name}</span>
            ) : (
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold ${textSecondary} uppercase tracking-wider flex items-center gap-1`}>
                        NEO <Sparkles size={10} className={isLight ? 'text-gray-700' : 'text-white'} />
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
              ? `${bgUser} ${textMain} rounded-2xl rounded-tr-sm px-4 py-3 border ${border} max-w-[85%] break-words` 
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
                                      className="max-w-[280px] max-h-[200px] w-auto h-auto object-contain rounded-2xl"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover/att:bg-black/10 transition-all rounded-2xl" />
                              </div>
                          ) : (
                              <div className={`flex items-center gap-3 px-4 py-3 min-w-[180px] max-w-[280px]`}>
                                  <div className={`p-2.5 rounded-xl ${isLight ? 'bg-gray-200' : 'bg-white/10'} ${textMain} flex-shrink-0`}>
                                      {getFileIcon(att.mimeType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium truncate ${textMain}`}>{att.name}</p>
                                      <p className={`text-xs ${textSecondary}`}>
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
            <div className={`whitespace-pre-line font-sans break-words ${isEditing ? 'opacity-50' : ''}`}>{displayText}</div>
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
                      return (
                        <div className="relative my-3 sm:my-4 w-full">
                            <div className="bg-black border border-white/10 rounded-xl shadow-sm relative overflow-hidden">
                                <button 
                                    onClick={() => navigator.clipboard.writeText(codeText)}
                                    className="absolute top-2 right-2 z-10 p-1.5 bg-white/5 text-white/50 rounded-lg hover:text-white hover:bg-white/10 border border-white/10 transition-all"
                                    title="Copy"
                                >
                                    <Copy size={14} />
                                </button>
                                <div className="max-h-[400px] overflow-y-auto p-4 pr-12 scrollbar-hide">
                                    <div className="text-white/80 text-sm leading-relaxed font-sans whitespace-pre-wrap break-words">
                                        {codeText}
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
                  
                  // Gray Box Artifact (Perplexity Style Prompt)
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
                      const [isCopied, setIsCopied] = React.useState(false);

                      return (
                        <div className="relative group/bq my-6">
                            <div className="bg-surface border border-white/10 rounded-xl p-5 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700"></div>
                                <blockquote {...props} className="text-text-secondary text-sm font-mono whitespace-pre-wrap ml-2" style={{border: 'none', padding: 0}} />
                            </div>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(contentText);
                                    setIsCopied(true);
                                    setTimeout(() => setIsCopied(false), 2000);
                                }}
                                className="absolute top-3 right-3 p-2 bg-surface-hover text-text-secondary rounded-lg hover:text-text border border-white/5 transition-all opacity-0 group-hover/bq:opacity-100"
                                title={lang === 'ru' ? 'Копировать' : 'Copy Content'}
                            >
                                {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                        </div>
                      );
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
               className={`p-1.5 ${textSecondary} ${hoverBg} rounded-md transition-all`}
               title={lang === 'ru' ? 'Копировать' : 'Copy'}
             >
                {isCopiedMessage ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
             </button>
             
             {/* Edit button for user messages */}
             {isUser && onEdit && onStartEdit && (
               <button 
                 onClick={onStartEdit}
                 className={`p-1.5 ${textSecondary} ${hoverBg} rounded-md transition-all`}
                 title={lang === 'ru' ? 'Редактировать' : 'Edit'}
               >
                 <Edit2 size={14} />
               </button>
             )}
             
             <button 
                 onClick={onRegenerate} 
                 className={`p-1.5 ${textSecondary} ${hoverBg} rounded-md transition-all`}
                 title={lang === 'ru' ? 'Перегенерировать' : 'Regenerate'}
             >
                 <RefreshCw size={14} />
             </button>

             {/* Speak button - only show if message has text */}
             {message.text && (
               <button 
                  onClick={handleToggleSpeak} 
                  className={`p-1.5 rounded-md ${hoverBg} transition-all ${isPlaying ? `${textMain} animate-pulse` : textSecondary}`}
                  title={isPlaying ? (lang === 'ru' ? 'Стоп' : 'Stop') : (lang === 'ru' ? 'Озвучить' : 'Speak')}
               >
                  {isPlaying ? <Square size={14} fill="currentColor"/> : <Volume2 size={14} />}
               </button>
             )}
             
             {!isUser && onRate && (
                 <>
                    <button 
                        onClick={() => onRate('like')} 
                        className={`p-1.5 rounded-md ${hoverBg} transition-all ${message.rating === 'like' ? 'text-green-500' : textSecondary}`}
                    >
                        <ThumbsUp size={14} />
                    </button>
                    <button 
                        onClick={() => onRate('dislike')} 
                        className={`p-1.5 rounded-md ${hoverBg} transition-all ${message.rating === 'dislike' ? 'text-red-500' : textSecondary}`}
                    >
                        <ThumbsDown size={14} />
                    </button>
                 </>
             )}
             

          </div>
        )}

        {/* Sources Section - Horizontal Carousel with arrows */}
        {message.groundingUrls && message.groundingUrls.length > 0 && !message.isThinking && (
             <SourcesCarousel sources={message.groundingUrls} lang={lang} />
        )}

      </div>
    </div>
  );
};
