let words = [];
let currIdx = 0;
let isPaused = true;
let timer = null;

const display = document.getElementById('reader-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const wpdInput = document.getElementById('wpd');
const wpmInput = document.getElementById('wpm');

/*
 * Load data from the local storage
 */
browser.storage.local.get(['savedWpm', 'savedWpd']).then((result) => {
  if (result.savedWpd) { wpdInput.value = result.savedWpd; }
  if (result.savedWpm) { wpmInput.value = result.savedWpm; }

});

/**
 * RSVP Loop.
 * TODO: have a method to go forward and backward (like a music player)
 * TODO: n number of words to display and skip
 */
function playNextWord() {
  if (currIdx >= words.length) {
    stopReading();
    display.textContent = "Finished!"; // TODO: this is lame.
    return;
  }

  const word = words[currIdx];
  display.textContent = word;
  currIdx++;

  const baseWpm = parseInt(wpmInput.value) || 300;
  let msPerWord = 60000 / baseWpm;

  // Punctuation delay
  if (/[.,!?;]/.test(word)){
    msPerWord *= 2;
  }

  // Long words delay
  if (word.length > 7) {
    msPerWord *= 1.5;
  }

  timer = setTimeout(playNextWord, msPerWord);
}

function stopReading() {
  isPaused = true;
  clearTimeout(timer);
}

/**
 * Event Listeners
 */
startBtn.addEventListener('click', async ()=> {
  if (!isPaused) { return; }

  const tabs = await browser.tabs.query({ active: true, currentWindow: true});

  //const dummyAliText = "Did you know Ali Raz is in fact actually Tom Cruise? Yeah, I know. You're shocked, right? So was I when I first learnt that. Life comes with many surprises, but my favourite one has always been the fact that no one is as cool as Ali. Oh, man. How can a man be so perfect! Imagine my employer reading this. Oh, our Cybersecurity Engineer at our financial company in a FINANCIAL center is a crazy guy, hah";

  try {
    const resp = await browser.tabs.sendMessage(tabs[0].id, {action: "getSelectedText"});

    if (resp && resp.text) {
      words = resp.text.split(/\s+/);
      isPaused = false;
      display.textContent = "";
      playNextWord();
    } else {
      display.textContent = "Please hightlight text first.";
    }
  } catch (err) {
    display.textContent = "Cannot read this page.";
    console.error("Connection error:", err);
  }
});

pauseBtn.addEventListener('click', ()=> {
  stopReading();
});

/*
 * TODO: There's a bug that when the extension popup is closed and opened without leaving the input focus,
 * the val is allowed to be higher than my setup restriction for both wpm and wpd.
 * Solution that may work. Everytime popup opens, check the values if they're safe.
 */

wpdInput.addEventListener('change', ()=> {
  const val = parseInt(wpdInput.value);
  if (val < 1) { wpdInput.value = 1; }
  if (val > 8) { wpdInput.value = 8; }

  browser.storage.local.set({ savedWpd: val });
});

wpmInput.addEventListener('change', ()=> {
  const val = parseInt(wpmInput.value);
  if (val < 10) { wpmInput.value = 10; }
  if (val > 10000) { wpmInput.value = 10000; }

  browser.storage.local.set({ savedWpm: val });
});
