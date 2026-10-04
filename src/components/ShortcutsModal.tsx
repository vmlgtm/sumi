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

  const shortcutGroups = [
    {
      title: 'Navigation & Organization',
      shortcuts: [
        { key: `${modKey}N`, desc: 'New note' },
        { key: `${modKey}K`, desc: 'Focus instant search' },
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
        { key: '- [Space]', desc: 'Start bulleted list' },
        { key: '1. [Space]', desc: 'Start numbered list' },
        { key: 'Enter', desc: 'Continue list item' },
        { key: 'Enter (empty)', desc: 'Exit list' },
      ],
    },
    {
      title: 'Shortcuts & Safety',
      shortcuts: [
        { key: `${modKey}/`, desc: 'Open shortcut cheatsheet' },
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
        // Light dismiss on backdrop click
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 p-0 m-auto bg-transparent backdrop:bg-black/30 backdrop:backdrop-blur-xs flex items-center justify-center border-none outline-none"
      aria-label="Keyboard Shortcuts"
    >
      <div 
        className="bg-white rounded-xl border border-ink-200 shadow-xl max-w-lg w-full mx-4 p-5 text-ink-950 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-ink-100">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded bg-ink-950 text-white flex items-center justify-center font-bold text-xs">
              墨
            </span>
            <h2 className="text-sm font-semibold tracking-wide">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-900 rounded p-1 text-sm focus:outline-none"
            aria-label="Close cheatsheet"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.shortcuts.map((sc) => (
                  <div
                    key={sc.desc}
                    className="flex items-center justify-between p-1.5 rounded bg-ink-50 border border-ink-200/50"
                  >
                    <span className="text-ink-600">{sc.desc}</span>
                    <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white border border-ink-200 shadow-2xs font-semibold text-ink-800">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-ink-100 flex items-center justify-between text-[11px] text-ink-400">
          <span>Sumi (墨) &bull; Zero tracking, 100% offline</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-ink-950 text-white hover:bg-ink-900 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
};
