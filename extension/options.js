var compressions = [['gzip', 'gz'], ['none', '']];
var encodings = [['EUC-JP', 'euc-jp'], ['UTF-8', 'utf-8']];

function logger(obj) {
  var div = document.getElementById('reloading_message');
  div.innerHTML = '';
  if (obj.status == 'written') {
    div.style.display = 'none';
    document.getElementById('system_dictionary').disabled = '';
    document.getElementById('reload_button').disabled = '';
    return;
  }

  div.style.display = 'block';
  div.appendChild(document.createTextNode(obj.status));
  if (obj.status == 'parsing') {
    div.appendChild(
      document.createTextNode(': ' + obj.progress + '/' + obj.total));
  }
}

function buildSelect(selectElement, options) {
  for (var i = 0; i < options.length; i++) {
    var option = document.createElement('option');
    option.textContent = options[i][0];
    option.value = options[i][1];
    selectElement.appendChild(option);
  }
}

function onload() {
  var bgPage = chrome.extension.getBackgroundPage();
  var form = document.getElementById('system_dictionary');
  var url_input = document.getElementById('url');
  var compression = document.getElementById('compression');
  buildSelect(compression, compressions);
  var encoding = document.getElementById('encoding');
  buildSelect(encoding, encodings);

  var reload_button = document.getElementById('reload_button');

  document.getElementById('reload_button').onclick = function() {
    bgPage.skk_dictionary.setSystemDictionaryUrl({
      url: url_input.value,
      compression: compression.value,
      encoding: encoding.value
    });
    form.disabled = 'disabled';
    reload_button.disabled = 'disabled';
    bgPage.skk_dictionary.reloadSystemDictionary(logger);
  };
}

window.addEventListener('load', onload);