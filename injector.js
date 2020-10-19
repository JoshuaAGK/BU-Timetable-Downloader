// Load script from injector.js
var script = document.createElement('script');
script.src = chrome.extension.getURL('content.js');
script.onload = function() {
    this.remove();
};

// Load image (download icon) from images folder
var imageElement = document.createElement("img");
imageElement.src = chrome.extension.getURL('images/BC128White.png');
imageElement.setAttribute("id", "buTimetableDownloaderLogoMax");
imageElement.setAttribute("style", "display: none;");

// Append script and image to DOM.
(document.head || document.documentElement).appendChild(script);
(document.head || document.documentElement).appendChild(imageElement);