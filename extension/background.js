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
  if (request.method === "read_clipboard") {
    // クリップボードからテキストを読み取る
    navigator.clipboard.readText()
      .then(text => {
        sendResponse({
          method: "read_clipboard_response",
          body: { content: text }
        });
      })
      .catch(error => {
        console.error('クリップボード読み取りエラー:', error);
        sendResponse({
          method: "read_clipboard_response",
          body: { content: '' }
        });
      });
    return true; // 非同期レスポンスを示す
  }
});