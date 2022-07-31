var compression_formats = [['gzip', 'gz'], ['none', '']];
var encodings = [['EUC-JP', 'euc-jp'], ['UTF-8', 'utf-8']];

// function logger(obj) {
//   var div = document.getElementById('reloading_message');
//   div.innerHTML = '';
//   if (obj.status == 'written') {
//     div.style.display = 'none';
//     document.getElementById('system_dictionary').disabled = '';
//     document.getElementById('reload_button').disabled = '';
//     return;
//   }

//   div.style.display = 'block';
//   div.appendChild(document.createTextNode(obj.status));
//   if (obj.status == 'parsing') {
//     div.appendChild(
//       document.createTextNode(': ' + obj.progress + '/' + obj.total));
//   }
// }

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
      form.compression_format.value = data.options.system_dictionary.compression_format;
      form.encoding.value = data.options.system_dictionary.encoding;
    }
  });

  var compression_format = form.compression_format;
  buildSelect(compression_format, compression_formats);
  var encoding = form.encoding;
  buildSelect(encoding, encodings);

  var reload_button = document.getElementById('reload_button');

  document.getElementById('reload_button').onclick = function () {
    var options = {
      'system_dictionary': {
        'url': form.url.value,
        'compression_format': compression_format.value,
        'encoding': encoding.value,
      }
    };
    chrome.storage.sync.set({ options });

    form.disabled = 'disabled';
    reload_button.disabled = 'disabled';
  };
}

window.addEventListener('load', onload);
