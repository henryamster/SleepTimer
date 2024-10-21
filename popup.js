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

document.getElementById('setTimer').addEventListener('click', () => {
    const time = parseInt(document.getElementById('time').value, 10);
    const unit = document.getElementById('unit').value;
    const specificTime = document.getElementById('specificTime').value;

    if (specificTime) {
        const now = new Date();
        const [hours, minutes] = specificTime.split(':');
        const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        if (targetTime < now) {
            targetTime.setDate(targetTime.getDate() + 1); // Set for the next day if time has passed
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.runtime.sendMessage({ command: "setTimer", tabId, specificTime: targetTime.toString() }, (response) => {
                if (response.status === "Timer set") {
                    alert(`Timer set to close tab at ${specificTime}`);
                } else {
                    alert(`Failed to set timer: ${response.reason}`);
                }
            });
        });
    } else if (!isNaN(time) && time > 0) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.runtime.sendMessage({ command: "setTimer", tabId, time, unit }, (response) => {
                if (response.status === "Timer set") {
                    alert(`Timer set for ${time} ${unit}`);
                } else {
                    alert(`Failed to set timer: ${response.reason}`);
                }
            });
        });
    } else {
        alert("Please enter a valid time or specific time.");
    }
});