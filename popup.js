/* Loads background page.
 */
chrome.runtime.getBackgroundPage(function(backgroundPage) {
	document.write(backgroundPage.popupHtml);
	assignListeners();
});

/* After HTML is written to popup, assigns a listener to each HTML
 * element so that they respond to clicks by sending messages to the
 * content script, which then sends messages to the injected script to
 * access video controls.
 */
function assignListeners() {
	for (i = 0; document.getElementById("link" + i.toString()) != null; i++) {
		var ts = document.getElementById("link" + i.toString());
		ts.addEventListener('click', function(ts) {
			var total = ts.path[1].attributes[1].nodeValue;
			sendmsg(total);
		}, false);
	}
}

/* Sends message containing desired timestamp to content script.
 */
function sendmsg(t) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {ts: t}, function(response) {
			console.log("Jump requested by popup.");
		});
	});
}
