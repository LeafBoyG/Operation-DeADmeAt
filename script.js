// ===================================
//  GAME CONFIGURATION
// ===================================
const REBOOT_PASSWORD = "1986";
const CLUE_1_TEXT = "19";
const CLUE_2_TEXT = "86";
const TARGET_FREQUENCY = { value: 72, tolerance: 4 };
const HACKING_WORDS = [
    "BIRTHDAY", "SYSTEMS", "TERMINAL", "COMPUTER", "OVERRIDE", 
    "SECURITY", "DATABASE", "ARCHIVE", "MEMORIES", "HOLOTAPE",
    "DRONFIELD", "SEPTEMBER", REBOOT_PASSWORD
];
// ===================================

// --- DOM ELEMENT SELECTORS & STATE ---
const body = document.body;
let foundClues = [];
let animationFrameId; let time = 0;

// --- INITIALIZATION ---
window.onload = () => {
    // MOVED the breakdown sequence to the top to ensure it always fires.
    setTimeout(() => { 
        if (body.classList.contains('state-pristine')) { 
            body.className = 'state-broken'; 
        } 
    }, 2000);

    // Initialize all puzzles after setting the breakdown timer.
    initializePowerPuzzle();
    initializeCablePuzzle();
    initializeTuningPuzzle();
    initializeHackingPuzzle();
};

// --- SUCCESS ANIMATION ---
function showSuccessAnimation(message, nextStateCallback) {
    const successOverlay = document.getElementById('success-overlay');
    const successText = document.getElementById('success-text');
    successText.innerHTML = message;
    successOverlay.classList.add('visible');
    setTimeout(() => { 
        successOverlay.classList.remove('visible'); 
        nextStateCallback(); 
    }, 2000);
}

// --- PUZZLE 1: POWER FUSE ---
function initializePowerPuzzle() { 
    const fuseBox = document.getElementById('fuse-box'); 
    const clue1 = document.getElementById('clue-1'); 
    clue1.textContent = CLUE_1_TEXT; 
    fuseBox.addEventListener('click', () => { 
        if (body.classList.contains('state-broken')) { 
            showSuccessAnimation("[ POWER GRID: ONLINE ]", () => { 
                body.className = 'state-power-on'; 
                collectClue(clue1, CLUE_1_TEXT); 
            }); 
        } 
    }); 
}

// --- PUZZLE 2: SVG CABLE LOGIC ---
function initializeCablePuzzle() {
    const svg = document.getElementById('cable-puzzle-svg');
    const plugEnd = document.getElementById('plug-end');
    const cablePath = document.getElementById('cable-path');
    const socket = document.getElementById('socket');
    const clue2 = document.getElementById('clue-2');
    clue2.textContent = CLUE_2_TEXT;
    
    const startX = 150, startY = 600, initialEndX = 200, initialEndY = 200;
    
    const resetPlug = () => {
        plugEnd.setAttribute('transform', `translate(${initialEndX}, ${initialEndY})`);
        updateCablePath(cablePath, startX, startY, initialEndX, initialEndY);
        plugEnd.style.pointerEvents = 'all';
    };
    resetPlug();
    
    function startDrag(e) {
        e.preventDefault();
        function move(e) {
            const coords = getMousePosition(svg, e);
            plugEnd.setAttribute('transform', `translate(${coords.x}, ${coords.y})`);
            updateCablePath(cablePath, startX, startY, coords.x, coords.y);
            if (isOverSocket(socket, coords)) { socket.classList.add('active'); } 
            else { socket.classList.remove('active'); }
        }
        function end(e) {
            svg.removeEventListener('mousemove', move);
            svg.removeEventListener('touchmove', move);
            svg.removeEventListener('mouseup', end);
            svg.removeEventListener('touchend', end);
            
            const finalCoords = getMousePosition(svg, e);
            
            if (isOverSocket(socket, finalCoords)) {
                const socketRect = socket.getBBox();
                const socketCenterX = socketRect.x + socketRect.width / 2;
                const socketCenterY = socketRect.y + socketRect.height / 2;
                plugEnd.setAttribute('transform', `translate(${socketCenterX}, ${socketCenterY})`);
                updateCablePath(cablePath, startX, startY, socketCenterX, socketCenterY);
                socket.classList.add('active');
                plugEnd.style.pointerEvents = 'none';
                showSuccessAnimation("[ VIDEO SIGNAL ACQUIRED ]", () => {
                    body.className = 'state-tuning';
                    document.getElementById('signal-tuning-overlay').style.display = 'flex';
                    startWaveAnimation();
                });
            } else {
                resetPlug();
            }
        }
        svg.addEventListener('mousemove', move);
        svg.addEventListener('touchmove', move);
        svg.addEventListener('mouseup', end);
        svg.addEventListener('touchend', end);
    }
    
    plugEnd.addEventListener('mousedown', startDrag);
    plugEnd.addEventListener('touchstart', startDrag);
    clue2.addEventListener('click', () => collectClue(clue2, CLUE_2_TEXT));
}

