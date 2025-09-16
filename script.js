let dictionary = {};
let selectedFont = 'XM_BiaoHei';
let debounceTimer = null;
let translitMap = null;

function fetchJsonSequential(paths) {
    const tryNext = (i) => {
        if (i >= paths.length) return Promise.reject(new Error('All sources failed'));
        return fetch(paths[i]).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        }).catch(() => tryNext(i+1));
    };
    return tryNext(0);
}

function loadDictionary() {
    return fetchJsonSequential(['updated_manchu_modified.json', 'wordlists/updated_processed_manchu.json'])
        .then(data => {
            dictionary = data;
            updateResultsStats(0, Object.keys(dictionary).length);
        })
        .catch(error => {
            console.error('There was a problem loading the dictionary:', error);
            updateResultsStats(0, 0, 'Failed to load dictionary');
        });
}

function loadTransliteration() {
    return fetch('manchudict.json')
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load transliteration map')))
        .then(map => { translitMap = map; })
        .catch(err => { console.warn(err); translitMap = null; });
}

function persistSetting(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}
function readSetting(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(_) { return fallback; }
}

function setTheme(theme) {
    if (theme === 'light') { document.body.classList.add('light'); }
    else { document.body.classList.remove('light'); }
    persistSetting('theme', theme);
}

function escapeHtml(str) {
    return str.replace(/[&<>"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

function toLowerSafe(str) { return (str || '').toLowerCase(); }

function levenshtein(a, b) {
    if (a === b) return 0; if (!a) return b.length; if (!b) return a.length;
    const m = []; let i, j;
    for (i = 0; i <= b.length; i++) { m[i] = [i]; }
    for (j = 0; j <= a.length; j++) { m[0][j] = j; }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
            m[i][j] = Math.min(m[i-1][j] + 1, m[i][j-1] + 1, m[i-1][j-1] + cost);
        }
    }
    return m[b.length][a.length];
}

function scoreEntry(query, selectedLanguage, wholeWord, startsWith, romanized, manchu, english) {
    const q = toLowerSafe(query);
    const fields = {
        'romanized-manchu': toLowerSafe(romanized),
        'manchu-script': toLowerSafe(manchu),
        'english': toLowerSafe(english)
    };
    const current = fields[selectedLanguage] || '';
    if (!q || !current) return 0;

    let score = 0;

    if (current === q) score += 100;
    if (startsWith && current.startsWith(q)) score += 60;
    if (wholeWord && (current.split(/\s+/).includes(q))) score += 50;
    if (current.includes(q)) score += 20;

    // small fuzzy boost (only for romanized/english where it makes sense)
    if (selectedLanguage !== 'manchu-script') {
        const dist = levenshtein(current.slice(0, Math.min(current.length, q.length + 4)), q);
        score += Math.max(0, 16 - dist);
    }

    // tie-breakers
    score += Math.max(0, 10 - (current.indexOf(q))); // earlier position better

    return score;
}

function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escapeHtml(text).replace(new RegExp(q, 'gi'), m => `<mark>${m}</mark>`);
}

function createResultCard(romanized, manchu, english, query, selectedLanguage) {
    const card = document.createElement('div');
    card.className = 'card';

    // copy manchu button (top-right)
    const copyBtn = document.createElement('button');
    copyBtn.className = 'icon-button copy-btn';
    copyBtn.title = 'Copy Manchu';
    copyBtn.setAttribute('aria-label', 'Copy Manchu');
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(manchu);
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => { copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 1200);
        } catch(_) {}
    });
    card.appendChild(copyBtn);

    const r = document.createElement('div'); r.className = 'row';
    const rl = document.createElement('div'); rl.className = 'label'; rl.textContent = 'Romanized';
    const rv = document.createElement('div'); rv.className = 'value'; rv.innerHTML = highlightMatch(romanized, selectedLanguage==='romanized-manchu'?query:'');
    r.appendChild(rl); r.appendChild(rv);

    const m = document.createElement('div'); m.className = 'row';
    const ml = document.createElement('div'); ml.className = 'label'; ml.textContent = 'Manchu';
    const mv = document.createElement('div'); mv.className = 'value'; mv.textContent = manchu;
    m.appendChild(ml); m.appendChild(mv);

    const e = document.createElement('div'); e.className = 'row';
    const el = document.createElement('div'); el.className = 'label'; el.textContent = 'English';
    const ev = document.createElement('div'); ev.className = 'value'; ev.innerHTML = highlightMatch(english, selectedLanguage==='english'?query:'');
    e.appendChild(el); e.appendChild(ev);

    const actions = document.createElement('div'); actions.className = 'actions';
    const buleku = document.createElement('a'); buleku.href = `https://buleku.org/detail/${encodeURIComponent(romanized)}`; buleku.target = '_blank'; buleku.rel = 'noopener noreferrer'; buleku.className = 'ghost'; buleku.textContent = 'Open in Buleku';
    const enlarge = document.createElement('button'); enlarge.className = 'ghost'; enlarge.textContent = 'Vertical'; enlarge.addEventListener('click', () => openOverlay(manchu));
    actions.appendChild(buleku); actions.appendChild(enlarge);

    card.appendChild(r); card.appendChild(m); card.appendChild(e); card.appendChild(actions);
    return card;
}

