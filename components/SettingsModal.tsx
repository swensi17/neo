import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AppSettings, TRANSLATIONS, InterfaceLanguage, ApiKey, KnowledgeItem } from '../types';
import { X, Upload, User, Moon, Sun, Trash2, Plus, Key, Check, AlertCircle, Loader2, Search, Sparkles, ChevronRight, Volume2, Lock, Palette, Languages, Bot, Zap, MessageCircle, Mail, HelpCircle, Github } from 'lucide-react';
import { getApiKeys, saveApiKeys, validateApiKey } from '../services/geminiService';

// 40 Preset Personas
const PRESET_PERSONAS = [
  { id: 'analyst', name: { en: 'Analyst', ru: 'Аналитик' }, prompt: 'You are a data analyst. Provide objective, data-driven insights.' },
  { id: 'artist', name: { en: 'Artist', ru: 'Художник' }, prompt: 'You are a creative artist. Describe visuals vividly and inspire creativity.' },
  { id: 'chef', name: { en: 'Chef', ru: 'Шеф-повар' }, prompt: 'You are a professional chef. Share recipes and cooking tips.' },
  { id: 'coach', name: { en: 'Coach', ru: 'Коуч' }, prompt: 'You are a life coach. Motivate and help achieve goals.' },
  { id: 'comedian', name: { en: 'Comedian', ru: 'Комик' }, prompt: 'You are a comedian. Be witty and make jokes.' },
  { id: 'consultant', name: { en: 'Consultant', ru: 'Консультант' }, prompt: 'You are a business consultant. Give strategic advice.' },
  { id: 'copywriter', name: { en: 'Copywriter', ru: 'Копирайтер' }, prompt: 'You are a copywriter. Write compelling marketing copy.' },
  { id: 'critic', name: { en: 'Critic', ru: 'Критик' }, prompt: 'You are a critic. Analyze and review objectively.' },
  { id: 'designer', name: { en: 'Designer', ru: 'Дизайнер' }, prompt: 'You are a UI/UX designer. Focus on user experience.' },
  { id: 'detective', name: { en: 'Detective', ru: 'Детектив' }, prompt: 'You are a detective. Analyze clues and solve mysteries.' },
  { id: 'doctor', name: { en: 'Doctor', ru: 'Врач' }, prompt: 'You are a medical advisor. Provide health information.' },
  { id: 'economist', name: { en: 'Economist', ru: 'Экономист' }, prompt: 'You are an economist. Explain economic concepts.' },
  { id: 'editor', name: { en: 'Editor', ru: 'Редактор' }, prompt: 'You are an editor. Improve and polish text.' },
  { id: 'engineer', name: { en: 'Engineer', ru: 'Инженер' }, prompt: 'You are an engineer. Solve technical problems.' },
  { id: 'entrepreneur', name: { en: 'Entrepreneur', ru: 'Предприниматель' }, prompt: 'You are an entrepreneur. Share business insights.' },
  { id: 'fitness', name: { en: 'Fitness Trainer', ru: 'Фитнес-тренер' }, prompt: 'You are a fitness trainer. Give workout advice.' },
  { id: 'gamer', name: { en: 'Gamer', ru: 'Геймер' }, prompt: 'You are a gaming expert. Discuss games and strategies.' },
  { id: 'historian', name: { en: 'Historian', ru: 'Историк' }, prompt: 'You are a historian. Share historical knowledge.' },
  { id: 'journalist', name: { en: 'Journalist', ru: 'Журналист' }, prompt: 'You are a journalist. Report facts objectively.' },
  { id: 'lawyer', name: { en: 'Lawyer', ru: 'Юрист' }, prompt: 'You are a legal advisor. Explain legal matters.' },
  { id: 'marketer', name: { en: 'Marketer', ru: 'Маркетолог' }, prompt: 'You are a marketing expert. Create marketing strategies.' },
  { id: 'mentor', name: { en: 'Mentor', ru: 'Ментор' }, prompt: 'You are a wise mentor. Guide with experience.' },
  { id: 'musician', name: { en: 'Musician', ru: 'Музыкант' }, prompt: 'You are a musician. Discuss music theory and composition.' },
  { id: 'philosopher', name: { en: 'Philosopher', ru: 'Философ' }, prompt: 'You are a philosopher. Explore deep questions.' },
  { id: 'photographer', name: { en: 'Photographer', ru: 'Фотограф' }, prompt: 'You are a photographer. Share photography tips.' },
  { id: 'poet', name: { en: 'Poet', ru: 'Поэт' }, prompt: 'You are a poet. Write beautiful verses.' },
  { id: 'politician', name: { en: 'Politician', ru: 'Политик' }, prompt: 'You are a political analyst. Discuss politics.' },
  { id: 'programmer', name: { en: 'Programmer', ru: 'Программист' }, prompt: 'You are a senior developer. Write clean, efficient code.' },
  { id: 'psychologist', name: { en: 'Psychologist', ru: 'Психолог' }, prompt: 'You are a psychologist. Provide emotional support.' },
  { id: 'researcher', name: { en: 'Researcher', ru: 'Исследователь' }, prompt: 'You are a researcher. Provide thorough analysis.' },
  { id: 'scientist', name: { en: 'Scientist', ru: 'Ученый' }, prompt: 'You are a scientist. Explain scientific concepts.' },
  { id: 'storyteller', name: { en: 'Storyteller', ru: 'Рассказчик' }, prompt: 'You are a storyteller. Create engaging narratives.' },
  { id: 'strategist', name: { en: 'Strategist', ru: 'Стратег' }, prompt: 'You are a strategist. Plan and optimize.' },
  { id: 'teacher', name: { en: 'Teacher', ru: 'Учитель' }, prompt: 'You are a patient teacher. Explain simply.' },
  { id: 'therapist', name: { en: 'Therapist', ru: 'Терапевт' }, prompt: 'You are a therapist. Listen and support.' },
  { id: 'translator', name: { en: 'Translator', ru: 'Переводчик' }, prompt: 'You are a translator. Translate accurately.' },
  { id: 'traveler', name: { en: 'Traveler', ru: 'Путешественник' }, prompt: 'You are a travel expert. Share travel tips.' },
  { id: 'tutor', name: { en: 'Tutor', ru: 'Репетитор' }, prompt: 'You are a tutor. Help with learning.' },
  { id: 'writer', name: { en: 'Writer', ru: 'Писатель' }, prompt: 'You are a creative writer. Craft compelling stories.' },
  { id: 'youtuber', name: { en: 'YouTuber', ru: 'Ютубер' }, prompt: 'You are a content creator. Create engaging content.' },
].sort((a, b) => a.name.en.localeCompare(b.name.en));

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  onClearHistory: () => void;
  initialPage?: SubPage;
}

