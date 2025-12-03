[
<p align="center">
  <strong>🚀 AI-ассистент нового поколения на базе Google Gemini 2.5</strong>
</p>

<p align="center">
  <em>Голосовое общение в реальном времени • Live Preview кода • Мультимодальный ввод • PWA</em>
</p>

<p align="center">
  <a href="https://swensi17.github.io/neo/">
    <img src="https://img.shields.io/badge/🚀_DEMO-Попробовать_сейчас-00C853?style=for-the-badge" alt="Live Demo"/>
  </a>
</p>

---

## 🛠 Технологии

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Gemini_2.5-Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"/>
  <img src="https://img.shields.io/badge/Live_Voice-API-FF6B6B?style=for-the-badge&logo=google&logoColor=white" alt="Live Voice"/>
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA"/>
</p>

---

## 📸 Превью

<p align="center">
  <img src="https://i.postimg.cc/k4xGwdF3/Snimok-ekrana-2025-12-02-104120.png" alt="NEO Chat Preview" width="800"/>
</p>

---

## 🎯 О проекте

**NEO Chat** — полноценный AI-ассистент с современным интерфейсом:

| Функция | Описание |
|---------|----------|
| 🎙️ **Live Voice** | Голосовое общение в реальном времени через Gemini 2.0 Flash Live API |
| 👁️ **Мультимодальный ввод** | Изображения, документы, аудио, видео |
| 💻 **Live Preview** | Мгновенный просмотр HTML/CSS/JS кода |
| 🔍 **Веб-поиск** | AI ищет актуальную информацию в интернете |
| 📱 **PWA** | Установка как приложение на любое устройство |
| 🎨 **True Black** | Минималистичный дизайн в стиле iOS Dark Mode |

---

## ✨ Ключевые возможности

### 🎙️ Live Voice Mode

| Функция | Описание |
|---------|----------|
| **Мгновенный отклик** | AI слышит и отвечает без задержек |
| **Прерывание** | Начните говорить — AI остановится |
| **Демонстрация экрана** | Покажите AI свой экран |
| **Анимированный орб** | Визуализация реагирует на голос |

### 💻 Live Code Preview

| Функция | Описание |
|---------|----------|
| **Мгновенный рендеринг** | HTML/CSS/JS в реальном времени |
| **Изолированная песочница** | Безопасное выполнение в iframe |
| **Экспорт** | Скачайте файл или откройте в новой вкладке |
| **Fullscreen** | Разверните на весь экран |

### 🧠 Три режима AI

| Режим | Описание |
|-------|----------|
| ⚡ **Стандарт** | Быстрые ответы на повседневные вопросы |
| 📚 **Исследование** | Глубокий анализ с источниками |
| 🧪 **Лаборатория** | Создание кода с Live Preview |

### 📎 Поддерживаемые форматы

| Категория | Форматы |
|-----------|---------|
| **Изображения** | JPEG, PNG, GIF, WebP, HEIC, BMP, TIFF |
| **Аудио** | WAV, MP3, AAC, OGG, FLAC, WebM |
| **Видео** | MP4, MOV, AVI, WebM, WMV, 3GPP |
| **Документы** | PDF, TXT, HTML, CSS, JS, Python, Markdown |

---

## 🚀 Быстрый старт

### Требования

- **Node.js** 18+
- **API ключ** Google Gemini ([получить бесплатно](https://aistudio.google.com/apikey))

### Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/swensi17/neo.git
cd neo

# Установите зависимости
npm install

# Создайте файл с API ключом
echo "VITE_GEMINI_API_KEY=ваш_ключ" > .env.local

# Запустите проект
npm run dev
```

### Альтернативный запуск

```bash
python run.py
```

---

## 🔑 API ключ

1. Перейдите на [Google AI Studio](https://aistudio.google.com/apikey)
2. Войдите в аккаунт Google
3. Нажмите **"Create API Key"**
4. Скопируйте ключ в `.env.local` или в настройки приложения

---

## 📦 Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер (localhost:3000) |
| `npm run build` | Сборка для продакшена |
| `npm run preview` | Превью сборки |
| `python deploy.py` | Деплой на GitHub Pages |

---

## 📁 Структура проекта

```
neo/
├── components/           # React компоненты
│   ├── CodePreviewPanel.tsx
│   ├── InputArea.tsx
│   ├── LiveVoiceModal.tsx
│   ├── MessageBubble.tsx
│   ├── SettingsModal.tsx
│   └── ...
├── services/
│   └── geminiService.ts  # Gemini API
├── utils/
│   └── haptic.ts
├── public/
│   ├── logo.svg          # Логотип
│   ├── logo-dark.svg     # Логотип для темного фона
│   ├── logo-icon.svg     # Иконка логотипа
│   ├── favicon.svg
│   └── manifest.json
├── App.tsx
├── index.tsx
├── types.ts
└── styles.css
```

---

## 🎨 Персонализация

### Профиль пользователя
- **Имя** — AI обращается по имени
- **Аватар** — загрузите фото
- **Bio** — для релевантных ответов

### Настройки AI
| Параметр | Описание |
|----------|----------|
| **Температура** | 0.2 (точный) → 1.0 (креативный) |
| **Длина ответа** | Краткий / Сбалансированный / Подробный |
| **Язык** | 30+ языков |

### Персоны AI
🤖 Ассистент • 👨‍🏫 Учитель • 👨‍💻 Разработчик • 🎨 Креатор • 📊 Аналитик • ✏️ Кастомная

---

## 🔒 Приватность

| Функция | Описание |
|---------|----------|
| **Локальное хранение** | Данные только на вашем устройстве |
| **Режим инкогнито** | Чаты не сохраняются |
| **Автоудаление** | 7/30 дней |
| **Экспорт/Импорт** | JSON бэкапы |

---

## 🚀 Деплой

### GitHub Pages

```bash
python deploy.py
```

### Другие платформы

- **Vercel** — автодеплой из GitHub
- **Netlify** — drag & drop `dist`
- **Cloudflare Pages** — подключите репозиторий

---

## 🤝 Контрибьютинг

```bash
# Форкните репозиторий
git checkout -b feature/amazing-feature
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature
# Откройте Pull Request
```

---

## 📞 Контакты & Социальные сети

<p align="center">
  <a href="https://t.me/swensi17">
    <img src="https://img.shields.io/badge/Telegram-@swensi17-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram"/>
  </a>
  <a href="https://github.com/swensi17">
    <img src="https://img.shields.io/badge/GitHub-swensi17-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
</p>

<p align="center">
  <a href="mailto:tutatutaev9@gmail.com">
    <img src="https://img.shields.io/badge/Email-tutatutaev9@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/>
  </a>
</p>

<p align="center">
  <a href="https://twitter.com/swensi17">
    <img src="https://img.shields.io/badge/Twitter-@swensi17-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter"/>
  </a>
  <a href="https://discord.gg/swensi17">
    <img src="https://img.shields.io/badge/Discord-swensi17-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"/>
  </a>
</p>

<p align="center">
  <a href="https://www.youtube.com/@swensi17">
    <img src="https://img.shields.io/badge/YouTube-@swensi17-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube"/>
  </a>
  <a href="https://www.linkedin.com/in/swensi17">
    <img src="https://img.shields.io/badge/LinkedIn-swensi17-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
  </a>
</p>

<p align="center">
  <a href="https://www.instagram.com/swensi17">
    <img src="https://img.shields.io/badge/Instagram-@swensi17-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"/>
  </a>
  <a href="https://www.tiktok.com/@swensi17">
    <img src="https://img.shields.io/badge/TikTok-@swensi17-000000?style=for-the-badge&logo=tiktok&logoColor=white" alt="TikTok"/>
  </a>
</p>

---

## 📄 Лицензия

Проект распространяется под лицензией **MIT**. См. [LICENSE](LICENSE).

---

<p align="center">
  <img src="https://img.shields.io/github/stars/swensi17/neo?style=social" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/swensi17/neo?style=social" alt="Forks"/>
  <img src="https://img.shields.io/github/watchers/swensi17/neo?style=social" alt="Watchers"/>
</p>

<p align="center">
  <strong>⭐ Поставьте звезду, если проект оказался полезным!</strong>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/swensi17">swensi17</a>
</p>
](https://raw.githubusercontent.com/swensi17/neo/main/public/logo-icon.svg)
