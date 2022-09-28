(async function () {
  console.debug("Better Youtube Subscriptions: Content Script Loaded");
  const startytInitialData = 'var ytInitialData = ';
  let ytInitialData = [...document.body.querySelectorAll('script')].find(e => e.innerHTML.trim().startsWith(startytInitialData))?.innerHTML.trim();
  ytInitialData = JSON.parse(ytInitialData.slice(startytInitialData.length, -1));

  const docHead = document.head || document.documentElement;
  const styles = ['style'];
  const cssContents = await Promise.all(styles.map(s => read(`src/${s}.css`)));
  el('style', { className: 'super-style', textContent: cssContents.join('\n') }, docHead);

  // GLOBAL VARIABLES
  let observerNewVideos = null;
  let showShorts = false;
  let showWatched = false;
  let switchButton = document.getElementById(ID_SWITCH_BUTTON);
  let showWatchedButton = document.getElementById(ID_SHOW_WATCHED);
  let prevIsGrid = isGrid();
  let nProgressBars = 0;


  async function execute() {
    if (!isSubcriptionsPage(document.location.href)) {
      return
    }
    console.debug("Executing on subscriptions page");

    const contents = await new Promise(resolve => {
      const getContents = () => document.querySelector("ytd-browse ytd-section-list-renderer > #contents");
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
        titleContainer.appendChild(showWatchedButton);
      }
    }

    const hideFrom = (elements) => {
      elements
        .filter(e => {
          const short = isShort(e);
          const watched = isWatched(e);
          if (short === undefined)
            return false;
          return /*(showShorts && !short) ||*/ (!showShorts && short) || (!showWatched && !short && watched)
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
    const setup = (firstTime = true) => {
      prevIsGrid = isGrid();
      contents.setAttribute("display-video-kind", showShorts ? "shorts" : "videos");
      contents.setAttribute("display-watched", showWatched ? "true" : "false");
      if (!firstTime)
        showAll();
      menuToTop();
      hideFrom(queryVideos(contents));
      nProgressBars = 0;
    }

    if (!switchButton) {
      switchButton = el("button", { id: ID_SWITCH_BUTTON, className: "style-scope ytd-toggle-button-renderer style-text" });
      el("div", { className: "shorts-icon style-scope", innerHTML: ICON_SHORTS }, switchButton);
      switchButton.onclick = () => {
        showShorts = !showShorts;
        setup(false);
      };
    }
    if (!showWatchedButton) {
      showWatchedButton = el("button", { id: ID_SHOW_WATCHED, className: "style-scope ytd-toggle-button-renderer style-text" });
      el("div", { className: "eye-icon style-scope", innerHTML: ICON_EYE }, showWatchedButton);
      showWatchedButton.onclick = () => {
        showWatched = !showWatched;
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
      const itemSections = [...mutationRecords[0].addedNodes].filter(n => n.matches("ytd-item-section-renderer"));
      itemSections.forEach(section => hideFrom(queryVideos(section)));
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
          observerNewVideos?.disconnect();
          showAll();
          execute();
        }
      }
      oldHref = document.location.href;
    }
  });
})();



