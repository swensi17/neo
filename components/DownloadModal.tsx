import React, { useState } from 'react';
import { X, FileText, FileJson, FileCode, Code, Database, Globe, Table, Download } from 'lucide-react';
import { TRANSLATIONS, InterfaceLanguage } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (format: 'txt' | 'md' | 'json' | 'html' | 'csv' | 'py' | 'js' | 'xml' | 'yaml') => void;
  lang: InterfaceLanguage;
  isLight?: boolean;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, onDownload, lang, isLight = false }) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('md');
  
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  const formats = [
      { value: 'md', label: 'Markdown (.md)', icon: <FileCode size={18} /> },
      { value: 'txt', label: 'Plain Text (.txt)', icon: <FileText size={18} /> },
      { value: 'json', label: 'JSON Data (.json)', icon: <FileJson size={18} /> },
      { value: 'html', label: 'HTML Webpage (.html)', icon: <Globe size={18} /> },
      { value: 'csv', label: 'CSV Table (.csv)', icon: <Table size={18} /> },
      { value: 'py', label: 'Python Script (.py)', icon: <Code size={18} /> },
      { value: 'js', label: 'JavaScript (.js)', icon: <Code size={18} /> },
      { value: 'xml', label: 'XML Data (.xml)', icon: <Database size={18} /> },
      { value: 'yaml', label: 'YAML Config (.yaml)', icon: <Database size={18} /> },
  ];

  // Theme classes
  const bgMain = isLight ? 'bg-white' : 'bg-background';
  const textMain = isLight ? 'text-gray-900' : 'text-white';
  const textSecondary = isLight ? 'text-gray-500' : 'text-white/50';
  const border = isLight ? 'border-gray-200' : 'border-white/10';
  const hoverBg = isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10';
  const bgSurface = isLight ? 'bg-gray-100' : 'bg-white/5';

  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center ${isLight ? 'bg-black/50' : 'bg-black/90'} backdrop-blur-sm animate-fade-in p-4`}>
      <div className={`${bgMain} w-full max-w-sm rounded-2xl border ${border} shadow-2xl animate-slide-up flex flex-col`}>
        
        <div className={`flex justify-between items-center p-5 border-b ${border} shrink-0 rounded-t-2xl`}>
          <h2 className={`text-xl font-semibold ${textMain}`}>{t.download}</h2>
          <button onClick={onClose} className={`p-2 ${hoverBg} rounded-full ${textSecondary} transition-colors`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
            <CustomDropdown 
                label={t.exportFormat}
                value={selectedFormat}
                onChange={setSelectedFormat}
                options={formats}
                isLight={isLight}
                lang={lang}
            />

            <div className="flex gap-3 pt-2">
                <button 
                    onClick={onClose}
                    className={`flex-1 py-3.5 rounded-xl ${bgSurface} border ${border} ${textMain} font-medium ${hoverBg} transition-all text-base`}
                >
                    {t.cancel}
                </button>
                <button 
                    onClick={() => onDownload(selectedFormat as any)}
                    className={`flex-1 py-3.5 rounded-xl ${isLight ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-white/90'} font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-base`}
                >
                    <Download size={20} />
                    {t.downloadBtn}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
