
const Settings = Object.freeze({
  Options: {
    shortsTab: {
      name: "Shorts Tab",
      title: "Clicking on the SHORTS button only shows the Shorts",
      default: false,
    },
    watchedTab: {
      name: "Watched videos Tab",
      title: "Clicking on the WATCHED button only shows the videos that have been watched",
      default: false,
    },
    percentageWatched: {
      name: "Min. watched %",
      title: "A video is considered watched if it has been watched for at least this percentage of its duration",
      default: 0.1,
      min: 0.1,
      max: 1,
      step: 0.1,
    },
  },
  State: {
    showShorts: {
      name: "Show Shorts",
      default: true,
    },
    showWatched: {
      name: "Show Watched",
      default: true,
    }
  }
});
const SAVE_OPTIONS_KEY = "save_options_key";
const defaultSettings = () => {
  let save = {};
  Object.keys(Settings).forEach(category => {
    Object.keys(Settings[category]).forEach(k => {
      save[k] = Settings[category][k].default ?? true;
    })
  })
  return save;
}
const loadSettings = () => {
  return new Promise(resolve => {
    chrome.storage.local.get([SAVE_OPTIONS_KEY], storage => {
      resolve({ ...defaultSettings(), ...storage[SAVE_OPTIONS_KEY] });
    });
  })
}
const saveSettings = save => {
  return new Promise(resolve => {
    chrome.storage.local.set({
      [SAVE_OPTIONS_KEY]: save
    }, (x) => {
      resolve(x);
      if(!chrome.tabs)
        return;
      chrome.tabs.query({ currentWindow: true, active: true }, ([activeTab])  => {
        chrome.tabs.sendMessage(activeTab.id, "execute");
      });
    })
  })
}
