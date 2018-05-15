// ------------------------------------------------------------------
// Chrome Extension developed by Jean Garcia (2017)
// Based on a working project from Andrés Sanoja & Stéphane Gançarski (2014) 

// GLOBAL VARIABLES ------------------------------------------------

var MobActived = false;
var mob_win_width = 1024; // window width
var mob_win_height = 700; // window height
var MobAction = {"active":false, "name": "none", "merge":false, "color":""}; // controls the actual action
var MobBlockId = 0; // block counter
var MobBlock = []; // list of blocks [id,area,left,top,width,height,c_gran,c_tag,c_inter]
var MobAlert = []; // alerts [type,text,code]
var MobStatus = {'granu': 5,'amtotal':null ,'amtotalmm':null,'res':0, 'blockslack': 500 }; // granularity status
var MobGran = [{'l':41,'h':99999}, {'l':37,'h':40}, {'l':32,'h':36}, {'l':28,'h':31}, {'l':23,'h':27}, {'l':19,'h':22}, {'l':14,'h':18}, {'l':9,'h':13}, {'l':4,'h':8}, {'l':2, 'h':3}, {'l':1, 'h':1},]; // Granularity limits 
var MobGranSlack = 0.50; // The page has a slack of 10%. (the blocks needs to cover 90% of the page)
var MobRes = {'dpi': 96, 'dpcm': 96 / 2.54}; 
var api_url = 'https://mob.ciens.ucv.ve';
var MobPageCapture; // Data of the capture of the web page.
var MobTags = []; // list of the HTML5 tags (name)
var MobCollections = []; // list of Collections (name, categories)
var data_leng;

// ------------------------ FUNCTIONS -------------------------------
// ------------------------------------------------------------------
// ------------------------------------------------------------------


// ------------------------ PRINCIPAL FUNCTIONS ---------------------
chrome.extension.onMessage.addListener(function (request) {
	// lisents for a message to start the segmentation process
	
	switch(request.type) {
		case "segment":  // send msg to load all the segmentation libs and gets the screenshot url
			
			chrome.runtime.sendMessage({msg: "loadlib"}, function(response){
				MobPageCapture = response.url;
			}); 
			window.addEventListener("resize", function(){
				window.resizeTo(mob_win_width, mob_win_height);
			});
			StartMenu(); 
			// lenguage
			leng = mob_readCookie('mob_leng');

			if(leng) {
				data_leng = mob_leng_s[leng];
			}else {
				data_leng = mob_leng_s['en'];
			}
		break;
	}
	return true;
});

var StartMenu = function() {
	// creation of the MoB menu and injection to the HTML.

	if (!MobActived) {
		importfa(); // import fa
		MobLoadScreen(true);
		// MobSaveOriginal();
		// filling the tags

		MobGet('/api/gettags',
			function (data){
				MobTags = data.data;
				// filling the collections and categories.
				MobGet('/api/getcollections',
					function (data){
						MobCollections = data.data;
						// Creating the menu 
						var menu = '<div id="MoB-Menu" class="MoB-tool MoB-span"><ul class="MoB-tool MoB-span" > \
							<li class="start-MoB-item MoB-tool MoB-span" title="'+data_leng['a_info']+'" id="infobutton"><i class="fa fa-info fa-2x MoB-tool MoB-span" aria-hidden="true"></i></li> \
							<li class="MoB-item MoB-tool MoB-span" title="'+data_leng['a_insert']+'" id="insertbutton"><i class="fa fa-plus fa-2x MoB-tool MoB-span" aria-hidden="true"></i></li> \
							<li class="MoB-item MoB-tool MoB-span" title="'+data_leng['a_delete']+'" id="deletebutton"><i class="fa fa-eraser fa-2x MoB-tool MoB-span" aria-hidden="true"></i></li> \
							<li class="MoB-item MoB-tool MoB-span" title="'+data_leng['a_merge']+'" id="mergebutton"><i class="fa fa-clone fa-2x MoB-tool MoB-span" aria-hidden="true"></i></li> \
							<li class="MoB-item MoB-tool MoB-span" title="'+data_leng['a_cut']+'" id="cutbutton"><i class="fa fa-scissors fa-2x MoB-tool MoB-span" aria-hidden="true"></i></li> \
							<li class="MoB-item MoB-tool MoB-span" title="'+data_leng['a_tag']+'" id="editbutton"><i class="fa fa-tag fa-2x MoB-tool MoB-span" aria-hidden="true"></i></li> \
							<li class="MoB-item MoB-tool MoB-span" title="'+data_leng['a_select']+'" id="selectbutton"><i class="fa fa-hand-pointer-o fa-2x MoB-tool MoB-span" aria-hidden="true"></i></li> \
							<li class="end-MoB-item MoB-tool" title="'+data_leng['a_submit']+'" id="submitbutton"><i class="fa fa-upload fa-2x MoB-tool MoB-span" aria-hidden="true"></i></li> \
							</ul></div> \
							<div id="Mob-infopanel" class="MoB-span MoB-scroll" hidden> </div> <div id="MoB-blockinfo" class="MoB-span" hidden> </div>';
						document.body.insertAdjacentHTML("beforeend",menu);

						calculategran();
						createbuttonlisteners();

						MobActived = true;
						MoBremovelinks();
						lisentmeMob();  // listeners
						MobLoadScreen(false);
					});

			});

	} else {
		mob_modal(data_leng['m_error1'],3);
	}
};

var mouseon = function (e) {
	// the mouse is over the web page, it needs to light up the sections accordinly.

	switch (MobAction.name) {

		case "insertbutton": // it lights the DOM elements to insert a new block
			var aux1 = e.target.tagName;
			var aux2 = e.target.className;
			var aux3 = e.target.id;
			if( aux1 != "HTML" && aux1 != "BODY" && aux1 != "SCRIPT" && aux1 != "SPAN" && aux1 != "SVG" && !(/MoB-/.test(aux2)) && !(/MobBlockId/.test(aux3)) ) {
				MobAction.color = e.target.style.backgroundColor;
				e.target.style.backgroundColor = "rgba(52, 105, 226, 0.4)";
			}
		break;

		case "deletebutton": // it lights only the blocks so the user can delete them.
			lightblocks(e);
		break;

		case "mergebutton": // it lights only the blocks so the user can merge them.
			lightblocks(e);
		break;

		case "cutbutton": // it lights only the blocks so the user can cut them.
			lightblocks(e);
		break;

		case "editbutton": // it lights only the blocks so the user can edit it's tags.
			lightblocks(e);
		break;

		case "selectbutton": // it lights only the blocks so the user can edit it's tags.
			lightblocks(e);
		break;

	}
};

