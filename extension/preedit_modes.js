(function() {
function updateComposition(skk) {
  var preedit = '\u25bd' + skk.preedit.slice(0, skk.caret) + skk.roman +
    skk.preedit.slice(skk.caret);
  var caret = skk.caret + skk.roman.length + 1;
  skk.setComposition(preedit, caret);
}

function initPreedit(skk) {
  skk.caret = skk.preedit.length;
  // SandS状態を初期化 (roman_mode.js と同様)
  skk.isSandSActive = false;
  skk.keyPressedDuringSandS = false;
}

function preeditKeybind(skk, keyevent) {
  // keyupイベントは上位で処理されるため無視
  if (keyevent.type === 'keyup') return false;

  // 既存のキーバインド処理は変更なし
  if (keyevent.key == 'Enter' || (keyevent.key == 'j' && keyevent.ctrlKey)) {
    skk.commitText(skk.preedit);
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('hiragana');
    return true;
  }

  if (keyevent.key == 'Esc' || (keyevent.key == 'g' && keyevent.ctrlKey)) {
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('hiragana');
    return true;
  }

  if (keyevent.key == 'Left' || (keyevent.key == 'b' && keyevent.ctrlKey)) {
    if (skk.caret > 0) {
      skk.caret--;
    }
    return true;
  }

  if (keyevent.key == 'Right' || (keyevent.key == 'f' && keyevent.ctrlKey)) {
    if (skk.caret < skk.preedit.length) {
      skk.caret++;
    }
    return true;
  }

  if (keyevent.key == 'Backspace') {
    if (skk.roman.length > 0) {
      skk.roman = skk.roman.slice(0, skk.roman.length - 1);
    } else if (skk.preedit.length > 0 && skk.caret > 0) {
      skk.preedit = skk.preedit.slice(0, skk.caret - 1) +
        skk.preedit.slice(skk.caret);
      skk.caret--;
    } else {
      skk.commitText(skk.preedit);
      skk.preedit = '';
      skk.switchMode('hiragana');
    }
    return true;
  }

  if (keyevent.key == 'q' && skk.currentMode != 'ascii-preedit') {
    skk.commitText(kanaTurnOver(skk.preedit));
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('hiragana');
    return true;
  }

  if (keyevent.key == 'l' && skk.currentMode != 'ascii-preedit') {
    skk.commitText(skk.preedit);
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('ascii');
    return true;
  }

  if (keyevent.key == 'L' && skk.currentMode != 'ascii-preedit') {
    skk.commitText(skk.preedit);
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('full-ascii');
    return true;
  }

  return false;
}

function preeditInput(skk, keyevent) {
  // Romanモードと同様のSandS keyup処理
  if (keyevent.type === 'keyup') {
    if (keyevent.key === ' ' && skk.isSandSActive) {
      if (!skk.keyPressedDuringSandS) {
        // 変換モードに遷移
        if (skk.roman == 'n') {
          skk.preedit += romanTable['nn'];
        }
        skk.roman = '';
        skk.switchMode('conversion');
      }
      skk.isSandSActive = false;
      skk.keyPressedDuringSandS = false;
      return true;
    }
    return false;
  }

  // Romanモードと同様のSandS keydown処理
  if (keyevent.key !== ' ' && skk.isSandSActive) {
    skk.keyPressedDuringSandS = true;
  }

  // Ctrl+Space処理 (roman_mode.jsと同様)
  if (keyevent.key === ' ' && keyevent.ctrlKey) {
    skk.isSandSActive = false;
    return false;
  }

  // Spaceキー処理 (roman_mode.jsと同様)
  if (keyevent.key === ' ') {
    if (skk.enableSandS && !keyevent.shiftKey) {
      skk.isSandSActive = true;
      skk.keyPressedDuringSandS = false;
      updateComposition(skk);
      return true;
    }
    // SandS無効時のデフォルト動作
    if (skk.roman == 'n') {
      skk.preedit += romanTable['nn'];
    }
    skk.roman = '';
    skk.switchMode('conversion');
    return true;
  }

  // 物理シフト + Spaceの競合処理
  if (keyevent.key === ' ' && keyevent.shiftKey) {
    skk.isSandSActive = false;
  }

  // Romanモードと同様の仮想シフト処理
  let processedKey = keyevent.key;
  let isVirtualShift = false;
  if (skk.isSandSActive && !keyevent.shiftKey) {
    processedKey = skk.getShiftedKey(keyevent.key);
    isVirtualShift = true;
    skk.keyPressedDuringSandS = true;
  }

  // 既存のキーバインド処理
  if (preeditKeybind(skk, keyevent)) {
    return true;
  }

  // シフト状態を判定 (物理/仮想)
  const shiftApplied = keyevent.shiftKey || isVirtualShift;

  // 送り仮名処理 (シフト状態を考慮)
  if (skk.preedit.length > 0 && shiftApplied &&
      'A' <= processedKey && processedKey <= 'Z') {
    var key = processedKey.toLowerCase();
    var okuriPrefix = (skk.roman.length > 0) ? skk.roman[0] : key;
    skk.processRoman(key, romanTable, function(text) {
        if (skk.roman.length > 0) {
          skk.preedit += text;
          skk.caret += text.length;
        } else {
          skk.okuriPrefix = okuriPrefix;
          skk.okuriText = text;
          skk.switchMode('conversion');
        }
      });
    if (skk.currentMode == 'preedit') {
      skk.okuriPrefix = (skk.roman.length > 0) ? skk.roman[0] : key;
      skk.switchMode('okuri-preedit');
    }
    return true;
  }

  // ローマ字変換処理
  var processed = skk.processRoman(processedKey.toLowerCase(), romanTable,
                                   function(text) {
      skk.preedit = skk.preedit.slice(0, skk.caret) +
        text + skk.preedit.slice(skk.caret);
      skk.caret += text.length;
    });

  if (skk.preedit.length > 0 && processedKey == '>') {
    skk.roman = '';
    skk.preedit += '>';
    skk.switchMode('conversion');
  } else if (!processed) {
    skk.preedit = skk.preedit.slice(0, skk.caret) +
      processedKey + skk.preedit.slice(skk.caret);
    skk.caret += processedKey.length;
  }
  return true;
}

function updateOkuriComposition(skk) {
  var preedit = '\u25bd' + skk.preedit.slice(0, skk.caret) +
    '*' + skk.okuriText + skk.roman + skk.preedit.slice(skk.caret);
  var caret = skk.caret + skk.roman.length + 2;
  skk.setComposition(preedit, caret);
}

function okuriPreeditInput(skk, keyevent) {
  // SandS状態をリセット
  if (skk.isSandSActive) {
    skk.isSandSActive = false;
  }

  // 既存の処理は変更なし
  if (keyevent.type === 'keyup') return false;

  if (keyevent.key == 'Enter') {
    skk.commitText(skk.preedit);
    skk.preedit = '';
    skk.roman = '';
    skk.switchMode('hiragana');
    return true;
  }

  if (keyevent.key == 'Esc' || (keyevent.key == 'g' && keyevent.ctrlKey)) {
    skk.preedit = '';
    skk.roman = '';
    skk.okuriPrefix = '';
    skk.okuriText = '';
    skk.switchMode('hiragana');
    return true;
  }

  if (keyevent.key == 'Backspace') {
    skk.roman = skk.roman.slice(0, skk.roman.length - 1);
    if (skk.roman.length == 0) {
      skk.okuriPrefix = '';
      skk.roman = '';
      skk.switchMode('preedit');
      return true;
    }
  }

  if (keyevent.type === 'keydown') {
    skk.processRoman(keyevent.key.toLowerCase(), romanTable, function(text) {
      skk.okuriText += text;
      if (skk.roman.length == 0) {
        skk.switchMode('conversion');
      }
    });
  }

  return true;
}

function asciiPreeditInput(skk, keyevent) {
  // SandS状態をリセット
  if (skk.isSandSActive) {
    skk.isSandSActive = false;
  }

  // 既存の処理は変更なし
  if (keyevent.type === 'keyup') return false;

  if (keyevent.key == ' ') {
    skk.switchMode('conversion');
    return true;
  }

  if (preeditKeybind(skk, keyevent)) {
    return true;
  }

  if (keyevent.key.length != 1) {
    return true;
  }

  if (keyevent.type === 'keydown') {
    skk.preedit += keyevent.key;
    skk.caret++;
  }

  return true;
}

SKK.registerImplicitMode('preedit', {
  keyHandler: preeditInput,
  compositionHandler: updateComposition,
  initHandler: initPreedit
});

SKK.registerImplicitMode('okuri-preedit', {
  keyHandler: okuriPreeditInput,
  compositionHandler: updateOkuriComposition
});

SKK.registerImplicitMode('ascii-preedit', {
  keyHandler: asciiPreeditInput,
  compositionHandler: updateComposition,
  initHandler: initPreedit
});

function kanaTurnOver(str) {
  var turnedOverStr = '';
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c > 0x3040 && c < 0x3097) {
      turnedOverStr += String.fromCharCode(c + 0x60);
    } else if (c > 0x30a0 && c < 0x30f7) {
      turnedOverStr += String.fromCharCode(c - 0x60);
    } else {
      turnedOverStr += String.fromCharCode(c);
    }
  }
  return turnedOverStr;
}
})();
// (function() {
// function updateComposition(skk) {
//   var preedit = '\u25bd' + skk.preedit.slice(0, skk.caret) + skk.roman +
//     skk.preedit.slice(skk.caret);
//   var caret = skk.caret + skk.roman.length + 1;
//   skk.setComposition(preedit, caret);
// }
//
// function initPreedit(skk) {
//   skk.caret = skk.preedit.length;
// }
//
// function preeditKeybind(skk, keyevent) {
//   if (keyevent.key == 'Enter' || (keyevent.key == 'j' && keyevent.ctrlKey)) {
//     skk.commitText(skk.preedit);
//     skk.preedit = '';
//     skk.roman = '';
//     skk.switchMode('hiragana');
//     return true;
//   }
//
//   if (keyevent.key == 'Esc' || (keyevent.key == 'g' && keyevent.ctrlKey)) {
//     skk.preedit = '';
//     skk.roman = '';
//     skk.switchMode('hiragana');
//     return true;
//   }
//
//   if (keyevent.key == 'Left' || (keyevent.key == 'b' && keyevent.ctrlKey)) {
//     if (skk.caret > 0) {
//       skk.caret--;
//     }
//     return true;
//   }
//
//   if (keyevent.key == 'Right' || (keyevent.key == 'f' && keyevent.ctrlKey)) {
//     if (skk.caret < skk.preedit.length) {
//       skk.caret++;
//     }
//     return true;
//   }
//
//   if (keyevent.key == 'Backspace') {
//     if (skk.roman.length > 0) {
//       skk.roman = skk.roman.slice(0, skk.roman.length - 1);
//     } else if (skk.preedit.length > 0 && skk.caret > 0) {
//       skk.preedit = skk.preedit.slice(0, skk.caret - 1) +
//         skk.preedit.slice(skk.caret);
//       skk.caret--;
//     } else {
//       skk.commitText(skk.preedit);
//       skk.preedit = '';
//       skk.switchMode('hiragana');
//     }
//     return true;
//   }
//
//   if (keyevent.key == 'q' && skk.currentMode != 'ascii-preedit') {
//     skk.commitText(kanaTurnOver(skk.preedit));
//     skk.preedit = '';
//     skk.roman = '';
//     skk.switchMode('hiragana');
//     return true;
//   }
//
//   if (keyevent.key == 'l' && skk.currentMode != 'ascii-preedit') {
//     skk.commitText(skk.preedit);
//     skk.preedit = '';
//     skk.roman = '';
//     skk.switchMode('ascii');
//     return true;
//   }
//
//   if (keyevent.key == 'L' && skk.currentMode != 'ascii-preedit') {
//     skk.commitText(skk.preedit);
//     skk.preedit = '';
//     skk.roman = '';
//     skk.switchMode('full-ascii');
//     return true;
//   }
//
//   return false;
// }
//
// function preeditInput(skk, keyevent) {
//   if (keyevent.key == ' ') {
//     if (skk.roman == 'n') {
//       skk.preedit += romanTable['nn'];
//     }
//     skk.roman = '';
//     skk.switchMode('conversion');
//     return true;
//   }
//
//   if (preeditKeybind(skk, keyevent)) {
//     return true;
//   }
//
//   if (keyevent.key.length != 1) {
//     // special keys -- ignore for now
//     return false;
//   }
//
//   if (skk.preedit.length > 0 &&
//       keyevent.shiftKey && 'A' <= keyevent.key && keyevent.key <= 'Z') {
//     var key = keyevent.key.toLowerCase();
//     var okuriPrefix = (skk.roman.length > 0) ? skk.roman[0] : key;
//     skk.processRoman(key, romanTable, function(text) {
//         if (skk.roman.length > 0) {
//           skk.preedit += text;
//           skk.caret += text.length;
//         } else {
//           skk.okuriPrefix = okuriPrefix;
//           skk.okuriText = text;
//           skk.switchMode('conversion');
//         }
//       });
//     if (skk.currentMode == 'preedit') {
//       // We should re-calculate the okuriPrefix since the 'roman' can be
//       // changed during processRoman -- such like 'KanJi' pattern.
//       skk.okuriPrefix = (skk.roman.length > 0) ? skk.roman[0] : key;
//       skk.switchMode('okuri-preedit');
//     }
//     return true;
//   }
//
//   var processed = skk.processRoman(keyevent.key.toLowerCase(), romanTable,
//                                    function(text) {
//       skk.preedit = skk.preedit.slice(0, skk.caret) +
//         text + skk.preedit.slice(skk.caret);
//       skk.caret += text.length;
//     });
//
//   if (skk.preedit.length > 0 && keyevent.key == '>') {
//     skk.roman = '';
//     skk.preedit += '>';
//     skk.switchMode('conversion');
//   } else if (!processed) {
//     console.log(keyevent);
//     skk.preedit = skk.preedit.slice(0, skk.caret) +
//       keyevent.key + skk.preedit.slice(skk.caret);
//     skk.caret += keyevent.key.length;
//   }
//   return true;
// }
//
// function updateOkuriComposition(skk) {
//   var preedit = '\u25bd' + skk.preedit.slice(0, skk.caret) +
//     '*' + skk.okuriText + skk.roman + skk.preedit.slice(skk.caret);
//   var caret = skk.caret + skk.roman.length + 2;
//   skk.setComposition(preedit, caret);
// }
//
// function okuriPreeditInput(skk, keyevent) {
//   if (keyevent.key == 'Enter') {
//     skk.commitText(skk.preedit);
//     skk.preedit = '';
//     skk.roman = '';
//     skk.switchMode('hiragana');
//     return true;
//   }
//
//   if (keyevent.key == 'Esc' || (keyevent.key == 'g' && keyevent.ctrlKey)) {
//     skk.preedit = '';
//     skk.roman = '';
//     skk.okuriPrefix = '';
//     skk.okuriText = '';
//     skk.switchMode('hiragana');
//     return true;
//   }
//
//   if (keyevent.key == 'Backspace') {
//     skk.roman = skk.roman.slice(0, skk.roman.length - 1);
//     if (skk.roman.length == 0) {
//       skk.okuriPrefix = '';
//       skk.roman = '';
//       skk.switchMode('preedit');
//       return true;
//     }
//   }
//
//   skk.processRoman(keyevent.key.toLowerCase(), romanTable, function(text) {
//     skk.okuriText += text;
//     if (skk.roman.length == 0) {
//       skk.switchMode('conversion');
//     }
//   });
//   return true;
// }
//
// function asciiPreeditInput(skk, keyevent) {
//   if (keyevent.key == ' ') {
//     skk.switchMode('conversion');
//     return true;
//   }
//
//   if (preeditKeybind(skk, keyevent)) {
//     return true;
//   }
//
//   if (keyevent.key.length != 1) {
//     return true;
//   }
//
//   skk.preedit += keyevent.key;
//   skk.caret++;
//   return true;
// }
//
// SKK.registerImplicitMode('preedit', {
//   keyHandler: preeditInput,
//   compositionHandler: updateComposition,
//   initHandler: initPreedit
// });
//
// SKK.registerImplicitMode('okuri-preedit', {
//   keyHandler: okuriPreeditInput,
//   compositionHandler: updateOkuriComposition
// });
//
// SKK.registerImplicitMode('ascii-preedit', {
//   keyHandler: asciiPreeditInput,
//   compositionHandler: updateComposition,
//   initHandler: initPreedit
// });
//
// function kanaTurnOver(str) {
//   var turnedOverStr = '';
//   for (var i = 0; i < str.length; i++) {
//     var c = str.charCodeAt(i);
//     if (c > 0x3040 && c < 0x3097) {
//       turnedOverStr += String.fromCharCode(c + 0x60);
//     } else if (c > 0x30a0 && c < 0x30f7) {
//       turnedOverStr += String.fromCharCode(c - 0x60);
//     } else {
//       turnedOverStr += String.fromCharCode(c);
//     }
//   }
//   return turnedOverStr;
// }
// })();
