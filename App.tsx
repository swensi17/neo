
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, ChatSession, Role, UserProfile, AppSettings, Persona, TRANSLATIONS, InterfaceLanguage, ChatMode, Project } from './types';
import { streamChatResponse, generateChatTitle, stopStreaming, hasValidApiKey, compressImage } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { SettingsModal } from './components/SettingsModal';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { DownloadModal } from './components/DownloadModal';
import { CodePreviewPanel, extractCodeForPreview } from './components/CodePreviewPanel';
import { Toast, ToastType } from './components/Toast';
import { NewProjectModal } from './components/NewProjectModal';
import { haptic } from './utils/haptic';
import { Briefcase, DollarSign, Smartphone, GraduationCap, Pencil, Leaf, Code, Image, Music, ShoppingBag, Scissors, Palette, Dumbbell, Snowflake, Printer, Scale, Lightbulb, Plane, Globe, Wrench, Users, FlaskConical, Heart, ShoppingCart } from 'lucide-react';

// Icon mapping for projects
const PROJECT_ICON_MAP: Record<string, React.FC<any>> = {
  Briefcase, DollarSign, Smartphone, GraduationCap, Pencil, Leaf, Code, Image, Music, ShoppingBag, Scissors, Palette, Dumbbell, Snowflake, Printer, Scale, Lightbulb, Plane, Globe, Wrench, Users, FlaskConical, Heart, ShoppingCart
};

const getProjectIcon = (iconName: string) => PROJECT_ICON_MAP[iconName] || Briefcase;
import { 
  Menu, Plus, MessageSquare, Settings as SettingsIcon, 
  Trash2, Download, PanelLeft, Sparkles, ChevronLeft, ArrowDown,
  Search, Upload, X, PenSquare, Share2, FolderPlus, Tag
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
  lang: string;
}

