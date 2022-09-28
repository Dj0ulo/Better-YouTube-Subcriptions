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
