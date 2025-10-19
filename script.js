// ----------------------
// Theme toggle handling
// ----------------------
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

// ----------------------
// Help modal
// ----------------------
function toggleHelp() {
    const modal = document.getElementById('help-modal');
    modal.classList.toggle('visible');
}

// ----------------------
// Study logic
// ----------------------
let cards = [];
let currentIndex = 0;

function startStudying() {
    const input = document.getElementById('card-input').value.trim();
    if (!input) return alert("Please enter your flashcards first!");

    // Parse cards
    const matches = input.match(/\*\*(.*?)\n\/\/(.*?)(?=\n\*\*|$)/gs);
    if (!matches) return alert("No cards found!");
    
    cards = matches.map(pair => {
        const [, q, a] = pair.match(/\*\*(.*?)\n\/\/(.*)/s);
        return { question: q.trim(), answer: a.trim() };
    });

    currentIndex = 0;
    document.getElementById('input-screen').style.display = 'none';
    document.getElementById('study-screen').style.display = 'block';
    showCard();
}

function showCard() {
    const card = cards[currentIndex];
    document.getElementById('card-question').innerText = card.question;
    document.getElementById('card-answer').innerText = card.answer;
    document.getElementById('card-answer').classList.remove('visible');
    document.getElementById('controls').style.display = 'none';
    document.getElementById('stats').innerText = `${currentIndex + 1} / ${cards.length}`;
}

function flipCard() {
    const answer = document.getElementById('card-answer');
    answer.classList.toggle('visible');
    document.getElementById('controls').style.display = answer.classList.contains('visible') ? 'flex' : 'none';
}

function handleAgain() {
    cards.push(cards[currentIndex]);
    nextCard();
}

function handleHard() {
    cards.splice(currentIndex + 2, 0, cards[currentIndex]);
    nextCard();
}

function handleEasy() {
    nextCard();
}

function nextCard() {
    currentIndex++;
    if (currentIndex >= cards.length) {
        showCompletion();
        return;
    }
    showCard();
}

function showCompletion() {
    document.querySelector('.card-container').innerHTML = `
        <div class="card-front completion">all done! 🎉</div>
    `;
    document.getElementById('controls').innerHTML = `
        <button onclick="startAgain()">start again</button>
    `;
    document.getElementById('stats').innerText = "";
}

function startAgain() {
    document.getElementById('study-screen').style.display = 'none';
    document.getElementById('input-screen').style.display = 'flex';
    // Preserve dark mode; don't reload
}
