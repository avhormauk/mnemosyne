// Global state
let deck = [];
let currentIndex = 0;
let isFlipped = false;
let completedCount = 0;
let againCount = 0;
let hardCount = 0;
let isShuffleEnabled = false;

function parseFlashcards(text) {
    const lines = text.split('\n');
    const cards = [];
    let currentFront = null;
    let currentBack = [];

    for (let line of lines) {
        line = line.trim();
        
        // Skip comments and empty lines
        if (line.startsWith('##') || line === '') {
            continue;
        }

        // New card front
        if (line.startsWith('**')) {
            // Save previous card if exists
            if (currentFront !== null && currentBack.length > 0) {
                cards.push({
                    front: currentFront,
                    back: currentBack.join('\n').trim()
                });
            }
            // Start new card
            currentFront = line.substring(2).trim();
            currentBack = [];
        }
        // Card back content
        else if (line.startsWith('//')) {
            currentBack.push(line.substring(2).trim());
        }
        // Continuation of back content
        else if (currentFront !== null) {
            currentBack.push(line);
        }
    }

    // Don't forget the last card
    if (currentFront !== null && currentBack.length > 0) {
        cards.push({
            front: currentFront,
            back: currentBack.join('\n').trim()
        });
    }

    return cards;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function toggleHelp() {
    const modal = document.getElementById('help-modal');
    modal.classList.toggle('visible');
}

function toggleShuffle() {
    isShuffleEnabled = !isShuffleEnabled;
    const shuffleBtn = document.getElementById('shuffle-button');
    shuffleBtn.setAttribute('aria-pressed', isShuffleEnabled.toString());
    shuffleBtn.classList.toggle('active');
}

function startStudying() {
    const input = document.getElementById('card-input').value;
    let cards = parseFlashcards(input);

    if (cards.length === 0) {
        alert('no flashcards found. please check your formatting.');
        return;
    }

    if (isShuffleEnabled) {
        cards = shuffleArray(cards);
    }

    deck = cards;
    document.getElementById('input-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    document.querySelector('.fixed-controls').classList.add('hidden');
    currentIndex = 0;
    completedCount = 0;
    againCount = 0;
    hardCount = 0;
    showCard();
}

function updateStats() {
    const stats = document.getElementById('stats');
    stats.textContent = deck.length;
}

function showCard() {
    if (deck.length === 0) {
        showComplete();
        return;
    }

    isFlipped = false;
    const card = deck[currentIndex];
    const questionEl = document.getElementById('card-question');
    const answerEl = document.getElementById('card-answer');
    const controls = document.getElementById('controls');
    const hintText = document.getElementById('hint-text');

    questionEl.textContent = card.front;
    questionEl.setAttribute('contenteditable', 'false');
    answerEl.textContent = '';
    answerEl.setAttribute('contenteditable', 'false');
    answerEl.classList.remove('visible');
    controls.style.display = 'none';
    if (hintText) hintText.style.display = 'block';
    
    updateStats();
}

function flipCard() {
    if (isFlipped || isEditing) return;

    isFlipped = true;
    const card = deck[currentIndex];
    const answerEl = document.getElementById('card-answer');
    const controls = document.getElementById('controls');
    const hintText = document.getElementById('hint-text');

    answerEl.textContent = card.back;
    answerEl.classList.add('visible');
    controls.style.display = 'flex';
    if (hintText) hintText.style.display = 'none';
}

function handleEasy() {
    deck.splice(currentIndex, 1);
    completedCount++;
    
    if (currentIndex >= deck.length) {
        currentIndex = 0;
    }
    
    showCard();
}

function handleHard() {
    const card = deck.splice(currentIndex, 1)[0];
    deck.push(card);
    hardCount++;
    
    if (currentIndex >= deck.length) {
        currentIndex = 0;
    }
    
    showCard();
}

function handleAgain() {
    const card = deck.splice(currentIndex, 1)[0];
    const newPosition = Math.min(currentIndex + 3, deck.length);
    deck.splice(newPosition, 0, card);
    againCount++;
    
    if (currentIndex >= deck.length) {
        currentIndex = 0;
    }
    
    showCard();
}

function showComplete() {
    const studyScreen = document.getElementById('study-screen');
    const content = `
        <div class="card-container completion">
            <div class="card-front">all cards reviewed</div>
        </div>
        <div class="controls">
            <button onclick="restartSession()">start over</button>
        </div>
    `;
    studyScreen.innerHTML = content;
}

function navigateBack() {
    if (deck.length === 0) return;
    currentIndex = (currentIndex - 1 + deck.length) % deck.length;
    showCard();
}

function navigateForward() {
    if (deck.length === 0) return;
    currentIndex = (currentIndex + 1) % deck.length;
    showCard();
}

function openEdit() {
    // Update textarea with any edited cards before switching views
    if (deck.length > 0) {
        const textarea = document.getElementById('card-input');
        let content = '';
        deck.forEach(card => {
            content += `**${card.front}\n//${card.back}\n\n`;
        });
        textarea.value = content.trim();
    }
    document.getElementById('study-screen').style.display = 'none';
    document.getElementById('input-screen').style.display = 'block';
    document.querySelector('.fixed-controls').classList.remove('hidden');
}

function cancelCardEdit() {
    const questionEl = document.getElementById('card-question');
    const answerEl = document.getElementById('card-answer');
    const cardContainer = document.querySelector('.card-container');
    
    // Disable editing and revert to original content
    questionEl.setAttribute('contenteditable', 'false');
    answerEl.setAttribute('contenteditable', 'false');
    
    // Restore original content
    questionEl.textContent = deck[currentIndex].front;
    answerEl.textContent = deck[currentIndex].back;
    
    // Restore click-to-flip
    cardContainer.onclick = () => flipCard();
    
    // Exit edit mode
    isEditing = false;
}

// Global state for edit mode
let isEditing = false;

function startCardEdit() {
    if (!isFlipped) return; // Only allow editing when card is flipped
    
    isEditing = true;
    const questionEl = document.getElementById('card-question');
    const answerEl = document.getElementById('card-answer');
    const cardContainer = document.querySelector('.card-container');
    
    // Disable click-to-flip while editing
    cardContainer.onclick = null;
    
    // Enable editing
    questionEl.setAttribute('contenteditable', 'true');
    answerEl.setAttribute('contenteditable', 'true');
    questionEl.focus();
}

// Main keyboard event handler for edit mode
function handleCardKeyEvents(e) {
    // Only handle events when in edit mode
    if (!isEditing) return;

    const questionEl = document.getElementById('card-question');
    const answerEl = document.getElementById('card-answer');
    
    // Save on Ctrl+Enter
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        saveCardEdits();
        return;
    }
    
    // Cancel edit on Escape
    if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation(); // Prevent main Escape handler
        cancelCardEdit();
        return;
    }
    
    // Allow normal typing including space and 'e'
    if (e.code === 'Space') {
        // Only prevent space from triggering flip
        e.stopPropagation();
    }
}

