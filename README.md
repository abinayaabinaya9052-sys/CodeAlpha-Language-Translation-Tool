# AI Language Translator

A responsive web app that translates text between 12 languages using the **Google Cloud Translation API**, with a secure Node.js/Express backend that keeps the API key private.

## Features
- Large text input with live character counter and clear button
- 12 languages: English, Tamil, Hindi, Telugu, Malayalam, Kannada, French, German, Spanish, Arabic, Japanese, Chinese
- Swap languages, loading spinner, friendly validation and error messages
- Result card: copy to clipboard, text-to-speech (SpeechSynthesis API), clear, character count
- Translation history (localStorage), toast notifications, dark/light theme toggle
- Glassmorphism UI, responsive on desktop, tablet and mobile
- Shortcut: `Ctrl/Cmd + Enter` to translate

## Technologies
HTML5, CSS3, Vanilla JavaScript, Node.js (18+), Express, dotenv, Google Cloud Translation API (v2)

## How the Translation API Works
1. The browser sends `{ text, source, target }` to `POST /api/translate` on our own server.
2. The Express server validates the request and adds the secret API key from `.env`.
3. The server calls the Google Translation API and returns `{ translatedText }` (or `{ error }`).
4. The frontend displays the result. The key never reaches the browser.

## Project Structure
```
AI-Language-Translator/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## Installation
Requires [Node.js 18+](https://nodejs.org). Open the project in VS Code, then open a terminal (`Ctrl + ~`):
```bash
cd backend
npm install
```

## API Key Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/), create a project, enable **Cloud Translation API**, and create an **API key** (Credentials → Create credentials). Billing must be enabled; Google offers a free monthly character quota.
2. In the `backend` folder, copy the example file:
   - Windows (PowerShell): `copy .env.example .env`
   - macOS/Linux: `cp .env.example .env`
3. Open `backend/.env` and replace the placeholder:
   ```
   GOOGLE_TRANSLATE_API_KEY=your_real_key_here
   ```
`.env` is listed in `.gitignore`, so it will not be uploaded to GitHub.

## Run the Project
```bash
cd backend
npm start
```
Open **http://localhost:3000** in your browser. The Express server also serves the frontend files.

## Screenshots
_Add screenshots here (e.g. `docs/home.png`, `docs/mobile.png`)._

## Troubleshooting
- "Server is missing GOOGLE_TRANSLATE_API_KEY": check `backend/.env` and restart the server.
- "Cannot reach the server": make sure `npm start` is running.
- No voice for a language: install that language's voice in your OS/browser settings.

## Future Improvements
- Auto-detect source language
- Voice input (SpeechRecognition)
- Document/file translation
- User accounts and cloud-synced history
- Rate limiting and caching on the backend
- More languages and unit tests

## License
MIT
