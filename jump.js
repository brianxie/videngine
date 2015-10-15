/* Script injected into webpage. Listens for timestamp, then jumps to
 * received timestamp.
 */
document.addEventListener('videngine', function(e) {
    jump(e.detail);
});

function jump(timestamp) {
	p = document.getElementById("movie_player");
	p.seekTo(timestamp, true)
}
