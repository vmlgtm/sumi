# Product Requirement Document (PRD): Sumi (墨)

**Product Name**: Sumi (墨)  
**Type**: Local-First, High-Performance New-Tab Notes Application & Browser Extension  
**Status**: Draft / Ready for Implementation  
**Target Release**: v1.0.0  
**Target Repository**: `/Users/vaibhavmisra/Projects/open-source/sumi`

---

## 1. Product Overview & Philosophy

### 1.1 Philosophy
*Sumi* (墨) is traditional Japanese black ink—pure, elemental, and disciplined. In Japanese aesthetics (*Sumi-e* and calligraphy), there are no corrections or decorative layers: black ink meets white paper with absolute intention. 

In everyday Japanese culture, *Sumi* also carries culinary *umami* depth (such as *Ika-sumi* squid ink)—satisfying, rich, and concentrated without artificial fillers.

### 1.2 The Problem
Modern note-taking apps have evolved into sluggish, multi-megabyte databases and kanban boards. They take seconds to boot, force users through login walls, clutter interfaces with AI assistants, badges, and menus, and impose heavy cognitive friction on simply capturing a fleeting thought.

### 1.3 The Solution
**Sumi** is an ultra-fast, zero-bloat scratchpad and notes manager designed for the browser's new tab page (`Cmd + T`) and standalone web. It combines the clarity of fresh white paper with instant keyboard control, zero data loss durability, and zero external tracking.

---

## 2. Core User Personas & Primary Workflows

### 2.1 Persona
* **The Rapid Thinker / Engineer / Writer**: Opens tens of browser tabs a day, needs to dump a command, URL, meeting point, or thought in under 2 seconds, and expects their keyboard shortcuts to work seamlessly without mouse interaction.

### 2.2 Core User Journeys
1. **The Instant Dump (`Cmd + T`)**:
   - User hits `Cmd + T` in browser.
   - Sumi renders in under 50ms with zero layout shift.
   - Cursor is immediately focused in the active note canvas.
   - User types thoughts and closes the tab. Notes are persisted with zero data loss.
2. **The Daily Scratchpad**:
   - User has 1 pinned note (`📌 scratchpad`) anchored at the top of their list.
   - Any time they open a new tab, their daily scratchpad is immediately available.
3. **The Rapid Recall (`Cmd + K`)**:
   - User presses `Cmd + K` from anywhere in the app.
   - Types 2 characters of a grocery list or meeting snippet.
   - Results filter instantaneously (< 5ms). Arrow down + Enter switches notes.

---

## 3. Non-Functional Requirements (Performance & Reliability)

| Metric | Target | Rationale |
| :--- | :--- | :--- |
| **Cold Boot Time** | `< 50ms` | Must feel like a native browser new tab, not a web app loading. |
| **Typing Latency** | `< 8ms` | Keystroke response must feel immediate; zero input frame lag. |
| **Search Latency** | `< 5ms` | In-memory search over 1,000+ notes without debouncing delay. |
| **Storage Durability** | `100%` (Zero Loss) | Synchronous debounced persist to IndexedDB with localStorage fallback. |
| **Total Production Bundle** | `< 80KB` gzipped | Strict dependency ban on bloated frameworks/heavy libraries. |
| **Network Footprint** | `0 bytes` | 100% offline, zero cloud requests, zero telemetry, zero analytics. |
| **Browser Compatibility** | Chrome, Brave, Edge, Safari, Firefox | Works both as a Manifest V3 extension and a standard PWA/web app. |

---

## 4. Functional Specifications

### 4.1 Visual Design & Layout System
* **Canvas Background**: Crisp pure white (`#FFFFFF`).
* **Ink / Typography**: High-contrast charcoal (`#09090B` for headings, `#27272A` for body text, never harsh blue-tinted grays).
* **Sidebar**: Subtle porcelain tint (`#F9FAFB`), separated by a clean 1px hairline border (`#EEEEF0`).
* **Active State**: Subtle micro-tint (`#ECECEC`) with smooth 100ms transition.
* **Layout**: Two columns:
  * Left: Collapsible sidebar (Width: `220px`), containing Search (`Cmd + K`), `+ New` button, note list, and note counter.
  * Right: Full-height, distraction-free writing canvas (Title, Pin toggle, and rich content area).

