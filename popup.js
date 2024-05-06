function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

let listenersAdded = false;

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (tabs.length === 0) {
    console.error("No active tab found.");
    return;
  }

  const tab = tabs[0];
  const correctUrlPattern = /^https:\/\/podcasts\.google\.com\/(u\/\d+\/)?queue(\?pageId=none)?$/;

  if (correctUrlPattern.test(tab.url)) {
    document.getElementById("content").style.display = "grid";
    document.getElementById("wrongPage").style.display = "none";

    if (!listenersAdded) {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['contentScript.js']
      }, function() {
        if (chrome.runtime.lastError) {
          console.error("Error injecting content script:", chrome.runtime.lastError.message);
          return;
        }

        document.getElementById('countPodcasts').addEventListener('click', debounce(function () {
          chrome.tabs.sendMessage(tab.id, {action: "countPodcasts"});
        }, 300));

        document.getElementById('sortOldest').addEventListener('click', debounce(function () {
          chrome.tabs.sendMessage(tab.id, {action: "sortOldest"});
        }, 300));

        document.getElementById('sortNewest').addEventListener('click', debounce(function () {
          chrome.tabs.sendMessage(tab.id, {action: "sortNewest"});
        }, 300));

        document.getElementById('saveListOrder').addEventListener('click', debounce(function () {
          chrome.tabs.sendMessage(tab.id, {action: "saveListOrder"});
        }, 300));

        listenersAdded = true;
      });
    }
  } else {
    console.error("This extension is only for use on Google Podcasts Queue.");
    document.getElementById("content").style.display = "none";
    document.getElementById("wrongPage").style.display = "block";
  }
});
