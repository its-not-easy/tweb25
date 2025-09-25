//--- Content Scripts: ---
// New file: 212900.user.js
{
// ==UserScript==
// @name        SRL Races on Twitch
// @namespace   www.twitch.tv/zas_
// @description SRL Race funcions for twitch pages
// @include     *.twitch.tv/*
// @exclude     api.twitch.tv/*
// @exclude     blog.twitch.tv/*
// @exclude     help.twitch.tv/*
// @exclude     *.www.twitch.tv/*
// @version     3.10
// @icon        http://i.imgur.com/XLmjxcG.png
// @grant       none
// @updateURL   https://openuserjs.org/install/zasoot/SRL_Races_on_Twitch.user.js
// @downloadURL https://openuserjs.org/install/zasoot/SRL_Races_on_Twitch.user.js
// ==/UserScript==

//comment variables
hoverNode = Array();
hoverElements = 0;
//race data
race = null;
entrant = null;
updatetimer = null;
//online button
refreshtimer = null;
//offline button
racetimetimer = null;
//race time
racetime = 0;
chatconfirm = '';
request_in_progress = false;
initialized = false;
dragstarted = false;
var mousex;
var mousey;
var dragging = false;
var dragx = 0;
var dragy = 0;
var dragsx = 0;
var dragsy = 0;
var dragposx;
var dragposy;
if (window.top == window.self)
	pagereload();

function pagereload() {
	//dashboard loads instantly
	if (document.title.indexOf("'s Dashboard - Twitch") > 0)
		init_dashboard();
	else
		//since normal twitch pages now run in a single window we need to start listening to its changes
		//document.documentElement.addEventListener('DOMSubtreeModified', checkload, false);
		//actually.. better just use a timer to make it lighter, shouldn't be a big problem anyways
		window.setInterval(checkload, 1000);
}

function checkload() {
	//if srl button has been removed in a page change
	if (!document.getElementById('srl_button')) {
		if (document.getElementById('srl_outside_family')) {
			hide_menu();
			document.getElementById('srl_outside_family').remove();
		}
		init_channel();
	}
}

function init_channel() {
	//check for channel-name node to grab the streamer's name and verify channel page
	var profilenode = document.getElementsByClassName('channel-name')[0];
	if (profilenode) {
		//stop all other events that would create more srl buttons
		//document.documentElement.removeEventListener('DOMSubtreeModified', checkload, false);
		page_type = 'channel';
		var prof = profilenode.href.split('/');
		streamer = prof[prof.length - 2];
		//initialize and create the srl button
		init();
		//now that the button exists start listening for more page changes
		//document.documentElement.addEventListener('DOMSubtreeModified', checkload, false);
	}
}

function init_dashboard() {
	page_type = 'dashboard';
	streamer = document.title.substring(0, document.title.indexOf("'"));
	init();
}

function init() {
	if (!document.getElementById("srl_style")) {
		var css = document.createElement("style");
		css.type = "text/css";
		css.id = "srl_style";
		css.innerHTML = get_style();
		document.head.appendChild(css);
	}

	channel = streamer.toLowerCase();
	button_node = document.createElement('a');
	button_node.id = 'srl_button';
	button_node.innerHTML = 'SRL';
	button_node.opacity = '0.3';
	comment_node = document.createElement('div');
	comment_node.id = 'srl_comment';
	comment_node.className = 'tipsy tipst-sw';
	comment_node.innerHTML = '<div class="tipsy-inner" id="srl_comment_message"></div><div class="tipsy-arrow tipsy-arrow-s"></div>';
	comment_node.style.display = 'none';
	switch (page_type) {
		case 'channel': {
			var insert_main = document.getElementById('left_col');
			var insert_element = document.getElementsByClassName('channel-actions')[0];
			//buttons
			window_node = document.createElement('div');
			window_node.id = 'srl';
			window_node.className = 'chat-menu ember-view share dropmenu';
			button_node.className = 'ember-view button drop action';
			button_node.onclick = srl_button_action;
			button_node.style.margin = '0px 10px 10px 0px';
			insert_element.appendChild(button_node);
			inside_family_node = document.createElement('div');
			inside_family_node.id = 'srl_inside_family';
			inside_family_node.appendChild(window_node);
			inside_family_node.appendChild(comment_node);
			outside_family_node = document.createElement('div');
			outside_family_node.id = 'srl_outside_family';
			outside_family_node.className = 'ember-chat';
			outside_family_node.style.height = 'auto';
			outside_family_node.style.minWidth = 'auto';
			outside_family_node.style.position = 'static';
			insert_main.parentNode.insertBefore(outside_family_node, insert_main);
			insert_element.appendChild(inside_family_node);
		}
		break;
		case 'dashboard': {
			var insert_into = document.getElementById('site_header');
			insert_element = document.getElementById('vod_form');
			window_node = document.createElement('div');
			window_node.id = 'srl';
			window_node.className = 'dropmenu menu-like';
			button_node.className = 'first button drop';
			button_node.onclick = srl_button_action;
			button_node.style.margin = '0px 0px 0px 1px';
			insert_element.insertBefore(button_node, document.getElementById('form_submit'));
			insert_element.appendChild(window_node);
			insert_element.appendChild(comment_node);
		}
		break;
		default:
			break;
	}
	window_node.innerHTML = '\
	<div id="srl_window_content">\
        <div id="srl_draggable">\
			<div class="dropmenu_action_old srl_titlecontainer">\
				<label id="srl_racetitle">Loading</label>\
			<img id="srl_loading" src="http://www-cdn.jtvnw.net/images/spinner.gif">\
      <div id="srl_close">⨯</div>\
			</div>\
        </div>\
        <div id="srl_race_content">\
			<label class="dropmenu_action_old srl_postgoal">\
				<a class="g18_mail-FFFFFF80 srl_post" id="srl_post_goal"></a>\
				<span id="srl_racegoal">No goal</span>\
			</label>\
			<div class="srl_n_and_entrants">\
				<label>\
					<span class="dropmenu_action_old" id="srl_racestatus"></span>\
					<span id="srl_entrants_n"></span>\
				</label>\
				<div id="srl_entrants"></div>\
			</div>\
			<div class="dropmenu_action_old srl_post_links">\
				<a class="g18_mail-FFFFFF80 srl_post" id="srl_post_multitwitch"></a>\
				<a target="_blank" class="new" id="srl_multitwitch">Multitwitch</a>\
				<a class="g18_mail-FFFFFF80 srl_post_left" id="srl_post_racepage"></a>\
				<a target="_blank" class="new" id="srl_racepage">Race page</a>\
			</div>\
        </div>\
        <div class="srl_advertise_container">\
			<a class="new" id="srl_advertise">Share this script with the chat</a>\
		</div>\
	</div>\
	<div id="srl_chat_confirm">\
        <label id="srl_chat_confirm_text"></label>\
		<div id="srl_chat_yes" class="button">\
			<div class="srl_button">Yes</div>\
        </div>\
        <div id="srl_chat_no" class="button">\
			<div class="srl_button">No</div>\
        </div>\
	</div>';
	window_node.parentNode.style.position = 'relative';
	window_node.style.display = 'none';
	window_content_node = document.getElementById('srl_window_content');
	chat_confirm_node = document.getElementById('srl_chat_confirm');
	chat_confirm_text_node = document.getElementById('srl_chat_confirm_text');
	chat_yes_node = document.getElementById('srl_chat_yes');
	chat_no_node = document.getElementById('srl_chat_no');
	close_node = document.getElementById('srl_close');
	draggable_node = document.getElementById('srl_draggable');
	draggable_node.onmousedown = drag_start;
	document.body.onmouseup = drag_end;
	document.body.onmousemove = drag_perform;
	racetitle_node = document.getElementById('srl_racetitle');
	loading_node = document.getElementById('srl_loading');
	racegoal_node = document.getElementById('srl_racegoal');
	entrants_n_node = document.getElementById('srl_entrants_n');
	multitwitch_node = document.getElementById('srl_multitwitch');
	racepage_node = document.getElementById('srl_racepage');
	racestatus_node = document.getElementById('srl_racestatus');
	entrants_node = document.getElementById('srl_entrants');
	postgoal_node = document.getElementById('srl_post_goal');
	postmulti_node = document.getElementById('srl_post_multitwitch');
	postrace_node = document.getElementById('srl_post_racepage');
	racecontent_node = document.getElementById('srl_race_content');
	message_node = document.getElementById('srl_comment_message');
	advertise_node = document.getElementById('srl_advertise');
	postgoal_node.addEventListener('click', event_post_goal, false);
	postmulti_node.addEventListener('click', event_post_multitwitch, false);
	postrace_node.addEventListener('click', event_post_racepage, false);
	advertise_node.addEventListener('click', advertise_script, false);
	chat_yes_node.addEventListener('click', chat_confirm, false);
	chat_no_node.addEventListener('click', chat_decline, false);
	close_node.addEventListener('click', hide_menu, false);
	get_srl_data();
	refreshtimer = setInterval(get_srl_data, 180000);
}

function srl_button_action() {
	if (window_node.style.display == 'none') {
		show_menu();
		get_srl_data();
	} else
		hide_menu();
}

function show_menu() {
	chat_decline();
	dragx = 0;
	dragy = 0;
	if (race === null)
		racetitle_node.innerHTML = 'Loading';
	window_node.style.display = 'block';
	position_menu();
	if (refreshtimer !== null) {
		window.clearInterval(refreshtimer);
		refreshtimer = null;
	}
	if (updatetimer != null)
		window.clearInterval(updatetimer);
	updatetimer = setInterval(get_srl_data, 30000);
}

function hide_menu() {
	chat_decline();
	if (page_type == 'channel')
		if (dragstarted == true) {
			inside_family_node.appendChild(window_node);
			inside_family_node.appendChild(comment_node);
			outside_family_node.innerHTML = '';
		}
	dragging = false;
	dragstarted = false;
	window_node.style.display = 'none';
	if (updatetimer !== null) {
		window.clearInterval(updatetimer);
		updatetimer = null;
	}
	if (racetimetimer !== null) {
		window.clearInterval(racetimetimer);
		racetimetimer = null;
	}
	if (refreshtimer != null)
		window.clearInterval(refreshtimer);
	refreshtimer = setInterval(get_srl_data, 180000);
}

function hover_on(id) {
	var node = hoverNode[id];
	message_node.innerHTML = node.getAttribute("comment");
	if (document.getElementById('srl_comment') == null) {
		if (dragstarted)
			outside_family_node.appendChild(comment_node);
		else
			inside_family_node.appendChild(comment_node);
	}
	comment_node.style.display = 'inline-block';
	comment_node.style.top = parseInt(window_node.style.top) + node.offsetTop - comment_node.offsetHeight + 20 - node.offsetHeight + 'px';
	comment_node.style.left = parseInt(window_node.style.left) + node.offsetLeft + 5 + 'px';
}

function hover_off() {
	comment_node.style.display = 'none';
}

function position_menu() {
	switch (page_type) {
		case 'channel':
			if (dragstarted) {
				window_node.style.top = dragsy + dragy + 'px';
				//below
				window_node.style.left = dragsx + dragx + 'px';
			} else {
				window_node.style.top =
					/*dragy+*/
					button_node.clientHeight + 7 + button_node.clientTop + button_node.offsetTop + 'px';
				//below
				window_node.style.left =
					/*dragx+*/
					button_node.offsetLeft + 'px';
			}
			break;
		case 'dashboard':
			window_node.style.top = dragy + button_node.clientHeight + 7 + button_node.clientTop + button_node.offsetTop + 'px';
			//below
			window_node.style.left = dragx + button_node.offsetLeft + 'px';
		default:
			break;
	}
}

function verify_page() {
	switch (page_type) {
		case 'channel':
			return (document.title == streamer + ' - Twitch');
			break;
		case 'dashboard':
			return (document.title == streamer + "s Dashboard - Twitch");
		default:
			return false;
	}
}

function load_race() {
	racetitle_node.innerHTML = race.game.name;
	var urlgoal = false;
	var goalresult = '';
	if (typeof(race.goal) !== 'undefined') {
		var goaltext = race.goal.split(' ');
		for (i = 0; i < goaltext.length; i++) {
			if (probablyALink(goaltext[i])) {
				goaltext[i] = decodeURI(goaltext[i]);
				goalresult += '<a class="new" href="' + goaltext[i] + '" target="_blank">' + goaltext[i] + '</a> ';
				urlgoal = true;
			} else
				goalresult += goaltext[i] + ' ';
		}
	}
	racegoal_node.innerHTML = goalresult;
	//if (urlgoal==true)
	postgoal_node.style.display = 'inline';
	//always enabled
	//else
	//postgoal_node.style.display="none";
	var multitwitchurl = generate_multitwitch(race.entrants);
	if (multitwitchurl === null) {
		multitwitch_node.style.display = 'none';
		postmulti_node.style.display = 'none';
	} else {
		multitwitch_node.href = multitwitchurl;
		multitwitch_node.style.display = 'inline';
		postmulti_node.style.display = 'inline-block';
	}
	racepage_node.href = 'http://speedrunslive.com/race/?id=' + race.id;
	switch (race.state) {
		case 3:
			racetime = new Date().getTime() / 1000 - race.time;
			srl_racestatus.innerHTML = make_time(racetime);
			if (racetimetimer != null)
				window.clearInterval(racetimetimer);
			if (race.state == 3)
				//run timer if in progress
				racetimetimer = setInterval(update_racetime, 1000);
			break;
		case 4:
		case 5:
			if (racetimetimer != null)
				window.clearInterval(racetimetimer);
			srl_racestatus.innerHTML = 'Race over';
			break;
		case 1:
			//Entry Open
			if (racetimetimer != null)
				window.clearInterval(racetimetimer);
			srl_racestatus.innerHTML = 'Not yet started';
			break;
		default:
			if (racetimetimer != null)
				window.clearInterval(racetimetimer);
			srl_racestatus.innerHTML = race.statetext;
			break;
	}

	hoverNode = Array();
	hoverElements = 0;

	entrants_node.innerHTML = '';
	var entrants_n = 0;
	var nEntrants = objLength(race.entrants);
	for (i in race.entrants) {
		entrants_n++;
		if (race.entrants[i].time > 0)
			//finished
			entrants_node.innerHTML += '<label style="margin-bottom:0px;z-index:-100;opacity:0.4;position:absolute;width:100%;text-align:center;display:inline;">' + finishPlace(race.entrants[i].place) + '</label>'
		var node = document.createElement('label');
		switch (race.entrants[i].place) {
			case 1:
				node.style.backgroundColor = 'rgba(255,255,0,.2)';
				break;
			case 2:
				node.style.backgroundColor = 'rgba(128,128,128,.2)';
				break;
			case 3:
				node.style.backgroundColor = 'rgba(210,100,0,.2)';
				break;
			default:
				break;
		}
		node.style.padding = '0px 5px';
		if (race.entrants[i] == entrant)
			node.style.textDecoration = 'underline';
		node.style.borderTop = '1px solid rgba(128,128,128,0.085)';
		node.style.marginBottom = '0px';
		var inner_html = '';
		if (race.entrants[i].twitch != '' && race.entrants[i].twitch.toLowerCase() != channel)
			inner_html += '<a class="new" style="" target="_blank" href="http://www.twitch.tv/' + race.entrants[i].twitch + '">' + race.entrants[i].displayname + '</a>';
		else
			inner_html += race.entrants[i].displayname;
		if (entrants_n < nEntrants)
			inner_html += '<span class="srl_comma">,&nbsp;</span>';
		inner_html += '<div style="float:right;">';

		if (race.entrants[i].message !== null && race.entrants[i].message !== '') {
			node.setAttribute("comment", race.entrants[i].message);
			node.className = "srl_commented";
			addComment(node);
		}

		switch (race.entrants[i].time) {
			case -1:
				//forfeit
				inner_html += 'Forfeit';
				break;
			case -3:
				//in progress
				break;
			case 0:
				//not in progress
				break;
			default:
				if (race.entrants[i].time > 0) //finished
					inner_html += make_time(race.entrants[i].time);
				break;
		}
		inner_html += '</div></div>\n';
		node.innerHTML = inner_html;
		entrants_node.appendChild(node);
	}
	entrants_n_node.innerHTML = entrants_n + (entrants_n == 1 ? ' entrant' : ' entrants');
	position_menu();
}

function update_racetime() {
	racetime++;
	srl_racestatus.innerHTML = make_time(racetime);
}

function event_post_goal() {
	chat_ask_confirm('Post race goal in the chat?', 'Race goal: ' + race.goal);
}

function event_post_multitwitch() {
	chat_ask_confirm('Post Multitwitch in the chat?', multitwitch_node.href);
}

function event_post_racepage() {
	chat_ask_confirm('Post SRL page in the chat?', racepage_node.href);
}

function advertise_script() {
	chat_ask_confirm('Post download link in the chat?', 'SRL race plugin for twitch: Firefox http://bombch.us/wIB, Chrome http://bombch.us/U-d');
}

function get_page() {
	if (document.title.indexOf("'") != -1)
		return 'dashboard';
	else
	if (document.title.indexOf(' ') != -1)
		return 'channel';
	else
		return null;
}

function get_srl_data() {
	if (request_in_progress == true)
		return;
	request_in_progress = true;
	loading_node.style.display = 'inline';
	pageRequest = new XMLHttpRequest();
	pageRequest.onreadystatechange = function() {
		if (pageRequest.readyState == 4 && pageRequest.status == 200) {
			request_in_progress = false;
			var srl = JSON && JSON.parse(pageRequest.responseText) || $.parseJSON(pageRequest.responseText);
			race = null;
			if (srl.count > 0) {
				var race_priority = -1;
				//any race found will do
				for (var i = 0; i < srl.races.length; i++) {
					for (j in srl.races[i].entrants) {
						if (srl.races[i].entrants[j].twitch.toLowerCase() == channel)
						//streamer found in a race
						{
							switch (srl.races[i].entrants[j].time) {
								case 0:
									//race not started
									if (race_priority < 4 && srl.races[i].goal !== '' || race_priority == -1) {
										race = srl.races[i];
										race_priority = 4;
										entrant = srl.races[i].entrants[j];
									}
									break;
								case -3:
									//in progress
									if (race_priority < 3 && srl.races[i].goal !== '' || race_priority == -1) {
										race = srl.races[i];
										race_priority = 3;
										entrant = srl.races[i].entrants[j];
									}
									break;
								case -1:
									//forfeit
									if (race_priority < 1 && srl.races[i].goal !== '' || race_priority == -1) {
										race = srl.races[i];
										race_priority = 1;
										entrant = srl.races[i].entrants[j];
									}
									break;
								default:
									//finished
									if (srl.races[i].entrants[j].time > 0)
										//finished
										if (race_priority < 2 && srl.races[i].goal !== '' || race_priority == -1) {
											race = srl.races[i];
											race_priority = 2;
											entrant = srl.races[i].entrants[j];
										}
									break;
							}
						}
					}
				}
			}
			loading_node.style.display = 'none';
			if (race !== null) {
				button_node.style.opacity = '1.0';
				if (window_node.style.display != 'none') {
					racecontent_node.style.display = 'inline';
					load_race();
				}
			} else {
				button_node.style.opacity = '0.3';
				racetitle_node.innerHTML = 'Not racing.';
				racecontent_node.style.display = 'none';
			}
		}
	}
	pageRequest.open('GET', 'http://api.speedrunslive.com/races', true);
	pageRequest.send();
}

function generate_multitwitch(entrants) {
	var multi = 'http://multitwitch.tv';
	var streamers = 0;
	for (k in entrants) {
		if (entrants[k].twitch !== '') {
			multi += '/' + entrants[k].twitch;
			streamers++;
		}
	}
	if (streamers > 1)
		return multi;
	return null;
}

function chat_ask_confirm(question, chttxt) {
	chatconfirm = chttxt;
	chat_confirm_text_node.innerHTML = question;
	window_content_node.style.visibility = 'hidden';
	chat_confirm_node.style.display = 'block';
}

function chat_confirm() {
	post_in_chat(chatconfirm);
	chat_confirm_node.style.display = 'none';
	window_content_node.style.visibility = 'visible';
}

function chat_decline() {
	chat_confirm_node.style.display = 'none';
	window_content_node.style.visibility = 'visible';
}

function post_in_chat(text) {
	var chatDoc = document;
	if (page_type == "dashboard") {
		var chatFrame = document.getElementById("dashboard-chat");
		chatDoc = chatFrame.contentDocument || chatFrame.contentWindow.document;
	}

	if (chatDoc.getElementsByClassName('ember-view loading-mask').length == 0)
	//chat is enabled
	{
		var chatinput = chatDoc.getElementsByClassName('ember-view ember-text-area')[0];
		chatinput.focus();
		var temp = chatinput.value;
		chatinput.value = text;
		chatDoc.getElementsByClassName('send-chat-button')[0].focus();
		chatDoc.getElementsByClassName('send-chat-button')[0].click();
		chatinput.value = temp;
	}
}

function make_time(time) {
	var str = '';
	var hours = Math.floor(time);
	var seconds = hours % 60;
	hours -= seconds;
	var minutes = (hours % 3600) / 60;
	hours -= minutes * 60;
	hours /= 3600;
	if (hours > 0)
		str += hours + ':';
	if (minutes > 0 || hours > 0) {
		if (minutes < 10 && hours > 0)
			str += '0' + minutes + ':';
		else
			str += minutes + ':';
	}
	if (seconds < 10 && (minutes > 0 || hours > 0))
		str += '0' + seconds;
	else
		str += seconds;
	return str;
}

function addEventSimple(obj, event, func) {
	if (obj.addEventListener)
		obj.addEventListener(event, func, false);
	else if (obj.attachEvent)
		obj.attachEvent('on' + event, func);
}

function finishPlace(place) {
	switch (place) {
		case 1:
			return '1st';
		case 2:
			return '2nd';
		case 3:
			return '3rd';
		default:
			return place + 'th';
	}
}

function drag_start(e) {
	if (e.button == 0) {
		if (page_type == 'channel')
			if (dragstarted == false) {
				var bbox = window_node.getBoundingClientRect();
				dragsx = bbox.left;
				dragsy = bbox.top;
				outside_family_node.appendChild(window_node);
				outside_family_node.appendChild(comment_node);
				inside_family_node.innerHTML = '';
			}
		dragging = true;
		dragstarted = true;
		mousex = e.clientX;
		mousey = e.clientY;
		dragposx = e.clientX;
		dragposy = e.clientY;
		position_menu();
	}
}

function drag_end(e) {
	if (e.button == 0) {
		drag_perform(e);
		dragging = false;
	}
}

function drag_perform(e) {
	if (dragging) {
		dragposx = mousex;
		dragposy = mousey;
		mousex = e.clientX;
		mousey = e.clientY;
		dragx += mousex - dragposx;
		dragy += mousey - dragposy;
		position_menu();
		e.preventDefault();
		return false;
	}
}

function probablyALink(text) {
	//protocol
	if (text.indexOf("http://") == 0 || text.indexOf("https://") == 0)
		return 1;

	//check for a dot
	var dot = text.indexOf(".");
	if (dot == -1)
		return 0;
	//check the second part after first dot
	var part2 = text.substr(dot + 1);
	if (part2.indexOf("/") != -1) //has a slash
		return 1;
	var moredot = part2.indexOf("."); //second dot with text after
	if (moredot != -1 && moredot + 1 < part2.length)
		return 1;

	return 0;
}
//add individual comments
function addComment(nd) {
	var id = hoverElements++;
	hoverNode[id] = nd;
	nd.addEventListener("mouseover", function() {
		hover_on(id);
	}, false);
	nd.addEventListener("mouseout", function() {
		hover_off(id);
	}, false);
}

function objLength(obj) {
	var length = 0;
	var key;
	for (key in obj)
		if (obj.hasOwnProperty(key))
			length++;
	return length;
};

function get_style() {
	return "\
	#srl_comment\
	{\
		opacity: 0.8;\
		width: 100%;\
		white-space: normal;\
	}\
	#srl\
	{\
		position: absolute;\
		z-index: 5444333 !important;\
		outline: medium none;\
		width: 320px;\
		padding: 0px;\
		overflow: hidden;\
	}\
	#srl label\
	{\
		margin-bottom: 0px;\
		padding: 0px 5px;\
	}\
	#srl_window_content\
	{\
		min-height: 70px;\
	}\
	#srl_draggable\
	{\
		padding: 5px 5px;\
		cursor: move;\
		webkit-touch-callout: none;\
		-webkit-user-select: none;\
		-khtml-user-select: none;\
		-moz-user-select: none;\
		-ms-user-select: none;\
		user-select: none;\
	}\
	.srl_titlecontainer\
	{\
		padding: 0px;\
		font-weight: bold;\
    margin-right: 15px;\
	}\
  #srl_close\
    {\
    float: right;\
    width: 15px;\
    height: 15px;\
    margin-right: -18px;\
    font-size: 20px;\
    line-height: 13px;\
    cursor: pointer;\
  }\
	#srl_racetitle\
	{\
		display: inline-block;\
		cursor: move;\
		margin-bottom: 0px;\
		padding: 0px;\
		font-size: 13px;\
	}\
	#srl_loading\
	{\
		float: right;\
    position: absolute;\
    right: 2px;\
    top: 24px;\
	}\
	#srl_race_content\
	{\
		display: none;\
	}\
	.srl_postgoal\
	{\
		border-bottom: 1px solid rgba(128, 128, 128, 0.3);\
    margin-right: 20px;\
	}\
	.srl_post, .srl_post_left\
	{\
		width: 14px;\
		height: 11px;\
		background-color: #000;\
		background-position: -2px -4px;\
		cursor: pointer;\
		display: inline-block;\
		margin: 3px 3px 0px 0px;\
		float:left;\
	}\
	.srl_post_left\
	{\
		margin: 3px 0px 0px 3px;\
	}\
	.srl_n_and_entrants\
	{\
		border-bottom: 1px solid rgba(128, 128, 128, 0.3);\
		padding-top: 2px;\
	}\
	#srl_racestatus\
	{\
		padding: 0px;\
		display: inline;\
	}\
	#srl_entrants_n\
	{\
		max-height: 380px;\
		overflow-y: auto;\
		float: right;\
	}\
	#srl_entrants\
	{\
		padding: 2px 0px;\
	}\
	.srl_post_links\
	{\
		padding: 5px 5px 0px 5px;\
	}\
	#srl_post_multitwitch\
	{\
		float: left;\
	}\
	#srl_post_racepage\
	{\
		float: right;\
	}\
	#srl_multitwitch\
	{\
		padding-top: 0px;\
		padding-bottom: 0px;\
		cursor: pointer;\
	}\
	#srl_racepage\
	{\
		padding-top: 0px;\
		padding-bottom: 0px;\
		cursor: pointer;\
		/*width: 100%;*/\
		float: right;\
	}\
	.srl_advertise_container\
	{\
		width: 100%;\
		text-align: center;\
		padding-bottom: 5px;\
	}\
	#srl_advertise\
	{\
		cursor: pointer;\
		padding: 0px 10px;\
	}\
	#srl_chat_confirm\
	{\
		display: none;\
		position: absolute;\
		width: 100%;\
		text-align: center;\
		height: 70px;\
		bottom: 50%;\
		margin-bottom: -35px;\
	}\
	#srl_chat_confirm_text\
	{\
		margin-bottom: 15px;\
	}\
	#srl_chat_yes\
	{\
		position: absolute;\
		margin: 0px;\
		left: 40px;\
	}\
	#srl_chat_no\
	{\
		position: absolute;\
		margin: 0px;\
		right: 40px;\
	}\
	.srl_button\
	{\
		height: 30px;\
		font-weight: bold;\
		float: none;\
		line-height: 24pt;\
		width: 90px;\
	}\
	#bttvDashboard a.new /*because betterttv sucks at this stuff*/\
	{\
		color: #000;\
	}\
	#srl_comment .tipsy-arrow\
	{\
		left: 10px;\
	}\
  .srl_comma\
  {\
      width: 0px;\
      height: 0px;\
      display: inline-block;\
      overflow: hidden;\
	";
}
}

//--- Background Scripts: ---
