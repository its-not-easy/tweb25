//--- Content Scripts: ---
// New file: contentScript.js
{
const defaultBackgroundColor = '#FFF';
const defaultPrimaryColor = '#1976D2';
const defaultIconColor = '#000';
const defaultTextColor = '#000';
const defaultGreenColor = '#2ECC71';
const defaultYellowColor = '#f7d60d';

let oldIframeContentHeight = 0;

const getAppInfo = (url) => {
	// if (url.includes('https://teams.microsoft.com')) {
	//   return {
	//     appName: 'Microsoft Teams',
	//     trafficType: 'video-conferencing',
	//     generalMode: '0',
	//   };
	// }
	if (url.includes('meet.google.com')) {
		return {
			appName: 'Google Meet',
			trafficType: 'video-conferencing',
			generalMode: '0',
		};
	} else if (url.includes('domos.ai')) {
		return {
			appName: 'Domos',
			trafficType: 'video-conferencing',
			generalMode: '1',
		};
	} else if (url.includes('webex.com')) {
		return {
			appName: 'Webex',
			trafficType: 'video-conferencing',
			generalMode: '0',
		};
	} else if (url.includes('zoom.us')) {
		return {
			appName: 'Zoom',
			trafficType: 'video-conferencing',
			generalMode: '0',
		};
	} else if (url.includes('speedtest.net')) {
		return {
			appName: 'Speedtest',
			trafficType: 'video-conferencing',
			generalMode: '1',
			backgroundColor: '#141526',
			primaryColor: '#2ABAF7',
			textColor: '#FFFFFF',
			iconColor: '#FF886A',
			showQoQ: '0',
			showLiveGraph: '0',
			showAppHeader: '0',
		};
	} else if (url.includes('networkxray.io')) {
		return {
			appName: 'network x-ray',
			trafficType: 'video-conferencing',
			generalMode: '1',
		};
	} else if (url.includes('bluejeans.com')) {
		return {
			appName: 'BlueJeans',
			trafficType: 'bluejeans',
			backgroundColor: '#094695',
			primaryColor: '#FFFFFF',
			textColor: '#FFFFFF',
			iconColor: '#Fe3A68',
			chartGoodColor: '#30ca77',
			chartBadColor: '#Fe3A68',
			generalMode: '0',
		};
	} else if (url.includes('spectrum.net')) {
		return {
			appName: 'Spectrum',
			trafficType: 'video-conferencing',
			primaryColor: '#0099D8',
			textColor: '#FFFFFF',
			iconColor: '#0099D8',
			backgroundColor: '#003057',
			chartGoodColor: '#30ca77',
			chartBadColor: '#Fe3A68',
			showAppHeader: '0',
			generalMode: '1',
		};
	} else if (url.includes('geforcenow.com')) {
		return {
			appName: 'GeForce Now',
			trafficType: 'gaming',
			generalMode: '0',
		};
	} else if (url.includes('xbox.com')) {
		return {
			appName: 'Xbox',
			trafficType: 'gaming',
			generalMode: '0',
		};
	} else if (url.includes('playstation.com')) {
		return {
			appName: 'Playstation',
			trafficType: 'gaming',
			generalMode: '0',
		};
	} else if (url.includes('luna.amazon.com')) {
		return {
			appName: 'Amazon Luna',
			trafficType: 'gaming',
			generalMode: '0',
		};
	} else if (url.includes('domos-links.azurewebsites.net')) {
		return {
			appName: 'Domos Links',
			trafficType: 'video-conferencing',
			generalMode: '1',
		};
	}
};

if (typeof init === 'undefined') {
	const iframeWidth = 380;
	let iframeVisible = false;

	const init = () => {
		const currentUrl = window.location.href;
		const appInfo = getAppInfo(currentUrl);

		const icon = document.createElement('img');
		icon.src = chrome.runtime.getURL('assets/bad.svg');
		icon.style.position = 'fixed';
		icon.style.top = '0';
		icon.style.right = '0';
		icon.style.cursor = 'pointer';
		icon.style.zIndex = '999999';
		icon.className = 'icon-shrink-grow';
		document.body.appendChild(icon);

		const iframe = document.createElement('iframe');

		iframe.srcdoc = `<!DOCTYPE html>
    <html>
      <head>
        <title>NetworkXRay</title>
        <link href="https://fonts.googleapis.com/css?family=Inter" rel="stylesheet">
      </head>
      <body>
        <div id="xray"
          class="networkxray"
          traffic-type="${appInfo.trafficType}"
          general-mode="${appInfo.generalMode}"
          background-color="${appInfo.backgroundColor ?? defaultBackgroundColor}"
          primary-color="${appInfo.primaryColor ?? defaultPrimaryColor}"
          text-color="${appInfo.textColor ?? defaultTextColor}"
          icon-color="${appInfo.iconColor ?? defaultIconColor}"
          chart-good-color="${appInfo.chartGoodColor ?? defaultGreenColor}"
          chart-bad-color="${appInfo.chartBadColor ?? defaultYellowColor}"
          show-app-header="${appInfo.showAppHeader ?? '1'}"
          show-quality-of-outcome="${appInfo.showQoQ ?? '1'}"
          show-live-quality-graph="${appInfo.showLiveGraph ?? '1'}"
          app-name="${appInfo.appName}"></div>
          <script src="${chrome.runtime.getURL('assets/index.js')}"></script>
      </body>
    </html>`;
		iframe.style.position = 'fixed';
		iframe.style.top = '50px';
		iframe.style.right = '50px';
		iframe.style.width = iframeWidth + 'px';
		iframe.style.height = '40%';
		iframe.style.zIndex = '999999';
		iframe.style.visibility = 'hidden';
		iframe.style.border = 'solid 1px #ddd';
		iframe.onload = () => initMutationObserver();

		function initMutationObserver() {
			var observer = new MutationObserver(function(mutations) {
				var iframeContentHeight = iframe.contentWindow.document.body.scrollHeight;
				if (
					iframeContentHeight >= oldIframeContentHeight + 20 ||
					iframeContentHeight < oldIframeContentHeight - 20
				) {
					oldIframeContentHeight = iframeContentHeight;
					const newIframeHeight =
						Math.min(iframeContentHeight + 20, window.innerHeight - icon.offsetTop - 50) + 'px';
					iframe.style.height = newIframeHeight;
				}
			});

			var observerOptions = {
				childList: true,
				subtree: true,
			};

			observer.observe(iframe.contentDocument.documentElement, observerOptions);
		}

		document.body.appendChild(iframe);

		// Change icon color when quality goes above or below threshold
		document.addEventListener('iconcolor', handleIconColorEvent, false);

		function handleIconColorEvent(e) {
			if (e.detail.color === 'bad') {
				icon.src = chrome.runtime.getURL('assets/bad.svg');
			} else {
				icon.src = chrome.runtime.getURL('assets/good.svg');
			}
		}

		// Keep track of previous position and use as a check to not toggle iframe after moving the icon
		let previousIconPosX;
		let previousIconPosY;
		let currentIconPosX;
		let currentIconPosY;

		let mousePosX = 0;
		let mousePosY = 0;
		let iconPosX = 0;
		let iconPosY = 0;

		function istinyIconMovement() {
			const xMovement = Math.abs(currentIconPosX - previousIconPosX);
			const yMovement = Math.abs(currentIconPosY - previousIconPosY);
			return (tinymove = xMovement < 5 && yMovement < 5);
		}

		const dragMouseDown = (e) => {
			previousIconPosX = e.clientX;
			previousIconPosY = e.clientY;
			icon.classList.add('icon-mouse-down');
			icon.classList.remove('icon-blink');
			e = e || window.event;
			e.preventDefault();
			mousePosX = e.clientX;
			mousePosY = e.clientY;
			document.onmousemove = elementDrag;
			document.onmouseup = closeDragElement;
		};

		const elementDrag = (e) => {
			e = e || window.event;
			e.preventDefault();
			iconPosX = mousePosX - e.clientX;
			iconPosY = mousePosY - e.clientY;
			mousePosX = e.clientX;
			mousePosY = e.clientY;
			currentIconPosX = mousePosX;
			currentIconPosY = mousePosY;
			icon.style.top = icon.offsetTop - iconPosY + 'px';
			icon.style.left = icon.offsetLeft - iconPosX + 'px';
			iframe.style.top = icon.offsetTop + icon.height + 'px';
			iframe.style.left = icon.offsetLeft - iframeWidth + 'px';
		};

		const closeDragElement = () => {
			icon.classList.remove('icon-mouse-down');
			document.onmousemove = null;
			document.onmouseup = null;
		};

		icon.onmousedown = dragMouseDown;

		const iconClickedEventHandler = () => {
			if (!icon.style.left || istinyIconMovement()) {
				iframeVisible = !iframeVisible;
				iframe.style.visibility = iframeVisible ? 'visible' : 'hidden';
				icon.className = '';
			} else {}
			previousIconPosX = currentIconPosX;
			previousIconPosY = currentIconPosY;
		};

		icon.addEventListener('click', iconClickedEventHandler);
	};
	init();
}
}

//--- Background Scripts: ---