type SubPage = 'main' | 'api' | 'language' | 'profile' | 'persona' | 'appearance' | 'data' | 'sound' | 'support';

// 50+ Languages for AI responses
const AI_LANGUAGES = [
  { value: 'ru', label: 'Русский', icon: '🇷🇺' },
  { value: 'en', label: 'English', icon: '🇺🇸' },
  { value: 'uk', label: 'Українська', icon: '🇺🇦' },
  { value: 'kk', label: 'Қазақша', icon: '🇰🇿' },
  { value: 'uz', label: 'O\'zbekcha', icon: '🇺🇿' },
  { value: 'de', label: 'Deutsch', icon: '🇩🇪' },
  { value: 'fr', label: 'Français', icon: '🇫🇷' },
  { value: 'es', label: 'Español', icon: '🇪🇸' },
  { value: 'it', label: 'Italiano', icon: '🇮🇹' },
  { value: 'pt', label: 'Português', icon: '🇵🇹' },
  { value: 'zh', label: '中文', icon: '🇨🇳' },
  { value: 'ja', label: '日本語', icon: '🇯🇵' },
  { value: 'ko', label: '한국어', icon: '🇰🇷' },
  { value: 'ar', label: 'العربية', icon: '🇸🇦' },
  { value: 'hi', label: 'हिन्दी', icon: '🇮🇳' },
  { value: 'tr', label: 'Türkçe', icon: '🇹🇷' },
  { value: 'pl', label: 'Polski', icon: '🇵🇱' },
  { value: 'nl', label: 'Nederlands', icon: '🇳🇱' },
  { value: 'vi', label: 'Tiếng Việt', icon: '🇻🇳' },
  { value: 'th', label: 'ไทย', icon: '🇹🇭' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, userProfile, onUpdateProfile, settings, onUpdateSettings, onClearHistory, initialPage
}) => {
  const [subPage, setSubPage] = useState<SubPage>('main');
  const [name, setName] = useState(userProfile.name);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [customPrompt, setCustomPrompt] = useState(settings.customSystemInstruction || '');
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{valid: boolean; error?: string} | null>(null);

  const [personaSearch, setPersonaSearch] = useState('');
  const [langSearch, setLangSearch] = useState('');
  
  // Check if desktop (md breakpoint = 768px)
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[settings.language];
  const isRu = settings.language === 'ru';
  const isLight = settings.theme === 'light';

  // Theme colors - matte black style
  const bg = isLight ? 'bg-white' : 'bg-black';
  const text = isLight ? 'text-gray-900' : 'text-white';
  const textMuted = isLight ? 'text-gray-500' : 'text-zinc-500';
  const divider = isLight ? 'border-gray-100' : 'border-zinc-800/30';
  const itemBg = isLight ? 'active:bg-gray-100' : 'active:bg-[#111111]';
  const inputBg = isLight ? 'bg-gray-100' : 'bg-[#111111]';

  // Resize listener for desktop detection
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only reset state when modal opens, not on every settings change
  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    // Only run when modal opens (isOpen changes from false to true)
    if (isOpen && !prevIsOpen.current) {
      setSubPage(initialPage || (isDesktop ? 'profile' : 'main'));
      setName(userProfile.name);
      setAvatar(userProfile.avatar);
      setBio(userProfile.bio || '');
      setCustomPrompt(settings.customSystemInstruction || '');
      setApiKeys(getApiKeys());
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, initialPage, isDesktop]);

  if (!isOpen) return null;

  const updateProfile = (updates: Partial<UserProfile>) => {
    onUpdateProfile({ ...userProfile, name, avatar, bio, ...updates });
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    onUpdateSettings({ ...settings, ...updates });
  };

  // API Key functions
  const handleValidateKey = async () => {
    if (!newKeyValue.trim()) return;
    setIsValidating(true);
    setValidationResult(null);
    const result = await validateApiKey(newKeyValue.trim());
    setValidationResult(result);
    setIsValidating(false);
  };

  const handleAddKey = () => {
    if (!newKeyValue.trim() || !validationResult?.valid) return;
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName.trim() || `API Key ${apiKeys.length + 1}`,
      key: newKeyValue.trim(),
      isValid: true,
      isActive: apiKeys.length === 0,
      lastChecked: Date.now()
    };
    const updated = [...apiKeys, newKey];
    setApiKeys(updated);
    saveApiKeys(updated);
    setNewKeyName('');
    setNewKeyValue('');
    setValidationResult(null);
  };

  const handleDeleteKey = (id: string) => {
    const updated = apiKeys.filter(k => k.id !== id);
    if (updated.length > 0 && !updated.some(k => k.isActive)) updated[0].isActive = true;
    setApiKeys(updated);
    saveApiKeys(updated);
  };

  const handleToggleKeyActive = (id: string) => {
    const updated = apiKeys.map(k => ({ ...k, isActive: k.id === id ? !k.isActive : k.isActive }));
    setApiKeys(updated);
    saveApiKeys(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress image to prevent crashes with large files
      const img = new Image();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxSize = 256; // Max avatar size
            let { width, height } = img;
            
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedData = canvas.toDataURL('image/jpeg', 0.8);
              setAvatar(compressedData);
              updateProfile({ avatar: compressedData });
            }
          } catch (err) {
            console.error('Error compressing image:', err);
            // Fallback to original if compression fails
            setAvatar(reader.result as string);
            updateProfile({ avatar: reader.result as string });
          }
        };
        img.onerror = () => {
          console.error('Error loading image');
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        console.error('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPersona = (id: string) => {
    const persona = PRESET_PERSONAS.find(p => p.id === id);
    if (persona) {
      updateSettings({ selectedPersona: id, customSystemInstruction: persona.prompt });
      setCustomPrompt(persona.prompt);
    }
  };

  const filteredPersonas = PRESET_PERSONAS.filter(p => 
    p.name.en.toLowerCase().includes(personaSearch.toLowerCase()) ||
    p.name.ru.toLowerCase().includes(personaSearch.toLowerCase())
  );

  const filteredLanguages = AI_LANGUAGES.filter(l => 
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.value.toLowerCase().includes(langSearch.toLowerCase())
  );

  // Menu Item Component
  const MenuItem = ({ icon, label, value, onClick, danger }: { icon: React.ReactNode, label: string, value?: string, onClick?: () => void, danger?: boolean }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between py-3.5 px-1 ${itemBg} transition-colors`}
    >
      <div className="flex items-center gap-3">
        <span className={danger ? 'text-red-500' : textMuted}>{icon}</span>
        <span className={`text-[15px] ${danger ? 'text-red-500' : text}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className={`text-[15px] ${textMuted}`}>{value}</span>}
        {onClick && <ChevronRight size={18} className={textMuted} />}
      </div>
    </button>
  );

  // Toggle Item Component
  const ToggleItem = ({ icon, label, desc, value, onChange }: { icon: React.ReactNode, label: string, desc?: string, value: boolean, onChange: () => void }) => (
    <div className="flex items-center justify-between py-3.5 px-1">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={textMuted}>{icon}</span>
        <div className="min-w-0">
          <div className={`text-[15px] ${text}`}>{label}</div>
          {desc && <div className={`text-xs ${textMuted} mt-0.5`}>{desc}</div>}
        </div>
      </div>
      <button onClick={onChange}
        className={`w-[51px] h-[31px] rounded-full p-[2px] transition-all flex-shrink-0 ${value ? 'bg-green-500' : (isLight ? 'bg-gray-200' : 'bg-zinc-700')}`}>
        <div className={`w-[27px] h-[27px] rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  // Section Header
  const SectionHeader = ({ title }: { title: string }) => (
    <div className={`text-xs font-medium ${textMuted} uppercase tracking-wider px-1 pt-6 pb-2`}>{title}</div>
  );

  // Back Header
  const BackHeader = ({ title, onBack, onSave }: { title: string, onBack: () => void, onSave?: () => void }) => (
    <div className="flex items-center justify-between py-2 px-1 mb-3 mt-1">
      <button onClick={onBack} className={`w-8 h-8 flex items-center justify-center rounded-full ${isLight ? 'bg-gray-100 active:bg-gray-200' : 'bg-[#111111] active:bg-[#1a1a1a]'} touch-manipulation`}>
        <ChevronRight size={18} className={`${textMuted} rotate-180`} />
      </button>
      <span className={`text-[15px] font-medium ${text}`}>{title}</span>
      {onSave ? (
        <button onClick={onSave} className={`w-8 h-8 flex items-center justify-center rounded-full ${isLight ? 'bg-gray-100 active:bg-gray-200' : 'bg-[#111111] active:bg-[#1a1a1a]'} touch-manipulation`}>
          <Check size={18} className="text-blue-500" />
        </button>
      ) : (
        <div className="w-8" />
      )}
    </div>
  );

  // Main Settings Page
  const renderMain = () => (
    <div className="space-y-0">
      {/* Profile Section */}
      <div className="flex items-center gap-4 py-4 px-1">
        <div 
          className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden"
          onClick={() => setSubPage('profile')}
        >
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-white">{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0" onClick={() => setSubPage('profile')}>
          <div className={`text-[17px] font-medium ${text}`}>{name}</div>
          <div className={`text-[13px] ${textMuted}`}>{bio || (isRu ? 'Добавить описание' : 'Add bio')}</div>
        </div>
        <ChevronRight size={20} className={textMuted} />
      </div>

      <div className={`border-t ${divider}`} />

      {/* API Section */}
      <SectionHeader title="API" />
      <MenuItem 
        icon={<Key size={20} />} 
        label={isRu ? 'API ключи' : 'API Keys'} 
        value={apiKeys.length > 0 ? `${apiKeys.filter(k => k.isActive).length} ${isRu ? 'актив.' : 'active'}` : undefined}
        onClick={() => setSubPage('api')} 
      />

      <div className={`border-t ${divider}`} />

      {/* Personalization */}
      <SectionHeader title={isRu ? 'Персонализация' : 'Personalization'} />
      <MenuItem 
        icon={<Bot size={20} />} 
        label={isRu ? 'Роль AI' : 'AI Role'} 
        value={settings.selectedPersona ? (PRESET_PERSONAS.find(p => p.id === settings.selectedPersona)?.[isRu ? 'name' : 'name']?.[isRu ? 'ru' : 'en']) : undefined}
        onClick={() => setSubPage('persona')} 
      />
      <div className={`border-t ${divider} ml-12`} />
      <ToggleItem 
        icon={<Volume2 size={20} />} 
        label={isRu ? 'Звуковые уведомления' : 'Sound Notifications'} 
        value={settings.soundEnabled} 
        onChange={() => updateSettings({ soundEnabled: !settings.soundEnabled })} 
      />
      <div className={`border-t ${divider} ml-12`} />
      <ToggleItem 
        icon={<Zap size={20} />} 
        label={isRu ? 'Режим 18+' : '18+ Mode'} 
        desc={isRu ? 'Снять ограничения контента' : 'Remove content restrictions'}
        value={settings.adultMode} 
        onChange={() => updateSettings({ adultMode: !settings.adultMode })} 
      />

      <div className={`border-t ${divider}`} />

      {/* App Settings */}
      <SectionHeader title={isRu ? 'Приложение' : 'Application'} />
      <MenuItem 
        icon={<Languages size={20} />} 
        label={isRu ? 'Язык' : 'Language'} 
        value={settings.language === 'ru' ? 'Русский' : 'English'}
        onClick={() => setSubPage('language')} 
      />
      <div className={`border-t ${divider} ml-12`} />
      <MenuItem 
        icon={<Palette size={20} />} 
        label={isRu ? 'Тема' : 'Theme'} 
        value={settings.theme === 'dark' ? (isRu ? 'Тёмная' : 'Dark') : (isRu ? 'Светлая' : 'Light')}
        onClick={() => setSubPage('appearance')} 
      />

      <div className={`border-t ${divider}`} />

      {/* Data */}
      <SectionHeader title={isRu ? 'Данные' : 'Data'} />
      <ToggleItem 
        icon={<Lock size={20} />} 
        label={isRu ? 'Инкогнито' : 'Incognito'} 
        desc={isRu ? 'Не сохранять историю' : 'Don\'t save history'}
        value={settings.incognito} 
        onChange={() => updateSettings({ incognito: !settings.incognito })} 
      />
      <div className={`border-t ${divider} ml-12`} />
      <MenuItem 
        icon={<Trash2 size={20} />} 
        label={isRu ? 'Очистить историю' : 'Clear History'} 
        onClick={() => { if(confirm(t.clearHistoryConfirm)) { onClearHistory(); } }}
        danger
      />

      <div className={`border-t ${divider}`} />

      {/* Support */}
      <SectionHeader title={isRu ? 'Поддержка' : 'Support'} />
      <MenuItem 
        icon={<HelpCircle size={20} />} 
        label={isRu ? 'Связаться с разработчиком' : 'Contact Developer'} 
        onClick={() => setSubPage('support')} 
      />
    </div>
  );


  // API Keys Page
  const renderApi = () => (
    <div>
      <BackHeader title={isRu ? 'API ключи' : 'API Keys'} onBack={() => setSubPage('main')} />
      
      {/* Add Key */}
      <div className="space-y-2 mb-6">
        <input 
          type="text" 
          value={newKeyName} 
          onChange={(e) => setNewKeyName(e.target.value)}
          className={`w-full ${inputBg} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} rounded-lg px-3.5 py-2.5 ${text} text-[14px] focus:outline-none placeholder-zinc-600`}
          placeholder={isRu ? 'Название (опционально)' : 'Name (optional)'} 
        />
        <input 
          type="text" 
          value={newKeyValue} 
          onChange={(e) => { setNewKeyValue(e.target.value); setValidationResult(null); }}
          className={`w-full ${inputBg} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} rounded-lg px-3.5 py-2.5 ${text} text-[14px] focus:outline-none font-mono placeholder-zinc-600`}
          placeholder="AIzaSy..." 
        />
        
        <div className="flex gap-2">
          <button 
            onClick={handleValidateKey} 
            disabled={!newKeyValue.trim() || isValidating}
            className={`flex-1 py-2.5 rounded-lg text-[14px] font-medium transition-all flex items-center justify-center gap-2 ${
              newKeyValue.trim() 
                ? (isLight ? 'bg-gray-900 text-white' : 'bg-white text-black')
                : (isLight ? 'bg-gray-200 text-gray-400' : 'bg-[#1a1a1a] text-zinc-600')
            }`}
          >
            {isValidating ? <Loader2 size={16} className="animate-spin" /> : (isRu ? 'Проверить' : 'Verify')}
          </button>
          
          {validationResult?.valid && (
            <button 
              onClick={handleAddKey}
              className="flex-1 py-2.5 rounded-lg text-[14px] font-medium bg-green-500 text-white flex items-center justify-center gap-2"
            >
              <Plus size={16} />{isRu ? 'Добавить' : 'Add'}
            </button>
          )}
        </div>
        
        {validationResult && (
          <div className={`flex items-center gap-2 text-[13px] py-2 ${validationResult.valid ? 'text-green-500' : 'text-red-500'}`}>
            {validationResult.valid ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{validationResult.valid ? (isRu ? 'Ключ работает!' : 'Key works!') : validationResult.error}</span>
          </div>
        )}
      </div>

      {/* Saved Keys */}
      {apiKeys.length > 0 && (
        <div className="space-y-2">
          <div className={`text-[11px] ${textMuted} uppercase tracking-wider mb-2`}>{isRu ? 'Сохранённые' : 'Saved'}</div>
          {apiKeys.map(key => (
            <div key={key.id} className={`${inputBg} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} rounded-lg p-3 flex items-center gap-3`}>
              <button 
                onClick={() => handleToggleKeyActive(key.id)} 
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${key.isActive ? 'bg-green-500' : (isLight ? 'bg-gray-300' : 'bg-zinc-700')}`}
              >
                {key.isActive && <Check size={12} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-[14px] ${text} truncate`}>{key.name}</div>
                <div className={`text-[12px] ${textMuted} font-mono`}>{key.key.slice(0, 8)}...{key.key.slice(-4)}</div>
              </div>
              <button onClick={() => handleDeleteKey(key.id)} className="text-red-500 p-1.5">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className={`mt-4 p-3 ${isLight ? 'bg-gray-50' : 'bg-[#0a0a0a]'} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} rounded-lg`}>
        <div className={`text-[13px] ${textMuted} space-y-2`}>
          <p className="font-medium">{isRu ? 'Как получить ключ:' : 'How to get a key:'}</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>{isRu ? 'Откройте ' : 'Open '}<a href="https://aistudio.google.com/apikey" target="_blank" className="text-blue-500">Google AI Studio</a></li>
            <li>{isRu ? 'Нажмите "Create API Key"' : 'Click "Create API Key"'}</li>
            <li>{isRu ? 'Скопируйте и вставьте выше' : 'Copy and paste above'}</li>
          </ol>
        </div>
      </div>
    </div>
  );

  // Profile Page
  const renderProfile = () => (
    <div>
      <BackHeader 
        title={isRu ? 'Профиль' : 'Profile'} 
        onBack={() => setSubPage('main')} 
        onSave={() => { updateProfile({ name, bio, avatar }); setSubPage('main'); }}
      />
      
      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div 
          className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden relative group"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-semibold text-white">{name.charAt(0).toUpperCase()}</span>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Upload size={24} className="text-white" />
          </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      {/* Name */}
      <div className="mb-3">
        <label className={`text-[11px] ${textMuted} block mb-1.5`}>{isRu ? 'Имя' : 'Name'}</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          className={`w-full ${inputBg} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} rounded-lg px-3.5 py-2.5 ${text} text-[14px] focus:outline-none touch-manipulation placeholder-zinc-600`}
        />
      </div>

      {/* Bio */}
      <div>
        <label className={`text-[11px] ${textMuted} block mb-1.5`}>{isRu ? 'О себе' : 'About'}</label>
        <textarea 
          value={bio} 
          onChange={(e) => setBio(e.target.value)}
          onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
          className={`w-full ${inputBg} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} rounded-lg px-3.5 py-2.5 ${text} text-[14px] focus:outline-none min-h-[80px] resize-none touch-manipulation placeholder-zinc-600`}
          placeholder={isRu ? 'Расскажите о себе...' : 'Tell about yourself...'}
        />
      </div>
    </div>
  );

  // Persona Page
  const renderPersona = () => (
    <div>
      <BackHeader 
        title={isRu ? 'Роль AI' : 'AI Role'} 
        onBack={() => setSubPage('main')} 
        onSave={() => { updateSettings({ customSystemInstruction: customPrompt }); setSubPage('main'); }}
      />
      
      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
        <input 
          type="text" 
          value={personaSearch} 
          onChange={(e) => setPersonaSearch(e.target.value)}
          className={`w-full ${inputBg} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} rounded-lg pl-10 pr-3.5 py-2.5 ${text} text-[14px] focus:outline-none placeholder-zinc-600`}
          placeholder={isRu ? 'Поиск...' : 'Search...'}
        />
      </div>

      {/* Reset */}
      {settings.selectedPersona && (
        <button 
          onClick={(e) => { e.stopPropagation(); updateSettings({ selectedPersona: undefined, customSystemInstruction: '' }); setCustomPrompt(''); }}
          className="w-full text-red-500 text-[14px] py-2 mb-3 touch-manipulation"
        >
          {isRu ? 'Сбросить роль' : 'Reset Role'}
        </button>
      )}

      {/* List - fixed height scrollable area */}
      <div className={`rounded-lg ${isLight ? 'bg-gray-50' : 'bg-[#0a0a0a]'} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} overflow-hidden mb-4`}>
        <div className="max-h-[240px] overflow-y-auto">
          {filteredPersonas.map(p => (
            <button 
              key={p.id}
              onClick={(e) => { e.stopPropagation(); selectPersona(p.id); }}
              className={`w-full flex items-center justify-between py-2.5 px-3.5 ${itemBg} border-b ${isLight ? 'border-gray-100' : 'border-zinc-800/30'} last:border-b-0 touch-manipulation`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles size={16} className={textMuted} />
                <span className={`text-[14px] ${text}`}>{isRu ? p.name.ru : p.name.en}</span>
              </div>
              {settings.selectedPersona === p.id && <Check size={18} className="text-blue-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div>
        <label className={`text-[11px] ${textMuted} block mb-1.5`}>{isRu ? 'Свои инструкции' : 'Custom Instructions'}</label>
        <textarea 
          value={customPrompt} 
          onChange={(e) => setCustomPrompt(e.target.value)}
          onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
          className={`w-full ${inputBg} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} rounded-lg px-3.5 py-2.5 ${text} text-[14px] focus:outline-none min-h-[80px] resize-none touch-manipulation placeholder-zinc-600`}
          placeholder={isRu ? 'Опишите как AI должен себя вести...' : 'Describe how AI should behave...'}
        />
      </div>
    </div>
  );

  // Language Page
  const renderLanguage = () => (
    <div>
      <BackHeader title={isRu ? 'Язык' : 'Language'} onBack={() => setSubPage('main')} />
      
      {/* Search for all languages */}
      <div className="relative mb-3">
        <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
        <input 
          type="text" 
          value={langSearch} 
          onChange={(e) => setLangSearch(e.target.value)}
          className={`w-full ${inputBg} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} rounded-lg pl-10 pr-3.5 py-2.5 ${text} text-[14px] focus:outline-none placeholder-zinc-600`}
          placeholder={isRu ? 'Поиск языка...' : 'Search language...'}
        />
      </div>
      
      {/* Interface Language */}
      <div className={`text-[11px] ${textMuted} uppercase tracking-wider mb-2`}>{isRu ? 'Интерфейс' : 'Interface'}</div>
      <div className={`rounded-lg ${isLight ? 'bg-gray-50' : 'bg-[#0a0a0a]'} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} overflow-hidden mb-4`}>
        {[
          { value: 'ru', label: 'Русский', icon: '🇷🇺' },
          { value: 'en', label: 'English', icon: '🇺🇸' }
        ].filter(l => l.label.toLowerCase().includes(langSearch.toLowerCase()) || l.value.includes(langSearch.toLowerCase())).map(lang => (
          <button 
            key={lang.value}
            onClick={(e) => { e.stopPropagation(); updateSettings({ language: lang.value as InterfaceLanguage }); }}
            className={`w-full flex items-center justify-between py-2.5 px-3.5 ${itemBg} border-b ${isLight ? 'border-gray-100' : 'border-zinc-800/30'} last:border-b-0 touch-manipulation`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{lang.icon}</span>
              <span className={`text-[14px] ${text}`}>{lang.label}</span>
            </div>
            {settings.language === lang.value && <Check size={18} className="text-blue-500" />}
          </button>
        ))}
      </div>

      {/* AI Response Language */}
      <div className={`text-[11px] ${textMuted} uppercase tracking-wider mb-2`}>{isRu ? 'Ответы AI' : 'AI Responses'}</div>

      <div className={`rounded-lg ${isLight ? 'bg-gray-50' : 'bg-[#0a0a0a]'} border ${isLight ? 'border-gray-200' : 'border-zinc-800/50'} overflow-hidden`}>
        <div className="max-h-[240px] overflow-y-auto">
          {filteredLanguages.map(lang => (
            <button 
              key={lang.value}
              onClick={(e) => { e.stopPropagation(); updateSettings({ modelLanguage: lang.value }); }}
              className={`w-full flex items-center justify-between py-2.5 px-3.5 ${itemBg} border-b ${isLight ? 'border-gray-100' : 'border-zinc-800/30'} last:border-b-0 touch-manipulation`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{lang.icon}</span>
                <span className={`text-[14px] ${text}`}>{lang.label}</span>
              </div>
              {settings.modelLanguage === lang.value && <Check size={18} className="text-blue-500" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Appearance Page
  const renderAppearance = () => (
    <div>
      <BackHeader title={isRu ? 'Тема' : 'Theme'} onBack={() => setSubPage('main')} />
      
      <div className="space-y-0">
        <button 
          onClick={(e) => { e.stopPropagation(); updateSettings({ theme: 'dark' }); }}
          className={`w-full flex items-center justify-between py-3.5 px-1 ${itemBg} touch-manipulation`}
        >
          <div className="flex items-center gap-3">
            <Moon size={20} className={textMuted} />
            <span className={`text-[15px] ${text}`}>{isRu ? 'Тёмная' : 'Dark'}</span>
          </div>
          {settings.theme === 'dark' && <Check size={20} className="text-blue-500" />}
        </button>
        <div className={`border-t ${divider} ml-12`} />
        <button 
          onClick={(e) => { e.stopPropagation(); updateSettings({ theme: 'light' }); }}
          className={`w-full flex items-center justify-between py-3.5 px-1 ${itemBg} touch-manipulation`}
        >
          <div className="flex items-center gap-3">
            <Sun size={20} className={textMuted} />
            <span className={`text-[15px] ${text}`}>{isRu ? 'Светлая' : 'Light'}</span>
          </div>
          {settings.theme === 'light' && <Check size={20} className="text-blue-500" />}
        </button>
      </div>
    </div>
  );

  // Support Page
  const renderSupport = () => (
    <div>
      <BackHeader title={isRu ? 'Поддержка' : 'Support'} onBack={() => setSubPage('main')} />
      
      {/* Privacy & Security Info */}
      <div className={`mb-4 p-3 rounded-lg border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#0a0a0a] border-zinc-800/50'}`}>
        <div className="flex items-start gap-2.5">
          <Lock size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className={`text-[13px] font-medium ${text} mb-0.5`}>
              {isRu ? 'Ваши данные защищены' : 'Your data is protected'}
            </div>
            <div className={`text-[12px] ${textMuted} leading-relaxed`}>
              {isRu 
                ? 'Все данные хранятся локально на вашем устройстве. Мы не собираем и не передаём вашу личную информацию.'
                : 'All data is stored locally on your device. We do not collect or transmit your personal information.'}
            </div>
          </div>
        </div>
      </div>

      {/* Contact section */}
      <div className={`text-[13px] ${textMuted} uppercase tracking-wider mb-3 px-1`}>
        {isRu ? 'Связаться с нами' : 'Contact us'}
      </div>
      
      <div className="space-y-0">
        <a 
          href="https://t.me/swensi17" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center justify-between py-3.5 px-1 ${itemBg} touch-manipulation`}
        >
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className={textMuted} />
            <span className={`text-[15px] ${text}`}>{isRu ? 'Написать в Telegram' : 'Message on Telegram'}</span>
          </div>
          <ChevronRight size={18} className={textMuted} />
        </a>
        
        <div className={`border-t ${divider} ml-12`} />
        
        <a 
          href="mailto:tutatutaev9@gmail.com" 
          className={`flex items-center justify-between py-3.5 px-1 ${itemBg} touch-manipulation`}
        >
          <div className="flex items-center gap-3">
            <Mail size={20} className={textMuted} />
            <span className={`text-[15px] ${text}`}>{isRu ? 'Написать на почту' : 'Send an email'}</span>
          </div>
          <ChevronRight size={18} className={textMuted} />
        </a>
        
        <div className={`border-t ${divider} ml-12`} />
        
        <a 
          href="https://github.com/swensi17/neo" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center justify-between py-3.5 px-1 ${itemBg} touch-manipulation`}
        >
          <div className="flex items-center gap-3">
            <Github size={20} className={textMuted} />
            <span className={`text-[15px] ${text}`}>GitHub</span>
          </div>
          <ChevronRight size={18} className={textMuted} />
        </a>
      </div>

      {/* Version info */}
      <div className={`mt-8 text-center text-[12px] ${textMuted}`}>
        NEO Chat v4.0
      </div>
    </div>
  );

  // Desktop Sidebar Item
  const SidebarItem = ({ id, icon, label }: { id: SubPage, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => setSubPage(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        subPage === id 
          ? (isLight ? 'bg-gray-100 text-gray-900' : 'bg-zinc-800 text-white') 
          : (isLight ? 'text-gray-600 hover:bg-gray-50' : 'text-zinc-400 hover:bg-zinc-900')
      }`}
    >
      {icon}
      <span className="text-[14px]">{label}</span>
    </button>
  );

  // Desktop Layout
  const renderDesktop = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative ${bg} rounded-2xl shadow-2xl w-full max-w-4xl h-[680px] flex overflow-hidden border ${isLight ? 'border-gray-200' : 'border-zinc-800'}`}>
        {/* Sidebar */}
        <div className={`w-56 flex-shrink-0 ${isLight ? 'bg-gray-50 border-r border-gray-200' : 'bg-[#0a0a0a] border-r border-zinc-800'} p-3 flex flex-col`}>
          <div className={`text-[13px] font-semibold ${text} px-3 py-2 mb-2`}>{t.settings}</div>
          
          <div className="space-y-1">
            <SidebarItem id="profile" icon={<User size={18} />} label={isRu ? 'Профиль' : 'Profile'} />
            <SidebarItem id="api" icon={<Key size={18} />} label={isRu ? 'API ключи' : 'API Keys'} />
            <SidebarItem id="persona" icon={<Bot size={18} />} label={isRu ? 'Роль AI' : 'AI Role'} />
            <SidebarItem id="language" icon={<Languages size={18} />} label={isRu ? 'Язык' : 'Language'} />
            <SidebarItem id="appearance" icon={<Palette size={18} />} label={isRu ? 'Тема' : 'Theme'} />
            <SidebarItem id="support" icon={<HelpCircle size={18} />} label={isRu ? 'Поддержка' : 'Support'} />
          </div>

          <div className="mt-auto pt-4">
            <button 
              onClick={() => { if(confirm(t.clearHistoryConfirm)) { onClearHistory(); } }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={18} />
              <span className="text-[14px]">{isRu ? 'Очистить историю' : 'Clear History'}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? 'border-gray-200' : 'border-zinc-800'}`}>
            <span className={`text-[17px] font-semibold ${text}`}>
              {subPage === 'profile' && (isRu ? 'Профиль' : 'Profile')}
              {subPage === 'api' && (isRu ? 'API ключи' : 'API Keys')}
              {subPage === 'persona' && (isRu ? 'Роль AI' : 'AI Role')}
              {subPage === 'language' && (isRu ? 'Язык' : 'Language')}
              {subPage === 'appearance' && (isRu ? 'Тема' : 'Theme')}
              {subPage === 'support' && (isRu ? 'Поддержка' : 'Support')}
              {subPage === 'main' && t.settings}
            </span>
            <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-full ${isLight ? 'hover:bg-gray-100' : 'hover:bg-zinc-800'} transition-colors`}>
              <X size={18} className={textMuted} />
            </button>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-lg mx-auto">
              {subPage === 'main' && renderProfile()}
              {subPage === 'api' && renderApiContent()}
              {subPage === 'profile' && renderProfileContent()}
              {subPage === 'persona' && renderPersonaContent()}
              {subPage === 'language' && renderLanguageContent()}
              {subPage === 'appearance' && renderAppearanceContent()}
              {subPage === 'support' && renderSupportContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop content renderers (without BackHeader)
  const renderApiContent = () => (
    <>
      {/* Add Key */}
      <div className="space-y-3 mb-6">
        <input 
          type="text" 
          value={newKeyName} 
          onChange={(e) => setNewKeyName(e.target.value)}
          className={`w-full ${isLight ? 'bg-gray-100' : 'bg-zinc-900'} rounded-xl px-4 py-3 ${text} text-[15px] focus:outline-none`}
          placeholder={isRu ? 'Название (опционально)' : 'Name (optional)'} 
        />
        <input 
          type="text" 
          value={newKeyValue} 
          onChange={(e) => { setNewKeyValue(e.target.value); setValidationResult(null); }}
          className={`w-full ${isLight ? 'bg-gray-100' : 'bg-zinc-900'} rounded-xl px-4 py-3 ${text} text-[15px] focus:outline-none font-mono`}
          placeholder="AIzaSy..." 
        />
        
        <div className="flex gap-2">
          <button 
            onClick={handleValidateKey} 
            disabled={!newKeyValue.trim() || isValidating}
            className={`flex-1 py-3 rounded-xl text-[15px] font-medium transition-all flex items-center justify-center gap-2 ${
              newKeyValue.trim() 
                ? (isLight ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-zinc-800 text-white hover:bg-zinc-700')
                : (isLight ? 'bg-gray-200 text-gray-400' : 'bg-zinc-900 text-zinc-600')
            }`}
          >
            {isValidating ? <Loader2 size={18} className="animate-spin" /> : (isRu ? 'Проверить' : 'Verify')}
          </button>
          
          {validationResult?.valid && (
            <button 
              onClick={handleAddKey}
              className="flex-1 py-3 rounded-xl text-[15px] font-medium bg-green-500 text-white flex items-center justify-center gap-2 hover:bg-green-600"
            >
              <Plus size={18} />{isRu ? 'Добавить' : 'Add'}
            </button>
          )}
        </div>
        
        {validationResult && (
          <div className={`flex items-center gap-2 text-[13px] py-2 ${validationResult.valid ? 'text-green-500' : 'text-red-500'}`}>
            {validationResult.valid ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{validationResult.valid ? (isRu ? 'Ключ работает!' : 'Key works!') : validationResult.error}</span>
          </div>
        )}
      </div>

      {/* Saved Keys */}
      {apiKeys.length > 0 && (
        <div className="space-y-2">
          <div className={`text-xs ${textMuted} uppercase tracking-wider mb-3`}>{isRu ? 'Сохранённые' : 'Saved'}</div>
          {apiKeys.map(key => (
            <div key={key.id} className={`${isLight ? 'bg-gray-100' : 'bg-zinc-900'} rounded-xl p-4 flex items-center gap-3`}>
              <button 
                onClick={() => handleToggleKeyActive(key.id)} 
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${key.isActive ? 'bg-green-500' : (isLight ? 'bg-gray-300' : 'bg-zinc-700')}`}
              >
                {key.isActive && <Check size={14} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-[15px] ${text} truncate`}>{key.name}</div>
                <div className={`text-[13px] ${textMuted} font-mono`}>{key.key.slice(0, 8)}...{key.key.slice(-4)}</div>
              </div>
              <button onClick={() => handleDeleteKey(key.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className={`mt-6 p-4 ${isLight ? 'bg-gray-50' : 'bg-zinc-900/50'} rounded-xl`}>
        <div className={`text-[13px] ${textMuted} space-y-2`}>
          <p className="font-medium">{isRu ? 'Как получить ключ:' : 'How to get a key:'}</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>{isRu ? 'Откройте ' : 'Open '}<a href="https://aistudio.google.com/apikey" target="_blank" className="text-blue-500 hover:underline">Google AI Studio</a></li>
            <li>{isRu ? 'Нажмите "Create API Key"' : 'Click "Create API Key"'}</li>
            <li>{isRu ? 'Скопируйте и вставьте выше' : 'Copy and paste above'}</li>
          </ol>
        </div>
      </div>
    </>
  );

  const renderProfileContent = () => (
    <div>
      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div 
          className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden relative group"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-semibold text-white">{name.charAt(0).toUpperCase()}</span>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Upload size={24} className="text-white" />
          </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className={`text-[13px] ${textMuted} block mb-2`}>{isRu ? 'Имя' : 'Name'}</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => { setName(e.target.value); updateProfile({ name: e.target.value }); }}
          className={`w-full ${isLight ? 'bg-gray-100' : 'bg-zinc-900'} rounded-xl px-4 py-3 ${text} text-[15px] focus:outline-none`}
        />
      </div>

      {/* Bio */}
      <div>
        <label className={`text-[13px] ${textMuted} block mb-2`}>{isRu ? 'О себе' : 'About'}</label>
        <textarea 
          value={bio} 
          onChange={(e) => { setBio(e.target.value); updateProfile({ bio: e.target.value }); }}
          className={`w-full ${isLight ? 'bg-gray-100' : 'bg-zinc-900'} rounded-xl px-4 py-3 ${text} text-[15px] focus:outline-none min-h-[100px] resize-none`}
          placeholder={isRu ? 'Расскажите о себе...' : 'Tell about yourself...'}
        />
      </div>

      {/* Toggles */}
      <div className="mt-6 space-y-2">
        <ToggleItem 
          icon={<Volume2 size={20} />} 
          label={isRu ? 'Звуковые уведомления' : 'Sound Notifications'} 
          value={settings.soundEnabled} 
          onChange={() => updateSettings({ soundEnabled: !settings.soundEnabled })} 
        />
        <ToggleItem 
          icon={<Zap size={20} />} 
          label={isRu ? 'Режим 18+' : '18+ Mode'} 
          desc={isRu ? 'Снять ограничения контента' : 'Remove content restrictions'}
          value={settings.adultMode} 
          onChange={() => updateSettings({ adultMode: !settings.adultMode })} 
        />
        <ToggleItem 
          icon={<Lock size={20} />} 
          label={isRu ? 'Инкогнито' : 'Incognito'} 
          desc={isRu ? 'Не сохранять историю' : 'Don\'t save history'}
          value={settings.incognito} 
          onChange={() => updateSettings({ incognito: !settings.incognito })} 
        />
      </div>
    </div>
  );

  const renderPersonaContent = () => (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textMuted}`} />
        <input 
          type="text" 
          value={personaSearch} 
          onChange={(e) => setPersonaSearch(e.target.value)}
          className={`w-full ${isLight ? 'bg-gray-100' : 'bg-zinc-900'} rounded-xl pl-12 pr-4 py-3 ${text} text-[15px] focus:outline-none`}
          placeholder={isRu ? 'Поиск...' : 'Search...'}
        />
      </div>

      {/* Reset */}
      {settings.selectedPersona && (
        <button 
          onClick={() => { updateSettings({ selectedPersona: undefined, customSystemInstruction: '' }); setCustomPrompt(''); }}
          className="w-full text-red-500 text-[15px] py-3 mb-4 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          {isRu ? 'Сбросить роль' : 'Reset Role'}
        </button>
      )}

      {/* List */}
      <div className="space-y-1 max-h-[250px] overflow-y-auto">
        {filteredPersonas.map(p => (
          <button 
            key={p.id}
            onClick={() => selectPersona(p.id)}
            className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
              settings.selectedPersona === p.id 
                ? (isLight ? 'bg-gray-100' : 'bg-zinc-800') 
                : (isLight ? 'hover:bg-gray-50' : 'hover:bg-zinc-900')
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles size={18} className={textMuted} />
              <span className={`text-[15px] ${text}`}>{isRu ? p.name.ru : p.name.en}</span>
            </div>
            {settings.selectedPersona === p.id && <Check size={20} className="text-blue-500" />}
          </button>
        ))}
      </div>

      {/* Custom Prompt */}
      <div className="mt-6">
        <label className={`text-[13px] ${textMuted} block mb-2`}>{isRu ? 'Свои инструкции' : 'Custom Instructions'}</label>
        <textarea 
          value={customPrompt} 
          onChange={(e) => { setCustomPrompt(e.target.value); updateSettings({ customSystemInstruction: e.target.value }); }}
          className={`w-full ${isLight ? 'bg-gray-100' : 'bg-zinc-900'} rounded-xl px-4 py-3 ${text} text-[15px] focus:outline-none min-h-[100px] resize-none`}
          placeholder={isRu ? 'Опишите как AI должен себя вести...' : 'Describe how AI should behave...'}
        />
      </div>
    </div>
  );

  const renderLanguageContent = () => (
    <div>
      {/* Interface Language */}
      <div className={`text-[13px] ${textMuted} uppercase tracking-wider mb-3`}>{isRu ? 'Интерфейс' : 'Interface'}</div>
      <div className="space-y-1 mb-6">
        {[
          { value: 'ru', label: 'Русский', icon: '🇷🇺' },
          { value: 'en', label: 'English', icon: '🇺🇸' }
        ].map(lang => (
          <button 
            key={lang.value}
            onClick={() => updateSettings({ language: lang.value as InterfaceLanguage })}
            className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
              settings.language === lang.value 
                ? (isLight ? 'bg-gray-100' : 'bg-zinc-800') 
                : (isLight ? 'hover:bg-gray-50' : 'hover:bg-zinc-900')
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{lang.icon}</span>
              <span className={`text-[15px] ${text}`}>{lang.label}</span>
            </div>
            {settings.language === lang.value && <Check size={20} className="text-blue-500" />}
          </button>
        ))}
      </div>

      {/* AI Response Language */}
      <div className={`text-[13px] ${textMuted} uppercase tracking-wider mb-3`}>{isRu ? 'Ответы AI' : 'AI Responses'}</div>
      
      {/* Search */}
      <div className="relative mb-3">
        <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${textMuted}`} />
        <input 
          type="text" 
          value={langSearch} 
          onChange={(e) => setLangSearch(e.target.value)}
          className={`w-full ${isLight ? 'bg-gray-100' : 'bg-zinc-900'} rounded-xl pl-12 pr-4 py-3 ${text} text-[15px] focus:outline-none`}
          placeholder={isRu ? 'Поиск языка...' : 'Search language...'}
        />
      </div>

      <div className="space-y-1 max-h-[250px] overflow-y-auto">
        {filteredLanguages.map(lang => (
          <button 
            key={lang.value}
            onClick={() => updateSettings({ modelLanguage: lang.value })}
            className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
              settings.modelLanguage === lang.value 
                ? (isLight ? 'bg-gray-100' : 'bg-zinc-800') 
                : (isLight ? 'hover:bg-gray-50' : 'hover:bg-zinc-900')
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{lang.icon}</span>
              <span className={`text-[15px] ${text}`}>{lang.label}</span>
            </div>
            {settings.modelLanguage === lang.value && <Check size={20} className="text-blue-500" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderAppearanceContent = () => (
    <div>
      <div className="space-y-1">
        <button 
          onClick={() => updateSettings({ theme: 'dark' })}
          className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
            settings.theme === 'dark' 
              ? (isLight ? 'bg-gray-100' : 'bg-zinc-800') 
              : (isLight ? 'hover:bg-gray-50' : 'hover:bg-zinc-900')
          }`}
        >
          <div className="flex items-center gap-3">
            <Moon size={20} className={textMuted} />
            <span className={`text-[15px] ${text}`}>{isRu ? 'Тёмная' : 'Dark'}</span>
          </div>
          {settings.theme === 'dark' && <Check size={20} className="text-blue-500" />}
        </button>
        <button 
          onClick={() => updateSettings({ theme: 'light' })}
          className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
            settings.theme === 'light' 
              ? (isLight ? 'bg-gray-100' : 'bg-zinc-800') 
              : (isLight ? 'hover:bg-gray-50' : 'hover:bg-zinc-900')
          }`}
        >
          <div className="flex items-center gap-3">
            <Sun size={20} className={textMuted} />
            <span className={`text-[15px] ${text}`}>{isRu ? 'Светлая' : 'Light'}</span>
          </div>
          {settings.theme === 'light' && <Check size={20} className="text-blue-500" />}
        </button>
      </div>
    </div>
  );

  const renderSupportContent = () => (
    <div>
      {/* Privacy & Security Info */}
      <div className={`mb-6 p-4 rounded-xl border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-black border-zinc-800'}`}>
        <div className="flex items-start gap-3">
          <Lock size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className={`text-[14px] font-medium ${text} mb-1`}>
              {isRu ? 'Ваши данные защищены' : 'Your data is protected'}
            </div>
            <div className={`text-[13px] ${textMuted} leading-relaxed`}>
              {isRu 
                ? 'Все данные хранятся локально на вашем устройстве. Мы не собираем, не передаём и не храним вашу личную информацию на серверах.'
                : 'All data is stored locally on your device. We do not collect, transmit, or store your personal information on servers.'}
            </div>
          </div>
        </div>
      </div>

      {/* Contact section */}
      <div className={`text-[13px] ${textMuted} uppercase tracking-wider mb-3`}>
        {isRu ? 'Связаться с нами' : 'Contact us'}
      </div>
      
      <div className="space-y-1">
        <a 
          href="https://t.me/swensi17" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center justify-between py-3 px-3 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-50' : 'hover:bg-[#1a1a1a]'}`}
        >
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className={textMuted} />
            <span className={`text-[15px] ${text}`}>{isRu ? 'Написать в Telegram' : 'Message on Telegram'}</span>
          </div>
          <ChevronRight size={18} className={textMuted} />
        </a>
        
        <a 
          href="mailto:tutatutaev9@gmail.com" 
          className={`flex items-center justify-between py-3 px-3 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-50' : 'hover:bg-[#1a1a1a]'}`}
        >
          <div className="flex items-center gap-3">
            <Mail size={20} className={textMuted} />
            <span className={`text-[15px] ${text}`}>{isRu ? 'Написать на почту' : 'Send an email'}</span>
          </div>
          <ChevronRight size={18} className={textMuted} />
        </a>
        
        <a 
          href="https://github.com/swensi17/neo" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center justify-between py-3 px-3 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-50' : 'hover:bg-[#1a1a1a]'}`}
        >
          <div className="flex items-center gap-3">
            <Github size={20} className={textMuted} />
            <span className={`text-[15px] ${text}`}>GitHub</span>
          </div>
          <ChevronRight size={18} className={textMuted} />
        </a>
      </div>

      {/* Version info */}
      <div className={`mt-6 text-center text-[12px] ${textMuted}`}>
        NEO Chat v4.0
      </div>
    </div>
  );

  // Mobile Layout
  const renderMobile = () => (
    <div 
      className={`fixed inset-0 z-[100] ${bg} animate-slide-up flex flex-col h-full`}
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header */}
      {subPage === 'main' && (
        <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
          <div className="w-10" />
          <span className={`text-[17px] font-semibold ${text}`}>{t.settings}</span>
          <button onClick={onClose} className={`w-10 h-10 flex items-center justify-center rounded-full ${isLight ? 'bg-gray-100' : 'bg-zinc-900'}`}>
            <X size={20} className={textMuted} />
          </button>
        </div>
      )}

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
        {subPage === 'main' && renderMain()}
        {subPage === 'api' && renderApi()}
        {subPage === 'profile' && renderProfile()}
        {subPage === 'persona' && renderPersona()}
        {subPage === 'language' && renderLanguage()}
        {subPage === 'appearance' && renderAppearance()}
        {subPage === 'support' && renderSupport()}
      </div>
    </div>
  );

  return isDesktop ? renderDesktop() : renderMobile();
};
