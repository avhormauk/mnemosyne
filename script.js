// Global state
let deck = [];
let currentIndex = 0;
let isFlipped = false;
let completedCount = 0;
let againCount = 0;
let hardCount = 0;
let isShuffleEnabled = false;
let isHudHidden = false;
let actionHistory = []; // Store the history of card actions for undo
let isEditing = false;

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

    // Update input screen card count
    const inputStats = document.getElementById('input-stats');
    if (inputStats) {
        inputStats.textContent = cards.length;
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
    
    shuffleBtn.classList.add('button-flash');
    setTimeout(() => {
        shuffleBtn.classList.remove('button-flash');
    }, 200);
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
    const inputScreen = document.getElementById('input-screen');
    const studyScreen = document.getElementById('study-screen');
    
    inputScreen.classList.add('fade-out');
    setTimeout(() => {
        inputScreen.style.display = 'none';
        inputScreen.classList.remove('fade-out');
        studyScreen.style.display = 'block';
        studyScreen.classList.add('fade-in');
        currentIndex = 0;
        completedCount = 0;
        againCount = 0;
        hardCount = 0;
        showCard();
    }, 200);
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

function flashButton(type) {
    const controls = document.getElementById('controls');
    const buttons = controls.getElementsByTagName('button');
    let button;
    
    if (type === 'easy') button = buttons[2];
    else if (type === 'hard') button = buttons[1];
    else if (type === 'again') button = buttons[0];
    
    button.classList.add('button-flash');
    setTimeout(() => {
        button.classList.remove('button-flash');
    }, 150);
}

function handleEasy() {
    flashButton('easy');
    const card = deck[currentIndex];
    deck.splice(currentIndex, 1);
    completedCount++;
    actionHistory.push({ type: 'easy', card, position: currentIndex });
    
    if (currentIndex >= deck.length) {
        currentIndex = 0;
    }
    
    setTimeout(() => showCard(), 150);
}

function handleHard() {
    flashButton('hard');
    const card = deck.splice(currentIndex, 1)[0];
    deck.push(card);
    hardCount++;
    actionHistory.push({ type: 'hard', card, position: currentIndex });
    
    if (currentIndex >= deck.length) {
        currentIndex = 0;
    }
    
    setTimeout(() => showCard(), 150);
}

function handleAgain() {
    flashButton('again');
    const card = deck.splice(currentIndex, 1)[0];
    const newPosition = Math.min(currentIndex + 3, deck.length);
    deck.splice(newPosition, 0, card);
    againCount++;
    actionHistory.push({ type: 'again', card, position: currentIndex, newPosition });
    
    if (currentIndex >= deck.length) {
        currentIndex = 0;
    }
    
    setTimeout(() => showCard(), 150);
}

function undoLastAction() {
    if (actionHistory.length === 0) return;
    
    const lastAction = actionHistory.pop();
    
    switch (lastAction.type) {
        case 'easy':
            deck.splice(lastAction.position, 0, lastAction.card);
            completedCount--;
            break;
        case 'hard':
            deck.pop(); // Remove from end
            deck.splice(lastAction.position, 0, lastAction.card);
            hardCount--;
            break;
        case 'again':
            deck.splice(lastAction.newPosition, 1); // Remove from new position
            deck.splice(lastAction.position, 0, lastAction.card);
            againCount--;
            break;
    }
    
    currentIndex = lastAction.position;
    const wasFlipped = isFlipped;
    showCard();
    if (wasFlipped) {
        flipCard();
    }
}

function toggleHud() {
    isHudHidden = !isHudHidden;
    document.getElementById('study-screen').classList.toggle('hud-hidden', isHudHidden);
    document.querySelector('.fixed-controls').classList.toggle('hidden', isHudHidden);
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
    const studyScreen = document.getElementById('study-screen');
    const inputScreen = document.getElementById('input-screen');
    
    studyScreen.classList.add('fade-out');
    setTimeout(() => {
        studyScreen.style.display = 'none';
        studyScreen.classList.remove('fade-out');
        inputScreen.style.display = 'block';
        inputScreen.classList.add('fade-in');
        document.querySelector('.fixed-controls').classList.remove('hidden');
    }, 200);
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
    if (isFlipped) {
        answerEl.textContent = deck[currentIndex].back;
    }
    
    // Restore click-to-flip
    cardContainer.onclick = () => flipCard();
    
    // Exit edit mode
    isEditing = false;
}

function startCardEdit() {
    isEditing = true;
    const questionEl = document.getElementById('card-question');
    const answerEl = document.getElementById('card-answer');
    const cardContainer = document.querySelector('.card-container');
    
    // Disable click-to-flip while editing
    cardContainer.onclick = null;
    
    // Enable editing on question
    questionEl.setAttribute('contenteditable', 'true');
    
    // Only enable answer editing if card is flipped
    if (isFlipped) {
        answerEl.setAttribute('contenteditable', 'true');
        // Set cursor to end of answer
        answerEl.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(answerEl);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    } else {
        // Just focus on question if not flipped
        questionEl.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(questionEl);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
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
    
    // Only update answer if it was being edited (card was flipped)
    if (isFlipped) {
        deck[currentIndex].back = answerEl.textContent.trim();
    }
    
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

// Character-by-character reveal animation for title
function animateTitle() {
    const title = document.getElementById('title');
    const text = title.textContent;
    title.textContent = '';
    title.style.opacity = '1';
    
    const chars = text.split('');
    chars.forEach((char, i) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'char-reveal';
        span.style.animationDelay = `${i * 0.05}s`;
        title.appendChild(span);
    });
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

    // Animate title
    animateTitle();

    // Setup input text change handler for live card count
    const textarea = document.getElementById('card-input');
    textarea.addEventListener('input', () => {
        parseFlashcards(textarea.value);
    });
    // Initial count
    parseFlashcards(textarea.value);

    // Setup keyboard controls
    document.addEventListener('keydown', (e) => {
        // First check if we're in edit mode
        if (isEditing) {
            handleCardKeyEvents(e);
            return;
        }

        // Check if we're on input screen for Ctrl+Enter
        const inputScreen = document.getElementById('input-screen');
        if (getComputedStyle(inputScreen).display === 'block') {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                startStudying();
                return;
            }
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

        // 'i' or '?' to toggle help - only if not in textarea
        const textarea = document.getElementById('card-input');
        if ((e.key.toLowerCase() === 'i' || e.key === '?') && document.activeElement !== textarea) {
            e.preventDefault();
            toggleHelp();
            return;
        }

        const studyScreen = document.getElementById('study-screen');
        // Only process other keyboard events if study screen is visible
        if (getComputedStyle(studyScreen).display === 'none') return;
        
        // Handle spacebar
        if (e.code === 'Space') {
            e.preventDefault();
            if (deck.length === 0) {
                restartSession();
            } else if (!isFlipped) {
                flipCard();
            } else {
                handleEasy(); // Space triggers "easy" when card is flipped
            }
        } 
        // Handle keys when card is flipped
        else if (isFlipped && deck.length > 0) {
            if (e.key === '1') {
                e.preventDefault();
                handleAgain();
            } else if (e.key === '2') {
                e.preventDefault();
                handleHard();
            } else if (e.key === '3') {
                e.preventDefault();
                handleEasy();
            } else if (e.key.toLowerCase() === 'e') {
                e.preventDefault();
                startCardEdit();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                undoLastAction();
            } else if (e.key.toLowerCase() === 'h') {
                e.preventDefault();
                toggleHud();
            }
        } 
        // Handle navigation and other controls
        else if (deck.length > 0) {
            if (e.key === 'ArrowLeft' && !isFlipped) {
                e.preventDefault();
                navigateBack();
            } else if (e.key === 'ArrowRight' && !isFlipped) {
                e.preventDefault();
                navigateForward();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                undoLastAction();
            } else if (e.key.toLowerCase() === 'h') {
                e.preventDefault();
                toggleHud();
            } else if (e.key.toLowerCase() === 'e') {
                e.preventDefault();
                startCardEdit();
            }
        }
    });
});