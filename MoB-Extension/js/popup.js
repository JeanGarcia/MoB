
window.onload = function () {

var api_url = 'https://mob.ciens.ucv.ve';
var alert_name = ["alert_success","alert_danger","alert_warning"];
var mob_session = false; // there's a session 
var mob_score_ajax = false; // it has already retrived the scores.
var mob_user_data = {};


document.getElementById("mob_loading").hidden = true; 
mob_check_login();

for (var i=0; i < 3; i++) {
	chrome.cookies.get({ url: api_url, name: alert_name[i] },
	  function (cookie) {
	    if (cookie) {
	    	var resp = JSON.parse(cookie.value);
	    	mob_alert(resp.type, resp.title, resp.msg);
	    } 
	});
	chrome.cookies.remove({url:api_url, name: alert_name[i] });
}


function mob_check_login () {
	// checks if the user has an active session. and update the extension info accordingly. 

	chrome.cookies.get({url: api_url, name: 'user_session'}, 
		function (cookie) {
			if (cookie) { // there's a session, updates with user info.
				mob_session = true;
				mob_user_render (cookie.value);
			} else {
				chrome.cookies.get({url: api_url, name: 'mob_leng'}, 
					function (cookie) {
						if (cookie) { // there's a session, updates with user info.
							mob_changeleng(cookie.value);
						}else {
							mob_changeleng("en");
						} 
				});	
			}
		});	
}

function mob_user_render ( data ) { 
	// renders the extension with the user data.
	data = JSON.parse(data);
	//loading
	document.getElementById("mob_loading").hidden = false; 

	mob_user_data.username = data.username;
	
	chrome.tabs.getSelected(null, function(tab){
		mob_user_data.link = tab.url;
	});

	document.getElementById("data_username2").innerHTML =  data.username;
	document.getElementById("data_mail2").innerHTML =  data.email;
	document.getElementById("data_username").value =  data.username;
	document.getElementById("data_mail").value =  data.email;
	document.getElementById("data_name").value =  data.name;
	document.getElementById("data_lastname").value =  data.lastname;

	chrome.cookies.get({url: api_url, name: 'mob_leng'}, 
		function (cookie) {
			if (cookie) { // there's a session, updates with user info.
				mob_changeleng(cookie.value);
			}else {
				mob_changeleng("en");
			} 
	});	

	document.getElementById("home_login").hidden = true;
	document.getElementById("rank_default").hidden = true;
	document.getElementById("mob_ls_btn").hidden = true;
	document.getElementById("home_home").hidden = false;
	document.getElementById("rank_user").hidden = false;
	document.getElementById("logout_btn").hidden = false;
	document.getElementById("mob_loading").hidden = true; 
}

function mob_alert (type,title,msg) {
	document.getElementById("mobpopalert").innerHTML = '<div class="alert alert-'+type+' alert-dismissable mobpopalert" >'
        +'<a  href="#" class="close" data-dismiss="alert" aria-label="close" >×</a>'
        +'<strong>'+title+'</strong> <span>'+msg+'</span>'
      	+'</div> ';
}

function mob_cookie (c_name, c_value) { 
	//cookie handler
	c_value = JSON.stringify(c_value);
	chrome.cookies.set({ url: api_url, name: c_name, value: c_value });
}

function mob_form_validate (form) {
	var myform = document.getElementById(form);
	var myinputs = myform.getElementsByTagName("input");

	for (var i=0; i < myinputs.length; i++) {
		if(!myinputs[i].checkValidity()) {
			return false;
		}
	}
	return true;
}

function mob_changeleng (leng) {
	// changes language
	var col = mob_leng[leng];
	document.getElementById("info_username").innerHTML = col.info_username;
	document.getElementById("info_email").innerHTML = col.info_email;
	document.getElementById("info_name").innerHTML = col.info_name;
	document.getElementById("info_lastname").innerHTML = col.info_lastname;
	document.getElementById("info_newpass").innerHTML = col.info_newpass;
	document.getElementById("note_newpass").innerHTML = col.note_newpass;
	document.getElementById("save_btn").innerHTML = col.save_btn;
	document.getElementById("home_msg_2").innerHTML = col.home_msg_2;
	document.getElementById("h_login").innerHTML = col.h_login;
	document.getElementById("login_msg_1").innerHTML = col.login_msg_1;
	document.getElementById("h_sign").innerHTML = col.h_sign;
	document.getElementById("logout_btn").innerHTML = col.logout_btn;
	document.getElementById("p_terms").innerHTML = col.p_terms;
	document.getElementById("h_home").innerHTML = col.h_home;
	document.getElementById("startB").innerHTML = col.startB;
	document.getElementById("h_rank").innerHTML = col.h_rank;
	document.getElementById("rank_msg_1").innerHTML = col.rank_msg_1;
	document.getElementById("rank_msg_2").innerHTML = col.rank_msg_2;
	document.getElementById("p_tip").innerHTML = col.p_tip;
	document.getElementById("h_info").innerHTML = col.h_info;
	document.getElementById("infobtn").innerHTML = col.infobtn;
	document.getElementById("addbtn").innerHTML = col.addbtn;
	document.getElementById("deletebtn").innerHTML = col.deletebtn;
	document.getElementById("mergebtn").innerHTML = col.mergebtn;
	document.getElementById("cutbtn").innerHTML = col.cutbtn;
	document.getElementById("tagbtn").innerHTML = col.tagbtn;
	document.getElementById("selectbtn").innerHTML = col.selectbtn;
	document.getElementById("submitbtn").innerHTML = col.submitbtn;
	document.getElementById("p_credit").innerHTML = col.p_credit;
	document.getElementById("forgot_btn").innerHTML = col.forgot_btn;
	document.getElementById("recover_btn").innerHTML = col.recover_btn;


	document.getElementById("user_username").placeholder = col.user_username;
	document.getElementById("user_pass").placeholder = col.user_pass;
	document.getElementById("user_username2").placeholder = col.user_username2;
	document.getElementById("user_pass2").placeholder = col.user_pass2;
	document.getElementById("user_email2").placeholder = col.user_email2;
	document.getElementById("recover_email").placeholder = col.user_email2;
}

function mob_userscore () {
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
		var data = JSON.parse(this.responseText);
		if(data.code == 200) {
			var score = data.data;					
			user_score = '<div id="user-score" class="col-12 Popup-content tab-pane active " align="center"> '
							+ '<table class="table table-responsive table-sm table-striped table-bordered " style="display: inline-table;" > '
							+'	<tbody> '
							+'      <tr>  <th> Gran </th> <th> Score </th> </tr>';
							for (var i=0; i<11; i++){
								user_score += '<tr> <th>'+i+'</th> <td>'; 

								if (score[i] == null) { 
									user_score += 'evaluando';
								}else{
									user_score += score[i] +'pts';
								} 

								user_score += '</td> </tr>';
							}
					user_score += '	</tbody></table></div>';

			mob_globalscore(user_score);

		} else if (data.code == 400) {
			mob_alert("danger", "Alert!", data.msg);
			mob_globalscore('unable to load, try again');
			document.getElementById("mob_loading").hidden = true;
		}
		
	} else if (this.readyState == 4 && this.status != 200 && this.status != 0) {
		return 0;
	}	
	}; 
	
	var obj = {
	'username': mob_user_data.username,
	'url': mob_user_data.link
	};

	xhttp.open("POST", api_url+"/api/userscore", true);
	xhttp.setRequestHeader("Content-Type", "application/json"); // identifico que se enviará un json.
	xhttp.timeout = 15000;	
	xhttp.ontimeout = function () { console.log("Timed out"); }

	xhttp.send(JSON.stringify(obj)); //envio el json convertido en un string. 

}

