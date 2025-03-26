var popupWindow = window.open(
    chrome.runtime.getURL("main-popup.html"),
    "CRODevHelperPopup",
    "width=400,height=400,popup=true"
);

console.log(popupWindow)


chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  var activeTab = tabs[0];
  var activeTabId = activeTab.id;

  popupWindow.croTabId = activeTabId;

  window.close();
});