var mousedown = function (e) {
	// there is a click on the document, needs to apply the actions it needs.

	// if(e.target.className == "MoB-close") {
	// 	document.getElementById("MoB-blockinfo").hidden = true;
	// }

	switch (MobAction.name) {

		case "insertbutton": // inserts a new block
			var aux1 = e.target.tagName;
			var aux2 = e.target.className;
			var aux3 = e.target.id;

			if( aux1 != "HTML" && aux1 != "BODY" && aux1 != "SCRIPT" && aux1 != "SPAN" && aux1 != "SVG" && !(/MoB-/.test(aux2)) && !(/MobBlockId/.test(aux3)) ) {
				
				var box = e.target.getBoundingClientRect(); 
				var coords = getCoords(box);

				var flag = testmobautomerge(coords.left,coords.top,Math.round(box.width),Math.round(box.height));

				if ( flag == 1 || flag == 3 ) {// there's tiny blocks
					mob_modal(data_leng['m_msgtinyb'],0,
						function(val) {
							// it automerges all the tiny blocks and handles intersections
							Mobautomerge(coords.left,coords.top,Math.round(box.width),Math.round(box.height));
							// creating the new block
							var newblocks = [];
							newblocks.push({'x': coords.left, 'y': coords.top, 'width': Math.round(box.width) , 'height': Math.round(box.height)});
							createblock (newblocks);
							var auxcont = MobBlockId - 1;
							if(flag == 3){
								document.getElementById("MobBlockId"+auxcont).classList.add("mob-error"); 
							}
							orderblocks();
							fixindex();
						});
				} else if (flag == 2) {
					// it handles the intersections.
					Mobautomerge(coords.left,coords.top,Math.round(box.width),Math.round(box.height));
					// creating the new block
					var newblocks = [];
					newblocks.push({'x': coords.left, 'y': coords.top, 'width': Math.round(box.width) , 'height': Math.round(box.height)});
					createblock (newblocks);
					var auxcont = MobBlockId - 1;
					document.getElementById("MobBlockId"+auxcont).classList.add("mob-error"); 
					orderblocks();
					fixindex();
				} else if (flag == 0) {
					// creating the new block
					var newblocks = [];
					newblocks.push({'x': coords.left, 'y': coords.top, 'width': Math.round(box.width) , 'height': Math.round(box.height)});
					createblock (newblocks);
					orderblocks();
					fixindex();
				}
			}
		break;

		case "deletebutton": // deletes an existing block 
			var aux = e.target.id;
			if( /MobBlockId/.test(aux) ) {
				// e.target.parentNode.removeChild(e.target);
				removeblock(e.target.id);
			}
		break;

		case "mergebutton": // merges two blocks
			var aux = e.target.id;
			if(/MobBlockId/.test(aux)) { 
				if(!MobAction.merge){ // selecting the first block

					MobAction.merge = true;
					e.target.dataset.mobmerge = true;

				} else { // selecting the second block
					
					if(e.target.dataset.mobmerge){ // the user is trying to merge with the same block, that's not nice.
						
						e.target.removeAttribute("data-mobmerge");
						e.target.style.backgroundColor = "";
						MobAction.merge = false;

					} else {
						// getting the blocks's info
						var bid = document.querySelector("div[data-mobmerge]");
						var block1 = document.getElementById(bid.id);
						var block1box = block1.getBoundingClientRect();
						var block2box = e.target.getBoundingClientRect();
						var block1coords = getCoords(block1box);
						var block2coords = getCoords(block2box);

						// calculating the limits and the size of the new block
						if(block1coords.left > block2coords.left) {
							var x1 = block2coords.left;
							var x2 = Math.round(block1box.width) + (block1coords.left - block2coords.left); // total width 
							if (x2 < block2box.width) x2 = block2box.width;

							if(block1coords.top > block2coords.top){ 
								var y1 = block2coords.top; 
								var y2 = Math.round(block1box.height) + (block1coords.top - block2coords.top);  // total height
								if (y2 < block2box.height) y2 = block2box.height;
							} else { 
								var y1 = block1coords.top;
								var y2 = Math.round(block2box.height) + (block2coords.top - block1coords.top);  // total height
								if (y2 < block1box.height) y2 = block1box.height;
							}

						} else {
							var x1 = block1coords.left; 
							var x2 = Math.round(block2box.width) + (block2coords.left - block1coords.left);   // total width 
							if (x2 < block1box.width) x2 = block1box.width;

							if(block1coords.top > block2coords.top){
								var y1 = block2coords.top;
								var y2 = Math.round(block1box.height) + (block1coords.top - block2coords.top);  // total height
								if (y2 < block2box.height) y2 = block2box.height;
							} else { 
								var y1 = block1coords.top;
								var y2 = Math.round(block2box.height) + (block2coords.top - block1coords.top);  // total height
								if (y2 < block1box.height) y2 = block1box.height;
							}
						}


						// automerging any inside blocks
						MobAction.merge = false;
						var flag = testmobautomerge(x1,y1,x2,y2);

						if ( flag == 1 || flag == 3 ) {// there's tiny blocks
							mob_modal(data_leng['m_msgtinyb'],0,
								function(val) {
									// it automerges all the tiny blocks and handles intersections
									Mobautomerge(x1,y1,x2,y2);
									// creating the new block
									var newblocks = [];
									newblocks.push({'x': x1 , 'y': y1, 'width': x2 , 'height': y2});
									createblock (newblocks);
									var auxcont = MobBlockId - 1;
									if(flag == 3){
										document.getElementById("MobBlockId"+auxcont).classList.add("mob-error"); 
									}
									orderblocks();
									fixindex();
								});
						} else if (flag == 2) {
							// it handles the intersections.
							Mobautomerge(x1,y1,x2,y2);
							// creating the new block
							var newblocks = [];
							newblocks.push({'x': x1 , 'y': y1, 'width': x2 , 'height': y2});
							createblock (newblocks);
							var auxcont = MobBlockId - 1;
							document.getElementById("MobBlockId"+auxcont).classList.add("mob-error"); 
							orderblocks();
							fixindex();
						} else if (flag == 0) {
							// creating the new block
							var newblocks = [];
							newblocks.push({'x': x1 , 'y': y1, 'width': x2 , 'height': y2});
							createblock (newblocks);
							orderblocks();
							fixindex();
						}
					}
				}
			}
		break;

		case "cutbutton": // cut two blocks apart.
			var aux = e.target.id;
			if(/MobBlockId/.test(aux)) { 
				if(!MobAction.merge){ // selecting the first block, it reuses the merge flag.

					MobAction.merge = true;
					e.target.dataset.mobmerge = true;

				} else { // selecting the second block
					
					if(e.target.dataset.mobmerge){ // the user is trying to cut with the same block, that's not nice.
						
						e.target.removeAttribute("data-mobmerge");
						e.target.style.backgroundColor = "";
						MobAction.merge = false;

					}else {
						// getting the blocks's info

						var bid = document.querySelector("div[data-mobmerge]");
						var block1 = document.getElementById(bid.id);
						var block1box = block1.getBoundingClientRect(); // for the width and height
						var block2box = e.target.getBoundingClientRect(); 
						var block1coords = getCoords(block1box); // for the top and left
						var block2coords = getCoords(block2box);

						var BlockA = {};
						BlockA.id = bid.id;
						BlockA.width = Math.round(block1box.width);
						BlockA.height = Math.round(block1box.height);
						BlockA.top = block1coords.top;
						BlockA.left = block1coords.left;

						var BlockB = {};
						BlockB.id = e.target.id;
						BlockB.width = Math.round(block2box.width);
						BlockB.height = Math.round(block2box.height);
						BlockB.top = block2coords.top;
						BlockB.left = block2coords.left;

						// check where's the intersection. -------------
						// Creating the control points

						BlockA.x1 = BlockA.left;
						BlockA.y1 = BlockA.top;
						BlockA.x2 = BlockA.x1 + BlockA.width;
						BlockA.y2 = BlockA.y1;
						BlockA.x3 = BlockA.x2;
						BlockA.y3 = BlockA.y1 + BlockA.height;
						BlockA.x4 = BlockA.x1;
						BlockA.y4 = BlockA.y3;

						BlockB.x1 = BlockB.left;
						BlockB.y1 = BlockB.top;
						BlockB.x2 = BlockB.x1 + BlockB.width;
						BlockB.y2 = BlockB.y1;
						BlockB.x3 = BlockB.x2;
						BlockB.y3 = BlockB.y1 + BlockB.height;
						BlockB.x4 = BlockB.x1;
						BlockB.y4 = BlockB.y3;
						

						// checking BlockA's control points over BlockB's and viceversa, adding a counter of how many points are inside the block.
						pointonblock(BlockA, BlockB);
						pointonblock(BlockB, BlockA);

						// Identify the case
						var mobcase;

						if( BlockA.cont > 0 || BlockB.cont > 0 ) {
							// it could be case 1,2, 4 or 5
							if(BlockA.cont == 1 && BlockB.cont == 1) { // case 1
								mobcase = 1;
							} else if (BlockA.cont == 2 && BlockB.cont == 2) { // case 2
								mobcase = 2;
							} else if ((BlockA.cont == 2 && BlockB.cont == 1) || (BlockA.cont == 1 && BlockB.cont == 2))  { // case 4
								mobcase = 4;
							} else if ((BlockA.cont == 2 && BlockB.cont == 0) || (BlockA.cont == 0 && BlockB.cont == 2)) { // case 5
								mobcase = 5;
							}

						} else {
							// It could be Case 3 or there's just no intersection.
							if ( ( BlockB.y1 < BlockA.y1 && BlockA.y1 < BlockB.y3) || ( BlockA.y1 < BlockB.y1 && BlockB.y1 < BlockA.y3) ) {
								mobcase = 3;
							} else {
								mobcase = 0;
							}
						}

						MobAction.merge = false;
						document.getElementById(BlockA.id).removeAttribute("data-mobmerge");
						document.getElementById(BlockA.id).style.backgroundColor = "";
						// Cuts the intersection and deals with the BlockB depending of the case.

						if(mobcase == 1){
							MobCase1(BlockA, BlockB);
						} else if (mobcase == 2){
							MobCase2(BlockA, BlockB);
						} else if (mobcase == 3) {
							MobCase3(BlockA, BlockB);
						} else if (mobcase == 4) {
							MobCase4(BlockA, BlockB);
						} else if (mobcase == 5) {
							MobCase5(BlockA, BlockB);
						} else if (mobcase == 0) {
							return 0;
						}

						var auxalert = false;
						var auxpatt = new RegExp(BlockA.id);
						var auxcode;
						if (mobcase != 0){
							for (var i=0; i < MobAlert.length; i++) {
								auxcode = MobAlert[i].code;
								if(/EI_/.test(auxcode) && auxpatt.test(auxcode)) { 
									auxalert = true;
									break;
								} 
							}
							if (!auxalert) document.getElementById(BlockA.id).classList.remove("mob-error"); 
						}

						orderblocks();
						fixindex();
					}
				}
			}
		break;

		case "editbutton": // edits a blocks's tag
			var aux = e.target.id;
			if(/MobBlockId/.test(aux)) { 
				var tag = e.target.dataset.mobtag;
				mob_modal(data_leng['m_seltag'],1,
					function(val) { 
						e.target.dataset.mobtag = val;
						removealert(aux,1);
						errororwarning();
					});
			}
		break;

		case "infobutton": // above the information panel
			var aux = e.target.className;
			if(/mobalert/.test(aux)) { 
				var auxstr = e.target.id;
				for(var i=0; i < MobBlock.length ; i++) {
					var auxpatt = new RegExp(MobBlock[i].id);
					if(auxpatt.test(auxstr)){
						createblockinfo(i);
						break;
					}
				}
			}
		break;

		case "selectbutton": // selects a block to read its information
			var aux = e.target.id;
			if(/MobBlockId/.test(aux)) { 
				for (var i=0; i < MobBlock.length; i++) {
					if(aux == MobBlock[i].id){
						createblockinfo(i);
						break;
					}
				}
			}
		break;
	}
};

var mouseout = function (e) {
	if(MobAction.active && MobAction.name == "insertbutton" && e.target.dataset.mobmerge == undefined) {
			e.target.style.backgroundColor = MobAction.color;
			MobAction.color ="";
	} else if ( MobAction.active && (MobAction.name == "deletebutton" || MobAction.name == "mergebutton" || MobAction.name == "editbutton" || MobAction.name == "cutbutton" || MobAction.name == "selectbutton") ){
		
		if(/MobBlockId/.test(e.target.id) && e.target.dataset.mobmerge == undefined) { 
			e.target.style.backgroundColor = "";
			e.target.innerHTML = "";
		}

	}
};

var lisentmeMob = function () {
	// applies the listeners to hear the actions of the user's mouse
	window.onmouseover = function (e) { mouseon (e); }; 
	window.onmouseout = function (e) { mouseout (e); }; 
	window.onmousedown = function (e) { mousedown (e); };
};

// ------------- MENU FUNCTIONS --------------------

var createbuttonlisteners = function () {
	// It creates listeners for all the buttons in the menu.

	document.getElementById("infobutton").onclick = function () { infoaction(); };
	document.getElementById("insertbutton").onclick = function () { mob_toggle ("insertbutton"); };
	document.getElementById("deletebutton").onclick = function () { mob_toggle ("deletebutton"); };
	document.getElementById("mergebutton").onclick = function () { mob_toggle ("mergebutton"); };
	document.getElementById("cutbutton").onclick = function () { mob_toggle ("cutbutton"); };
	document.getElementById("editbutton").onclick = function () { mob_toggle ("editbutton"); };
	document.getElementById("selectbutton").onclick = function () { mob_toggle ("selectbutton"); };
	document.getElementById("submitbutton").onclick = function () { submitaction(); };
};