function saveCardEdits() {
    const questionEl = document.getElementById('card-question');
    const answerEl = document.getElementById('card-answer');
    const cardContainer = document.querySelector('.card-container');
    
    // Save changes
    questionEl.setAttribute('contenteditable', 'false');
    answerEl.setAttribute('contenteditable', 'false');
    
    // Update the current card
    deck[currentIndex].front = questionEl.textContent.trim();
    deck[currentIndex].back = answerEl.textContent.trim();
    
    // Update the input textarea immediately
    const textarea = document.getElementById('card-input');
    let content = '';
    deck.forEach(card => {
        content += `**${card.front}\n//${card.back}\n\n`;
    });
    textarea.value = content.trim();
    
    // Restore click-to-flip
    cardContainer.onclick = () => flipCard();
    
    // Exit edit mode
    isEditing = false;
}

function toggleTheme() {
    const isDarkMode = !document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
}

function restartSession() {
    // Preserve dark mode state
    const darkMode = localStorage.getItem('darkMode') === 'true';
    location.reload();
}

function copyText() {
    const textarea = document.getElementById('card-input');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value).catch(err => {
            console.error('clipboard write failed', err);
            fallbackCopy(textarea);
        });
    } else {
        fallbackCopy(textarea);
    }
}

function fallbackCopy(textarea) {
    textarea.select();
    document.execCommand('copy');
}

function pasteText() {
    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
            document.getElementById('card-input').value = text;
        }).catch(err => {
            console.error('failed to paste:', err);
        });
    } else {
        alert('paste not supported in this browser');
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Sync dark mode with html element - default to dark mode
    const savedDarkMode = localStorage.getItem('darkMode');
    const isDarkMode = savedDarkMode === null ? true : savedDarkMode === 'true';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark-mode');
    }
    
    // Save default if no preference exists
    if (savedDarkMode === null) {
        localStorage.setItem('darkMode', 'true');
    }

    // Setup keyboard controls
    document.addEventListener('keydown', (e) => {
        // First check if we're in edit mode
        if (isEditing) {
            handleCardKeyEvents(e);
            return;
        }

        if (e.key === 'Escape') {
            const helpModal = document.getElementById('help-modal');
            if (helpModal.classList.contains('visible')) {
                toggleHelp();
                return;
            }
            
            const studyScreen = document.getElementById('study-screen');
            if (getComputedStyle(studyScreen).display === 'block') {
                openEdit();
                return;
            }
        }

        const studyScreen = document.getElementById('study-screen');
        // Only process other keyboard events if study screen is visible
        if (getComputedStyle(studyScreen).display === 'none') return;
        
        if (e.code === 'Space') {
            e.preventDefault();
            if (deck.length === 0) {
                restartSession();
            } else if (!isFlipped) {
                flipCard();
            } else {
                handleEasy(); // Space triggers "easy" when card is flipped
            }
        } else if (isFlipped && deck.length > 0) {
            if (e.key === '1') {
                e.preventDefault();
                handleAgain();
            } else if (e.key === '2') {
                e.preventDefault();
                handleHard();
            } else if (e.key === '3') {
                e.preventDefault();
                handleEasy();
            } else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                startCardEdit();
            }
        } else if (!isFlipped && deck.length > 0) {
            // Arrow key navigation when card is not flipped
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                navigateBack();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                navigateForward();
            } else if (e.key.toLowerCase() === 'e' && isFlipped) {
                e.preventDefault();
                startCardEdit();
            }
        }
    });
});