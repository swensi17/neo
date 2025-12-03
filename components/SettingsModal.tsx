import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AppSettings, TRANSLATIONS, InterfaceLanguage, ApiKey, KnowledgeItem } from '../types';
import { X, Upload, User, Moon, Sun, Globe, Shield, Trash2, Sliders, FileText, Plus, Key, Check, AlertCircle, Loader2, Search, Sparkles, ChevronDown, ExternalLink, Volume2, VolumeX } from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
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
}

type Tab = 'profile' | 'api' | 'language' | 'general' | 'data';

// 50+ Languages for AI responses
const AI_LANGUAGES = [
  // СНГ и популярные
  { value: 'ru', label: 'Русский', icon: '🇷🇺' },
  { value: 'en', label: 'English', icon: '🇺🇸' },
  { value: 'uk', label: 'Українська', icon: '🇺🇦' },
  { value: 'kk', label: 'Қазақша', icon: '🇰🇿' },
  { value: 'uz', label: 'O\'zbekcha', icon: '🇺🇿' },
  { value: 'tg', label: 'Тоҷикӣ', icon: '🇹🇯' },
  { value: 'ky', label: 'Кыргызча', icon: '🇰🇬' },
  { value: 'az', label: 'Azərbaycan', icon: '🇦🇿' },
  { value: 'hy', label: 'Հայերեն', icon: '🇦🇲' },
  { value: 'ka', label: 'ქართული', icon: '🇬🇪' },
  { value: 'be', label: 'Беларуская', icon: '🇧🇾' },
  { value: 'mn', label: 'Монгол', icon: '🇲🇳' },
  // Европейские
  { value: 'de', label: 'Deutsch', icon: '🇩🇪' },
  { value: 'fr', label: 'Français', icon: '🇫🇷' },
  { value: 'es', label: 'Español', icon: '🇪🇸' },
  { value: 'it', label: 'Italiano', icon: '🇮🇹' },
  { value: 'pt', label: 'Português', icon: '🇵🇹' },
  { value: 'pl', label: 'Polski', icon: '🇵🇱' },
  { value: 'nl', label: 'Nederlands', icon: '🇳🇱' },
  { value: 'sv', label: 'Svenska', icon: '🇸🇪' },
  { value: 'no', label: 'Norsk', icon: '🇳🇴' },
  { value: 'da', label: 'Dansk', icon: '🇩🇰' },
  { value: 'fi', label: 'Suomi', icon: '🇫🇮' },
  { value: 'cs', label: 'Čeština', icon: '🇨🇿' },
  { value: 'sk', label: 'Slovenčina', icon: '🇸🇰' },
  { value: 'hu', label: 'Magyar', icon: '🇭🇺' },
  { value: 'ro', label: 'Română', icon: '🇷🇴' },
  { value: 'bg', label: 'Български', icon: '🇧🇬' },
  { value: 'hr', label: 'Hrvatski', icon: '🇭🇷' },
  { value: 'sr', label: 'Српски', icon: '🇷🇸' },
  { value: 'sl', label: 'Slovenščina', icon: '🇸🇮' },
  { value: 'el', label: 'Ελληνικά', icon: '🇬🇷' },
  { value: 'tr', label: 'Türkçe', icon: '🇹🇷' },
  { value: 'lt', label: 'Lietuvių', icon: '🇱🇹' },
  { value: 'lv', label: 'Latviešu', icon: '🇱🇻' },
  { value: 'et', label: 'Eesti', icon: '🇪🇪' },
  // Азиатские
  { value: 'zh', label: '中文', icon: '🇨🇳' },
  { value: 'ja', label: '日本語', icon: '🇯🇵' },
  { value: 'ko', label: '한국어', icon: '🇰🇷' },
  { value: 'vi', label: 'Tiếng Việt', icon: '🇻🇳' },
  { value: 'th', label: 'ไทย', icon: '🇹🇭' },
  { value: 'id', label: 'Bahasa Indonesia', icon: '🇮🇩' },
  { value: 'ms', label: 'Bahasa Melayu', icon: '🇲🇾' },
  { value: 'tl', label: 'Tagalog', icon: '🇵🇭' },
  { value: 'hi', label: 'हिन्दी', icon: '🇮🇳' },
  { value: 'bn', label: 'বাংলা', icon: '🇧🇩' },
  { value: 'ta', label: 'தமிழ்', icon: '🇮🇳' },
  { value: 'ur', label: 'اردو', icon: '🇵🇰' },
  { value: 'fa', label: 'فارسی', icon: '🇮🇷' },
  // Арабские и африканские
  { value: 'ar', label: 'العربية', icon: '🇸🇦' },
  { value: 'he', label: 'עברית', icon: '🇮🇱' },
  { value: 'sw', label: 'Kiswahili', icon: '🇰🇪' },
  { value: 'af', label: 'Afrikaans', icon: '🇿🇦' },
  // Дополнительные СНГ
  { value: 'tk', label: 'Türkmen', icon: '🇹🇲' },
  { value: 'tt', label: 'Татарча', icon: '🇷🇺' },
  { value: 'ba', label: 'Башҡортса', icon: '🇷🇺' },
  { value: 'ce', label: 'Нохчийн', icon: '🇷🇺' },
  // Дополнительные европейские
  { value: 'pt-br', label: 'Português (Brasil)', icon: '🇧🇷' },
  { value: 'mk', label: 'Македонски', icon: '🇲🇰' },
  { value: 'bs', label: 'Bosanski', icon: '🇧🇦' },
  { value: 'sq', label: 'Shqip', icon: '🇦🇱' },
  { value: 'is', label: 'Íslenska', icon: '🇮🇸' },
  { value: 'ga', label: 'Gaeilge', icon: '🇮🇪' },
  { value: 'mt', label: 'Malti', icon: '🇲🇹' },
  { value: 'ca', label: 'Català', icon: '🇪🇸' },
  { value: 'eu', label: 'Euskara', icon: '🇪🇸' },
  { value: 'gl', label: 'Galego', icon: '🇪🇸' },
  // Дополнительные азиатские
  { value: 'zh-tw', label: '中文 (繁體)', icon: '🇹🇼' },
  { value: 'te', label: 'తెలుగు', icon: '🇮🇳' },
  { value: 'mr', label: 'मराठी', icon: '🇮🇳' },
  { value: 'gu', label: 'ગુજરાતી', icon: '🇮🇳' },
  { value: 'kn', label: 'ಕನ್ನಡ', icon: '🇮🇳' },
  { value: 'ml', label: 'മലയാളം', icon: '🇮🇳' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ', icon: '🇮🇳' },
  { value: 'ps', label: 'پښتو', icon: '🇦🇫' },
  { value: 'ne', label: 'नेपाली', icon: '🇳🇵' },
  { value: 'si', label: 'සිංහල', icon: '🇱🇰' },
  { value: 'my', label: 'မြန်မာ', icon: '🇲🇲' },
  { value: 'km', label: 'ខ្មែរ', icon: '🇰🇭' },
  { value: 'lo', label: 'ລາວ', icon: '🇱🇦' },
  // Дополнительные африканские
  { value: 'am', label: 'አማርኛ', icon: '🇪🇹' },
  { value: 'ha', label: 'Hausa', icon: '🇳🇬' },
  { value: 'yo', label: 'Yorùbá', icon: '🇳🇬' },
  { value: 'ig', label: 'Igbo', icon: '🇳🇬' },
  { value: 'zu', label: 'isiZulu', icon: '🇿🇦' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, userProfile, onUpdateProfile, settings, onUpdateSettings, onClearHistory
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('api');
  const [name, setName] = useState(userProfile.name);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [customPrompt, setCustomPrompt] = useState(settings.customSystemInstruction || '');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{valid: boolean; error?: string} | null>(null);

  // Knowledge base state
  const [knowledgeText, setKnowledgeText] = useState('');
  const [personaSearch, setPersonaSearch] = useState('');
  const [showApiInstructions, setShowApiInstructions] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const knowledgeInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[settings.language];
  const isRu = settings.language === 'ru';
  const isLight = settings.theme === 'light';

  useEffect(() => {
    if (isOpen) {
        setName(userProfile.name);
        setAvatar(userProfile.avatar);
        setBio(userProfile.bio || '');
        setCustomPrompt(settings.customSystemInstruction || '');
        setApiKeys(getApiKeys());
        const fetchVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
        fetchVoices();
        window.speechSynthesis.onvoiceschanged = fetchVoices;
    }
  }, [isOpen, userProfile, settings]);

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

  // Knowledge base functions
  const addKnowledgeItem = (type: 'text' | 'url', content: string) => {
    if (!content.trim()) return;
    const newItem: KnowledgeItem = {
      id: Date.now().toString(),
      type,
      content: content.trim(),
      name: type === 'url' ? content.slice(0, 30) : content.slice(0, 20) + '...'
    };
    const kb = settings.knowledgeBase || [];
    updateSettings({ knowledgeBase: [...kb, newItem] });
    setKnowledgeText('');
  };

  const removeKnowledgeItem = (id: string) => {
    const kb = settings.knowledgeBase || [];
    updateSettings({ knowledgeBase: kb.filter(k => k.id !== id) });
  };

  const handleKnowledgeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const newItem: KnowledgeItem = {
            id: Date.now().toString() + file.name,
            type: 'file',
            content: (reader.result as string).slice(0, 8000),
            name: file.name
          };
          const kb = settings.knowledgeBase || [];
          updateSettings({ knowledgeBase: [...kb, newItem] });
        };
        reader.readAsText(file);
      });
    }
    e.target.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        updateProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameChange = (n: string) => { setName(n); updateProfile({ name: n }); };
  const handleBioChange = (b: string) => { setBio(b); updateProfile({ bio: b }); };
  const handlePromptChange = (p: string) => { setCustomPrompt(p); updateSettings({ customSystemInstruction: p }); };

  const selectPersona = (id: string) => {
    const persona = PRESET_PERSONAS.find(p => p.id === id);
    if (persona) {
      updateSettings({ selectedPersona: id, customSystemInstruction: persona.prompt });
      setCustomPrompt(persona.prompt);
    }
  };

  // Theme classes
  const bgMain = isLight ? 'bg-white' : 'bg-background';
  const bgSurface = isLight ? 'bg-gray-50' : 'bg-surface';
  const bgInput = isLight ? 'bg-gray-100' : 'bg-surface';
  const textMain = isLight ? 'text-gray-900' : 'text-text';
  const textSecondary = isLight ? 'text-gray-500' : 'text-text-secondary';
  const border = isLight ? 'border-gray-200' : 'border-white/10';
  const hoverBg = isLight ? 'hover:bg-gray-100' : 'hover:bg-white/5';

  const filteredPersonas = PRESET_PERSONAS
    .filter(p => 
      p.name.en.toLowerCase().includes(personaSearch.toLowerCase()) ||
      p.name.ru.toLowerCase().includes(personaSearch.toLowerCase())
    )
    .sort((a, b) => (isRu ? a.name.ru : a.name.en).localeCompare(isRu ? b.name.ru : b.name.en)
  );

  const renderApi = () => (
    <div className="space-y-5">
      {/* API Key Input Card - Matte Black */}
      <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-black border-white/10'} border rounded-2xl p-5 space-y-4`}>
        <div className={`text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>
          {isRu ? 'Добавить API ключ' : 'Add API Key'}
        </div>
        
        <div className="space-y-3">
          <input 
            type="text" 
            value={newKeyName} 
            onChange={(e) => setNewKeyName(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-1p-ignore="true"
            data-lpignore="true"
            className={`w-full ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-zinc-900 border-white/10'} border rounded-xl px-4 py-3 ${textMain} text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all`}
            placeholder={isRu ? 'Название ключа (опционально)' : 'Key name (optional)'} 
          />
          
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newKeyValue} 
              onChange={(e) => { setNewKeyValue(e.target.value); setValidationResult(null); }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-form-type="other"
              data-1p-ignore="true"
              data-lpignore="true"
              className={`flex-1 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-zinc-900 border-white/10'} border rounded-xl px-4 py-3 ${textMain} text-sm focus:outline-none focus:ring-1 focus:ring-white/20 font-mono transition-all`} 
              placeholder="AIzaSy..." 
            />
            <button 
              onClick={handleValidateKey} 
              disabled={!newKeyValue.trim() || isValidating}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                newKeyValue.trim() 
                  ? `${isLight ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10'}`
                  : `${isLight ? 'bg-gray-100 text-gray-400' : 'bg-zinc-900 text-zinc-600 border border-white/5'} cursor-not-allowed`
              }`}
            >
              {isValidating ? <Loader2 size={16} className="animate-spin" /> : (isRu ? 'Проверить' : 'Verify')}
            </button>
          </div>
          
          {validationResult && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
              validationResult.valid 
                ? `${isLight ? 'bg-green-50 text-green-600 border-green-200' : 'bg-green-500/10 text-green-400 border-green-500/20'} border`
                : `${isLight ? 'bg-red-50 text-red-600 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20'} border`
            }`}>
              {validationResult.valid ? <Check size={16} /> : <AlertCircle size={16} />}
              <span className="font-medium">{validationResult.valid ? (isRu ? 'API ключ работает!' : 'API key works!') : validationResult.error}</span>
            </div>
          )}
          
          {validationResult?.valid && (
            <button 
              onClick={handleAddKey} 
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isLight ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              <Plus size={18} />{isRu ? 'Добавить ключ' : 'Add Key'}
            </button>
          )}
        </div>
      </div>

      {/* Saved Keys */}
      {apiKeys.length > 0 && (
        <div className="space-y-3">
          <div className={`text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>
            {isRu ? 'Сохранённые ключи' : 'Saved Keys'}
          </div>
          {apiKeys.map(key => (
            <div key={key.id} className={`${isLight ? 'bg-white border-gray-200' : 'bg-black border-white/10'} border rounded-xl p-4 flex items-center gap-4 group hover:border-white/20 transition-all`}>
              <button 
                onClick={() => handleToggleKeyActive(key.id)} 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  key.isActive 
                    ? 'bg-green-500 border-green-500' 
                    : `${isLight ? 'border-gray-300' : 'border-white/20'} hover:border-green-500`
                }`}
              >
                {key.isActive && <Check size={14} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${textMain} truncate`}>{key.name}</div>
                <div className={`text-xs ${textSecondary} font-mono mt-0.5`}>{key.key.slice(0, 10)}...{key.key.slice(-4)}</div>
              </div>
              <button 
                onClick={() => handleDeleteKey(key.id)} 
                className={`p-2 ${textSecondary} hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {apiKeys.length === 0 && (
        <div className={`text-center py-8 ${isLight ? 'bg-gray-50' : 'bg-zinc-900/50'} rounded-2xl border border-dashed ${border}`}>
          <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${isLight ? 'bg-gray-100' : 'bg-white/5'} flex items-center justify-center`}>
            <Key size={20} className={textSecondary} />
          </div>
          <div className={`text-sm font-medium ${textMain} mb-1`}>
            {isRu ? 'Нет сохранённых ключей' : 'No saved keys'}
          </div>
          <div className={`text-xs ${textSecondary}`}>
            {isRu ? 'Добавьте API ключ для начала работы' : 'Add an API key to get started'}
          </div>
        </div>
      )}

      {/* Collapsible Instructions */}
      <div className={`${isLight ? 'bg-gray-50 border-gray-200' : 'bg-zinc-900/50 border-white/5'} border rounded-xl overflow-hidden`}>
        <button 
          onClick={() => setShowApiInstructions(!showApiInstructions)}
          className={`w-full px-4 py-3 flex items-center justify-between ${textSecondary} hover:${textMain} transition-colors`}
        >
          <span className="text-xs font-medium">{isRu ? 'Как получить API ключ?' : 'How to get API key?'}</span>
          <ChevronDown size={16} className={`transition-transform ${showApiInstructions ? 'rotate-180' : ''}`} />
        </button>
        {showApiInstructions && (
          <div className={`px-4 pb-4 space-y-3 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
            <ol className={`text-xs ${textSecondary} space-y-2 pt-3 list-decimal list-inside`}>
              <li className="leading-relaxed">
                {isRu ? 'Перейдите на ' : 'Go to '}
                <a 
                  href="https://aistudio.google.com/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`${isLight ? 'text-zinc-900' : 'text-white'} underline underline-offset-2 font-medium inline-flex items-center gap-1`}
                >
                  Google AI Studio <ExternalLink size={10} />
                </a>
              </li>
              <li className="leading-relaxed">{isRu ? 'Войдите в свой Google аккаунт' : 'Sign in with your Google account'}</li>
              <li className="leading-relaxed">{isRu ? 'Нажмите кнопку "Create API Key"' : 'Click the "Create API Key" button'}</li>
              <li className="leading-relaxed">{isRu ? 'Скопируйте ключ и вставьте в поле выше' : 'Copy the key and paste it in the field above'}</li>
            </ol>
            <div className={`text-[10px] ${textSecondary} flex items-center gap-2 pt-1`}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {isRu ? 'Бесплатно • Без карты • Мгновенно' : 'Free • No card required • Instant'}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className={`relative w-16 h-16 rounded-full ${bgInput} flex items-center justify-center cursor-pointer overflow-hidden border ${border} group flex-shrink-0`}
          onClick={() => fileInputRef.current?.click()}>
          {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (
            <div className="w-full h-full bg-black flex items-center justify-center text-xl font-bold text-white">{name.charAt(0).toUpperCase()}</div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload size={18} className="text-white" /></div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        <div className="flex-1">
          <label className={`block text-xs ${textSecondary} mb-1`}>{isRu ? 'Имя' : 'Name'}</label>
          <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)}
            className={`w-full ${bgInput} border ${border} rounded-xl px-3 py-2.5 ${textMain} focus:outline-none text-sm`} placeholder={isRu ? 'Ваше имя' : 'Your name'} />
        </div>
      </div>
      <div>
        <label className={`block text-xs ${textSecondary} mb-1`}>{isRu ? 'О себе' : 'About you'}</label>
        <textarea value={bio} onChange={(e) => handleBioChange(e.target.value)}
          className={`w-full ${bgInput} border ${border} rounded-xl px-3 py-2.5 ${textMain} text-sm focus:outline-none min-h-[60px] resize-none`} placeholder={isRu ? 'Расскажите о себе...' : 'Tell about yourself...'} />
      </div>

      {/* AI Role */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`block text-xs ${textSecondary}`}>{isRu ? 'Роль AI' : 'AI Role'}</label>
          {(settings.selectedPersona || customPrompt) && (
            <button onClick={resetPersona} className={`text-xs ${textSecondary} hover:text-red-500 flex items-center gap-1`}>
              <Trash2 size={12} />{isRu ? 'Сбросить' : 'Reset'}
            </button>
          )}
        </div>
        
        <div className={`${bgInput} border ${border} rounded-xl p-3 space-y-3`}>
          {/* Search */}
          <div className="relative">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
            <input 
              type="text" 
              value={personaSearch} 
              onChange={(e) => setPersonaSearch(e.target.value)}
              placeholder={isRu ? 'Поиск роли...' : 'Search role...'}
              className={`w-full ${bgSurface} border ${border} rounded-lg pl-9 pr-3 py-2 text-sm ${textMain} placeholder-gray-400 focus:outline-none`}
            />
          </div>
          
          {/* Roles Grid */}
          <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-hide">
            {filteredPersonas.map(p => (
              <button 
                key={p.id} 
                onClick={() => selectPersona(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  settings.selectedPersona === p.id 
                    ? (isLight ? 'bg-zinc-900 text-white' : 'bg-white/10 text-white')
                    : `${textSecondary} ${hoverBg}`
                }`}
              >
                <Sparkles size={14} />
                <span>{isRu ? p.name.ru : p.name.en}</span>
                {settings.selectedPersona === p.id && <Check size={14} className="ml-auto" />}
              </button>
            ))}
            {filteredPersonas.length === 0 && (
              <div className={`text-center py-4 ${textSecondary} text-sm`}>
                {isRu ? 'Роль не найдена' : 'Role not found'}
              </div>
            )}
          </div>
        </div>
      </div>
      <div>
        <label className={`block text-xs ${textSecondary} mb-1`}>{isRu ? 'Инструкция для AI' : 'AI Instructions'}</label>
        <textarea value={customPrompt} onChange={(e) => handlePromptChange(e.target.value)}
          className={`w-full ${bgInput} border ${border} rounded-xl px-3 py-2.5 ${textMain} text-sm focus:outline-none min-h-[70px] resize-none`} placeholder={isRu ? 'Свои инструкции...' : 'Custom instructions...'} />
      </div>

    </div>
  );

  const renderGeneral = () => (
    <div className="space-y-5">
      {/* Sound */}
      <div className={`${bgInput} border ${border} rounded-xl p-4 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          {settings.soundEnabled ? <Volume2 size={18} className={textSecondary} /> : <VolumeX size={18} className={textSecondary} />}
          <div>
            <div className={`font-medium ${textMain} text-sm`}>{isRu ? 'Звуковые уведомления' : 'Sound Notifications'}</div>
            <div className={`text-xs ${textSecondary}`}>{isRu ? 'Звук при завершении ответа' : 'Sound when response completes'}</div>
          </div>
        </div>
        <button onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          className={`w-12 h-6 rounded-full p-0.5 transition-all flex-shrink-0 border ${settings.soundEnabled ? 'bg-green-500 border-green-400' : `${bgInput} ${border}`}`}>
          <div className={`w-5 h-5 rounded-full ${isLight ? 'bg-gray-600' : 'bg-white'} shadow-lg transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Theme */}
      <div>
        <label className={`block text-xs ${textSecondary} mb-1`}>{t.theme}</label>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => updateSettings({ theme: 'dark' })}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${settings.theme === 'dark' ? (isLight ? 'bg-gray-900 text-white border-gray-900' : 'bg-white/10 border-white/20 text-white') : `${bgInput} ${border} ${textSecondary} ${hoverBg}`}`}>
            <Moon size={16} /> {t.dark}
          </button>
          <button onClick={() => updateSettings({ theme: 'light' })}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${settings.theme === 'light' ? 'bg-white text-black border-gray-300 shadow' : `${bgInput} ${border} ${textSecondary} ${hoverBg}`}`}>
            <Sun size={16} /> {t.light}
          </button>
        </div>
      </div>

      {/* Knowledge Base */}
      <div>
        <label className={`block text-xs ${textSecondary} mb-1`}>{isRu ? 'База знаний' : 'Knowledge Base'}</label>
        <div className={`${bgInput} border ${border} rounded-xl p-3 space-y-2`}>
          <div className="flex gap-2">
            <input type="text" value={knowledgeText} onChange={(e) => setKnowledgeText(e.target.value)}
              className={`flex-1 ${bgMain} border ${border} rounded-lg px-3 py-2 ${textMain} text-sm focus:outline-none`}
              placeholder={isRu ? 'Текст или ссылка...' : 'Text or URL...'} onKeyDown={(e) => e.key === 'Enter' && addKnowledgeItem(knowledgeText.startsWith('http') ? 'url' : 'text', knowledgeText)} />
            <button onClick={() => addKnowledgeItem(knowledgeText.startsWith('http') ? 'url' : 'text', knowledgeText)} className={`px-3 py-2 ${bgSurface} ${hoverBg} rounded-lg ${textSecondary} border ${border}`}><Plus size={16} /></button>
          </div>
          <input type="file" ref={knowledgeInputRef} className="hidden" accept=".txt,.md,.json,.csv" multiple onChange={handleKnowledgeUpload} />
          <button onClick={() => knowledgeInputRef.current?.click()} className={`w-full flex items-center justify-center gap-2 py-2 border border-dashed ${border} rounded-lg ${textSecondary} ${hoverBg} text-sm`}>
            <FileText size={14} />{isRu ? 'Загрузить файлы' : 'Upload files'}
          </button>
          {(settings.knowledgeBase || []).length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {(settings.knowledgeBase || []).map(item => (
                <span key={item.id} className={`text-xs ${bgSurface} border ${border} px-2 py-1 rounded ${textSecondary} flex items-center gap-1`}>
                  {item.type === 'url' ? '🔗' : item.type === 'file' ? '📄' : '📝'} {item.name.slice(0, 15)}
                  <button onClick={() => removeKnowledgeItem(item.id)} className="hover:text-red-500"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 18+ Mode */}
      <div className={`${bgInput} border ${border} rounded-xl p-4 flex items-center justify-between gap-3`}>
        <div className="min-w-0">
          <div className={`font-medium ${textMain} text-sm`}>{isRu ? 'Режим 18+' : '18+ Mode'}</div>
          <div className={`text-xs ${textSecondary}`}>{isRu ? 'Снять все ограничения на контент' : 'Remove all content restrictions'}</div>
        </div>
        <button onClick={() => updateSettings({ adultMode: !settings.adultMode })}
          className={`w-12 h-6 rounded-full p-0.5 transition-all flex-shrink-0 border ${settings.adultMode ? 'bg-red-500 border-red-400' : `${bgInput} ${border}`}`}>
          <div className={`w-5 h-5 rounded-full ${isLight ? 'bg-gray-600' : 'bg-white'} shadow-lg transition-transform ${settings.adultMode ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  );

  const renderData = () => (
    <div className="space-y-5">
      <div className={`${bgInput} border ${border} rounded-xl p-4 flex items-center justify-between gap-3`}>
        <div className="min-w-0">
          <div className={`font-medium ${textMain} text-sm`}>{t.incognito}</div>
          <div className={`text-xs ${textSecondary}`}>{t.incognitoDesc}</div>
        </div>
        <button onClick={() => updateSettings({ incognito: !settings.incognito })}
          className={`w-12 h-6 rounded-full p-0.5 transition-all flex-shrink-0 border ${settings.incognito ? 'bg-blue-500 border-blue-400' : `${bgInput} ${border}`}`}>
          <div className={`w-5 h-5 rounded-full ${isLight ? 'bg-gray-600' : 'bg-white'} shadow-lg transition-transform ${settings.incognito ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
      <CustomDropdown label={t.retention} value={settings.historyRetention} onChange={(val) => updateSettings({ historyRetention: val as any })} isLight={isLight} lang={settings.language}
        options={[{ value: 'forever', label: t.forever }, { value: '30days', label: t.days30 }, { value: '7days', label: t.days7 }]} />
      <button onClick={onClearHistory} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-sm font-medium border border-red-500/30">
        <Trash2 size={16} />{t.clearHistory}
      </button>
    </div>
  );

  const resetPersona = () => {
    updateSettings({ selectedPersona: undefined, customSystemInstruction: '' });
    setCustomPrompt('');
    setPersonaSearch('');
  };
  
  const filteredLanguages = AI_LANGUAGES
    .filter(l => 
      l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.value.toLowerCase().includes(langSearch.toLowerCase())
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  const renderLanguage = () => (
    <div className="space-y-5">
      {/* Interface Language */}
      <div>
        <label className={`block text-xs ${textSecondary} mb-2`}>{t.interfaceLang}</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'ru', label: 'Русский', icon: '🇷🇺' },
            { value: 'en', label: 'English', icon: '🇺🇸' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ language: opt.value as InterfaceLanguage })}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                settings.language === opt.value 
                  ? (isLight ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white/10 border-white/20 text-white')
                  : `${bgSurface} ${border} ${textSecondary} ${hoverBg}`
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Response Language */}
      <div>
        <label className={`block text-xs ${textSecondary} mb-2`}>{t.responseLang}</label>
        
        {/* Search */}
        <div className={`${bgInput} border ${border} rounded-xl p-3 space-y-3`}>
          <div className="relative">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
            <input
              type="text"
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              placeholder={isRu ? 'Поиск языка...' : 'Search language...'}
              className={`w-full ${bgSurface} border ${border} rounded-lg pl-9 pr-3 py-2 text-sm ${textMain} placeholder-gray-400 focus:outline-none`}
            />
          </div>
          
          {/* Language Grid */}
          <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-hide">
            {filteredLanguages.map(lang => (
              <button
                key={lang.value}
                onClick={() => updateSettings({ modelLanguage: lang.value })}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  settings.modelLanguage === lang.value 
                    ? (isLight ? 'bg-zinc-900 text-white' : 'bg-white/10 text-white')
                    : `${textSecondary} ${hoverBg}`
                }`}
              >
                <span className="text-base">{lang.icon}</span>
                <span>{lang.label}</span>
                {settings.modelLanguage === lang.value && <Check size={14} className="ml-auto" />}
              </button>
            ))}
            {filteredLanguages.length === 0 && (
              <div className={`text-center py-4 ${textSecondary} text-sm`}>
                {isRu ? 'Язык не найден' : 'Language not found'}
              </div>
            )}
          </div>
        </div>
        
        <p className={`text-xs ${textSecondary} mt-2`}>
          {isRu ? 'AI будет отвечать на выбранном языке' : 'AI will respond in selected language'}
        </p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'api', icon: <Key size={16}/>, label: 'API' },
    { id: 'language', icon: <Globe size={16}/>, label: isRu ? 'Язык' : 'Language' },
    { id: 'profile', icon: <User size={16}/>, label: isRu ? 'Профиль' : 'Profile' },
    { id: 'general', icon: <Sliders size={16}/>, label: isRu ? 'Основные' : 'General' },
    { id: 'data', icon: <Shield size={16}/>, label: isRu ? 'Данные' : 'Data' },
  ];

  return (
    <div className={`fixed inset-0 z-[100] flex items-end md:items-center justify-center ${isLight ? 'bg-black/50' : 'bg-black/90'} md:backdrop-blur-sm animate-fade-in`} onClick={onClose}>
      <div className={`${bgMain} w-full md:max-w-4xl h-[85vh] md:h-[550px] md:rounded-2xl rounded-t-2xl border ${border} shadow-2xl flex flex-col md:flex-row overflow-hidden animate-slide-up`} onClick={e => e.stopPropagation()}>
        <div className={`w-full md:w-52 ${bgMain} border-b md:border-b-0 md:border-r ${border} flex-shrink-0`}>
          <div className="p-4 flex justify-between items-center md:block">
            <h2 className={`text-base font-semibold ${textMain}`}>{t.settings}</h2>
            <button onClick={onClose} className={`md:hidden p-1.5 ${hoverBg} rounded-lg ${textSecondary}`}><X size={18} /></button>
          </div>
          <nav className="flex md:flex-col gap-0.5 px-2 overflow-x-auto md:overflow-visible scrollbar-hide pb-2 md:pb-4">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? (isLight ? 'bg-gray-100 text-gray-900' : 'bg-white/10 text-white') : `${textSecondary} ${hoverBg}`}`}>
                {tab.icon}<span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className={`flex-1 flex flex-col min-h-0 relative ${bgMain}`}>
          <button onClick={onClose} className={`hidden md:flex absolute top-4 right-4 p-1.5 ${hoverBg} rounded-lg ${textSecondary} transition-colors`}><X size={18} /></button>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 md:pr-12">
            {activeTab === 'api' && renderApi()}
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'language' && renderLanguage()}
            {activeTab === 'general' && renderGeneral()}
            {activeTab === 'data' && renderData()}
          </div>
        </div>
      </div>
    </div>
  );
};
