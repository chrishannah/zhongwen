# Zhongwen

A Chrome extension that replaces your new tab page with a random Mandarin Chinese character. Each new tab displays the character, pinyin, phonetic pronunciation, and English meaning.

## Features

- Random character on every new tab
- Word categories with toggles in the settings panel:
  - **HSK 1** (always on) — essential characters
  - **HSK 2–6** — progressively advanced vocabulary
  - **Internet** — web navigation terms (search, login, download, etc.)
  - **Software** — development terms (code, deploy, merge, etc.)
- Optional Unsplash background images (Chinese landscapes)
- Clean, minimal design with large character display
- Settings persist across tabs

## Installation

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `zhongwen` directory
5. Open a new tab

## Background Images

To enable background images:

1. Create a free account at [unsplash.com/developers](https://unsplash.com/developers)
2. Create a new application to get an Access Key
3. Click the gear icon on the new tab page
4. Paste your Access Key into the input field

Images are cached for 30 minutes to stay within rate limits.

## Word Counts

| Category | Entries |
|----------|---------|
| HSK 1    | 154     |
| HSK 2    | 140     |
| HSK 3    | 103     |
| HSK 4    | 103     |
| HSK 5    | 115     |
| HSK 6    | 101     |
| Internet | 32      |
| Software | 32      |

## Tech

Plain HTML, CSS, and JavaScript. No build step, no dependencies. Chrome Manifest V3.
