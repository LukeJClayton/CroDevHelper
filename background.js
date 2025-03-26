let currentJS = '';
let currentCSS = '';
let basic = {};
let url = '';

const getTabById = tid => chrome.tabs.query({}).then((tabs => tabs.find((tab => tab.id === tid))));
const getLastTabId = () => chrome.storage.local.get("lastTab").then((info => info?.lastTab));
const checkUrlForGood = url => url?.startsWith("http");
const setTabId = async (tabId, callback) => {
    chrome.storage.local.set({
        lastTab: tabId
    });
}

const executeJS = async (bestCode, tabId, callback) => {
    if (!bestCode) return callback({
        err: 1,
        info: "Impossible, somehow no code"
    });

    if (!tabId) return callback({
        err: 2,
        info: "No tab (tabId) for job"
    });

    try {
        basic = {
            injectImmediately: !0,
            world: "MAIN",
            target: {
                allFrames: !!0,
                tabId
            }
        };

        currentJS = bestCode;
        const tab = await chrome.tabs.get(tabId);
        if (!tab) {
            chrome.storage.local.set({
                lastTab: false
            });

            executeJS(bestCode)
        } else {
            url = tab.url;

            chrome.tabs.reload(tabId)
        }
    } catch (e) {
        chrome.storage.local.set({
            lastTab: false
        });
        return console.error(e), callback({
            err: 3,
            info: e.message
        })
    }
    return callback({
        err: 0,
        info: "All good"
    })
};

const executeCSS = async (bestCode, tabId, callback) => {
    if (!bestCode) return callback({
        err: 1,
        info: "Impossible, somehow no code"
    });

    if (!tabId) return callback({
        err: 2,
        info: "No tab (tabId) for job"
    });

    try {
        basic = {
            injectImmediately: !0,
            world: "MAIN",
            target: {
                allFrames: !!0,
                tabId
            }
        };

        chrome.scripting.removeCSS({
            target: { tabId: tabId },
            css: currentCSS
        })

        const tab = await chrome.tabs.get(tabId);
        url = tab.url;

        chrome.scripting.insertCSS({
            target: { tabId: tabId },
            css: bestCode
        })

        setTimeout(() => {
            currentCSS = bestCode;
        }, 1)
    } catch (e) {
        return console.error(e), callback({
            err: 3,
            info: e.message
        })
    }
    return callback({
        err: 0,
        info: "All good"
    })
};

chrome.runtime.onMessage.addListener(((r, sender, callback) => "fileUpdateJS" === r.message && (executeJS(r.code, r.tabId, callback), !0)))
chrome.runtime.onMessage.addListener(((r, sender, callback) => "fileUpdateCSS" === r.message && (executeCSS(r.code, r.tabId, callback), !0)))

chrome.runtime.onConnect.addListener(function (externalPort) {
  externalPort.onDisconnect.addListener(function () {
    currentJS = '';
    currentCSS = '';
  })
})


chrome.webNavigation.onCommitted.addListener((details) => {
    if (["reload", "link", "typed", "generated"].includes(details.transitionType) &&
        details.url === url) {
        chrome.webNavigation.onCompleted.addListener(function onComplete() {

            setTimeout((async() => {

                await chrome.scripting.executeScript({
                    ...basic,
                    args: [currentJS],
                    func: code => {
                        const anel = document.createElement("script");
                        anel.textContent = `(async()=>{` + code + `\n})();`
                        document.documentElement.appendChild(anel)
                    }
                })

                if (currentCSS && currentCSS != '') {
                    setTimeout(() => {
                        chrome.scripting.insertCSS({
                            target: { tabId: basic.target.tabId },
                            css: currentCSS
                        })
                    }, 1)
                }
            }), 100)

            chrome.webNavigation.onCompleted.removeListener(onComplete);
        });
    }
});