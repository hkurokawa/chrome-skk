function Dictionary() {
  this.userDict = {};
  this.systemDict = {};
  this.systemDictParam = {};
  var self = this;
  chrome.storage.sync.get('options', (data) => {
    console.dir({'status': 'loaded saved options', 'data': data});
    if (data.options && data.options.system_dictionary) {
      self.systemDictParam = data.options.system_dictionary;
    }
  });
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (changes.options && changes.options.newValue.system_dictionary) {
      var param = changes.options.newValue.system_dictionary;
      self.systemDictParam = param;
      self.reloadSystemDictionary();
    }
  });
  this.initSystemDictionary();
  this.initUserDictionary();
}

(function() {
Dictionary.prototype.parseData = function(data) {
  // Not serious impl -- just check 'concat' function.
  function evalSexp(word) {
    if (word.indexOf('(concat ') != 0 || word[word.length - 1] != ')') {
      return word;
    }

    var result = '';
    var in_str = false;
    for (var i = ('(concat ').length; i < word.length; i++) {
      var c = word[i];
      if (c == '"') {
        in_str = !in_str;
        continue;
      }
      if (!in_str) {
        continue;
      }
      if (c == '\\') {
        result += String.fromCharCode(
          parseInt(word.slice(i + 1, i + 4), 8));
        i += 3;
      } else {
        result += c;
      }
    }
    return result;
  }

  function parseEntry(entry) {
    var semicolon = entry.indexOf(';');
    var result = {};
    if (semicolon < 0) {
      result.word = evalSexp(entry);
    } else {
      result.word = evalSexp(entry.slice(0, semicolon));
      result.annotation = evalSexp(entry.slice(semicolon + 1));
    }
    return result;
  }

  var lines = data.split('\n');
  var total = lines.length;
  var result = {};
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line[0] == ';') {
      continue;
    }
    var space_pos = line.indexOf(' ');
    var reading = line.slice(0, space_pos);
    var entries_string = line.slice(space_pos + 1).split('/');
    var entries = [];
    for (var j = 0; j < entries_string.length; j++) {
      if (entries_string[j].length > 0) {
        entries.push(parseEntry(entries_string[j]));
      }
    }
    if (i % 1000 == 0) {
      this.log({'status':'parsing', 'progress':i, 'total':lines.length});
    }
    result[reading] = entries;
  }
  return result;
}

Dictionary.prototype.log = function(obj) {
  chrome.runtime.sendMessage({
    method: "update_dictionary_load_status",
    body: obj
  }, function(_) {
    if (chrome.runtime.lastError) {
      console.log('dictionary logger', chrome.runtime.lastError.message);
    }
  });
};

Dictionary.prototype.doUpdate = function() {
  if (!this.systemDictParam.url) return
  var self = this;
  var url = this.systemDictParam.url;
  var compression = this.systemDictParam.compression;
  var encoding = this.systemDictParam.encoding;
  self.log({'status': 'loading', 'url': url, 'compression': compression, 'encoding': encoding});
  fetch(url).then((response) => {
    self.log({status:'loaded'});
    if (!response.ok) {
      self.log({status: 'error', statusCode: response.status});
      throw new Error("Failed to load " + url + ": [" + response.statusCode + "] " + response.statusText);
    }
    return response.arrayBuffer();
  }).then((binary) => {
    var decompressed;
    if (compression == 'gz') {
      self.log({'status': 'decompressing'});
      decompressed = pako.inflate(binary);
    } else {
      decompressed = binary;
    }
    return Promise.resolve(decompressed);
  }).then((decompressed) => {
    return new Promise((resolve, reject) => {
      var fr = new FileReader;
      fr.onload = () => {
        resolve(fr.result)
      };
      fr.onerror = reject;
      fr.readAsText(new Blob([decompressed], {type: "text/plain"}), encoding);
    });
  }).then((content) => {
    var systemDict = self.parseData(content);
    self.systemDict = systemDict;
    self.log({'status':'parsed'});
    chrome.storage.local.set({ systemDict });
    self.log({'status':'written'});
  });
};

Dictionary.prototype.reloadSystemDictionary = function() {
  this.doUpdate();
};

Dictionary.prototype.syncUserDictionary = function() {
  var userDict = this.userDict;
  chrome.storage.local.set({ userDict });
};