function mob_globalscore (user_score) {
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
		var data = JSON.parse(this.responseText);
		if(data.code == 200) {
			var score = data.data;	
			var global_score = '<div id="global-score" class="col-12 Popup-content tab-pane fade " align="center"> '
							+ '<table class="table table-responsive table-sm table-striped table-bordered " style="display: inline-table;" > '
							+'	<tbody> '
							+'      <tr>  <th> Gran</th> <th> User </th> <th> Score </th> </tr>'

							for (var i=0; i<11; i++){
								global_score += '<tr> <th>'+i+'</th> <td>'+score[i].username+'</td> <td>';

								if (score[i].score == null) { 
									global_score += 'evaluando';
								}else{
									global_score += score[i].score +'pts';
								} 

								global_score += '</td> </tr>';
							}

				global_score += '</tbody> </table> </div>';

			var html = ' <ul class="row nav nav-tabs Infopane "> '
				          + '<li class="nav-item col-6 " >'
				          + '<a class="nav-link active" data-toggle="tab" href="#user-score"><i class="fa  fa-user fa-1x " aria-hidden="true"></i></a> '
				          + '</li> '
				          + '<li class="nav-item col-6 " > '
				          + '<a class="nav-link" data-toggle="tab" href="#global-score"><i class="fa fa-globe fa-1x " aria-hidden="true"></i></a> '
				          + '</li> '
				          + '</ul>'
				          + '<div class="row tab-content">'
				          + user_score
				          + global_score
				          + '</div>';

			document.getElementById("score-data-MoB").innerHTML = html;
			mob_score_ajax = true;
			document.getElementById("mob_loading").hidden = true;

		} else if (data.code == 400) {
			mob_alert("danger", "Alert!", data.msg);
			document.getElementById("mob_loading").hidden = true;
		}
	} else if (this.readyState == 4 && this.status != 200 && this.status != 0) {
			return 0;
	}	
	}; 

	var obj = {
	'url': mob_user_data.link
	};

	xhttp.open("POST", api_url+"/api/globalscore", true);
	xhttp.setRequestHeader("Content-Type", "application/json"); // identifico que se enviará un json.
	xhttp.timeout = 15000;	
	xhttp.ontimeout = function () { console.log("Timed out"); }

	xhttp.send(JSON.stringify(obj)); //envio el json convertido en un string. 
}