var mob_toggle = function (button) {
	// function to toggle the state of the mob menu and actions.

	if(MobAction.active) { // there's a button already actived. 
		var x = document.getElementById(MobAction.name);
		x.classList.toggle("item-MoB-active");
	}

	if(MobAction.name == button) { // the button clicked is the same as before.
		MobAction.active = false;
		MobAction.name = "none";
		document.getElementById("Mob-infopanel").hidden = true;
	} else { // another button is clicked.
		MobAction.active = true;
		MobAction.name = button;
		var x = document.getElementById(button);
		x.classList.toggle("item-MoB-active");
		if (button=="infobutton") {
			document.getElementById("Mob-infopanel").hidden = false;
		}else{
			document.getElementById("Mob-infopanel").hidden = true;
		}
	}

	MobAction.merge = false;
	var bid = document.querySelector("div[data-mobmerge]");
	if (bid != null) { 
		var z = document.getElementById(bid.id);
		z.removeAttribute("data-mobmerge");
		z.style.backgroundColor = MobAction.color;
	}
};

var infoaction = function () {
	// it will show the info window.

	mob_toggle ("infobutton");
	// area in px2
	var actualareapx = MobBlock.reduce(function (sum, block) {
					    return sum + (block.height * block.width);
					}, 0);
	// area in mm2
	var actualareamm = MobBlock.reduce(function (sum, block) {
					    return sum + (pxtomm (block.height) * pxtomm (block.height));
					}, 0);

	var areacolor; 
	if ( actualareapx >= MobStatus.amtotal) {
		areacolor = "green";
	} else {
		areacolor = "red";
	}

	var info = 	'<div align="center" style="font-size: 0.8em;" class="MoB-span"> ' + data_leng['i_legend']
				+'</div><hr> <table id="Mob-detailinfo" class="table table-responsive table-sm MoB-span">' 
				+'<tbody MoB-span>'
				+'<tr class="MoB-span"><th class="MoB-span">'+data_leng['i_nblock']+'</th> <td class="MoB-span">'+ MobBlock.length  + '</td></tr>'
				+'<tr class="MoB-span"><th class="MoB-span">'+data_leng['i_blockta']+'</th> <td class="MoB-span"><span class="MoB-span" style="color:'+ areacolor +'" title="'+actualareamm+'mm&sup2;">'+ Math.round(actualareapx*100/(document.body.clientWidth * document.body.clientHeight))  + '%</span></td></tr>'
				+'<tr class="MoB-span"><th class="MoB-span">'+data_leng['i_gran']+'</th><td class="MoB-span">'+ MobStatus.granu + '<button  class="MoB-span" id="granedit" >'+data_leng['i_editg']+'</button> </td></tr>'
				+'<tr class="MoB-span"><th class="MoB-span">'+data_leng['i_div']+'</th> <td class="MoB-span">'+ MobGran[MobStatus.granu].h +data_leng['i_div2'] +'</td></tr>'
				+'<tr class="MoB-span"><th class="MoB-span">'+data_leng['i_blockma']+'</th><td class="MoB-span">' + MobGran[MobStatus.granu].amblockmm +'mm&sup2; </td></tr>'
				+'<tr class="MoB-span"><th class="MoB-span">'+data_leng['i_totalma']+'</th><td class="MoB-span">' + MobStatus.amtotalmm +'mm&sup2; </td></tr>'
				+'</tbody> </table> '
				+'<hr> <div id="Mob-alerinfo" class="MoB-span" align="center">'+ genalerts() +' </div>';
	
	document.getElementById("Mob-infopanel").innerHTML = info;

	document.getElementById("granedit").onclick = function () { graneditaction(); };
};

var submitaction = function () {
	// checking for errors, collecting data, sending the data.

	// --- CHEKING ERRORS
	if(MobAction.active)
		mob_toggle(MobAction.name);

	var gran_aux = checkgranularity ("final");

	if (gran_aux == 1) { 
		mob_modal(data_leng['m_error2'],3);
		return 0;
	}
	var aux = checkalerts();

	if (aux == 0) { 
		mob_modal(data_leng['m_error3'],3);
		return 0;
	} else if (aux == 1) {
		mob_modal(data_leng['m_warn1'],0, function(e) { 

			// --- COLLECTING DATA
			mob_modal (data_leng['m_selcol'], 4, function (col,cat) {
				MobLoadScreen(true); // loading screen
				// --- SENDING DATA
				mobRestore( function() {
					MobCollectData (col,cat, function(data){
					MobPost ('/api/upload',data, MobLoadScreen(false));
						});
					});
			
			});
		});
	} else if (aux == 2){

		mob_modal (data_leng['m_selcol'], 4, function (col,cat) {
			MobLoadScreen(true); // loading screen
			// --- SENDING DATA
				mobRestore( function() {
					MobCollectData (col,cat, function(data){
					MobPost ('/api/upload',data, MobLoadScreen(false));
						});
					});
		});
	}
};

var graneditaction = function () {
	// var the user change the granularity for the segmentation.

	var aux = MobStatus.granu;

	mob_modal(data_leng['m_editgran'],2, 
		function(val) {
			var granu = Math.round(val);
			if (granu > 10 || granu < 0 ) granu = aux;

			MobStatus.granu = granu;
			calculategran();
			infoaction();
			checkgranularity("refresh");
		});
};
// ----------------- AJAX FUNCTIONS ---------------------

var MobPost = function (url,data,call) {

	var xhttp = new XMLHttpRequest();

	xhttp.open("POST", api_url+url, true);

	xhttp.onreadystatechange = function() {

	if (this.readyState == 4 && this.status == 200) {
		var dataR = JSON.parse(this.responseText);
		mob_modal(dataR.msg, 3);
	} else if (this.readyState == 4 && this.status != 200) {
		mob_modal(data_leng['m_error4'], 3);
	}	
	}; 

	xhttp.setRequestHeader("Content-Type", "application/json"); // identifico que se enviará un json.
	xhttp.timeout = 30000;	
	xhttp.ontimeout = function () { console.log("Timed out"); }

	xhttp.send(JSON.stringify(data)); //envio el json convertido en un string. 
};

var MobGet = function (url,call) {

	var xhttp = new XMLHttpRequest();

	xhttp.open("GET", api_url+url, true);

	xhttp.onreadystatechange = function() {

	if (this.readyState == 4 && this.status == 200) {
		var data = JSON.parse(this.responseText);
		call(data)
	} else if (this.readyState == 4 && this.status != 200) {
		return true; // there has been an error.
	}	
	}; 

	xhttp.timeout = 15000;	
	xhttp.ontimeout = function () { 
		console.log("Timed out in: "+ url ); 
		mob_modal(data_leng['m_error5'],3);
	}

	xhttp.send();
};
// ----------------- COLLECT FUNCTIONS ---------------------

var mobRestore = function (call) {
	mobCleanTags(document.body); // cleans previous modifications on the HTML
	call();
}

var MobCollectData = function (col,cat, call) {
	// collects all the data that needs to be sent to the server.

	// Blocks of segmentations
	var MoBStructBlock = {};
	iniMoBStructBlock(MoBStructBlock); // creates the Mob struct block

	// Tags the HTML into Mob segmentation
	MobTagHTML(MoBStructBlock, function() {

		// save the HTML as a string
		MobHTMLtoString (function(MoBHTML){

			//CREATE DATA OBJECT
			// which browser.
			var browser = MobWhichBrowser();

			var data = {
				'collection': col,
				'category':cat,
				'capture': MobPageCapture,
				'title': document.title,
				'url': window.location.href,
				'width': document.body.clientWidth,
				'height': document.body.clientHeight,
				'gran': MobStatus.granu, 
				'blocks': MoBStructBlock,
				'mob_html': MoBHTML,
				'browser': browser,
				'seg_type': 'mob'
			};

			call(data);


		});
	});
};

// ----------------- MOB ALERT FUNCTIONS ---------------------

var genalerts = function () {
	// it adds an alert to the info window. success, warnin, error.

	var alerts = "";
	for (var i=0; i<MobAlert.length; i++) {

		if(MobAlert[i].type == "error") {
			alerts = alerts + '<div class="mobalert-error" id="'+MobAlert[i].code+'" role="alert" > <strong>'+data_leng['al_error']+'</strong>'+ MobAlert[i].text +' </div>';
		} else if (MobAlert[i].type == "warning") {
			alerts = alerts + '<div class="mobalert-warning" id="'+MobAlert[i].code+'" role="alert" > <strong>'+data_leng['al_warning']+'</strong>'+ MobAlert[i].text +' </div>';
		} 
	}
	return alerts;
};

var removealert = function (id, op) { 
	//removes alerts. 0 = all, 1 = tag warning, 2 = intersection error, 3 = granularity error

	if (op == 0) { // removes all alerts (the block is being deleted)

		for (var i=0; i < MobAlert.length ; i++) {
			if(MobAlert[i].code == "WG_"+id){
				MobAlert.splice(i, 1); 
				break;
			}
		}
		for (var i=0; i < MobAlert.length ; i++) {
			if(MobAlert[i].code == "EG_"+id ){
				MobAlert.splice(i, 1); 
				break;
			}
		}
		for (var i=0; i < MobAlert.length ; i++) {
			if(MobAlert[i].code == "ET_"+id){
				MobAlert.splice(i, 1); 
				break;
			}
		}

		var auxpatt = new RegExp(id);
		var auxcode;
		var auxflag = false;

		for (var i=0; i < MobAlert.length ; i++) {	// searches for the first block of the alert
			auxcode = MobAlert[i].code;
			if (/EI_/.test(auxcode) && auxpatt.test(auxcode)) { // found the first block
				 auxcode = MobAlert[i].code;
				 MobAlert.splice(i, 1);
				for (var j=0; j < MobBlock.length ; j++) { // searches for the second block
					auxpatt = new RegExp(MobBlock[j].id);
					if (auxpatt.test(auxcode)){ // found the second block
						for (var k=0; k < MobAlert.length ; k++) {	 // searches if the second block have more errors.
							auxcode = MobAlert[k].code;
							if (/EI_/.test(auxcode) && auxpatt.test(auxcode)) { // found more errors on the second block
								auxflag = true;
							}
						}
						if (!auxflag) document.getElementById(MobBlock[j].id).classList.remove("mob-error"); // since it was the only error, it gets deleted
					}
				}
				break;
			}
		}
			
	} else if ( op == 1) { // removes the tag warning (the block is being edited)

		for (var i=0; i < MobAlert.length; i++) {
			if (MobAlert[i].code == "ET_"+id) {
				MobAlert.splice(i, 1);
				document.getElementById(id).classList.remove("mob-warning");
				break;
			}
		} 

	} else if ( op == 2) { // removes the intersection error (the block is being )

		for (var i=0; i < MobAlert.length; i++) {
			if (MobAlert[i].code == "EI_"+id) {
				MobAlert.splice(i, 1);
				document.getElementById(id).classList.remove("mob-error");
				break;
			}
		}  

	} else if ( op == 3) { // removes the granularity error ( the granularity was changed)


		for (var i=0; i < MobAlert.length; i++) {
			if ( /EG_/.test(MobAlert[i].code)) {
				var aux = MobAlert[i].code.split("_");
				var b_id = aux[1];
				document.getElementById(b_id).classList.remove("mob-error-gran"); 
				MobAlert.splice(i, 1);
				i = 0;
			}
		}

		for (var i=0; i < MobAlert.length; i++) {
			if ( /WG_/.test(MobAlert[i].code)) {
				MobAlert.splice(i, 1);
				i = 0;
			}
		}

	} 
};

