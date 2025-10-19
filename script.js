let deck = [];
let currentIndex = 0;
let isFlipped = false;
let completedCount = 0;
let againCount = 0;
let hardCount = 0;

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

function startStudying() {
    const input = document.getElementById('card-input').value;
    let cards = parseFlashcards(input);

    if (cards.length === 0) {
        alert('no flashcards found. please check your formatting.');
        return;
    }

    // Check if shuffle is enabled
    const shouldShuffle = document.getElementById('shuffle-button').getAttribute('aria-pressed') === 'true';
    if (shouldShuffle) {
        cards = shuffleArray(cards);
    }

    deck = cards;
    document.getElementById('input-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    currentIndex = 0;
    completedCount = 0;
    againCount = 0;
    hardCount = 0;
    showCard();
}

function updateStats() {
    const stats = document.getElementById('stats');
    stats.innerHTML = `${deck.length} remaining, ${completedCount} completed, ${againCount} again, ${hardCount} hard`;
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

    questionEl.textContent = card.front;
    answerEl.textContent = '';
    answerEl.classList.remove('visible');
    controls.style.display = 'none';
    
    updateStats();
}

function flipCard() {
    if (isFlipped) return;

    isFlipped = true;
    const card = deck[currentIndex];
    const answerEl = document.getElementById('card-answer');
    const controls = document.getElementById('controls');

    answerEl.textContent = card.back;
    answerEl.classList.add('visible');
    controls.style.display = 'flex';
}

function handleEasy() {
    // Remove card from deck
    deck.splice(currentIndex, 1);
    completedCount++;
    
    // Adjust index if needed
    if (currentIndex >= deck.length) {
        currentIndex = 0;
    }
    
    showCard();
}

function handleHard() {
    // Move card to back of deck
    const card = deck.splice(currentIndex, 1)[0];
    deck.push(card);
    hardCount++;
    
    // Stay at same index (which now has the next card)
    if (currentIndex >= deck.length) {
        currentIndex = 0;
    }
    
    showCard();
}

function handleAgain() {
    // Move card 3 positions back
    const card = deck.splice(currentIndex, 1)[0];
    const newPosition = Math.min(currentIndex + 3, deck.length);
    deck.splice(newPosition, 0, card);
    againCount++;
    
    // Move to next card
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

function openEdit() {
    document.getElementById('study-screen').style.display = 'none';
    document.getElementById('input-screen').style.display = 'block';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    // Save theme preference
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function loadThemePreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
}

function restartSession() {
    // Save current theme state
    const isDarkMode = document.body.classList.contains('dark-mode');
    location.reload();
}

// Load theme preference when page loads
document.addEventListener('DOMContentLoaded', loadThemePreference);

function copyText() {
    const textarea = document.getElementById('card-input');
    textarea.select();
    document.execCommand('copy');
}

function pasteText() {
    navigator.clipboard.readText().then(text => {
        document.getElementById('card-input').value = text;
    }).catch(err => {
        console.error('failed to paste:', err);
    });
}

// Initialize shuffle button
document.addEventListener('DOMContentLoaded', () => {
    const shuffleBtn = document.getElementById('shuffle-button');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            const pressed = shuffleBtn.getAttribute('aria-pressed') === 'true';
            shuffleBtn.setAttribute('aria-pressed', (!pressed).toString());
        });
    }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    const studyScreen = document.getElementById('study-screen');
    if (studyScreen.style.display === 'none') return;

    if (deck.length === 0) return;

    if (e.code === 'Space') {
        e.preventDefault();
        if (!isFlipped) {
            flipCard();
        }
    } else if (isFlipped) {
        if (e.key === '1') {
            handleAgain();
        } else if (e.key === '2') {
            handleHard();
        } else if (e.key === '3') {
            handleEasy();
        }
    }
});