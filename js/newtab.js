(async function () {
  const CATEGORIES = [
    { key: 'hsk1', file: 'data/hsk1.json', alwaysOn: true },
    { key: 'hsk2', file: 'data/hsk2.json', alwaysOn: false },
    { key: 'internet', file: 'data/internet.json', alwaysOn: false },
    { key: 'software', file: 'data/software.json', alwaysOn: false },
  ];

  const UNSPLASH_QUERY = 'chinese landscape';
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Storage helpers — fall back to localStorage outside the extension
  const storage = {
    async get(keys) {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise(r => chrome.storage.local.get(keys, r));
      }
      const result = {};
      for (const k of Object.keys(keys)) {
        const stored = localStorage.getItem(k);
        result[k] = stored !== null ? JSON.parse(stored) : keys[k];
      }
      return result;
    },
    async set(obj) {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise(r => chrome.storage.local.set(obj, r));
      }
      for (const [k, v] of Object.entries(obj)) {
        localStorage.setItem(k, JSON.stringify(v));
      }
    },
  };

  function resolveURL(path) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL(path);
    }
    return path;
  }

  async function loadPrefs() {
    const defaults = {
      hsk2: false,
      internet: false,
      software: false,
      unsplashKey: '',
      cachedBg: null,
      cachedBgTime: 0,
      cachedBgCredit: null,
    };
    return storage.get(defaults);
  }

  async function savePrefs(prefs) {
    return storage.set(prefs);
  }

  async function fetchCategory(file) {
    const res = await fetch(resolveURL(file));
    return res.json();
  }

  async function loadCharacters(prefs) {
    const fetches = CATEGORIES
      .filter(c => c.alwaysOn || prefs[c.key])
      .map(c => fetchCategory(c.file));
    const arrays = await Promise.all(fetches);
    return arrays.flat();
  }

  function displayCharacter(entry) {
    document.getElementById('character').textContent = entry.character;
    document.getElementById('pinyin').textContent = entry.pinyin;
    document.getElementById('phonetic').textContent = entry.phonetic;
    document.getElementById('meaning').textContent = entry.meaning;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // --- Background ---
  async function loadBackground(prefs) {
    const credit = document.getElementById('photo-credit');
    if (!prefs.unsplashKey) {
      document.body.style.backgroundColor = '#2c2c2c';
      document.body.style.backgroundImage = 'none';
      if (credit) credit.style.display = 'none';
      return;
    }

    const now = Date.now();
    const cacheValid = prefs.cachedBg && (now - prefs.cachedBgTime) < CACHE_DURATION;

    if (cacheValid) {
      applyBackground(prefs.cachedBg, prefs.cachedBgCredit);
      return;
    }

    try {
      const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(UNSPLASH_QUERY)}&orientation=landscape`;
      const res = await fetch(url, {
        headers: { Authorization: `Client-ID ${prefs.unsplashKey}` },
      });

      if (!res.ok) throw new Error(`Unsplash API ${res.status}`);

      const data = await res.json();
      const imageUrl = data.urls.regular;
      const creditInfo = {
        name: data.user.name,
        link: data.user.links.html + '?utm_source=zhongwen&utm_medium=referral',
      };

      // Cache the result
      prefs.cachedBg = imageUrl;
      prefs.cachedBgTime = now;
      prefs.cachedBgCredit = creditInfo;
      await savePrefs({
        cachedBg: imageUrl,
        cachedBgTime: now,
        cachedBgCredit: creditInfo,
      });

      applyBackground(imageUrl, creditInfo);
    } catch (e) {
      console.warn('Unsplash background failed:', e);
      document.body.style.backgroundColor = '#2c2c2c';
      if (credit) credit.style.display = 'none';
    }
  }

  function applyBackground(imageUrl, creditInfo) {
    const img = new Image();
    img.onload = () => {
      document.body.style.backgroundImage = `url('${imageUrl}')`;
    };
    img.src = imageUrl;

    const credit = document.getElementById('photo-credit');
    if (credit && creditInfo) {
      credit.textContent = `Photo by ${creditInfo.name} on Unsplash`;
      credit.href = creditInfo.link;
      credit.style.display = 'block';
    }
  }

  // --- Init ---
  const prefs = await loadPrefs();
  let characters = await loadCharacters(prefs);
  displayCharacter(pickRandom(characters));
  loadBackground(prefs);

  // --- Settings panel ---
  const toggle = document.getElementById('settings-toggle');
  const panel = document.getElementById('settings-panel');

  toggle.addEventListener('click', () => {
    panel.classList.toggle('hidden');
  });

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
      panel.classList.add('hidden');
    }
  });

  // Checkbox handlers
  const checkboxes = {
    hsk2: document.getElementById('opt-hsk2'),
    internet: document.getElementById('opt-internet'),
    software: document.getElementById('opt-software'),
  };

  for (const [key, el] of Object.entries(checkboxes)) {
    el.checked = prefs[key];
  }

  for (const [key, el] of Object.entries(checkboxes)) {
    el.addEventListener('change', async () => {
      prefs[key] = el.checked;
      await savePrefs(prefs);
      characters = await loadCharacters(prefs);
      displayCharacter(pickRandom(characters));
    });
  }

  // Unsplash API key handler
  const keyInput = document.getElementById('unsplash-key');
  keyInput.value = prefs.unsplashKey || '';

  let keyDebounce;
  keyInput.addEventListener('input', () => {
    clearTimeout(keyDebounce);
    keyDebounce = setTimeout(async () => {
      prefs.unsplashKey = keyInput.value.trim();
      // Clear cache so a new image is fetched with the new key
      prefs.cachedBg = null;
      prefs.cachedBgTime = 0;
      prefs.cachedBgCredit = null;
      await savePrefs(prefs);
      loadBackground(prefs);
    }, 800);
  });
})();