var errororwarning = function () {
	// checks if there an error or warning to light the Info button.
	var warning = false;
	document.getElementById('infobutton').classList.remove('mobinfo-error');
	document.getElementById('infobutton').classList.remove('mobinfo-warning');

	for (var i=0; i<MobAlert.length; i++) {

		if(MobAlert[i].type == "error") {
			document.getElementById('infobutton').classList.add('mobinfo-error');
			return 0;
		} else if (MobAlert[i].type == "warning" && !warning ) {
			document.getElementById('infobutton').classList.add('mobinfo-warning');
			var warning = true;
		} 
	}
};


// ---------------- BLOCK FUNCTIONS ------------------------

var createblockinfo = function (index) {
	// creates an info panel for a specific block

	var panel = document.getElementById("MoB-blockinfo");
	
	if((MobBlock[index].left + MobBlock[index].width + 200) < document.body.clientWidth ) {  // the panel can be place on the left 
		if((MobBlock[index].top + 200) < document.body.clientHeight) { // position 1
			var auxposY = MobBlock[index].top
		} else { // position 2
			var auxposY = MobBlock[index].top - 200 + MobBlock[index].height;
		}
		var auxposX = MobBlock[index].left + MobBlock[index].width;
	} else {
		// the panel need to be put on the right
		if((MobBlock[index].top + MobBlock[index].height + 200) < document.body.clientHeight) { // position 1
			var auxposY = MobBlock[index].top + MobBlock[index].height;
		} else { // position 2
			var auxposY = MobBlock[index].top - 200;
		}
		var auxposX = MobBlock[index].left;
	}

	panel.style.left =  auxposX +"px" ;
	panel.style.top = auxposY + "px"; 

	var area = Math.round((MobBlock[index].area * 100) / (document.body.clientWidth * document.body.clientHeight));

	var content = '<div class="MoB-infoblock-title MoB-span" > '+data_leng['bi_title']+'<span class="MoB-close MoB-span" onclick="document.getElementById(\'MoB-blockinfo\').hidden = true;">X</span></div>'
				+ '<div class="MoB-infoblock-table MoB-scroll MoB-span"> <table class="table table-responsive table-sm MoB-span"> <tbody class="MoB-span">'
				+ '<tr class="MoB-span"> <th class="MoB-span"> Id:</th> <td class="MoB-span"> '+MobBlock[index].id+'</td></tr>'
				+ '<tr class="MoB-span"> <th class="MoB-span">'+data_leng['bi_area']+'</th> <td class="MoB-span">  '+pxtomm(MobBlock[index].width) * pxtomm(MobBlock[index].height)+'mm&sup2; ('+area+'%) </td></tr>'
				+ '<tr class="MoB-span"> <th class="MoB-span">'+data_leng['bi_pos']+'</th> <td class="MoB-span">  ('+MobBlock[index].left+','+MobBlock[index].top+')</td></tr>'
				+ '<tr class="MoB-span"> <th class="MoB-span">'+data_leng['bi_w']+'</th> <td class="MoB-span">  '+pxtomm(MobBlock[index].width)+'mm </td></tr>'
				+ '<tr class="MoB-span"> <th class="MoB-span">'+data_leng['bi_h']+'</th> <td class="MoB-span">  '+pxtomm(MobBlock[index].height)+'mm </td></tr>'
				+ '<tr class="MoB-span"> <th class="MoB-span">'+data_leng['bi_t']+'</th> <td class="MoB-span"> '+document.getElementById(MobBlock[index].id).dataset.mobtag+' </td></tr>'
				+ '<tr class="MoB-span"> <th class="MoB-span">'+data_leng['bi_g']+'</th> <td class="MoB-span"> '+MobBlock[index].gran+' </td></tr>'
				+ '</tbody> </table> </div>';

	panel.innerHTML = content;
	panel.hidden = false;
};

var removeblock = function (block) {
	// removes a block from the block array
	var index;
	var blockid;

	for (var i=0; i < MobBlock.length ; i++) {
		if(MobBlock[i].id == block){
			index = i;
			blockid = MobBlock[i].id;
			//document.querySelector("[data-block="+MobBlock[i].id+"]").removeAttribute("data-block");
			break;
		}
	}
	removealert(blockid, 0); // deletes all the alerts associated with the block.

	// removes block from DOM
	var block = document.getElementById(blockid);
	block.parentNode.removeChild(block);

	MobBlock.splice(index, 1);
	errororwarning(); // checks for new errors/warnings.
};

var createblock = function (blocks) {
	// create new blocks 

	for (var i=0 ; i < blocks.length ; i++) {

		//checks if its a vlid block.
		if (!(pxtomm(blocks[i].width) < 3) && !(pxtomm(blocks[i].height) < 3)  ) {
			// var auxlist = [];
			// var auxblock = {'area': blocks[i].width * blocks[i].height, 'left':blocks[i].x, 'top': blocks[i].y, 'width': blocks[i].width, 'height': blocks[i].height};

			var test = new rectObj();
			test.init(window,document);
			var id = "MobBlockId"+MobBlockId;

			test.build(blocks[i].x,blocks[i].y,blocks[i].width,blocks[i].height,"","","",id);
		 	document.getElementById(id).classList.add("MobBlock");
		 	document.getElementById(id).classList.add("MoB-span");

		 	var gran = findBlockGranularity(blocks[i].width * blocks[i].height);
			MobBlock.push({'id': id, 'gran': gran,'area': blocks[i].width * blocks[i].height, 'left':blocks[i].x, 'top': blocks[i].y, 'width': blocks[i].width, 'height': blocks[i].height, 'c_gran': '', 'c_tag': '', 'c_inter': ''});
			MobBlockId++;

			MobAlert.push( {'type':'error', 'text': data_leng['al_b']+id+ data_leng['al_tag'], 'code': 'ET_'+id} );
			MobBlock[MobBlock.length - 1].c_tag = 'ET_'+id;
			document.getElementById(id).classList.add("mob-warning");

			checkgranularity(id);
			errororwarning();
		}
		
	}
};

var lightblocks = function (e){
	//lights only the blocks.

	var aux = e.target.id;
	if( (/MobBlockId/.test(aux)) ) {
		e.target.style.backgroundColor = "rgba(52, 105, 226, 0.4)";
		var tag = e.target.dataset.mobtag;
		if(!tag) tag = "";
		var top = -20;
		var box = e.target.getBoundingClientRect(); 
		var coords = getCoords(box);
		if(coords.top < 20) top = box.height + coords.top ;
		e.target.innerHTML = '<h2 class="MobTag MoB-tool MoB-span" style="top:'+top+'px;">'+ tag +'</h2>';
	}
};


// ---------------- CHECKS FUNCTIONS ------------------------

