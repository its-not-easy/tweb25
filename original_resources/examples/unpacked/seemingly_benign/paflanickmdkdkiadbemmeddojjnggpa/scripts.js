//--- Content Scripts: ---
// New file: content.js
{
function addFocusListener(element) {
	element.addEventListener('input', onTextAreaFocus);
}

function handleNewNode(node) {
	if (!(node instanceof HTMLElement)) return;

	var textareaSelectors = 'textarea, div[contenteditable="true"][role="textbox"], div[g_editable="true"][role="textbox"][contenteditable="true"], [data-text="true"], .CodeMirror-code, [data-lexical-text="true"]';

	if (node.matches(textareaSelectors)) {
		addFocusListener(node);
	} else {
		var textareas = node.querySelectorAll(textareaSelectors);
		textareas.forEach(addFocusListener);
	}

	if (node.matches('iframe')) {
		try {
			var iframeTextareas = node.contentWindow.document.querySelectorAll('textarea');
			iframeTextareas.forEach(addFocusListener);
		} catch (error) {
			console.warn('Unable to access iframe content:', error.message);
		}
	} else {
		var iframes = node.querySelectorAll('iframe');
		iframes.forEach(handleNewNode);
	}
}

var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		if (mutation.addedNodes.length > 0) {
			mutation.addedNodes.forEach(handleNewNode);
		}
	});
});

observer.observe(document.body, {
	childList: true,
	subtree: true,
});

document.querySelectorAll('textarea, div[contenteditable="true"][role="textbox"], div[g_editable="true"][role="textbox"][contenteditable="true"], [data-text="true"], .CodeMirror-code, [data-lexical-text="true"]').forEach(addFocusListener);
document.querySelectorAll('iframe').forEach(handleNewNode);

function createChatGPTIcon(element) {
	const icon = document.createElement('img');
	icon.src = chrome.runtime.getURL('icons/icon.svg');
	icon.style.background = '#2563EB';
	icon.style.borderRadius = '50px';
	icon.style.width = '24px';
	icon.style.height = '24px';
	icon.style.position = 'absolute';
	icon.style.cursor = 'pointer';
	icon.style.zIndex = '1000';
	icon.style.right = '10px';
	icon.style.bottom = '45px';

	icon.addEventListener('click', handleChatGPTIconClick.bind(this, element));

	element.addEventListener('input', () => {
		icon.style.display = 'block';
	});

	element.parentNode.appendChild(icon);
	// console.log('Appended to:', element.parentNode)
}

function onTextAreaFocus(event) {
	const textarea = event.target;
	if (!textarea.chatGPTIconAdded) {
		createChatGPTIcon(textarea);
		// console.log('focus func appended:', createChatGPTIcon)
		textarea.chatGPTIconAdded = true;
	}
}

function handleChatGPTIconClick(element) {
	const messageRegex = /\/ari (.+)/;
	let messageMatch;

	if (element.tagName === 'DIV' && element.getAttribute('role') === 'textbox') {
		const childP = element.querySelector('p > span, p, span') || element.closest('div');
		if (childP) {
			messageMatch = childP.innerText.match(messageRegex);
			//  console.log('Matched @ child', messageMatch)
		}
	} else {
		messageMatch = element.value.match(messageRegex);
		// console.log('Matched directly', messageMatch)
	}

	if (!messageMatch) return;

	const message = messageMatch[1];

	const icon = element.parentNode.querySelector('img');
	icon.src = chrome.runtime.getURL('icons/ari_loading.gif');

	chrome.runtime.sendMessage({
		message
	}, (response) => {
		if (element.tagName === 'DIV' && element.getAttribute('role') === 'textbox') {
			const childP = element.querySelector('p > span, p, span') || element.closest('div');
			if (childP) {
				childP.innerText = response.answer;
				//  console.log('Child P inner text', childP.innerText)
				typeResponse(response.answer, element);
				// console.log('Child P response', typeResponse)
				icon.src = chrome.runtime.getURL('icons/icon.svg');
			}
		} else {
			element.value = response.answer;
			typeResponse(response.answer, element);
			// console.log('Value response', typeResponse)
			icon.src = chrome.runtime.getURL('icons/icon.svg');
		}
	});
}

function typeResponse(response, element) {
	let index = 0;

	if (element.tagName === 'DIV' && element.getAttribute('role') === 'textbox') {
		const childP = element.querySelector('p > span, p, span') || element.closest('div');
		if (childP) {
			childP.innerText = '';
			// console.log('Response inner text:', childP.innerText)
		} else {
			return;
		}

		const typeCharacter = () => {
			if (index < response.length) {
				childP.innerText += response.charAt(index);
				index++;
				setTimeout(typeCharacter, 50);
			}
		};

		typeCharacter();
	} else {
		element.value = '';

		const typeCharacter = () => {
			if (index < response.length) {
				element.value += response.charAt(index);
				index++;
				setTimeout(typeCharacter, 50);
			}
		};

		typeCharacter();
		// console.log('Final typed message', typeCharacter)
	}
}
}

//--- Background Scripts: ---
// New file: background.js
{
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	fetchChatGPTResponse(request.message).then((response) => {
		sendResponse({
			answer: response
		});
	});
	return true;
});

async function fetchChatGPTResponse(message) {
	const response = await fetch('https://us-central1-ailabs-5e4e9.cloudfunctions.net/callApi', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			prompt: message,
			max_tokens: 1024, // Adjust the number of tokens returned as needed
			n: 1,
			stop: null,
			temperature: 0.7,
		}),
	});
	const data = await response.json();
	return data.choices[0].text.trim();
}

chrome.runtime.setUninstallURL('https://typeari.com/feedback');
}