function updateResultsStats(shown, total, prefix) {
    const el = document.getElementById('results-stats');
    if (!el) return;
    const pre = prefix ? prefix + ' · ' : '';
    el.textContent = `${pre}${shown} shown${total ? ` · ${total} entries` : ''}`;
}

function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    const wholeWord = document.getElementById('whole-word-toggle').checked;
    const startsWith = document.getElementById('starts-with-toggle').checked;
    const selectedLanguage = document.getElementById('language-select').value;
    const sortBy = document.getElementById('sort-select').value;
  const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (!query) { updateResultsStats(0, Object.keys(dictionary).length, ''); return; }

    const arr = [];
    for (const [romanized, pair] of Object.entries(dictionary)) {
        const manchu = pair[0];
        const english = pair[1];
        const score = scoreEntry(query, selectedLanguage, wholeWord, startsWith, romanized, manchu, english);
        if (score > 0) {
            arr.push({ romanized, manchu, english, score });
        }
    }

    if (sortBy === 'romanized') {
        arr.sort((a,b) => a.romanized.localeCompare(b.romanized));
    } else {
        arr.sort((a,b) => b.score - a.score || a.romanized.localeCompare(b.romanized));
    }

    const limit = 100;
    const fragment = document.createDocumentFragment();
    for (let i=0; i<Math.min(limit, arr.length); i++) {
        const {romanized, manchu, english} = arr[i];
        fragment.appendChild(createResultCard(romanized, manchu, english, query, selectedLanguage));
    }
    resultsDiv.appendChild(fragment);
    updateResultsStats(Math.min(limit, arr.length), Object.keys(dictionary).length);
}

function debouncedSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performSearch, 200);
}

function updateTranslitPreview() {
    const preview = document.getElementById('translit-preview');
    const lang = document.getElementById('language-select').value;
    if (!preview) return;
    const q = document.getElementById('search-input').value;
    if (lang !== 'romanized-manchu' || !q) { preview.hidden = true; preview.textContent=''; return; }
    const manchu = transliterateRomanizedToManchu(q);
    if (manchu) {
        preview.hidden = false;
        preview.style.fontFamily = selectedFont;
        preview.textContent = manchu;
    } else {
        preview.hidden = true;
        preview.textContent = '';
    }
}

function transliterateRomanizedToManchu(input) {
    if (!translitMap || !input) return '';
    const keys = Object.keys(translitMap).sort((a,b) => b.length - a.length);
    let i = 0; let out = '';
    while (i < input.length) {
        let matched = false;
        for (let k of keys) {
            if (input.startsWith(k, i)) {
                out += translitMap[k];
                i += k.length;
                matched = true;
                break;
            }
        }
        if (!matched) { out += input[i]; i++; }
    }
    return out;
}

function openOverlay(manchuText) {
    const overlay = document.getElementById('overlay');
    const overlayText = document.getElementById('overlay-text');
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    overlayText.classList.toggle('vertical', !isSafari);
    overlayText.style.fontFamily = selectedFont;
    overlayText.textContent = manchuText;
    overlay.setAttribute('aria-hidden', 'false');
}

function closeOverlay() {
    document.getElementById('overlay').setAttribute('aria-hidden', 'true');
}

function setupOverlayControls() {
    const text = document.getElementById('overlay-text');
    let size = 42;
    document.getElementById('overlay-decrease').addEventListener('click', () => { size = Math.max(16, size - 4); text.style.fontSize = size + 'px'; });
    document.getElementById('overlay-increase').addEventListener('click', () => { size = Math.min(200, size + 4); text.style.fontSize = size + 'px'; });
    document.getElementById('overlay-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(text.textContent || ''); } catch(_) {} });
    document.getElementById('overlay-close').addEventListener('click', closeOverlay);
    document.getElementById('overlay').addEventListener('click', (e) => { if (e.target.id === 'overlay') closeOverlay(); });
}

// wordlists removed

function copyResultsCSV() {
    const rows = [];
    document.querySelectorAll('.card').forEach(card => {
        const values = card.querySelectorAll('.row .value');
        if (values.length >= 3) {
            const romanized = values[0].textContent.trim();
            const manchu = values[1].textContent.trim();
            const english = values[2].textContent.trim();
            const esc = (s) => '"' + s.replace(/"/g,'""') + '"';
            rows.push(`${esc(romanized)},${esc(english)},${esc(manchu)}`);
        }
    });
    const csv = ['"romanized","english","manchu"', ...rows].join('\n');
    if (rows.length) { try { navigator.clipboard.writeText(csv); } catch(_){} }
}

function restoreSettings() {
    const theme = readSetting('theme', 'dark');
    setTheme(theme);
    const savedFont = readSetting('font', selectedFont);
    selectedFont = savedFont;
    const fontSelect = document.getElementById('font-select');
    if (fontSelect) { fontSelect.value = savedFont; }
    const lang = readSetting('language', 'romanized-manchu');
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) { languageSelect.value = lang; }
    const whole = readSetting('wholeWord', false);
    const starts = readSetting('startsWith', false);
    document.getElementById('whole-word-toggle').checked = whole;
    document.getElementById('starts-with-toggle').checked = starts;
}

function setupUI() {
    // theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.contains('light');
        setTheme(isLight ? 'dark' : 'light');
    });

    // font select