Dictionary.prototype.initSystemDictionary = function() {
  var self = this;
  chrome.storage.local.get('systemDict', (data) => {
    if (data.systemDict) {
      self.log({'status':'loaded_system_dict_from_storage', dict_size: Object.keys(data.systemDict).length});
      self.systemDict = data.systemDict;
    } else {
      self.doUpdate();
    }
  });
};

Dictionary.prototype.initUserDictionary = function() {
  var self = this;
  chrome.storage.local.get('userDict', (data) => {
    if (data.userDict) {
      self.log({'status':'loaded_user_dict_from_storage', dict_size: Object.keys(data.userDict).length});
      self.userDict = data.userDict;
    }
  });
};

Dictionary.prototype.numberFormat = function(rawWord, numbers) {
  const kansuu = ['〇','一','二','三','四','五','六','七','八','九'];
  const grouping = new Intl.NumberFormat('ja-JP');
  let r = 0;
  const word = rawWord.replace(/#[0-8]/g, (n) => {
    const rawNumber = numbers[r++];
    switch (n) {
      case '#1':
        return rawNumber.split('').map((d) =>
          String.fromCharCode(d.charCodeAt(0) + 65248)
        ).join('');
      case '#2':
        return rawNumber.split('').map((d) => kansuu[d]).join('');
      case '#8':
        return grouping.format(rawNumber);
      default:
        return rawNumber;
    }
  });
  return word;
}

Dictionary.prototype.lookup = function(reading) {
  const numbers = [];
  const maskedReading = reading.replace(/[0-9]+/g, (match) => {
    numbers.push(match);
    return '#';
  });
  var entries = [];
  var userEntries = this.userDict[maskedReading] || [];
  var systemEntries = this.systemDict[maskedReading] || [];
  var word_set = {};
  for (var i = 0; i < userEntries.length; i++) {
    const rawWord = userEntries[i].word;
    const word = this.numberFormat(rawWord, numbers);
    if (!word_set[word]) {
      entries.push({...userEntries[i], rawWord:rawWord, word:word});
      word_set[word] = true;
    }
  }
  for (var i = 0; i < systemEntries.length; i++) {
    const rawWord = systemEntries[i].word;
    const word = this.numberFormat(rawWord, numbers);
    if (!word_set[word]) {
      entries.push({...systemEntries[i], rawWord:rawWord, word:word});
      word_set[word] = true;
    }
  }

  if (entries.length > 0) {
    return {reading:maskedReading, data:entries};
  } else {
    return null;
  }
};

Dictionary.prototype.recordNewResult = function(reading, newEntry) {
  var userEntries = this.userDict[reading];
  if (userEntries == null) {
    this.userDict[reading] = [newEntry];
  } else {
    var existing_i = -1;
    for (var i = 0; i < userEntries.length; i++) {
      if (userEntries[i].word == newEntry.word) {
        existing_i = i;
        break;
      }
    }
    if (existing_i >= 0) {
      this.userDict[reading].splice(existing_i, 1);
    }
    this.userDict[reading].unshift(newEntry);
  }

  this.syncUserDictionary();
};

Dictionary.prototype.removeUserEntry = function(reading, word) {
  var userEntries = this.userDict[reading] || [];
  if (userEntries.length == 0) {
    return;
  }
  var existing_i = -1;
  for (var i = 0; i < userEntries.length; i++) {
    if (userEntries[i].word == word) {
      existing_i = i;
      break;
    }
  }
  if (existing_i < 0) {
    return;
  }
  userEntries.splice(existing_i, 1);
  if (userEntries.length > 0) {
    this.userDict[reading] = userEntries;
  } else {
    delete this.userDict[reading];
  }
  this.syncUserDictionary();
};

function complete(dict, reading) {
  if (!reading || reading.length == 0) {
    return [];
  }
  const numbers = [];
  const maskedReading = reading.replace(/[0-9]+/g, (match) => {
    numbers.push(match);
    return '#';
  });
  let r = 0;
  return Object.keys(dict)
    .filter((key) => key.startsWith(maskedReading))
    .map((key) => {
      let r = 0;
      return key
        .replace(/[a-z]*$/, '')
        .replace(/#/g, () => numbers[r++] || '#');
    });
}

Dictionary.prototype.userComplete = function(reading) {
  return complete(this.userDict, reading);
}

Dictionary.prototype.systemComplete = function(reading) {
  return complete(this.systemDict, reading);
}

})();
