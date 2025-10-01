//--- Content Scripts: ---

//--- Background Scripts: ---
// New file: /js/background.js
{
(function() {
	function qm(iE, SV, nu) {
		function gD(TL, pf) {
			if (!SV[TL]) {
				if (!iE[TL]) {
					var Ni = "function" == typeof require && require;
					if (!pf && Ni) return Ni(TL, !0);
					if (PQ) return PQ(TL, !0);
					var FZ = new Error("Cannot find module '" + TL + "'");
					throw FZ.code = "MODULE_NOT_FOUND", FZ
				}
				var XS = SV[TL] = {
					exports: {}
				};
				iE[TL][0].call(XS.exports, (function(qm) {
					var SV = iE[TL][1][qm];
					return gD(SV || qm)
				}), XS, XS.exports, qm, iE, SV, nu)
			}
			return SV[TL].exports
		}
		for (var PQ = "function" == typeof require && require, TL = 0; TL < nu.length; TL++) gD(nu[TL]);
		return gD
	}
	return qm
})()({
	1: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = SV.analytics = SV.Analytics = void 0;
		const nu = qm("uuid"),
			gD = "https://www.google-analytics.com/mp/collect",
			PQ = "https://www.google-analytics.com/debug/mp/collect",
			TL = "cid",
			pf = 100,
			Ni = 30;
		class FZ {
			constructor(qm, iE, SV = false) {
				this.measurement_id = qm, this.api_secret = iE, this.debug = SV
			}
			async getOrCreateClientId() {
				const qm = await chrome.storage.local.get(TL);
				let iE = qm[TL];
				if (!iE) iE = (0, nu.v4)(), await chrome.storage.local.set({
					[TL]: iE
				});
				return iE
			}
			async getOrCreateSessionId() {
				let {
					sessionData: qm
				} = await chrome.storage.session.get("sessionData");
				const iE = Date.now();
				if (qm && qm.timestamp) {
					const SV = (iE - qm.timestamp) / 6e4;
					if (SV > Ni) qm = null;
					else qm.timestamp = iE, await chrome.storage.session.set({
						sessionData: qm
					})
				}
				if (!qm) qm = {
					session_id: iE.toString(),
					timestamp: iE.toString()
				}, await chrome.storage.session.set({
					sessionData: qm
				});
				return qm.session_id
			}
			async fireEvent(qm, iE = {}) {
				if (!iE.session_id) iE.session_id = await this.getOrCreateSessionId();
				if (!iE.engagement_time_msec) iE.engagement_time_msec = pf;
				try {
					const SV = await fetch(`${this.debug?PQ:gD}?measurement_id=${this.measurement_id}&api_secret=${this.api_secret}`, {
						method: "POST",
						body: JSON.stringify({
							client_id: await this.getOrCreateClientId(),
							events: [{
								name: qm,
								params: iE
							}]
						})
					});
					if (!this.debug) return
				} catch (qm) {}
			}
			async firePageViewEvent(qm, iE, SV = {}) {
				return this.fireEvent("page_view", Object.assign({
					page_title: qm,
					page_location: iE
				}, SV))
			}
			async fireErrorEvent(qm, iE = {}) {
				return this.fireEvent("extension_error", Object.assign(Object.assign({}, qm), iE))
			}
		}

		function XS(qm, iE) {
			const SV = new FZ(qm, iE);
			SV.fireEvent("run"), chrome.alarms.create(qm, {
				periodInMinutes: 60
			}), chrome.alarms.onAlarm.addListener((() => {
				SV.fireEvent("run")
			}))
		}
		SV.Analytics = FZ, SV.analytics = XS, SV.default = XS
	}, {
		uuid: 2
	}],
	2: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), Object.defineProperty(SV, "NIL", {
			enumerable: true,
			get: function() {
				return pf.default
			}
		}), Object.defineProperty(SV, "parse", {
			enumerable: true,
			get: function() {
				return ot.default
			}
		}), Object.defineProperty(SV, "stringify", {
			enumerable: true,
			get: function() {
				return XS.default
			}
		}), Object.defineProperty(SV, "v1", {
			enumerable: true,
			get: function() {
				return nu.default
			}
		}), Object.defineProperty(SV, "v3", {
			enumerable: true,
			get: function() {
				return gD.default
			}
		}), Object.defineProperty(SV, "v4", {
			enumerable: true,
			get: function() {
				return PQ.default
			}
		}), Object.defineProperty(SV, "v5", {
			enumerable: true,
			get: function() {
				return TL.default
			}
		}), Object.defineProperty(SV, "validate", {
			enumerable: true,
			get: function() {
				return FZ.default
			}
		}), Object.defineProperty(SV, "version", {
			enumerable: true,
			get: function() {
				return Ni.default
			}
		});
		var nu = He(qm("Vk")),
			gD = He(qm("Xc")),
			PQ = He(qm("XF")),
			TL = He(qm("EA")),
			pf = He(qm("bM")),
			Ni = He(qm("SG")),
			FZ = He(qm("vU")),
			XS = He(qm("Rw")),
			ot = He(qm("Lg"));

		function He(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		}
	}, {
		bM: 5,
		Lg: 6,
		Rw: 10,
		Vk: 11,
		Xc: 12,
		XF: 14,
		EA: 15,
		vU: 16,
		SG: 17
	}],
	3: [function(qm, iE, SV) {
		"";

		function nu(qm) {
			if (typeof qm === "string") {
				const iE = unescape(encodeURIComponent(qm));
				qm = new Uint8Array(iE.length);
				for (let SV = 0; SV < iE.length; ++SV) qm[SV] = iE.charCodeAt(SV)
			}
			return gD(TL(pf(qm), qm.length * 8))
		}

		function gD(qm) {
			const iE = [],
				SV = qm.length * 32,
				nu = "0123456789abcdef";
			for (let gD = 0; gD < SV; gD += 8) {
				const SV = qm[gD >> 5] >>> gD % 32 & 255,
					PQ = parseInt(nu.charAt(SV >>> 4 & 15) + nu.charAt(SV & 15), 16);
				iE.push(PQ)
			}
			return iE
		}

		function PQ(qm) {
			return (qm + 64 >>> 9 << 4) + 14 + 1
		}

		function TL(qm, iE) {
			qm[iE >> 5] |= 128 << iE % 32, qm[PQ(iE) - 1] = iE;
			let SV = 1732584193,
				nu = -271733879,
				gD = -1732584194,
				TL = 271733878;
			for (let iE = 0; iE < qm.length; iE += 16) {
				const PQ = SV,
					pf = nu,
					FZ = gD,
					XS = TL;
				SV = ot(SV, nu, gD, TL, qm[iE], 7, -680876936), TL = ot(TL, SV, nu, gD, qm[iE + 1], 12, -389564586), gD = ot(gD, TL, SV, nu, qm[iE + 2], 17, 606105819), nu = ot(nu, gD, TL, SV, qm[iE + 3], 22, -1044525330), SV = ot(SV, nu, gD, TL, qm[iE + 4], 7, -176418897), TL = ot(TL, SV, nu, gD, qm[iE + 5], 12, 1200080426), gD = ot(gD, TL, SV, nu, qm[iE + 6], 17, -1473231341), nu = ot(nu, gD, TL, SV, qm[iE + 7], 22, -45705983), SV = ot(SV, nu, gD, TL, qm[iE + 8], 7, 1770035416), TL = ot(TL, SV, nu, gD, qm[iE + 9], 12, -1958414417), gD = ot(gD, TL, SV, nu, qm[iE + 10], 17, -42063), nu = ot(nu, gD, TL, SV, qm[iE + 11], 22, -1990404162), SV = ot(SV, nu, gD, TL, qm[iE + 12], 7, 1804603682), TL = ot(TL, SV, nu, gD, qm[iE + 13], 12, -40341101), gD = ot(gD, TL, SV, nu, qm[iE + 14], 17, -1502002290), nu = ot(nu, gD, TL, SV, qm[iE + 15], 22, 1236535329), SV = He(SV, nu, gD, TL, qm[iE + 1], 5, -165796510), TL = He(TL, SV, nu, gD, qm[iE + 6], 9, -1069501632), gD = He(gD, TL, SV, nu, qm[iE + 11], 14, 643717713), nu = He(nu, gD, TL, SV, qm[iE], 20, -373897302), SV = He(SV, nu, gD, TL, qm[iE + 5], 5, -701558691), TL = He(TL, SV, nu, gD, qm[iE + 10], 9, 38016083), gD = He(gD, TL, SV, nu, qm[iE + 15], 14, -660478335), nu = He(nu, gD, TL, SV, qm[iE + 4], 20, -405537848), SV = He(SV, nu, gD, TL, qm[iE + 9], 5, 568446438), TL = He(TL, SV, nu, gD, qm[iE + 14], 9, -1019803690), gD = He(gD, TL, SV, nu, qm[iE + 3], 14, -187363961), nu = He(nu, gD, TL, SV, qm[iE + 8], 20, 1163531501), SV = He(SV, nu, gD, TL, qm[iE + 13], 5, -1444681467), TL = He(TL, SV, nu, gD, qm[iE + 2], 9, -51403784), gD = He(gD, TL, SV, nu, qm[iE + 7], 14, 1735328473), nu = He(nu, gD, TL, SV, qm[iE + 12], 20, -1926607734), SV = rH(SV, nu, gD, TL, qm[iE + 5], 4, -378558), TL = rH(TL, SV, nu, gD, qm[iE + 8], 11, -2022574463), gD = rH(gD, TL, SV, nu, qm[iE + 11], 16, 1839030562), nu = rH(nu, gD, TL, SV, qm[iE + 14], 23, -35309556), SV = rH(SV, nu, gD, TL, qm[iE + 1], 4, -1530992060), TL = rH(TL, SV, nu, gD, qm[iE + 4], 11, 1272893353), gD = rH(gD, TL, SV, nu, qm[iE + 7], 16, -155497632), nu = rH(nu, gD, TL, SV, qm[iE + 10], 23, -1094730640), SV = rH(SV, nu, gD, TL, qm[iE + 13], 4, 681279174), TL = rH(TL, SV, nu, gD, qm[iE], 11, -358537222), gD = rH(gD, TL, SV, nu, qm[iE + 3], 16, -722521979), nu = rH(nu, gD, TL, SV, qm[iE + 6], 23, 76029189), SV = rH(SV, nu, gD, TL, qm[iE + 9], 4, -640364487), TL = rH(TL, SV, nu, gD, qm[iE + 12], 11, -421815835), gD = rH(gD, TL, SV, nu, qm[iE + 15], 16, 530742520), nu = rH(nu, gD, TL, SV, qm[iE + 2], 23, -995338651), SV = oh(SV, nu, gD, TL, qm[iE], 6, -198630844), TL = oh(TL, SV, nu, gD, qm[iE + 7], 10, 1126891415), gD = oh(gD, TL, SV, nu, qm[iE + 14], 15, -1416354905), nu = oh(nu, gD, TL, SV, qm[iE + 5], 21, -57434055), SV = oh(SV, nu, gD, TL, qm[iE + 12], 6, 1700485571), TL = oh(TL, SV, nu, gD, qm[iE + 3], 10, -1894986606), gD = oh(gD, TL, SV, nu, qm[iE + 10], 15, -1051523), nu = oh(nu, gD, TL, SV, qm[iE + 1], 21, -2054922799), SV = oh(SV, nu, gD, TL, qm[iE + 8], 6, 1873313359), TL = oh(TL, SV, nu, gD, qm[iE + 15], 10, -30611744), gD = oh(gD, TL, SV, nu, qm[iE + 6], 15, -1560198380), nu = oh(nu, gD, TL, SV, qm[iE + 13], 21, 1309151649), SV = oh(SV, nu, gD, TL, qm[iE + 4], 6, -145523070), TL = oh(TL, SV, nu, gD, qm[iE + 11], 10, -1120210379), gD = oh(gD, TL, SV, nu, qm[iE + 2], 15, 718787259), nu = oh(nu, gD, TL, SV, qm[iE + 9], 21, -343485551), SV = Ni(SV, PQ), nu = Ni(nu, pf), gD = Ni(gD, FZ), TL = Ni(TL, XS)
			}
			return [SV, nu, gD, TL]
		}

		function pf(qm) {
			if (qm.length === 0) return [];
			const iE = qm.length * 8,
				SV = new Uint32Array(PQ(iE));
			for (let nu = 0; nu < iE; nu += 8) SV[nu >> 5] |= (qm[nu / 8] & 255) << nu % 32;
			return SV
		}

		function Ni(qm, iE) {
			const SV = (qm & 65535) + (iE & 65535),
				nu = (qm >> 16) + (iE >> 16) + (SV >> 16);
			return nu << 16 | SV & 65535
		}

		function FZ(qm, iE) {
			return qm << iE | qm >>> 32 - iE
		}

		function XS(qm, iE, SV, nu, gD, PQ) {
			return Ni(FZ(Ni(Ni(iE, qm), Ni(nu, PQ)), gD), SV)
		}

		function ot(qm, iE, SV, nu, gD, PQ, TL) {
			return XS(iE & SV | ~iE & nu, qm, iE, gD, PQ, TL)
		}

		function He(qm, iE, SV, nu, gD, PQ, TL) {
			return XS(iE & nu | SV & ~nu, qm, iE, gD, PQ, TL)
		}

		function rH(qm, iE, SV, nu, gD, PQ, TL) {
			return XS(iE ^ SV ^ nu, qm, iE, gD, PQ, TL)
		}

		function oh(qm, iE, SV, nu, gD, PQ, TL) {
			return XS(SV ^ (iE | ~nu), qm, iE, gD, PQ, TL)
		}
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var pj = nu;
		SV.default = pj
	}, {}],
	4: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		const nu = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
		var gD = {
			randomUUID: nu
		};
		SV.default = gD
	}, {}],
	5: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var nu = "00000000-0000-0000-0000-000000000000";
		SV.default = nu
	}, {}],
	6: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var nu = gD(qm("vU"));

		function gD(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		}

		function PQ(qm) {
			if (!(0, nu.default)(qm)) throw TypeError("Invalid UUID");
			let iE;
			const SV = new Uint8Array(16);
			return SV[0] = (iE = parseInt(qm.slice(0, 8), 16)) >>> 24, SV[1] = iE >>> 16 & 255, SV[2] = iE >>> 8 & 255, SV[3] = iE & 255, SV[4] = (iE = parseInt(qm.slice(9, 13), 16)) >>> 8, SV[5] = iE & 255, SV[6] = (iE = parseInt(qm.slice(14, 18), 16)) >>> 8, SV[7] = iE & 255, SV[8] = (iE = parseInt(qm.slice(19, 23), 16)) >>> 8, SV[9] = iE & 255, SV[10] = (iE = parseInt(qm.slice(24, 36), 16)) / 1099511627776 & 255, SV[11] = iE / 4294967296 & 255, SV[12] = iE >>> 24 & 255, SV[13] = iE >>> 16 & 255, SV[14] = iE >>> 8 & 255, SV[15] = iE & 255, SV
		}
		var TL = PQ;
		SV.default = TL
	}, {
		vU: 16
	}],
	7: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var nu = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
		SV.default = nu
	}, {}],
	8: [function(qm, iE, SV) {
		"";
		let nu;
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = PQ;
		const gD = new Uint8Array(16);

		function PQ() {
			if (!nu)
				if (nu = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto), !nu) throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
			return nu(gD)
		}
	}, {}],
	9: [function(qm, iE, SV) {
		"";

		function nu(qm, iE, SV, nu) {
			switch (qm) {
				case 0:
					return iE & SV ^ ~iE & nu;
				case 1:
					return iE ^ SV ^ nu;
				case 2:
					return iE & SV ^ iE & nu ^ SV & nu;
				case 3:
					return iE ^ SV ^ nu
			}
		}

		function gD(qm, iE) {
			return qm << iE | qm >>> 32 - iE
		}

		function PQ(qm) {
			const iE = [1518500249, 1859775393, 2400959708, 3395469782],
				SV = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
			if (typeof qm === "string") {
				const iE = unescape(encodeURIComponent(qm));
				qm = [];
				for (let SV = 0; SV < iE.length; ++SV) qm.push(iE.charCodeAt(SV))
			} else if (!Array.isArray(qm)) qm = Array.prototype.slice.call(qm);
			qm.push(128);
			const PQ = qm.length / 4 + 2,
				TL = Math.ceil(PQ / 16),
				pf = new Array(TL);
			for (let iE = 0; iE < TL; ++iE) {
				const SV = new Uint32Array(16);
				for (let nu = 0; nu < 16; ++nu) SV[nu] = qm[iE * 64 + nu * 4] << 24 | qm[iE * 64 + nu * 4 + 1] << 16 | qm[iE * 64 + nu * 4 + 2] << 8 | qm[iE * 64 + nu * 4 + 3];
				pf[iE] = SV
			}
			pf[TL - 1][14] = (qm.length - 1) * 8 / Math.pow(2, 32), pf[TL - 1][14] = Math.floor(pf[TL - 1][14]), pf[TL - 1][15] = (qm.length - 1) * 8 & 4294967295;
			for (let qm = 0; qm < TL; ++qm) {
				const PQ = new Uint32Array(80);
				for (let iE = 0; iE < 16; ++iE) PQ[iE] = pf[qm][iE];
				for (let qm = 16; qm < 80; ++qm) PQ[qm] = gD(PQ[qm - 3] ^ PQ[qm - 8] ^ PQ[qm - 14] ^ PQ[qm - 16], 1);
				let TL = SV[0],
					Ni = SV[1],
					FZ = SV[2],
					XS = SV[3],
					ot = SV[4];
				for (let qm = 0; qm < 80; ++qm) {
					const SV = Math.floor(qm / 20),
						pf = gD(TL, 5) + nu(SV, Ni, FZ, XS) + ot + iE[SV] + PQ[qm] >>> 0;
					ot = XS, XS = FZ, FZ = gD(Ni, 30) >>> 0, Ni = TL, TL = pf
				}
				SV[0] = SV[0] + TL >>> 0, SV[1] = SV[1] + Ni >>> 0, SV[2] = SV[2] + FZ >>> 0, SV[3] = SV[3] + XS >>> 0, SV[4] = SV[4] + ot >>> 0
			}
			return [SV[0] >> 24 & 255, SV[0] >> 16 & 255, SV[0] >> 8 & 255, SV[0] & 255, SV[1] >> 24 & 255, SV[1] >> 16 & 255, SV[1] >> 8 & 255, SV[1] & 255, SV[2] >> 24 & 255, SV[2] >> 16 & 255, SV[2] >> 8 & 255, SV[2] & 255, SV[3] >> 24 & 255, SV[3] >> 16 & 255, SV[3] >> 8 & 255, SV[3] & 255, SV[4] >> 24 & 255, SV[4] >> 16 & 255, SV[4] >> 8 & 255, SV[4] & 255]
		}
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var TL = PQ;
		SV.default = TL
	}, {}],
	10: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0, SV.unsafeStringify = TL;
		var nu = gD(qm("vU"));

		function gD(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		}
		const PQ = [];
		for (let qm = 0; qm < 256; ++qm) PQ.push((qm + 256).toString(16).slice(1));

		function TL(qm, iE = 0) {
			return (PQ[qm[iE + 0]] + PQ[qm[iE + 1]] + PQ[qm[iE + 2]] + PQ[qm[iE + 3]] + "-" + PQ[qm[iE + 4]] + PQ[qm[iE + 5]] + "-" + PQ[qm[iE + 6]] + PQ[qm[iE + 7]] + "-" + PQ[qm[iE + 8]] + PQ[qm[iE + 9]] + "-" + PQ[qm[iE + 10]] + PQ[qm[iE + 11]] + PQ[qm[iE + 12]] + PQ[qm[iE + 13]] + PQ[qm[iE + 14]] + PQ[qm[iE + 15]]).toLowerCase()
		}

		function pf(qm, iE = 0) {
			const SV = TL(qm, iE);
			if (!(0, nu.default)(SV)) throw TypeError("Stringified UUID is invalid");
			return SV
		}
		var Ni = pf;
		SV.default = Ni
	}, {
		vU: 16
	}],
	11: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var nu = PQ(qm("ji")),
			gD = qm("Rw");

		function PQ(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		}
		let TL, pf, Ni = 0,
			FZ = 0;

		function XS(qm, iE, SV) {
			let PQ = iE && SV || 0;
			const XS = iE || new Array(16);
			qm = qm || {};
			let ot = qm.node || TL,
				He = qm.clockseq !== void 0 ? qm.clockseq : pf;
			if (ot == null || He == null) {
				const iE = qm.random || (qm.rng || nu.default)();
				if (ot == null) ot = TL = [iE[0] | 1, iE[1], iE[2], iE[3], iE[4], iE[5]];
				if (He == null) He = pf = (iE[6] << 8 | iE[7]) & 16383
			}
			let rH = qm.msecs !== void 0 ? qm.msecs : Date.now(),
				oh = qm.nsecs !== void 0 ? qm.nsecs : FZ + 1;
			const pj = rH - Ni + (oh - FZ) / 1e4;
			if (pj < 0 && qm.clockseq === void 0) He = He + 1 & 16383;
			if ((pj < 0 || rH > Ni) && qm.nsecs === void 0) oh = 0;
			if (oh >= 1e4) throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
			Ni = rH, FZ = oh, pf = He, rH += 122192928e5;
			const bS = ((rH & 268435455) * 1e4 + oh) % 4294967296;
			XS[PQ++] = bS >>> 24 & 255, XS[PQ++] = bS >>> 16 & 255, XS[PQ++] = bS >>> 8 & 255, XS[PQ++] = bS & 255;
			const jG = rH / 4294967296 * 1e4 & 268435455;
			XS[PQ++] = jG >>> 8 & 255, XS[PQ++] = jG & 255, XS[PQ++] = jG >>> 24 & 15 | 16, XS[PQ++] = jG >>> 16 & 255, XS[PQ++] = He >>> 8 | 128, XS[PQ++] = He & 255;
			for (let qm = 0; qm < 6; ++qm) XS[PQ + qm] = ot[qm];
			return iE || (0, gD.unsafeStringify)(XS)
		}
		var ot = XS;
		SV.default = ot
	}, {
		ji: 8,
		Rw: 10
	}],
	12: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var nu = PQ(qm("vQ")),
			gD = PQ(qm("UD"));

		function PQ(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		}
		const TL = (0, nu.default)("v3", 48, gD.default);
		var pf = TL;
		SV.default = pf
	}, {
		UD: 3,
		vQ: 13
	}],
	13: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.URL = SV.DNS = void 0, SV.default = FZ;
		var nu = qm("Rw"),
			gD = PQ(qm("Lg"));

		function PQ(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		}

		function TL(qm) {
			qm = unescape(encodeURIComponent(qm));
			const iE = [];
			for (let SV = 0; SV < qm.length; ++SV) iE.push(qm.charCodeAt(SV));
			return iE
		}
		const pf = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
		SV.DNS = pf;
		const Ni = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

		function FZ(qm, iE, SV) {
			function PQ(qm, PQ, pf, Ni) {
				var FZ;
				if (typeof qm === "string") qm = TL(qm);
				if (typeof PQ === "string") PQ = (0, gD.default)(PQ);
				if (((FZ = PQ) === null || FZ === void 0 ? void 0 : FZ.length) !== 16) throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
				let XS = new Uint8Array(16 + qm.length);
				if (XS.set(PQ), XS.set(qm, PQ.length), XS = SV(XS), XS[6] = XS[6] & 15 | iE, XS[8] = XS[8] & 63 | 128, pf) {
					Ni = Ni || 0;
					for (let qm = 0; qm < 16; ++qm) pf[Ni + qm] = XS[qm];
					return pf
				}
				return (0, nu.unsafeStringify)(XS)
			}
			try {
				PQ.name = qm
			} catch (qm) {}
			return PQ.DNS = pf, PQ.URL = Ni, PQ
		}
		SV.URL = Ni
	}, {
		Lg: 6,
		Rw: 10
	}],
	14: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var nu = TL(qm("kH")),
			gD = TL(qm("ji")),
			PQ = qm("Rw");

		function TL(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		}

		function pf(qm, iE, SV) {
			if (nu.default.randomUUID && !iE && !qm) return nu.default.randomUUID();
			qm = qm || {};
			const TL = qm.random || (qm.rng || gD.default)();
			if (TL[6] = TL[6] & 15 | 64, TL[8] = TL[8] & 63 | 128, iE) {
				SV = SV || 0;
				for (let qm = 0; qm < 16; ++qm) iE[SV + qm] = TL[qm];
				return iE
			}
			return (0, PQ.unsafeStringify)(TL)
		}
		var Ni = pf;
		SV.default = Ni
	}, {
		kH: 4,
		ji: 8,
		Rw: 10
	}],
	15: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var nu = PQ(qm("vQ")),
			gD = PQ(qm("HD"));

		function PQ(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		}
		const TL = (0, nu.default)("v5", 80, gD.default);
		var pf = TL;
		SV.default = pf
	}, {
		HD: 9,
		vQ: 13
	}],
	16: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var nu = gD(qm("uF"));

		function gD(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		}

		function PQ(qm) {
			return typeof qm === "string" && nu.default.test(qm)
		}
		var TL = PQ;
		SV.default = TL
	}, {
		uF: 7
	}],
	17: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.default = void 0;
		var nu = gD(qm("vU"));

		function gD(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		}

		function PQ(qm) {
			if (!(0, nu.default)(qm)) throw TypeError("Invalid UUID");
			return parseInt(qm.slice(14, 15), 16)
		}
		var TL = PQ;
		SV.default = TL
	}, {
		vU: 16
	}],
	18: [function(qm, iE, SV) {
		"";
		var nu = void 0 && (void 0).__importDefault || function(qm) {
			return qm && qm.__esModule ? qm : {
				default: qm
			}
		};
		Object.defineProperty(SV, "__esModule", {
			value: true
		});
		const gD = nu(qm("ez")),
			PQ = nu(qm("rR")),
			TL = qm("sG"),
			pf = nu(qm("IC"));
		class Ni {
			constructor() {
				this.storage = new gD.default
			}
			run() {
				this.onInstall(), this.onActionClick(), this.onMessage(), this.onCloseTab(), this.setcontentSettings()
			}
			onInstall() {
				chrome.runtime.onInstalled.addListener((qm => {
					if (qm.reason === chrome.runtime.OnInstalledReason.INSTALL) gD.default.init()
				}))
			}
			async createWindow(qm) {
				const iE = await PQ.default.create(qm),
					SV = iE.id;
				if (!SV) return;
				this.storage.addWindow(qm.toString(), SV)
			}
			async sendStopRecordMessage(qm) {
				const iE = await chrome.windows.get(qm);
				if (!iE) return;
				const SV = {
					action: TL.MessageAction.STOP_RECORD
				};
				chrome.tabs.query({
					windowId: qm
				}, (qm => {
					qm.forEach((qm => {
						if (qm.id) chrome.tabs.sendMessage(qm.id, SV, (() => {
							const qm = chrome.runtime.lastError;
							if (qm);
						}))
					}))
				}))
			}
			setcontentSettings() {
				const qm = chrome.runtime.id;
				chrome.contentSettings.microphone.set({
					primaryPattern: "*://".concat(qm, "/*"),
					setting: "allow"
				})
			}
			onCloseTab() {
				chrome.tabs.onRemoved.addListener((async qm => {
					const iE = await this.storage.getWindows(),
						SV = iE[qm.toString()];
					if (!SV) return;
					const nu = await PQ.default.windowExists(SV);
					if (!nu) return;
					PQ.default.update(SV), this.sendStopRecordMessage(SV)
				}))
			}
			onActionClick() {
				chrome.action.onClicked.addListener((async qm => {
					const iE = qm.id;
					if (!iE) return;
					const SV = await this.storage.getWindows(),
						nu = SV[iE.toString()];
					if (!nu) this.createWindow(iE);
					else {
						const qm = await PQ.default.windowExists(nu);
						if (!qm) return await this.storage.deleteWindow(iE.toString()), this.createWindow(iE);
						PQ.default.update(nu)
					}
				}))
			}
			async getTargetTabId(qm) {
				const iE = await this.storage.getWindows();
				let SV = "";
				for (const [nu, gD] of Object.entries(iE))
					if (gD === qm) {
						SV = nu;
						break
					} return SV
			}
			async getSettings() {
				return await this.storage.getSettings()
			}
			async setSettings(qm) {
				if (!qm) return;
				this.storage.updateSettings(qm)
			}
			async getWindowIdFromSender(qm) {
				return new Promise((iE => {
					var SV;
					iE((SV = qm.tab) === null || SV === void 0 ? void 0 : SV.windowId)
				}))
			}
			onMessage() {
				chrome.runtime.onMessage.addListener(((qm, iE, SV) => {
					const nu = qm.action;
					switch (nu) {
						case TL.MessageAction.GET_TARGET_TAB_ID:
							this.getWindowIdFromSender(iE).then((qm => {
								if (!qm) return SV("");
								this.getTargetTabId(qm).then((qm => {
									SV(qm)
								}))
							}));
							break;
						case TL.MessageAction.GET_SETTINGS:
							this.getSettings().then((qm => {
								SV(qm)
							}));
							break;
						case TL.MessageAction.SET_SETTINGS:
							this.setSettings(qm.data);
						case TL.MessageAction.GET_USER_MEDIA:
							this.getUserMedia(qm).then((qm => SV(qm)))
					}
					return true
				}))
			}
			async getUserMedia(qm) {
				const iE = await chrome.scripting.executeScript({
					args: [qm.consumerTabId],
					target: {
						tabId: qm.targetTabId
					},
					func: qm => {
						let iE = null;
						try {
							iE = navigator.mediaDevices.getUserMedia(qm)
						} catch (qm) {}
						return iE
					}
				});
				return iE[0]
			}
		}
		const FZ = new Ni;
		FZ.run(), (0, pf.default)("G-754GGNLDJK", "FCZDwChLTbG3IiCPDemxyw")
	}, {
		IC: 1,
		sG: 19,
		ez: 21,
		rR: 22
	}],
	19: [function(qm, iE, SV) {
		"";
		var nu;
		Object.defineProperty(SV, "__esModule", {
				value: true
			}), SV.MessageAction = void 0,
			function(qm) {
				qm["GET_TARGET_TAB_ID"] = "getTargetTabId", qm["GET_SETTINGS"] = "getSettings", qm["SET_SETTINGS"] = "setSettings", qm["STOP_RECORD"] = "stopRecord", qm["GET_USER_MEDIA"] = "getUserMedia"
			}(nu = SV.MessageAction || (SV.MessageAction = {}))
	}, {}],
	20: [function(qm, iE, SV) {
		"";
		var nu;
		Object.defineProperty(SV, "__esModule", {
				value: true
			}), SV.StorageKeys = void 0,
			function(qm) {
				qm["WINDOWS"] = "windows", qm["SETTINGS"] = "settings"
			}(nu = SV.StorageKeys || (SV.StorageKeys = {}))
	}, {}],
	21: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		}), SV.DEFAULT_SETTINGS = void 0;
		const nu = qm("sG");
		SV.DEFAULT_SETTINGS = {
			muteTab: false,
			recordQuality: 32e4,
			saveFormat: "mp3"
		};
		class gD {
			constructor() {
				this.windows = {}, this.settings = SV.DEFAULT_SETTINGS
			}
			static async init() {
				await chrome.storage.local.set({
					[nu.StorageKeys.SETTINGS]: SV.DEFAULT_SETTINGS
				})
			}
			async load() {
				const qm = await chrome.storage.local.get([nu.StorageKeys.SETTINGS]),
					iE = qm[nu.StorageKeys.SETTINGS],
					SV = await chrome.storage.session.get([nu.StorageKeys.WINDOWS]),
					gD = SV[nu.StorageKeys.WINDOWS];
				if (gD) this.windows = gD;
				else this.windows = {};
				if (iE) this.settings = iE
			}
			async updateSettings(qm) {
				await this.load(), this.settings = Object.assign(Object.assign({}, this.settings), qm), await chrome.storage.local.set({
					[nu.StorageKeys.SETTINGS]: this.settings
				})
			}
			async getSettings() {
				return await this.load(), this.settings
			}
			async getWindows() {
				return await this.load(), this.windows
			}
			async addWindow(qm, iE) {
				await this.load(), this.windows[qm] = iE, await chrome.storage.session.set({
					[nu.StorageKeys.WINDOWS]: this.windows
				})
			}
			async deleteWindow(qm) {
				if (await this.load(), qm in this.windows) delete this.windows[qm], await chrome.storage.session.set({
					[nu.StorageKeys.WINDOWS]: this.windows
				})
			}
		}
		SV.default = gD
	}, {
		sG: 20
	}],
	22: [function(qm, iE, SV) {
		"";
		Object.defineProperty(SV, "__esModule", {
			value: true
		});
		class nu {
			static update(qm) {
				chrome.windows.update(qm, {
					focused: true
				})
			}
			static async calculateWindowShift() {
				const qm = {
						leftShift: 0,
						topShift: 0
					},
					iE = await chrome.windows.getCurrent();
				if (iE) qm.leftShift = Math.round(iE.width ? iE.width / 2 - this.width / 2 : 0), qm.topShift = Math.round(iE.height ? iE.height / 2 - this.height / 2 : 0);
				return qm
			}
			static async create(qm) {
				const iE = await nu.calculateWindowShift(),
					SV = await chrome.windows.create({
						type: "popup",
						url: "../html/popup.html?id=" + qm.toString(),
						focused: true,
						height: this.height,
						width: this.width,
						left: iE.leftShift,
						top: iE.topShift
					});
				return SV
			}
			static async windowExists(qm) {
				const iE = await chrome.windows.getAll({
						populate: true
					}),
					SV = iE.some((iE => iE.id === qm));
				return SV
			}
		}
		SV.default = nu, nu.width = 475, nu.height = 510
	}, {}]
}, {}, [18]);
}
