chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	// lisents for a message to load the bom and other segmentation libs
	if(request.msg == "loadlib") {

		chrome.tabs.executeScript({file: "js/lib/rectlib.js"}, function() {
			chrome.tabs.executeScript({file: "js/lib/bomlib.js"}, function() {
			   chrome.tabs.executeScript({file: "js/lib/pmanual2.js"}, function() {

				});
			});
		});
	
	    chrome.tabs.captureVisibleTab( null, {},
		        function(dataUrl){
		        	sendResponse({url: dataUrl});
		}); 

		var mob_win_width = 1024;
		var mob_win_height = 700;
		chrome.tabs.getSelected(null, function(tab) {
			chrome.windows.create({'tabId':tab.id, 'width': mob_win_width, 'height': mob_win_height, 'type': 'popup'});
		});
	}
	return true;
});


// chrome.runtime.onMessage.addListener(
// 	function(request, sender, sendResponse) {
// 	    chrome.tabs.captureVisibleTab(
// 	        null,
// 	        {},
// 	        function(dataUrl){
// 	        	console.log(dataUrl);
// 	        }); 
// 	    return true;
// }
// );
