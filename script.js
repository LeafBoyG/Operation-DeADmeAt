// ===================================
//  GAME CONFIGURATION
// ===================================
const REBOOT_PASSWORD = "1986";
const CLUE_1_TEXT = "19";
const CLUE_2_TEXT = "86";
const TARGET_WAVEFORM = {
    frequency: 60,
    amplitude: 75,
    phase: 30,
    tolerance: 5
};
// ===================================


// --- DOM ELEMENT SELECTORS ---
const body = document.body;
const fuseBox = document.getElementById('fuse-box');
const rebootButton = document.getElementById('reboot-button');
const passwordInput = document.getElementById('password-input');
const rebootFeedback = document.getElementById('reboot-feedback');
const finalRevealOverlay = document.getElementById('final-reveal-overlay');
const clue1 = document.getElementById('clue-1');
const clue2 = document.getElementById('clue-2');
const collectedCluesDisplay = document.getElementById('collected-clues');
// SVG Cable Puzzle
const svg = document.getElementById('cable-puzzle-svg');
const plugEnd = document.getElementById('plug-end');
const cablePath = document.getElementById('cable-path');
const socket = document.getElementById('socket');
// Signal Tuning Puzzle
const signalTuningOverlay = document.getElementById('signal-tuning-overlay');
const freqSlider = document.getElementById('frequency-slider');
const ampSlider = document.getElementById('amplitude-slider');
const phaseSlider = document.getElementById('phase-slider');
const targetWavePath = document.getElementById('target-wave');
const userWavePath = document.getElementById('user-wave');


// --- GAME STATE VARIABLES ---
let foundClues = [];
let isDragging = false;
let animationFrameId; // To control the animation loop
let time = 0; // A counter to make the waves move


// --- GAME STATE LOGIC ---
window.onload = () => {
    clue1.textContent = CLUE_1_TEXT;
    clue2.textContent = CLUE_2_TEXT;
    initializeCablePuzzle();
    // Add event listeners for sliders here
    freqSlider.addEventListener('input', checkWaveMatch);
    ampSlider.addEventListener('input', checkWaveMatch);
    phaseSlider.addEventListener('input', checkWaveMatch);

    setTimeout(() => {
        if (body.classList.contains('state-pristine')) {
            body.className = 'state-broken';
        }
    }, 2000);
};


// --- PUZZLE 1: POWER FUSE ---
fuseBox.addEventListener('click', () => {
    if (body.classList.contains('state-broken')) {
        body.className = 'state-power-on';
        collectClue(clue1, CLUE_1_TEXT);
    }
});


// --- PUZZLE 2: SVG CABLE LOGIC ---
function initializeCablePuzzle() { /* ... no changes ... */ }
function startDrag(e) { e.preventDefault(); isDragging = true; plugEnd.style.cursor = 'grabbing'; }
function drag(e) { /* ... no changes ... */ }
function endDrag(e) {
    if (isDragging) {
        isDragging = false;
        plugEnd.style.cursor = 'grab';
        if (isOverSocket(getMousePosition(e))) {
            console.log("Display signal established.");
            plugEnd.style.display = 'none';
            socket.classList.add('active');
            const socketRect = socket.getBBox();
            updateCablePath(150, 600, socketRect.x + socketRect.width / 2, socketRect.y + socketRect.height / 2);
            setTimeout(() => {
                body.className = 'state-tuning';
                signalTuningOverlay.style.display = 'flex';
                // START the wave animation when the puzzle becomes visible
                startWaveAnimation();
            }, 500);
        } else {
            initializeCablePuzzle();
        }
    }
}
// Unchanged cable logic functions from previous steps...
function initializeCablePuzzle() { const startX = 150, startY = 600; const endX = 200, endY = 200; plugEnd.setAttribute('transform', `translate(${endX}, ${endY})`); updateCablePath(startX, startY, endX, endY); plugEnd.addEventListener('mousedown', startDrag); svg.addEventListener('mousemove', drag); svg.addEventListener('mouseup', endDrag); plugEnd.addEventListener('touchstart', startDrag); svg.addEventListener('touchmove', drag); svg.addEventListener('touchend', endDrag); }
function updateCablePath(startX, startY, endX, endY) { const controlX = (startX + endX) / 2; const controlY = startY; cablePath.setAttribute('d', `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`); }
function getMousePosition(e) { const CTM = svg.getScreenCTM(); const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX); const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY); return { x: (clientX - CTM.e) / CTM.a, y: (clientY - CTM.f) / CTM.d }; }
function isOverSocket(coords) { const socketRect = socket.getBBox(); return coords.x > socketRect.x && coords.x < socketRect.x + socketRect.width && coords.y > socketRect.y && coords.y < socketRect.y + socketRect.height; }


