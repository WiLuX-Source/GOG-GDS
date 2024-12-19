const cookies = PropertiesService.getScriptProperties().getProperty("cookie");
const webhook_url = PropertiesService.getScriptProperties().getProperty("webhook");
const claim_url = "https://www.gog.com/giveaway/claim";
// Settings

/**
 * Extracts cookies from a Set-Cookie header.
 * @param {string | string[]} setCookieHeader
 * @returns {string | undefined}
 */
function extractCookies(setCookieHeader) {
	if (Array.isArray(setCookieHeader)) {
		let cookieString = "csrf=true;";
		cookieString += setCookieHeader.map((header) => header.split(";")[0]).join("; ");
		return cookieString;
	}
	return undefined;
}
/**
 * Makes a request to claim url and sends response to webhook.
 */
function fetchClaim() {
	/**
	 * @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions}
	 */
	const options = {
		method: "get",
		headers: {
			Cookie: cookies,
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gejavacko) Chrome/117.0.0.0 Safari/537.36",
		},
		muteHttpExceptions: true,
	};
	const response = UrlFetchApp.fetch(claim_url, options);
	let response_str = response.getContentText();
	let response_code = response.getResponseCode();
	let response_cookies = response.getAllHeaders()["Set-Cookie"];
	switch (response_code) {
		case 409:
			Logger.log("Already claimed.");
			break;
		case 404:
			Logger.log("No giveaway is present.");
			break;
		case 401:
			Logger.log("Unauthorized");
			sendMessage("Got: `Unauthorized` response please reinput your tokens.");
			break;
		case 201:
			Logger.log("Claimed a game!");
			sendMessage("Claimed a game!");
			toggleNewsletter();
			break;
		default:
			Logger.log("Unexpected");
			sendMessage(`Got: \`Unexpected\` please report this issue at github repo\nCode: ${response_code}\nResponse: ${response_str}`);
			break;
	}
	let cookies_new = extractCookies(response_cookies);
	if (!cookies_new) {
		Logger.log("Couldn't get new cookies");
		sendMessage("Couldn't refresh cookies.");
		return;
	}
	PropertiesService.getScriptProperties().setProperty("cookie", cookies_new);
	Logger.log("Refreshed cookies successfully.");
}
/**
 * Sends a message to discord webhook.
 * @param {string} data
 */
function sendMessage(data) {
	let payload = JSON.stringify({
		username: "GOG GDS",
		content: data,
	});
	/**
	 * @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions}
	 */
	const options = {
		method: "post",
		contentType: "application/json",
		payload: payload,
		muteHttpExceptions: true,
	};
	UrlFetchApp.fetch(webhook_url, options);
}
/**
 * Toggles newsletter subscription
 */
function toggleNewsletter() {
	/**
	 * @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions}
	 */
	const options = {
		method: "post",
		muteHttpExceptions: true,
		headers: {
			cookie: cookies,
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gejavacko) Chrome/117.0.0.0 Safari/537.36",
			Referer: "https://www.gog.com/en/account/settings/subscriptions",
			"Referrer-Policy": "strict-origin-when-cross-origin",
		},
	};
	const response = UrlFetchApp.fetch("https://www.gog.com/account/switch_marketing_consent_switch", options);
	if (response.getResponseCode() === 200) {
		Logger.log("Unsubscribed newsletter.");
	} else {
		Logger.log("Failed to unsubscribe newsletter.");
	}
}
function main() {
	if (!webhook_url) {
		Logger.log("You didn't specify webhook.");
		return;
	}

	if (!cookies) {
		Logger.log("You didn't specify cookies.");
		return;
	}
	fetchClaim();
}
