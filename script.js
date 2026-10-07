// AI Language Translator - frontend logic (no API keys here; the backend holds them)

// ----- Supported languages: code = API code, speech = BCP-47 tag for text-to-speech -----
const LANGUAGES = [
  { code: 'en', name: 'English',   speech: 'en-US' },
  { code: 'ta', name: 'Tamil',     speech: 'ta-IN' },
  { code: 'hi', name: 'Hindi',     speech: 'hi-IN' },
  { code: 'te', name: 'Telugu',    speech: 'te-IN' },
  { code: 'ml', name: 'Malayalam', speech: 'ml-IN' },
  { code: 'kn', name: 'Kannada',   speech: 'kn-IN' },
  { code: 'fr', name: 'French',    speech: 'fr-FR' },
  { code: 'de', name: 'German',    speech: 'de-DE' },
  { code: 'es', name: 'Spanish',   speech: 'es-ES' },
  { code: 'ar', name: 'Arabic',    speech: 'ar-SA' },
  { code: 'ja', name: 'Japanese',  speech: 'ja-JP' },
  { code: 'zh', name: 'Chinese',   speech: 'zh-CN' }
];
const HISTORY_KEY = 'translatorHistory';
const THEME_KEY = 'translatorTheme';
const MAX_HISTORY = 8;

// ----- DOM references -----
const $ = (id) => document.getElementById(id);
const sourceLang = $('sourceLang'), targetLang = $('targetLang');
const sourceText = $('sourceText'), resultText = $('resultText');
const translateBtn = $('translateBtn'), errorBox = $('errorBox');

let translatedValue = ''; // plain string of the current translation

// ----- Helpers -----
const langByCode = (code) => LANGUAGES.find((l) => l.code === code);

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}
function showError(message) { errorBox.textContent = message; errorBox.hidden = false; }
function hideError() { errorBox.hidden = true; }

function updateCounters() {
  $('sourceCount').textContent = `${sourceText.value.length} / 5000`;
  $('resultCount').textContent = `${translatedValue.length} characters`;
}

function setResult(text) {
  translatedValue = text;
  resultText.textContent = text || 'Your translation will appear here.';
  resultText.classList.toggle('filled', Boolean(text));
  resultText.dir = targetLang.value === 'ar' ? 'rtl' : 'auto'; // right-to-left for Arabic
  updateCounters();
}

// ----- Setup -----
function populateLanguages() {
  for (const select of [sourceLang, targetLang]) {
    select.innerHTML = LANGUAGES.map((l) => `<option value="${l.code}">${l.name}</option>`).join('');
  }
  sourceLang.value = 'en';
  targetLang.value = 'ta';
}

// ----- Translate -----
async function translate() {
  hideError();
  const text = sourceText.value.trim();

  // Validation
  if (!text) return showError('Please enter some text to translate.');
  if (!sourceLang.value || !targetLang.value) return showError('Please select both languages.');
  if (sourceLang.value === targetLang.value) return showError('Source and target languages must be different.');

  translateBtn.disabled = true;
  translateBtn.classList.add('loading');
  translateBtn.querySelector('.btn-label').textContent = 'Translating…';

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source: sourceLang.value, target: targetLang.value })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Translation failed. Please try again.');

    setResult(data.translatedText);
    saveHistory({ text, result: data.translatedText, from: sourceLang.value, to: targetLang.value });
    showToast('Translation complete ✓');
  } catch (err) {
    // "Failed to fetch" means the backend isn't running
    showError(err.message === 'Failed to fetch'
      ? 'Cannot reach the server. Start it with "npm start" in the backend folder.'
      : err.message);
  } finally {
    translateBtn.disabled = false;
    translateBtn.classList.remove('loading');
    translateBtn.querySelector('.btn-label').textContent = 'Translate';
  }
}

// ----- Swap, copy, speak, clear -----
function swapLanguages() {
  [sourceLang.value, targetLang.value] = [targetLang.value, sourceLang.value];
  // Move the translation into the input so the user can translate back
  if (translatedValue) { sourceText.value = translatedValue; setResult(''); }
  updateCounters();
}

async function copyTranslation() {
  if (!translatedValue) return showError('Nothing to copy yet.');
  try {
    await navigator.clipboard.writeText(translatedValue);
  } catch {
    // Fallback for older browsers / non-secure contexts
    const tmp = document.createElement('textarea');
    tmp.value = translatedValue; document.body.appendChild(tmp);
    tmp.select(); document.execCommand('copy'); tmp.remove();
  }
  showToast('Copied to clipboard ✓');
}

function speakTranslation() {
  if (!translatedValue) return showError('Nothing to read aloud yet.');
  if (!('speechSynthesis' in window)) return showError('Text-to-speech is not supported in this browser.');
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(translatedValue);
  utterance.lang = langByCode(targetLang.value).speech;
  utterance.onerror = () => showError('Could not play speech. Your device may lack a voice for this language.');
  speechSynthesis.speak(utterance);
}

// ----- History (localStorage) -----
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}
function saveHistory(entry) {
  const history = [entry, ...loadHistory()].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}
function renderHistory() {
  const list = $('historyList');
  const history = loadHistory();
  list.innerHTML = '';
  if (!history.length) {
    list.innerHTML = '<li class="muted" style="cursor:default">No translations yet. Your recent ones will show up here.</li>';
    return;
  }
  history.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = '<div class="meta"></div><div class="txt"></div><div class="txt"></div>';
    // textContent (not innerHTML) keeps user text safe from HTML injection
    li.children[0].textContent = `${langByCode(item.from).name} → ${langByCode(item.to).name}`;
    li.children[1].textContent = item.text;
    li.children[2].textContent = item.result;
    li.title = 'Click to reuse';
    li.addEventListener('click', () => {
      sourceLang.value = item.from; targetLang.value = item.to;
      sourceText.value = item.text; setResult(item.result); hideError();
    });
    list.appendChild(li);
  });
}

// ----- Theme -----
function applyTheme(theme) { document.documentElement.dataset.theme = theme; localStorage.setItem(THEME_KEY, theme); }

// ----- Event wiring -----
populateLanguages();
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
renderHistory();
updateCounters();

translateBtn.addEventListener('click', translate);
$('swapBtn').addEventListener('click', swapLanguages);
$('copyBtn').addEventListener('click', copyTranslation);
$('speakBtn').addEventListener('click', speakTranslation);
$('clearInput').addEventListener('click', () => { sourceText.value = ''; hideError(); updateCounters(); sourceText.focus(); });
$('clearResult').addEventListener('click', () => { speechSynthesis.cancel(); setResult(''); hideError(); });
$('clearHistory').addEventListener('click', () => { localStorage.removeItem(HISTORY_KEY); renderHistory(); showToast('History cleared'); });
$('themeToggle').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
sourceText.addEventListener('input', updateCounters);
targetLang.addEventListener('change', () => { resultText.dir = targetLang.value === 'ar' ? 'rtl' : 'auto'; });
sourceText.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') translate(); });
