
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, ChatSession, Role, UserProfile, AppSettings, Persona, TRANSLATIONS, InterfaceLanguage, ChatMode, Project } from './types';
import { streamChatResponse, generateChatTitle, stopStreaming, hasValidApiKey, compressImage, generateFollowUpQuestions } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { SettingsModal } from './components/SettingsModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { DownloadModal } from './components/DownloadModal';
import { CodePreviewPanel, extractCodeForPreview } from './components/CodePreviewPanel';
import { Toast, ToastType } from './components/Toast';
import { NewProjectModal } from './components/NewProjectModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SkeletonLoader } from './components/SkeletonLoader';
import { SwipeableItem } from './components/SwipeableItem';
import { haptic } from './utils/haptic';
import { Briefcase, DollarSign, Smartphone, GraduationCap, Pencil, Leaf, Code, Image, Music, ShoppingBag, Scissors, Palette, Dumbbell, Snowflake, Printer, Scale, Lightbulb, Plane, Globe, Wrench, Users, FlaskConical, Heart, ShoppingCart } from 'lucide-react';

// Icon mapping for projects
const PROJECT_ICON_MAP: Record<string, React.FC<any>> = {
  Briefcase, DollarSign, Smartphone, GraduationCap, Pencil, Leaf, Code, Image, Music, ShoppingBag, Scissors, Palette, Dumbbell, Snowflake, Printer, Scale, Lightbulb, Plane, Globe, Wrench, Users, FlaskConical, Heart, ShoppingCart
};

const getProjectIcon = (iconName: string) => PROJECT_ICON_MAP[iconName] || Briefcase;
import { 
  Menu, Plus, MessageSquare, Settings as SettingsIcon, 
  Trash2, Download, PanelLeft, Sparkles, ChevronLeft, ChevronRight, ArrowDown,
  Search, Upload, X, PenSquare, Share2, FolderPlus, Tag, MoreVertical, Edit3,
  Pin, PinOff, FileDown, FileUp, Hash
} from 'lucide-react';

const DEFAULT_PERSONA = Persona.ASSISTANT;

// Project Delete Button with double-confirm
interface ProjectDeleteButtonProps {
  projectId: string;
  isLight: boolean;
  onDelete: () => void;
  lang: string;
}

const ProjectDeleteButton: React.FC<ProjectDeleteButtonProps> = ({ isLight, onDelete, lang }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`p-1 rounded transition-all md:opacity-0 md:group-hover:opacity-100 ${
        confirmDelete 
          ? 'text-red-500 opacity-100' 
          : (isLight ? 'text-gray-400 hover:text-red-500' : 'text-zinc-500 hover:text-red-400')
      }`}
      title={confirmDelete ? (lang === 'ru' ? 'Нажмите ещё раз' : 'Click again') : (lang === 'ru' ? 'Удалить' : 'Delete')}
    >
      <Trash2 size={12} />
    </button>
  );
};

