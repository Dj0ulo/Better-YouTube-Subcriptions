
const Settings = Object.freeze({
  Options: {
    shortsTab: {
      name: "Behaviour of the button $shorts_button",
      default: 0,
      select : ["Show/Hide Shorts", "Switch to Video Tab/Shorts Tab"],
    },
    percentageWatched: {
      name: "Threshold % of watched videos",
      title: "A video is considered to be watched if you have watched at least this percentage of its total duration",
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