### 4.2 Note Lifecycle & Auto-Management
* **Auto-Save**: Changes debounced at 200ms and saved to local storage. Visual status changes silently: `Saving...` $\rightarrow$ `Saved`.
* **Ghost Note Prevention**: If a user hits `Cmd + N` but navigates away or closes the tab without entering content, the empty placeholder is pruned silently instead of leaving empty "Untitled" notes.
* **Ordering & Pinning**:
  * Pinned notes (`pinned: true`) are permanently anchored at the top of the sidebar with a subtle 📌 indicator.
  * Unpinned notes are sorted strictly by `updatedAt` descending (most recent first).
  * No manual folder hierarchy required.

### 4.3 WYSIWYG Inline Formatting Engine
* **True Inline Rendering**: Formats text directly in the DOM using a lightweight contenteditable engine. No raw markdown tokens (`**`, `_`) visible on screen.
* **Supported Formatting**:
  * `Cmd + B` / `Ctrl + B`: **Bold** (`<strong>`)
  * `Cmd + I` / `Ctrl + I`: *Italic* (`<em>`)
  * Auto-Lists: Typing `- ` or `* ` + Space turns the block into a clean native bulleted list (`<ul><li>`).
  * Numbered Lists: Typing `1. ` + Space turns the block into a numbered list (`<ol><li>`).
  * Smart `Enter`: Pressing `Enter` inside a list automatically spawns the next list item. Pressing `Enter` on an empty list item exits the list cleanly.
* **Paste Sanitizer**: Pasting rich text strips external inline styles, external fonts, foreign background colors, and script tags, retaining only plain text and basic bold/italic/lists.

### 4.4 Keyboard Shortcuts Engine
All actions must be executable without touching the mouse:
* `Cmd + N`: Create new note and focus title.
* `Cmd + K`: Focus search bar.
* `Cmd + P`: Toggle pin/unpin on current note.
* `Arrow Up` / `Arrow Down`: Navigate note list when search or list is focused.
* `Cmd + Backspace`: Delete current note with temporary Undo snackbar (5s).
* `Cmd + /`: Toggle minimal keyboard shortcut cheatsheet modal.
* `Esc`: Clear search / close modal / exit focus.

### 4.5 Data Portability & Backup
* **Export All (JSON)**: 1-click export of complete database into standard schema.
* **Export Active (Markdown)**: Download current active note as a `.md` file.
* **Import Backup**: Drag-and-drop or select a previous JSON backup to restore notes.

### 4.6 Extension Deployment Mode
* Single build output that doubles as:
  1. A standalone responsive web application.
  2. A Chrome/Brave/Edge extension (`manifest.json` pointing `chrome_url_overrides.newtab` to `index.html`).

---

## 5. Acceptance Criteria

### Category A: Performance & Boot
- [ ] **AC-A1**: Page initial paint occurs in `< 50ms` on standard browser hardware.
- [ ] **AC-A2**: On page load, the cursor automatically focuses on the active note's title or body with zero user clicks.
- [ ] **AC-A3**: Typing in the editor exhibits zero perceptible latency (<8ms per keystroke).
- [ ] **AC-A4**: No network requests are dispatched after initial asset loading (verify via Network tab: 0 fetch/XHR calls).

### Category B: Persistence & Storage Durability
- [ ] **AC-B1**: Any keystroke entered into Title or Body is persisted to IndexedDB within 200ms.
- [ ] **AC-B2**: Force-closing the browser tab immediately after typing preserves the full text upon reopening.
- [ ] **AC-B3**: Abandoned blank notes (empty title and empty body) are automatically deleted and do not persist in storage.
- [ ] **AC-B4**: Database safely handles at least 1,000 distinct notes without degraded UI responsiveness.

### Category C: Formatting & Editor
- [ ] **AC-C1**: Selecting text and pressing `Cmd + B` immediately renders as **bold** text without revealing `**` asterisks.
- [ ] **AC-C2**: Selecting text and pressing `Cmd + I` immediately renders as *italic* text without revealing `_` underscores.
- [ ] **AC-C3**: Typing `- ` + Space at the beginning of a line initiates a native bulleted list.
- [ ] **AC-C4**: Pressing `Enter` at the end of a bulleted item generates a new bullet on the next line.
- [ ] **AC-C5**: Pressing `Enter` on an empty bullet removes the bullet and restores normal paragraph text.
- [ ] **AC-C6**: Pasting text from an external formatted webpage strips all colors, fonts, and inline styles while preserving paragraphs and line breaks.