var checkgranularity = function (op) {
	// check the granularity of one block or the whole block list ('final' | 'BlockIdx' | 'refresh')
	var g_s = 1;
	var g_a = 1;
	if (MobStatus['granu'] == 0 ) {
		g_s = 0;
	} else if (MobStatus['granu'] == 10) {
		g_a = 0;
	}


	if ( op == "final") { // does the "final" check of granularity of the list of blocks 

		var aux = false;
		var blockarea = 0;
		for (var i=0; i < MobBlock.length; i++) { // checks the granularity of all blocks and adds up all the areas

			if ( MobBlock[i].gran < (MobStatus.granu - 1) ) {
				//  the gran of the block is not allowed.
				var bareamm = pxtomm(MobBlock[i].width) * pxtomm(MobBlock[i].height) ;  // block area in mm2
				MobAlert.push( {'type':'error', 'text': data_leng['al_b']+ MobBlock[i].id + data_leng['al_gran1'] + MobStatus.granu+ data_leng['al_gran2'] +MobBlock[i].gran+ data_leng['al_gran3'] + bareamm + data_leng['al_gran4'] + MobGran[MobStatus.granu - g_s].amblockmm + data_leng['al_gran5'] +MobGran[MobStatus.granu + g_a].amblockmm+"mm2", 'code': 'EG_'+MobBlock[i].id} );
				MobBlock[i].c_gran = 'EG_'+MobBlock[i].id;
				document.getElementById(MobBlock[i].id).classList.add("mob-error-gran");
				aux = true;
			} else if (MobBlock[i].gran > (MobStatus.granu + 1 ) ) {
				// gran is not ideal but allowed. 
				var bareamm = pxtomm(MobBlock[i].width) * pxtomm(MobBlock[i].height) ;  // block area in mm2
				MobAlert.push( {'type':'warning', 'text': data_leng['al_b']+ MobBlock[i].id + data_leng['al_gran1'] +MobStatus.granu+ data_leng['al_gran2'] +MobBlock[i].gran+ data_leng['al_gran3'] + bareamm + data_leng['al_gran4'] + MobGran[MobStatus.granu - g_s].amblockmm + data_leng['al_gran5'] +MobGran[MobStatus.granu + g_a].amblockmm+"mm2", 'code': 'WG_'+MobBlock[i].id} );
				MobBlock[i].c_gran = 'WG_'+MobBlock[i].id;
			}
			blockarea += MobBlock[i].area;
		}

		if ( !aux && blockarea >=  MobStatus.amtotal ) { // the blocks need to cover the min area.
			return 0; // OK
		} else {
			return 1; // ERROR
		}

	} else if ( op == "refresh") { // refreshes the status of granularity of all blocks.

		removealert("",3); // removes all error alerts

		for (var i=0; i < MobBlock.length; i++) { // checks the granularity of all blocks

			if ( MobBlock[i].gran < (MobStatus.granu - 1) )  {
				//  the gran of the block is not allowed.
				var bareamm = pxtomm(MobBlock[i].width) * pxtomm(MobBlock[i].height) ;  // block area in mm2
				MobAlert.push( {'type':'error', 'text': data_leng['al_b']+ MobBlock[i].id + data_leng['al_gran1'] +MobStatus.granu+ data_leng['al_gran2'] +MobBlock[i].gran+ data_leng['al_gran3'] + bareamm + data_leng['al_gran4'] + MobGran[MobStatus.granu - g_s].amblockmm + data_leng['al_gran5'] +MobGran[MobStatus.granu + g_a].amblockmm+"mm2", 'code': 'EG_'+MobBlock[i].id} );
				MobBlock[i].c_gran = 'EG_'+MobBlock[i].id;
				document.getElementById(MobBlock[i].id).classList.add("mob-error-gran");

			} else if ( MobBlock[i].gran > ( MobStatus.granu + 1 ) ) {
				// gran is not ideal but allowed. 
				var bareamm = pxtomm(MobBlock[i].width) * pxtomm(MobBlock[i].height) ;  // block area in mm2
				MobAlert.push( {'type':'warning', 'text': data_leng['al_b']+ MobBlock[i].id + data_leng['al_gran1'] +MobStatus.granu+ data_leng['al_gran2'] +MobBlock[i].gran+ data_leng['al_gran3'] + bareamm + data_leng['al_gran4'] + MobGran[MobStatus.granu - g_s].amblockmm + data_leng['al_gran5'] +MobGran[MobStatus.granu + g_a].amblockmm+"mm2", 'code': 'WG_'+MobBlock[i].id} );
				MobBlock[i].c_gran = 'WG_'+MobBlock[i].id;
			}
		}

	} else { // check granularity of one block

		for (var i=0; i < MobBlock.length; i++) {
			if ( MobBlock[i].id == op) {

				if ( MobBlock[i].gran < (MobStatus.granu - 1) )  {
					//  the gran of the block is not allowed.
					var bareamm = pxtomm(MobBlock[i].width) * pxtomm(MobBlock[i].height) ;  // block area in mm2
					MobAlert.push( {'type':'error', 'text': data_leng['al_b']+ MobBlock[i].id + data_leng['al_gran1'] +MobStatus.granu+ data_leng['al_gran2'] +MobBlock[i].gran+ data_leng['al_gran3'] + bareamm + data_leng['al_gran4'] + MobGran[MobStatus.granu - g_s].amblockmm + data_leng['al_gran5'] +MobGran[MobStatus.granu + g_a].amblockmm+"mm2", 'code': 'EG_'+MobBlock[i].id} );
					MobBlock[i].c_gran = 'EG_'+MobBlock[i].id;
					document.getElementById(MobBlock[i].id).classList.add("mob-error-gran");

				} else if ( MobBlock[i].gran > ( MobStatus.granu + 1 ) ) {
					// gran is not ideal but allowed. 
					var bareamm = pxtomm(MobBlock[i].width) * pxtomm(MobBlock[i].height) ;  // block area in mm2
					MobAlert.push( {'type':'warning', 'text': data_leng['al_b']+ MobBlock[i].id + data_leng['al_gran1'] +MobStatus.granu+ data_leng['al_gran2'] +MobBlock[i].gran+ data_leng['al_gran3'] + bareamm + data_leng['al_gran4'] + MobGran[MobStatus.granu - g_s].amblockmm + data_leng['al_gran5'] +MobGran[MobStatus.granu + g_a].amblockmm+"mm2", 'code': 'WG_'+MobBlock[i].id} );
					MobBlock[i].c_gran = 'WG_'+MobBlock[i].id;
				}
 				return 0; // OK 
			}
		}
	}
};

var checkalerts = function () {
	// check if there's errors or warnings in queue

	var warning = false;

	for (var i=0; i < MobAlert.length; i++ ) {
		if (MobAlert[i].type == "error" ) {
			return 0;
		} else if (MobAlert[i].type == "warning") {
			warning = true;
		}
	}

	if(warning == true){
		return 1;
	} else {
		return 2;
	}
};

var testmobautomerge = function (left,top,width,height) {
	// test for tiny blocks inside the new block or intersections. 
	// 0 = no tiny blocks and no intersection
	// 1 = theres only tiny blocks
	// 2 = there's only intersections 
	// 3 = theres both.
	var flag = 0;
	for(var i=0; i < MobBlock.length; i++) { // tries all the block created.
		if(MobBlock[i].left >= left && (MobBlock[i].left + MobBlock[i].width) <= (left + width) && MobBlock[i].top >= top && (MobBlock[i].top + MobBlock[i].height) <= (top + height)) { 
		// The block is inside, it gets deleted.
			if ( flag == 0 ) { 
				flag = 1;
			} else if (flag == 2) {
				flag = 3;
				break;
			}
		} else { // the block could be inside AND outside the new block,  COULD BE AN INTERSECTION
			if( ( MobBlock[i].left < left && (MobBlock[i].left + MobBlock[i].width) <= left ) || ( MobBlock[i].left >= (left + width) && (MobBlock[i].left + MobBlock[i].width) > (left + width) ) || ( MobBlock[i].top < top && (MobBlock[i].top + MobBlock[i].height) <= top ) || ( MobBlock[i].top >= (top + height) && (MobBlock[i].top + MobBlock[i].height) > (top + height) ) ) { 
			// The Block it's outside the new one. does nothing
			} else { // It is an intersection.
				if ( flag == 0 ) { 
					flag = 2;
				} else if (flag == 1) {
					flag = 3;
					break;
				}
			} 
		}
	}
	return flag;
};

var blockinside = function (blockA, blockB) {
	// true if block A its inside of block B, false, other way.

	var auxblock = {};
	var rect = blockA.getBoundingClientRect();
	auxblock.left = Math.round(rect.left);
	auxblock.top = blockA.offsetTop;
	auxblock.width = Math.round(blockA.offsetWidth);
	auxblock.height = Math.round(blockA.offsetHeight);

	var aux2 = blockA.className;
	var aux3 = blockA.id;
	console.log("LeftA: "+auxblock.left+" topA: "+auxblock.top+" widthA: "+auxblock.width+" heightA: "+auxblock.height+" leftB: "+blockB.left+" topB: "+blockB.top+" widthB: "+blockB.width+" heightB: "+blockB.height);
	if(auxblock.left == 0 && auxblock.top ==0) console.log(blockA);

	if(!(/MoB-/.test(aux2)) && !(/MobBlockId/.test(aux3)) && !(/Mob-/.test(aux3)) && auxblock.left >= blockB.left && (auxblock.left + auxblock.width) <= (blockB.left + blockB.width) && auxblock.top >= blockB.top && (auxblock.top + auxblock.height) <= (blockB.top + blockB.height)){ 
		// inside
		console.log("LeftA: "+auxblock.left+" topA: "+auxblock.top+" widthA: "+auxblock.width+" heightA: "+auxblock.height+" leftB: "+blockB.left+" topB: "+blockB.top+" widthB: "+blockB.width+" heightB: "+blockB.height);
		return true;
	} else { // not inside
		return false;
	}
};

var MobBlockElem = function (block, elem) {
	// true if the element is inside the block.
	var auxelem = {};
	var box = elem.getBoundingClientRect();
	var coords = getCoords(box);

	auxelem.left = coords.left;
	auxelem.top = coords.top;
	auxelem.width = Math.round(box.width);
	auxelem.height = Math.round(box.height);

	// auxelem.left = Math.round(rect.left);
	// auxelem.top = Math.round(elem.offsetTop);
	// auxelem.width = Math.round(elem.offsetWidth);
	// auxelem.height = Math.round(elem.offsetHeight);

	var t = 5; // threshold

	var aux2 = elem.className;
	var aux3 = elem.id;
	// ((block.left - t) <= auxelem.left && (auxelem.width + auxelem.left) <= (block.width + (2*t) + block.left)  && auxelem.top >= (block.top - t) && (auxelem.height + auxelem.top) <= (block.height + (2*t) + block.top))
	if((block.left - t) <= auxelem.left && (auxelem.width + auxelem.left) <= (block.width + (2*t) + block.left)  && auxelem.top >= (block.top - t) && (auxelem.height + auxelem.top) <= (block.height + (2*t) + block.top)) { 
		return true;
	} else {
		return false;
	}
};

var pointinside = function (blockA, blockB, op) {
	// checks if the starting point of block A its inside block B
	if (op == 0 ) { 
		var auxblock = {};
		var rect = blockB.getBoundingClientRect();
		auxblock.left = Math.round(rect.left);
		auxblock.top = blockB.offsetTop;
		
		var aux2 = blockB.className;
		var aux3 = blockB.id;
		
		if( !(/MoB-/.test(aux2)) && !(/MobBlockId/.test(aux3)) && !(/Mob-/.test(aux3)) &&  blockA.left >= auxblock.left && blockA.top >= auxblock.top ) {
			//inside
			return true;
		}else {
			//not inside
			return false;
		}
	}else {
		var auxblock = {};
		var rect = blockA.getBoundingClientRect();
		auxblock.left = Math.round(rect.left);
		auxblock.top = blockA.offsetTop;

		var aux2 = blockA.className;
		var aux3 = blockA.id;

		if(!(/MoB-/.test(aux2)) && !(/MobBlockId/.test(aux3)) && !(/Mob-/.test(aux3)) &&  auxblock.left >= blockB.left  &&  auxblock.top >= blockB.top  ) {
			//inside
			return true;
		}else {
			//not inside
			return false;
		}
	}
};

