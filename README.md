<p align="center">
  <img src="https://i.postimg.cc/k4xGwdF3/Snimok-ekrana-2025-12-02-104120.png" alt="NEO Chat Preview" width="800"/>
</p>

<h1 align="center">🤖 NEO Chat</h1>

<p align="center">
  <strong>Современный AI-ассистент на базе Google Gemini с минималистичным интерфейсом</strong>
</p>

<p align="center">
  <a href="https://swensi17.github.io/neo/">
    <img src="https://img.shields.io/badge/🌐_DEMO-Открыть_сайт-00C853?style=for-the-badge" alt="Live Demo"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"/>
  <img src="https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA"/>
</p>

---

## 📖 О проекте

**NEO Chat** — это веб-приложение для общения с искусственным интеллектом Google Gemini. Проект создан с фокусом на минималистичный дизайн, высокую производительность и удобство использования.

Приложение работает полностью в браузере, поддерживает тёмную и светлую тему, а также может быть установлено как PWA на любое устройство.

---

## ✨ Возможности

### 🧠 Искусственный интеллект
- **Google Gemini API** — мощная языковая модель для генерации текста и кода
- Поддержка контекста диалога — AI помнит предыдущие сообщения
- Настраиваемые параметры генерации (температура, длина ответа)

### 💻 Работа с кодом
- **Подсветка синтаксиса** для 100+ языков программирования
- **Live Preview** — мгновенный просмотр HTML/CSS/JS кода
- Копирование кода в один клик
- Форматирование кода в ответах

### 🎨 Интерфейс
- **Минималистичный дизайн** в стиле True Black
- Тёмная и светлая тема оформления
- Адаптивная вёрстка для всех устройств
- Плавные анимации и переходы
- Кастомные скроллбары

### 🎤 Дополнительно
- **Голосовой ввод** — диктуйте сообщения голосом
- **PWA** — установите как приложение на телефон или компьютер
- Сохранение истории чатов в localStorage
- Экспорт диалогов

---

## 🚀 Быстрый старт

### Требования
- **Node.js** 18 или выше
- **npm** или **yarn**
- **API ключ** Google Gemini (бесплатно)

### Установка

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/swensi17/neo.git
cd neo

# 2. Установите зависимости
npm install

# 3. Создайте файл .env.local с API ключом
echo "VITE_GEMINI_API_KEY=ваш_ключ_здесь" > .env.local

# 4. Запустите проект
npm run dev
```

### Запуск через Python

```bash
python run.py
```

Скрипт автоматически установит зависимости и запустит dev-сервер.

---

## 🔑 Получение API ключа

1. Перейдите на [Google AI Studio](https://aistudio.google.com/apikey)
2. Войдите в аккаунт Google
3. Нажмите **"Create API Key"**
4. Скопируйте ключ и вставьте в `.env.local`

> ⚠️ API ключ бесплатный, но имеет лимиты на количество запросов

---

## 🛠 Технологии

| Категория | Технологии |
|-----------|------------|
| **Frontend** | React 19, TypeScript 5.8, Tailwind CSS |
| **Сборка** | Vite 6, ESBuild |
| **AI** | Google Gemini API (@google/genai) |
| **UI компоненты** | Lucide React (иконки) |
| **Markdown** | React Markdown, Remark GFM |
| **Код** | React Syntax Highlighter |
| **Скрипты** | Python 3.x |

---

## 📁 Структура проекта

```
neo/
├── components/              # React компоненты
│   ├── CodePreviewPanel.tsx # Панель превью кода
│   ├── CustomDropdown.tsx   # Кастомный выпадающий список
│   ├── DownloadModal.tsx    # Модалка скачивания
│   ├── InputArea.tsx        # Поле ввода сообщений
│   ├── LiveVoiceModal.tsx   # Голосовой ввод
│   ├── MessageBubble.tsx    # Пузырь сообщения
│   └── SettingsModal.tsx    # Настройки
│
├── services/
│   └── geminiService.ts     # Сервис для работы с Gemini API
│
├── public/                  # Статические файлы
│   ├── favicon.svg          # Иконка сайта
│   ├── manifest.json        # PWA манифест
│   └── sw.js                # Service Worker
│
├── App.tsx                  # Главный компонент приложения
├── index.tsx                # Точка входа React
├── index.html               # HTML шаблон
├── styles.css               # Глобальные стили
├── types.ts                 # TypeScript типы
│
├── vite.config.ts           # Конфигурация Vite
├── tsconfig.json            # Конфигурация TypeScript
├── package.json             # Зависимости проекта
│
├── run.py                   # Скрипт запуска (Python)
└── deploy.py                # Скрипт деплоя (Python)
```

---

## 📦 Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера на http://localhost:3000 |
| `npm run build` | Сборка проекта для продакшена |
| `npm run preview` | Превью собранного проекта |
| `python run.py` | Установка зависимостей + запуск dev-сервера |
| `python deploy.py` | Деплой на GitHub Pages |

---

## 🚀 Деплой

### GitHub Pages

```bash
python deploy.py
```

Скрипт автоматически:
1. Очистит кэш
2. Соберёт проект
3. Задеплоит на ветку `gh-pages`

### Ручной деплой

```bash
npm run build
npx gh-pages -d dist
```

---

## ⚙️ Конфигурация

### Переменные окружения (.env.local)

```env
VITE_GEMINI_API_KEY=ваш_api_ключ
```

### Vite конфиг (vite.config.ts)

```typescript
export default defineConfig({
  base: '/neo/',           // Базовый путь для GitHub Pages
  server: {
    port: 3000,            // Порт dev-сервера
    host: '0.0.0.0',       // Доступ с других устройств
  },
})
```

---

## 🤝 Контрибьютинг

Буду рад вашим Pull Request'ам! 

1. Форкните репозиторий
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Запушьте (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📞 Контакты

<p align="center">
  <a href="https://t.me/swensi17">
    <img src="https://img.shields.io/badge/Telegram-@swensi17-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram"/>
  </a>
  <a href="mailto:tutatutaev9@gmail.com">
    <img src="https://img.shields.io/badge/Email-tutatutaev9@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/>
  </a>
  <a href="https://github.com/swensi17">
    <img src="https://img.shields.io/badge/GitHub-swensi17-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
</p>

---

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. Подробности в файле [LICENSE](LICENSE).

---

<p align="center">
  <strong>⭐ Поставьте звезду, если проект оказался полезным!</strong>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/swensi17">swensi17</a>
</p>
