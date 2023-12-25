(async function () { 
  console.debug("Better Youtube Subscriptions is running !");

  const SECTION_SELECTOR = 'ytd-item-section-renderer, ytd-rich-section-renderer';

  const startytInitialData = 'var ytInitialData = ';
  let ytInitialData = [...document.body.querySelectorAll('script')].find(e => e.innerHTML.trim().startsWith(startytInitialData))?.innerHTML.trim();
  ytInitialData = JSON.parse(ytInitialData.slice(startytInitialData.length, -1));

  const docHead = document.head || document.documentElement;
  const styles = ['style'];
  const cssContents = await Promise.all(styles.map(s => read(`src/${s}.css`)));
  el('style', { className: 'super-style', textContent: cssContents.join('\n') }, docHead);
  let save = await loadSettings();

  // GLOBAL VARIABLES
  let observerNewVideos = null;
  let switchButton = document.getElementById(ID_SWITCH_BUTTON);
  let showWatchedButton = document.getElementById(ID_SHOW_WATCHED);
  let prevIsGrid = isGrid();
  let nProgressBars = 0;


  const isShort = (video) => {
    const thumbnailLink = video.querySelector('ytd-thumbnail a#thumbnail[href]');
    if (!thumbnailLink)
      return undefined;
    return thumbnailLink.href.includes('/shorts/');
  };
  const isWatched = (video) => {
    const progressBar = video.querySelector('#progress');
    if (!progressBar)
      return undefined;
    return parseInt(progressBar.style.width) / 100 >= save.percentageWatched;
  };


  async function execute() {
    if (!isSubcriptionsPage(document.location.href)) {
      return
    }

    observerNewVideos?.disconnect();
    showAll();

    const contents = await new Promise(resolve => {
      const getContents = () => document.querySelector("ytd-browse ytd-section-list-renderer > #contents, ytd-browse ytd-rich-grid-renderer > #contents");
      let ct = getContents();
      if (ct)
        return resolve(ct);
      const observer = new MutationObserver(() => {
        ct = getContents();
        if (ct) {
          observer.disconnect();
          resolve(ct);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    // FUNCTIONS THAT DEPEND ON THE contents VARIABLE
    let menuDisplayed = false;
    const querySections = () => [...contents.querySelectorAll(SECTION_SELECTOR)];
    const menuButtons = () => {
      const manageSubscriptions = [...contents.querySelectorAll(`ytd-item-section-renderer #title-container #subscribe-button, ytd-rich-section-renderer #title-container #subscribe-button`)]
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
        titleContainer.appendChild(showWatchedButton);
        menuDisplayed = true;
      }
    }

    const hideFrom = (elements) => {
      elements
        .filter(e => {
          const short = isShort(e);
          const watched = isWatched(e);
          if (short === undefined)
            return false;
          let condition = (!save.showShorts && short) || (!save.showWatched && !short && watched);
          if(save.shortsTab === 1)
            condition = condition || (save.showShorts && !short);
          return condition
        })
        .forEach(e => {
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
    const setTitleButtons = () => {
      if(save.shortsTab === 1)
        switchButton.title = save.showShorts ? "Switch to Videos Tab" : "Switch to Shorts Tab";
      else
        switchButton.title = save.showShorts ? "Hide Shorts" : "Show Shorts";
      showWatchedButton.title = (save.showWatched ? "Hide" : "Show")+" videos you watched more than " + save.percentageWatched * 100 + "%";
    }

    const setup = (firstTime = true) => {
      prevIsGrid = isGrid();
      contents.setAttribute("display-video-kind", save.showShorts ? "shorts" : "videos");
      contents.setAttribute("display-watched", save.showWatched ? "true" : "false");
      if (!firstTime)
        showAll();
      menuToTop();
      setTitleButtons();
      hideFrom(queryVideos(contents));
      nProgressBars = 0;
    }

    if (!switchButton) {
      switchButton = el("button", { 
        id: ID_SWITCH_BUTTON, 
        className: "style-scope ytd-toggle-button-renderer style-text",
      });

      el("div", { className: "shorts-icon style-scope", innerHTML: ICON_SHORTS }, switchButton);
      switchButton.onclick = () => {
        save.showShorts = !save.showShorts;
        saveSettings(save);
        setup(false);
      };
    }
    if (!showWatchedButton) {
      showWatchedButton = el("button", { 
        id: ID_SHOW_WATCHED, 
        className: "style-scope ytd-toggle-button-renderer style-text",
      });
      el("div", { className: "eye-icon style-scope", innerHTML: ICON_EYE }, showWatchedButton);
      showWatchedButton.onclick = () => {
        save.showWatched = !save.showWatched;
        saveSettings(save);
        setup(false);
      };
    }
    observerNewVideos = new MutationObserver((mutationRecords) => {
      if (isGrid() !== prevIsGrid) {
        setup(false);
      }
      const progressBars = contents.querySelectorAll('#progress');
      if (nProgressBars != progressBars.length) {
        hideFrom(queryVideos(contents));
        nProgressBars = progressBars.length;
      }
      const itemSections = mutationRecords.map(m=>[...m.addedNodes]).flat().filter(n => n.matches && n.matches(SECTION_SELECTOR));
      itemSections.forEach(section => hideFrom(queryVideos(section)));
      if (!menuDisplayed)
        menuToTop();
    });
    observerNewVideos.observe(contents, { childList: true, subtree: true });
    setup();
  }

  execute();
  let oldHref = document.location.href;

  document.addEventListener('yt-navigate-start', () => {
    if (oldHref != document.location.href) {
      if (isSubcriptionsPage(document.location.href)) {
        if (!isSubcriptionsPage(oldHref)) {
          execute();
        }
      }
      oldHref = document.location.href;
    }
  });

  chrome.runtime.onMessage.addListener(async (msg) => {
    if(msg === 'execute'){
      save = await loadSettings();
      execute();
    }
  });
})();