var pointonblock = function (Block1, Block2) {
	// checks if a point its inside a block
	Block1.cont = 0;
	Block1.ptos = [];

	if( Block2.x1 <= Block1.x1 && Block1.x1 <= Block2.x3 && Block2.y1 <= Block1.y1 && Block1.y1 <= Block2.y3) {
		Block1.ptos.push({'x':Block1.x1, 'y':Block1.y1});
		Block1.cont = Block1.cont + 1;
	}

	if( Block2.x1 <= Block1.x2 && Block1.x2 <= Block2.x3 && Block2.y1 <= Block1.y2 && Block1.y2 <= Block2.y3) {
		Block1.ptos.push({'x':Block1.x2, 'y':Block1.y2});
		Block1.cont = Block1.cont + 1;
	}

	if( Block2.x1 <= Block1.x3 && Block1.x3 <= Block2.x3 && Block2.y1 <= Block1.y3 && Block1.y3 <= Block2.y3) {
		Block1.ptos.push({'x':Block1.x3, 'y':Block1.y3});
		Block1.cont = Block1.cont + 1;
	} 

	if( Block2.x1 <= Block1.x4 && Block1.x4 <= Block2.x3 && Block2.y1 <= Block1.y4 && Block1.y4 <= Block2.y3) {
		Block1.ptos.push({'x':Block1.x4, 'y':Block1.y4});
		Block1.cont = Block1.cont + 1;
	} 
};


// ------------------  STRUCTS FUNCTIONS ------------------

var iniMoBStructBlock = function (MoBStructBlock) {
	// Creation of the Mob Struct of Blocks
	var actualarea = MobBlock.reduce(function (sum, block) {
					    return sum + block.area;
					}, 0);

	MoBStructBlock.meta = {};
	MoBStructBlock.block = [];
	// fills meta info
	MoBStructBlock.meta.cantblock = MobBlock.length;
	MoBStructBlock.meta.areablock= actualarea;
	// fills blocks info
	for (var i=0; i<MobBlock.length; i++) {
		MoBStructBlock.block.push({
					'id': MobBlock[i].id, 
					'tag': document.getElementById(MobBlock[i].id).dataset.mobtag,
					'left': MobBlock[i].left,
					'top': MobBlock[i].top,
					'width': MobBlock[i].width,
					'height':MobBlock[i].height,
					'words': 0,
					'elems': 0,
					'gran': MobBlock[i].gran,
					'dom': {}
					});
	}
};

var findDomElems = function (elem) {
	// fills the data of all the childs inside the representative DOM element.
	var content = [];

	if (elem.childNodes.length > 0) { // si tiene hijos 
			content = findDomElemsAux(elem.childNodes);
	}

	var attr = Array.prototype.slice.call(elem.attributes);
	var attr_resume = {};

	for (var j=0; j < attr.length; j++) {
		attr_resume[attr[j].name] = attr[j].value
	}
	attr_resume.tagname = elem.tagName;
	
	if (elem.childNodes.length == 1 && elem.childNodes[0].nodeType == 3) { // it has a text node.
		attr_resume.textvalue = encodeURI(elem.childNodes[0].nodeValue);
	}

	var aux = {"meta":attr_resume, "content":content};
	return aux;
};

var findDomElemsAux = function (node) {
	// Function helper for findDomElems, it iterates over elegible childrens and returns the information of all the childrens for each parent.
	var childs = [];

	for(var i=0; i < node.length; i++) {
		if (node[i].nodeType === Node.ELEMENT_NODE) {
		    childs.push( node[i] );
		}
	}
	
	var contentchilds = [];
	for (var i=0; i < childs.length; i++) {
		contentchilds.push(findDomElems(childs[i]));
	}

	return contentchilds;
};

var mobCountElems = function (block, elem) {
	// count the words and elements.
 
	block.elems = block.elems + 1;

	if(elem.meta.textvalue != undefined){
		block.words = block.words + mobCountWords(elem.meta.textvalue);
	}
	
	for (var i=0; i < elem.content.length; i++) {
		mobCountElems (block, elem.content[i]);
	}
};

var collectElemsData = function (block,elem) {
	// collect all the DOM data necesary for the segmentation and the different formats in the future.

	block.dom = findDomElems(elem);
	mobCountElems(block, block.dom);
};

//------------------  TRANSFORM HTML FUNCTIONS ------------------

var mobCleanTags = function (elem) {
	// erases all the mobids 
	
	if(elem.dataset.mobid) {
		elem.removeAttribute('data-mobid');
		elem.removeAttribute('data-mobdomtag');
	}

	for(var j=0; j< elem.childNodes.length; j++){
		if (elem.childNodes[j].nodeType === Node.ELEMENT_NODE) {
			mobCleanTags(elem.childNodes[j]);
		}
	}
}

var MobTagHTML = function (structB, call) {
	// edits the html to add the MoB tags to it. Also updates the Blocks Structure to add the word counts and elements count
	for (var i=0; i<structB.block.length; i++) {
		MobFindTag (structB.block[i], document.body);
	}
	call();
};

var MobFindTag = function (block,elem) {

	if (MobBlockElem(block,elem)) { 
		if (elem.dataset.mobid == undefined) {
			elem.dataset.mobdomtag = block.tag;
			elem.dataset.mobid = block.id;
			// find dom elements and word count.
			if (!elem.classList.contains("MoB-span") ) {
				collectElemsData(block, elem);
			}
		}
	} else {
		for(var j=0; j< elem.childNodes.length; j++){
			if (elem.childNodes[j].nodeType === Node.ELEMENT_NODE) {
				MobFindTag(block,elem.childNodes[j]);
			}
		}
	}
};

// ----------------- UTILITY FUNCTIONS --------------------

var mobCountWords = function (str) {
	// count words on a string
  return str.trim().split(/\s+/).length;
};

var MobHTMLtoString = function (call) {
	// save the HTML as a string
	var MoBHTML = new XMLSerializer().serializeToString(document);
	call(MoBHTML);
};

var MobWhichBrowser = function () {
	// identify which browser is the one being used

	navigator.sayswho = (function(){
	    var ua= navigator.userAgent, tem, 
	    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	    if(/trident/i.test(M[1])){
	        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
	        return 'IE '+(tem[1] || '');
	    }
	    if(M[1]=== 'Chrome'){
	        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
	        if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
	    }
	    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
	    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
	    return M.join(' ');
	})();

	return navigator.sayswho;
};

var toggleBlocks = function (aux) {
	// toggle the visibility of the blocks.
	var aux2;
	document.getElementById("MoB-Menu").hidden = aux;
	if (aux == true)
		document.getElementById("Mob-infopanel").hidden = aux;

	// for (var i=0; i<MobBlockId; i++) {
	// 	aux2 = document.getElementById("MobBlockId"+i);
	// 	if (aux2) 
	// 		document.getElementById("MobBlockId"+i).hidden = aux;
	// }
};

var findBlockGranularity = function (area) {
	// Finds the granularity of a block giving it's area (px)
	
	if(area < MobGran[0].amblock) { // special case, if it's a really tiny block, is gran 0.
		return 0;
	}
	if(area >= MobGran[MobGran.length-1].amblock) { // if the block is too large, is gran 10.
		return 10;
	}
	for(var i=0; i < MobGran.length-1; i++) {
		if(MobGran[i].amblock <= area && area < MobGran[i+1].amblock){
			return i;
		}
	}
};

var calculategran = function () {
	// calculates the limits given a level of granularity. (in px2)

	var bodyW = document.body.clientWidth;
	var bodyH = document.body.clientHeight;
	var doc_A = Math.round(bodyW * bodyH);
	MobStatus.amtotal = Math.round(doc_A * MobGranSlack);

	for (var i=0; i<MobGran.length;i++) {
		MobGran[i].amblock = Math.round(MobStatus.amtotal / MobGran[i].h);
	}
	

	MobStatus.res =  1 / (dpi()/25.4); // 1 px equals to this mm. 

	// calculates again but in mm2
	var doc_Amm = Math.round(pxtomm(bodyW) * pxtomm(bodyH));
	MobStatus.amtotalmm = Math.round(doc_Amm * MobGranSlack);

	for (var i=0; i<MobGran.length;i++) {
		MobGran[i].amblockmm = Math.round(MobStatus.amtotalmm / MobGran[i].h);	
	}
};

var MobLoadScreen = function (op) {
	// creates or delete the loading animation.

	if( op == true){
		load = ' <div id="loadscreen"><i class="fa fa-spinner fa-pulse fa-3x fa-fw MoB-span"></i> </div>';
		document.body.insertAdjacentHTML("beforeend",load);
	} else {
		//setTimeout( function(){
		var child = document.getElementById("loadscreen");
		child.parentNode.removeChild(child);
		// },2000);
	}
};

var getCoords = function (box) { 
	// gets the top and left coordinates normalized 

    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
};

var orderblocks = function () {
	// orders the list of blocks so tiny ones inside a big one can be selected too.

	MobBlock.sort(function (a, b) {
	  if (a.area < b.area) {
	    return 1;
	  }
	  if (a.area > b.area) {
	    return -1;
	  }
	  // a must be equal to b
	  return 0;
	});
};

var fixindex = function () {
	// fixes the z-index of each block according to their order on the list.

	for (var i=0; i < MobBlock.length; i++) {
		document.getElementById(MobBlock[i].id).style.zIndex = 100000 + i;
	}
};

var importfa = function() {
	// imports the FA lib
	var fa = document.createElement('style');
    fa.type = 'text/css';
    fa.textContent = '@font-face { font-family: FontAwesome; src: url("'
        + chrome.extension.getURL('fa/fonts/fontawesome-webfont.woff?v=4.7.0')
        + '"); }';
	document.head.appendChild(fa);
};

