chrome.runtime.onMessage.addListener(({url, as}, _, sendResponse) => {
  fetch(url, { credentials: 'omit' })
    .then(r => r[as ?? 'text']())
    .then(r => sendResponse(r));
  return true;
});
