// Sumi (墨) - Background Service Worker

// Enable side panel toggle when clicking the extension icon
if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Side panel behavior error:', error));
}

// Helpers for IndexedDB access in service worker
const DB_NAME = 'sumi_notes_db';
const STORE_NAME = 'notes';

function openNotesDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllNotesFromDB() {
  try {
    const db = await openNotesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error reading notes in background worker:', err);
    return [];
  }
}

async function saveNoteToDB(note) {
  try {
    const db = await openNotesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(note);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error saving note in background worker:', err);
  }
}

function escapeXml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripTags(html) {
  return (html || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

// Chrome Omnibox Engine (sumi <tab>)
if (typeof chrome !== 'undefined' && chrome.omnibox) {
  // Set default suggestion in the address bar
  chrome.omnibox.setDefaultSuggestion({
    description: 'Sumi: Search notes, append task with <match>%s</match>, or type <url>new &lt;title&gt;</url>'
  });

  chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
    const query = text.trim().toLowerCase();
    if (!query) return;

    const notes = await getAllNotesFromDB();
    const matches = notes.filter((n) => {
      const titleMatch = (n.title || '').toLowerCase().includes(query);
      if (titleMatch) return true;
      const contentMatch = stripTags(n.contentHtml).toLowerCase().includes(query);
      return contentMatch;
    }).slice(0, 5);

    const suggestions = matches.map((note) => {
      const title = escapeXml(note.title || 'Untitled');
      const snippet = escapeXml(stripTags(note.contentHtml).slice(0, 60));
      return {
        content: `open:${note.id}`,
        description: `${note.pinned ? '📌 ' : ''}<match>${title}</match> <dim>— ${snippet || 'No content'}</dim>`
      };
    });

    suggest(suggestions);
  });

  chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
    const trimmed = text.trim();
    let targetNoteId = null;

    if (trimmed.startsWith('open:')) {
      targetNoteId = trimmed.replace('open:', '');
    } else if (trimmed.toLowerCase().startsWith('new ')) {
      // Create new explicit note
      const newTitle = trimmed.slice(4).trim() || 'Untitled Note';
      const newNote = {
        id: 'note_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        title: newTitle,
        contentHtml: '<p><br></p>',
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveNoteToDB(newNote);
      targetNoteId = newNote.id;
    } else if (trimmed) {
      // Smart Capture (Option B): Append as task to pinned scratchpad
      const notes = await getAllNotesFromDB();
      const pinned = notes.find((n) => n.pinned);

      if (pinned) {
        const taskHtml = `<p class="task-item"><input type="checkbox" class="task-checkbox" contenteditable="false"><span class="task-text">${escapeXml(trimmed)}</span></p>`;
        pinned.contentHtml = (pinned.contentHtml || '') + taskHtml;
        pinned.updatedAt = Date.now();
        await saveNoteToDB(pinned);
        targetNoteId = pinned.id;
      } else {
        // Fallback: create new note
        const newNote = {
          id: 'note_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          title: trimmed,
          contentHtml: '<p><br></p>',
          pinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await saveNoteToDB(newNote);
        targetNoteId = newNote.id;
      }
    }

    const url = targetNoteId
      ? chrome.runtime.getURL(`index.html?noteId=${encodeURIComponent(targetNoteId)}`)
      : chrome.runtime.getURL('index.html');

    if (disposition === 'currentTab') {
      chrome.tabs.update({ url });
    } else {
      chrome.tabs.create({ url });
    }
  });
}