var MoBremovelinks = function() {
	// removes all links and iframes and also removes "disable" atributte.

	var inputs = document.getElementsByTagName("input");

	for (var v=0;v<inputs.length;v++) {
		inputs[v].removeAttribute('disabled');
	}

	var anchors = document.links;
	for (var i=0;i<anchors.length;i++) {
		anchors[i].onclick = function(){return false;};
		anchors[i].dataset.href = anchors[i].href;
		anchors[i].href = "#";
		anchors[i].removeAttribute('target');
	}

	var iframes = document.getElementsByTagName('iframe');
	for (var i=0;i<iframes.length;i++) {
		// var links;
		// if ( iframes[i].contentWindow && iframes[i].contentWindow.document){
		//   links = iframes[i].contentWindow.document.links;
		//   for(var i in links){
		//      links[i].href="#";
		//   }
		// }

		var box = iframes[i].getBoundingClientRect(); // width | height
		var coords = getCoords(box); // top | left

		var div = document.createElement("div");
		div.setAttribute("id", "MoB-Iframe-"+i);
		div.style.backgroundColor = '#ffff66';

		div.style.position = 'absolute';
		div.style.top = iframes[i].style.top;
		div.style.left = iframes[i].style.left;
		div.style.width = box.width;
		div.style.height = iframes[i].style.height;

		var parent = iframes[i].parentNode;
		parent.insertBefore(div, iframes[i]);
		div.appendChild(iframes[i]);
	}
};

var Mobautomerge = function(left,top,width,height) {
	// deletes any tiny blocks inside a big one 
	var delblock = [];
	var ask = false;
	for(var i=0; i < MobBlock.length; i++) { // tries all the block created.

		if(MobBlock[i].left >= left && (MobBlock[i].left + MobBlock[i].width) <= (left + width) && MobBlock[i].top >= top && (MobBlock[i].top + MobBlock[i].height) <= (top + height)) { 
		// The block is inside, it gets deleted.

			// var block = document.getElementById(MobBlock[i].id);
			// block.parentNode.removeChild(block);
			delblock.push(MobBlock[i].id);

		} else { // the block could be inside AND outside the new block,  COULD BE AN INTERSECTION
			if( ( MobBlock[i].left < left && (MobBlock[i].left + MobBlock[i].width) <= left ) || ( MobBlock[i].left >= (left + width) && (MobBlock[i].left + MobBlock[i].width) > (left + width) ) || ( MobBlock[i].top < top && (MobBlock[i].top + MobBlock[i].height) <= top ) || ( MobBlock[i].top >= (top + height) && (MobBlock[i].top + MobBlock[i].height) > (top + height) ) ) { 
			// The Block it's outside the new one. does nothing
			} else { // It is an intersection.

				if (!ask) {
					mob_modal(data_leng['m_overlap'],3); 
					ask = true;
				}
				MobAlert.push({'type':'error', 'text':data_leng['al_b'] + 'MobBlockId'+ MobBlockId+  data_leng['al_overlap1'] + MobBlock[i].id + data_leng['al_overlap2'], 'code': 'EI_'+'MobBlockId'+MobBlockId+MobBlock[i].id });
				document.getElementById(MobBlock[i].id).classList.add("mob-error");
			} 
		}
	}
	delblock.forEach(removeblock);
};

var pxtomm = function (px) {
	return Math.round(px * MobStatus.res);
};

var px2tomm2 = function (areapx) {
	// transforms pixels^2 areas to milimeters^2 areas, rounded.

	var factor = 1.0 / (26.0 * 26.0);
	return Math.round(areapx * factor);
};

var ie =  function () {
    return Math.sqrt(screen.deviceXDPI * screen.deviceYDPI) / MobRes.dpi;
};

var dppx = function() {
    // devicePixelRatio: Webkit (Chrome/Android/Safari), Opera (Presto 2.8+), FF 18+
    return typeof window == 'undefined' ? 0 : +window.devicePixelRatio || ie() || 0;
};

var dpcm = function() {
    return dppx() * MobRes.dpcm;
};

var dpi = function() {
    return dppx() * MobRes.dpi;
};

var mob_readCookie = function (name) {
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
};

// ---------------- CASES OF INTERSECTIONS FUNCTIONS -----------------

var MobCase1 = function (BlockA, BlockB) {
	//handles the intersection on Case 1

	var newblocks = [];
	var difx = Math.abs(BlockB.ptos[0].x - BlockA.ptos[0].x);
	var dify = Math.abs(BlockB.ptos[0].y - BlockA.ptos[0].y);

	if( BlockB.ptos[0].x > BlockA.ptos[0].x ) { // B block is at the left of A 
		if( BlockB.ptos[0].y > BlockA.ptos[0].y) { // B block is higher than A
			newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': BlockB.width, 'height': (BlockB.height - dify) - 1});
			newblocks.push({'x': BlockB.x1, 'y': BlockA.ptos[0].y, 'width': (BlockB.width - difx) - 1, 'height': dify });
		} else { // B block is lower than A
			newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': (BlockB.width - difx) - 1, 'height': dify });
			newblocks.push({'x': BlockB.x1, 'y': BlockA.ptos[0].y + 1, 'width': BlockB.width, 'height': (BlockB.height - dify) - 1});
		}
	} else { // B block is at the right of A
		if( BlockB.ptos[0].y > BlockA.ptos[0].y) { // B block is higher than A
			newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': BlockB.width, 'height': (BlockB.height - dify) - 1});
			newblocks.push({'x': BlockA.ptos[0].x + 1, 'y': BlockA.ptos[0].y, 'width': (BlockB.width - difx) - 1, 'height': dify});
		} else { // B block is lower than A
			newblocks.push({'x': BlockA.ptos[0].x + 1, 'y': BlockB.y1, 'width': (BlockB.width - difx) - 1, 'height': dify });
			newblocks.push({'x': BlockB.x1, 'y': BlockA.ptos[0].y + 1, 'width': BlockB.width, 'height': (BlockB.height - dify) - 1 });
		}
	}

	// Delete B
	removeblock(BlockB.id);

	// New Block/s
	createblock(newblocks);
};

var MobCase2 = function (BlockA, BlockB) {
	//handles the intersection  on Case 2

	var newblocks = [];
	var x, y, width, height;

	if ( (BlockB.ptos[0].y == BlockB.ptos[1].y && BlockA.ptos[0].y == BlockA.ptos[1].y) || (BlockB.ptos[0].y == BlockB.ptos[1].y && BlockA.ptos[0].x == BlockA.ptos[1].x ) ) {

		y = BlockB.y1;
		height = (BlockA.y1 - BlockB.y1) - 1;
		if ( BlockB.ptos[0].y == BlockB.y1 ) { y = BlockA.y3 + 1; height = (BlockB.y3 - y) - 1;  }

		newblocks.push({'x': BlockB.x1, 'y': y, 'width': BlockB.width, 'height': height});

	} else if ( (BlockB.ptos[0].x == BlockB.ptos[1].x && BlockA.ptos[0].x == BlockA.ptos[1].x) || (BlockB.ptos[0].x == BlockB.ptos[1].x && BlockA.ptos[0].y == BlockA.ptos[1].y)) {

		x = BlockA.x2 + 1;
		width = (BlockB.x2 - BlockA.x2) - 1;
		if ( BlockB.ptos[0].x == BlockB.x2 ) { x = BlockB.x1; width = (BlockA.x1 - BlockB.x1) - 1;  }

		newblocks.push({'x': x, 'y': BlockB.y1, 'width': width, 'height': BlockB.height});

	} 

	// Delete B
	// var block = document.getElementById(BlockB.id);
	// block.parentNode.removeChild(block);
	removeblock(BlockB.id);

	// New Block/s
	createblock(newblocks);
};

var MobCase3 = function (BlockA, BlockB) {
	//handles the intersection  on Case 3

	var newblocks = [];

	if ( BlockB.height > BlockA.height && BlockA.width > BlockB.width) { // block B is taller than A

		newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': BlockB.width, 'height': (BlockA.y1 - BlockB.y1) - 1});
		newblocks.push({'x': BlockB.x1, 'y': BlockA.y4 + 1, 'width': BlockB.width, 'height': (BlockB.y4 - BlockA.y4) - 1});


	} else if (BlockB.height < BlockA.height && BlockA.width < BlockB.width) { //block A is taller than B

		newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': (BlockA.x1 - BlockB.x1) - 1, 'height': BlockB.height});
		newblocks.push({'x': BlockA.x2 + 1, 'y': BlockB.y1, 'width': (BlockB.x2 - BlockA.x2) - 1, 'height': BlockB.height});

	}

	// Delete B
	// var block = document.getElementById(BlockB.id);
	// block.parentNode.removeChild(block);
	removeblock(BlockB.id);

	// New Block/s
	createblock(newblocks);
};