const fontSelector = document.getElementById('font-select');
fontSelector.addEventListener('change', () => {
    selectedFont = fontSelector.value;
    persistSetting('font', selectedFont);
    updateTranslitPreview();
    renderAlphabetGrid();
});

    // input events
    const input = document.getElementById('search-input');
    input.addEventListener('input', () => { debouncedSearch(); updateTranslitPreview(); });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { performSearch(); }
        if (e.key === 'Escape') { input.value=''; performSearch(); updateTranslitPreview(); }
    });
    document.getElementById('clear-input').addEventListener('click', () => { input.value=''; input.focus(); performSearch(); updateTranslitPreview(); });
    document.getElementById('search-button').addEventListener('click', performSearch);

    // option events
    const languageSelect = document.getElementById('language-select');
    languageSelect.addEventListener('change', () => { persistSetting('language', languageSelect.value); performSearch(); updateTranslitPreview(); });
    const whole = document.getElementById('whole-word-toggle');
    whole.addEventListener('change', () => { persistSetting('wholeWord', whole.checked); performSearch(); });
    const starts = document.getElementById('starts-with-toggle');
    starts.addEventListener('change', () => { persistSetting('startsWith', starts.checked); performSearch(); });
    const sort = document.getElementById('sort-select');
    sort.addEventListener('change', performSearch);

    // copy
    document.getElementById('copy-results').addEventListener('click', copyResultsCSV);

    // shortcuts
    document.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        const inEditable = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);
        if (inEditable) return;
        const isSlash = (e.key === '/' || e.code === 'Slash');
        const isQuestion = (e.key === '?' || (e.shiftKey && isSlash));
        const noMods = !e.metaKey && !e.ctrlKey && !e.altKey;
        if (isSlash && noMods) {
            e.preventDefault();
            const searchHidden = document.getElementById('search-view')?.hidden;
            const target = searchHidden ? document.getElementById('learn-romanized-input') : input;
            target && target.focus();
        } else if (isQuestion && noMods) {
            alert('Shortcuts:\n/ focus input (Search or Learn)\nEnter search\nEsc clear');
        }
    });

    // sidebar removed

    // navigation
    const navSearch = document.getElementById('nav-search');
    const navLearn = document.getElementById('nav-learn');
    const searchView = document.getElementById('search-view');
    const learnView = document.getElementById('learn-view');
    function setView(view) {
        const isLearn = view === 'learn';
        learnView.hidden = !isLearn;
        searchView.hidden = isLearn;
        navLearn.classList.toggle('active', isLearn);
        navSearch.classList.toggle('active', !isLearn);
        navLearn.setAttribute('aria-pressed', String(isLearn));
        navSearch.setAttribute('aria-pressed', String(!isLearn));
    }
    navSearch.addEventListener('click', () => setView('search'));
    navLearn.addEventListener('click', () => setView('learn'));

    // learn practice
    const learnInput = document.getElementById('learn-romanized-input');
    const learnOutput = document.getElementById('learn-manchu-output');
    document.getElementById('learn-clear').addEventListener('click', () => { learnInput.value = ''; learnOutput.textContent=''; learnInput.focus(); });
    document.getElementById('learn-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(learnOutput.textContent || ''); } catch(_) {} });
    learnInput.addEventListener('input', () => {
        learnOutput.style.fontFamily = selectedFont;
        learnOutput.textContent = transliterateRomanizedToManchu(learnInput.value || '');
    });
}

window.addEventListener('load', () => {
    restoreSettings();
    setupUI();
    setupOverlayControls();
    // wordlists removed
    Promise.all([loadDictionary(), loadTransliteration()]).then(() => {
        updateTranslitPreview();
        renderAlphabetGrid();
    });
});

function renderAlphabetGrid() {
    if (!translitMap) return;
    const grid = document.getElementById('alphabet-grid');
    if (!grid) return;
    const isLetter = (k) => /^[A-Za-z]+$/.test(k);
    const keys = Object.keys(translitMap).filter(isLetter).sort((a,b) => a.localeCompare(b));
    const frag = document.createDocumentFragment();
    keys.forEach(k => {
        const item = document.createElement('div'); item.className = 'alpha-item';
        const roman = document.createElement('div'); roman.className = 'roman'; roman.textContent = k;
        const glyph = document.createElement('div'); glyph.className = 'glyph'; glyph.style.fontFamily = selectedFont; glyph.textContent = translitMap[k];
        item.appendChild(roman); item.appendChild(glyph);
        item.addEventListener('click', () => {
            const input = document.getElementById('learn-romanized-input');
            input.value += k;
            input.dispatchEvent(new Event('input'));
        });
        frag.appendChild(item);
    });
    grid.innerHTML=''; grid.appendChild(frag);
}
