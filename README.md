# Sumi (墨)

> Ultra-fast, radical-minimalist, local-first notes for your browser new tab.

Inspired by traditional Japanese black ink (**墨** - *Sumi*), **Sumi** provides a distraction-free, zero-latency scratchpad that opens in `< 50ms` on every `Cmd + T`.

---

## ✨ Features

- **⚡ Blazing Fast Boot**: Renders in under 50ms with zero layout shift and immediate cursor autofocus.
- **📄 Ink on Paper Aesthetics**: Crisp pure white canvas (`#FFFFFF`) with deep charcoal typography (`#09090B`).
- **🚫 Zero AI Slop & Clutter**: No login walls, badges, notifications, cloud sync popups, or multi-megabyte databases.
- **⌨️ 100% Keyboard Driven**:
  - `Cmd + T` — Instant scratchpad on new tab
  - `Cmd + N` — Create new note
  - `Cmd + K` — Instant search (< 5ms response)
  - `Cmd + P` — Pin / unpin note to top
  - `Cmd + B` / `Cmd + I` — True inline bold & italic
  - `- ` + Space — Auto-bulleted list
  - `1. ` + Space — Auto-numbered list
  - `Cmd + /` — Cheatsheet modal
- **🔒 100% Offline & Private**: Zero analytics, zero tracking, zero external network requests.
- **💾 Local-First Persistence**: Synchronous debounced persist (200ms) to IndexedDB with automatic ghost note pruning (empty abandoned notes are cleaned up silently).
- **📦 Data Portability**: 1-click JSON database backup & import, 1-click Markdown download per note.
- **🧩 Dual Target Distribution**: Runs as a standard web app or as an unpacked Chrome / Brave / Edge Manifest V3 extension.

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
5. Open a new tab (`Cmd + T`) — Sumi will open instantly!

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