document.getElementById("startB").onclick = function () { 
	// loads the manual segmentation tool.
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendMessage(tab.id, {type: "segment"});
	});
};

document.getElementById("score-tab-MoB").onclick = function () {
	// Loads the top 10 scores and the user's score and global score
	if (mob_session && !mob_score_ajax) {
	      // Loading
  		document.getElementById("mob_loading").hidden = false; 
  		mob_userscore();
	}
};

document.getElementById('sign_btn').onclick = function (e) {
	// Send register Form
	e.preventDefault();
	if (mob_form_validate("mob_signup")) {

	      var xhttp = new XMLHttpRequest();

	      xhttp.open("POST", api_url+"/api/users", true);

	      xhttp.onreadystatechange = function() {

	        if (this.readyState == 4 && this.status == 200) {
	        	var data = JSON.parse(this.responseText);
	        	if (data.code == 200) {
					mob_cookie("alert_success",{'type': 'success', 'title':'Success!', 'msg': data.msg});
				} else if (data.code == 400) {
					mob_cookie("alert_danger",{'type': 'danger', 'title':'Oh, oh!', 'msg': data.msg});
				}
				window.location.href = 'index.html';
	        } else if (this.readyState == 4 && this.status != 200) {
	        	mob_cookie("alert_danger",{'type': 'danger', 'title':'Danger!', 'msg': 'There\'s have been an error, please try again.'});
	       		window.location.href = 'index.html';
	        }	
	      }; 

	      var obj = {
	        'email': document.getElementById('user_email2').value,
	        'username': document.getElementById('user_username2').value,
	        'password': document.getElementById('user_pass2').value
	      };
      
	      xhttp.setRequestHeader("Content-Type", "application/json"); // identifico que se enviará un json.
 		  xhttp.timeout = 15000;	
	      xhttp.ontimeout = function () { console.log("Timed out"); }
	      
	      xhttp.send(JSON.stringify(obj)); //envio el json convertido en un string. 

	      // Loading
	      document.getElementById("mob_loading").hidden = false; 

	} else {
		mob_alert("danger", "Alert!", "You have an error in the form");
	} 
};

