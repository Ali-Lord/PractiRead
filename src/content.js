browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText.length > 100000) {
      sendResponse({ text: selectedText.substring(0, 100000), truncated: true });
    } else {
      sendResponse({ text: selectedText });
    }
  }

  return true;
});
