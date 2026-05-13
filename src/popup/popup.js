let words = [];
let currIdx = 0;
let isPaused = true;
let timer = null;

const display = document.getElementById('reader-display');
const readProgressInput = document.getElementById('readProgress');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const infoBtn = document.getElementById('info-btn');
const wpdInput = document.getElementById('wpd');
const wpmInput = document.getElementById('wpm');

/*
 * Load config data from the storage (browser local)
 */
browser.storage.local.get(['savedWpm', 'savedWpd']).then((result) => {
  if (result.savedWpd) { wpdInput.value = result.savedWpd; }
  if (result.savedWpm) { wpmInput.value = result.savedWpm; }

});

/**
 * RSVP Loop.
 */
function playNextWord() {
  updateProgressBar();

  if (currIdx >= words.length) {
    stopReading();
    display.textContent = "Finished!";
    return;
  }

  const chunk = renderTextChunk(true);

  const baseWpm = parseInt(wpmInput.value) || 300;
  let msPerWord = 60000 / baseWpm;

  // Punctuation delay
  if (/[.,!?;]/.test(chunk)){
    msPerWord *= 2;
  }

  timer = setTimeout(playNextWord, msPerWord);
}

function renderTextChunk(bShouldIncrementIdx) {
  const wpd = parseInt(wpdInput.value) || 1;
  let chunk = words[currIdx];
  let currNumWordsInChunk = 1;

  while (currNumWordsInChunk < wpd && (currIdx + currNumWordsInChunk) < words.length) {
    let nextWord = words[currIdx + currNumWordsInChunk];

    if (/[.,!?;]/.test(chunk)) { break;}

    if ((chunk.length + nextWord.length) < 18) {
      chunk += " " + nextWord;
      currNumWordsInChunk++;
    } else {
      break;
    }
  }

  display.textContent = chunk;
  if (bShouldIncrementIdx) { currIdx += currNumWordsInChunk; }

  return chunk;
}

function stopReading() {
  isPaused = true;
  clearTimeout(timer);
}

function updateProgressBar(bManualChange = false) {
  if (!bManualChange) { readProgressInput.value = (currIdx / words.length) * 100; }
  else {
    currIdx = parseInt((readProgressInput.value / 100) * words.length);
    renderTextChunk(false);
  }

  // To update progressbar color
  const min = parseFloat(readProgressInput.min) || 0;
  const max = parseFloat(readProgressInput.max) || 100;
  const currVal = parseFloat(readProgressInput.value);

  const progressPercentage = (currVal - min) / (max - min);

  const thumbWidth = 20;
  const offset = (0.5 - progressPercentage) * thumbWidth;
  const backgroundSize = `calc(${progressPercentage * 100}% + ${offset}px) 100%`;

  readProgressInput.style.backgroundSize = backgroundSize;
}

/**
 * Event Listeners
 */
readProgressInput.addEventListener('change', ()=>{
  updateProgressBar(true);
});

// TODO: check if have read highlighted text already (why did I write this comment? I had a fever, man)
// TODO: some websites have new line after a paragraph where there's no space between first and second paragraph.
// This causes two words to join togther from the end of first pargraph and the first word of second paragraph
// e.g. "look.Hello" Fix this later.
startBtn.addEventListener('click', async ()=> {
  if (!isPaused) { return; }

  const tabs = await browser.tabs.query({ active: true, currentWindow: true});
  const tabId = tabs[0].id;

  try {
    const results = await browser.scripting.executeScript({
      target: {tabId: tabId},
      func: () => {
        const selectedText = window.getSelection().toString().trim();
        return selectedText;
      }
    });

    const selectedText = results[0]?.result || "";

    if (selectedText.length > 0) {
      const sanitizedText = selectedText.replace(/[\x00-\x1F\x7F-\x9F]/g, "").replace(/\s+/g, " ");
      words = sanitizedText.split(/\s+/);
      isPaused = false;
      display.textContent = "";
      playNextWord();
    } else {
      display.textContent = "Please hightlight text first.";
    }
  } catch (err) {
    display.textContent = "Cannot read this page.";
    console.error("Error:", err);
  }
});

pauseBtn.addEventListener('click', ()=> {
  stopReading();
});

infoBtn.addEventListener('click', ()=> {
  browser.tabs.create({
    url: "https://alidestiny.com/practiread",
    active: true
  });
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
