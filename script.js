let deck = [];
let currentIndex = 0;
let isFlipped = false;

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

function startStudying() {
    const input = document.getElementById('card-input').value;
    deck = parseFlashcards(input);

    if (deck.length === 0) {
        alert('No flashcards found. Please check your formatting.');
        return;
    }

    document.getElementById('input-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    currentIndex = 0;
    showCard();
}

function showCard() {
    if (deck.length === 0) {
        showComplete();
        return;
    }

    isFlipped = false;
    const card = deck[currentIndex];
    const cardDisplay = document.getElementById('card-display');
    const controls = document.getElementById('controls');
    const counter = document.getElementById('counter');

    counter.textContent = `${deck.length} cards remaining`;
    cardDisplay.innerHTML = `<div class="card-front">${card.front}</div>`;
    controls.style.display = 'none';
}

function flipCard() {
    if (isFlipped) return;

    isFlipped = true;
    const card = deck[currentIndex];
    const cardDisplay = document.getElementById('card-display');
    const controls = document.getElementById('controls');

    cardDisplay.innerHTML = `
        <div class="card-front">${card.front}</div>
        <div class="card-back">${card.back}</div>
    `;
    controls.style.display = 'flex';
}

function handleEasy() {
    // Remove card from deck
    deck.splice(currentIndex, 1);
    
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
            <h1>Session Complete</h1>
            <p>All cards reviewed.</p>
            <button onclick="location.reload()">Start Over</button>
        </div>
    `;
}

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