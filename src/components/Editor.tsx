import React, { useRef, useEffect, useState } from 'react';
import { Note, SaveStatus } from '../types';
import { isValidUrl, sanitizeUrl } from '../utils';
import { Icon } from './Icon';

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

const createAnchor = (href: string, text: string) => {
  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = text;
  return a;
};

const isInsideAnchor = (node: Node | null, container: HTMLElement | null): boolean => {
  let cur = node;
  while (cur && cur !== container) {
    if ((cur as HTMLElement).tagName?.toLowerCase() === 'a') return true;
    cur = cur.parentNode;
  }
  return false;
};

const setCursorAt = (target: Node, offset = 0) => {
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStart(target, offset);
  range.collapse(true);
  sel?.removeAllRanges();
  sel?.addRange(range);
};

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

  // Link Modal state (⌘K)
  const [linkModal, setLinkModal] = useState<{
    isOpen: boolean;
    initialUrl: string;
    initialText: string;
    existingAnchor: HTMLAnchorElement | null;
  }>({
    isOpen: false,
    initialUrl: '',
    initialText: '',
    existingAnchor: null,
  });
  const [urlInputValue, setUrlInputValue] = useState('');
  const [textInputValue, setTextInputValue] = useState('');
  const savedRangeRef = useRef<Range | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Link Hover Preview state
  const [hoveredLink, setHoveredLink] = useState<{
    href: string;
    fixedRect: { top: number; bottom: number; left: number };
    element: HTMLAnchorElement;
  } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const openLinkModal = (targetAnchor?: HTMLAnchorElement) => {
    const selection = window.getSelection();
    let initialUrl = '';
    let initialText = '';
    let existingAnchor: HTMLAnchorElement | null = targetAnchor || null;

    if (existingAnchor) {
      initialUrl = existingAnchor.getAttribute('href') || '';
      initialText = existingAnchor.textContent || '';
    } else if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedRangeRef.current = range.cloneRange();

      let node: Node | null = selection.anchorNode;
      while (node && node !== contentRef.current) {
        if ((node as HTMLElement).tagName?.toLowerCase() === 'a') {
          existingAnchor = node as HTMLAnchorElement;
          break;
        }
        node = node.parentNode;
      }

      if (existingAnchor) {
        initialUrl = existingAnchor.getAttribute('href') || '';
        initialText = existingAnchor.textContent || '';
      } else {
        initialText = range.toString();
      }
    }

    setUrlInputValue(initialUrl);
    setTextInputValue(initialText);
    setLinkModal({
      isOpen: true,
      initialUrl,
      initialText,
      existingAnchor,
    });

    requestAnimationFrame(() => {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    });
  };

  const handleApplyLink = (urlToApply: string, textToApply?: string) => {
    const cleanUrl = sanitizeUrl(urlToApply);
    if (!cleanUrl) {
      handleCloseLinkModal();
      return;
    }

    const displayText = textToApply && textToApply.trim() ? textToApply.trim() : cleanUrl;

    if (linkModal.existingAnchor) {
      linkModal.existingAnchor.setAttribute('href', cleanUrl);
      linkModal.existingAnchor.textContent = displayText;
    } else if (savedRangeRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedRangeRef.current);

      if (!savedRangeRef.current.collapsed) {
        const selectedContent = savedRangeRef.current.extractContents();
        const a = createAnchor(cleanUrl, '');
        if (textToApply && textToApply.trim()) {
          a.textContent = textToApply.trim();
        } else {
          a.appendChild(selectedContent);
        }
        savedRangeRef.current.insertNode(a);
        setCursorAt(a, 0);
      } else {
        const a = createAnchor(cleanUrl, displayText);
        savedRangeRef.current.insertNode(a);
        const spaceNode = document.createTextNode('\u00A0');
        a.parentNode?.insertBefore(spaceNode, a.nextSibling);
        setCursorAt(spaceNode, 1);
      }
    }

    handleContentInput();
    handleCloseLinkModal();
  };

  const handleRemoveLink = () => {
    if (linkModal.existingAnchor) {
      const text = linkModal.existingAnchor.textContent || '';
      const textNode = document.createTextNode(text);
      linkModal.existingAnchor.parentNode?.replaceChild(textNode, linkModal.existingAnchor);
      handleContentInput();
    }
    handleCloseLinkModal();
  };

  const handleCloseLinkModal = () => {
    setLinkModal({ isOpen: false, initialUrl: '', initialText: '', existingAnchor: null });
    setUrlInputValue('');
    setTextInputValue('');
    savedRangeRef.current = null;
    contentRef.current?.focus();
  };

  const handleContentMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const a = target.closest('a') as HTMLAnchorElement | null;
    if (a && a.href && contentRef.current?.contains(a)) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      const rect = a.getBoundingClientRect();
      setHoveredLink({
        href: a.getAttribute('href') || a.href,
        fixedRect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
        },
        element: a,
      });
    }
  };

  const handleContentMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredLink(null);
    }, 250);
  };

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

  // Handle clicks inside contenteditable (Checkboxes & Cmd+Click Links)
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // AC-LINK-NAV: Cmd+Click opens in new tab
    const anchor = target.closest('a');
    if (anchor && anchor.href) {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        window.open(anchor.href, '_blank', 'noopener,noreferrer');
        return;
      }
    }

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

    // AC-LINK-CMD-K: Cmd + K for Link Modal (inside note editor)
    if (isMod && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      openLinkModal();
      return;
    }

    // AC-CODE-2: Typing backtick ` to complete inline code chip: `word` or `multi word code`
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
            if (!word.includes('\n') && word.trim().length > 0 && !word.startsWith('`')) {
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
                setCursorAt(spaceNode, 1);
                handleContentInput();
                return;
              }
            }
          }
        }
      }
    }

    // AC-LINK-MD: Typing closing parenthesis `)` in `[text](url)` converts to link
    if (e.key === ')') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
        const anchorNode = selection.anchorNode;
        if (anchorNode && anchorNode.nodeType === Node.TEXT_NODE) {
          const text = anchorNode.textContent || '';
          const offset = selection.anchorOffset;
          const textBefore = text.slice(0, offset);
          const mdLinkRegex = /\[([^\]\n]+)\]\((https?:\/\/[^\s\)\n]+)$/i;
          const match = textBefore.match(mdLinkRegex);
          if (match) {
            const fullMatch = match[0];
            const linkText = match[1];
            const rawUrl = match[2];
            const cleanUrl = sanitizeUrl(rawUrl);
            if (cleanUrl) {
              e.preventDefault();
              const matchStart = offset - fullMatch.length;
              const before = text.slice(0, matchStart);
              const after = text.slice(offset);
              anchorNode.textContent = before;

              const a = createAnchor(cleanUrl, linkText);
              const spaceNode = document.createTextNode('\u00A0' + after);
              const parent = anchorNode.parentNode;
              if (parent) {
                parent.insertBefore(a, anchorNode.nextSibling);
                parent.insertBefore(spaceNode, a.nextSibling);
                setCursorAt(spaceNode, 1);
                handleContentInput();
                return;
              }
            }
          }
        }
      }
    }

    // Auto-list & Checklist triggering on Space, plus AC-LINK-AUTO
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
        const anchorNode = selection.anchorNode;
        if (anchorNode && anchorNode.nodeType === Node.TEXT_NODE) {
          const text = anchorNode.textContent || '';
          const offset = selection.anchorOffset;

          // AC-LINK-AUTO: Space after raw URL converts to minimal link
          const textBefore = text.slice(0, offset);
          const urlMatch = textBefore.match(/(https?:\/\/[^\s<>"'\n]+)$/i);
          if (urlMatch && !isInsideAnchor(anchorNode, contentRef.current)) {
            const rawUrl = urlMatch[1];
            const cleanUrl = sanitizeUrl(rawUrl);
            if (cleanUrl) {
              e.preventDefault();
              const matchStart = offset - rawUrl.length;
              const before = text.slice(0, matchStart);
              const after = text.slice(offset);
              anchorNode.textContent = before;

              const a = createAnchor(cleanUrl, rawUrl);
              const spaceNode = document.createTextNode('\u00A0' + after);
              const parent = anchorNode.parentNode;
              if (parent) {
                parent.insertBefore(a, anchorNode.nextSibling);
                parent.insertBefore(spaceNode, a.nextSibling);
                setCursorAt(spaceNode, 1);
                handleContentInput();
                return;
              }
            }
          }

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

    // Enter key handling (Checklist continuation / exit & native list exit, plus AC-LINK-AUTO)
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        // Auto-link raw URL on Enter
        if (selection.isCollapsed) {
          const anchorNode = selection.anchorNode;
          if (anchorNode && anchorNode.nodeType === Node.TEXT_NODE) {
            const text = anchorNode.textContent || '';
            const offset = selection.anchorOffset;
            const textBefore = text.slice(0, offset);
            const urlMatch = textBefore.match(/(https?:\/\/[^\s<>"'\n]+)$/i);
            if (urlMatch && !isInsideAnchor(anchorNode, contentRef.current)) {
              const rawUrl = urlMatch[1];
              const cleanUrl = sanitizeUrl(rawUrl);
              if (cleanUrl) {
                e.preventDefault();
                const matchStart = offset - rawUrl.length;
                const before = text.slice(0, matchStart);
                const after = text.slice(offset);
                anchorNode.textContent = before;

                const a = createAnchor(cleanUrl, rawUrl);
                const parent = anchorNode.parentNode;
                if (parent) {
                  parent.insertBefore(a, anchorNode.nextSibling);
                  const p = document.createElement('p');
                  p.innerHTML = after.trim() ? escapeHtml(after) : '<br>';
                  parent.parentElement?.insertBefore(p, parent.nextSibling);
                  setCursorAt(p, 0);
                  handleContentInput();
                  return;
                }
              }
            }
          }
        }

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

  // AC-C6: Paste sanitizer with AC-LINK-PASTE (smart URL paste on selection)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rawText = e.clipboardData.getData('text/plain');
    if (!rawText) return;

    const trimmed = rawText.trim();
    const selection = window.getSelection();
    const isUrl = isValidUrl(trimmed);

    if (isUrl && selection && selection.rangeCount > 0) {
      const url = sanitizeUrl(trimmed);
      if (!selection.isCollapsed) {
        // AC-LINK-PASTE: Paste URL on selected text (wraps selection)
        const range = selection.getRangeAt(0);
        const selectedContent = range.extractContents();
        const a = createAnchor(url, '');
        a.appendChild(selectedContent);
        range.insertNode(a);
        setCursorAt(a, 0);
        handleContentInput();
        return;
      } else {
        // Paste URL at collapsed cursor -> create minimal link
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const a = createAnchor(url, trimmed);
        range.insertNode(a);

        const spaceNode = document.createTextNode('\u00A0');
        a.parentNode?.insertBefore(spaceNode, a.nextSibling);
        setCursorAt(spaceNode, 1);
        handleContentInput();
        return;
      }
    }

    const lines = rawText.split(/\r?\n/);
    if (lines.length > 1) {
      const formattedHtml = lines
        .map(line => line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p><br></p>')
        .join('');
      document.execCommand('insertHTML', false, formattedHtml);
    } else {
      document.execCommand('insertText', false, rawText);
    }
    handleContentInput();
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
            <Icon d="M4 6h16M4 12h16M4 18h7" />
          </button>

          {/* AC-FIX-1: Quiet, tranquil Save Indicator (Zero visual drift while typing) */}
          <div className="h-5 flex items-center pl-1 text-[11px] font-mono text-ink-400 dark:text-ink-500">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-ink-500 dark:text-ink-400 animate-in fade-in duration-200">
                <Icon d="M5 13l4 4L19 7" className="w-3 h-3 text-ink-700 dark:text-ink-300" strokeWidth={2.5} />
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
            <Icon
              d={
                isDark
                  ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                  : 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
              }
            />
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

          {/* Insert link */}
          <button
            onClick={() => openLinkModal()}
            title="Add or edit link (⌘K)"
            className="p-1.5 rounded text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-900 transition-colors"
          >
            <Icon d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </button>

          {/* Export active note as Markdown */}
          <button
            onClick={onExportMarkdown}
            title="Download note as Markdown"
            className="p-1.5 rounded text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-900 transition-colors"
          >
            <Icon d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </button>

          {/* AC-FIX-2: Open in full tab / expand (Closes side panel) */}
          <button
            onClick={onOpenFullTab}
            title="Open in full tab & close side panel"
            className="p-1.5 rounded text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-900 transition-colors"
          >
            <Icon d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </button>

          {/* Delete note */}
          <button
            onClick={onDelete}
            title="Delete note (⌘⌫)"
            className="p-1.5 rounded text-ink-400 dark:text-ink-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          onMouseOver={handleContentMouseOver}
          onMouseLeave={handleContentMouseLeave}
          onInput={handleContentInput}
          onKeyDown={handleContentKeyDown}
          onPaste={handlePaste}
          data-placeholder="Write your thoughts..."
          className="sumi-editor sumi-placeholder text-ink-800 dark:text-ink-200 leading-relaxed text-sm sm:text-base outline-none min-h-[300px] transition-colors"
          aria-label="Note content"
        />
      </div>

      {/* Floating Link Hover Tooltip (AC-LINK-NAV) */}
      {hoveredLink && (
        <div
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleContentMouseLeave}
          style={{
            top: `${hoveredLink.fixedRect.bottom + 6}px`,
            left: `${Math.max(16, Math.min(hoveredLink.fixedRect.left, window.innerWidth - 300))}px`,
          }}
          className="fixed z-50 flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-ink-900/95 dark:bg-ink-850/95 text-white dark:text-ink-50 text-xs shadow-xl border border-ink-700/60 dark:border-ink-700 backdrop-blur-xs select-none animate-in fade-in duration-100"
        >
          <span className="max-w-[150px] truncate text-ink-300 dark:text-ink-400 font-mono text-[11px]">
            {hoveredLink.href.replace(/^https?:\/\//, '')}
          </span>
          <div className="h-3 w-px bg-ink-700 dark:bg-ink-700" />
          <button
            onClick={() => window.open(hoveredLink.href, '_blank', 'noopener,noreferrer')}
            className="hover:text-white dark:hover:text-white flex items-center gap-0.5 text-xs font-medium transition-colors"
            title="Open in new tab (⌘-click)"
          >
            Open ↗
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(hoveredLink.href);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 1500);
            }}
            className="text-ink-300 hover:text-white transition-colors text-xs"
            title="Copy URL"
          >
            {copiedLink ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => {
              const el = hoveredLink.element;
              setHoveredLink(null);
              openLinkModal(el);
            }}
            className="text-ink-300 hover:text-white transition-colors text-xs"
            title="Edit Link"
          >
            Edit
          </button>
          <button
            onClick={() => {
              const el = hoveredLink.element;
              const text = el.textContent || '';
              el.parentNode?.replaceChild(document.createTextNode(text), el);
              setHoveredLink(null);
              handleContentInput();
            }}
            className="text-red-400 hover:text-red-300 transition-colors text-xs px-1"
            title="Remove link"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Link Modal (AC-LINK-CMD-K) */}
      {linkModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-100"
          onClick={handleCloseLinkModal}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              handleCloseLinkModal();
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-2xl p-4 text-ink-950 dark:text-ink-50 animate-in zoom-in-95 duration-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                {linkModal.existingAnchor ? 'Edit Link' : 'Insert Link'}
              </span>
              <button
                type="button"
                onClick={handleCloseLinkModal}
                className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyLink(urlInputValue, textInputValue);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-medium text-ink-500 dark:text-ink-400 mb-1">
                  Text
                </label>
                <input
                  type="text"
                  value={textInputValue}
                  onChange={e => setTextInputValue(e.target.value)}
                  placeholder="Display text (optional)"
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-ink-950 dark:text-ink-50 focus:outline-none focus:border-ink-500 dark:focus:border-ink-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ink-500 dark:text-ink-400 mb-1">
                  URL
                </label>
                <input
                  ref={linkInputRef}
                  type="text"
                  value={urlInputValue}
                  onChange={e => setUrlInputValue(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 text-ink-950 dark:text-ink-50 focus:outline-none focus:border-ink-500 dark:focus:border-ink-400 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {linkModal.existingAnchor ? (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors"
                  >
                    Remove link
                  </button>
                ) : <span />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCloseLinkModal}
                    className="px-2.5 py-1 text-xs rounded text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!urlInputValue.trim()}
                    className="px-3 py-1 text-xs rounded font-medium bg-ink-950 dark:bg-ink-100 text-white dark:text-ink-950 disabled:opacity-40 transition-opacity"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
