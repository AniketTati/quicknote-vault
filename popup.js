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
      const daysRemaining = Math.ceil((note.expiry - now) / (1000 * 60 * 60 * 24));

      // Create the note container
      const noteDiv = document.createElement('div');
      noteDiv.className = 'note';
      noteDiv.style.border = '1px solid #ccc';
      noteDiv.style.marginBottom = '10px';
      noteDiv.style.borderRadius = '5px';
      noteDiv.style.padding = '10px';
      noteDiv.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';

      // Create the note body
      const noteBody = document.createElement('div');
      noteBody.textContent = note.content;
      noteBody.style.fontSize = '16px';
      noteBody.style.marginBottom = '10px';
      noteDiv.appendChild(noteBody);

      // Create the footer
      const noteFooter = document.createElement('div');
      noteFooter.style.display = 'flex';
      noteFooter.style.justifyContent = 'space-between';
      noteFooter.style.alignItems = 'center';
      noteFooter.style.fontSize = '14px';
      noteFooter.style.paddingTop = '5px';
      noteFooter.style.borderTop = '1px solid #ddd';
      noteFooter.style.color = daysRemaining <= 7 ? 'red' : '#333';

      const footerText = document.createElement('span');
      footerText.textContent = `${note.domain} | TTL: ${daysRemaining} days`;
      noteFooter.appendChild(footerText);

      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.style.border = 'none';
      deleteBtn.style.background = 'none';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.fontSize = '16px';
      deleteBtn.setAttribute('data-index', index);
      noteFooter.appendChild(deleteBtn);

      noteDiv.appendChild(noteFooter);
      notesList.appendChild(noteDiv);
    });

    // Save back valid notes (filtering out expired ones)
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

// Settings button functionality
document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settingsBtn');
  
  settingsBtn.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'settings-dialog';
    
    const content = `
      <h2>QuickNote Vault</h2>
      <p><strong>Version:</strong> 1.0.0</p>
      <p><strong>Features:</strong></p>
      <ul>
        <li>Quick note creation</li>
        <li>Auto-expiry after 30 days</li>
        <li>Domain tracking</li>
        <li>Edit & Delete functionality</li>
      </ul>
      <p><strong>Storage:</strong> Chrome Local Storage</p>
      <p><strong>Note Limit:</strong> Based on Chrome storage quota</p>
      <button id="closeSettings">Close</button>
    `;
    
    dialog.innerHTML = content;
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    const closeBtn = document.getElementById('closeSettings');
    const closeDialog = () => {
      overlay.remove();
      dialog.remove();
    };
    
    closeBtn.addEventListener('click', closeDialog);
    overlay.addEventListener('click', closeDialog);
  });
});
