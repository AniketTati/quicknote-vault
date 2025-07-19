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
    if (chrome.runtime.lastError) {
      console.error('Error reading notes:', chrome.runtime.lastError);
      alert('Failed to save note. Please try again.');
      return;
    }
    
    const notes = [...result.notes, note];
    chrome.storage.local.set({ notes }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving note:', chrome.runtime.lastError);
        alert('Failed to save note. Please try again.');
        return;
      }
      
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
    if (chrome.runtime.lastError) {
      console.error('Error reading notes:', chrome.runtime.lastError);
      notesList.innerHTML = '<p>Error loading notes. Please refresh.</p>';
      return;
    }
    
    notesList.innerHTML = '';
    const now = Date.now();
    const validNotes = result.notes.filter((note) => note.expiry > now);

    validNotes.forEach((note, index) => {
      const daysRemaining = Math.ceil((note.expiry - now) / (1000 * 60 * 60 * 24));

      // Create the note container
      const noteDiv = document.createElement('div');
      noteDiv.className = 'note';

      // Create the note body
      const noteBody = document.createElement('div');
      noteBody.className = 'note-body';
      noteBody.textContent = note.content;
      noteDiv.appendChild(noteBody);

      // Create the footer
      const noteFooter = document.createElement('div');
      noteFooter.className = daysRemaining <= 7 ? 'note-footer expiring' : 'note-footer';

      const footerText = document.createElement('span');
      footerText.textContent = `${note.domain} | TTL: ${daysRemaining} days`;
      noteFooter.appendChild(footerText);

      // Add delete button - store the note's created timestamp as unique identifier
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.className = 'note-button';
      deleteBtn.setAttribute('data-created', note.created);
      deleteBtn.setAttribute('aria-label', 'Delete note');
      noteFooter.appendChild(deleteBtn);

      noteDiv.appendChild(noteFooter);
      notesList.appendChild(noteDiv);
    });

    // Save back valid notes (filtering out expired ones)
    chrome.storage.local.set({ notes: validNotes }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error updating notes:', chrome.runtime.lastError);
      }
    });
  });
}

// Delete note
notesList.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const createdTimestamp = e.target.getAttribute('data-created');
    chrome.storage.local.get({ notes: [] }, (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error reading notes for deletion:', chrome.runtime.lastError);
        alert('Failed to delete note. Please try again.');
        return;
      }
      
      // Filter out the note with matching created timestamp
      const notes = result.notes.filter((note) => note.created !== parseInt(createdTimestamp));
      chrome.storage.local.set({ notes }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error deleting note:', chrome.runtime.lastError);
          alert('Failed to delete note. Please try again.');
          return;
        }
        renderNotes();
      });
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
      <p><strong>Version:</strong> 1.0</p>
      <p><strong>Features:</strong></p>
      <ul>
        <li>Quick note creation</li>
        <li>Auto-expiry after 30 days</li>
        <li>Domain tracking</li>
        <li>Delete functionality</li>
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
