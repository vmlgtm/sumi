import React, { useRef, useEffect } from 'react';
import { Note, SaveStatus } from '../types';

interface EditorProps {
  note: Note | null;
  saveStatus: SaveStatus;
  isDark: boolean;
  onToggleTheme: () => void;
  onUpdate: (updates: Partial<Pick<Note, 'title' | 'contentHtml'>>) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onExportMarkdown: () => void;
  onOpenFullTab: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
}

export const Editor: React.FC<EditorProps> = ({
  note,
  saveStatus,
  isDark,
  onToggleTheme,
  onUpdate,
  onTogglePin,
  onDelete,
  onExportMarkdown,
  onOpenFullTab,
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

  // Handle checkbox clicks inside contenteditable
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.matches('input[type="checkbox"]')) {
      const checkbox = target as HTMLInputElement;
      const taskItem = checkbox.closest('.task-item');
      if (taskItem) {
        if (checkbox.checked) {
          taskItem.classList.add('task-done');
          checkbox.setAttribute('checked', '');
        } else {
          taskItem.classList.remove('task-done');
          checkbox.removeAttribute('checked');
        }
        handleContentInput();
      }
    }
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

    // AC-CODE-1: Cmd + E for Inline Code
    if (isMod && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const selectedContent = range.extractContents();
        const code = document.createElement('code');
        code.appendChild(selectedContent);
        range.insertNode(code);

        const newRange = document.createRange();
        newRange.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(newRange);
        handleContentInput();
      }
      return;
    }

    // AC-CODE-2: Typing backtick ` to complete inline code chip: `word`
    if (e.key === '`') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
        const anchorNode = selection.anchorNode;
        if (anchorNode && anchorNode.nodeType === Node.TEXT_NODE) {
          const text = anchorNode.textContent || '';
          const offset = selection.anchorOffset;
          const lastTick = text.lastIndexOf('`', offset - 1);
          if (lastTick !== -1 && offset > lastTick + 1) {
            const word = text.slice(lastTick + 1, offset);
            if (!word.includes(' ') && word.length > 0) {
              e.preventDefault();
              const before = text.slice(0, lastTick);
              const after = text.slice(offset);
              anchorNode.textContent = before;

              const code = document.createElement('code');
              code.textContent = word;

              const spaceNode = document.createTextNode('\u00A0' + after);
              const parent = anchorNode.parentNode;
              if (parent) {
                parent.insertBefore(code, anchorNode.nextSibling);
                parent.insertBefore(spaceNode, code.nextSibling);

                const range = document.createRange();
                range.setStart(spaceNode, 1);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                handleContentInput();
                return;
              }
            }
          }
        }
      }
    }

    // Auto-list & Checklist triggering on Space
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
        const anchorNode = selection.anchorNode;
        if (anchorNode && anchorNode.nodeType === Node.TEXT_NODE) {
          const text = anchorNode.textContent || '';
          const offset = selection.anchorOffset;

          // Checklist trigger: "[]" or "- [ ]" + Space
          const trimmed = text.slice(0, offset).trim();
          if (trimmed === '[]' || trimmed === '- [ ]' || trimmed === '[-]') {
            e.preventDefault();
            let block: Node | null = anchorNode;
            while (block && block.parentNode !== contentRef.current && block !== contentRef.current) {
              block = block.parentNode;
            }

            const taskP = document.createElement('p');
            taskP.className = 'task-item';
            taskP.innerHTML = '<input type="checkbox" class="task-checkbox" contenteditable="false" /><span class="task-text">&nbsp;</span>';

            if (block && contentRef.current && block.parentNode === contentRef.current) {
              contentRef.current.replaceChild(taskP, block);
            } else {
              document.execCommand('insertHTML', false, '<p class="task-item"><input type="checkbox" class="task-checkbox" contenteditable="false" /><span class="task-text">&nbsp;</span></p>');
            }

            const textSpan = taskP.querySelector('.task-text');
            if (textSpan) {
              const range = document.createRange();
              range.selectNodeContents(textSpan);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
            handleContentInput();
            return;
          }

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

    // Enter key handling (Checklist continuation / exit & native list exit)
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        // Check if inside a checklist item (.task-item)
        let taskItem: HTMLElement | null = null;
        let node: Node | null = selection.anchorNode;
        while (node && node !== contentRef.current) {
          if ((node as HTMLElement).classList?.contains('task-item')) {
            taskItem = node as HTMLElement;
            break;
          }
          node = node.parentNode;
        }

        if (taskItem) {
          const textSpan = taskItem.querySelector('.task-text') || taskItem;
          const rawText = (textSpan.textContent || '').replace(/\u00a0/g, ' ').trim();
          if (rawText === '') {
            // Empty task item: exit checklist, convert to normal paragraph
            e.preventDefault();
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            taskItem.parentNode?.replaceChild(p, taskItem);
            const range = document.createRange();
            range.setStart(p, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            handleContentInput();
            return;
          } else {
            // Spawn next unchecked task item
            e.preventDefault();
            const nextTask = document.createElement('p');
            nextTask.className = 'task-item';
            nextTask.innerHTML = '<input type="checkbox" class="task-checkbox" contenteditable="false" /><span class="task-text"><br></span>';
            taskItem.parentNode?.insertBefore(nextTask, taskItem.nextSibling);

            const nextTextSpan = nextTask.querySelector('.task-text') || nextTask;
            const range = document.createRange();
            range.setStart(nextTextSpan, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            handleContentInput();
            return;
          }
        }

        // Standard bullet/numbered list exit on empty Enter
        let listNode: Node | null = selection.anchorNode;
        while (listNode && listNode !== contentRef.current) {
          if (listNode.nodeName === 'LI') {
            const li = listNode as HTMLElement;
            const liText = (li.textContent || '').replace(/\u200B/g, '').trim();
            if (liText === '' && li.innerHTML.replace(/<br\s*[\/]?>/gi, '').trim() === '') {
              e.preventDefault();
              document.execCommand('outdent', false);
              handleContentInput();
              return;
            }
            break;
          }
          listNode = listNode.parentNode;
        }
      }
    }
  };

  // AC-C6: Paste sanitizer (strips external fonts, inline colors, foreign styles)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (text) {
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
      <div className="flex-1 flex flex-col items-center justify-center text-ink-400 dark:text-ink-600 p-8 select-none bg-white dark:bg-ink-950">
        <div className="text-3xl mb-2 text-ink-900 dark:text-ink-100">墨</div>
        <p className="text-xs">No active note</p>
        <p className="text-xs text-ink-300 dark:text-ink-600 mt-1">Press ⌥N or c to create a note</p>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-ink-950 relative overflow-hidden transition-colors duration-150" role="main">
      {/* Top canvas toolbar */}
      <header className="px-5 py-2.5 flex items-center justify-between border-b border-ink-100 dark:border-ink-900 select-none shrink-0 bg-white/80 dark:bg-ink-950/80 backdrop-blur-xs">
        <div className="flex items-center space-x-2">
          {/* Toggle sidebar button */}
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            className="p-1.5 rounded text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {/* AC-FIX-1: Quiet, tranquil Save Indicator (Zero visual drift while typing) */}
          <div className="h-5 flex items-center pl-1 text-[11px] font-mono text-ink-400 dark:text-ink-500">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-ink-500 dark:text-ink-400 animate-in fade-in duration-200">
                <svg className="w-3 h-3 text-ink-700 dark:text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Right canvas controls */}
        <div className="flex items-center space-x-1">
          {/* Theme toggle: Light / Dark Mode */}
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light paper (⌘⇧D)' : 'Switch to Inverse Ink / Dark (⌘⇧D)'}
            className="p-1.5 rounded text-ink-400 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-900 transition-colors"
          >
            {isDark ? (
              // Sun icon
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              // Moon icon
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Pin toggle */}
          <button
            onClick={onTogglePin}
            title={note.pinned ? 'Unpin note (⌘P)' : 'Pin note (⌘P)'}
            className={`p-1.5 rounded transition-colors text-xs flex items-center gap-1 ${
              note.pinned
                ? 'bg-ink-100 dark:bg-ink-800 text-ink-950 dark:text-ink-50 font-medium'
                : 'text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-900'
            }`}
          >
            <span>📌</span>
            <span className="text-[10px] hidden sm:inline">{note.pinned ? 'Pinned' : 'Pin'}</span>
          </button>

          {/* Export active note as Markdown */}
          <button
            onClick={onExportMarkdown}
            title="Download note as Markdown"
            className="p-1.5 rounded text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* AC-FIX-2: Open in full tab / expand (Closes side panel) */}
          <button
            onClick={onOpenFullTab}
            title="Open in full tab & close side panel"
            className="p-1.5 rounded text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

          {/* Delete note */}
          <button
            onClick={onDelete}
            title="Delete note (⌘⌫)"
            className="p-1.5 rounded text-ink-400 dark:text-ink-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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
          className="w-full text-2xl sm:text-3xl font-bold tracking-tight text-ink-950 dark:text-ink-50 placeholder-ink-300 dark:placeholder-ink-700 bg-transparent border-none outline-none focus:outline-none mb-6 transition-colors"
          aria-label="Note title"
        />

        {/* ContentEditable Canvas */}
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onClick={handleContentClick}
          onInput={handleContentInput}
          onKeyDown={handleContentKeyDown}
          onPaste={handlePaste}
          data-placeholder="Write your thoughts..."
          className="sumi-editor sumi-placeholder text-ink-800 dark:text-ink-200 leading-relaxed text-sm sm:text-base outline-none min-h-[300px] transition-colors"
          aria-label="Note content"
        />
      </div>
    </main>
  );
};