// Chat Item with double-confirm delete
interface ChatItemProps {
  session: ChatSession;
  isSelected: boolean;
  isLight: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPin: () => void;
  onRename: () => void;
  onExport: () => void;
  onTagsClick: () => void;
  isRenaming: boolean;
  renamingTitle: string;
  onRenamingChange: (title: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  lang: string;
  currentFilterTag?: string | null;
}

const ChatItem: React.FC<ChatItemProps> = ({ 
  session, isSelected, isLight, onSelect, onDelete, onPin, onRename, onExport, onTagsClick,
  isRenaming, renamingTitle, onRenamingChange, onRenameSubmit, onRenameCancel, lang, currentFilterTag
}) => {
  // Check if pinned based on current filter
  const isPinnedInContext = currentFilterTag 
    ? (session.pinnedInTags || []).includes(currentFilterTag)
    : session.isPinned;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  if (isRenaming) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isLight ? 'bg-gray-100' : 'bg-[#1a1a1a]'}`}>
        <input
          ref={inputRef}
          type="text"
          value={renamingTitle}
          onChange={(e) => onRenamingChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameSubmit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          onBlur={onRenameCancel}
          className={`flex-1 text-[13px] bg-transparent outline-none ${isLight ? 'text-gray-900' : 'text-white'}`}
        />
      </div>
    );
  }

  return (
    <div 
      onClick={onSelect}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors relative
        ${isSelected 
          ? (isLight ? 'bg-gray-200 text-gray-900' : 'bg-[#252525] text-white') 
          : (isLight ? 'text-gray-600 active:text-gray-900' : 'text-zinc-400 active:text-white')
        }
      `}
    >
      {isPinnedInContext && (
        <Pin size={10} className={`shrink-0 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`} />
      )}
      <div className="flex-1 min-w-0">
        <div className="truncate text-[13px]">{session.title || 'Untitled'}</div>
        {session.tags && session.tags.length > 0 && (
          <div className="flex gap-1 mt-0.5 overflow-hidden">
            {session.tags.slice(0, 2).map(tag => (
              <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-md shrink-0 ${isLight ? 'bg-gray-200/80 text-gray-500' : 'bg-[#1a1a1a] text-zinc-500'}`}>
                #{tag}
              </span>
            ))}
            {session.tags.length > 2 && (
              <span className={`text-[9px] shrink-0 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>+{session.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Menu button - desktop only (hover to show) */}
      <button 
        onClick={(e) => { e.stopPropagation(); haptic.light(); setShowMenu(!showMenu); }}
        className={`hidden md:block p-1.5 rounded transition-all opacity-0 group-hover:opacity-100 ${
          isLight ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <MoreVertical size={16} />
      </button>
      
      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
          <div className={`absolute right-0 top-full mt-1 w-44 rounded-xl shadow-2xl z-50 overflow-hidden ${
            isLight ? 'bg-white border border-gray-200' : 'bg-[#0a0a0a] border border-zinc-800'
          }`}>
            <button
              onClick={(e) => { e.stopPropagation(); onPin(); setShowMenu(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                isLight ? 'text-gray-700 active:bg-gray-100' : 'text-white active:bg-zinc-800/50'
              }`}
            >
              {isPinnedInContext ? <PinOff size={14} /> : <Pin size={14} />}
              {isPinnedInContext ? (lang === 'ru' ? 'Открепить' : 'Unpin') : (lang === 'ru' ? 'Закрепить' : 'Pin')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRename(); setShowMenu(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                isLight ? 'text-gray-700 active:bg-gray-100' : 'text-white active:bg-zinc-800/50'
              }`}
            >
              <Edit3 size={14} />
              {lang === 'ru' ? 'Переименовать' : 'Rename'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTagsClick(); setShowMenu(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                isLight ? 'text-gray-700 active:bg-gray-100' : 'text-white active:bg-zinc-800/50'
              }`}
            >
              <Hash size={14} />
              {lang === 'ru' ? 'Теги' : 'Tags'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onExport(); setShowMenu(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                isLight ? 'text-gray-700 active:bg-gray-100' : 'text-white active:bg-zinc-800/50'
              }`}
            >
              <FileDown size={14} />
              {lang === 'ru' ? 'Экспорт' : 'Export'}
            </button>
            <div className={`border-t ${isLight ? 'border-gray-100' : 'border-zinc-800/50'}`} />
            <button
              onClick={handleDeleteClick}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                confirmDelete ? 'text-red-500 bg-red-500/10' : 'text-red-500'
              } ${isLight ? 'active:bg-red-50' : 'active:bg-red-500/10'}`}
            >
              <Trash2 size={14} />
              {confirmDelete ? (lang === 'ru' ? 'Подтвердить' : 'Confirm') : (lang === 'ru' ? 'Удалить' : 'Delete')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Project Chat Item - simple, no delete button (use chat menu instead)
interface ProjectChatItemProps {
  chat: ChatSession;
  isSelected: boolean;
  isLight: boolean;
  onSelect: () => void;
  lang: string;
}

const ProjectChatItem: React.FC<ProjectChatItemProps> = ({ chat, isSelected, isLight, onSelect, lang }) => {
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? (isLight ? 'bg-gray-200 text-gray-900' : 'bg-[#252525] text-white')
          : (isLight ? 'text-gray-600 active:text-gray-900' : 'text-zinc-400 active:text-white')
      }`}
    >
      <span className="flex-1 text-[13px] truncate">{chat.title || (lang === 'ru' ? 'Новый чат' : 'New chat')}</span>
    </div>
  );
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialPage, setSettingsInitialPage] = useState<'main' | 'api' | 'profile' | 'persona' | 'language' | 'appearance' | 'data' | 'sound' | undefined>(undefined);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isLiveModeOpen, setIsLiveModeOpen] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [previewPanel, setPreviewPanel] = useState<{ isOpen: boolean; code: string; language: string }>({
    isOpen: false,
    code: '',
    language: 'html'
  });
  
  // New states for additional features
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showApiKeyAlert, setShowApiKeyAlert] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  
  // Chat management states
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [editingTagsChatId, setEditingTagsChatId] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('neo_tags');
    return saved ? JSON.parse(saved) : [];
  });
  const [filterTag, setFilterTag] = useState<string | null>(null);
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: ToastType; isOpen: boolean }>({
    message: '',
    type: 'success',
    isOpen: false
  });
  
  // Projects state
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('neo_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false);
  
  // Random suggestions - regenerate only on new chat
  const [randomSuggestions, setRandomSuggestions] = useState<Array<{t: string, d: string}>>([]);
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (type === 'success') haptic.success();
    else if (type === 'error') haptic.error();
    else haptic.light();
    setToast({ message, type, isOpen: true });
  }, []);
  
  // Sound notification
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) { /* ignore audio errors */ }
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('neo_profile');
    return saved ? JSON.parse(saved) : { name: 'User' };
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('neo_settings');
    const defaults: AppSettings = { 
        theme: 'dark', 
        language: 'ru', 
        modelLanguage: 'ru',
        responseLength: 'balanced',
        creativity: 'balanced',
        incognito: false,
        historyRetention: 'forever',
        temperature: 1.0,
        maxTokens: 8192,
        webSearchEnabled: true,
        chatMode: ChatMode.STANDARD,
        adultMode: false,
        knowledgeBase: [],
        soundEnabled: true
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS['ru'];

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
        root.setAttribute('data-theme', 'light');
    } else {
        root.removeAttribute('data-theme');
    }
  }, [settings.theme]);

  useEffect(() => {
    // Check for shared chat in URL
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');
    
    let sharedSession: ChatSession | null = null;
    
    if (shareParam) {
      try {
        // Decode shared chat from URL
        const jsonStr = decodeURIComponent(escape(atob(shareParam)));
        const shareData = JSON.parse(jsonStr);
        
        // Create session from shared data
        sharedSession = {
          id: Date.now().toString(),
          title: shareData.t || 'Shared Chat',
          messages: (shareData.m || []).map((m: any, i: number) => ({
            id: `shared_${i}_${Date.now()}`,
            role: m.r === 'u' ? Role.USER : Role.MODEL,
            text: m.x || '',
            timestamp: Date.now() - (shareData.m.length - i) * 1000
          })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          persona: DEFAULT_PERSONA,
          isShared: true
        };
        
        // Clean URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('Failed to parse shared chat:', e);
      }
    }
    
    const savedSessions = localStorage.getItem('neo_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (sharedSession) {
            // Add shared session at the top
            setSessions([sharedSession, ...parsed]);
            setCurrentSessionId(sharedSession.id);
          } else {
            setSessions(parsed);
            setCurrentSessionId(parsed[0].id);
          }
        } else {
          // Empty or invalid array
          const newSession = sharedSession || {
            id: Date.now().toString(),
            title: 'Новый чат',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            persona: DEFAULT_PERSONA
          };
          setSessions([newSession]);
          setCurrentSessionId(newSession.id);
        }
      } catch (e) {
        // Parse error
        const newSession = sharedSession || {
          id: Date.now().toString(),
          title: 'Новый чат',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          persona: DEFAULT_PERSONA
        };
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
      }
    } else {
      // No saved sessions
      const newSession = sharedSession || {
        id: Date.now().toString(),
        title: 'Новый чат',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        persona: DEFAULT_PERSONA
      };
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
    }
    setIsInitialized(true);
  }, []);

  // Generate suggestions when switching to empty session
  useEffect(() => {
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && currentSession.messages.length === 0 && randomSuggestions.length === 0) {
      const allSuggestions = settings.language === 'ru' ? [
        { t: 'Объясни квантовые вычисления', d: 'Простыми словами' },
        { t: 'Напиши Python скрипт', d: 'Для автоматизации задач' },
        { t: 'Создай план тренировок', d: 'На неделю для начинающих' },
        { t: 'Помоги с рецептом', d: 'Быстрый и вкусный ужин' },
        { t: 'Объясни машинное обучение', d: 'Как работают нейросети' },
        { t: 'Напиши эссе', d: 'На любую тему' },
        { t: 'Помоги с математикой', d: 'Решить задачу' },
        { t: 'Придумай идею для проекта', d: 'Что-то интересное' },
      ] : [
        { t: 'Explain Quantum Computing', d: 'In simple terms' },
        { t: 'Write a Python Script', d: 'To automate daily tasks' },
        { t: 'Create a workout plan', d: 'Weekly routine for beginners' },
        { t: 'Help with a recipe', d: 'Quick and tasty dinner' },
        { t: 'Explain machine learning', d: 'How neural networks work' },
        { t: 'Write an essay', d: 'On any topic' },
        { t: 'Help with math', d: 'Solve a problem' },
        { t: 'Brainstorm project ideas', d: 'Something interesting' },
      ];
      const shuffled = [...allSuggestions].sort(() => Math.random() - 0.5);
      setRandomSuggestions(shuffled.slice(0, 3));
    }
  }, [currentSessionId, sessions, settings.language, randomSuggestions.length]);

  // Track if initial load is complete to prevent overwriting saved data
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!settings.incognito && isInitialized) {
      try {
        // Limit stored data - remove old messages if too large
        const dataToStore = sessions.map(s => ({
          ...s,
          messages: s.messages.slice(-100).map(m => ({
            ...m,
            // Limit attachment data size
            attachments: m.attachments?.map(a => ({
              ...a,
              data: a.data.length > 500000 ? '' : a.data // Remove large attachments from storage
            }))
          }))
        }));
        localStorage.setItem('neo_sessions', JSON.stringify(dataToStore));
      } catch (e) {
        // Storage quota exceeded - try to save without attachments
        try {
          const minimalData = sessions.map(s => ({
            ...s,
            messages: s.messages.slice(-50).map(m => ({
              ...m,
              attachments: [] // Remove all attachments
            }))
          }));
          localStorage.setItem('neo_sessions', JSON.stringify(minimalData));
        } catch {
          // Still failing - clear old sessions
          console.warn('Storage quota exceeded, clearing old data');
        }
      }
    }
  }, [sessions, settings.incognito, isInitialized]);

  useEffect(() => {
    localStorage.setItem('neo_profile', JSON.stringify(userProfile));
  }, [userProfile]);
  
  useEffect(() => {
    localStorage.setItem('neo_settings', JSON.stringify(settings));
  }, [settings]);

  // Save projects
  useEffect(() => {
    localStorage.setItem('neo_projects', JSON.stringify(projects));
  }, [projects]);

  // Save tags
  useEffect(() => {
    localStorage.setItem('neo_tags', JSON.stringify(availableTags));
  }, [availableTags]);

  // Create new project
  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'chatIds'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: Date.now(),
      chatIds: []
    };
    setProjects(prev => [newProject, ...prev]);
    showToast(settings.language === 'ru' ? 'Проект создан!' : 'Project created!', 'success');
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Track previous message count and text length for auto-scroll
  const prevMessageCountRef = useRef(0);
  const lastTextLengthRef = useRef(0);
  const wasStreamingRef = useRef(false);
  
  useEffect(() => {
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const messageCount = currentSession?.messages.length || 0;
    const lastMessage = currentSession?.messages[currentSession.messages.length - 1];
    const currentTextLength = lastMessage?.text?.length || 0;
    
    // Scroll when new message added (user sends)
    const isNewMessage = messageCount > prevMessageCountRef.current;
    
    // Scroll during streaming when text grows
    const isTextGrowing = isStreaming && currentTextLength > lastTextLengthRef.current;
    
    if (isNewMessage || isTextGrowing) {
        scrollToBottom();
    }
    
    // Extra scroll when streaming just finished (to show follow-up questions)
    if (wasStreamingRef.current && !isStreaming) {
        setTimeout(() => scrollToBottom(), 100);
        setTimeout(() => scrollToBottom(), 500);
        setTimeout(() => scrollToBottom(), 1000);
    }
    
    prevMessageCountRef.current = messageCount;
    lastTextLengthRef.current = currentTextLength;
    wasStreamingRef.current = isStreaming;
  }, [currentSessionId, sessions, isStreaming]);

  const scrollToBottom = useCallback(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight + 500,
          behavior: 'smooth'
        });
      }
  }, []);

  // Generate random suggestions
  const generateSuggestions = useCallback(() => {
    const allSuggestions = settings.language === 'ru' ? [
      { t: 'Объясни квантовые вычисления', d: 'Простыми словами' },
      { t: 'Напиши Python скрипт', d: 'Для автоматизации задач' },
      { t: 'Создай план тренировок', d: 'На неделю для начинающих' },
      { t: 'Помоги с рецептом', d: 'Быстрый и вкусный ужин' },
      { t: 'Объясни машинное обучение', d: 'Как работают нейросети' },
      { t: 'Напиши эссе', d: 'На любую тему' },
      { t: 'Помоги с математикой', d: 'Решить задачу' },
      { t: 'Придумай идею для проекта', d: 'Что-то интересное' },
    ] : [
      { t: 'Explain Quantum Computing', d: 'In simple terms' },
      { t: 'Write a Python Script', d: 'To automate daily tasks' },
      { t: 'Create a workout plan', d: 'Weekly routine for beginners' },
      { t: 'Help with a recipe', d: 'Quick and tasty dinner' },
      { t: 'Explain machine learning', d: 'How neural networks work' },
      { t: 'Write an essay', d: 'On any topic' },
      { t: 'Help with math', d: 'Solve a problem' },
      { t: 'Brainstorm project ideas', d: 'Something interesting' },
    ];
    const shuffled = [...allSuggestions].sort(() => Math.random() - 0.5);
    setRandomSuggestions(shuffled.slice(0, 3));
  }, [settings.language]);

  const createSession = () => {
    haptic.medium();
    
    // Check if current session is empty (no messages) - just stay on it
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && currentSession.messages.length === 0) {
      // Already on empty chat, just close menu
      setIsMobileMenuOpen(false);
      return;
    }
    
    // Check if there's already an empty session without project
    const emptySession = sessions.find(s => s.messages.length === 0 && !s.projectId);
    if (emptySession) {
      setSelectedProjectId(null);
      setCurrentSessionId(emptySession.id);
      setIsMobileMenuOpen(false);
      return;
    }
    
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: t.newChat,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      persona: DEFAULT_PERSONA
    };
    setSessions(prev => [newSession, ...prev]);
    setSelectedProjectId(null);
    setCurrentSessionId(newSession.id);
    setIsMobileMenuOpen(false);
    generateSuggestions();
  };
  
  const clearAllHistory = () => {
      if(confirm(t.clearHistoryConfirm)) {
          localStorage.removeItem('neo_sessions');
          setSessions([]);
          createSession();
      }
  };

  // Filter regular chats (without project) - always show in main list
  const filteredSessions = sessions.filter(s => {
    // Hide project chats from main list
    if (s.projectId) return false;
    // Filter by tag
    if (filterTag && !(s.tags || []).includes(filterTag)) return false;
    // Filter by search
    if (searchQuery.trim()) {
      return s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  // Sort: pinned first based on context (tag or global), then by date
  const sortedFilteredSessions = [...filteredSessions].sort((a, b) => {
    if (filterTag) {
      // Check if pinned in this specific tag
      const aPinned = (a.pinnedInTags || []).includes(filterTag);
      const bPinned = (b.pinnedInTags || []).includes(filterTag);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
    } else {
      // In "All" view, use global isPinned
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
    }
    return b.updatedAt - a.updatedAt;
  });

  // Export all data
  const exportAllData = () => {
    const data = {
      sessions,
      userProfile,
      settings,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neo_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import all data
  const importAllData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.sessions) setSessions(data.sessions);
        if (data.userProfile) setUserProfile(data.userProfile);
        if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
        showToast(settings.language === 'ru' ? 'Данные успешно импортированы!' : 'Data imported successfully!', 'success');
      } catch (err) {
        showToast(settings.language === 'ru' ? 'Ошибка импорта данных' : 'Error importing data', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export single chat
  const exportSingleChat = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const data = {
      ...session,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${session.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(settings.language === 'ru' ? 'Чат экспортирован!' : 'Chat exported!', 'success');
  };

  // Import single chat
  const importSingleChat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.messages && Array.isArray(data.messages)) {
          const newSession: ChatSession = {
            id: Date.now().toString(),
            title: data.title || 'Imported Chat',
            messages: data.messages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            persona: data.persona || DEFAULT_PERSONA,
            isPinned: false,
            tags: data.tags || []
          };
          setSessions(prev => [newSession, ...prev]);
          setCurrentSessionId(newSession.id);
          showToast(settings.language === 'ru' ? 'Чат импортирован!' : 'Chat imported!', 'success');
        } else {
          throw new Error('Invalid chat format');
        }
      } catch (err) {
        showToast(settings.language === 'ru' ? 'Ошибка импорта чата' : 'Error importing chat', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Toggle pin chat - pins in current tag filter, or globally if no filter
  const togglePinChat = (sessionId: string) => {
    haptic.light();
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      
      if (filterTag) {
        // Pin/unpin in specific tag
        const pinnedInTags = s.pinnedInTags || [];
        const isPinnedInTag = pinnedInTags.includes(filterTag);
        return {
          ...s,
          pinnedInTags: isPinnedInTag 
            ? pinnedInTags.filter(t => t !== filterTag)
            : [...pinnedInTags, filterTag]
        };
      } else {
        // Pin/unpin globally (in "All" view)
        return { ...s, isPinned: !s.isPinned };
      }
    }));
  };

  // Rename chat
  const renameChat = (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, title: newTitle.trim() } : s
    ));
    setRenamingChatId(null);
    setRenamingTitle('');
  };

  // Add/remove tag from chat - can have multiple tags
  const toggleChatTag = (sessionId: string, tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const currentTags = s.tags || [];
        const hasTag = currentTags.includes(normalizedTag);
        return {
          ...s,
          tags: hasTag ? currentTags.filter(t => t !== normalizedTag) : [...currentTags, normalizedTag]
        };
      }
      return s;
    }));
  };

  // Add new tag - limit 5 tags total
  const MAX_TAGS = 5;
  const addNewTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !availableTags.includes(trimmed) && availableTags.length < MAX_TAGS) {
      setAvailableTags(prev => [...prev, trimmed]);
    }
  };

  // Delete tag
  const deleteTag = (tag: string) => {
    setAvailableTags(prev => prev.filter(t => t !== tag));
    setSessions(prev => prev.map(s => ({
      ...s,
      tags: (s.tags || []).filter(t => t !== tag)
    })));
  };

  // In-chat search - find messages matching query
  const inChatSearchResults = React.useMemo(() => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (!showInChatSearch || !inChatSearchQuery.trim() || !session) return [];
    const query = inChatSearchQuery.toLowerCase();
    return session.messages
      .map((m, idx) => ({ message: m, index: idx }))
      .filter(({ message }) => message.text.toLowerCase().includes(query));
  }, [showInChatSearch, inChatSearchQuery, sessions, currentSessionId]);

  // Auto-scroll to first search result
  useEffect(() => {
    if (inChatSearchResults.length > 0) {
      const firstResult = inChatSearchResults[0];
      const element = document.getElementById(`msg-${firstResult.message.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [inChatSearchResults]);

  // Edit message
  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!currentSessionId || !newText.trim()) return;
    
    const currentSession = getCurrentSession();
    if (!currentSession) return;
    
    const msgIndex = currentSession.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    
    // Create new messages array with edited message and remove all after it
    const newMessages = currentSession.messages.slice(0, msgIndex);
    const editedMsg = { ...currentSession.messages[msgIndex], text: newText };
    newMessages.push(editedMsg);
    
    // Update session with edited message
    const updatedSession = { ...currentSession, messages: newMessages, updatedAt: Date.now() };
    setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
    
    setEditingMessageId(null);
    setEditingText('');
    
    // Regenerate response after edit for user messages
    if (editedMsg.role === Role.USER) {
      const mode = editedMsg.mode || currentSession.lastMode || settings.chatMode || ChatMode.STANDARD;
      await processResponse(currentSessionId, updatedSession, newMessages, settings.webSearchEnabled, mode, settings.responseLength || 'balanced');
    }
  };

  // Delete message
  const handleDeleteMessage = (messageId: string) => {
    if (!currentSessionId) return;
    
    const currentSession = getCurrentSession();
    if (!currentSession) return;
    
    const msgIndex = currentSession.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    
    // Remove the message and keep the rest
    const newMessages = currentSession.messages.filter(m => m.id !== messageId);
    
    // Update session
    const updatedSession = { ...currentSession, messages: newMessages, updatedAt: Date.now() };
    setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
  };

  // Share chat - create shareable link with chat data encoded in URL
  const shareChat = async () => {
    haptic.light();
    const session = getCurrentSession();
    if (!session || session.messages.length === 0) {
      showToast(settings.language === 'ru' ? 'Нечего делиться — чат пуст' : 'Nothing to share — chat is empty', 'info');
      return;
    }
    
    // Create minimal share data - limit message length and count
    const maxMessages = 20;
    const maxTextLength = 2000;
    const messages = session.messages.slice(-maxMessages).map(m => ({
      r: m.role === Role.USER ? 'u' : 'm',
      x: m.text.length > maxTextLength ? m.text.slice(0, maxTextLength) + '...' : m.text
    }));
    
    const shareData = { t: session.title.slice(0, 100), m: messages };
    
    try {
      const jsonStr = JSON.stringify(shareData);
      const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?share=${base64}`;
      
      // If still too long, reduce further
      if (shareUrl.length > 8000) {
        // Try with fewer messages
        const reducedMessages = messages.slice(-10).map(m => ({
          ...m,
          x: m.x.length > 500 ? m.x.slice(0, 500) + '...' : m.x
        }));
        const reducedData = { t: shareData.t, m: reducedMessages };
        const reducedJson = JSON.stringify(reducedData);
        const reducedBase64 = btoa(unescape(encodeURIComponent(reducedJson)));
        const reducedUrl = `${baseUrl}?share=${reducedBase64}`;
        
        if (reducedUrl.length > 8000) {
          showToast(settings.language === 'ru' ? 'Чат слишком длинный' : 'Chat too long', 'info');
          // Copy as text instead
          await navigator.clipboard.writeText(`${session.title}\n\n` + session.messages.slice(-5).map(m => 
            `${m.role === Role.USER ? '👤' : '🤖'} ${m.text.slice(0, 300)}`
          ).join('\n\n'));
          return;
        }
      }
      
      // Copy to clipboard first
      await navigator.clipboard.writeText(shareUrl);
      
      // Try native share API (works on mobile) - share only text, link is in clipboard
      if (navigator.share) {
        try {
          await navigator.share({
            title: session.title,
            text: (settings.language === 'ru' 
              ? 'Посмотри мой чат с NEO! Ссылка скопирована в буфер обмена.' 
              : 'Check out my NEO chat! Link copied to clipboard.')
          });
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      }
      
      showToast(settings.language === 'ru' 
        ? 'Ссылка скопирована!' 
        : 'Link copied!', 'success');
    } catch (err) {
      // Fallback: copy as text
      const text = `${session.title}\n\n` + session.messages.map(m => 
        `${m.role === Role.USER ? '👤' : '🤖'} ${m.text}`
      ).join('\n\n---\n\n');
      
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(settings.language === 'ru' ? 'Чат скопирован как текст!' : 'Chat copied as text!', 'success');
    }
  };

  // Supported MIME types for drag & drop (same as InputArea)
  const SUPPORTED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff',
    'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm',
    'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp', 'video/quicktime',
    'application/pdf',
    'text/plain', 'text/html', 'text/css', 'text/javascript', 'text/x-python', 'text/markdown', 'text/csv'
  ];

  const TEXT_EXTENSIONS = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'rb', 'go', 'rs', 'php', 'swift', 'kt', 'csv', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'sh', 'bash', 'sql'];

  const isSupportedFile = useCallback((file: File): boolean => {
    const mimeType = file.type || '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Explicitly reject archives and unsupported formats
    const REJECTED_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'exe', 'dll', 'so', 'dmg', 'iso', 'apk', 'ipa', 'deb', 'rpm'];
    if (REJECTED_EXTENSIONS.includes(ext)) return false;
    
    // Reject by MIME type
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed') || 
        mimeType.includes('archive') || mimeType.includes('x-7z') || mimeType.includes('x-tar')) {
      return false;
    }
    
    // Exclude Office documents
    if (mimeType.includes('officedocument') || mimeType.includes('msword') || 
        mimeType.includes('excel') || mimeType.includes('powerpoint') ||
        mimeType.includes('opendocument')) {
      return false;
    }
    
    // Check by MIME type
    if (SUPPORTED_MIME_TYPES.some(t => mimeType === t || mimeType.startsWith(t.split('/')[0] + '/'))) {
      return true;
    }
    
    // Check by extension for text files
    if (TEXT_EXTENSIONS.includes(ext)) return true;
    
    return false;
  }, []);

  // Drag counter to handle nested elements properly
  const dragCounterRef = useRef(0);

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    // Filter only supported files
    const supportedFiles = files.filter(isSupportedFile);
    
    if (supportedFiles.length === 0 && files.length > 0) {
      // Show alert if no supported files
      showToast(settings.language === 'ru' 
        ? 'Неподдерживаемый формат файла'
        : 'Unsupported file format', 'error');
      return;
    }
    
    if (supportedFiles.length > 0 && fileInputRef.current) {
      const dt = new DataTransfer();
      supportedFiles.forEach(f => dt.items.add(f));
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, [isSupportedFile, settings.language]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ or Cmd+/ - toggle sidebar search
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      // Ctrl+F or Cmd+F - toggle in-chat search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowInChatSearch(prev => !prev);
        setInChatSearchQuery('');
      }
      // Escape - close modals/search
      if (e.key === 'Escape') {
        if (showInChatSearch) { setShowInChatSearch(false); setInChatSearchQuery(''); }
        else if (showSearch) setShowSearch(false);
        else if (showTagsModal) { setShowTagsModal(false); setEditingTagsChatId(null); }
        else if (editingMessageId) { setEditingMessageId(null); setEditingText(''); }
        else if (previewPanel.isOpen) setPreviewPanel(prev => ({ ...prev, isOpen: false }));
      }
      // Ctrl+N - new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createSession();
      }
      // Ctrl+E - export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportAllData();
      }
      // Ctrl+K - keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
      // Ctrl+, - settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, editingMessageId, previewPanel.isOpen]);

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
      setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
    if (newSessions.length === 0) createSession();
  };

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  const updateCurrentSession = (updater: (session: ChatSession) => ChatSession) => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => s.id === currentSessionId ? updater(s) : s));
  };

  const processResponse = async (
      sessionId: string, 
      currentSession: ChatSession, 
      messagesForContext: Message[], 
      webSearch: boolean, 
      mode: ChatMode,
      responseLength: 'brief' | 'balanced' | 'detailed',
      existingMessageId?: string 
    ) => {
    
    // Determine if search will be used (same logic as in geminiService)
    const lastUserMsg = messagesForContext[messagesForContext.length - 1];
    const containsLink = lastUserMsg?.text?.includes('http') || lastUserMsg?.text?.includes('www.');
    const searchKeywords = ['сегодня', 'сейчас', 'новости', 'последние', 'today', 'now', 'news', 'latest', 'кто такой', 'что такое', 'who is', 'what is', 'лучший', 'топ', 'best', 'top', 'погода', 'weather'];
    const queryLower = (lastUserMsg?.text || '').toLowerCase();
    const needsSearch = searchKeywords.some(kw => queryLower.includes(kw));
    const willSearch = webSearch || mode === ChatMode.RESEARCH || containsLink || needsSearch;
    
    let aiMsgId = existingMessageId;
    if (!aiMsgId) {
        aiMsgId = (Date.now() + 1).toString();
        const aiPlaceholder: Message = {
          id: aiMsgId,
          role: Role.MODEL,
          text: '',
          timestamp: Date.now(),
          isThinking: true,
          isSearching: willSearch, // Show searching indicator
          mode: mode 
        };
        const updatedSession = { ...currentSession, messages: [...messagesForContext, aiPlaceholder], lastMode: mode };
        setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
    } else {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                 const newMessages = s.messages.map(m => m.id === aiMsgId ? { ...m, text: '', isThinking: true, isSearching: willSearch } : m);
                 return { ...s, messages: newMessages };
            }
            return s;
        }));
    }

    setIsStreaming(true);

    try {
      let streamedText = "";
      // Build knowledge base string
      const knowledgeStr = (settings.knowledgeBase || []).map(k => `[${k.name}]: ${k.content}`).join('\n\n');
      
      await streamChatResponse(
        messagesForContext, 
        currentSession.persona,
        settings.customSystemInstruction,
        settings.modelLanguage,
        (chunk) => {
            streamedText += chunk;
            setSessions(prev => prev.map(s => {
                if (s.id === sessionId) {
                    const newMessages = s.messages.map(m => m.id === aiMsgId ? { ...m, text: streamedText, isThinking: true } : m);
                    return { ...s, messages: newMessages };
                }
                return s;
            }));
        },
        (groundingChunks) => {
             setSessions(prev => prev.map(s => {
                if (s.id === sessionId) {
                    const urls = groundingChunks.map((c: any) => ({
                         title: c.web?.title || c.web?.uri || "Source",
                         uri: c.web?.uri || "#"
                    })).filter((u:any) => u.uri !== "#");
                    const newMessages = s.messages.map(m => m.id === aiMsgId ? { ...m, groundingUrls: urls } : m);
                    return { ...s, messages: newMessages };
                }
                return s;
             }));
        },
        webSearch,
        mode,
        responseLength,
        settings.creativity,
        userProfile.name,
        userProfile.bio,
        settings.adultMode,
        knowledgeStr,
        userProfile.avatar
      );

      // Get the final response text for follow-up generation
      const finalResponseText = streamedText;
      const userQuery = lastUserMsg?.text || '';
      
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id === sessionId) {
              const newMessages = s.messages.map(m => m.id === aiMsgId ? { ...m, isThinking: false, isSearching: false } : m);
              return { ...s, messages: newMessages };
          }
          return s;
        });
        
        // Check for code to preview after streaming completes
        const session = updated.find(s => s.id === sessionId);
        const lastMsg = session?.messages.find(m => m.id === aiMsgId);
        if (lastMsg?.text) {
          const codeData = extractCodeForPreview(lastMsg.text);
          if (codeData) {
            // Use setTimeout to ensure state update happens after render
            setTimeout(() => {
              setPreviewPanel({ isOpen: true, code: codeData.code, language: codeData.language });
            }, 100);
          }
        }
        
        return updated;
      });
      
      // Final scroll to bottom after streaming completes
      setTimeout(() => scrollToBottom(), 100);
      setTimeout(() => scrollToBottom(), 300);
      
      // Play notification sound when response is complete
      if (settings.soundEnabled) {
        playNotificationSound();
      }
      
      // Generate follow-up questions for all modes (async, don't block)
      if (finalResponseText && userQuery) {
        generateFollowUpQuestions(userQuery, finalResponseText, settings.language).then(questions => {
          if (questions.length > 0) {
            setSessions(prev => prev.map(s => {
              if (s.id === sessionId) {
                const newMessages = s.messages.map(m => 
                  m.id === aiMsgId ? { ...m, suggestedQuestions: questions } : m
                );
                return { ...s, messages: newMessages };
              }
              return s;
            }));
          }
        }).catch(() => {}); // Ignore errors silently
      }

    } catch (e) {
      console.error(e);
      setIsStreaming(false);
    } finally {
      setIsStreaming(false);
    }
  }

  const handleSendMessage = async (text: string, attachments: any[], webSearch: boolean, mode: ChatMode, responseLength: 'brief' | 'balanced' | 'detailed') => {
    if (!currentSessionId) return;
    
    // Block if already streaming
    if (isStreaming) return;
    
    // Check API key
    if (!hasValidApiKey()) {
      showToast(settings.language === 'ru' 
        ? 'Добавьте API ключ в настройках' 
        : 'Please add API key in Settings', 'error');
      setSettingsInitialPage('api');
      setIsSettingsOpen(true);
      return;
    }
    
    const currentSession = getCurrentSession();
    if(!currentSession) return;
    
    // Compress images before sending
    const processedAttachments = await Promise.all(
      attachments.map(async (att) => {
        if (att.mimeType.startsWith('image/') && att.data.length > 100000) {
          const compressed = await compressImage(att.data);
          return { ...att, data: compressed };
        }
        return att;
      })
    );
    
    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, text, attachments: processedAttachments, timestamp: Date.now(), mode: mode };
    const messages = [...currentSession.messages, userMsg];
    let updatedSession = { ...currentSession, messages, updatedAt: Date.now() };
    const shouldGenerateTitle = currentSession.messages.length === 0 && !settings.incognito;
    const sessionIdForTitle = currentSessionId;
    setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
    
    // Scroll to bottom immediately when user sends message
    setTimeout(() => scrollToBottom(), 50);
    await processResponse(currentSessionId, updatedSession, messages, webSearch, mode, responseLength);
    if (shouldGenerateTitle && sessionIdForTitle) {
         generateChatTitle(text, settings.language === 'ru' ? 'ru' : 'en').then(newTitle => {
            if (newTitle && newTitle !== 'Новый чат' && newTitle !== 'New Chat') {
                setSessions(prev => prev.map(s => s.id === sessionIdForTitle ? { ...s, title: newTitle } : s));
            }
        }).catch(() => {});
    }
  };

  const handleRegenerate = async (targetMessageIndex: number) => {
    if (!currentSessionId || isStreaming) return;
    const session = getCurrentSession();
    if (!session || session.messages.length === 0) return;
    const targetMsg = session.messages[targetMessageIndex];
    
    // Use the mode from the original message, or current settings
    const originalMode = targetMsg.mode || session.lastMode || settings.chatMode || ChatMode.STANDARD;
    // Keep web search enabled if it was used before
    const useWebSearch = settings.webSearchEnabled;
    
    let contextMessages: Message[] = [];
    if (targetMsg.role === Role.MODEL) {
        contextMessages = session.messages.slice(0, targetMessageIndex);
        await processResponse(currentSessionId, session, contextMessages, useWebSearch, originalMode, settings.responseLength || 'balanced', targetMsg.id);
    } else {
        const nextMsg = session.messages[targetMessageIndex + 1];
        if (nextMsg && nextMsg.role === Role.MODEL) {
             const msgMode = nextMsg.mode || originalMode;
             contextMessages = session.messages.slice(0, targetMessageIndex + 1);
             await processResponse(currentSessionId, session, contextMessages, useWebSearch, msgMode, settings.responseLength || 'balanced', nextMsg.id);
        }
    }
  };

  const handleRateMessage = (messageId: string, rating: 'like' | 'dislike') => {
      updateCurrentSession(s => ({
          ...s,
          messages: s.messages.map(m => m.id === messageId ? { ...m, rating: m.rating === rating ? undefined : rating } : m)
      }));
  };

  const handleStopGeneration = () => {
    // Останавливаем стриминг в сервисе
    stopStreaming();
    setIsStreaming(false);
    setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
            const newMessages = [...s.messages];
            const lastMsgIndex = newMessages.length - 1;
            if (newMessages[lastMsgIndex] && newMessages[lastMsgIndex].role === Role.MODEL) {
                newMessages[lastMsgIndex].isThinking = false;
            }
            return { ...s, messages: newMessages };
        }
        return s;
    }));
  };


  
  const handleDownload = (format: string) => {
      const session = getCurrentSession();
      if(!session) return;
      let content = '';
      let mimeType = 'text/plain';
      let extension = format;

      if (format === 'json') {
          content = JSON.stringify(session.messages, null, 2);
          mimeType = 'application/json';
      } else if (format === 'md') {
          content = `# ${session.title}\n\n` + session.messages.map(m => `**${m.role.toUpperCase()}**: ${m.text}`).join('\n\n---\n\n');
          mimeType = 'text/markdown';
      } else if (format === 'html') {
          content = `<html><body><h1>${session.title}</h1>${session.messages.map(m => `<div><strong>${m.role}</strong>: <pre>${m.text}</pre></div>`).join('')}</body></html>`;
          mimeType = 'text/html';
      } else {
          content = session.messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.title.replace(/\s+/g, '_')}.${extension}`;
      a.click();
      setIsDownloadModalOpen(false);
  };

  const currentSession = getCurrentSession();
  const DefaultAvatar = () => (
      <div className="w-full h-full bg-black flex items-center justify-center text-sm font-bold text-white">{userProfile.name.charAt(0).toUpperCase()}</div>
  );

  return (
    <div className="flex bg-background text-text overflow-hidden font-sans selection:bg-accent/20 transition-colors duration-300" style={{ height: 'var(--app-height, 100dvh)', minHeight: 'var(--app-height, 100dvh)' }}>
      
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - ChatGPT style */}
      <aside 
        className={`
            fixed md:relative z-50 bg-sidebar flex flex-col transition-all duration-150 ease-out
            ${isMobileMenuOpen ? 'translate-x-0 w-[300px]' : '-translate-x-full w-[300px] md:translate-x-0'}
            ${isSidebarOpen ? 'md:w-[260px]' : 'md:w-0 md:min-w-0 md:overflow-hidden'}
        `}
        style={{ height: 'var(--app-height, 100dvh)' }}
      >
        {/* Top bar - Search + New chat button */}
        <div className="p-3 flex items-center gap-2" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
            <div className="flex-1 relative">
                <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${settings.theme === 'light' ? 'text-gray-400' : 'text-zinc-600'}`} strokeWidth={2} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={settings.language === 'ru' ? 'Поиск' : 'Search'}
                    className={`w-full rounded-full pl-10 pr-3 h-10 text-[14px] text-text focus:outline-none transition-colors ${
                        settings.theme === 'light' 
                            ? 'bg-gray-100 placeholder-gray-400 focus:bg-gray-200' 
                            : 'bg-[#0a0a0a] placeholder-zinc-600 focus:bg-[#111111]'
                    }`}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${settings.theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-400 hover:text-white'}`}>
                        <X size={14} />
                    </button>
                )}
            </div>
            <label 
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                    settings.theme === 'light' 
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-200 active:text-gray-700' 
                        : 'bg-[#0a0a0a] text-zinc-500 hover:bg-[#111111] hover:text-white active:text-white'
                }`}
                title={settings.language === 'ru' ? 'Импорт чата' : 'Import chat'}
            >
                <FileUp size={18} strokeWidth={1.5} />
                <input
                    type="file"
                    accept=".json"
                    onChange={importSingleChat}
                    className="hidden"
                />
            </label>
            <button 
                onClick={createSession}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    settings.theme === 'light' 
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-200 active:text-gray-700' 
                        : 'bg-[#0a0a0a] text-zinc-500 hover:bg-[#111111] hover:text-white active:text-white'
                }`}
                title={t.newChat}
            >
                <PenSquare size={18} strokeWidth={1.5} />
            </button>
        </div>

        {/* Projects Section */}
        <div className="px-2 pb-2">
            {/* Header with New Project and collapse button */}
            <div className="flex items-center justify-between mb-1">
                <button 
                    onClick={() => { haptic.light(); setIsNewProjectModalOpen(true); }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                        settings.theme === 'light' 
                            ? 'text-gray-600 active:text-gray-900' 
                            : 'text-zinc-400 active:text-white'
                    }`}
                >
                    <FolderPlus size={16} strokeWidth={1.5} />
                    <span className="text-[13px]">{settings.language === 'ru' ? 'Новый проект' : 'New Project'}</span>
                </button>
                
                {projects.length > 0 && (
                    <button 
                        onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
                        className={`p-1.5 rounded-lg transition-colors ${
                            settings.theme === 'light' 
                                ? 'text-gray-400 active:text-gray-600' 
                                : 'text-zinc-500 active:text-zinc-300'
                        }`}
                    >
                        <ChevronLeft size={16} className={`transition-transform ${isProjectsCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                    </button>
                )}
            </div>
            
            {/* Projects List with nested chats */}
            {!isProjectsCollapsed && projects.map(project => {
                const IconComponent = getProjectIcon(project.icon);
                const isExpanded = expandedProjects.has(project.id);
                const projectChats = sessions.filter(s => s.projectId === project.id);
                
                return (
                    <div key={project.id} className="mb-0.5">
                        {/* Project Header */}
                        <div 
                            className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                                selectedProjectId === project.id
                                    ? (settings.theme === 'light' ? 'text-gray-900' : 'text-white')
                                    : (settings.theme === 'light' ? 'text-gray-600' : 'text-zinc-400')
                            }`}
                        >
                            {/* Expand/Collapse button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    haptic.light();
                                    setExpandedProjects(prev => {
                                        const next = new Set(prev);
                                        if (next.has(project.id)) {
                                            next.delete(project.id);
                                        } else {
                                            next.add(project.id);
                                        }
                                        return next;
                                    });
                                }}
                                className={`p-0.5 rounded transition-colors ${settings.theme === 'light' ? 'text-gray-400' : 'text-zinc-500'}`}
                            >
                                <ChevronLeft size={14} className={`transition-transform ${isExpanded ? '-rotate-90' : 'rotate-0'}`} />
                            </button>
                            
                            <div 
                                className="flex-1 flex items-center gap-2 min-w-0"
                                onClick={() => {
                                    haptic.light();
                                    setSelectedProjectId(project.id);
                                    setExpandedProjects(prev => new Set(prev).add(project.id));
                                    // Select first chat or existing empty one
                                    if (projectChats.length > 0) {
                                        setCurrentSessionId(projectChats[0].id);
                                    } else {
                                        // Check if empty chat for this project already exists
                                        const existingEmpty = sessions.find(s => s.projectId === project.id && s.messages.length === 0);
                                        if (existingEmpty) {
                                            setCurrentSessionId(existingEmpty.id);
                                        } else {
                                            const newSession: ChatSession = {
                                                id: Date.now().toString(),
                                                title: '',
                                                messages: [],
                                                createdAt: Date.now(),
                                                updatedAt: Date.now(),
                                                persona: DEFAULT_PERSONA,
                                                projectId: project.id
                                            };
                                            setSessions(prev => [newSession, ...prev]);
                                            setCurrentSessionId(newSession.id);
                                        }
                                    }
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                <IconComponent size={16} style={{ color: project.color === '#ffffff' ? undefined : project.color }} />
                                <span className="text-[13px] font-medium truncate">{project.name}</span>
                            </div>
                            
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    haptic.light();
                                    setSelectedProjectId(project.id);
                                    // Check if empty chat for this project already exists
                                    const existingEmpty = sessions.find(s => s.projectId === project.id && s.messages.length === 0);
                                    if (existingEmpty) {
                                        setCurrentSessionId(existingEmpty.id);
                                        setIsMobileMenuOpen(false);
                                        return;
                                    }
                                    const newSession: ChatSession = {
                                        id: Date.now().toString(),
                                        title: '',
                                        messages: [],
                                        createdAt: Date.now(),
                                        updatedAt: Date.now(),
                                        persona: DEFAULT_PERSONA,
                                        projectId: project.id
                                    };
                                    setSessions(prev => [newSession, ...prev]);
                                    setCurrentSessionId(newSession.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`p-1 rounded transition-all md:opacity-0 md:group-hover:opacity-100 ${
                                    settings.theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                                title={settings.language === 'ru' ? 'Новый чат' : 'New chat'}
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                        
                        {/* Project Chats - nested under project */}
                        {isExpanded && (
                            <div className="ml-6 space-y-0.5">
                                {projectChats.length === 0 ? (
                                    <div className={`px-2 py-1.5 text-[12px] ${settings.theme === 'light' ? 'text-gray-400' : 'text-zinc-600'}`}>
                                        {settings.language === 'ru' ? 'Нет чатов' : 'No chats'}
                                    </div>
                                ) : (
                                    projectChats.slice(0, 5).map(chat => (
                                        <ProjectChatItem
                                            key={chat.id}
                                            chat={chat}
                                            isSelected={currentSessionId === chat.id && selectedProjectId === project.id}
                                            isLight={settings.theme === 'light'}
                                            onSelect={() => {
                                                haptic.light();
                                                setSelectedProjectId(project.id);
                                                setCurrentSessionId(chat.id);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            lang={settings.language}
                                        />
                                    ))
                                )}
                                {projectChats.length > 5 && (
                                    <div className={`px-2 py-1 text-[11px] ${settings.theme === 'light' ? 'text-gray-400' : 'text-zinc-600'}`}>
                                        +{projectChats.length - 5} {settings.language === 'ru' ? 'ещё' : 'more'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Tags filter with horizontal scroll */}
        {availableTags.length > 0 && (
          <div className="px-2 pb-2 relative group/tags">
            <div className="flex items-center gap-1">
              {/* Left arrow - desktop only */}
              <button
                onClick={() => {
                  const container = document.getElementById('tags-scroll-container');
                  if (container) container.scrollBy({ left: -100, behavior: 'smooth' });
                }}
                className={`hidden md:flex shrink-0 w-6 h-6 items-center justify-center rounded-full transition-all opacity-0 group-hover/tags:opacity-100 ${
                  settings.theme === 'light' ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-[#1a1a1a] text-zinc-400 hover:bg-[#252525]'
                }`}
              >
                <ChevronLeft size={14} />
              </button>
              
              {/* Scrollable tags container */}
              <div 
                id="tags-scroll-container"
                className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <button
                  onClick={() => setFilterTag(null)}
                  className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                    filterTag === null
                      ? (settings.theme === 'light' ? 'bg-gray-900 text-white' : 'bg-white text-black')
                      : (settings.theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-[#1a1a1a] text-zinc-400')
                  }`}
                >
                  {settings.language === 'ru' ? 'Все' : 'All'}
                </button>
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${
                      filterTag === tag
                        ? (settings.theme === 'light' ? 'bg-gray-900 text-white' : 'bg-white text-black')
                        : (settings.theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-[#1a1a1a] text-zinc-400')
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              
              {/* Right arrow - desktop only */}
              <button
                onClick={() => {
                  const container = document.getElementById('tags-scroll-container');
                  if (container) container.scrollBy({ left: 100, behavior: 'smooth' });
                }}
                className={`hidden md:flex shrink-0 w-6 h-6 items-center justify-center rounded-full transition-all opacity-0 group-hover/tags:opacity-100 ${
                  settings.theme === 'light' ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-[#1a1a1a] text-zinc-400 hover:bg-[#252525]'
                }`}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 pt-1 space-y-0.5 scrollbar-hide">
            {!isInitialized ? (
                <SkeletonLoader isLight={settings.theme === 'light'} type="sidebar" />
            ) : sortedFilteredSessions.map(session => {
                const handleDelete = () => {
                    const newSessions = sessions.filter(s => s.id !== session.id);
                    setSessions(newSessions);
                    
                    const firstNonProjectChat = newSessions.find(s => !s.projectId);
                    if (firstNonProjectChat) {
                        setCurrentSessionId(firstNonProjectChat.id);
                    } else {
                        const newSession: ChatSession = {
                            id: Date.now().toString(),
                            title: t.newChat,
                            messages: [],
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            persona: DEFAULT_PERSONA
                        };
                        setSessions(prev => [newSession, ...prev]);
                        setCurrentSessionId(newSession.id);
                    }
                    setSelectedProjectId(null);
                };

                const chatItemProps = {
                    session,
                    isSelected: currentSessionId === session.id && !selectedProjectId,
                    isLight: settings.theme === 'light',
                    onSelect: () => {
                        haptic.light();
                        setSelectedProjectId(null);
                        setCurrentSessionId(session.id);
                        setIsMobileMenuOpen(false);
                    },
                    onDelete: handleDelete,
                    onPin: () => togglePinChat(session.id),
                    onRename: () => { setRenamingChatId(session.id); setRenamingTitle(session.title); },
                    onExport: () => exportSingleChat(session.id),
                    onTagsClick: () => { setEditingTagsChatId(session.id); setShowTagsModal(true); },
                    isRenaming: renamingChatId === session.id,
                    renamingTitle,
                    onRenamingChange: setRenamingTitle,
                    onRenameSubmit: () => renameChat(session.id, renamingTitle),
                    onRenameCancel: () => { setRenamingChatId(null); setRenamingTitle(''); },
                    lang: settings.language,
                    currentFilterTag: filterTag
                };

                return (
                    <div key={session.id} className="md:hidden">
                        <ChatItem {...chatItemProps} />
                    </div>
                );
            })}
            {/* Desktop version */}
            {isInitialized && sortedFilteredSessions.map(session => {
                const handleDelete = () => {
                    const newSessions = sessions.filter(s => s.id !== session.id);
                    setSessions(newSessions);
                    
                    const firstNonProjectChat = newSessions.find(s => !s.projectId);
                    if (firstNonProjectChat) {
                        setCurrentSessionId(firstNonProjectChat.id);
                    } else {
                        const newSession: ChatSession = {
                            id: Date.now().toString(),
                            title: t.newChat,
                            messages: [],
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            persona: DEFAULT_PERSONA
                        };
                        setSessions(prev => [newSession, ...prev]);
                        setCurrentSessionId(newSession.id);
                    }
                    setSelectedProjectId(null);
                };

                return (
                    <div key={session.id} className="hidden md:block">
                        <ChatItem 
                            session={session}
                            isSelected={currentSessionId === session.id && !selectedProjectId}
                            isLight={settings.theme === 'light'}
                            onSelect={() => {
                                haptic.light();
                                setSelectedProjectId(null);
                                setCurrentSessionId(session.id);
                                setIsMobileMenuOpen(false);
                            }}
                            onDelete={handleDelete}
                            onPin={() => togglePinChat(session.id)}
                            onRename={() => { setRenamingChatId(session.id); setRenamingTitle(session.title); }}
                            onExport={() => exportSingleChat(session.id)}
                            onTagsClick={() => { setEditingTagsChatId(session.id); setShowTagsModal(true); }}
                            isRenaming={renamingChatId === session.id}
                            renamingTitle={renamingTitle}
                            onRenamingChange={setRenamingTitle}
                            onRenameSubmit={() => renameChat(session.id, renamingTitle)}
                            onRenameCancel={() => { setRenamingChatId(null); setRenamingTitle(''); }}
                            lang={settings.language}
                            currentFilterTag={filterTag}
                        />
                    </div>
                );
            })}
        </div>

        {/* Bottom - User profile + Settings */}
        <div className={`p-3 border-t ${settings.theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
            <div className="flex items-center gap-2">
                <div 
                    className="flex-1 flex items-center gap-3 cursor-pointer hover:bg-surface-hover p-2 rounded-xl transition-colors"
                    onClick={() => { haptic.light(); setSettingsInitialPage('profile'); setIsSettingsOpen(true); }}
                >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-surface flex items-center justify-center text-xs font-bold text-text">
                        {userProfile.avatar ? (
                            <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            userProfile.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm truncate text-text">{userProfile.name}</div>
                    </div>
                </div>
                <button 
                    onClick={() => { haptic.light(); setIsSettingsOpen(true); }}
                    className="p-2 text-text-secondary hover:text-text hover:bg-surface-hover rounded-xl transition-colors"
                >
                    <SettingsIcon size={18} />
                </button>
            </div>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-full relative bg-background transition-[width] duration-150 overflow-hidden ${previewPanel.isOpen ? 'md:w-[50%] lg:w-[55%] xl:w-[60%]' : 'w-full'}`}>
        
        <header 
            className={`flex items-center justify-between px-3 z-30 relative shrink-0 ${
                settings.theme === 'light' ? 'bg-white' : 'bg-black'
            }`} 
            style={{ 
                paddingTop: 'max(10px, env(safe-area-inset-top))', 
                minHeight: 'calc(48px + env(safe-area-inset-top, 0px))',
                paddingBottom: '6px'
            }}
        >
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsMobileMenuOpen(true)} 
                    className={`md:hidden p-2 -ml-2 rounded-lg transition-colors ${
                        settings.theme === 'light' 
                            ? 'text-gray-600 active:text-gray-900' 
                            : 'text-zinc-400 active:text-white'
                    }`}
                >
                    <Menu size={22} />
                </button>
                
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className={`hidden md:block p-2 rounded-lg transition-colors ${
                        settings.theme === 'light' 
                            ? 'text-gray-500 active:text-gray-700' 
                            : 'text-zinc-400 active:text-white'
                    }`}
                >
                    {isSidebarOpen ? <ChevronLeft size={20} /> : <PanelLeft size={20} />}
                </button>

                {selectedProject ? (
                    <div className="flex items-center gap-2">
                        {(() => {
                            const IconComponent = getProjectIcon(selectedProject.icon);
                            return (
                                <div 
                                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: selectedProject.color === '#ffffff' ? '#1a1a1a' : selectedProject.color + '15' }}
                                >
                                    <IconComponent size={14} style={{ color: selectedProject.color === '#ffffff' ? '#a1a1aa' : selectedProject.color }} />
                                </div>
                            );
                        })()}
                        <span className={`font-medium text-[15px] truncate max-w-[160px] md:max-w-xs ${
                            settings.theme === 'light' ? 'text-gray-800' : 'text-zinc-200'
                        }`}>
                            {selectedProject.name}
                        </span>
                    </div>
                ) : (
                    <span className={`font-medium text-[15px] truncate max-w-[160px] md:max-w-xs ${
                        settings.theme === 'light' ? 'text-gray-800' : 'text-zinc-200'
                    }`}>
                        {currentSession?.title || 'NEO'}
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-1">
                {/* In-chat search - inline */}
                {showInChatSearch ? (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                        settings.theme === 'light' ? 'bg-gray-100' : 'bg-[#0a0a0a]'
                    }`}>
                        <Search size={16} className={settings.theme === 'light' ? 'text-gray-400' : 'text-zinc-600'} />
                        <input
                            type="text"
                            value={inChatSearchQuery}
                            onChange={(e) => setInChatSearchQuery(e.target.value)}
                            placeholder={settings.language === 'ru' ? 'Поиск...' : 'Search...'}
                            autoFocus
                            className={`w-32 md:w-48 text-[13px] bg-transparent outline-none ${
                                settings.theme === 'light' ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-zinc-500'
                            }`}
                        />
                        {inChatSearchResults.length > 0 && (
                            <span className={`text-[11px] whitespace-nowrap ${settings.theme === 'light' ? 'text-gray-400' : 'text-zinc-500'}`}>
                                {inChatSearchResults.length}
                            </span>
                        )}
                        <button
                            onClick={() => { setShowInChatSearch(false); setInChatSearchQuery(''); }}
                            className={`p-1 rounded-full ${settings.theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setShowInChatSearch(true)}
                        className={`p-2.5 rounded-lg transition-colors ${
                            settings.theme === 'light' ? 'text-gray-500 active:text-gray-700' : 'text-zinc-400 active:text-white'
                        }`} 
                        title={settings.language === 'ru' ? 'Поиск в чате' : 'Search in chat'}
                    >
                        <Search size={20} />
                    </button>
                )}
                {/* Desktop: show buttons */}
                <button 
                    onClick={shareChat} 
                    className={`hidden md:block p-2.5 rounded-lg transition-colors ${
                        settings.theme === 'light' 
                            ? 'text-gray-500 active:text-gray-700' 
                            : 'text-zinc-400 active:text-white'
                    }`} 
                    title={settings.language === 'ru' ? 'Поделиться' : 'Share'}
                >
                    <Share2 size={20} />
                </button>
                <button 
                    onClick={() => setIsDownloadModalOpen(true)} 
                    className={`hidden md:block p-2.5 rounded-lg transition-colors ${
                        settings.theme === 'light' 
                            ? 'text-gray-500 active:text-gray-700' 
                            : 'text-zinc-400 active:text-white'
                    }`} 
                    title="Export"
                >
                    <Download size={20} />
                </button>
                
                {/* Mobile: three dots menu */}
                <div className="relative md:hidden">
                    <button 
                        onClick={() => setShowChatMenu(!showChatMenu)} 
                        className={`p-2.5 rounded-lg transition-colors ${
                            settings.theme === 'light' 
                                ? 'text-gray-500 active:text-gray-700' 
                                : 'text-zinc-400 active:text-white'
                        }`}
                    >
                        <MoreVertical size={20} />
                    </button>
                    
                    {/* Dropdown menu */}
                    {showChatMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowChatMenu(false)} />
                            <div className={`absolute right-0 top-full mt-1 w-52 rounded-xl shadow-xl z-50 overflow-hidden animate-dropdown ${
                                settings.theme === 'light' ? 'bg-white border border-gray-200' : 'bg-[#0a0a0a] border border-zinc-800/50'
                            }`}>
                                {/* Pin - only for non-project chats */}
                                {!currentSession?.projectId && (
                                    <button
                                        onClick={() => {
                                            if (currentSessionId) {
                                                togglePinChat(currentSessionId);
                                            }
                                            setShowChatMenu(false);
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                                            settings.theme === 'light' ? 'text-gray-700 active:bg-gray-100' : 'text-white active:bg-zinc-800/50'
                                        }`}
                                    >
                                        {(() => {
                                            const isPinnedInContext = filterTag 
                                                ? (currentSession?.pinnedInTags || []).includes(filterTag)
                                                : currentSession?.isPinned;
                                            return (
                                                <>
                                                    {isPinnedInContext 
                                                        ? <PinOff size={16} className={settings.theme === 'light' ? 'text-gray-500' : 'text-zinc-500'} />
                                                        : <Pin size={16} className={settings.theme === 'light' ? 'text-gray-500' : 'text-zinc-500'} />
                                                    }
                                                    <span className="text-[14px]">{isPinnedInContext ? (settings.language === 'ru' ? 'Открепить' : 'Unpin') : (settings.language === 'ru' ? 'Закрепить' : 'Pin')}</span>
                                                </>
                                            );
                                        })()}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        const newTitle = prompt(settings.language === 'ru' ? 'Новое название:' : 'New title:', currentSession?.title || '');
                                        if (newTitle && currentSessionId) {
                                            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
                                        }
                                        setShowChatMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                                        settings.theme === 'light' ? 'text-gray-700 active:bg-gray-100' : 'text-white active:bg-zinc-800/50'
                                    }`}
                                >
                                    <Edit3 size={16} className={settings.theme === 'light' ? 'text-gray-500' : 'text-zinc-500'} />
                                    <span className="text-[14px]">{settings.language === 'ru' ? 'Переименовать' : 'Rename'}</span>
                                </button>
                                {/* Tags - only for non-project chats */}
                                {!currentSession?.projectId && (
                                    <button
                                        onClick={() => {
                                            if (currentSessionId) {
                                                setEditingTagsChatId(currentSessionId);
                                                setShowTagsModal(true);
                                            }
                                            setShowChatMenu(false);
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                                            settings.theme === 'light' ? 'text-gray-700 active:bg-gray-100' : 'text-white active:bg-zinc-800/50'
                                        }`}
                                    >
                                        <Hash size={16} className={settings.theme === 'light' ? 'text-gray-500' : 'text-zinc-500'} />
                                        <span className="text-[14px]">{settings.language === 'ru' ? 'Теги' : 'Tags'}</span>
                                    </button>
                                )}
                                <div className={`border-t ${settings.theme === 'light' ? 'border-gray-100' : 'border-zinc-800/50'}`} />
                                <button
                                    onClick={() => { shareChat(); setShowChatMenu(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                                        settings.theme === 'light' ? 'text-gray-700 active:bg-gray-100' : 'text-white active:bg-zinc-800/50'
                                    }`}
                                >
                                    <Share2 size={16} className={settings.theme === 'light' ? 'text-gray-500' : 'text-zinc-500'} />
                                    <span className="text-[14px]">{settings.language === 'ru' ? 'Поделиться' : 'Share'}</span>
                                </button>
                                <button
                                    onClick={() => { setIsDownloadModalOpen(true); setShowChatMenu(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                                        settings.theme === 'light' ? 'text-gray-700 active:bg-gray-100' : 'text-white active:bg-zinc-800/50'
                                    }`}
                                >
                                    <Download size={16} className={settings.theme === 'light' ? 'text-gray-500' : 'text-zinc-500'} />
                                    <span className="text-[14px]">{settings.language === 'ru' ? 'Экспорт' : 'Export'}</span>
                                </button>
                                <div className={`border-t ${settings.theme === 'light' ? 'border-gray-100' : 'border-zinc-800/50'}`} />
                                <button
                                    onClick={() => {
                                        if (currentSessionId && confirm(settings.language === 'ru' ? 'Удалить этот чат?' : 'Delete this chat?')) {
                                            const newSessions = sessions.filter(s => s.id !== currentSessionId);
                                            setSessions(newSessions);
                                            if (newSessions.length > 0) {
                                                setCurrentSessionId(newSessions[0].id);
                                            } else {
                                                createSession();
                                            }
                                        }
                                        setShowChatMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors text-red-500 ${
                                        settings.theme === 'light' ? 'active:bg-red-50' : 'active:bg-red-500/10'
                                    }`}
                                >
                                    <Trash2 size={16} />
                                    <span className="text-[14px]">{settings.language === 'ru' ? 'Удалить' : 'Delete'}</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>

        {/* Drag & Drop overlay */}
        {isDragging && (
            <div 
                className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-blue-500 m-4 rounded-2xl pointer-events-none"
            >
                <div className="text-center">
                    <Upload size={48} className="mx-auto mb-4 text-blue-500" />
                    <p className="text-lg font-medium text-text">{settings.language === 'ru' ? 'Перетащите файлы сюда' : 'Drop files here'}</p>
                    <p className="text-sm text-text-secondary mt-2">{settings.language === 'ru' ? 'Изображения, видео, аудио, PDF, код' : 'Images, video, audio, PDF, code'}</p>
                </div>
            </div>
        )}

        <div 
            ref={chatContainerRef} 
            className="flex-1 overflow-y-auto scrollbar-hide pb-4 relative"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="max-w-3xl mx-auto px-4 pt-4">
                {currentSession && currentSession.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center opacity-0 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                        <h2 className="text-xl md:text-2xl font-semibold mb-6 text-text tracking-tight">
                            {settings.language === 'ru' ? `Привет, ${userProfile.name}` : `Hello, ${userProfile.name}`}
                        </h2>
                        
                        <div className="flex flex-col gap-2 w-full max-w-md">
                            {randomSuggestions.map((item, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleSendMessage(item.t, [], false, ChatMode.STANDARD, settings.responseLength || 'detailed')}
                                    className={`text-left group px-3.5 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                                        settings.theme === 'light'
                                            ? 'bg-white hover:bg-gray-50 border border-gray-200'
                                            : 'bg-[#0f0f0f] hover:bg-[#141414] border border-zinc-800/50'
                                    }`}
                                >
                                    <div className={`text-[14px] font-medium ${settings.theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{item.t}</div>
                                    <div className={`text-[12px] mt-0.5 ${settings.theme === 'light' ? 'text-gray-500' : 'text-zinc-500'}`}>{item.d}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {currentSession && currentSession.messages.map((msg, index) => {
                    return (
                        <div 
                            key={msg.id + index}
                            id={`msg-${msg.id}`}
                        >
                            <MessageBubble 
                                message={msg} 
                                userProfile={userProfile}
                                isStreaming={isStreaming && index === currentSession.messages.length - 1}
                                onRegenerate={() => handleRegenerate(index)}
                                onRate={(rating) => handleRateMessage(msg.id, rating)}
                                onOpenPreview={(code, language) => setPreviewPanel({ isOpen: true, code, language })}
                                onEdit={msg.role === Role.USER ? (newText) => handleEditMessage(msg.id, newText) : undefined}
                                onDelete={() => handleDeleteMessage(msg.id)}
                                isEditing={editingMessageId === msg.id}
                                onStartEdit={() => { setEditingMessageId(msg.id); setEditingText(msg.text); }}
                                onCancelEdit={() => { setEditingMessageId(null); setEditingText(''); }}
                                editingText={editingText}
                                onEditingTextChange={setEditingText}
                                onFollowUpClick={(question) => {
                                    if (isStreaming) return;
                                    setSessions(prev => prev.map(s => {
                                      if (s.id === currentSessionId) {
                                        return { ...s, messages: s.messages.map(m => ({ ...m, suggestedQuestions: undefined })) };
                                      }
                                      return s;
                                    }));
                                    handleSendMessage(question, [], settings.webSearchEnabled, settings.chatMode, settings.responseLength);
                                }}
                                lang={settings.language}
                                searchHighlight={showInChatSearch ? inChatSearchQuery : undefined}
                                isLight={settings.theme === 'light'}
                            />
                        </div>
                    );
                })}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {showScrollButton && (
                <button 
                    onClick={scrollToBottom}
                    className={`fixed bottom-28 left-1/2 -translate-x-1/2 p-2.5 rounded-full shadow-xl z-20 transition-all animate-fade-in ${
                        settings.theme === 'light' 
                            ? 'bg-white border border-gray-200 text-gray-700 active:bg-gray-100' 
                            : 'bg-[#111111] border border-zinc-800/50 text-zinc-400 active:bg-[#1a1a1a]'
                    }`}
                >
                    <ArrowDown size={18} />
                </button>
            )}
        </div>

        <div className="w-full bg-gradient-to-t from-background via-background to-transparent pt-1 z-20 px-2 md:px-0 transition-colors duration-300" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <InputArea 
                onSend={handleSendMessage} 
                onStop={handleStopGeneration}
                onStartLiveMode={() => setIsLiveModeOpen(true)}
                onInputFocus={scrollToBottom}
                isStreaming={isStreaming}
                language={settings.language}
                placeholderText={selectedProject ? `${settings.language === 'ru' ? 'Сообщение' : 'Message'} ${selectedProject.name}` : t.messagePlaceholder}
                isLight={settings.theme === 'light'}
                fileInputRef={fileInputRef}
                editingMessageId={editingMessageId}
                editingText={editingText}
                onEditingTextChange={setEditingText}
                onSaveEdit={() => { if (editingMessageId) handleEditMessage(editingMessageId, editingText); }}
                onCancelEdit={() => { setEditingMessageId(null); setEditingText(''); }}
            />
        </div>

      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => { setIsSettingsOpen(false); setSettingsInitialPage(undefined); }}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        settings={settings}
        onUpdateSettings={setSettings}
        onClearHistory={clearAllHistory}
        initialPage={settingsInitialPage}
      />
      
      <DownloadModal 
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownload={handleDownload}
        lang={settings.language}
        isLight={settings.theme === 'light'}
      />

      <LiveVoiceModal 
        isOpen={isLiveModeOpen}
        onClose={() => setIsLiveModeOpen(false)}
        systemInstruction={settings.customSystemInstruction || (settings.language === 'ru' ? 'Ты голосовой помощник NEO. Отвечай кратко и естественно.' : 'You are NEO voice assistant. Be brief and natural.')}
        userName={userProfile.name}
        userBio={userProfile.bio}
        adultMode={settings.adultMode}
        language={settings.language}
        modelLanguage={settings.modelLanguage}
        isLight={settings.theme === 'light'}
        responseLength={settings.responseLength}
        incognito={settings.incognito}
        onSaveMessage={settings.incognito ? undefined : (userText, aiText) => {
          if (!currentSessionId) return;
          const session = sessions.find(s => s.id === currentSessionId);
          if (!session) return;
          
          const userMsg = {
            id: `voice_user_${Date.now()}`,
            role: Role.USER,
            text: userText,
            timestamp: Date.now()
          };
          const aiMsg = {
            id: `voice_ai_${Date.now()}`,
            role: Role.MODEL,
            text: aiText,
            timestamp: Date.now() + 1
          };
          
          const updatedSession = {
            ...session,
            messages: [...session.messages, userMsg, aiMsg],
            updatedAt: Date.now()
          };
          setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
        }}
      />

      <CodePreviewPanel
        isOpen={previewPanel.isOpen}
        onClose={() => setPreviewPanel(prev => ({ ...prev, isOpen: false }))}
        code={previewPanel.code}
        language={previewPanel.language}
        isLight={settings.theme === 'light'}
        lang={settings.language}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
        isLight={settings.theme === 'light'}
      />

      {/* Offline Indicator */}
      <OfflineIndicator 
        isLight={settings.theme === 'light'} 
        lang={settings.language} 
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        isLight={settings.theme === 'light'}
        lang={settings.language}
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
        existingProjects={projects.map(p => ({ id: p.id, name: p.name }))}
        onSelectExisting={(projectId) => {
          setSelectedProjectId(projectId);
          setExpandedProjects(prev => new Set(prev).add(projectId));
          const projectChats = sessions.filter(s => s.projectId === projectId);
          if (projectChats.length > 0) {
            setCurrentSessionId(projectChats[0].id);
          }
        }}
        isRu={settings.language === 'ru'}
        isLight={settings.theme === 'light'}
      />

      {/* Tags Modal */}
      {showTagsModal && editingTagsChatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowTagsModal(false); setEditingTagsChatId(null); }} />
          <div className={`relative w-full max-w-sm rounded-2xl p-4 border ${settings.theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#0a0a0a] border-zinc-800/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${settings.theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {settings.language === 'ru' ? 'Теги' : 'Tags'}
              </h3>
              <button
                onClick={() => { setShowTagsModal(false); setEditingTagsChatId(null); }}
                className={`p-2 rounded-lg ${settings.theme === 'light' ? 'text-gray-500 hover:bg-gray-100' : 'text-zinc-400 hover:bg-zinc-800'}`}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Add new tag - max 5 */}
            {availableTags.length < 5 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.target as HTMLFormElement).elements.namedItem('newTag') as HTMLInputElement;
                  if (input.value.trim() && availableTags.length < 5 && editingTagsChatId) {
                    const newTag = input.value.trim().toLowerCase();
                    addNewTag(newTag);
                    toggleChatTag(editingTagsChatId, newTag);
                    input.value = '';
                  }
                }}
                className="mb-4"
              >
                <div className="flex gap-2">
                  <input
                    name="newTag"
                    type="text"
                    placeholder={settings.language === 'ru' ? 'Новый тег...' : 'New tag...'}
                    className={`flex-1 px-3 py-2 rounded-xl text-[14px] outline-none border ${
                      settings.theme === 'light' 
                        ? 'bg-gray-100 text-gray-900 placeholder-gray-400 border-gray-200' 
                        : 'bg-[#141414] text-white placeholder-zinc-500 border-zinc-800/50'
                    }`}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-[14px] font-medium ${
                      settings.theme === 'light' 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-white text-black'
                    }`}
                  >
                    {settings.language === 'ru' ? 'Добавить' : 'Add'}
                  </button>
                </div>
              </form>
            ) : (
              <p className={`text-[12px] text-center py-2 mb-3 ${settings.theme === 'light' ? 'text-gray-400' : 'text-zinc-500'}`}>
                {settings.language === 'ru' ? 'Максимум 5 тегов' : 'Maximum 5 tags'}
              </p>
            )}
            
            {/* Existing tags */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableTags.length === 0 ? (
                <p className={`text-[13px] text-center py-4 ${settings.theme === 'light' ? 'text-gray-400' : 'text-zinc-500'}`}>
                  {settings.language === 'ru' ? 'Нет тегов' : 'No tags yet'}
                </p>
              ) : (
                availableTags.map(tag => {
                  const chat = sessions.find(s => s.id === editingTagsChatId);
                  const isSelected = (chat?.tags || []).includes(tag);
                  return (
                    <div
                      key={tag}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors border ${
                        isSelected
                          ? (settings.theme === 'light' ? 'bg-gray-900 text-white border-gray-900' : 'bg-zinc-700 text-white border-zinc-600')
                          : (settings.theme === 'light' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' : 'bg-[#141414] text-zinc-300 hover:bg-[#1a1a1a] border-zinc-800')
                      }`}
                      onClick={() => editingTagsChatId && toggleChatTag(editingTagsChatId, tag)}
                    >
                      <span className="text-[14px]">#{tag}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(settings.language === 'ru' ? 'Удалить тег?' : 'Delete tag?')) {
                            deleteTag(tag);
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-600' : 'text-zinc-500 hover:text-red-500 hover:bg-zinc-800'}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;