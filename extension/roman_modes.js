(function() {
function updateComposition(skk) {
  if (skk.isSandSActive) {
    skk.setComposition(skk.roman + " [S]", skk.roman.length);
  } else if (skk.roman.length > 0) {
    skk.setComposition(skk.roman, skk.roman.length);
  } else {
    skk.clearComposition();
  }
}

function createRomanInput(table) {
  return function (skk, keyevent) {
    // keyupイベント処理: Spaceキーのみ特別扱い
    if (keyevent.type === 'keyup') {
      if (keyevent.key === ' ' && skk.isSandSActive) {
        // SandS状態でSpaceキーが離された場合
        if (!skk.keyPressedDuringSandS) {
          skk.commitText(' '); // スペース入力
        }
        skk.isSandSActive = false;
        skk.keyPressedDuringSandS = false;
        updateComposition(skk);
        return true;
      }
      // その他のkeyupイベントは無視
      return false;
    }

    // keydownイベント処理のみ以下で実行
    // ============================================

    // SandS状態リセット: Space以外のキーが押されたらフラグ設定
    if (keyevent.key !== ' ' && skk.isSandSActive) {
      skk.keyPressedDuringSandS = true;
    }

    // Ctrl+Spaceの処理
    if (keyevent.key === ' ' && keyevent.ctrlKey) {
      // IMEのデフォルト動作に任せる
      skk.isSandSActive = false; // SandS状態をリセット
      skk.roman = ''; // ローマ字入力をリセット
      return false; // イベントを消費せず、IMEのデフォルト動作に任せる
    }

    // Spaceキー処理 (SandS対応)
    if (keyevent.key === ' ') {
      if (skk.enableSandS && !keyevent.shiftKey) {
        skk.isSandSActive = true; // 仮想シフト状態をON
        skk.keyPressedDuringSandS = false; // リセット
        updateComposition(skk);
        return true;
      }
      // SandS無効時は即時スペース入力
      skk.commitText(' ');
      return true;
    }

    // 物理シフト + Spaceの競合処理
    if (keyevent.key === ' ' && keyevent.shiftKey) {
      skk.isSandSActive = false; // 物理シフト優先
    }

    // SandS仮想シフト処理: キーをシフト変換
    let processedKey = keyevent.key;
    let isVirtualShift = false;
    if (skk.isSandSActive && !keyevent.shiftKey) {
      processedKey = skk.getShiftedKey(keyevent.key);
      isVirtualShift = true;
      skk.keyPressedDuringSandS = true;
    }

    // 既存の処理 ============================================
    if (keyevent.key == 'Enter') {
      return false;
    }

    if (keyevent.key == 'Backspace' && skk.roman.length > 0) {
      skk.roman = skk.roman.slice(0, skk.roman.length - 1);
      return true;
    }

    if ((keyevent.key == 'Esc' ||
        (keyevent.key == 'g' && keyevent.ctrlKey)) && skk.roman.length > 0) {
      skk.roman = '';
      skk.isSandSActive = false; // 状態リセット
      return true;
    }

    if (keyevent.key == 'j' && keyevent.ctrlKey) {
      return true;
    }

    if (keyevent.key.length != 1 || keyevent.ctrlKey || keyevent.altKey) {
      return false;
    }

    // シフト状態を考慮したキー処理
    const shiftApplied = isVirtualShift || keyevent.shiftKey;

    // ローマ字変換処理
    if (skk.processRoman(processedKey, table, skk.commitText.bind(skk))) {
      return true;
    }

    // シフトキーが押されていない場合のモード切替
    if (!shiftApplied) {
      if (processedKey == 'q') {
        skk.switchMode(
          (skk.currentMode == 'hiragana') ? 'katakana' : 'hiragana');
        skk.isSandSActive = false;
        return true;
      }
      if (processedKey == 'l') {
        skk.switchMode('ascii');
        skk.isSandSActive = false;
        return true;
      }
      if (processedKey == '/') {
        skk.switchMode('ascii-preedit');
        skk.isSandSActive = false;
        return true;
      }
    }
    // シフトキーが押されている場合の処理
    else {
      if (processedKey == 'Q') {
        skk.processRoman(processedKey, table, skk.commitText.bind(skk));
        skk.switchMode('preedit');
        skk.isSandSActive = false;
        return true;
      } else if (processedKey == 'L') {
        skk.processRoman(processedKey, table, skk.commitText.bind(skk));
        skk.switchMode('full-ascii');
        skk.isSandSActive = false;
        return true;
      } else if (processedKey >= 'A' && processedKey <= 'Z') {
        skk.switchMode('preedit');
        skk.processRoman(
          processedKey.toLowerCase(), romanTable, function(text) {
            skk.preedit = skk.preedit.slice(0, skk.caret) +
              text + skk.preedit.slice(skk.caret);
            skk.caret += text.length;
          });
        skk.isSandSActive = false;
        return true;
      } else if (processedKey == '!' || processedKey == '?') {
        skk.processRoman(processedKey, table, skk.commitText.bind(skk));
        return true;
      }
    }

    return false;
  };
}

// SandS対応初期化
const initSandS = function(skk) {
  skk.isSandSActive = false;
  skk.keyPressedDuringSandS = false;
  skk.enableSandS = true; // デフォルトで有効（設定可能）
};

SKK.registerMode('hiragana', {
  displayName: '\u3072\u3089\u304c\u306a',
  keyHandler: createRomanInput(romanTable),
  compositionHandler: updateComposition,
  init: initSandS
});

SKK.registerMode('katakana', {
  displayName: '\u30ab\u30bf\u30ab\u30ca',
  keyHandler: createRomanInput(katakanaTable),
  compositionHandler: updateComposition,
  init: initSandS
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
