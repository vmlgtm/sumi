import React, { useRef, useEffect } from 'react';
import { Note, SaveStatus } from '../types';

interface EditorProps {
  note: Note | null;
  saveStatus: SaveStatus;
  onUpdate: (updates: Partial<Pick<Note, 'title' | 'contentHtml'>>) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onExportMarkdown: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
}

export const Editor: React.FC<EditorProps> = ({
  note,
  saveStatus,
  onUpdate,
  onTogglePin,
  onDelete,
  onExportMarkdown,
  onToggleSidebar,
  isSidebarCollapsed,
  titleInputRef,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const currentNoteIdRef = useRef<string | null>(null);

  // Sync content when active note ID changes
  useEffect(() => {
    if (!note) return;

    if (currentNoteIdRef.current !== note.id) {
      currentNoteIdRef.current = note.id;
      if (contentRef.current) {
        contentRef.current.innerHTML = note.contentHtml || '<p><br></p>';
      }

      // Autofocus logic (AC-A2)
      requestAnimationFrame(() => {
        if (!note.title.trim() && titleInputRef.current) {
          titleInputRef.current.focus();
        } else if (contentRef.current) {
          contentRef.current.focus();
          // Place cursor at the end
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(contentRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      });
    }
  }, [note?.id]);

  // Handle title input change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ title: e.target.value });
  };

  // Jump from Title to Content on Enter
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      contentRef.current?.focus();
    }
  };

  // Handle content input event
  const handleContentInput = () => {
    if (!contentRef.current) return;
    const html = contentRef.current.innerHTML;
    onUpdate({ contentHtml: html });
  };

  // Handle keyboard shortcuts inside editor body
  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMod = e.metaKey || e.ctrlKey;

    // AC-C1: Cmd + B for Bold
    if (isMod && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      document.execCommand('bold', false);
      handleContentInput();
      return;
    }

    // AC-C2: Cmd + I for Italic
    if (isMod && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      document.execCommand('italic', false);
      handleContentInput();
      return;
    }

    // Auto-list triggering on Space ("- " or "1. ")
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
        const anchorNode = selection.anchorNode;
        if (anchorNode && anchorNode.nodeType === Node.TEXT_NODE) {
          const text = anchorNode.textContent || '';
          const offset = selection.anchorOffset;

          // Bullet list trigger: "- " or "* "
          if (offset === 1 && (text === '-' || text === '*')) {
            e.preventDefault();
            anchorNode.textContent = '';
            document.execCommand('insertUnorderedList', false);
            handleContentInput();
            return;
          }

          // Numbered list trigger: "1." + Space
          if (offset === 2 && text === '1.') {
            e.preventDefault();
            anchorNode.textContent = '';
            document.execCommand('insertOrderedList', false);
            handleContentInput();
            return;
          }
        }
      }
    }

    // Empty list exit handling (AC-C5)
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.anchorNode;
        while (node && node !== contentRef.current) {
          if (node.nodeName === 'LI') {
            const li = node as HTMLElement;
            const liText = (li.textContent || '').replace(/\u200B/g, '').trim();
            if (liText === '' && li.innerHTML.replace(/<br\s*[\/]?>/gi, '').trim() === '') {
              // Pressing enter on empty li removes list item
              e.preventDefault();
              document.execCommand('outdent', false);
              handleContentInput();
              return;
            }
            break;
          }
          node = node.parentNode;
        }
      }
    }
  };

  // AC-C6: Paste sanitizer (strips fonts, colors, external inline styles)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      // Split by paragraphs / newlines
      const lines = text.split(/\r?\n/);
      if (lines.length > 1) {
        const formattedHtml = lines
          .map(line => line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p><br></p>')
          .join('');
        document.execCommand('insertHTML', false, formattedHtml);
      } else {
        document.execCommand('insertText', false, text);
      }
      handleContentInput();
    }
  };

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-ink-400 p-8 select-none">
        <div className="text-3xl mb-2">墨</div>
        <p className="text-xs">No active note</p>
        <p className="text-xs text-ink-300 mt-1">Press ⌥N or c to create a note</p>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-white relative overflow-hidden" role="main">
      {/* Top canvas toolbar */}
      <header className="px-6 py-3 flex items-center justify-between border-b border-ink-100 select-none shrink-0">
        <div className="flex items-center space-x-2">
          {/* Toggle sidebar button */}
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            className="p-1 rounded text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {/* Auto-save status indicator */}
          <div className="text-[11px] font-mono tracking-tight text-ink-400 flex items-center gap-1.5 pl-1">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-ink-400">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse"></span>
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-ink-500 flex items-center gap-1">
                <svg className="w-3 h-3 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Right canvas controls */}
        <div className="flex items-center space-x-1">
          {/* Pin toggle */}
          <button
            onClick={onTogglePin}
            title={note.pinned ? 'Unpin note (⌘P)' : 'Pin note (⌘P)'}
            className={`p-1.5 rounded transition-colors text-xs flex items-center gap-1 ${
              note.pinned
                ? 'bg-ink-100 text-ink-950 font-medium'
                : 'text-ink-400 hover:text-ink-900 hover:bg-ink-100'
            }`}
          >
            <span>📌</span>
            <span className="text-[10px] hidden sm:inline">{note.pinned ? 'Pinned' : 'Pin'}</span>
          </button>

          {/* Export active note as Markdown */}
          <button
            onClick={onExportMarkdown}
            title="Download note as Markdown"
            className="p-1.5 rounded text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* Delete note */}
          <button
            onClick={onDelete}
            title="Delete note (⌘⌫)"
            className="p-1.5 rounded text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Writing Canvas */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 md:px-20 py-8 max-w-4xl mx-auto w-full">
        {/* Title Input */}
        <input
          ref={titleInputRef}
          type="text"
          value={note.title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled note"
          className="w-full text-2xl sm:text-3xl font-bold tracking-tight text-ink-950 placeholder-ink-300 bg-transparent border-none outline-none focus:outline-none mb-6"
          aria-label="Note title"
        />

        {/* ContentEditable Canvas */}
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentInput}
          onKeyDown={handleContentKeyDown}
          onPaste={handlePaste}
          data-placeholder="Write your thoughts..."
          className="sumi-editor sumi-placeholder text-ink-800 leading-relaxed text-sm sm:text-base outline-none min-h-[300px]"
          aria-label="Note content"
        />
      </div>
    </main>
  );
};
