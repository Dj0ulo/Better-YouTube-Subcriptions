// GENERAL PURPOSE UTILS
/**
 * 
 * @returns {boolean} true if we are on a chromium browser (otherwise we probably are on firefox)
 */
 function onChrome() {return typeof browser === 'undefined';}
/**
* Read file from this extension
* @param {string} url 
* @returns 
*/
const read = (url) => fetch(chrome.runtime.getURL(url))
  .then(response => response.text());
/**
 * Create an element
 * @param {string} tag Tag name of the element
 * @param {Object} attr attributes
 * @param {Element} parent
 * @returns {Element} Element created
 */
function el(tag, attr, parent) {
  const x = document.createElement(tag);
  if (parent) parent.appendChild(x);
  if (attr) {
    attr.attributes?.forEach(a => x.setAttribute(a.name, a.value ?? ''));
    delete attr.attributes;
    Object.entries(attr).forEach(([k, v]) => x[k] = v);
  }
  return x;
}
function hrefPopUp() {
  document.querySelectorAll("a").forEach(ln => {
    if (ln.href.startsWith("http"))
      ln.onclick = () => chrome.tabs.create({ active: true, url: ln.href })
  })
}


// UTILS FOR THIS APP

// CONSTANTS
const ATTR_HIDDEN = "better-hide-this-content";
const ICON_SHORTS = `<svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g width="16" height="16" viewBox="0 0 16 16" class="style-scope yt-icon"><path d="M10.65,1C10.65,1,10.65,1,10.65,1c-0.37,0-0.75,0.1-1.09,0.31L4.25,4.46C3.44,4.93,2.96,5.89,3,6.9  C3.05,7.9,3.58,8.77,4.39,9.18c0.02,0.01,0.75,0.35,0.75,0.35l-0.9,0.53c-1.14,0.68-1.58,2.27-0.98,3.55C3.69,14.49,4.5,15,5.35,15  c0.37,0,0.74-0.1,1.09-0.31l5.31-3.15c0.8-0.48,1.29-1.43,1.24-2.45c-0.04-0.99-0.58-1.87-1.39-2.27c-0.02-0.01-0.75-0.35-0.75-0.35  l0.9-0.53c1.14-0.68,1.58-2.27,0.97-3.55C12.31,1.51,11.49,1,10.65,1L10.65,1z" class="style-scope yt-icon"></path></g></svg>`;
const ICON_EYE = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><title>eye</title><path d="M10 7.5a2.5 2.5 0 1 0 2.5 2.5A2.5 2.5 0 0 0 10 7.5zm0 7a4.5 4.5 0 1 1 4.5-4.5 4.5 4.5 0 0 1-4.5 4.5zM10 3C3 3 0 10 0 10s3 7 10 7 10-7 10-7-3-7-10-7z"/></svg>`;
const ID_SWITCH_BUTTON = "better-youtube-subscriptions-switch-shorts";
const ID_SHOW_WATCHED = "better-youtube-subscriptions-show-watched";
const MIN_WATCHED = 0.1;

const isGrid = () => !!document.querySelector("ytd-grid-renderer");
const showAll = () => {
  document.querySelectorAll(`[${ATTR_HIDDEN}]`).forEach(e => e.removeAttribute(ATTR_HIDDEN));
};
const isSubcriptionsPage = (url) => url.startsWith("https://www.youtube.com/feed/subscriptions");
const queryVideos = (section) => [...section.querySelectorAll(isGrid() ? 'ytd-grid-video-renderer' : 'ytd-expanded-shelf-contents-renderer')];