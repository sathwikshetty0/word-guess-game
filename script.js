const WORDS = [
    'APPLE', 'BEACH', 'BRAIN', 'BREAD', 'BRUSH', 'CHAIR', 'CHEST', 'CHORD', 'CLICK', 'CLOCK',
    'CLOUD', 'DANCE', 'DIARY', 'DRINK', 'EARTH', 'FEAST', 'FIELD', 'FLAME', 'FLUTE', 'FRUIT',
    'GLASS', 'GRAPE', 'GREEN', 'GRIND', 'HEART', 'HOUSE', 'JUICE', 'LIGHT', 'LEMON', 'MELON',
    'MONEY', 'MUSIC', 'NIGHT', 'OCEAN', 'PARTY', 'PIANO', 'PILOT', 'PLANE', 'PHONE', 'PIZZA',
    'PLANT', 'RADIO', 'RIVER', 'ROBOT', 'SHIRT', 'SHOES', 'SMILE', 'SNAKE', 'SPACE', 'SPOON',
    'STORM', 'TABLE', 'TIGER', 'TOAST', 'TOUCH', 'TRAIN', 'TRUCK', 'VOICE', 'WATER', 'WATCH',
    'WHALE', 'WORLD', 'WRITE', 'YACHT', 'ZEBRA'
];

class LexiQuest {
    constructor() {
        this.targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        this.currentGuess = '';
        this.guesses = [];
        this.currentRowIdx = 0;
        this.isGameOver = false;

        this.board = document.getElementById('game-board');
        this.keyboard = document.getElementById('keyboard');
        this.messageContainer = document.getElementById('message-container');
        this.modalOverlay = document.getElementById('modal-overlay');

        this.init();
    }

    init() {
        this.initBoard();
        this.initKeyboard();
        this.setupEventListeners();
        console.log('Target word:', this.targetWord); // For debugging
    }

