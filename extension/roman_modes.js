(function() {
function updateComposition(skk) {
  if (skk.roman.length > 0) {
    skk.setComposition(skk.roman, skk.roman.length);
  } else if (skk.isSandSActive) {
    skk.setComposition(" [S]", 0); // SandS状態表示
  } else {
    skk.clearComposition();
  }
}

function createRomanInput(table) {
  return function (skk, keyevent) {
    // SandS状態解除トリガー (Space以外のキー)
    if (keyevent.key !== ' ' && skk.isSandSActive) {
      skk.isSandSActive = false;
    }

    // Spaceキー処理 (SandS対応)
    if (keyevent.key === ' ') {
      if (skk.enableSandS && !keyevent.shiftKey) {
        skk.isSandSActive = true;
        updateComposition(skk); // 状態表示更新
        return true;
      }
      // 通常のスペース処理
      skk.commitText(' ');
      return true;
    }

    // SandS仮想シフト処理
    if (skk.isSandSActive && !keyevent.shiftKey) {
      // 仮想シフト状態で処理
      const virtualShiftEvent = {
        ...keyevent,
        shiftKey: true
      };
      skk.isSandSActive = false; // 状態リセット
      return this(skk, virtualShiftEvent); // 再帰処理
    }

    // 既存のキー処理
    if (keyevent.key == 'Enter') {
      return false;
    }

    if (keyevent.key == 'Backspace' && skk.roman.length > 0) {
      skk.roman = skk.roman.slice(0, skk.roman.length - 1);
      skk.isSandSActive = false; // SandS状態解除
      return true;
    }

    if ((keyevent.key == 'Esc' ||
        (keyevent.key == 'g' && keyevent.ctrlKey)) && skk.roman.length > 0) {
      skk.roman = '';
      skk.isSandSActive = false; // SandS状態解除
      return true;
    }

    if (keyevent.key == 'j' && keyevent.ctrlKey) {
      return true;
    }

    if (keyevent.key.length != 1 || keyevent.ctrlKey || keyevent.altKey) {
      return false;
    }

    if (!keyevent.shiftKey) {
      if (skk.processRoman(keyevent.key, table, skk.commitText.bind(skk))) {
        skk.isSandSActive = false; // 変換成功時はSandS解除
        return true;
      }

      if (keyevent.key == 'q') {
        skk.switchMode(
          (skk.currentMode == 'hiragana') ? 'katakana' : 'hiragana');
        skk.isSandSActive = false; // モード切替時は解除
        return true;
      }
      if (keyevent.key == 'l') {
        skk.switchMode('ascii');
        skk.isSandSActive = false; // モード切替時は解除
        return true;
      }

      if (keyevent.key == '/') {
        skk.switchMode('ascii-preedit');
        skk.isSandSActive = false; // モード切替時は解除
        return true;
      }
    } else if (keyevent.key == 'Q') {
      skk.processRoman(keyevent.key, table, skk.commitText.bind(skk));
      skk.switchMode('preedit');
      skk.isSandSActive = false; // モード切替時は解除
      return true;
    } else if (keyevent.key == 'L') {
      skk.processRoman(keyevent.key, table, skk.commitText.bind(skk));
      skk.switchMode('full-ascii');
      skk.isSandSActive = false; // モード切替時は解除
      return true;
    } else if (keyevent.shiftKey &&
               keyevent.key >= 'A' && keyevent.key <= 'Z') {
      skk.switchMode('preedit');
      skk.processRoman(
        keyevent.key.toLowerCase(), romanTable, function(text) {
          skk.preedit = skk.preedit.slice(0, skk.caret) +
            text + skk.preedit.slice(skk.caret);
          skk.caret += text.length;
        });
      skk.isSandSActive = false; // モード切替時は解除
      return true;
    } else if (keyevent.key == '!' || keyevent.key == '?') {
      skk.processRoman(keyevent.key, table, skk.commitText.bind(skk));
      skk.isSandSActive = false; // 変換成功時は解除
      return true;
    }

    return false;
  };
}

SKK.registerMode('hiragana', {
  displayName: '\u3072\u3089\u304c\u306a',
  keyHandler: createRomanInput(romanTable),
  compositionHandler: updateComposition
});

SKK.registerMode('katakana', {
  displayName: '\u30ab\u30bf\u30ab\u30ca',
  keyHandler: createRomanInput(katakanaTable),
  compositionHandler: updateComposition
});
})();

// (function() {
// function updateComposition(skk) {
//   if (skk.roman.length > 0) {
//     skk.setComposition(skk.roman, skk.roman.length);
//   } else {
//     skk.clearComposition();
//   }
// }
//
// function createRomanInput(table) {
//   return function (skk, keyevent) {
//     if (keyevent.key == 'Enter') {
//       return false;
//     }
//
//     if (keyevent.key == 'Backspace' && skk.roman.length > 0) {
//       skk.roman = skk.roman.slice(0, skk.roman.length - 1);
//       return true;
//     }
//
//     if ((keyevent.key == 'Esc' ||
//         (keyevent.key == 'g' && keyevent.ctrlKey)) && skk.roman.length > 0) {
//       skk.roman = '';
//       return true;
//     }
//
//     if (keyevent.key == 'j' && keyevent.ctrlKey) {
//       return true;
//     }
//
//     if (keyevent.key.length != 1 || keyevent.ctrlKey || keyevent.altKey) {
//       return false;
//     }
//
//     if (!keyevent.shiftKey) {
//       if (skk.processRoman(keyevent.key, table, skk.commitText.bind(skk))) {
//         return true;
//       }
//
//       if (keyevent.key == 'q') {
//         skk.switchMode(
//           (skk.currentMode == 'hiragana') ? 'katakana' : 'hiragana');
//         return true;
//       }
//       if (keyevent.key == 'l') {
//         skk.switchMode('ascii');
//         return true;
//       }
//
//       if (keyevent.key == '/') {
//         skk.switchMode('ascii-preedit');
//         return true;
//       }
//     } else if (keyevent.key == 'Q') {
//       console.log('here');
//       skk.processRoman(keyevent.key, table, skk.commitText.bind(skk));
//       skk.switchMode('preedit');
//       return true;
//     } else if (keyevent.key == 'L') {
//       skk.processRoman(keyevent.key, table, skk.commitText.bind(skk));
//       skk.switchMode('full-ascii');
//       return true;
//     } else if (keyevent.shiftKey &&
//                keyevent.key >= 'A' && keyevent.key <= 'Z') {
//       skk.switchMode('preedit');
//       skk.processRoman(
//         keyevent.key.toLowerCase(), romanTable, function(text) {
//           skk.preedit = skk.preedit.slice(0, skk.caret) +
//             text + skk.preedit.slice(skk.caret);
//           skk.caret += text.length;
//         });
//       return true;
//     } else if (keyevent.key == '!' || keyevent.key == '?') {
//       skk.processRoman(keyevent.key, table, skk.commitText.bind(skk));
//       return true;
//     }
//
//     return false;
//   };
// }
//
// SKK.registerMode('hiragana', {
//   displayName: '\u3072\u3089\u304c\u306a',
//   keyHandler: createRomanInput(romanTable),
//   compositionHandler: updateComposition
// });
//
// SKK.registerMode('katakana', {
//   displayName: '\u30ab\u30bf\u30ab\u30ca',
//   keyHandler: createRomanInput(katakanaTable),
//   compositionHandler: updateComposition
// });
// })();
//
