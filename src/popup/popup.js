chrome.tabs.query({
	currentWindow: true,
	active: true
}, ([tab]) => {
	document.querySelector("p").textContent = tab.url;
});