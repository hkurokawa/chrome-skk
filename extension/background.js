importScripts("skk.js");
importScripts("roman_table.js");
importScripts("dictionary_loader.js");
importScripts("ascii_modes.js");
importScripts("roman_modes.js");
importScripts("preedit_modes.js");
importScripts("conversion_modes.js");
importScripts("pako_inflate.es5.min.js");
importScripts("main.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.method === "reload_extension") {
    chrome.runtime.reload();
  }
});