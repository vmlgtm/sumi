import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotes } from './hooks/useNotes';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { ShortcutsModal } from './components/ShortcutsModal';

export const App: React.FC = () => {
  const {
    notes,
    filteredNotes,
    activeNote,
    activeId,
    searchQuery,
    saveStatus,
    isLoading,
    setSearchQuery,
    createNote,
    selectNote,
    updateActiveNote,
    togglePin,
    deleteNote,
    exportAllToJson,
    exportActiveToMarkdown,
    importFromJson,
  } = useNotes();

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  const handleOpenFullTab = useCallback(() => {
    window.open(window.location.href, '_blank');
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const isAlt = e.altKey;

      const activeEl = document.activeElement;
      const isTyping =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.getAttribute('contenteditable') === 'true';

      // Cmd + K: Focus Search
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isSidebarCollapsed) setIsSidebarCollapsed(false);
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // New Note: Option + N (⌥N) or Cmd + Option + N (avoids browser's Cmd+N new window), or Cmd + N if allowed
      if (
        (isAlt && (e.code === 'KeyN' || e.key.toLowerCase() === 'n')) ||
        (isMod && isAlt && (e.code === 'KeyN' || e.key.toLowerCase() === 'n')) ||
        (isMod && (e.key === 'n' || e.key === 'N'))
      ) {
        e.preventDefault();
        createNote();
        requestAnimationFrame(() => {
          titleInputRef.current?.focus();
        });
        return;
      }

      // Quick key 'c' or 'n' when not typing in an input or editor
      if (!isMod && !isAlt && !e.shiftKey && !isTyping) {
        if (e.key === 'c' || e.key === 'C' || e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          createNote();
          requestAnimationFrame(() => {
            titleInputRef.current?.focus();
          });
          return;
        }
      }

      // Cmd + P: Toggle Pin
      if (isMod && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        togglePin();
        return;
      }

      // Cmd + /: Shortcuts modal
      if (isMod && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }

      // Cmd + Backspace: Delete Note
      if (isMod && e.key === 'Backspace') {
        if (activeId && document.activeElement !== searchInputRef.current) {
          // If cursor is not in an active editable input that is doing standard backspace
          const tagName = document.activeElement?.tagName.toLowerCase();
          const isContentEditable = document.activeElement?.getAttribute('contenteditable') === 'true';

          if (tagName !== 'input' && !isContentEditable) {
            e.preventDefault();
            deleteNote(activeId);
            showToast('Note deleted');
          }
        }
      }

      // Escape: Dismiss
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    createNote,
    togglePin,
    deleteNote,
    activeId,
    searchQuery,
    setSearchQuery,
    isShortcutsOpen,
    isSidebarCollapsed,
    showToast,
  ]);

  const handleImportBackup = async (file: File) => {
    const res = await importFromJson(file);
    if (res.success) {
      showToast(`Imported ${res.count} notes successfully`);
    } else {
      showToast(`Import error: ${res.error}`);
    }
  };

  const handleDeleteWithFeedback = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    deleteNote(id);
    showToast('Note deleted');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white text-ink-900 select-none">
        <div className="flex flex-col items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-ink-950 text-white flex items-center justify-center font-bold text-sm shadow-sm animate-pulse">
            墨
          </span>
          <span className="text-xs font-medium text-ink-400">Loading Sumi...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-white text-ink-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        notes={notes}
        filteredNotes={filteredNotes}
        activeId={activeId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectNote={selectNote}
        onCreateNote={createNote}
        onTogglePin={(id, e) => {
          e.stopPropagation();
          togglePin(id);
        }}
        onDeleteNote={handleDeleteWithFeedback}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onExportAll={exportAllToJson}
        onImportBackup={handleImportBackup}
        searchRef={searchInputRef}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Editor Main Canvas */}
      <Editor
        note={activeNote}
        saveStatus={saveStatus}
        onUpdate={updateActiveNote}
        onTogglePin={() => togglePin()}
        onDelete={() => {
          if (activeId) handleDeleteWithFeedback(activeId);
        }}
        onExportMarkdown={exportActiveToMarkdown}
        onOpenFullTab={handleOpenFullTab}
        onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
        isSidebarCollapsed={isSidebarCollapsed}
        titleInputRef={titleInputRef}
      />

      {/* Shortcuts Cheatsheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-ink-950 text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
