(function() {

function updateComposition(skk) {
  var entry = skk.entries.entries[skk.entries.index];
  if (!entry) {
    skk.clearComposition();
  }

  var preedit = '\u25bc' + entry.word;
  if (skk.okuriText.length > 0) {
    preedit += skk.okuriText;
  }
  skk.setComposition(preedit, 1, {selectionStart:1,
                                  selectionEnd:preedit.length});
}

function initConversion(skk) {
  skk.lookup(skk.preedit + skk.okuriPrefix, function(entries) {
    if (entries) {
      skk.entries = {index:0, entries:entries, label:'asdfjkl'};
      updateComposition(skk);
    } else {
      skk.createInnerSKK();
    }
  });
}

function conversionMode(skk, keyevent) {
  if (keyevent.key == ' ') {
    if (skk.entries.index > 2) {
      skk.entries.index += 7;
    } else {
      skk.entries.index++;
    }

    if (skk.entries.index >= skk.entries.entries.length) {
      skk.createInnerSKK();
    }
  } else if (keyevent.key == 'x') {
    if (skk.entries.index > 9) {
      skk.entries.index -= 7;
    } else {
      skk.entries.index--;
    }
    if (skk.entries.index < 0) {
      skk.entries = null;
      skk.preedit += skk.okuriText;
      skk.okuriText = '';
      skk.okuriPrefix = '';
      skk.switchMode('preedit');
    }
  } else if (keyevent.key == 'Esc' ||
             (keyevent.key == 'g' && keyevent.ctrlKey)) {
    skk.entries = null;
    skk.preedit += skk.okuriText;
    skk.okuriText = '';
    skk.okuriPrefix = '';
    skk.switchMode('preedit');
  } else if (keyevent.key == 'Shift') {
    // do nothing
  } else if (keyevent.key == 'X') {
    var entry = skk.entries.entries[skk.entries.index];
    skk.dictionary.removeUserEntry(
      skk.preedit.replace(/[0-9]+/g, '#') + skk.okuriPrefix,
      entry.rawWord
    );
    skk.entries = null;
    skk.preedit += skk.okuriText;
    skk.okuriText = '';
    skk.okuriPrefix = '';
    skk.switchMode('preedit');
  } else {
    var is_commit_key = (
      keyevent.key == 'Enter' || (keyevent.key == 'j' && keyevent.ctrlKey));
    if (skk.entries.index > 2 &&
        (!keyevent.ctrlKey && !keyevent.shiftKey && !keyevent.altKey &&
         'asdfjkl'.indexOf(keyevent.key) >= 0)) {
      skk.entries.index += 'asdfjkl'.indexOf(keyevent.key);
      is_commit_key = true;
    }
    var entry = skk.entries.entries[skk.entries.index];
    skk.commitText(entry.word + skk.okuriText);
    skk.recordNewResult({...entry, word:entry.rawWord, rawWord:undefined});
    skk.clearComposition();
    skk.entries = null;
    skk.okuriText = '';
    skk.okuriPrefix = '';
    if (keyevent.key == '>') {
      skk.preedit = '>';
      skk.switchMode('preedit');
    } else {
      skk.preedit = '';
      skk.switchMode('hiragana');
      if (!is_commit_key) {
        return skk.handleKeyEvent(keyevent);
      }
    }
  }

  return true;
}

SKK.registerImplicitMode('conversion', {
    keyHandler: conversionMode,
    initHandler: initConversion,
    compositionHandler: updateComposition
});
})();
