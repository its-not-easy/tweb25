//--- Content Scripts: ---
// New file: Site.js
{
function loggedIn() {
	return document.cookie.match(/session-username=([A-Za-z0-9._-]+)/);
}

function getCSRFToken() {
	var match = document.cookie.match(/csrf-token=([^ ;]+)/);
	if (match) {
		return match[1];
	} else {
		return "invalid";
	}
}
}
// New file: TMLive.js
{
docloaded();
var ChkTimer;
var ChkRecap;
var ChkAddPromoteButton;
var CurrGame = new Object();

function docloaded() {
	YourTurns();
	//window.clearInterval(ChkTimer);
	ChkTimer = setInterval(YourTurns, 1000 * 60);
	ChkRecap = setInterval(Recap, 750);
	ChkAddPromoteButton = setInterval(AddPromoteButton, 900);
} // end - function docloaded
function PromotePlan() {
	console.log('promoting plan');
	var planLines = $('textarea#planning_entry_input').val().split('\n');
	var gotMove = false;
	var plan = "";
	var move = "";
	for (var planLine in planLines) {
		if (planLine > 0) {
			plan += "\n";
		}
		var Line = planLines[planLine];
		if (gotMove) {
			plan += Line;
		} else {
			if (Line.trim().length > 0 && Line.trim().substr(0, 1) != "#") {
				gotMove = true;
				move = Line;
				plan += "#^ " + Line;
			} else {
				plan += Line;
			}
		}
	}
	if (gotMove) {
		$('textarea#planning_entry_input').val(plan);
		var CurrMove = $('textarea#move_entry_input').val();
		if (CurrMove.trim() != "") {
			move = CurrMove + "\n" + move;
		}
		$('textarea#move_entry_input').val(move);
	}
}

function YourTurns() {
	if (loggedIn() &&
		/https:\/\/terra.snellman.net\/(faction|game)\//.test(location.href)) {
		$.post("/app/list-games/", {
				"mode": "user",
				"status": "running",
				"args": null,
				"csrf-token": getCSRFToken()
			},
			function(resp) {
				//var resp = transport.responseText.evalJSON();
				try {
					if (!resp.error || !resp.error.length) {
						DispGameSum(resp.games);
						if (sessionStorage.GoingToGame == "true") {
							ShowGoButton();
						} else {
							var GoingToGame = false;
							// for (var gi in resp.games) {
							for (var gi = resp.games.length - 1; gi >= 0; gi--) {
								var g = resp.games[gi];
								if (g.id != null && !g.finished) {
									var WhoseTurn = g.waiting_for;
									if (g.action_required) {
										WhoseTurn = "Your";
									}
									if (g.unread_chat_messages > 0) {

									}
									//console.log(gi.toString() + " " + g.id + ": " + WhoseTurn + " turn. " + g.role + " rule! Round: " + g.round + ", Last Turn: " + HowLong(g.seconds_since_update));
									if (!GoingToGame && g.action_required) {
										GoingToGame = true;
										window.clearInterval(ChkTimer);
										var OldTitle = document.title;
										var NotifyText = g.id + ": Go " + g.role;
										document.title = NotifyText + "\n" + HowLong(g.seconds_since_update);
										// if (sessionStorage.GoingToGame == "true") {
										// ShowGoButton();
										// } else {
										if (confirm(NotifyText)) {
											GoToGame(g.link);
										} else {
											sessionStorage.GoingToGame = "true";
											ChkTimer = setInterval(YourTurns, 1000 * 60);
											ShowGoButton();
										}
										// }
										document.title = OldTitle;
									}
								}
							}
						}
						//console.log (resp.games);
					} else {
						// $(div).update(resp.error.join(', '));
						console.log(resp.error.join(', '));
					}
				} catch (e) {
					// handleException(e);				
					//console.log (resp.error.join(', '));
					console.log(e.message);
				};
			}
		)
	}
}

function HistView() {
	if (ViewingHistory()) {
		if (sessionStorage.HaveGameHist != null &&
			sessionStorage.HaveGameHist == $('div#header-gamename').text()) {
			ReverseCap();
			HistButtons();
			$('table#recap').hide();
		} else {
			sessionStorage.CurrRow = parseInt(/\/max-row=([0-9]*)$/.exec(location.href)[1]).toString();
			sessionStorage.LoadHistStep = "1";
			location.href = /(^.*)\/max-row=[0-9]*$/.exec(location.href)[1];
		}
	} else {
		if (sessionStorage.LoadHistStep == "1") {
			$('table#ledger button').click();
			CopyLedgerTable();
			sessionStorage.HaveGameHist = $('div#header-gamename').text();
			sessionStorage.LoadHistStep = "2";
			location.href = location.href + "/max-row=" + sessionStorage.CurrRow;
		}
		// $('table#ledger button').click();
		if ($('table#ledger button').text() != "Load full log") {
			CopyLedgerTable();
		}
	}
}

function ViewingHistory() {
	return /\/max-row=[0-9]*$/.test(location.href);
}
var CurrRow;

function HistButtons() {
	$('div#header-gamename').css('padding-left', '50px');
	CurrRow = parseInt(/\/max-row=([0-9]*)$/.exec(location.href)[1]);
	var PrevRow = CurrRow - 1;
	var NextRow = CurrRow + 1;
	$('div#header-gamename').after(
		$('<div>').addClass('btn-group HistNav').attr('role', 'group').attr('aria-label', 'HistNav')
		.append($('<a>').addClass('btn btn-default').attr('role', 'button').html('&#8810;')
			//.attr('href',HistLink(PrevRow)))
			.click(TurnPrev))
		.append($('<a>').addClass('btn btn-default').attr('role', 'button').html('&#8635;')
			// .attr('href',HistLink(NextRow)))
			.click(TurnUpdate))
		.append($('<a>').addClass('btn btn-default').attr('role', 'button').html('&#8811;')
			// .attr('href',HistLink(NextRow)))
			.click(TurnNext))
		//.click(HistLink(NextRow)))
	)
}

function TurnPrev() {
	if (CurrRow > 1) {
		CurrRow--;
		RemoveRow();
	}
}

function TurnNext() {
	AddRow(CurrRow);
	CurrRow++;
}

function TurnUpdate() {
	location.href = HistLink(CurrRow);
}

function HistLink(Row) {
	return /(^.*\/max-row=)[0-9]*$/.exec(location.href)[1] + Row.toString();
	//location.href = /(^.*\/max-row=)[0-9]*$/.exec(location.href)[1] + Row.toString();
}

function GoToGame(game) {
	sessionStorage.GoingToGame = "true";
	//document.location = "https://terra.snellman.net" + g.link; // + "#";	
	document.location = "https://terra.snellman.net" + game; // + "#";	
}

function GoToGameBtn(Btn) {
	var game = Btn.siblings('input.GameLink').val();
	GoToGame(game);
}

function DispGameSum(games) {
	if ($('div#GameSum').length == 0) {
		$('div#header').before($('<div>').attr('id', 'GameSum'));
	}
	if (!ViewingHistory()) {
		$('div#GameSum').css('display', 'block');
	}
	var GameSumTable = $('<table>').append(
		$('<tr>').append($('<td>').text("Game"))
		.append($('<td>').text("Whose Turn"))
		.append($('<td>').text("Your Role"))
		.append($('<td>').text("Round"))
		.append($('<td>').text("Last Turn"))
	);
	var NoActionsReq = true;
	CurrGame.id = $('div#header-gamename').text();
	// for (var gi in games) {
	for (var gi = games.length - 1; gi >= 0; gi--) {
		var g = games[gi];
		if (g.id != null && !g.finished) {
			var WhoseTurn = g.waiting_for;
			if (g.action_required) {
				WhoseTurn = "Your";
				NoActionsReq = false;
			}
			var ft = FactionTrait(g.role);
			var Newrow = $('<tr>') //.append($('<td>').append($('<a>').attr('href',"javascript:GoToGame('" + g.link + "')").text(g.id)))
				.append($('<td>').append($('<input>').attr('type', 'button').addClass('btn').click(function() {
						GoToGameBtn($(this))
					}).val(g.id))
					.append($('<input>').attr('type', 'hidden').addClass('GameLink').val(g.link))
				)
				// .append($('<td>').append($('<a>').attr('href',"https://terra.snellman.net" + g.link).text(g.id)))
				.append($('<td>').text(WhoseTurn))
				.append($('<td>').text(g.role).css('padding', '0 10px')
					.css('backgroundColor', ft.ColorCode)
					.css('color', ft.TextColor))
				.append($('<td>').text(g.round))
				.append($('<td>').text(HowLong(g.seconds_since_update)));
			if (g.unread_chat_messages > 0) {
				Newrow.addClass("UnreadChats");
				Newrow.append($('<td>').append($('<img>').attr('src', chrome.extension.getURL('images/glyphicons-11-envelope.png'))));
			}
			if (g.id == CurrGame.id) {
				CurrGame.role = g.role;
				CurrGame.color = $('div.faction-board:eq(0) div div').css('background-color');
				Newrow.css('backgroundColor', 'buttonface');
				if (ft.PageColor != null && !ViewingHistory()) {
					$('body#root').css('background-color', YourRace(ft.PageColor, CurrGame.color));
				}
				CurrGame.Favs = [];
				$('div.faction-board:eq(0) div.favor').each(function() {
					CurrGame.Favs.push($(this).children('span:eq(0)').text())
				});
				FavorPoolDim();
			}
			if (g.action_required) {
				Newrow.children('td:eq(0)').children('input:eq(0)').css('backgroundColor', ft.ColorCode)
					.css('color', ft.TextColor);
				// Newrow.children('td:eq(1)').css('backgroundColor', ft.ColorCode)
				// .css('color',ft.TextColor);
				if (gi < games.length - 1 && !games[gi + 1].action_required) {
					GameSumTable.append(
						$('<tr>').append($('<td>').attr('colspan', '5').append($('<hr>')))
					);
				}
			}
			GameSumTable.append(Newrow);
		}
	}
	$('div#GameSum').html("").append(GameSumTable);
	if (NoActionsReq) {
		sessionStorage.GoingToGame = "nope";
	}
}

function YourRace(PageColor, CurrGameColor) {
	var _ret = PageColor;
	switch (CurrGameColor) {
		case "rgb(160, 96, 64)": // brown
			_ret = "#fd8";
			break;
		case "rgb(224, 224, 64)": //yellow
			_ret = "#ffb";
			break;
		case "rgb(224, 64, 64)": // red
			_ret = "#fcc";
			break;
		case "rgb(64, 160, 64)": // green: '#40a040',
			_ret = "#cfc";
			break;
		case "rgb(32, 128, 240)": // blue: '#2080f0',
			_ret = "#ccf";
			break;
		case "rgb(0, 0, 0)": // black: '#000000',
			_ret = "#ccc";
			break;
		case "rgb(255, 255, 255)": // white: '#ffffff',
			_ret = "aliceblue";
			break;
		case "rgb(128, 128, 128)": // gray: '#808080',
			_ret = "#ccc";
			break;
		case "rgb(240, 248, 255)": //  ice: '#f0f8ff',
			_ret = "aliceblue";
			break;
		case "rgb(240, 160, 32)": // volcano: '#f0a020',
			_ret = "#fc4";
			break;
		case "rgb(240, 192, 64)": // orange: '#f0c040'
			_ret = "aliceblue";
			break;
		case "rgb(192, 192, 192)": // player: '#c0c0c0',
			_ret = "aliceblue";
			break;
		case "rgb(136, 255, 136)": // activeUI: '#8f8'
			_ret = "aliceblue";
			break;
	}
	return _ret;
}
var FactionTraits = [{
		Faction: "alchimists",
		Color: "black"
	},
	{
		Faction: "darklings",
		Color: "black"
	},
	{
		Faction: "mermaids",
		Color: "blue"
	},
	{
		Faction: "swarmlings",
		Color: "blue"
	},
	{
		Faction: "cultists",
		Color: "brown"
	},
	{
		Faction: "halflings",
		Color: "brown"
	},
	{
		Faction: "auren",
		Color: "green"
	},
	{
		Faction: "witches",
		Color: "green"
	},
	{
		Faction: "dwarfs",
		Color: "gray"
	},
	{
		Faction: "dwarves",
		Color: "gray"
	},
	{
		Faction: "engineers",
		Color: "gray"
	},
	{
		Faction: "chaosmagicians",
		Color: "red"
	},
	{
		Faction: "giants",
		Color: "red"
	},
	{
		Faction: "fakirs",
		Color: "yellow"
	},
	{
		Faction: "nomads",
		Color: "yellow"
	},
	{
		Faction: "icemaidens",
		Color: "white"
	},
	{
		Faction: "yetis",
		Color: "white"
	},
	{
		Faction: "acolytes",
		Color: "white"
	},
	{
		Faction: "dragonlords",
		Color: "white"
	},
	{
		Faction: "riverwalkers",
		Color: "white"
	},
	{
		Faction: "shapeshifters",
		Color: "white"
	},
	{
		Faction: "default",
		Color: "orange"
	}
];

function FactionTrait(faction) {
	var _ret = null;
	for (var fi in FactionTraits) {
		var f = FactionTraits[fi];
		if (f.Faction == faction) {
			_ret = f;
		}
		if (f.Faction == "default" && _ret == null) {
			_ret = f;
		}
	}
	if (_ret.Color == "white" || _ret.Color == "orange" || _ret.Color == "yellow") {
		_ret.TextColor = "black";
	} else {
		_ret.TextColor = "white";
	}
	_ret.ColorCode = _ret.Color;
	if (_ret.Color == "white") {
		_ret.ColorCode = "#95fbff";
	}
	if (_ret.Color == "brown") {
		_ret.ColorCode = "#a5572a";
	}
	switch (_ret.Color) {
		case "yellow":
			_ret.PageColor = "#ffb";
			break;
		case "brown":
			_ret.PageColor = "#fd8";
			break;
		case "red":
			_ret.PageColor = "#fcc";
			break;
		case "blue":
			_ret.PageColor = "#ccf";
			break;
		case "green":
			_ret.PageColor = "#cfc";
			break;
		case "black":
			_ret.PageColor = "#ccc";
			break;
		case "gray":
			_ret.PageColor = "#ccc";
			break;
		case "white":
			_ret.PageColor = "aliceblue";
			break;
	}
	return _ret;
}

function ShowGoButton() {
	if ($('div#GameSum').length == 0) {
		$('div#header').before($('<div>').attr('id', 'GameSum'));
	}
	$('div#GameSum').append(
		$('<input>').attr('type', 'button').addClass('btn btn-lg btn-primary').val('Alert On My Turn').click(GoButtonClicked)
	);
}

function Recap() {
	console.log("recap");
	var RefreshRow = $('table#ledger tr:eq(0)');
	if (!RefreshRow.hasClass('recapped')) {
		console.log("recap1");
		// if (CurrGame.role != null){
		// if ($('div.recap').length == 0){
		// // $('div#factions').before($('<div>').addClass('recap'));
		// $('div#factions div.faction-board:eq(0)').after($('<div>').addClass('recap'));
		// }			
		// }
		var LedgerRowCount = $('table#ledger tr').length;
		if (LedgerRowCount != 0) {
			console.log("recap2");
			RefreshRow.addClass('recapped');
			if (CurrGame.role != null) {
				if ($('div.recap').length == 0) {
					// $('div#factions').before($('<div>').addClass('recap'));
					$('div#factions div.faction-board:eq(0)').after($('<div>').addClass('recap'));
				}
				RecappedLedgerRows = LedgerRowCount;
				var recaptable = $('<table>');
				LastRole = "";
				var MaxRows = 18;
				var RowSelector = "";
				if (LedgerRowCount > MaxRows) {
					RowSelector = ":gt(" + (LedgerRowCount - MaxRows).toString() + ")";
				}
				$('table#ledger tr' + RowSelector).each(function() {
					QuickLookTable(recaptable, $(this), true)
				});
				$('div.recap').html("").append(recaptable.attr('id', 'recap').addClass('recap'));
			}
			HistView();
			clearInterval(ChkRecap);
		}
	}
}
var LastRole = "";

function QuickLookTable(table, row, myrole) {
	if (row.attr('id') != null) {
		table.append(row.clone());
	} else {
		var RowRole = row.children('td:eq(0)').text();
		// console.log(RowRole + " is " + CurrGame.role + "?");
		var RowClone = row.clone();
		if (myrole) {
			if (RowRole != CurrGame.role) {
				if (LastRole == CurrGame.role) {
					table.children('tbody').children('tr.OtherRoles').remove();
				}
				RowClone.addClass('OtherRoles');
			} else {
				var Desc = row.children('td:eq(14)').text();
				if (/^(Leech|Decline)[ ]/.test(Desc)) {
					RowClone.addClass('OtherRoles');
					RowRole = "Leech";
				}
			}
		}
		//RowClone.children('td:eq(13)').after(RowClone.children('td:eq(0)').clone())
		RowClone.children('td:eq(13)').after(RowClone.children('td:eq(0)'))
		table.append(RowClone);
		LastRole = RowRole;
	}
}

function ReverseCap() {
	var RefreshRow = $('table#ledger tr:eq(0)');
	if (!RefreshRow.hasClass('reversecapped')) {
		if ($('div.reversecap').length == 0) {
			$('div#game-root table:eq(0)').after($('<div>').addClass('reversecap'));
		}
		var LedgerRowCount = $('table#ledger tr').length;
		if (LedgerRowCount != 0) {
			RefreshRow.addClass('reversecapped');
			RecappedLedgerRows = LedgerRowCount;
			var recaptable = $('<table>');
			LastRole = "";
			var MaxRows = 10;
			for (var rowno = LedgerRowCount; rowno > LedgerRowCount - MaxRows; rowno--) {
				var LRow = $('table#ledger tr:eq(' + rowno.toString() + ')');
				QuickLookTable(recaptable, LRow, false);
			}
			$('div.reversecap').html("").append(recaptable.attr('id', 'reversecap').addClass('recap'));
		}
	}
}

function AddPromoteButton() {
	if ($('button#planning_entry_action').length > 0) {
		if ($('textarea#move_entry_input').length > 0) {
			$('button#planning_entry_action').parent('div').children('button:eq(1)').after($('<button>').click(PromotePlan).text('Promote Plan'));
		}
		clearInterval(ChkAddPromoteButton);
	}
}

function GoButtonClicked() {
	sessionStorage.GoingToGame = "nope";
	YourTurns();
	//ChkTimer = setInterval(YourTurns, 1000*60);	
}

function HowLong(secs) {
	var _ret = "";
	var days = parseInt(secs / 60 / 60 / 24);
	if (days > 0) {
		_ret = days.toString() + " " + "days, ";
		secs -= (days * 60 * 60 * 24);
	}
	var hrs = parseInt(secs / 60 / 60);
	if (hrs > 0) {
		_ret += hrs.toString() + " " + "hrs, ";
		secs -= (hrs * 60 * 60);
	}
	var mins = parseInt(secs / 60);
	// if (mins > 0) {
	// _ret += mins.toString() + " " + "mins, ";
	// secs -= (mins*60);
	// }
	// var secs = parseInt(secs);
	// _ret += secs.toString() + " " + "secs";
	_ret += mins.toString() + " " + "mins";
	return _ret + " ago.";
}

function LogError(msg) {
	var Errs;
	if (localStorage.Errors == null) {
		Errs = new Array();
	} else {
		Errs = JSON.parse(localStorage.Errors);
	}
	Errs.push({
		Occurred: new Date(),
		Message: msg
	});
	localStorage.Errors = JSON.stringify(Errs);
}

function MenuDisp() {
	return $('<div></div>').css('position', 'absolute').css('z-index', 100)
		.append(
			$('<button></button').attr('id', 'MenuDisp')
			.click(PauseExt)
			.html("Pause Message <br/>Emailing Extention")
			.css('font-size', '24px')
			.css('padding', '13px')
		)
}

function GetChromeStorageString(Name, GotIt) {
	chrome.storage.sync.get(
		Name,
		function(ret) {
			if (ret[Name] == null) {
				GotIt("");
			} else {
				GotIt(ret[Name]);
			}
		}
	);
}

function CopyLedgerTable() {
	var myRows = [];
	var $rows = $("table#ledger tr").each(function(row) {
		var myCols = [];
		$(this).children("td").each(function(col) {
			var ci = {
				Text: $(this).html()
			};
			var bk = $(this).css('background-color');
			if (bk != "rgba(0, 0, 0, 0)") {
				ci.bk = bk;
				ci.c = $(this).css('color');
			}
			if ($(this).hasClass('ledger-delta')) {
				ci.class = "ledger-delta";
			}
			if ($(this).hasClass('ledger-value')) {
				ci.class = "ledger-value";
			}
			myCols.push(ci);
		})
		myRows.push(myCols);
	});
	sessionStorage.Ledger = JSON.stringify(myRows);
}
var LedgerRows;
if (sessionStorage.Ledger != null) {
	LedgerRows = JSON.parse(sessionStorage.Ledger);
}

function RemoveRow() {
	$('table#reversecap tr:eq(0)').remove();
}

function AddRow(row) {
	if (LedgerRows != null &&
		LedgerRows.length > row) {
		var Row = LedgerRows[row - 1];
		var tr = $('<tr>');
		for (var c in Row) {
			var Col = Row[c];
			var td = $('<td>').html(Col.Text);
			td.addClass(Col.class);
			if (Col.bk != null) {
				td.css('background-color', Col.bk);
			}
			if (Col.c != null) {
				td.css('color', Col.c);
			}
			tr.append(td);
		}
		tr.children('td:eq(13)').after(tr.children('td:eq(0)'))
		$('table#reversecap').prepend(tr);
	}
}

function FavorPoolDim() {
	if (CurrGame.Favs != null) {
		$('div.pool div.favor').each(function() {
			var fav = $(this).children('span:eq(0)').text();
			if ($.inArray(fav, CurrGame.Favs) > -1) {
				$(this).css('opacity', .5);
			}
		})
	}
}
}

//--- Background Scripts: ---
