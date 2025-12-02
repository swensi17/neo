<p align="center">
  <img src="https://i.postimg.cc/k4xGwdF3/Snimok-ekrana-2025-12-02-104120.png" alt="NEO Chat Preview" width="800"/>
</p>

<h1 align="center">🤖 NEO Chat</h1>

<p align="center">
  <strong>Современный AI-ассистент на базе Google Gemini</strong>
</p>

<p align="center">
  <a href="https://swensi17.github.io/neo/">
    <img src="https://img.shields.io/badge/🌐_DEMO-Live_Site-00C853?style=for-the-badge" alt="Live Demo"/>
  </a>
</p>

<p align="center">
  <a href="#особенности">Особенности</a> •
  <a href="#установка">Установка</a> •
  <a href="#использование">Использование</a> •
  <a href="#технологии">Технологии</a> •
  <a href="#контакты">Контакты</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Gemini_AI-API-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"/>
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License"/>
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome"/>
</p>

---

## ✨ Особенности

<table>
  <tr>
    <td>🧠</td>
    <td><strong>Google Gemini AI</strong></td>
    <td>Мощный AI для генерации ответов и кода</td>
  </tr>
  <tr>
    <td>🎨</td>
    <td><strong>Современный UI</strong></td>
    <td>Минималистичный дизайн с тёмной темой</td>
  </tr>
  <tr>
    <td>💻</td>
    <td><strong>Превью кода</strong></td>
    <td>Подсветка синтаксиса и live-превью</td>
  </tr>
  <tr>
    <td>🎤</td>
    <td><strong>Голосовой ввод</strong></td>
    <td>Поддержка голосовых сообщений</td>
  </tr>
  <tr>
    <td>📱</td>
    <td><strong>PWA</strong></td>
    <td>Работает как приложение на любом устройстве</td>
  </tr>
  <tr>
    <td>🌙</td>
    <td><strong>Темы</strong></td>
    <td>Светлая и тёмная тема оформления</td>
  </tr>
</table>

---

## 🚀 Установка

### Требования

- Node.js 18+
- Python 3.x (опционально, для скриптов)
- API ключ Google Gemini

### Быстрый старт

```bash
# Клонируй репозиторий
git clone https://github.com/swensi17/neo.git
cd neo

# Установи зависимости
npm install

# Создай .env.local и добавь API ключ
echo "VITE_GEMINI_API_KEY=твой_ключ" > .env.local

# Запусти проект
npm run dev
```

### Запуск через Python

```bash
python run.py
```

---

## 💡 Использование

1. **Получи API ключ** — [Google AI Studio](https://aistudio.google.com/apikey)
2. **Добавь ключ** в `.env.local`
3. **Запусти** `npm run dev` или `python run.py`
4. **Открой** http://localhost:5173

---

## 🛠 Технологии

| Категория | Технологии |
|-----------|------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **Build** | Vite 6 |
| **AI** | Google Gemini API |
| **UI** | Lucide Icons, React Markdown |
| **Code** | React Syntax Highlighter |

---

## 📁 Структура проекта

```
neo/
├── components/          # React компоненты
│   ├── CodePreviewPanel.tsx
│   ├── InputArea.tsx
│   ├── MessageBubble.tsx
│   └── ...
├── services/
│   └── geminiService.ts # Сервис для работы с Gemini API
├── public/              # Статические файлы
├── App.tsx              # Главный компонент
├── index.tsx            # Точка входа
├── types.ts             # TypeScript типы
├── run.py               # Python скрипт запуска
├── deploy.py            # Скрипт деплоя
└── vite.config.ts       # Конфигурация Vite
```

---

## 🚀 Деплой

### GitHub Pages

```bash
python deploy.py
```

Или вручную:

```bash
npm run build
npm run deploy
```

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

<p align="center">
  <strong>⭐ Поставь звезду, если проект понравился!</strong>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/swensi17">swensi17</a>
</p>
