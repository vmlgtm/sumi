import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Note, SaveStatus, SumiExportData } from '../types';
import { storage } from '../db';
import { isNoteEmpty, htmlToMarkdown, downloadFile, createWelcomeNote, stripHtml } from '../utils';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isLoading, setIsLoading] = useState(true);

  const notesRef = useRef<Note[]>([]);
  notesRef.current = notes;

  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel for instant cross-tab / cross-window sync
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('sumi_sync_channel');
      syncChannelRef.current = channel;

      channel.onmessage = async (e) => {
        if (e.data?.type === 'note_updated') {
          try {
            const loaded = await storage.getAllNotes();
            const sorted = loaded.sort((a, b) => {
              if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
              return b.updatedAt - a.updatedAt;
            });
            setNotes(sorted);
          } catch {
            // Silently ignore
          }
        }
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  // Initialize and load notes
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const loaded = await storage.getAllNotes();
        if (!mounted) return;

        // Check if a specific note was requested via URL query (e.g. Omnibox navigation)
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const targetNoteId = urlParams?.get('noteId');

        if (loaded.length === 0) {
          const welcome = createWelcomeNote();
          await storage.saveNote(welcome);
          if (mounted) {
            setNotes([welcome]);
            setActiveId(welcome.id);
            setIsLoading(false);
          }
        } else {
          // Sort loaded notes: pinned first, then updatedAt desc
          const sorted = [...loaded].sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.updatedAt - a.updatedAt;
          });
          if (mounted) {
            setNotes(sorted);
            const initialId = (targetNoteId && sorted.some(n => n.id === targetNoteId))
              ? targetNoteId
              : (sorted[0]?.id || null);
            setActiveId(initialId);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to load notes', err);
        if (mounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // Sync state when tab or side panel regains focus
  useEffect(() => {
    const handleFocus = async () => {
      try {
        const loaded = await storage.getAllNotes();
        if (loaded.length > 0) {
          const sorted = [...loaded].sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.updatedAt - a.updatedAt;
          });
          setNotes(sorted);
        }
      } catch {
        // Silently ignore
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Ghost note pruner helper
  const pruneGhostNote = useCallback((noteId: string) => {
    const target = notesRef.current.find(n => n.id === noteId);
    if (target && isNoteEmpty(target.title, target.contentHtml)) {
      storage.deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      syncChannelRef.current?.postMessage({ type: 'note_updated', noteId });
      return true;
    }
    return false;
  }, []);

  // Flush pending save immediately on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentId = activeIdRef.current;
      if (!currentId) return;

      const current = notesRef.current.find(n => n.id === currentId);
      if (!current) return;

      if (isNoteEmpty(current.title, current.contentHtml)) {
        storage.deleteNote(current.id);
      } else {
        storage.saveNote(current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  // Create a new note
  const createNote = useCallback((initialTitle = '', initialContent = '') => {
    // Prune current note if it was empty
    if (activeIdRef.current) {
      pruneGhostNote(activeIdRef.current);
    }

    const newNote: Note = {
      id: 'note_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: initialTitle,
      contentHtml: initialContent,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes(prev => [newNote, ...prev]);
    setActiveId(newNote.id);
    setSearchQuery('');
    storage.saveNote(newNote);
    syncChannelRef.current?.postMessage({ type: 'note_updated', noteId: newNote.id });
    return newNote;
  }, [pruneGhostNote]);

  // Select a note with ghost pruning of previously active note
  const selectNote = useCallback((id: string) => {
    if (id === activeIdRef.current) return;

    if (activeIdRef.current) {
      pruneGhostNote(activeIdRef.current);
    }

    setActiveId(id);
  }, [pruneGhostNote]);

  // Active note reference
  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeId) || null;
  }, [notes, activeId]);

  // Update active note content & debounced quiet persist
  const updateActiveNote = useCallback((updates: Partial<Pick<Note, 'title' | 'contentHtml'>>) => {
    const currentId = activeIdRef.current;
    if (!currentId) return;

    const now = Date.now();

    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === currentId);
      if (idx === -1) return prev;

      const updated = {
        ...prev[idx],
        ...updates,
        updatedAt: now,
      };

      const next = [...prev];
      next[idx] = updated;

      // Re-sort: pinned first, then updatedAt desc
      return next.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    });

    // AC-FIX-1: Quiet Save - Do NOT flicker 'saving' status on every keystroke!
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const noteToSave = notesRef.current.find(n => n.id === currentId);
      if (noteToSave) {
        if (isNoteEmpty(noteToSave.title, noteToSave.contentHtml)) {
          await storage.deleteNote(noteToSave.id);
        } else {
          await storage.saveNote(noteToSave);
          syncChannelRef.current?.postMessage({ type: 'note_updated', noteId: noteToSave.id });
        }
      }

      // Show tranquil 'saved' checkmark only after typing stops for 1.2s
      setSaveStatus('saved');
      statusTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);
    }, 250);
  }, []);

  // Toggle pinned status
  const togglePin = useCallback((id?: string) => {
    const targetId = id || activeIdRef.current;
    if (!targetId) return;

    setNotes(prev => {
      const next = prev.map(n => {
        if (n.id === targetId) {
          const updated = { ...n, pinned: !n.pinned, updatedAt: Date.now() };
          storage.saveNote(updated);
          syncChannelRef.current?.postMessage({ type: 'note_updated', noteId: updated.id });
          return updated;
        }
        return n;
      });

      return next.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    });
  }, []);

  // Delete note
  const deleteNote = useCallback(async (id: string) => {
    await storage.deleteNote(id);
    syncChannelRef.current?.postMessage({ type: 'note_updated', noteId: id });

    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      if (activeIdRef.current === id) {
        const nextActive = next[0] ? next[0].id : null;
        setActiveId(nextActive);
      }
      return next;
    });
  }, []);

  // Filtered notes by search query (<5ms instant search)
  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;

    return notes.filter(n => {
      const titleMatch = n.title.toLowerCase().includes(q);
      if (titleMatch) return true;
      const plainContent = stripHtml(n.contentHtml).toLowerCase();
      return plainContent.includes(q);
    });
  }, [notes, searchQuery]);

  // Export full database to JSON
  const exportAllToJson = useCallback(() => {
    const data: SumiExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      notes: notesRef.current,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(`sumi-backup-${dateStr}.json`, jsonStr, 'application/json');
  }, []);

  // Export active note to Markdown
  const exportActiveToMarkdown = useCallback(() => {
    if (!activeNote) return;
    const md = htmlToMarkdown(activeNote.title, activeNote.contentHtml);
    const slug = (activeNote.title || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'note';
    downloadFile(`${slug}.md`, md, 'text/markdown');
  }, [activeNote]);

  // Import JSON backup
  const importFromJson = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let importedNotes: Note[] = [];
      if (Array.isArray(parsed)) {
        importedNotes = parsed;
      } else if (parsed && Array.isArray(parsed.notes)) {
        importedNotes = parsed.notes;
      }

      if (importedNotes.length === 0) {
        throw new Error('No valid notes found in file');
      }

      // Merge / validate
      const validNotes: Note[] = importedNotes.map(n => ({
        id: n.id || ('imported_' + Math.random().toString(36).substring(2, 8)),
        title: typeof n.title === 'string' ? n.title : '',
        contentHtml: typeof n.contentHtml === 'string' ? n.contentHtml : '',
        pinned: Boolean(n.pinned),
        createdAt: typeof n.createdAt === 'number' ? n.createdAt : Date.now(),
        updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : Date.now(),
      }));

      await storage.bulkSaveNotes(validNotes);
      const all = await storage.getAllNotes();
      const sorted = all.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });

      setNotes(sorted);
      if (sorted[0]) setActiveId(sorted[0].id);
      syncChannelRef.current?.postMessage({ type: 'note_updated', noteId: 'all' });
      return { success: true, count: validNotes.length };
    } catch (err: any) {
      console.error('Import failed', err);
      return { success: false, error: err.message || 'Invalid backup file' };
    }
  }, []);

  return {
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
  };
}
