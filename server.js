// Express backend: receives text from the frontend and calls Google Cloud Translation
// using a secret key stored in .env (never sent to the browser).
require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const API_URL = 'https://translation.googleapis.com/language/translate/v2';
const MAX_CHARS = 5000;

app.use(express.json({ limit: '50kb' }));
// Serve the frontend so the whole app runs from one URL (no CORS issues)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.post('/api/translate', async (req, res) => {
  const { text, source, target } = req.body || {};

  // Server-side validation (never trust the browser alone)
  if (!API_KEY || API_KEY.startsWith('your_')) {
    return res.status(500).json({ error: 'Server is missing GOOGLE_TRANSLATE_API_KEY. Check backend/.env.' });
  }
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Please enter some text.' });
  if (text.length > MAX_CHARS) return res.status(400).json({ error: `Text is too long (max ${MAX_CHARS} characters).` });
  if (!source || !target) return res.status(400).json({ error: 'Please select both languages.' });
  if (source === target) return res.status(400).json({ error: 'Source and target languages must be different.' });

  try {
    const response = await fetch(`${API_URL}?key=${encodeURIComponent(API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text' })
    });
    const data = await response.json();
    if (!response.ok) {
      const msg = data?.error?.message || 'Translation service returned an error.';
      return res.status(response.status).json({ error: msg });
    }
    res.json({ translatedText: data.data.translations[0].translatedText });
  } catch (err) {
    console.error('Translation error:', err.message);
    res.status(502).json({ error: 'Could not reach the translation service. Try again.' });
  }
});

app.listen(PORT, () => console.log(`AI Language Translator running at http://localhost:${PORT}`));
