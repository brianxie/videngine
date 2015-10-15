var queryInfo = {
	active: true,
	currentWindow: true
};

var popupHtml; // Contains the HTML to be added to the extension popup

/* Gets the URL where transcript is located, then calls a function which
 * stores transcript into popupHtml. Changes when tab is reloaded or user
 * navigates to different page in same tab, but is aborted if user switches
 * tabs before function completion.
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	var callingtaburl = tab.url; // URL of the tab which triggers onUpdated, i.e. the tab which updated
	if (changeInfo.status == "complete") { // Only run function when tab is completely loaded, so it doesn't fire at every update
		chrome.tabs.query(queryInfo, function(tabs) {
			if (tabs[0].url == callingtaburl) { // Current active tab must be same which called onUpdate, otherwise abort (to prevent writing incorrect subtitles)
				popupHtml = ""; // Clear HTML
				var taburl = tabs[0].url;
				var videoid = getVideoId(taburl);
				var transcripturl = "http://www.youtube.com/api/timedtext?v=" + videoid + "&lang=en";
				var transcript = getXml(transcripturl);
				if (transcript == -1) { // Manual captions not available
					var autotranscripthtml = getHtml(taburl);
					var autotranscripturl = getUrlFromHtml(autotranscripthtml);
					if (autotranscripturl == null) { // No reference to TTS_URL found in HTML
						popupHtml += "No captions available";
					} else { // TTS_URL found in HTML
						var nurl = autotranscripturl + "&type=track" + "&lang=en" + "&name" + "&kind=asr";
						var autotranscript = getXml(nurl);
						if (autotranscript == -1) { // TTS_URL link is bad
							popupHtml += "No captions available";
						} else { // Found automatic transcript
							writeTimestampsEvent(autotranscript, videoid, true);
						}
					}
				} else { // Found manual transcript
					writeTimestampsEvent(transcript, videoid, false);
				}
			} else {
				console.log("Tab was switched before onUpdated completed. Aborting.");
			}
		});
	}
});

/* Gets the URL where transcript is located, then calls a function which
 * stores transcript into popupHtml. Only changes when switching tabs.
 */
chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab) {
		if (tab.status == "complete") { // Only run function when tab is completely loaded, so it doesn't fire at every update
			popupHtml = ""; // Clear HTML
			var taburl = tab.url;
			var videoid = getVideoId(taburl);
			var transcripturl = "http://www.youtube.com/api/timedtext?v=" + videoid + "&lang=en";
			var transcript = getXml(transcripturl);
			if (transcript == -1) { // Manual captions not available
				var autotranscripthtml = getHtml(taburl);
				var autotranscripturl = getUrlFromHtml(autotranscripthtml);
				if (autotranscripturl == null) { // No reference to TTS_URL found in HTML
					popupHtml += "No captions available";
				} else { // TTS_URL found in HTML
					var nurl = autotranscripturl + "&type=track" + "&lang=en" + "&name" + "&kind=asr";
					var autotranscript = getXml(nurl);
					if (autotranscript == -1) { // TTS_URL link is bad
						popupHtml += "No captions available";
					} else { // Found automatic transcript
						writeTimestampsEvent(autotranscript, videoid, true);
					}
				}
			} else { // Found manual transcript
				writeTimestampsEvent(transcript, videoid, false);
			}
		}
	});
});

/* Stores transcript in popupHtml.
 */
function writeTimestampsEvent(xmldoc, videoid, auto) {
	if (auto == true) {
		popupHtml += "<div>Automatically-generated captions<br><br></div>";
	} else {
		popupHtml += "<div>Manually-generated captions<br><br></div>";
	}
	for (i = 0; xmldoc[i] != null; i++) {
		var timestamp = xmldoc[i].getAttribute("start");
		timestamp = timestamp.split(".")[0];
		var tsidlink = "link" + i.toString();
		var s = timestamp % 60;
		if (s < 10) {
			s = "0" + s.toString();
		}
		var m = Math.floor(timestamp/60);
		m = m % 60;
		// if (m < 10) {
		// 	m = "0" + m.toString();
		// }
		var h = Math.floor(timestamp/3600);
		// if (h < 10) {
		// 	h = "0" + h.toString();
		// }
		// if (h == "00") {
		if (h == 0) {
			popupHtml += "<a id='" + tsidlink + "' value=" + timestamp + "><b>" + m + ":" + s + "</b></a>";
		} else {
			if (m < 10) {
				m = "0" + m.toString();
			}
			popupHtml += "<a id='" + tsidlink + "' value=" + timestamp + "><b>" + h + ":" + m + ":" + s + "</b></a>";
		}
		popupHtml += "&nbsp &nbsp &nbsp &nbsp";
		if (xmldoc[i].childNodes[0]) {
			popupHtml += xmldoc[i].childNodes[0].nodeValue;
		}
		popupHtml += "<br>";
	}
}

/* Gets the video ID from the YouTube URL.
 */
function getVideoId(url) {
	return url.split("=")[1]; // Assume simple, well-formed url
}

/* Gets XML caption data from transcript URL.
 */
function getXml(url) {
	var http = new XMLHttpRequest();
	http.open("GET", url, false);
	try {
		http.send(null);
	}
	catch(err) {
		return -1;
	}
	if (http == null) {
		return -1;
	}
	if (http.responseXML == null) {
		return -1;
	}
	return http.responseXML.getElementsByTagName("text");
}

/* Gets full html of current YouTube page. Contains the automatic
 * transcript URL.
 */
function getHtml(url) {
	var http = new XMLHttpRequest();
	http.open("GET", url, false);
	http.send(null);
	if (http == null) {
		return -1;
	}
	if (http.responseText == null) {
		return -1;
	}
	return http.responseText;
}

/* Parses through YouTube HTML to find automatic transcript URL.
 * Painfully slow. It's stored in a JSON object, so there should be some
 * other way to get the URL.
 */
function getUrlFromHtml(hfile) {
	var index = hfile.search('TTS_URL');
	index = index + 11;
	var tempstr = ""
	while (hfile[index] != '"') {
		if (hfile[index] == '\\') {
			if (hfile[index + 1] == 'u') {
				tempstr = tempstr + '&';
				index = index + 6;
			} else {
				index = index + 1;
			}
		} else {
			tempstr = tempstr + hfile[index];
			index = index + 1;
		}
	}
	return tempstr;
}
