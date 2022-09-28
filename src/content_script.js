
console.log("Better shorts");
const ATTR_HIDDEN = "better-hide-this-content";

const showAll = () => document.querySelectorAll(`[${ATTR_HIDDEN}]`).forEach(e => e.removeAttribute(ATTR_HIDDEN));
const isSubcriptionsPage = (url) => url.startsWith("https://www.youtube.com/feed/subscriptions");

async function execute() {
  if (!isSubcriptionsPage(document.location.href)) {
    return
  }
  console.log("Running on subscriptions page");
  const docHead = document.head || document.documentElement;
  const styles = ['style'];
  const cssContents = await Promise.all(styles.map(s => read(`src/${s}.css`)));
  el('style', { className: 'super-style', textContent: cssContents.join('\n') }, docHead);


  const ICON_SHORTS = `<svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g width="16" height="16" viewBox="0 0 16 16" class="style-scope yt-icon"><path d="M10.65,1C10.65,1,10.65,1,10.65,1c-0.37,0-0.75,0.1-1.09,0.31L4.25,4.46C3.44,4.93,2.96,5.89,3,6.9  C3.05,7.9,3.58,8.77,4.39,9.18c0.02,0.01,0.75,0.35,0.75,0.35l-0.9,0.53c-1.14,0.68-1.58,2.27-0.98,3.55C3.69,14.49,4.5,15,5.35,15  c0.37,0,0.74-0.1,1.09-0.31l5.31-3.15c0.8-0.48,1.29-1.43,1.24-2.45c-0.04-0.99-0.58-1.87-1.39-2.27c-0.02-0.01-0.75-0.35-0.75-0.35  l0.9-0.53c1.14-0.68,1.58-2.27,0.97-3.55C12.31,1.51,11.49,1,10.65,1L10.65,1z" class="style-scope yt-icon"></path></g></svg>`;
  let toggleShorts = false;
  let switchButton = document.getElementById("switch-shorts");


  const contents = await new Promise(resolve => {
    let contents = document.querySelector("ytd-browse ytd-section-list-renderer > #contents");
    if (contents)
      return resolve(contents);
    const observer = new MutationObserver(() => {
      let contents = document.querySelector("ytd-browse ytd-section-list-renderer > #contents");
      if (contents) {
        observer.disconnect();
        resolve(contents);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
  const isGrid = () => !!document.querySelector("ytd-grid-renderer");
  let prevIsGrid = isGrid();

  const queryVideos = (section) => [...section.querySelectorAll(isGrid() ? 'ytd-grid-video-renderer' : 'ytd-expanded-shelf-contents-renderer')];
  const getShorts = (videos) => videos.filter(v => {
    const isShort = !!v.querySelector('ytd-thumbnail a#thumbnail[href^="/shorts"]');
    return toggleShorts ? !isShort : isShort;
  });
  const querySections = () => [...contents.querySelectorAll("ytd-item-section-renderer")];
  const menuButtons = () => {
    const manageSubscriptions = [...contents.querySelectorAll('ytd-item-section-renderer #title-container #subscribe-button')]
      .find(button => button.innerHTML.trim() !== "");
    const menu = [...manageSubscriptions.parentNode.querySelectorAll('#menu')].find(button => button.innerHTML.trim() !== "");
    return [manageSubscriptions, menu];
  }
  const menuToTop = () => {
    const firstVisibleSection = querySections().find(s => !s.hasAttribute(ATTR_HIDDEN));
    if (firstVisibleSection) {
      const titleContainer = firstVisibleSection.querySelector('#title-container');
      menuButtons().forEach(button => titleContainer.appendChild(button));
      titleContainer.appendChild(switchButton);
    }
  }
  const hide = (elements) => {
    elements.forEach(e => {
      if (!isGrid()) {
        e.parentNode.parentNode.parentNode.parentNode.parentNode.setAttribute(ATTR_HIDDEN, '');
        const menu = e.parentNode.parentNode.parentNode.querySelector('#title-container #menu');
        if (menu && menu.innerHTML.trim() !== "") {
          menuToTop();
        }
      } else {
        e.setAttribute(ATTR_HIDDEN, "");
      }
    });
  }
  const setup = (firstTime = true) => {
    prevIsGrid = isGrid();
    contents.setAttribute("display-video-kind", toggleShorts ? "shorts" : "videos");
    if (!firstTime)
      showAll();
    menuToTop();
    const videos = queryVideos(contents);
    hide(getShorts(videos));
  }

  if (!switchButton) {
    switchButton = el("button", { id: "switch-shorts", className: "style-scope ytd-toggle-button-renderer style-text" });
    el("div", { className: "shorts-icon style-scope", innerHTML: ICON_SHORTS }, switchButton);
    switchButton.onclick = () => {
      toggleShorts = !toggleShorts;
      setup(false);
    };
  }

  const observer = new MutationObserver((mutationRecords) => {
    if (isGrid() !== prevIsGrid) {
      setup(false);
    }
    const itemSections = [...mutationRecords[0].addedNodes].filter(n => n.matches("ytd-item-section-renderer"));
    itemSections.forEach(section => hide(getShorts(queryVideos(section))));
  });
  observer.observe(contents, { childList: true, subtree: true });
  setup();
}

execute();
let oldHref = document.location.href;

document.addEventListener('yt-navigate-start', () => {
  if (oldHref != document.location.href) {
    if (isSubcriptionsPage(document.location.href)) {
      if (!isSubcriptionsPage(oldHref))
        execute();
    }
    oldHref = document.location.href;
  }
});
