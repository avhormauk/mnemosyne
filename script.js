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

function startStudying() {
    const input = document.getElementById('card-input').value;
    let cards = parseFlashcards(input);

    if (cards.length === 0) {
        alert('no flashcards found. please check your formatting.');
        return;
    }

    // Check if shuffle is enabled (shuffle-button uses aria-pressed)
    const shuffleBtn = document.getElementById('shuffle-button');
    const shouldShuffle = shuffleBtn && shuffleBtn.getAttribute('aria-pressed') === 'true';
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
    stats.innerHTML = `
        ${deck.length} remaining • ${completedCount} completed • ${againCount} again • ${hardCount} hard
    `;
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
    studyScreen.innerHTML = `
        <div class="complete-screen">
            <h1>session complete</h1>
            <p>all cards reviewed.</p>
            <button onclick="location.reload()">start over</button>
        </div>
    `;
}

function openEdit() {
    document.getElementById('study-screen').style.display = 'none';
    document.getElementById('input-screen').style.display = 'block';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function copyText() {
    const textarea = document.getElementById('card-input');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value).catch(err => {
            console.error('clipboard write failed', err);
        });
    } else {
        textarea.select();
        document.execCommand('copy');
    }
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

// Wire up shuffle button behavior
document.addEventListener('DOMContentLoaded', () => {
    const shuffleBtn = document.getElementById('shuffle-button');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            const pressed = shuffleBtn.getAttribute('aria-pressed') === 'true';
            shuffleBtn.setAttribute('aria-pressed', String(!pressed));
        });
    }

    // Allow clicking question to flip
    const questionEl = document.getElementById('card-question');
    if (questionEl) {
        questionEl.addEventListener('click', () => {
            if (document.getElementById('study-screen').style.display !== 'none') {
                flipCard();
            }
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