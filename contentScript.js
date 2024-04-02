(function () {

    let statusDiv = null;

    function createStatusDiv() {
        if (statusDiv === null) {
            const existingDiv = document.getElementById('podcastSorterStatusDiv');
            if (existingDiv) {
                statusDiv = existingDiv;
            } else {
                const div = document.createElement('div');
                div.id = 'podcastSorterStatusDiv';
                div.style.position = 'fixed';
                div.style.top = '50%';
                div.style.left = '50%';
                div.style.transform = 'translate(-50%, -50%)';
                div.style.backgroundColor = 'white';
                div.style.padding = '10px';
                div.style.border = '2px solid grey';
                div.style.zIndex = '1000';
                div.style.display = 'none';
                document.body.appendChild(div);
                statusDiv = div;
            }
        }
        return statusDiv;
    }

    function showStatusDiv(message, hideAfter = 2000) {
        const div = createStatusDiv();
        div.textContent = message;
        div.style.display = 'block';

        if (hideAfter !== null) {
            setTimeout(() => {
                div.style.display = 'none';
            }, hideAfter);
        }
    }

    function updateStatus(index, totalPods) {
        const message = index === totalPods - 1 ? 'Podcasts reordered' : `Processing item ${index + 1} of ${totalPods}. Please wait`;
        showStatusDiv(message, null);
    }

    function countPodcasts() {
        const list = document.querySelector('div[role="list"]');

        if (!list) {
            showStatusDiv("Podcast list not found.");
            return 0;
        }

        const items = list.querySelectorAll('.jJ8Epb');
        const count = items.length;
        showStatusDiv(`Number of podcasts: ${count}`);

        return count;
    }

    function removeDecorativeDivs(list) {
        const decorativeDivs = list.querySelectorAll('.GdsSec');
        decorativeDivs.forEach(div => div.remove());
    }

    function addDecorativeDivs(list, pods) {
        pods.forEach((item, index) => {
            list.appendChild(item);
            if (index < pods.length - 1) {
                const decorativeDiv = document.createElement('div');
                decorativeDiv.className = 'GdsSec';
                list.appendChild(decorativeDiv);
            }
        });
    }

    function sortOldestFirst(list) {
        if (!list) return;

        const pods = Array.from(list.querySelectorAll('.jJ8Epb'));
        if (pods.length === 0) return;

        removeDecorativeDivs(list);

        pods.sort((a, b) => {
            const dateA = parseDate(a.querySelector('.c5Vdrc').textContent);
            const dateB = parseDate(b.querySelector('.c5Vdrc').textContent);
            return dateA - dateB;
        });

        addDecorativeDivs(list, pods);
        showStatusDiv(`Podcasts sorted: Oldest first`);

        return pods;
    }

    function sortNewestFirst(list) {
        if (!list) return;

        const pods = Array.from(list.querySelectorAll('.jJ8Epb'));
        if (pods.length === 0) return;

        removeDecorativeDivs(list);

        pods.sort((b, a) => {
            const dateA = parseDate(a.querySelector('.c5Vdrc').textContent);
            const dateB = parseDate(b.querySelector('.c5Vdrc').textContent);
            return dateA - dateB;
        });

        addDecorativeDivs(list, pods);
        showStatusDiv(`Podcasts sorted: Newest first`);

        return pods;
    }

    function parseDate(dateStr) {
        const daysAgoMatch = dateStr.match(/(\d+) days? ago/);
        if (daysAgoMatch) {
            const daysAgo = parseInt(daysAgoMatch[1], 10);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            return date;
        }

        const hoursAgoMatch = dateStr.match(/(\d+) hours? ago/);
        if (hoursAgoMatch) {
            const hoursAgo = parseInt(hoursAgoMatch[1], 10);
            const date = new Date();
            date.setHours(date.getHours() - hoursAgo);
            return date;
        }

        const minutesAgoMatch = dateStr.match(/(\d+) minutes? ago/);
        if (minutesAgoMatch) {
            const minutesAgo = parseInt(minutesAgoMatch[1], 10);
            const date = new Date();
            date.setMinutes(date.getMinutes() - minutesAgo);
            return date;
        }

        const secondsAgoMatch = dateStr.match(/(\d+) seconds? ago/);
        if (secondsAgoMatch) {
            const secondsAgo = parseInt(secondsAgoMatch[1], 10);
            const date = new Date();
            date.setSeconds(date.getSeconds() - secondsAgo);
            return date;
        }

        return new Date(dateStr);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let isSaving = false;

    async function saveListOrder(pods) {
        if (isSaving) return;
        isSaving = true;

        for (const [index, item] of pods.entries()) {
            const addButton = item.querySelector('.bPsqDc');
            if (addButton) {
                updateStatus(index, pods.length);
                addButton.click();
                await sleep(1000);
                addButton.click();
                await sleep(1000);
            }
        }

        showStatusDiv('Podcasts reordered');
        await sleep(1000);
        window.location.reload();
        isSaving = false;
    }

    let sortedPods = null;

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === "sortOldest") {
            sortedPods = sortOldestFirst(document.querySelector("div[role='list']"));
        } else if (request.action === "sortNewest") {
            sortedPods = sortNewestFirst(document.querySelector("div[role='list']"));
        } else if (request.action === "saveListOrder") {
            if (sortedPods) {
                saveListOrder(sortedPods);
            } else {
                console.error("No sorted list available to save.");
            }
        } else if (request.action === "countPodcasts") {
            countPodcasts();
        }
    });
})();