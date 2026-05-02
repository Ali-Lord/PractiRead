let words = [];
let currIdx = 0;
let isPaused = true;
let timer = null;

const display = document.getElementById('reader-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const wpmInput = document.getElementById('wpm');

/**
 * RSVP Loop.
 * TODO: slow down upon big words.
 * TODO: have a method to go forward and backward (like a music player)
 */
function playNextWord() {
  if (currIdx >= words.length) {
    stopReading();
    display.textContent = "Finished!"; // TODO: this is lame.
    return;
  }

  display.textContent = words[currIdx];
  currIdx++;

  const wpm = parseInt(wpmInput.value) || 300;
  const msPerWord = 60000 / wpm;

  timer = setTimeout(playNextWord, msPerWord);
}

function stopReading() {
  isPaused = true;
  clearTimeout(timer);
}

/**
 * Event Listeners
 */
startBtn.addEventListener('click', ()=> {
  if (!isPaused) return;

  const dummyAliText = "Did you know Ali Raz is in fact actually Tom Cruise? Yeah, I know. You're shocked, right? So was I when I first learnt that. Life comes with many surprises, but my favourite one has always been the fact that no one is as cool as Ali. Oh, man. How can a man be so perfect! Imagine my employer reading this. Oh, our Cybersecurity Engineer at our financial company in a FINANCIAL center is a crazy guy, hah";

  // TODO: allow multiple words on screen at the same time (perhaps up to 8?)
  if (words.length === 0) {
    words = dummyAliText.split(/\s+/);
  }

  isPaused = false;
  playNextWord();
});

wpmInput.addEventListener('change', ()=> {
  const val = parseInt(wpmInput.value);
  if (val < 10) wpmInput.value = 10;
  if (val > 10000) wpmInput.value = 10000;
});
