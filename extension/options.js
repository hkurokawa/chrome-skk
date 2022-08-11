var compressions = [['gzip', 'gz'], ['none', '']];
var encodings = [['EUC-JP', 'euc-jp'], ['UTF-8', 'utf-8']];

function buildSelect(selectElement, options) {
  for (var i = 0; i < options.length; i++) {
    var option = document.createElement('option');
    option.textContent = options[i][0];
    option.value = options[i][1];
    selectElement.appendChild(option);
  }
}

function onload() {
  var form = document.getElementById('system_dictionary');
  chrome.storage.sync.get('options', (data) => {
    console.dir({'status': 'loaded saved options', 'data': data});
    if (data.options && data.options.system_dictionary) {
      form.url.value = data.options.system_dictionary.url;
      form.compression.value = data.options.system_dictionary.compression;
      form.encoding.value = data.options.system_dictionary.encoding;
    }
  });  
  var url_input = form.url;
  var compression_input = form.compression;
  buildSelect(compression_input, compressions);
  var encoding_input = form.encoding;
  buildSelect(encoding_input, encodings);

  var reload_button = document.getElementById('reload_button');

  document.getElementById('reload_button').onclick = function() {
    var options = {
      system_dictionary: {
        url: url_input.value,
        compression: compression_input.value,
        encoding: encoding_input.value
      }
    };
    chrome.storage.sync.set({ options });
    form.disabled = 'disabled';
    reload_button.disabled = 'disabled';
  };
}

function onReceive(request, sender, sendResponse) {
  var div = document.getElementById('reloading_message');
  div.innerHTML = '';
  if (request.status == 'written') {
    div.style.display = 'none';
    document.getElementById('system_dictionary').disabled = '';
    document.getElementById('reload_button').disabled = '';
    return;
  }
  div.style.display = 'block';
  div.appendChild(document.createTextNode(request.status));
  if (request.status == 'parsing') {
    div.appendChild(
      document.createTextNode(': ' + request.progress + '/' + request.total));
  }
}

window.addEventListener('load', onload);
chrome.runtime.onMessage.addListener(onReceive);
