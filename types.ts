
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export enum Persona {
  ASSISTANT = 'Assistant',
  TEACHER = 'Teacher',
  DEVELOPER = 'Developer',
  CREATOR = 'Creator',
  ANALYST = 'Analyst',
  CUSTOM = 'Custom',
}

export enum ChatMode {
  STANDARD = 'standard',
  RESEARCH = 'research', // Deep Research
  LABS = 'labs',         // Project/Artifact Creation
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64
  previewUrl?: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  attachments?: Attachment[];
  isThinking?: boolean;
  isSearching?: boolean; // Show "Searching..." indicator
  groundingUrls?: Array<{ title: string; uri: string }>;
  suggestedQuestions?: string[]; // Follow-up questions like Perplexity
  rating?: 'like' | 'dislike'; // User feedback
  mode?: ChatMode; // Track which mode generated this
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  persona: Persona;
  lastMode?: ChatMode;
  isShared?: boolean; // Indicates this chat was imported from a share link
  projectId?: string; // Link to project
}

export interface Project {
  id: string;
  name: string;
  icon: string; // Icon name from lucide
  color: string; // Hex color
  createdAt: number;
  chatIds: string[]; // Associated chat IDs
}

export interface UserProfile {
  name: string;
  avatar?: string; // Base64
  bio?: string; // User bio for context
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  isValid: boolean;
  tokensUsed?: number;
  lastChecked?: number;
  isActive: boolean;
}

export type InterfaceLanguage = 'en' | 'ru' | 'es' | 'de' | 'fr';

export interface KnowledgeItem {
  id: string;
  type: 'text' | 'url' | 'file';
  content: string;
  name: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  language: InterfaceLanguage;
  modelLanguage: string;
  customSystemInstruction?: string;
  selectedPersona?: string; // ID of selected preset persona
  voiceURI?: string;
  responseLength: 'brief' | 'balanced' | 'detailed';
  creativity: 'precise' | 'balanced' | 'creative';
  temperature: number;
  maxTokens: number;
  incognito: boolean;
  historyRetention: 'forever' | '30days' | '7days';
  webSearchEnabled: boolean;
  chatMode: ChatMode;
  adultMode: boolean; // 18+ mode
  knowledgeBase: KnowledgeItem[]; // Separate knowledge base
  soundEnabled: boolean; // Sound notifications
}