// --- NEW PUZZLE 3: ANIMATED SIGNAL TUNING LOGIC ---
function startWaveAnimation() {
    // This function creates a continuous animation loop
    function animate() {
        time += 0.5; // This makes the wave move
        
        // Redraw the target wave on each frame
        drawWave(targetWavePath, TARGET_WAVEFORM.frequency, TARGET_WAVEFORM.amplitude, TARGET_WAVEFORM.phase, time);
        
        // Redraw the user's wave on each frame with current slider values
        drawWave(userWavePath, freqSlider.value, ampSlider.value, phaseSlider.value, time);
        
        animationFrameId = requestAnimationFrame(animate);
    }
    animate(); // Start the loop
}

function drawWave(pathElement, freq, amp, phase, timeOffset) {
    const width = 800; const height = 200;
    const frequency = freq / 10;
    const amplitude = amp / 100 * (height / 2 - 10);
    const phaseShift = phase / 100 * width;

    let pathData = `M 0 ${height / 2}`;
    for (let x = 0; x < width; x++) {
        // The "timeOffset" is added here to create the scrolling animation
        const y = Math.sin((x + phaseShift + timeOffset) * frequency / 100) * amplitude + height / 2;
        pathData += ` L ${x} ${y}`;
    }
    pathElement.setAttribute('d', pathData);
}

function checkWaveMatch() {
    const freqDiff = Math.abs(freqSlider.value - TARGET_WAVEFORM.frequency);
    const ampDiff = Math.abs(ampSlider.value - TARGET_WAVEFORM.amplitude);
    const phaseDiff = Math.abs(phaseSlider.value - TARGET_WAVEFORM.phase);
    
    // Check if all sliders are within the tolerance
    if (freqDiff <= TARGET_WAVEFORM.tolerance && ampDiff <= TARGET_WAVEFORM.tolerance && phaseDiff <= TARGET_WAVEFORM.tolerance) {
        console.log("Signal locked! Proceeding to reboot.");
        
        // Stop the animation to save resources
        cancelAnimationFrame(animationFrameId);
        
        // "Snap" the user wave to the target wave perfectly
        drawWave(userWavePath, TARGET_WAVEFORM.frequency, TARGET_WAVEFORM.amplitude, TARGET_WAVEFORM.phase, time);
        userWavePath.style.stroke = '#2ecc71'; // Turn it solid green
        
        // Proceed to the next level after a short delay
        setTimeout(() => {
            signalTuningOverlay.style.display = 'none';
            body.className = 'state-rebooting';
        }, 1500); // 1.5-second delay to appreciate the match
    }
}


// --- CLUE LOGIC ---
clue2.addEventListener('click', () => collectClue(clue2, CLUE_2_TEXT));
function collectClue(clueElement, clueValue) {
    if (clueElement.classList.contains('found')) return;
    clueElement.classList.add('found');
    foundClues.push(clueValue);
    collectedCluesDisplay.textContent = `CLUES FOUND: ${foundClues.join(' ')}`;
}


// --- PUZZLE 4: REBOOT PASSWORD ---
rebootButton.addEventListener('click', checkPassword);
passwordInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') checkPassword(); });
function checkPassword() {
    if (passwordInput.value.toLowerCase() === REBOOT_PASSWORD.toLowerCase()) {
        rebootFeedback.textContent = "ACCESS GRANTED. SYSTEM REPAIRED.";
        finalRevealOverlay.style.display = 'flex';
        setTimeout(() => {
            finalRevealOverlay.style.display = 'none';
            body.className = 'state-fixed';
        }, 4000);
    } else {
        rebootFeedback.textContent = "ACCESS DENIED. INCORRECT PASSWORD.";
    }
}


// --- HELPER FUNCTION ---
function createJumbledContent() {
    const container = document.querySelector('.jumbled-content'); container.innerHTML = '';
    const imageUrls = ['images/photo1.jpg', 'images/photo2.jpg', 'images/photo3.jpg', 'images.photo4.jpg']; 
    for (let i = 0; i < 20; i++) {
        const img = document.createElement('img');
        img.src = imageUrls[Math.floor(Math.random() * imageUrls.length)];
        img.style.top = `${Math.random() * 100}%`; img.style.left = `${Math.random() * 100}%`; img.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(img);
    }
}