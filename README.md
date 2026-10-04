# Sumi (墨)

> Ultra-fast, radical-minimalist, local-first notes in your browser Side Panel and dedicated tab.

Inspired by traditional Japanese black ink (**墨** - *Sumi*), **Sumi** provides a distraction-free, zero-latency scratchpad that opens instantly alongside any webpage (`Cmd + Shift + S` or toolbar click) or as an immersive full-screen writing tab.

---

## ✨ Features

- **⚡ Blazing Fast Boot**: Renders in under 50ms with zero layout shift and immediate cursor autofocus.
- **📄 Ink on Paper Aesthetics**: Crisp pure white canvas (`#FFFFFF`) with deep charcoal typography (`#09090B`).
- **🚫 Zero AI Slop & No Browser Hijacking**: Keeps your standard new tab and search bar untouched. No login walls, badges, notifications, cloud sync popups, or multi-megabyte databases.
- **🖥️ Native Side Panel + Full Tab**:
  - Open in Chrome's native Side Panel while reading, coding, or browsing.
  - 1-click expand button (`⤢`) pops out to a spacious full tab anytime you want deep writing.
  - Automatic focus synchronization keeps notes in sync between side panel and full tab.
- **⌨️ 100% Keyboard Driven**:
  - `Cmd + Shift + S` — Toggle Sumi in Side Panel
  - `Option + N` (`⌥N` / `Alt + N`) or `c` — Create new note
  - `Cmd + K` — Instant search (< 5ms response)
  - `Cmd + P` — Pin / unpin note to top
  - `Cmd + B` / `Cmd + I` — True inline bold & italic
  - `- ` + Space — Auto-bulleted list
  - `1. ` + Space — Auto-numbered list
  - `Cmd + /` — Cheatsheet modal
- **🔒 100% Offline & Private**: Zero analytics, zero tracking, zero external network requests.
- **💾 Local-First Persistence**: Synchronous debounced persist (200ms) to IndexedDB with automatic ghost note pruning (empty abandoned notes are cleaned up silently).
- **📦 Data Portability**: 1-click JSON database backup & import, 1-click Markdown download per note.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (tested on Node 22+)
- `pnpm` (or `npm`)

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/sumi.git
cd sumi

# Install dependencies
pnpm install

# Start local development server
pnpm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🌐 Chrome Extension Installation

1. Build the production package:
   ```bash
   pnpm run build
   ```
2. Open Chrome (or Brave / Edge) and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `dist` folder inside the `sumi` repository.
5. Click the Sumi toolbar icon or press **`Cmd + Shift + S`** to toggle Sumi in your Side Panel on any website! You can also click the expand icon (`⤢`) to use it in a full browser tab.

---

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 6 (Single bundle < 80KB gzipped)
- **Styling**: Tailwind CSS
- **Storage**: Native IndexedDB with fallback memory cache and `localStorage` backup
- **Extension API**: Manifest V3 (`chrome_url_overrides.newtab`)

---

## 📜 License

MIT License. Free and open source.
