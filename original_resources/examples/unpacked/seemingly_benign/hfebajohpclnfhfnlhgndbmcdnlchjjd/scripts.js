//--- Content Scripts: ---
// New file: bbprtb.user.js
{
// ==UserScript==
// @name BitBucket Pull Request Toggle Buttons
// @author Gordon Myers
// @version 0.5.1.3
// @match https://bitbucket.org/*/pull-request*
// ==/UserScript==
window.addEventListener('load', function() {
	var buttons = document.getElementById('pullrequest-actions');
	if (!buttons) {
		return;
	}

	var buttonContainer = document.createElement('div');
	buttonContainer.className = 'aui-buttons';
	buttonContainer.style.marginRight = '10px';

	var toggleButton = document.createElement('button');
	toggleButton.className = 'aui-button';
	toggleButton.innerHTML = 'Activate Toggle';
	toggleButton.id = 'fr-toggle-enable';
	buttonContainer.appendChild(toggleButton);

	var whitespaceButton = document.createElement('button');
	whitespaceButton.className = 'aui-button';
	whitespaceButton.id = 'fr-ignore-whitespace';
	var isIgnoringWhitespace = /[?&]w=1/.test(document.location.toString());
	if (isIgnoringWhitespace) {
		whitespaceButton.innerHTML = 'Show Spacing';
	} else {
		whitespaceButton.innerHTML = 'Ignore Spacing';
	}
	buttonContainer.appendChild(whitespaceButton);

	buttons.insertBefore(buttonContainer, buttons.childNodes[0]);

	toggleButton.addEventListener('click', function() {
		var containers = document.getElementsByClassName('diff-container');
		for (var i = 0; i < containers.length; i++) {
			var container = containers[i];
			var content = container.getElementsByClassName('refract-container');
			if (content.length == 0) {
				content = container.getElementsByClassName('diff-note');
			}
			if (content.length == 0) {
				content = container.getElementsByClassName('content-container');
			}
			var actions = container.getElementsByClassName('diff-actions');
			if (actions[0] && content[0]) {
				var toggle = document.createElement('div');
				toggle.className = 'aui-buttons';
				toggle.innerHTML = '<button class="aui-button aui-button-light fr-toggle-button">Toggle</button>';
				actions[0].insertBefore(toggle, actions[0].childNodes[0]);
				toggle.addEventListener('click', function(evt) {
					evt = evt || window.event;
					var container = evt.srcElement || evt.target;
					while (!~container.className.indexOf('diff-container')) {
						container = container.parentNode;
						if (container.nodeType != 1) return;
					}
					var content = container.getElementsByClassName('refract-container');
					if (content.length == 0) {
						content = container.getElementsByClassName('diff-note');
					}
					if (content.length == 0) {
						content = container.getElementsByClassName('content-container');
					}
					content[0].style.display = (content[0].style.display == 'none') ? '' : 'none';
				});
			}
		}

		var button = document.getElementById('fr-toggle-enable');
		if (button) {
			var buttonContainer = button.parentNode;
			if (buttonContainer.children.length == 1) {
				buttonContainer.parentNode.removeChild(buttonContainer);
			} else {
				buttonContainer.removeChild(button);
			}
		}
	});

	whitespaceButton.addEventListener('click', function() {
		var url = document.location.toString();
		var hashPosition = url.indexOf('#');
		var before = url;
		var after = "";
		var newUrl = url;
		if (hashPosition > -1) {
			var remaining = url.length - hashPosition;
			before = url.substr(0, hashPosition);
			after = url.substr(hashPosition, remaining);
		}
		var queryPosition = before.indexOf('?');
		if (isIgnoringWhitespace && queryPosition > -1) {
			// get all the parameters
			var params = before.slice(queryPosition + 1).split('&');
			var paramsWithoutW1 = params.filter(function(param) {
				return param != 'w=1';
			});
			newUrl = before.slice(0, queryPosition + 1) + paramsWithoutW1.join('&');
		} else {
			if (queryPosition > -1) {
				before += '&w=1';
			} else {
				before += '?w=1';
			}
			newUrl = before + after;
		}
		document.location = newUrl;
	});
}, false);
}

//--- Background Scripts: ---
