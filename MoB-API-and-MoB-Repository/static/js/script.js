
$(document).ready ( function () {

	$(".granularity").click( function () {

		$(this).siblings(".active").removeClass( "active" );
		$(this).addClass( "active" );
		var gran = $(this).data("gran");
		$(".algorithm.active").removeClass( "active" );
		$(".seg-info").hide();
		$(".group-alg").hide();
		$("#algorithm"+gran).slideDown( "slow");
	});

	$(".algorithm").click(function() {

		$(this).siblings(".active").removeClass( "active" );
		$(this).addClass( "active" );
		var type = $(this).data("type");
		var gran = $(".granularity.active").data("gran");

		$(".seg-info").hide();
		$("#seg-info-"+type+gran).slideDown( "slow");
	});


	// ------- Check Lenguage and Control it.
	var leng = readCookie("mob_leng");

	if (leng == null) { // we set the default leng
		createCookie("mob_leng","en");
		changeLeng("en");
	} else {
		$("#mob-rep-leng").val(leng); 
		changeLeng(leng);
	}

	$("#mob-rep-leng").change(function(){
		createCookie("mob_leng",this.value);
		changeLeng(this.value);
	});
	// --------

}); 

function changeLeng(leng) {

	$(".mob-leng-es").hide();
	$(".mob-leng-en").hide();
	$(".mob-leng-fr").hide();

	$(".mob-leng-"+leng).show();
}

function createCookie(name, value, days) {
    var expires;

    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function search_refresh (col) {
	$(".s_option").hide();
	$(".id_"+col).show();
	$("#s_category").val("all");
}

function drawpreview(id,blocks,zoom,width,height) {

    var c=document.getElementById(id);
    var ctx=c.getContext("2d");
    ctx.scale(1/zoom,1/zoom);

    ctx.rect(0,0,width,height);
    ctx.stroke();

    for (var i=0;i<blocks.length;i++) {
        var seg = blocks[i];
        ctx.rect(seg[0],seg[1],seg[2],seg[3]);
        ctx.strokeStyle="#5ac2ec";
        ctx.stroke();
        ctx.font="26px Verdana";
        ctx.fillText(seg[4],seg[0]+20,seg[1]+30);
    }
}

function mob_delete(msg,id) {
	var r = confirm(msg);
	if (r) {
		var link = $(id).data("mob_url");
		window.location.replace(link);
	} 
}