document.getElementById('save_btn').onclick = function (e) {
	// save the user data
	e.preventDefault();
	if (mob_form_validate("mob_userinfo")) {

	      var xhttp = new XMLHttpRequest();

	      xhttp.open("PUT", api_url+"/api/users", true);

	      xhttp.onreadystatechange = function() {

	        if (this.readyState == 4 && this.status == 200) {
	        	var data = JSON.parse(this.responseText);
	        	if (data.code == 200) {
	        		if(data.reactivate == 1){
	        			mob_cookie("alert_success",{'type': 'success', 'title':'Success!', 'msg': data.msg});
	        			chrome.cookies.remove({url:api_url, name: "user_session" });
	        		} else if (data.reactivate == 0) {
	        			mob_cookie("alert_success",{'type': 'success', 'title':'Success!', 'msg': data.msg});
	        			mob_cookie("user_session",{'username': data.username, 'email': data.email , 'name': data.name, 'lastname': data.lastname});
	        		}
					
				} else if (data.code == 400) {
					mob_cookie("alert_danger",{'type': 'danger', 'title':'Oh, oh!', 'msg': data.msg});
				}
				window.location.href = 'index.html';
	        } else if (this.readyState == 4 && this.status != 200) {
	        	mob_cookie("alert_danger",{'type': 'danger', 'title':'Danger!', 'msg': 'There\'s have been an error, please try again.'});
	       		window.location.href = 'index.html';
	        }	

	      }; 
      		
	      var obj = {
	        'email': document.getElementById('data_mail').value,
	        'username': document.getElementById('data_username').value,
	        'name': document.getElementById('data_name').value,
	        'lastname': document.getElementById('data_lastname').value,
	        'new_pass': document.getElementById('data_newpass').value
	      };

	      xhttp.setRequestHeader("Content-Type", "application/json"); // identifico que se enviará un json.
 		  xhttp.timeout = 15000;	
	      xhttp.ontimeout = function () { alert("Timed out"); }
	      
	      
	      xhttp.send(JSON.stringify(obj)); //envio el json convertido en un string. 

	      // Loading
	      document.getElementById("mob_loading").hidden = false; 

	} else {
		mob_alert("danger", "Alert!", "You have an error in the form");
	} 
};

document.getElementById('login_btn').onclick = function (e) {
	// log in service handler
	e.preventDefault();
	if (mob_form_validate("mob_login")) {

	      var xhttp = new XMLHttpRequest();

	      xhttp.onreadystatechange = function() {
	        if (this.readyState == 4 && this.status == 200) {
	        	var data = JSON.parse(this.responseText);
	        	if(data.code == 200) {
					mob_cookie("alert_success",{'type': 'success', 'title':'Success!', 'msg': data.msg});
					mob_cookie("user_session",{'username': data.username, 'email': data.email , 'name': data.name, 'lastname': data.lastname});
				} else if (data.code == 400) {
					mob_cookie("alert_danger",{'type': 'danger', 'title':'Oh, oh!', 'msg': data.msg});
				}
				window.location.href = 'index.html';
	        } else if (this.readyState == 4 && this.status != 200 && this.status != 0) {
	       		mob_cookie("alert_danger",{'type': 'danger', 'title':'Danger!', 'msg': 'There\'s have been an error, please try again.'});
	        	window.location.href = 'index.html';
	        }	
	      }; 

	      var obj = {
	        'username': document.getElementById('user_username').value,
	        'password': document.getElementById('user_pass').value
	      };

	      xhttp.open("POST", api_url+"/api/login", true);
	      xhttp.setRequestHeader("Content-Type", "application/json"); // identifico que se enviará un json.
 		  xhttp.timeout = 15000;	
	      xhttp.ontimeout = function () { console.log("Timed out"); }
	      
	      xhttp.send(JSON.stringify(obj)); //envio el json convertido en un string. 

	      // Loading
	      document.getElementById("mob_loading").hidden = false; 
	} else {
		mob_alert("danger", "Alert!", "You have an error in the form");
	} 
};

document.getElementById('logout_btn').onclick = function () {
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
    	var data = JSON.parse(this.responseText);
    	if(data.code == 200) {
			mob_cookie("alert_success",{'type': 'success', 'title':'Success!', 'msg': data.msg});
			chrome.cookies.remove({url:api_url, name: 'user_session'});
			window.location.href = 'index.html';
		} else if (data.code == 400) {
			mob_cookie("alert_danger",{'type': 'danger', 'title':'Oh, oh!', 'msg': data.msg});
			window.location.href = 'index.html';
		}
		window.location.href = 'index.html';
    } else if (this.readyState == 4 && this.status != 200 && this.status != 0) {
   		mob_cookie("alert_danger",{'type': 'danger', 'title':'Danger!', 'msg': 'There\'s have been an error, please try again.'})
    	window.location.href = 'index.html';
    }	
  };

  xhttp.open("GET", api_url+"/api/logout", true);
	  xhttp.timeout = 15000;	
  xhttp.ontimeout = function () { console.log("Timed out"); }
  
  xhttp.send(); 

  // Loading
  document.getElementById("mob_loading").hidden = false; 
}

