/* Content script which injects jump.js into the HTML. I don't even
 * know why this works. Also listens for message from popup, then relays
 * the contained information to the injected script jump.js which can
 * access video controls.
 */
var s = document.createElement('script');
s.src = chrome.extension.getURL('jump.js');
s.onload = function() {
	s.parentNode.removeChild(s);
};
(document.head || document.documentElement).appendChild(s);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	document.dispatchEvent(new CustomEvent('videngine', {
		detail: request.ts
	}));
});
