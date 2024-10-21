chrome.runtime.onInstalled.addListener(() => {
    console.log("Tab Sleep Timer Extension Installed");
});

chrome.alarms.onAlarm.addListener((alarm) => {
    const tabId = parseInt(alarm.name, 10);
    console.log(`Alarm triggered for tab ${tabId}`);
    chrome.tabs.remove(tabId, () => {
        console.log(`Tab ${tabId} closed`);
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message);
    if (message.command === "setTimer") {
        const { tabId, time, unit, specificTime } = message;

        if (specificTime) {
            const now = new Date();
            const targetTime = new Date(specificTime);
            const delayInMinutes = (targetTime - now) / 60000;
            if (delayInMinutes > 0) {
                chrome.alarms.create(tabId.toString(), { delayInMinutes });
                console.log(`Timer set for tab ${tabId} to close at ${specificTime}`);
                sendResponse({ status: "Timer set" });
            } else {
                console.log("Specified time is in the past");
                sendResponse({ status: "Failed", reason: "Specified time is in the past" });
            }
        } else {
            let delayInMinutes;
            switch (unit) {
                case 'seconds':
                    delayInMinutes = time / 60;
                    break;
                case 'minutes':
                    delayInMinutes = time;
                    break;
                case 'hours':
                    delayInMinutes = time * 60;
                    break;
                default:
                    console.log("Invalid time unit");
                    sendResponse({ status: "Failed", reason: "Invalid time unit" });
                    return;
            }
            chrome.alarms.create(tabId.toString(), { delayInMinutes });
            console.log(`Timer set for tab ${tabId} to close in ${time} ${unit}`);
            sendResponse({ status: "Timer set" });
        }
    }
});