const cookies = PropertiesService.getScriptProperties().getProperty("cookie");
const webhook_url = PropertiesService.getScriptProperties().getProperty("webhook");
const claim_url = "https://www.gog.com/giveaway/claim";
const user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36";
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
			"User-Agent": user_agent,
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
			// Utilities.sleep(1000); // testing..
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
	return;
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
			"User-Agent": user_agent,
			Referer: "https://www.gog.com/en/account/settings/subscriptions",
			"Referrer-Policy": "strict-origin-when-cross-origin",
		},
	};
	const newsletter_urls = [
		"https://www.gog.com/account/save_newsletter_subscription/5353f0f4-3c06-11ee-b0fc-fa163ec9fc5f/0", // marketing
		"https://www.gog.com/account/save_newsletter_subscription/6c5a3004-18f1-11ea-92a9-00163e4e09cc/0", // wishlist
		"https://www.gog.com/account/save_newsletter_subscription/6c689b94-18f1-11ea-9c45-00163e4e09cc/0", // promotions and hot deals
		"https://www.gog.com/account/save_newsletter_subscription/6c6ab0f0-18f1-11ea-b12a-00163e4e09cc/0", // releases
	];
	// https://www.gog.com/account/switch_marketing_consent_switch was unreliable.
	Promise.all(newsletter_urls.map((url) => UrlFetchApp.fetch(url, options).getResponseCode()))
		.then((responses) => {
			responses.map((response, index) => {
				if (response !== 200) sendMessage("There is a problem with newsletter subscription: " + index);
			});
		})
		.catch((error) => {
			Logger.log(error);
		});
	return;
}
/**
 * Main function supposed to be run in triggers.
 */
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
