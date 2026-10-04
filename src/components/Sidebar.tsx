import React, { useRef } from 'react';
import { Note } from '../types';
import { formatRelativeTime, stripHtml } from '../utils';

interface SidebarProps {
  notes: Note[];
  filteredNotes: Note[];
  activeId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onOpenShortcuts: () => void;
  onExportAll: () => void;
  onImportBackup: (file: File) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  filteredNotes,
  activeId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onTogglePin,
  onDeleteNote,
  onOpenShortcuts,
  onExportAll,
  onImportBackup,
  searchRef,
  isCollapsed,
  onToggleCollapse,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group into pinned and regular
  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const regularNotes = filteredNotes.filter(n => !n.pinned);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      e.target.value = '';
    }
  };

  // Keyboard navigation inside search box (Arrow Down moves into list)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstItem = document.querySelector<HTMLElement>('[data-note-item]');
      firstItem?.focus();
    }
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent, index: number, allNotes: Note[]) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(index + 1, allNotes.length - 1);
      const items = document.querySelectorAll<HTMLElement>('[data-note-item]');
      items[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === 0) {
        searchRef.current?.focus();
      } else {
        const items = document.querySelectorAll<HTMLElement>('[data-note-item]');
        items[index - 1]?.focus();
      }
    } else if (e.key === 'Enter') {
      onSelectNote(allNotes[index].id);
    }
  };

  const allFilteredFlat = [...pinnedNotes, ...regularNotes];

  const handleItemSelect = (id: string) => {
    onSelectNote(id);
    if (typeof window !== 'undefined' && window.innerWidth < 768 && !isCollapsed) {
      onToggleCollapse();
    }
  };

  return (
    <>
      {/* Mobile / Side-panel backdrop */}
      {!isCollapsed && (
        <div
          onClick={onToggleCollapse}
          className="fixed inset-0 bg-ink-950/20 z-20 md:hidden backdrop-blur-2xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 flex flex-col bg-ink-50/95 backdrop-blur-md md:backdrop-blur-none border-r border-ink-200 transition-all duration-200 ease-in-out shrink-0 select-none ${
          isCollapsed ? '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden' : 'w-64 translate-x-0'
        }`}
        aria-label="Notes navigation"
      >
      {/* Header & Branding */}
      <div className="p-3 pb-2 flex items-center justify-between border-b border-ink-200/60">
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 rounded-md bg-ink-950 text-white flex items-center justify-center font-bold text-xs tracking-tighter shadow-sm">
            墨
          </span>
          <span className="font-semibold text-xs tracking-wider uppercase text-ink-900">
            Sumi
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onCreateNote}
            title="New Note (⌥N or c)"
            className="p-1.5 rounded text-ink-700 hover:text-ink-950 hover:bg-ink-200/60 transition-colors focus:outline-none focus:ring-1 focus:ring-ink-400"
            aria-label="Create note"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            onClick={onToggleCollapse}
            title="Toggle Sidebar"
            className="md:hidden p-1.5 rounded text-ink-700 hover:text-ink-950 hover:bg-ink-200/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 pt-2 pb-1.5">
        <div className="relative flex items-center">
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 text-ink-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search (⌘K)"
            className="w-full text-xs bg-white text-ink-900 border border-ink-200 rounded-md pl-8 pr-7 py-1.5 placeholder-ink-400 focus:outline-none focus:border-ink-400 focus:ring-1 focus:ring-ink-400 transition-colors shadow-2xs"
            aria-label="Search notes"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-ink-400 hover:text-ink-700 p-0.5 text-xs"
              title="Clear search (Esc)"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-xs text-ink-400">
            {searchQuery ? 'No matching notes' : 'No notes yet'}
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold text-ink-400 uppercase tracking-wider flex items-center gap-1">
                  <span>📌 Pinned</span>
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {pinnedNotes.map((note) => {
                    const flatIdx = allFilteredFlat.findIndex(n => n.id === note.id);
                    const isActive = note.id === activeId;
                    const previewText = stripHtml(note.contentHtml);
                    return (
                      <div
                        key={note.id}
                        data-note-item
                        tabIndex={0}
                        onClick={() => handleItemSelect(note.id)}
                        onKeyDown={e => handleNoteKeyDown(e, flatIdx, allFilteredFlat)}
                        className={`group relative flex flex-col px-2.5 py-2 rounded-md cursor-pointer text-left transition-colors duration-100 outline-none focus:ring-1 focus:ring-ink-400 ${
                          isActive
                            ? 'bg-white text-ink-950 shadow-2xs border border-ink-200'
                            : 'text-ink-700 hover:bg-ink-100/70 hover:text-ink-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs truncate font-medium ${!note.title ? 'italic text-ink-400' : ''}`}>
                            {note.title.trim() || 'Untitled'}
                          </span>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={(e) => onTogglePin(note.id, e)}
                              className="text-ink-400 hover:text-ink-950 p-0.5 transition-colors"
                              title="Unpin note"
                            >
                              <span className="text-[11px]">📌</span>
                            </button>
                            <button
                              onClick={(e) => onDeleteNote(note.id, e)}
                              className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-600 p-0.5 transition-opacity"
                              title="Delete note"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px] text-ink-400">
                          <span className="truncate max-w-[140px] text-[11px] text-ink-500 font-normal">
                            {previewText || 'No content'}
                          </span>
                          <span className="shrink-0 text-[10px]">
                            {formatRelativeTime(note.updatedAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Regular Notes Section */}
            {regularNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <div className="px-2 py-1 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">
                    Notes
                  </div>
                )}
                <div className="space-y-0.5 mt-0.5">
                  {regularNotes.map((note) => {
                    const flatIdx = allFilteredFlat.findIndex(n => n.id === note.id);
                    const isActive = note.id === activeId;
                    const previewText = stripHtml(note.contentHtml);
                    return (
                      <div
                        key={note.id}
                        data-note-item
                        tabIndex={0}
                        onClick={() => handleItemSelect(note.id)}
                        onKeyDown={e => handleNoteKeyDown(e, flatIdx, allFilteredFlat)}
                        className={`group relative flex flex-col px-2.5 py-2 rounded-md cursor-pointer text-left transition-colors duration-100 outline-none focus:ring-1 focus:ring-ink-400 ${
                          isActive
                            ? 'bg-white text-ink-950 shadow-2xs border border-ink-200'
                            : 'text-ink-700 hover:bg-ink-100/70 hover:text-ink-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs truncate font-medium ${!note.title ? 'italic text-ink-400' : ''}`}>
                            {note.title.trim() || 'Untitled'}
                          </span>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={(e) => onTogglePin(note.id, e)}
                              className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-ink-950 p-0.5 transition-opacity"
                              title="Pin note"
                            >
                              <span className="text-[11px] grayscale">📌</span>
                            </button>
                            <button
                              onClick={(e) => onDeleteNote(note.id, e)}
                              className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-600 p-0.5 transition-opacity"
                              title="Delete note"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px] text-ink-400">
                          <span className="truncate max-w-[140px] text-[11px] text-ink-500 font-normal">
                            {previewText || 'No content'}
                          </span>
                          <span className="shrink-0 text-[10px]">
                            {formatRelativeTime(note.updatedAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer toolbar */}
      <div className="p-2.5 border-t border-ink-200/60 bg-ink-50/50 flex items-center justify-between text-xs text-ink-500">
        <span className="text-[11px]">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>

        <div className="flex items-center space-x-1">
          {/* Export JSON */}
          <button
            onClick={onExportAll}
            title="Export JSON backup"
            className="p-1 rounded text-ink-500 hover:text-ink-900 hover:bg-ink-200/60 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import JSON backup"
            className="p-1 rounded text-ink-500 hover:text-ink-900 hover:bg-ink-200/60 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Shortcuts Cheatsheet Modal */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts (⌘/)"
            className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-ink-200 bg-white text-ink-700 hover:bg-ink-100 hover:text-ink-950 transition-colors"
          >
            ⌘/
          </button>
        </div>
      </div>
    </aside>
  </>
  );
};
