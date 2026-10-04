import React, { useEffect, useRef } from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
  const modKey = isMac ? '⌘' : 'Ctrl+';
  const altKey = isMac ? '⌥' : 'Alt+';

  const shortcutGroups = [
    {
      title: 'Navigation & Organization',
      shortcuts: [
        { key: `${altKey}N / c`, desc: 'New note' },
        { key: `${modKey}K`, desc: 'Instant search (global)' },
        { key: `${modKey}P`, desc: 'Toggle pinned status' },
        { key: '↑ / ↓', desc: 'Navigate note list' },
        { key: 'Enter', desc: 'Open highlighted note' },
        { key: 'Esc', desc: 'Clear search / dismiss' },
      ],
    },
    {
      title: 'Formatting & Writing',
      shortcuts: [
        { key: `${modKey}B`, desc: 'Bold text' },
        { key: `${modKey}I`, desc: 'Italic text' },
        { key: `${modKey}E`, desc: 'Inline code' },
        { key: '`code`', desc: 'Auto code chip' },
        { key: `${modKey}K`, desc: 'Insert / edit link' },
        { key: '[text](url)', desc: 'Markdown link' },
        { key: `${modKey}Click`, desc: 'Open link in new tab' },
        { key: '[] [Space]', desc: 'Checklist task' },
        { key: '- [Space]', desc: 'Bulleted list' },
        { key: '1. [Space]', desc: 'Numbered list' },
        { key: 'Enter', desc: 'Continue task or list' },
        { key: 'Enter (empty)', desc: 'Exit task or list' },
      ],
    },
    {
      title: 'Shortcuts & System',
      shortcuts: [
        { key: `${modKey}⇧S`, desc: 'Toggle Side Panel' },
        { key: `${modKey}⇧D`, desc: 'Toggle Dark / Light' },
        { key: `${modKey}/`, desc: 'Open cheatsheet' },
        { key: `${modKey}Backspace`, desc: 'Delete active note' },
      ],
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 p-0 m-auto bg-transparent backdrop:bg-black/40 backdrop:backdrop-blur-xs flex items-center justify-center border-none outline-none"
      aria-label="Keyboard Shortcuts"
    >
      <div 
        className="bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 shadow-2xl max-w-lg w-full mx-4 p-5 text-ink-950 dark:text-ink-50 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-ink-800">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded bg-ink-950 dark:bg-ink-100 text-white dark:text-ink-950 flex items-center justify-center font-bold text-xs">
              墨
            </span>
            <h2 className="text-sm font-semibold tracking-wide">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 dark:text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 rounded p-1 text-sm focus:outline-none"
            aria-label="Close cheatsheet"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.shortcuts.map((sc) => (
                  <div
                    key={sc.desc}
                    className="flex items-center justify-between p-1.5 rounded bg-ink-50 dark:bg-ink-950 border border-ink-200/50 dark:border-ink-800/50"
                  >
                    <span className="text-ink-600 dark:text-ink-400">{sc.desc}</span>
                    <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-2xs font-semibold text-ink-800 dark:text-ink-200">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between text-[11px] text-ink-400 dark:text-ink-500">
          <span>Sumi (墨) &bull; Zero tracking, 100% offline</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-ink-950 dark:bg-ink-100 text-white dark:text-ink-950 hover:bg-ink-900 dark:hover:bg-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
};
