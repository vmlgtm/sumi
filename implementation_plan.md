# Implementation Plan: Sumi (墨) - High-Performance New-Tab Notes

Build **Sumi (墨)**, an ultra-fast (<50ms boot), zero-bloat, local-first notes application and Chrome Manifest V3 new-tab extension. The design features a pure crisp white canvas, deep charcoal typography, instant keyboard-driven workflow, and inline WYSIWYG formatting without raw markdown asterisks.

Refer to the full [PRD](file:///Users/vaibhavmisra/.gemini/antigravity/brain/686b1770-29ab-4e83-8009-c6682a5dfeab/prd.md) for detailed specifications and acceptance criteria.

---

## User Review Required

> [!IMPORTANT]
> **Dual Build Architecture**: Sumi will be built as a standalone web application (accessible locally via Vite dev server or hosted statically) that simultaneously outputs an unpacked Chrome extension folder. You can load it directly into `chrome://extensions` so every `Cmd + T` opens Sumi instantly.
>
> **Zero External Dependencies / Local-First**: No cloud sign-in or external database is used. All notes are saved to browser `IndexedDB` with full data durability and 1-click JSON/Markdown export.

---

## Proposed Changes

Target directory: `/Users/vaibhavmisra/Projects/open-source/sumi`

### Project Scaffolding & Configuration

#### [NEW] [package.json](file:///Users/vaibhavmisra/Projects/open-source/sumi/package.json)
- Minimal Vite + React + TypeScript + Tailwind CSS dependencies.
- Production bundle target: <80KB total gzipped.

#### [NEW] [vite.config.ts](file:///Users/vaibhavmisra/Projects/open-source/sumi/vite.config.ts)
- Vite configuration with static relative asset paths (`base: './'`) to ensure compatibility with both standard web servers and `chrome-extension://` protocols.

#### [NEW] [manifest.json](file:///Users/vaibhavmisra/Projects/open-source/sumi/public/manifest.json)
- Manifest V3 configuration registering `chrome_url_overrides.newtab = "index.html"`.

#### [NEW] [index.html](file:///Users/vaibhavmisra/Projects/open-source/sumi/index.html)
- Clean HTML entry point with system font stacks for zero layout shifts and sub-50ms initial paint.

---

### Core Storage & Logic Layer

#### [NEW] [types.ts](file:///Users/vaibhavmisra/Projects/open-source/sumi/src/types.ts)
- Note schema:
  ```ts
  export interface Note {
    id: string;
    title: string;
    contentHtml: string;
    pinned: boolean;
    createdAt: number;
    updatedAt: number;
  }
  ```

#### [NEW] [db.ts](file:///Users/vaibhavmisra/Projects/open-source/sumi/src/db.ts)
- Lightweight, zero-dependency IndexedDB wrapper with fallback to `localStorage`.
- In-memory cache for synchronous read access and instant sub-5ms search.

#### [NEW] [useNotes.ts](file:///Users/vaibhavmisra/Projects/open-source/sumi/src/hooks/useNotes.ts)
- Custom state hook managing active note selection, CRUD operations, 200ms auto-save debounce, and automatic cleanup of empty ghost notes.

---

### UI & Editor Components

#### [NEW] [Sidebar.tsx](file:///Users/vaibhavmisra/Projects/open-source/sumi/src/components/Sidebar.tsx)
- Search bar (`Cmd + K`), `+ New` button (`Cmd + N`).
- Pinned section anchored at top (📌) followed by recency-sorted notes.
- Keyboard arrow navigation (`Up` / `Down`).
- Footer with note count, 1-click JSON export, and shortcut toggle.

#### [NEW] [Editor.tsx](file:///Users/vaibhavmisra/Projects/open-source/sumi/src/components/Editor.tsx)
- Title input with auto-resize and `Enter` handling.
- `contenteditable` canvas with native WYSIWYG formatting:
  - `Cmd + B`: Real **bold** (`<strong>`)
  - `Cmd + I`: Real *italic* (`<em>`)
  - Auto-lists: `- ` and `1. ` expansion on `Enter`
  - Paste sanitizer: Strips external styles/fonts, preserving clean text and paragraphs.
- Instant autofocus on mount.

#### [NEW] [ShortcutsModal.tsx](file:///Users/vaibhavmisra/Projects/open-source/sumi/src/components/ShortcutsModal.tsx)
- Minimal cheatsheet modal triggered by `Cmd + /` or sidebar link.

#### [NEW] [App.tsx](file:///Users/vaibhavmisra/Projects/open-source/sumi/src/App.tsx)
- Root container tying together storage, global keyboard listeners, and layout.

---

## Verification Plan

### Automated Build & Latency Check
```bash
# In /Users/vaibhavmisra/Projects/open-source/sumi
npm install
npm run build
```
- Verify build passes with zero errors.
- Verify total production bundle size < 80KB.

### Manual Verification of Acceptance Criteria
1. **Boot & Autofocus**: Open the app in browser, ensure cursor is immediately active in the canvas.
2. **Persistence Test**: Type note, force reload page (`Cmd + R`) — verify zero keystrokes lost.
3. **WYSIWYG Formatting**: Highlight text, press `Cmd + B` — verify text renders bold with no markdown `**`.
4. **Auto-lists**: Type `- item 1` and press `Enter` — verify bullet auto-generates on line 2. Double enter exits list.
5. **Ghost Note Pruning**: Hit `Cmd + N`, type nothing, click another note — verify empty note is pruned.
6. **Search**: Press `Cmd + K`, type partial string — verify instant filtering in < 5ms.
7. **Extension Test**: Load `dist` folder into `chrome://extensions` $\rightarrow$ open `Cmd + T` new tab to confirm instant render.