const ChatItem: React.FC<ChatItemProps> = ({ session, isSelected, isLight, onSelect, onDelete, lang }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div 
      onClick={onSelect}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
        ${isSelected 
          ? (isLight ? 'bg-gray-200 text-gray-900' : 'bg-[#252525] text-white') 
          : (isLight ? 'text-gray-600 active:text-gray-900' : 'text-zinc-400 active:text-white')
        }
      `}
    >
      <div className="flex-1 truncate text-[13px]">
        {session.title || 'Untitled'}
      </div>
      <button 
        onClick={handleDeleteClick}
        className={`p-1 rounded transition-all md:opacity-0 md:group-hover:opacity-100 ${
          confirmDelete 
            ? 'text-red-500 opacity-100' 
            : (isLight ? 'text-gray-400 hover:text-red-500' : 'text-zinc-500 hover:text-red-400')
        }`}
        title={confirmDelete ? (lang === 'ru' ? 'Нажмите ещё раз' : 'Click again') : (lang === 'ru' ? 'Удалить' : 'Delete')}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};

// Project Chat Item with double-confirm delete
interface ProjectChatItemProps {
  chat: ChatSession;
  isSelected: boolean;
  isLight: boolean;
  onSelect: () => void;
  onDelete: () => void;
  lang: string;
}

const ProjectChatItem: React.FC<ProjectChatItemProps> = ({ chat, isSelected, isLight, onSelect, onDelete, lang }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
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

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? (isLight ? 'bg-gray-200 text-gray-900' : 'bg-[#252525] text-white')
          : (isLight ? 'text-gray-600 active:text-gray-900' : 'text-zinc-400 active:text-white')
      }`}
    >
      <span className="flex-1 text-[13px] truncate">{chat.title || (lang === 'ru' ? 'Новый чат' : 'New chat')}</span>
      <button 
        onClick={handleDeleteClick}
        className={`p-1 rounded transition-all md:opacity-0 md:group-hover:opacity-100 ${
          confirmDelete 
            ? 'text-red-500 opacity-100' 
            : (isLight ? 'text-gray-400 hover:text-red-500' : 'text-zinc-500 hover:text-red-400')
        }`}
        title={confirmDelete ? (lang === 'ru' ? 'Нажмите ещё раз' : 'Click again') : (lang === 'ru' ? 'Удалить' : 'Delete')}
      >
        <Trash2 size={12} />
      </button>
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

  // Track if initial load is complete to prevent overwriting saved data
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!settings.incognito && isInitialized) {
        localStorage.setItem('neo_sessions', JSON.stringify(sessions));
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

  // Track previous message count to scroll only on new messages
  const prevMessageCountRef = useRef(0);
  
  useEffect(() => {
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const messageCount = currentSession?.messages.length || 0;
    
    // Scroll only when streaming or when new message added
    if (isStreaming || messageCount > prevMessageCountRef.current) {
        scrollToBottom();
    }
    prevMessageCountRef.current = messageCount;
  }, [currentSessionId, sessions, isStreaming]);

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createSession = () => {
    haptic.medium();
    
    // Check if current session is empty (no messages) and belongs to same project - reuse it
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && currentSession.messages.length === 0 && currentSession.projectId === selectedProjectId) {
      setIsMobileMenuOpen(false);
      return;
    }
    
    // Check if there's already an empty session in current project/no project
    const emptySession = sessions.find(s => s.messages.length === 0 && s.projectId === selectedProjectId);
    if (emptySession) {
      setCurrentSessionId(emptySession.id);
      setIsMobileMenuOpen(false);
      return;
    }
    
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: selectedProjectId ? '' : t.newChat,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      persona: DEFAULT_PERSONA,
      projectId: selectedProjectId || undefined
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsMobileMenuOpen(false);
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
    // Filter by search
    if (searchQuery.trim()) {
      return s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
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
      
      // Try native share API first (works on mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: session.title,
            text: settings.language === 'ru' ? 'Посмотри мой чат с NEO' : 'Check out my NEO chat',
            url: shareUrl
          });
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      }
      
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      showToast(settings.language === 'ru' 
        ? 'Ссылка скопирована! Отправьте её другу' 
        : 'Link copied! Send it to a friend', 'success');
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
    // Check by MIME type
    if (SUPPORTED_MIME_TYPES.some(t => mimeType === t || mimeType.startsWith(t.split('/')[0] + '/'))) {
      // Exclude Office documents
      if (mimeType.includes('officedocument') || mimeType.includes('msword') || 
          mimeType.includes('excel') || mimeType.includes('powerpoint') ||
          mimeType.includes('opendocument')) {
        return false;
      }
      return true;
    }
    // Check by extension for text files
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && TEXT_EXTENSIONS.includes(ext)) return true;
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
      // Ctrl+/ or Cmd+/ - toggle search
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      // Escape - close modals/search
      if (e.key === 'Escape') {
        if (showSearch) setShowSearch(false);
        if (editingMessageId) {
          setEditingMessageId(null);
          setEditingText('');
        }
        if (previewPanel.isOpen) setPreviewPanel(prev => ({ ...prev, isOpen: false }));
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
    
    let aiMsgId = existingMessageId;
    if (!aiMsgId) {
        aiMsgId = (Date.now() + 1).toString();
        const aiPlaceholder: Message = {
          id: aiMsgId,
          role: Role.MODEL,
          text: '',
          timestamp: Date.now(),
          isThinking: true,
          mode: mode 
        };
        const updatedSession = { ...currentSession, messages: [...messagesForContext, aiPlaceholder], lastMode: mode };
        setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
    } else {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                 const newMessages = s.messages.map(m => m.id === aiMsgId ? { ...m, text: '', isThinking: true } : m);
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

      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id === sessionId) {
              const newMessages = s.messages.map(m => m.id === aiMsgId ? { ...m, isThinking: false } : m);
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
      
      // Play notification sound when response is complete
      if (settings.soundEnabled) {
        playNotificationSound();
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
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${settings.theme === 'light' ? 'text-gray-400' : 'text-zinc-600'}`} strokeWidth={2} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={settings.language === 'ru' ? 'Поиск' : 'Search'}
                    className={`w-full rounded-full pl-9 pr-3 py-2 text-[14px] text-text focus:outline-none transition-colors ${
                        settings.theme === 'light' 
                            ? 'bg-gray-100 placeholder-gray-400 focus:bg-gray-200' 
                            : 'bg-black border border-zinc-800/50 placeholder-zinc-600 focus:border-zinc-700'
                    }`}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${settings.theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-zinc-400 hover:text-white'}`}>
                        <X size={14} />
                    </button>
                )}
            </div>
            <button 
                onClick={createSession}
                className={`p-2 rounded-full transition-colors ${
                    settings.theme === 'light' 
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-200 active:text-gray-700' 
                        : 'bg-black border border-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:text-white active:text-white'
                }`}
                title={t.newChat}
            >
                <PenSquare size={16} strokeWidth={1.5} />
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
                                    // Auto-expand and select first chat
                                    setExpandedProjects(prev => new Set(prev).add(project.id));
                                    if (projectChats.length > 0) {
                                        setCurrentSessionId(projectChats[0].id);
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
                            <ProjectDeleteButton 
                                projectId={project.id}
                                isLight={settings.theme === 'light'}
                                onDelete={() => {
                                    setProjects(prev => prev.filter(p => p.id !== project.id));
                                    setSessions(prev => prev.filter(s => s.projectId !== project.id));
                                    if (selectedProjectId === project.id) {
                                        setSelectedProjectId(null);
                                        const firstChat = sessions.find(s => !s.projectId);
                                        if (firstChat) setCurrentSessionId(firstChat.id);
                                    }
                                }}
                                lang={settings.language}
                            />
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
                                            onDelete={() => {
                                                const newSessions = sessions.filter(s => s.id !== chat.id);
                                                setSessions(newSessions);
                                                
                                                // Always exit project and go to main
                                                setSelectedProjectId(null);
                                                const firstNonProjectChat = newSessions.find(s => !s.projectId);
                                                if (firstNonProjectChat) {
                                                    setCurrentSessionId(firstNonProjectChat.id);
                                                } else {
                                                    // Create new chat
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

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 pt-1 space-y-0.5 scrollbar-hide">
            {filteredSessions.map(session => (
                <ChatItem 
                    key={session.id}
                    session={session}
                    isSelected={currentSessionId === session.id && !selectedProjectId}
                    isLight={settings.theme === 'light'}
                    onSelect={() => {
                        haptic.light();
                        setSelectedProjectId(null);
                        setCurrentSessionId(session.id);
                        setIsMobileMenuOpen(false);
                    }}
                    onDelete={() => {
                        const newSessions = sessions.filter(s => s.id !== session.id);
                        setSessions(newSessions);
                        
                        // Find first non-project chat or create new
                        const firstNonProjectChat = newSessions.find(s => !s.projectId);
                        if (firstNonProjectChat) {
                            setCurrentSessionId(firstNonProjectChat.id);
                        } else {
                            // Create new chat
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
                    }}
                    lang={settings.language}
                />
            ))}
        </div>

        {/* Bottom - User profile + Settings */}
        <div className={`p-3 border-t ${settings.theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
            <div className="flex items-center gap-2">
                <div 
                    className="flex-1 flex items-center gap-3 cursor-pointer hover:bg-surface-hover p-2 rounded-xl transition-colors"
                    onClick={() => { haptic.light(); setIsSettingsOpen(true); }}
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
            className={`flex items-center justify-between px-3 z-30 bg-background relative shrink-0 ${
                settings.theme === 'light' ? 'border-b border-gray-200' : 'border-b border-zinc-800'
            }`} 
            style={{ 
                paddingTop: 'max(12px, env(safe-area-inset-top))', 
                minHeight: 'calc(52px + env(safe-area-inset-top, 0px))',
                paddingBottom: '8px'
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
                                    className="w-7 h-7 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: selectedProject.color === '#ffffff' ? '#1a1a1a' : selectedProject.color + '20' }}
                                >
                                    <IconComponent size={16} style={{ color: selectedProject.color === '#ffffff' ? '#a1a1aa' : selectedProject.color }} />
                                </div>
                            );
                        })()}
                        <span className={`font-medium text-sm truncate max-w-[180px] md:max-w-xs ${
                            settings.theme === 'light' ? 'text-gray-900' : 'text-white'
                        }`}>
                            {selectedProject.name}
                        </span>
                    </div>
                ) : (
                    <span className={`font-medium text-sm truncate max-w-[180px] md:max-w-xs ${
                        settings.theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                        {currentSession?.title || 'NEO'}
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-1">
                <button 
                    onClick={shareChat} 
                    className={`p-2.5 rounded-lg transition-colors ${
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
                    className={`p-2.5 rounded-lg transition-colors ${
                        settings.theme === 'light' 
                            ? 'text-gray-500 active:text-gray-700' 
                            : 'text-zinc-400 active:text-white'
                    }`} 
                    title="Export"
                >
                    <Download size={20} />
                </button>
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
            <div className="max-w-3xl mx-auto px-4">
                {currentSession && currentSession.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center opacity-0 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                        <h2 className="text-xl md:text-2xl font-semibold mb-2 text-text tracking-tight">
                            {settings.language === 'ru' ? `Привет, ${userProfile.name}` : `Hello, ${userProfile.name}`}
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-8">
                            {(settings.language === 'ru' ? [
                                { t: 'Объясни квантовые вычисления', d: 'Простыми словами' }, 
                                { t: 'Напиши Python скрипт', d: 'Для автоматизации задач' }, 
                            ] : [
                                { t: 'Explain Quantum Computing', d: 'In simple terms' }, 
                                { t: 'Write a Python Script', d: 'To automate daily tasks' }, 
                            ]).map((item, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleSendMessage(item.t, [], false, ChatMode.STANDARD, settings.responseLength || 'detailed')}
                                    className="text-left group bg-surface border border-white/5 p-3 rounded-xl hover:bg-surface-hover hover:border-white/10 transition-all shadow-sm"
                                >
                                    <div className="text-sm font-medium text-text group-hover:text-text transition-colors">{item.t}</div>
                                    <div className="text-[10px] text-text-secondary mt-0.5">{item.d}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {currentSession && currentSession.messages.map((msg, index) => (
                    <MessageBubble 
                        key={msg.id + index} 
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
                        lang={settings.language}
                        isLight={settings.theme === 'light'}
                    />
                ))}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {showScrollButton && (
                <button 
                    onClick={scrollToBottom}
                    className={`fixed bottom-28 left-1/2 -translate-x-1/2 p-3 rounded-full shadow-xl z-20 transition-all animate-fade-in ${
                        settings.theme === 'light' 
                            ? 'bg-white border border-gray-200 text-gray-700 active:bg-gray-100' 
                            : 'bg-[#1a1a1a] border border-zinc-800 text-white active:bg-[#252525]'
                    }`}
                >
                    <ArrowDown size={20} />
                </button>
            )}
        </div>

        <div className="w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-2 z-20 px-2 md:px-0 transition-colors duration-300" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
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
        systemInstruction={settings.customSystemInstruction || `Ты голосовой помощник NEO. Отвечай кратко и естественно.`}
        userName={userProfile.name}
        userBio={userProfile.bio}
        adultMode={settings.adultMode}
        language={settings.language}
        modelLanguage={settings.modelLanguage}
        isLight={settings.theme === 'light'}
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
    </div>
  );
};

export default App;