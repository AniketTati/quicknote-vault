const newNoteBtn = document.getElementById('newNoteBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const cancelNoteBtn = document.getElementById('cancelNoteBtn');
const newNoteSection = document.getElementById('newNoteSection');
const notesList = document.getElementById('notesList');
const noteContent = document.getElementById('noteContent');

// Toggle new note section
newNoteBtn.addEventListener('click', () => {
  newNoteSection.classList.remove('hidden');
  newNoteBtn.style.display = 'none';
});

cancelNoteBtn.addEventListener('click', () => {
  newNoteSection.classList.add('hidden');
  newNoteBtn.style.display = 'block';
  noteContent.value = '';
});

// Save note
saveNoteBtn.addEventListener('click', async () => {
  const content = noteContent.value.trim();
  if (!content) return alert('Note cannot be empty.');

  const currentTab = await getCurrentTab();
  const domain = currentTab.url ? new URL(currentTab.url).hostname : 'Unknown Domain';
  const note = {
    content,
    domain,
    created: Date.now(),
    expiry: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };

  chrome.storage.local.get({ notes: [] }, (result) => {
    const notes = [...result.notes, note];
    chrome.storage.local.set({ notes }, () => {
      renderNotes();
      noteContent.value = '';
      newNoteSection.classList.add('hidden');
      newNoteBtn.style.display = 'block';
    });
  });
});

// Render notes
function renderNotes() {
  chrome.storage.local.get({ notes: [] }, (result) => {
    notesList.innerHTML = '';
    const now = Date.now();
    const validNotes = result.notes.filter((note) => note.expiry > now);

    validNotes.forEach((note, index) => {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'note';
      noteDiv.innerHTML = `<span>${note.content} (${note.domain})</span><button data-index="${index}">🗑️</button>`;
      notesList.appendChild(noteDiv);
    });

    chrome.storage.local.set({ notes: validNotes });
  });
}

// Delete note
notesList.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const index = e.target.getAttribute('data-index');
    chrome.storage.local.get({ notes: [] }, (result) => {
      const notes = result.notes.filter((_, i) => i !== parseInt(index));
      chrome.storage.local.set({ notes }, renderNotes);
    });
  }
});

// Get the current tab
function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

// Initial rendering
renderNotes();
