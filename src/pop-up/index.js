(async function () {
  /**
   * Create a title and a bar for an section in the options
   * @param {string} name 
   * @returns Element
   */
  const titleSection = (name) => {
    const title = el("span", { className: "menu_title" });
    el("hr", { className: 'flexchild' }, title)
    el("span", { textContent: name }, title);
    el("hr", { className: 'flexchild' }, title)
    return title;
  }

	document.querySelector('#title').textContent = chrome.runtime.getManifest().name;
  document.querySelector('#version').textContent = chrome.runtime.getManifest().version;

  const donate = document.getElementById("donate");
  donate.onclick = () => chrome.tabs.create({
    active: true,
    url: "https://www.paypal.com/donate?hosted_button_id=VPF2BYBDBU5AA"
  });
  const subscriptionsButton = document.getElementById("subscriptions");
  subscriptionsButton.onclick = () => chrome.tabs.create({
    active: true,
    url: "https://www.youtube.com/feed/subscriptions"
  });

  const save = await loadSettings();

  const optionsContainer = document.getElementById("options-container");

  const switchButton = el("button", { 
    id: ID_SWITCH_BUTTON, 
    className: "style-scope ytd-toggle-button-renderer style-text",
    disabled: true,
  });

  el("div", { className: "shorts-icon style-scope", innerHTML: ICON_SHORTS }, switchButton);

  //options
  Object.keys(Settings).forEach((category) => {
    if(category === "State")
      return;
    optionsContainer.append(titleSection(category));

    const sublist = el("ul", { className: "sublist", style: "display: block" }, optionsContainer);

    Object.entries(Settings[category]).forEach(([o, spec]) => {
      const li = el("li", { id: o }, sublist);

      const label = el("label", {
        className: "optiondiv",
        style: "display: inline-block"
      }, li);

      let name = spec.name;
      name = name.replace("$shorts_button", switchButton.outerHTML);
      const spanImg = el("span", {
        className: "titleOption",
        innerHTML: (spec.href ? `<a href=${spec.href}>${name}</a>` : name),
        title: spec.title ?? "",
        style: "padding-bottom: 2px"
      }, label);

      if (spec.local_icon) {
        const img = el("div", { className: "icon" }, spanImg);
        img.style = `background-image: url(../sites/icons/${spec.local_icon});
                    background-size: contain;
                    width: 14px;
                    height: 14px;
                    display: inline-block;`;
        spanImg.prepend(img);
      }
      if(spec.select){
        const select = el("select", {
          id: o,
          className: "select",
          onchange: () => {
            save[o] = parseInt(select.value);
            saveSettings(save);
          }
        }, label);
        spec.select.map((x,i) => el("option", { textContent: x, value:i }, select));
        select.value = save[o];
        return;
      }
      if (typeof spec.default === 'number') {

        const slider = el("input", {
          type: "range",
          style: "width: 10em",
          min: spec.min,
          max: spec.max,
          step: spec.step,
          onchange: ({ target }) => {
            save[o] = parseFloat(target.value);
            saveSettings(save);
          },
        }, label);
        const span = el("span", {
          style: "margin-left: 1em"
        }, label);
        slider.value = save[o];
        slider.oninput = () => span.textContent = slider.value*100 + "%";
        slider.oninput();
        return;
      }

      const checkDiv = el("div", {
        className: 'checkdiv',
        style: "display: inline-block"
      }, label)

      el('input', {
        className: "checkbox",
        type: "checkbox",
        checked: save[o],
        onchange: ({ target }) => {
          save[o] = target.checked
          saveSettings(save);
        }
      }, checkDiv)

    })
  });

  if (onChrome()) hrefPopUp();
})();