// --- PUZZLE 3: SIGNAL TUNING ---
function initializeTuningPuzzle() { 
    const freqSlider = document.getElementById('frequency-slider'); 
    const checkMatch = () => { 
        const freqDiff = Math.abs(freqSlider.value - TARGET_FREQUENCY.value); 
        if (freqDiff <= TARGET_FREQUENCY.tolerance) { 
            freqSlider.removeEventListener('input', checkMatch); 
            cancelAnimationFrame(animationFrameId); 
            document.getElementById('user-wave').style.stroke = 'var(--pip-boy-green)'; 
            showSuccessAnimation("[ SIGNAL STABLE ]", () => { 
                document.getElementById('signal-tuning-overlay').style.display = 'none'; 
                body.className = 'state-rebooting'; 
            }); 
        } 
    }; 
    freqSlider.addEventListener('input', checkMatch); 
}

// --- PUZZLE 4: HACKING MINIGAME ---
function initializeHackingPuzzle() { 
    const terminal = document.getElementById('hacking-terminal'); 
    const attemptsText = document.getElementById('attempts-text'); 
    let attemptsLeft = 4; 

    // Clear previous options before generating new ones
    terminal.innerHTML = '';
    attemptsText.textContent = `ATTEMPTS REMAINING: ${attemptsLeft}`;
    
    const shuffledWords = [...HACKING_WORDS].sort(() => 0.5 - Math.random()); 
    shuffledWords.forEach(word => { 
        const option = document.createElement('div'); 
        option.className = 'password-option'; 
        option.textContent = word; 
        option.addEventListener('click', handleHackAttempt); 
        terminal.appendChild(option); 
    }); 

    function handleHackAttempt(e) { 
        const clickedWord = e.target.textContent; 
        if (clickedWord === REBOOT_PASSWORD) { 
            showSuccessAnimation("[ SECURITY BYPASSED ]", () => { 
                runRebootSequence(); 
            }); 
        } else { 
            attemptsLeft--; 
            attemptsText.textContent = `ATTEMPTS REMAINING: ${attemptsLeft}`; 
            e.target.classList.add('deleted'); 
            
            if (attemptsLeft <= 0) { 
                showSuccessAnimation("[ SYSTEM LOCKOUT ]", () => { 
                    initializeHackingPuzzle(); // Reset the puzzle
                }); 
            } 
        } 
    } 
}

// --- FINAL SEQUENCES & HELPERS ---
async function runRebootSequence() { 
    const rebootOverlay = document.getElementById('reboot-overlay'); 
    rebootOverlay.innerHTML = `<div id="reboot-sequence" class="terminal-text"></div>`; 
    const sequenceText = document.getElementById('reboot-sequence'); 
    const lines = ["PASSCODE VERIFIED...", "DEFRAGMENTING MEMORY CORE...", "CALIBRATING EMOTION MODULES...", "LOADING BIRTHDAY PROTOCOL...", "EXECUTE: OPERATION BEST DAD"]; 
    for (const line of lines) { 
        sequenceText.innerHTML += `<p>${line}</p>`; 
        await new Promise(resolve => setTimeout(resolve, 700)); 
    } 
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    rebootOverlay.style.display = 'none'; 
    document.getElementById('final-reveal-overlay').style.display = 'flex'; 
    setTimeout(() => { 
        document.getElementById('final-reveal-overlay').style.display = 'none'; 
        body.className = 'state-fixed'; 
    }, 4000); 
}
function collectClue(clueElement, clueValue) { 
    const collectedCluesDisplay = document.querySelector('#reboot-overlay #collected-clues'); 
    if (clueElement.classList.contains('found') || !collectedCluesDisplay) return; 
    clueElement.classList.add('found'); 
    foundClues.push(clueValue); 
    collectedCluesDisplay.textContent = `CLUES FOUND: ${foundClues.join(' ')}`; 
}
function startWaveAnimation() { 
    const targetWave = document.getElementById('target-wave'); 
    const userWave = document.getElementById('user-wave'); 
    const freq = document.getElementById('frequency-slider'); 
    function animate() { 
        time += 0.5; 
        drawWave(targetWave, TARGET_FREQUENCY.value, 75, 50, time); 
        drawWave(userWave, freq.value, 75, 50, time); 
        animationFrameId = requestAnimationFrame(animate); 
    } 
    animate(); 
}
function drawWave(path, freq, amp, phase, time) { 
    const w = 800, h = 200; 
    const f = freq / 10, a = amp / 100 * (h / 2 - 5), p = phase / 100 * w; 
    let d = `M 0 ${h/2}`; 
    for (let x = 0; x < w; x++) { 
        d += ` L ${x} ${Math.sin((x + p + time) * f / 100) * a + h/2}`; 
    } 
    path.setAttribute('d', d); 
}
function updateCablePath(path, sx, sy, ex, ey) { 
    const cx = (sx + ex) / 2, cy = sy; 
    path.setAttribute('d', `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`); 
}
function getMousePosition(svg, e) { 
    const ctm = svg.getScreenCTM(); 
    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX); 
    const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY); 
    return { x: (clientX - ctm.e) / ctm.a, y: (clientY - ctm.f) / ctm.d }; 
}
function isOverSocket(socket, coords) { 
    const rect = socket.getBBox(); 
    return coords.x > rect.x && coords.x < rect.x + rect.width && coords.y > rect.y && coords.y < rect.y + rect.y + rect.height; 
}