// Simple Translation Dictionary
export const TRANSLATIONS: Record<InterfaceLanguage, Record<string, string>> = {
    en: {
        newChat: "New Chat",
        settings: "Settings",
        profile: "Profile",
        appearance: "Appearance",
        intelligence: "Intelligence",
        language: "Language",
        interfaceLang: "Interface Language",
        responseLang: "AI Response Language",
        theme: "Theme",
        dark: "Dark",
        light: "Light",
        save: "Save Changes",
        messagePlaceholder: "Message NEO...",
        download: "Download Chat",
        exportFormat: "Select Export Format",
        cancel: "Cancel",
        history: "History",
        voice: "Voice",
        customPersona: "Custom Persona",
        auto: "Auto-detect",
        onlyRu: "Russian (Strict)",
        onlyEn: "English (Strict)",
        modeStandard: "Standard",
        modeResearch: "Deep Research",
        modeLabs: "Labs",
        researchDesc: "In-depth analysis, sources, & reports",
        labsDesc: "Create docs, slides, & projects",
        sources: "Sources",
        brief: "Brief",
        balanced: "Balanced",
        detailed: "Detailed",
        dictation: "Dictation",
        liveMode: "Live Voice Mode",
        privacy: "Privacy & Data",
        advanced: "Advanced",
        creativity: "Creativity Level",
        precise: "Precise",
        balanced: "Balanced",
        creative: "Creative",
        incognito: "Incognito Mode",
        incognitoDesc: "Chats will not be saved to history",
        clearHistory: "Clear All History",
        clearHistoryConfirm: "Are you sure? This cannot be undone.",
        retention: "Auto-delete History",
        forever: "Keep Forever",
        days30: "30 Days",
        days7: "7 Days",
        about: "About NEO",
        downloadBtn: "Download File",
        temperature: "Temperature",
        temperatureDesc: "Higher = more creative, lower = more focused",
        maxTokens: "Max Response Length",
        maxTokensDesc: "Maximum tokens in AI response",
        modelSettings: "Model Settings",
        bio: "Bio",
        bioPlaceholder: "Tell NEO about yourself...",
        attachFiles: "Attach Files",
        captureScreen: "Capture Screen",
        webSearch: "Web Search"
    },
    ru: {
        newChat: "Новый чат",
        settings: "Настройки",
        profile: "Профиль",
        appearance: "Внешний вид",
        intelligence: "Интеллект",
        language: "Язык",
        interfaceLang: "Язык интерфейса",
        responseLang: "Язык ответов AI",
        theme: "Тема",
        dark: "Темная",
        light: "Светлая",
        save: "Сохранить",
        messagePlaceholder: "Сообщение NEO...",
        download: "Скачать чат",
        exportFormat: "Формат экспорта",
        cancel: "Отмена",
        history: "История",
        voice: "Голос",
        customPersona: "Кастомная роль",
        auto: "Автоопределение",
        onlyRu: "Русский (Строго)",
        onlyEn: "Английский (Строго)",
        modeStandard: "Стандарт",
        modeResearch: "Исследование",
        modeLabs: "Лаборатория",
        researchDesc: "Глубокий анализ, источники и отчеты",
        labsDesc: "Документы, слайды и проекты",
        sources: "Источники",
        brief: "Краткий",
        balanced: "Сбалансированный",
        detailed: "Подробный",
        dictation: "Диктовка",
        liveMode: "Живое общение",
        privacy: "Приватность",
        advanced: "Дополнительно",
        creativity: "Креативность",
        precise: "Точный",
        balanced: "Сбалансированный",
        creative: "Креативный",
        incognito: "Инкогнито",
        incognitoDesc: "Чаты не будут сохраняться в истории",
        clearHistory: "Очистить всю историю",
        clearHistoryConfirm: "Вы уверены? Это действие необратимо.",
        retention: "Автоудаление истории",
        forever: "Хранить вечно",
        days30: "30 Дней",
        days7: "7 Дней",
        about: "О NEO",
        downloadBtn: "Скачать файл",
        temperature: "Температура",
        temperatureDesc: "Выше = креативнее, ниже = точнее",
        maxTokens: "Макс. длина ответа",
        maxTokensDesc: "Максимум токенов в ответе AI",
        modelSettings: "Настройки модели",
        bio: "О себе",
        bioPlaceholder: "Расскажите NEO о себе...",
        attachFiles: "Прикрепить файлы",
        captureScreen: "Снимок экрана",
        webSearch: "Поиск в интернете"
    },
    es: {
        newChat: "Nuevo Chat",
        settings: "Ajustes",
        profile: "Perfil",
        appearance: "Apariencia",
        intelligence: "Inteligencia",
        language: "Idioma",
        interfaceLang: "Idioma de interfaz",
        responseLang: "Idioma de respuesta IA",
        theme: "Tema",
        dark: "Oscuro",
        light: "Claro",
        save: "Guardar",
        messagePlaceholder: "Mensaje a NEO...",
        download: "Descargar Chat",
        exportFormat: "Formato de exportación",
        cancel: "Cancelar",
        history: "Historial",
        voice: "Voz",
        customPersona: "Persona Personalizada",
        auto: "Auto-detectar",
        onlyRu: "Ruso (Estricto)",
        onlyEn: "Inglés (Estricto)",
        modeStandard: "Estándar",
        modeResearch: "Investigación",
        modeLabs: "Laboratorio",
        researchDesc: "Análisis profundo y reportes",
        labsDesc: "Crear documentos y diapositivas",
        sources: "Fuentes",
        brief: "Breve",
        balanced: "Equilibrado",
        detailed: "Detallado",
        dictation: "Dictado",
        liveMode: "Modo Voz en Vivo",
        privacy: "Privacidad",
        advanced: "Avanzado",
        creativity: "Creatividad",
        precise: "Preciso",
        balanced: "Equilibrado",
        creative: "Creativo",
        incognito: "Modo Incógnito",
        incognitoDesc: "No se guardará el historial",
        clearHistory: "Borrar historial",
        clearHistoryConfirm: "¿Estás seguro?",
        retention: "Auto-eliminar",
        forever: "Para siempre",
        days30: "30 Días",
        days7: "7 Días",
        about: "Sobre NEO",
        downloadBtn: "Descargar archivo",
        temperature: "Temperatura",
        temperatureDesc: "Mayor = más creativo",
        maxTokens: "Longitud máxima",
        maxTokensDesc: "Tokens máximos en respuesta",
        modelSettings: "Configuración del modelo",
        bio: "Biografía",
        bioPlaceholder: "Cuéntale a NEO sobre ti..."
    },
    de: {
        newChat: "Neuer Chat",
        settings: "Einstellungen",
        profile: "Profil",
        appearance: "Aussehen",
        intelligence: "Intelligenz",
        language: "Sprache",
        interfaceLang: "Oberflächensprache",
        responseLang: "KI-Antwortsprache",
        theme: "Thema",
        dark: "Dunkel",
        light: "Hell",
        save: "Speichern",
        messagePlaceholder: "Nachricht an NEO...",
        download: "Chat herunterladen",
        exportFormat: "Exportformat",
        cancel: "Abbrechen",
        history: "Verlauf",
        voice: "Stimme",
        customPersona: "Benutzerdefinierte Rolle",
        auto: "Automatisch",
        onlyRu: "Russisch (Strikt)",
        onlyEn: "Englisch (Strikt)",
        modeStandard: "Standard",
        modeResearch: "Tiefenforschung",
        modeLabs: "Labor",
        researchDesc: "Detaillierte Analyse & Berichte",
        labsDesc: "Dokumente, Folien & Projekte",
        sources: "Quellen",
        brief: "Kurz",
        balanced: "Ausgewogen",
        detailed: "Detailliert",
        dictation: "Diktat",
        liveMode: "Live-Sprachmodus",
        privacy: "Datenschutz",
        advanced: "Erweitert",
        creativity: "Kreativität",
        precise: "Präzise",
        balanced: "Ausgewogen",
        creative: "Kreativ",
        incognito: "Inkognito-Modus",
        incognitoDesc: "Chats werden nicht gespeichert",
        clearHistory: "Verlauf löschen",
        clearHistoryConfirm: "Sind Sie sicher?",
        retention: "Auto-Löschen",
        forever: "Für immer",
        days30: "30 Tage",
        days7: "7 Tage",
        about: "Über NEO",
        downloadBtn: "Datei herunterladen",
        temperature: "Temperatur",
        temperatureDesc: "Höher = kreativer",
        maxTokens: "Max. Antwortlänge",
        maxTokensDesc: "Maximale Tokens in der Antwort",
        modelSettings: "Modelleinstellungen",
        bio: "Biografie",
        bioPlaceholder: "Erzählen Sie NEO von sich..."
    },
    fr: {
        newChat: "Nouveau Chat",
        settings: "Paramètres",
        profile: "Profil",
        appearance: "Apparence",
        intelligence: "Intelligence",
        language: "Langue",
        interfaceLang: "Langue de l'interface",
        responseLang: "Langue de réponse IA",
        theme: "Thème",
        dark: "Sombre",
        light: "Clair",
        save: "Sauvegarder",
        messagePlaceholder: "Message à NEO...",
        download: "Télécharger le chat",
        exportFormat: "Format d'exportation",
        cancel: "Annuler",
        history: "Historique",
        voice: "Voix",
        customPersona: "Persona Personnalisée",
        auto: "Détection auto",
        onlyRu: "Russe (Strict)",
        onlyEn: "Anglais (Strict)",
        modeStandard: "Standard",
        modeResearch: "Recherche",
        modeLabs: "Laboratoire",
        researchDesc: "Analyse approfondie et rapports",
        labsDesc: "Créer des documents et des diapositives",
        sources: "Sources",
        brief: "Bref",
        balanced: "Équilibré",
        detailed: "Détaillé",
        dictation: "Dictée",
        liveMode: "Mode Voix en Direct",
        privacy: "Confidentialité",
        advanced: "Avancé",
        creativity: "Créativité",
        precise: "Précis",
        balanced: "Équilibré",
        creative: "Créatif",
        incognito: "Mode Incognito",
        incognitoDesc: "L'historique ne sera pas enregistré",
        clearHistory: "Effacer l'historique",
        clearHistoryConfirm: "Êtes-vous sûr ?",
        retention: "Auto-suppression",
        forever: "Toujours",
        days30: "30 Jours",
        days7: "7 Jours",
        about: "À propos de NEO",
        downloadBtn: "Télécharger le fichier",
        temperature: "Température",
        temperatureDesc: "Plus élevé = plus créatif",
        maxTokens: "Longueur max. réponse",
        maxTokensDesc: "Tokens max. dans la réponse",
        modelSettings: "Paramètres du modèle",
        bio: "Biographie",
        bioPlaceholder: "Parlez de vous à NEO..."
    }
};