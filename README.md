# Sumi

A local-first, distraction-free scratchpad built as a Chrome Side Panel and dedicated tab companion.

Sumi provides an ultra-fast, keyboard-driven writing surface that opens alongside any webpage or expands into an immersive full-screen canvas. It is engineered with strict constraints: zero network telemetry, zero third-party font/icon downloads, sub-50ms boot times, and a production bundle under 80 KB gzipped.

---

## Capabilities

### Inline WYSIWYG Editing
- **Clean Canvas**: Type without markdown syntax clutter. Formatting renders inline immediately.
- **Interactive Checklists**: Type `[] ` or `- [ ] ` followed by space to create a task item. Click or toggle items with smooth strikethrough.
- **Lists**: Automatic conversion for bulleted (`- `) and numbered (`1. `) lists, with intuitive `Enter` continuation and empty `Enter` exit.
- **Inline Code**: Monospace chips via ``` `multi word code` ``` or `⌘E` selection wrapping.
- **Minimal Links**: Hyperlinks adopt the body text color with a quiet slate baseline underline (`#C7C7CC` / `#545458`), avoiding harsh blue accents.
  - Auto-detection on `Space` / `Enter` for raw URLs.
  - Paste-to-link (`⌘V` on selected text wraps it into a link without overwriting).
  - Markdown syntax `[label](url)` auto-converts on closing parenthesis.
  - Contextual `⌘K` link modal inside the editor.
  - Hover tooltip with URL preview, copy, edit, and unlink actions.
  - `⌘`-click (or `Ctrl`-click) to open in a new tab.

### Dual Workspace
- **Side Panel (`⌘⇧S`)**: Dock Sumi beside your code, articles, or documentation in Chrome's native Side Panel.
- **Full Tab Expansion (`⤢` / `⌥O`)**: One click expands your current note into a full browser tab and dismisses the sidebar for deep focus.
- **Cross-Window Sync**: Synchronized across windows and panels in real-time via `BroadcastChannel`.

### Keyboard-First Navigation
Every core action can be executed without leaving the keyboard:
- `⌥N` or `c` — Create note
- `⌘K` — Instant search (when unfocused) or link insertion (when editor focused)
- `↑` / `↓` — Navigate search results and note list
- `⌘P` — Pin note to top of library
- `⌘⇧D` — Toggle light / warm graphite dark mode
- `⌘/` — View keyboard shortcuts cheatsheet
- `⌘⌫` — Delete selected note

### Address Bar Capture (Omnibox)
Type `sumi` followed by `Tab` or `Space` in Chrome's address bar:
- `sumi <query>` — Live-search your notes directly from the browser bar.
- `sumi <thought>` — Instantly appends a `- [ ]` checklist task to your pinned Daily Scratchpad.
- `sumi new <title>` — Creates a new note immediately.

### Local-First Persistence & Privacy
- **100% Offline**: Zero analytics, zero cookies, zero external network requests.
- **Storage**: IndexedDB storage with debounced persistence (250ms), in-memory cache, and `localStorage` fallback.
- **Silent Saving**: Saving status is quiet and unobtrusive; no flickering indicators while typing.
- **Ghost Pruning**: Automatically prunes abandoned empty notes on navigation.
- **Portability**: Full JSON database backup and restore, plus single-note clean Markdown (`.md`) export.

---

## Keyboard Shortcuts

| Category | Shortcut | Action |
| :--- | :--- | :--- |
| **Navigation** | `⌥N` or `c` | Create a new note |
| | `⌘K` | Instant global search |
| | `↑` / `↓` | Navigate note list / search results |
| | `Enter` | Select note / open search result |
| | `Esc` | Clear search / dismiss modals |
| | `⌘P` | Pin / unpin note |
| | `⌘⌫` | Delete active note |
| **Formatting** | `⌘B` / `⌘I` | Bold / Italic |
| | `⌘E` | Inline code chip |
| | ``` `code` ``` | Auto code formatting on backtick |
| | `⌘K` | Insert / edit link (when editor focused) |
| | `[text](url)` | Markdown link auto-conversion |
| | `⌘Click` | Open hyperlink in new tab |
| | `[] ` / `- [ ] ` | Interactive checklist |
| | `- ` + Space | Bulleted list |
| | `1. ` + Space | Numbered list |
| **System** | `⌘⇧S` | Toggle Side Panel |
| | `⌘⇧D` | Toggle light / dark theme |
| | `⌘/` | Open shortcuts cheatsheet |

---

## Design System

Sumi's visual identity, typography, and color tokens are formally specified using the [Google Labs DESIGN.md format](https://github.com/google-labs-code/design.md). See [`DESIGN.md`](./DESIGN.md) for normative token values, contrast standards, and architectural rules.

---

## Getting Started

### Requirements
- Node.js 18+ (tested on Node 22+)
- `pnpm` (recommended) or `npm`

### Local Development
```bash
git clone https://github.com/invaibhavdev/sumi.git
cd sumi
pnpm install
pnpm run dev
```

Visit `http://localhost:5173` to test in the browser.

### Chrome Extension Installation
1. Build the production bundle:
   ```bash
   pnpm run build
   ```
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the upper right corner).
4. Click **Load unpacked** and select the `dist` folder generated inside the `sumi` repository.
5. Click the Sumi toolbar icon or press `⌘⇧S` to open the Side Panel on any website.

---

## Specifications

- **Bundle Size**: 77.44 KB gzipped JavaScript (vendor + app code combined).
- **Cold Boot**: < 50ms initial paint.
- **Dependencies**: React 19, TypeScript 5.7, Tailwind CSS 3.4, Vite 6.
- **Manifest**: Chrome Extensions Manifest V3.

---

## License

MIT