document.getElementById('recover_btn').onclick = function (e) {
	// log in service handler
	e.preventDefault();
	if (mob_form_validate("mob_recover")) {

	      var xhttp = new XMLHttpRequest();

	      xhttp.onreadystatechange = function() {
	        if (this.readyState == 4 && this.status == 200) {
	        	var data = JSON.parse(this.responseText);
	        	if(data.code == 200) {
					mob_cookie("alert_success",{'type': 'success', 'title':'Success!', 'msg': data.msg});
					document.getElementById("home_recover").hidden = true;
					document.getElementById("home_login").hidden = false;
					document.getElementById("mob_ls_btn").hidden = false;
				} else if (data.code == 400) {
					mob_cookie("alert_danger",{'type': 'danger', 'title':'Oh, oh!', 'msg': data.msg});
				}
				window.location.href = 'index.html';
	        } else if (this.readyState == 4 && this.status != 200 && this.status != 0) {
	       		mob_cookie("alert_danger",{'type': 'danger', 'title':'Danger!', 'msg': 'There\'s have been an error, please try again.'});
	        	window.location.href = 'index.html';
	        }	
	      }; 

	      var obj = {
	        'email': document.getElementById('recover_email').value
	      };

	      xhttp.open("POST", api_url+"/api/recover", true);
	      xhttp.setRequestHeader("Content-Type", "application/json"); // identifico que se enviará un json.
 		  xhttp.timeout = 15000;	
	      xhttp.ontimeout = function () { console.log("Timed out"); }
	      
	      xhttp.send(JSON.stringify(obj)); //envio el json convertido en un string. 

	      // Loading
	      document.getElementById("mob_loading").hidden = false; 
	} else {
		mob_alert("danger", "Alert!", "You have an error in the form");
	} 
};

///////////////////////  	BUTTOMS CONTROL //////////////////////////////////

document.getElementById("home_signup_link").onclick = function (e) { 
	e.preventDefault();
	document.getElementById("home_signup_link").classList.add("active");
	document.getElementById("home_login_link").classList.remove("active")
	document.getElementById("home_login").hidden = true;
	document.getElementById("home_signup").hidden = false;
};

document.getElementById("home_login_link").onclick = function (e) { 
	e.preventDefault();
	document.getElementById("home_login_link").classList.add("active");
	document.getElementById("home_signup_link").classList.remove("active")
	document.getElementById("home_signup").hidden = true;
	document.getElementById("home_login").hidden = false;
};

document.getElementById("forgot_btn").onclick = function (e) { 
	e.preventDefault();
	document.getElementById("home_signup").hidden = true;
	document.getElementById("home_login").hidden = true;
	document.getElementById("mob_ls_btn").hidden = true;
	document.getElementById("home_recover").hidden = false;
};

document.getElementById("user_edit_btn").onclick = function (e) { 
	e.preventDefault();
	document.getElementById("home_home").hidden = true;
	document.getElementById("home_user_edit").hidden = false;
};

document.getElementById("back_btn").onclick = function (e) { 
	// backing from "recover pass" to "log in"
	e.preventDefault();
	document.getElementById("home_recover").hidden = true;
	document.getElementById("home_login").hidden = false;
	document.getElementById("mob_ls_btn").hidden = false;
};

document.getElementById("back_btn2").onclick = function (e) { 
	// backing from "user edit" to " home"
	e.preventDefault();
	document.getElementById("home_user_edit").hidden = true;
	document.getElementById("home_home").hidden = false;
};

document.getElementById("leng_esp").onclick = function () {
	chrome.cookies.set({ url: api_url, name: 'mob_leng', value: 'es' });
	mob_changeleng("es");
};

document.getElementById("leng_eng").onclick = function () {
	chrome.cookies.set({ url: api_url, name: 'mob_leng', value: 'en' });
	mob_changeleng("en");
};

document.getElementById("leng_fran").onclick = function () {
	chrome.cookies.set({ url: api_url, name: 'mob_leng', value: 'fr' });
	mob_changeleng("fr");
};

// AVOID THE ANNOYING ENTER KEY

function stopRKey(evt) { 
  var evt = (evt) ? evt : ((event) ? event : null);  
  if (evt.keyCode == 13) {
  	return false;
  } 
} 

document.onkeypress = stopRKey; 



};

