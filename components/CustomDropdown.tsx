import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  isLight?: boolean;
  lang?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, label, isLight = false, lang = 'en' }) => {
  const isRu = lang === 'ru';
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Theme classes
  const bgMain = isLight ? 'bg-white' : 'bg-background';
  const bgSurface = isLight ? 'bg-gray-50' : 'bg-surface';
  const textMain = isLight ? 'text-gray-900' : 'text-white';
  const textSecondary = isLight ? 'text-gray-500' : 'text-white/50';
  const border = isLight ? 'border-gray-200' : 'border-white/10';
  const hoverBg = isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5';
  const activeBg = isLight ? 'bg-gray-100' : 'bg-white/10';

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className={`block text-xs ${textSecondary} mb-1.5 ml-1`}>{label}</label>}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${bgSurface} border ${border} rounded-xl px-4 py-3 flex items-center justify-between text-sm ${textMain} transition-all focus:outline-none`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="opacity-70">{selectedOption.icon}</span>}
          <span>{selectedOption?.label}</span>
        </div>
        <ChevronDown size={16} className={`${textSecondary} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-2 ${bgMain} border ${border} rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-60 flex flex-col`}>
          {options.length > 5 && (
              <div className={`p-2 border-b ${border} sticky top-0 ${bgMain} z-10`}>
                  <div className={`flex items-center ${bgSurface} border ${border} rounded-lg px-2 py-1.5`}>
                      <Search size={14} className={`${textSecondary} mr-2`}/>
                      <input 
                        ref={searchInputRef}
                        type="text" 
                        className={`bg-transparent border-none outline-none text-xs ${textMain} w-full`}
                        placeholder={isRu ? 'Поиск...' : 'Search...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                  </div>
              </div>
          )}
          
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? filteredOptions.map((option) => (
                <div
                key={option.value}
                onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                }}
                className={`px-4 py-3 flex items-center justify-between cursor-pointer text-sm transition-all ${option.value === value ? `${activeBg} ${textMain}` : `${textSecondary} ${hoverBg}`}`}
                >
                <div className="flex items-center gap-2 truncate">
                    {option.icon}
                    <span>{option.label}</span>
                </div>
                {option.value === value && <Check size={14} className="text-blue-500" />}
                </div>
            )) : (
                <div className={`p-4 text-center text-xs ${textSecondary}`}>{isRu ? 'Ничего не найдено' : 'No options found'}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
