//--- Content Scripts: ---
// New file: content.js
{
function findQuestionLink() {
	const link = document.querySelector('[data-test="breadcrumb-question"]');
	return link;
}

function createBanner(link) {
	const banner = document.createElement('div');
	if (document.documentElement.innerHTML.indexOf('uuid":"') >= 0 && document.documentElement.innerHTML.split('uuid":"')[1].split('"')[0].split("-").length > 1)
		n = document.documentElement.innerHTML.split('uuid":"')[1].split('"')[0];
	else if (document.documentElement.innerHTML.indexOf('pageNameDetailed":"') >= 0 && document.documentElement.innerHTML.split('pageNameDetailed":"')[1].split('"')[0].split("-").length > 1)
		n = document.documentElement.innerHTML.split('pageNameDetailed":"')[1].split('"')[0];
	else
		n = ""
	banner.id = 'question-banner';

	if (link) {
		banner.innerHTML = `<a href="${link.href}">Question Link: ${link.href}</a><br>Question UUID: ${n}`;
		var toolbarHeight = 100;
	} else {
		banner.innerHTML = 'Error: Question link not found.';
		banner.style.color = 'red';
		var toolbarHeight = 50;
	}
	var st = banner.style;
	st.top = "0px";
	st.left = "0px";
	st.width = "100%";
	st.height = toolbarHeight + "px";
	st.background = "#C2E2FF";
	st.color = "red";
	st.fontStyle = "blod";
	st.fontSize = "20px"
	st.position = "fixed";
	st.border = "2px solid lightblue";
	st.padding = "10px 0";
	document.documentElement.appendChild(banner);
	document.body.style.webkitTransform = "translateY(" + toolbarHeight + "px)";

	return banner;
}


function applyStyles() {
	const banner = document.getElementById('question-banner');
	banner.classList.add('question-banner');
}

function init() {
	const link = findQuestionLink();
	const banner = createBanner(link);
	applyStyles();
}

if (window.location.href.startsWith('https://www.chegg.com')) {
	init();
}
}

//--- Background Scripts: ---