    initBoard() {
        this.board.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `tile-${i}-${j}`;
                row.appendChild(tile);
            }
            this.board.appendChild(row);
        }
    }

    initKeyboard() {
        const layout = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
        ];

        this.keyboard.innerHTML = '';
        layout.forEach(rowKeys => {
            const row = document.createElement('div');
            row.className = 'keyboard-row';
            rowKeys.forEach(key => {
                const btn = document.createElement('button');
                btn.className = 'key';
                btn.textContent = key === 'BACKSPACE' ? '⌫' : key;
                btn.dataset.key = key;
                if (key === 'ENTER' || key === 'BACKSPACE') btn.classList.add('large');
                btn.addEventListener('click', () => this.handleKeyPress(key));
                row.appendChild(btn);
            });
            this.keyboard.appendChild(row);
        });
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.isGameOver) return;
            const key = e.key.toUpperCase();
            if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
                this.handleKeyPress(key);
            }
        });

        document.getElementById('help-btn').addEventListener('click', () => {
            this.modalOverlay.classList.remove('hidden');
            document.getElementById('help-modal').classList.remove('hidden');
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.resetGame();
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.modalOverlay.classList.add('hidden');
                document.getElementById('help-modal').classList.add('hidden');
                document.getElementById('stats-modal').classList.add('hidden');
            });
        });

        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.modalOverlay.classList.add('hidden');
                document.getElementById('help-modal').classList.add('hidden');
                document.getElementById('stats-modal').classList.add('hidden');
            }
        });
    }

    handleKeyPress(key) {
        if (this.isGameOver) return;

        if (key === 'BACKSPACE' || key === 'DELETE') {
            this.currentGuess = this.currentGuess.slice(0, -1);
            this.updateBoard();
        } else if (key === 'ENTER') {
            this.submitGuess();
        } else if (this.currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
            this.currentGuess += key;
            this.updateBoard(true);
        }
    }

    updateBoard(typing = false) {
        const row = this.board.children[this.currentRowIdx];
        const tiles = row.children;

        for (let i = 0; i < 5; i++) {
            const tile = tiles[i];
            tile.textContent = this.currentGuess[i] || '';

            if (typing && i === this.currentGuess.length - 1) {
                tile.dataset.state = 'typing';
                setTimeout(() => tile.dataset.state = '', 100);
            } else {
                tile.dataset.state = '';
            }
        }
    }

    submitGuess() {
        if (this.currentGuess.length !== 5) {
            this.showMessage('Not enough letters');
            this.shakeRow();
            return;
        }

        const result = this.checkGuess(this.currentGuess);
        this.revealCells(result);
    }

    checkGuess(guess) {
        const result = new Array(5).fill('absent');
        const targetArr = this.targetWord.split('');
        const guessArr = guess.split('');

        // First pass: Correct positions
        guessArr.forEach((letter, i) => {
            if (letter === targetArr[i]) {
                result[i] = 'correct';
                targetArr[i] = null;
                guessArr[i] = null;
            }
        });

        // Second pass: Present but wrong position
        guessArr.forEach((letter, i) => {
            if (letter && targetArr.includes(letter)) {
                result[i] = 'present';
                targetArr[targetArr.indexOf(letter)] = null;
            }
        });

        return result;
    }

    revealCells(result) {
        const row = this.board.children[this.currentRowIdx];
        const tiles = row.children;
        this.isGameOver = true; // Temporary lock during animation

        result.forEach((status, i) => {
            setTimeout(() => {
                const tile = tiles[i];
                tile.classList.add('flip');

                setTimeout(() => {
                    tile.classList.add(status);
                    this.updateKeyboard(this.currentGuess[i], status);

                    if (i === 4) {
                        this.finishTurn();
                    }
                }, 300);
            }, i * 200);
        });
    }

    updateKeyboard(letter, status) {
        const keyBtn = document.querySelector(`.key[data-key="${letter}"]`);
        if (!keyBtn) return;

        if (keyBtn.classList.contains('correct')) return;
        if (keyBtn.classList.contains('present') && status === 'absent') return;

        keyBtn.classList.remove('present', 'absent');
        keyBtn.classList.add(status);
    }

    finishTurn() {
        if (this.currentGuess === this.targetWord) {
            this.showResults(true);
            this.bounceRow();
            this.isGameOver = true;
        } else if (this.currentRowIdx === 5) {
            this.showResults(false);
            this.isGameOver = true;
        } else {
            this.currentRowIdx++;
            this.currentGuess = '';
            this.isGameOver = false;
        }
    }

    showResults(won) {
        setTimeout(() => {
            const statsModal = document.getElementById('stats-modal');
            const statusText = document.getElementById('game-status-text');
            const wordDisplay = document.getElementById('target-word-display');

            this.modalOverlay.classList.remove('hidden');
            statsModal.classList.remove('hidden');

            statusText.textContent = won ? 'YOU WON! 🏆' : 'GAME OVER 💀';
            statusText.style.color = won ? 'var(--state-correct)' : 'var(--accent-secondary)';
            wordDisplay.textContent = this.targetWord;
        }, 1500);
    }

    resetGame() {
        this.targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        this.currentGuess = '';
        this.guesses = [];
        this.currentRowIdx = 0;
        this.isGameOver = false;

        this.modalOverlay.classList.add('hidden');
        document.getElementById('stats-modal').classList.add('hidden');
        document.getElementById('help-modal').classList.add('hidden');

        this.initBoard();
        this.initKeyboard();
        console.log('New target word:', this.targetWord);
    }

    showMessage(msg, persistent = false) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        this.messageContainer.appendChild(toast);

        if (!persistent) {
            setTimeout(() => toast.remove(), 2500);
        }
    }

    shakeRow() {
        const row = this.board.children[this.currentRowIdx];
        row.classList.add('shake');
        setTimeout(() => row.classList.remove('shake'), 500);
    }

    bounceRow() {
        const row = this.board.children[this.currentRowIdx];
        Array.from(row.children).forEach((tile, i) => {
            setTimeout(() => tile.classList.add('bounce'), i * 100);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LexiQuest();
});