var MobCase4 = function (BlockA, BlockB) {
	//handles the intersection  on Case 4

	var newblocks = [];

	if ( BlockA.cont > BlockB.cont ) {  // THE B BLOCK GETS CUT IN TWO BLOCKS  -0-0-0-0-0-0-0-0-0-

		if ( BlockA.ptos[0].x == BlockA.ptos[1].x) { // Block B is taller than A *******************

			if ( BlockB.x1 < BlockA.x1) { // the block B is at the right of A --------------

				if ( BlockB.y1 > BlockA.y1 ) { // The block A is lower than B
					newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': BlockB.width, 'height': (BlockA.y1 - BlockB.y1) - 1});
					newblocks.push({'x': BlockA.x2 + 1, 'y': BlockA.y2, 'width': (BlockB.x2 - BlockA.x2) - 1, 'height': BlockA.height});
				} else {  // The block A is higher than B
					newblocks.push({'x': BlockB.x1, 'y': BlockA.y3 + 1, 'width': BlockB.width, 'height': (BlockB.y3 - BlockA.y3) - 1});
					newblocks.push({'x': BlockA.x2 + 1, 'y': BlockA.y2, 'width': (BlockB.x2 - BlockA.x2) - 1, 'height': BlockA.height});
				}
			} else { // the block B is at the left of A -----------------------

				if ( BlockB.y1 > BlockA.y1 ) { // The block A is lower than B
					newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': BlockB.width, 'height': (BlockA.y1 - BlockB.y1) - 1});
					newblocks.push({'x': BlockB.x1, 'y': BlockA.y1, 'width': (BlockA.x1 - BlockB.x1) - 1, 'height': BlockA.height});
				} else {  // The block A is higher than B
					newblocks.push({'x': BlockB.x1, 'y': BlockA.y3 + 1, 'width': BlockB.width, 'height': (BlockB.y3 - BlockA.y3) - 1});
					newblocks.push({'x': BlockA.x2 + 1, 'y': BlockA.y2, 'width': (BlockB.x2 - BlockA.x2) - 1, 'height': BlockA.height});
				}
			}

		} else if ( BlockA.ptos[0].y == BlockA.ptos[1].y ) {  // Block B is widther than A *****************

			if ( BlockB.y1 < BlockA.y1) { // the block B is higher than A --------------

				if ( BlockB.x1 < BlockA.x1 ) { // The block B is moved to the left
					newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': (BlockA.x1 - BlockB.x1) - 1, 'height': BlockB.height});
					newblocks.push({'x': BlockA.x1, 'y': BlockB.y1, 'width': BlockA.width, 'height': (BlockA.y1 - BlockB.y1) - 1});
				} else {  // The block B is moved to the right
					newblocks.push({'x': BlockA.x2 + 1, 'y': BlockB.y2, 'width': (BlockB.x2 - BlockA.x2) - 1, 'height': BlockB.height});
					newblocks.push({'x': BlockB.x1, 'y': BlockB.y1 , 'width': BlockA.x2 - BlockB.x1 , 'height': (BlockA.y1 - BlockB.y1) });
				}
			} else { // the block B is lower than A -----------------------

				if ( BlockB.x1 < BlockA.x1 ) { // The block B is moved to the left
					newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': (BlockA.x1 - BlockB.x1) - 1, 'height': BlockB.height });
					newblocks.push({'x': BlockA.x1, 'y': BlockA.y3 + 1, 'width': BlockA.width, 'height': (BlockB.y3 - BlockA.y3) - 1});
				} else {  // The block B is moved to the right
					newblocks.push({'x': BlockB.x1, 'y': BlockA.y3 + 1, 'width': BlockA.width, 'height': (BlockB.y3 - BlockA.y3) - 1});
					newblocks.push({'x': BlockA.x2 + 1, 'y': BlockB.y2, 'width': (BlockB.x2 - BlockA.x2) - 1, 'height': BlockB.height});
				}
			}
		}

	} else {  // THE BLOCK B GETS CUT IN ONE BLOCK -0-0-0-0-0-0-0-0-0-0-

		var x, y, width, height;
		if ( BlockB.ptos[0].x == BlockB.ptos[1].x) { // Block A is taller than B

			x = BlockB.x1;
			width = (BlockA.x1 - BlockB.x1) - 1;
			if ( BlockA.x1 < BlockB.x1 ) {
				x = BlockA.x2 + 1;
				width = BlockB.x2 - x;
			}
			newblocks.push({'x': x, 'y': BlockB.y1, 'width': width, 'height': BlockB.height});

		} else if ( BlockB.ptos[0].y == BlockB.ptos[1].y) {  // Block A is widther than B

			y = BlockB.y1;
			height = (BlockA.y1 - BlockB.y1) - 1; 
			if ( BlockB.y3 > BlockA.y3) {
				y = BlockA.y3 + 1;
				height = BlockB.y3 - y;
			}
			newblocks.push({'x': BlockB.x1, 'y': y, 'width': BlockB.width , 'height': height});
		}
	}

	// Delete B
	// var block = document.getElementById(BlockB.id);
	// block.parentNode.removeChild(block);
	removeblock(BlockB.id);

	// New Block/s
	createblock(newblocks);
};

var MobCase5 = function (BlockA, BlockB) {
	//handles the intersection  on Case 5

	var newblocks = [];

	if (BlockA.cont == 2) {

		if(BlockA.ptos[0].x == BlockA.ptos[1].x ) { // The block A is widther 

			BlockA.ptos.sort(function (a, b) { if (a.y > b.y) { return 1;} if (a.y > b.y) { return -1;} return 0; });
			newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': BlockB.width , 'height': (BlockA.ptos[0].y - BlockB.y1)-1});
			newblocks.push({'x': BlockB.x1, 'y': BlockA.ptos[1].y + 1, 'width': BlockB.width , 'height': BlockB.y4 - BlockA.ptos[1].y});

		} else if (BlockA.ptos[0].y == BlockA.ptos[1].y ) { // Block A is taller

			BlockA.ptos.sort(function (a, b) { if (a.x > b.x) { return 1;} if (a.x > b.x) { return -1;} return 0; });
			newblocks.push({'x': BlockB.x1, 'y': BlockB.y1, 'width': (BlockA.ptos[0].x - BlockB.x1) - 1 , 'height': BlockB.height});
			newblocks.push({'x': BlockA.ptos[1].x + 1, 'y': BlockB.y1, 'width': (BlockB.x2 - BlockA.ptos[1].x), 'height': BlockB.height});

		}

	} else if (BlockB.cont == 2) {
		var x, y, width, height;

		if(BlockB.ptos[0].x == BlockB.ptos[1].x) { // The block B is widther 

			x = BlockB.x1 + BlockA.width + 1;
			width = BlockB.x2 - BlockA.x2;
			if ( BlockB.x1 < BlockA.x1 ) {
				x = BlockB.x1;
				width = (BlockA.x1 - BlockB.x1) - 1;
			}
			newblocks.push({'x': x , 'y': BlockB.y1 , 'width': width, 'height': BlockB.height});

		} else if ( BlockB.ptos[0].y == BlockB.ptos[1].y ) { // Block B is taller

			y = BlockA.y3 + 1;
			height = BlockB.y3 - BlockA.y3;

			if ( BlockB.y1 < BlockA.y1 ) {
				y = BlockB.y1;
				height = BlockA.y1 - BlockB.y1;
			}
			newblocks.push({'x': BlockB.x1, 'y': y, 'width': BlockB.width, 'height': height});

		}
	}

	// Delete B
	// var block = document.getElementById(BlockB.id);
	// block.parentNode.removeChild(block);
	removeblock(BlockB.id);

	// New Block/s
	createblock(newblocks);
};

// ---------------- MOB ALERT MODAL FUNCTIONS -----------------

function mob_modal(msg, op, func, col) {
	// add a modal and depending on the option, the functionability of the modal can change.

	var modal =  '<div class="MoB-modalbg MoB-span" id="mob_modal">'
				+'<div class="MoB-modalmsg MoB-span">'
				+'<h2 class="MoB-span">'+data_leng['m_message']+'</h2>'
				+'<p class="MoB-span">'+msg+'</p>';

	switch (op) {
		case 0: // its a "confirm" modal
			modal += '<div class="MoB-span" align="center">'
					+'<input class="MoB-span" type="hidden" id="mob_modalvar" value="true"/>'
					+'<button class="MoB-span" type="button" id="mob_action">Ok</button>'
					+'<button class="MoB-span" type="button" id="mob_cancel2">'+data_leng['m_cancel']+'</button>'
					+'</div></div></div>';
		break;

		case 1: // its a "tag list" modal. 

			modal += '<div class="MoB-span" align="center"><select class="MoB-span" id="mob_modalvar" size="6">';
				for (var i=0; i<MobTags.length; i++) {
					modal +='<option class="MoB-span" value="'+MobTags[i][1]+'">'+MobTags[i][1]+'</option>';
				}
				modal += '</select> </div></br>'
					+'<div class="MoB-span" align="center"><button class="MoB-span" type="button" id="mob_action">Ok</button> <button class="MoB-span" type="button" id="mob_cancel">'+data_leng['m_cancel']+'</button></div>'
					+'<p class="MoB-span"> If you wanna know more about these tags go to <a class="MoB-span" href="http://mob.ciens.ucv.ve/tagsinfo" target="_blank"> TAGS</a> </p> </div></div>';

		break;

		case 2: // its a "enter a value" modal
			modal += '<div class="MoB-span" align="center"><input class="MoB-input" type="text" id="mob_modalvar" pattern="\d*" maxlength="2" required> </br></br>'
					+'<button class="MoB-span" type="button" id="mob_action">Ok</button> <button class="MoB-span" type="button" id="mob_cancel">'+data_leng['m_cancel']+'</button></div>'
					+'</div></div>';
		break; 

		case 3: // its an "alert" modal
			modal += '<div class="MoB-span" align="center"> <button class="MoB-span" type="button" id="mob_cancel" >Ok</button> </div>'
					+ '</div></div>';
		break;

		case 4: // collection modal
			modal += '<div class="MoB-span" align="center"><select class="MoB-span" id="mob_modalvar">';

				for (var i=0; i<MobCollections.length; i++) {
					modal +='<option class="MoB-span" value="'+i+'">'+MobCollections[i][1]+'</option>';
				}
				modal += '</select> </div></br>'
					+'<div class="MoB-span" align="center"><button class="MoB-span" type="button" id="mob_action2">'+data_leng['m_select']+'</button> </div>'
					+'</div></div>';

		break;

		case 5: // categories modal
			modal += '<div class="MoB-span" align="center"><select class="MoB-span" id="mob_modalvar" >';
					var cat = MobCollections[col][2].split(",")
					for (var i=0; i<cat.length; i++) {
						modal +='<option class="MoB-span" value="'+cat[i]+'">'+cat[i]+'</option>';
					}
				modal += '</select> </div></br>'
					+'<div class="MoB-span" align="center"><button class="MoB-span" type="button" id="mob_action">'+data_leng['m_select']+'</button> </div>'
					+'</div></div>';
		break;
	}

	document.body.insertAdjacentHTML("beforeend",modal);
	
	if( op == 5) {
		document.getElementById("mob_action").onclick = function() {func(MobCollections[col][1], document.getElementById("mob_modalvar").value); mob_hiddemodal();};
	} else if(op == 4){
		document.getElementById("mob_action2").onclick = function() { 
			var aux = document.getElementById("mob_modalvar").value; 
			mob_hiddemodal(); 
			mob_modal("choose the category", 5, func, aux );};
	} else if(op != 3){
		document.getElementById("mob_action").onclick = function() {func(document.getElementById("mob_modalvar").value); mob_hiddemodal();};
	} 
	if (op == 0) { 
		document.getElementById("mob_cancel2").onclick = function() {mob_hiddemodal();};
	} else if (op != 4 && op !=5 ) {
		document.getElementById("mob_cancel").onclick = function() {mob_hiddemodal();};
	}
};

function mob_hiddemodal () {
	// deletes the modal created.
	var modal = document.getElementById("mob_modal");
		modal.parentNode.removeChild(modal);
};
