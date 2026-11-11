# Nivîsok

**Nivîsok** (Kurdish for "pen", also written *نڤیسۆک*) is a minimal Chrome side panel extension for quick notes. Clip selected text from any page or type freely. Notes are stored locally in your browser and stay until you delete them.

## Features

- **Clip from the context menu**: select text on any page, right-click, choose **Create note**. The source URL is saved with the note
- **Type freely**: compose notes directly in the side panel (`Ctrl/Cmd + Enter` to save)
- **Inline editing**: edit a note in place without losing your scroll position; edited notes show their last-edit time, with the creation time on hover
- **Batch operations**: select multiple notes to export or delete at once
- **Export to `.txt`**: download a single note or a whole selection
- **Live updates**: notes clipped from a page appear in an open panel immediately
- **RTL support**: layout direction follows the browser UI language (Arabic, Central Kurdish, Persian, Urdu)
- **Dark mode**: follows `prefers-color-scheme`
- **Multilingual**: English, German, Arabic, Kurmanji Kurdish (`ku`), Central Kurdish (`ckb`), Spanish, French, Portuguese, Russian and Turkish

## Privacy

Notes live in `chrome.storage.local` on your device. The extension itself makes no network requests and has no accounts or analytics. Declared permissions: `storage`, `contextMenus`, `sidePanel`, `activeTab`.

## Requirements

- Chrome 116 or newer (Manifest V3 side panel)
- Node.js and npm to build from source

## Stack

| Tool | Purpose |
| --- | --- |
| TypeScript | Language |
| Vite 8 + Rolldown | Build |
| Vitest | Testing |
| Chrome MV3 | Extension platform |

No UI framework: the panel is plain TypeScript and DOM APIs.

## Project structure

```text
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── _locales/          # i18n message files (10 locales)
├── scripts/
│   └── bump-manifest.js   # copies the package.json version into manifest.json
├── src/
│   ├── background/        # MV3 service worker (context menu, opens the panel)
│   ├── lib/               # Core logic: store, i18n, noteToText
│   ├── ui/                # Side panel: entry point, note renderer, selection, about dialog
│   └── utils/             # download, formatDate
├── styles/
│   └── sidepanel.css
├── types/
│   └── INote.ts
├── constants.ts
├── sidepanel.html
└── vite.config.ts
```

Tests live next to the code they cover (`*.test.ts`).

## How it works

- **Build**: Vite produces two entry points in `dist/`: `sidepanel.html` (the UI) and `background.js` (the service worker).
- **Storage**: all notes are one array under the key `NIVISOK` in `chrome.storage.local`, newest first. `NoteStore` (`src/lib/store.ts`) is stateless: every call reads the array, changes it and writes it back, so nothing depends on the service worker staying alive.
- **Clipping**: the service worker registers the context menu on install and saves a note on click. The side panel listens to `chrome.storage.onChanged` and re-renders.
- **Data model**: see [`types/INote.ts`](types/INote.ts). Typed notes have `url: null` and are labelled "Self created"; `updatedAt` is only set once a note has been edited.

## Development

```bash
npm install
npm run dev         # vite build --watch, outputs to dist/
npm run build       # production build
npm test            # run tests once
npm run test:watch  # tests in watch mode
npm run typecheck   # tsc --noEmit
```

To load the extension in Chrome:

1. Run `npm run build`
2. Go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `dist/` folder

While `npm run dev` is running, click the reload icon on the extension card in `chrome://extensions` after each rebuild.

### Releasing

`npm version <patch|minor|major>` bumps `package.json` and runs `scripts/bump-manifest.js`, which writes the same version to `public/manifest.json`. The version is also injected into the About dialog at build time.

## Adding a locale

1. Create `public/_locales/<lang>/messages.json`
2. Copy the structure from `public/_locales/en/messages.json` (all locales share the same keys)
3. Translate all `"message"` values
4. If the language is RTL, add its BCP 47 tag to `RTL_LANGS` in `src/lib/i18n.ts`

## License

MIT
