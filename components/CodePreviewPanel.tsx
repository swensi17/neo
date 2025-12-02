import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, Code, Copy, Check, Download, Maximize2, Minimize2, RefreshCw, ExternalLink } from 'lucide-react';

interface CodePreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  isLight?: boolean;
  lang?: string;
}

export const CodePreviewPanel: React.FC<CodePreviewPanelProps> = ({
  isOpen,
  onClose,
  code,
  language,
  isLight = false,
  lang = 'en'
}) => {
  const isRu = lang === 'ru';
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);

  const bgMain = isLight ? 'bg-white' : 'bg-[#0a0a0a]';
  const bgHeader = isLight ? 'bg-gray-100' : 'bg-[#111]';
  const textMain = isLight ? 'text-gray-900' : 'text-white';
  const textSecondary = isLight ? 'text-gray-500' : 'text-white/50';
  const border = isLight ? 'border-gray-200' : 'border-white/10';

  // Prepare full HTML document for preview
  const fullHtml = useMemo(() => {
    if (language === 'html' || code.includes('<!DOCTYPE') || code.includes('<html')) {
      return code;
    }
    // Wrap CSS or JS in HTML
    if (language === 'css') {
      return `<!DOCTYPE html><html><head><style>${code}</style></head><body><div style="padding:20px;color:#fff;">CSS Applied</div></body></html>`;
    }
    if (language === 'javascript' || language === 'js') {
      return `<!DOCTYPE html><html><head></head><body><div id="app" style="padding:20px;color:#fff;"></div><script>${code}</script></body></html>`;
    }
    return code;
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preview.${language === 'html' ? 'html' : language === 'css' ? 'css' : 'js'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`
        fixed top-0 right-0 h-full z-[100] flex flex-col
        ${bgMain} border-l ${border} shadow-2xl
        animate-slide-in-right
        ${isFullscreen ? 'w-full' : 'w-full sm:w-[80%] md:w-[50%] lg:w-[45%] xl:w-[40%]'}
      `}
      style={{ minWidth: '320px' }}
    >
      {/* Header */}
      <div className={`${bgHeader} border-b ${border} px-4 py-3 flex items-center justify-between flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className={`text-sm font-medium ${textMain}`}>{isRu ? 'Превью' : 'Preview'}</span>
          <span className={`text-xs ${textSecondary} px-2 py-0.5 rounded bg-white/5`}>{language.toUpperCase()}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className={`p-2 ${textSecondary} hover:${textMain} hover:bg-white/5 rounded-lg transition-all`}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className={`p-2 ${textSecondary} hover:${textMain} hover:bg-white/5 rounded-lg transition-all`}
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 ${textSecondary} hover:${textMain} hover:bg-white/5 rounded-lg transition-all`}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className={`p-2 ${textSecondary} hover:text-red-400 hover:bg-white/5 rounded-lg transition-all`}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${bgHeader} border-b ${border} px-4 flex items-center gap-1 flex-shrink-0`}>
        <button
          onClick={() => setActiveTab('preview')}
          className={`
            flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
            ${activeTab === 'preview' 
              ? `${textMain} border-blue-500` 
              : `${textSecondary} border-transparent hover:${textMain}`
            }
          `}
        >
          <Play size={14} /> {isRu ? 'Превью' : 'Preview'}
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`
            flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
            ${activeTab === 'code' 
              ? `${textMain} border-blue-500` 
              : `${textSecondary} border-transparent hover:${textMain}`
            }
          `}
        >
          <Code size={14} /> {isRu ? 'Код' : 'Code'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="w-full h-full bg-white">
            <iframe
              key={key}
              srcDoc={fullHtml}
              className="w-full h-full border-none"
              title="Code Preview"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            />
          </div>
        ) : (
          <div className="w-full h-full overflow-auto p-4">
            <pre className={`text-sm font-mono ${textMain} whitespace-pre-wrap break-words`}>
              {code}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`${bgHeader} border-t ${border} px-4 py-3 flex items-center justify-between flex-shrink-0`}>
        <span className={`text-xs ${textSecondary}`}>
          {code.length} {isRu ? 'символов' : 'characters'} • {code.split('\n').length} {isRu ? 'строк' : 'lines'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm ${textSecondary} hover:${textMain} bg-white/5 hover:bg-white/10 rounded-lg transition-all`}
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Копировать' : 'Copy')}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
          >
            <Download size={14} /> {isRu ? 'Скачать' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to extract code blocks from message text
export const extractCodeForPreview = (text: string): { code: string; language: string } | null => {
  // Match code blocks with html, css, or javascript
  const codeBlockRegex = /```(html|css|javascript|js)\n([\s\S]*?)```/gi;
  const matches = [...text.matchAll(codeBlockRegex)];
  
  if (matches.length === 0) return null;

  // Prioritize HTML blocks, then combine if multiple
  let htmlCode = '';
  let cssCode = '';
  let jsCode = '';

  for (const match of matches) {
    const lang = match[1].toLowerCase();
    const code = match[2].trim();
    
    if (lang === 'html') htmlCode = code;
    else if (lang === 'css') cssCode += code + '\n';
    else if (lang === 'javascript' || lang === 'js') jsCode += code + '\n';
  }

  // If we have HTML, inject CSS and JS into it
  if (htmlCode) {
    if (cssCode && !htmlCode.includes('<style>')) {
      htmlCode = htmlCode.replace('</head>', `<style>${cssCode}</style></head>`);
      if (!htmlCode.includes('</head>')) {
        htmlCode = `<style>${cssCode}</style>` + htmlCode;
      }
    }
    if (jsCode && !htmlCode.includes('<script>')) {
      htmlCode = htmlCode.replace('</body>', `<script>${jsCode}</script></body>`);
      if (!htmlCode.includes('</body>')) {
        htmlCode = htmlCode + `<script>${jsCode}</script>`;
      }
    }
    return { code: htmlCode, language: 'html' };
  }

  // Return first found code block
  if (matches.length > 0) {
    return { 
      code: matches[0][2].trim(), 
      language: matches[0][1].toLowerCase() === 'js' ? 'javascript' : matches[0][1].toLowerCase() 
    };
  }

  return null;
};
