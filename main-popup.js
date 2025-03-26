document.title = 'CRO Dev Helper'

setTimeout(() => {
    chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {focused: true});
}, 10);

var port = chrome.runtime.connect();

var tabId = window.croTabId;

async function getTheJSFile() {
  const pickerOpts = {
    types: [
      {
        description: "JS",
        accept: {
          "image/*": [".js"],
        },
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
  };

  const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
  return fileHandle;
}

function debounce(func) {
    let timeoutID;

    function debouncedFunc(...args) {

        if (timeoutID !== undefined) {
            clearTimeout(timeoutID);
        }

        function executeFunc() {
            func(...args);
        }

        timeoutID = setTimeout(executeFunc, 1000);
    }

    return debouncedFunc;
}

const handleJSFileChange = (fileHandle) => {
    const fileData = fileHandle.getFile();

	document.querySelector('#js-file-name').innerHTML = fileHandle.name;
    fileData.then((file) => {

        const reader = new FileReader();
        reader.onload = (async() => {
            const response = await chrome.runtime.sendMessage({
                message: "fileUpdateJS",
                code: reader.result.replace('<script>', '').replace('</script>', ''),
                tabId: tabId
            }).then((a => {
                if (a?.err || 0 === a?.err) return a;
                throw new Error("No response.err code recieved")
            })).catch((e => (console.error("err:", e.message), {
                err: 4,
                info: "No connection to background\n\nAnd real err: " + e.message
            })));
            if (console.log("response:", response), 0 === response.err) return "Success";
            let text = `Error: ${response.err}`;
            response.info && (text = `${text} (Ctrl+C for more info)\n\n${response.info}`)
        });
        reader.onerror = () => {
            showMessage("Error reading the file. Please try again.", "error");
        };
        reader.readAsText(file);
    })
}

const handleCSSFileChange = (fileHandle) => {
    const fileData = fileHandle.getFile();

    document.querySelector('#css-file-name').innerHTML = fileHandle.name;
    fileData.then((file) => {

        const reader = new FileReader();
        console.log('here')
        reader.onload = (async() => {
            const response = await chrome.runtime.sendMessage({
                message: "fileUpdateCSS",
                code: reader.result.replace('<style>', '').replace('</style>', ''),
                tabId: tabId
            }).then((a => {
                if (a?.err || 0 === a?.err) return a;
                throw new Error("No response.err code recieved")
            })).catch((e => (console.error("err:", e.message), {
                err: 4,
                info: "No connection to background\n\nAnd real err: " + e.message
            })));
            if (console.log("response:", response), 0 === response.err) return "Success";
            let text = `Error: ${response.err}`;
            response.info && (text = `${text} (Ctrl+C for more info)\n\n${response.info}`)
        });
        reader.onerror = () => {
            showMessage("Error reading the file. Please try again.", "error");
        };
        reader.readAsText(file);
    })
}

const fileObserverJSCallback = (e) => {
    handleJSFileChangeHandler(e[0].changedHandle)
}

const handleJSFileChangeHandler = debounce(handleJSFileChange); 
const jsobserver = new FileSystemObserver(fileObserverJSCallback);

const fileObserverCSSCallback = (e) => {
    handleCSSFileChangeHandler(e[0].changedHandle)
}

const handleCSSFileChangeHandler = debounce(handleCSSFileChange); 
const cssobserver = new FileSystemObserver(fileObserverCSSCallback);

window.onload = () => {
    async function getTheJSFile() {
      const pickerOpts = {
        types: [
          {
            description: "File",
            accept: {
              "file/*": [".js"],
            },
          },
        ],
        excludeAcceptAllOption: true,
        multiple: false,
      };

      const [fileHandle] = await window.showOpenFilePicker(pickerOpts);

      return fileHandle;
    }

    async function getTheCSSFile() {
      const pickerOpts = {
        types: [
          {
            description: "File",
            accept: {
              "file/*": [".css"],
            },
          },
        ],
        excludeAcceptAllOption: true,
        multiple: false,
      };

      const [fileHandle] = await window.showOpenFilePicker(pickerOpts);

      return fileHandle;
    }

    document.querySelector('#js-file-picker').addEventListener('click', (async () => {
        getTheJSFile().then((fileHandle) => {
        	document.querySelector('#js-file-name').innerHTML = fileHandle.name
            jsobserver.observe(fileHandle);
            handleJSFileChange(fileHandle);
        })
    }))

    document.querySelector('#css-file-picker').addEventListener('click', (async () => {
        getTheCSSFile().then((fileHandle) => {
            document.querySelector('#css-file-name').innerHTML = fileHandle.name
            handleCSSFileChange(fileHandle);
            cssobserver.observe(fileHandle);
        })
    }))
};