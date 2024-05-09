(function () {
    let statusDiv = null;
    let isSaving = false;
    let sortedPods = null;

    // Helper function for creating or retrieving the status div
    function getStatusDiv() {
        if (!statusDiv) {
            statusDiv = document.getElementById('podcastSorterStatusDiv') || createStatusDiv();
        }
        return statusDiv;
    }

    // Function to create a new status div
    function createStatusDiv() {
        const div = document.createElement('div');
        div.id = 'podcastSorterStatusDiv';
        Object.assign(div.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '10px',
            border: '2px solid grey',
            zIndex: '1000',
            display: 'none',
        });
        document.body.appendChild(div);
        return div;
    }

    // Function to show the status div with a message for a given duration
    function showStatusDiv(message, hideAfter = 2000) {
        const div = getStatusDiv();
        div.textContent = message;
        div.style.display = 'block';

        if (hideAfter !== null) {
            setTimeout(() => {
                div.style.display = 'none';
            }, hideAfter);
        }
    }

    // Function to update the status while processing
    function updateStatus(index, totalPods) {
        const message = index === totalPods - 1
            ? 'Podcasts reordered'
            : `Processing item ${index + 1} of ${totalPods}. Please wait`;
        showStatusDiv(message, null);
    }

    // Function to count the number of podcasts
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

    // Function to remove decorative divs from the list
    function removeDecorativeDivs(list) {
        list.querySelectorAll('.GdsSec').forEach(div => div.remove());
    }

    // Function to add decorative divs to the list
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

    // Function to parse a date from a string
    function parseDate(dateStr) {
        const timeUnits = {
            days: 86400,
            hours: 3600,
            minutes: 60,
            seconds: 1
        };

        for (const [unit, ms] of Object.entries(timeUnits)) {
            const match = dateStr.match(new RegExp(`(\\d+) ${unit}? ago`));
            if (match) {
                const value = parseInt(match[1], 10);
                return new Date(Date.now() - value * ms);
            }
        }

        return new Date(dateStr);
    }
    
    // Function to parse time from a string
    function parseTime(timeStr) {
        const timeUnits = {
            'hr': 3600,
            'min': 60,
            'sec': 1
        };
    
        let totalSeconds = 0;
        timeStr = timeStr.replace(' left', '');
    
        const timeRegex = /(\d+)\s*([a-zA-Z]+)/g;
        let match;
    
        while ((match = timeRegex.exec(timeStr)) !== null) {
            const value = parseInt(match[1], 10);
            const unit = match[2].toLowerCase();
            const seconds = value * (timeUnits[unit] || 0);
            totalSeconds += seconds;
        }
    
        return totalSeconds
    }
    

    // Function to sort podcasts by date
    function sortDate(list, order) {
        if (!list) return;

        const pods = Array.from(list.querySelectorAll('.jJ8Epb'));
        if (pods.length === 0) return;

        removeDecorativeDivs(list);

        pods.sort((a, b) => {
            const dateA = parseDate(a.querySelector('.c5Vdrc').textContent);
            const dateB = parseDate(b.querySelector('.c5Vdrc').textContent);
            return order === "newest" ? dateA - dateB : dateB - dateA;
        });

        addDecorativeDivs(list, pods);
        showStatusDiv(`Podcasts sorted: ${order === "newest" ? "Oldest" : "Newest"} first`);

        return pods;
    }

        // Function to sort podcasts by time
        function sortTime(list, order) {
            if (!list) return;
        
            const pods = Array.from(list.querySelectorAll('.jJ8Epb'));
            if (pods.length === 0) return;
        
            removeDecorativeDivs(list);
        
            pods.sort((a, b) => {
                const elementA = a.querySelector('.gUJ0Wc');
                const elementB = b.querySelector('.gUJ0Wc');
        
                const timeA = elementA ? parseTime(elementA.textContent) : 0;
                const timeB = elementB ? parseTime(elementB.textContent) : 0;
        
                return order === "shortest" ? timeA - timeB : timeB - timeA;
            });


        
            addDecorativeDivs(list, pods);
            showStatusDiv(`Podcasts sorted: ${order === "shortest" ? "Shortest" : "Longest"} first`);
        
            return pods;
        }

    // Function to sleep for a specified number of milliseconds
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Function to save the order of the podcast list
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

    // Handle incoming messages
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        const list = document.querySelector("div[role='list']");
        if (request.action === "sortOldest") {
            sortedPods = sortDate(list, 'newest');
        } else if (request.action === "sortNewest") {
            sortedPods = sortDate(list, 'oldest');
        } else if (request.action === "sortShortest") {
            sortedPods = sortTime(list, 'shortest');
        } else if (request.action === "sortLongest") {
            sortedPods = sortTime(list, 'longest');
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
