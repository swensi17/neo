import React, { useEffect } from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
  lang?: string;
}

interface Shortcut {
  keys: string[];
  description: { en: string; ru: string };
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'N'], description: { en: 'New chat', ru: 'Новый чат' } },
  { keys: ['Ctrl', '/'], description: { en: 'Toggle search', ru: 'Поиск' } },
  { keys: ['Ctrl', 'E'], description: { en: 'Export data', ru: 'Экспорт данных' } },
  { keys: ['Ctrl', ','], description: { en: 'Open settings', ru: 'Настройки' } },
  { keys: ['Ctrl', 'K'], description: { en: 'Keyboard shortcuts', ru: 'Горячие клавиши' } },
  { keys: ['Enter'], description: { en: 'Send message', ru: 'Отправить' } },
  { keys: ['Shift', 'Enter'], description: { en: 'New line', ru: 'Новая строка' } },
  { keys: ['Esc'], description: { en: 'Close modal / Cancel', ru: 'Закрыть / Отмена' } },
  { keys: ['↑'], description: { en: 'Edit last message', ru: 'Редактировать последнее' } },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ 
  isOpen, 
  onClose, 
  isLight = false, 
  lang = 'en' 
}) => {
  const isRu = lang === 'ru';
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatKey = (key: string) => {
    if (key === 'Ctrl') return isMac ? '⌘' : 'Ctrl';
    if (key === 'Shift') return isMac ? '⇧' : 'Shift';
    if (key === 'Alt') return isMac ? '⌥' : 'Alt';
    return key;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md rounded-2xl shadow-2xl animate-slide-up ${
          isLight ? 'bg-white' : 'bg-[#0a0a0a] border border-zinc-800'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isLight ? 'border-gray-100' : 'border-zinc-800'
        }`}>
          <div className="flex items-center gap-2">
            <Command size={18} className={isLight ? 'text-gray-600' : 'text-zinc-400'} />
            <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {isRu ? 'Горячие клавиши' : 'Keyboard Shortcuts'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {SHORTCUTS.map((shortcut, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between py-2 ${
                  index < SHORTCUTS.length - 1 ? `border-b ${isLight ? 'border-gray-50' : 'border-zinc-800/50'}` : ''
                }`}
              >
                <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                  {isRu ? shortcut.description.ru : shortcut.description.en}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <React.Fragment key={i}>
                      <kbd className={`px-2 py-1 text-xs font-mono rounded ${
                        isLight 
                          ? 'bg-gray-100 text-gray-700 border border-gray-200' 
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}>
                        {formatKey(key)}
                      </kbd>
                      {i < shortcut.keys.length - 1 && (
                        <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className={`px-5 py-3 text-center border-t ${
          isLight ? 'border-gray-100 bg-gray-50' : 'border-zinc-800 bg-zinc-900/50'
        } rounded-b-2xl`}>
          <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
            {isRu ? 'Нажмите Esc для закрытия' : 'Press Esc to close'}
          </span>
        </div>
      </div>
    </div>
  );
};