### Category D: Navigation & Shortcuts
- [ ] **AC-D1**: Pressing `Cmd + K` immediately focuses the search input.
- [ ] **AC-D2**: Typing in search filters notes dynamically within 5ms.
- [ ] **AC-D3**: Pressing `Cmd + N` initializes a new note and focuses the input.
- [ ] **AC-D4**: Pressing `Cmd + P` toggles the pinned status of the active note and moves it to/from the Pinned section.
- [ ] **AC-D5**: Pressing `Cmd + /` toggles the keyboard shortcut reference modal; pressing `Esc` closes it.

### Category E: Export & Chrome Extension
- [ ] **AC-E1**: User can export the entire database as a clean JSON backup file.
- [ ] **AC-E2**: User can download the active note as a `.md` file.
- [ ] **AC-E3**: When loaded unpacked into Chrome (`chrome://extensions`), opening a new tab (`Cmd + T`) displays Sumi immediately.

---

## 6. Granular Task Breakdown

### Phase 1: Project Scaffolding & Build Architecture
- [ ] **Task 1.1**: Initialize project repository in `/Users/vaibhavmisra/Projects/open-source/sumi`.
- [ ] **Task 1.2**: Configure Vite + React + TypeScript with strict performance flags.
- [ ] **Task 1.3**: Set up Tailwind CSS with custom monochrome design tokens (crisp white `#FFFFFF`, ink black `#09090B`, slate `#27272A`, porcelain `#F9FAFB`).
- [ ] **Task 1.4**: Configure Manifest V3 `manifest.json` and build pipeline to produce both web app and Chrome extension bundles simultaneously.

### Phase 2: Local-First Storage & Data Layer
- [ ] **Task 2.1**: Implement lightweight IndexedDB wrapper (`idb-keyval` or native IndexedDB helper) with synchronous memory caching.
- [ ] **Task 2.2**: Implement note model: `{ id, title, contentHtml, pinned, createdAt, updatedAt }`.
- [ ] **Task 2.3**: Implement auto-save debounce hook (200ms) with state machine (`saving`, `saved`, `idle`).
- [ ] **Task 2.4**: Implement ghost note cleanup logic on note switch or page unload.
- [ ] **Task 2.5**: Implement Export to JSON and Export to Markdown routines.

### Phase 3: Minimalist UI Shell & Sidebar
- [ ] **Task 3.1**: Build two-column layout with responsive collapse on narrow viewports.
- [ ] **Task 3.2**: Build top search toolbar with real-time in-memory fuzzy filtering.
- [ ] **Task 3.3**: Build note list item components with pinned indicator (📌), title, preview snippet, and relative timestamp.
- [ ] **Task 3.4**: Implement pin/unpin toggling and reordering (pinned first, then `updatedAt` desc).

### Phase 4: WYSIWYG Editor Engine
- [ ] **Task 4.1**: Build `Title` component with automatic line resizing and `Enter` key handling to jump into content.
- [ ] **Task 4.2**: Build `ContentEditable` editor component with clean paragraph and list styling.
- [ ] **Task 4.3**: Implement keyboard formatting handlers for `Cmd + B` and `Cmd + I`.
- [ ] **Task 4.4**: Implement smart list continuation on `Enter` and list exit on double `Enter`.
- [ ] **Task 4.5**: Implement paste event handler to strip external styling and normalize plain text / HTML.
- [ ] **Task 4.6**: Wire autofocus logic on startup to ensure instant typing readiness.

### Phase 5: Keyboard Shortcuts & Cheatsheet
- [ ] **Task 5.1**: Build global keyboard shortcut listener (`Cmd+K`, `Cmd+N`, `Cmd+P`, `Cmd+/`, `Esc`).
- [ ] **Task 5.2**: Build minimal shortcut reference modal.
- [ ] **Task 5.3**: Implement keyboard arrow navigation (`Up`/`Down`) in sidebar search results.

### Phase 6: Verification, Testing & Chrome Extension Packaging
- [ ] **Task 6.1**: Run automated production build and verify bundle size < 80KB.
- [ ] **Task 6.2**: Test persistence under simulated crash / abrupt tab close.
- [ ] **Task 6.3**: Verify Chrome extension packaging (`manifest.json`) by testing local load in browser.
- [ ] **Task 6.4**: Verify full compliance with Acceptance Criteria A1 through E3.
