function openTab(tabId) {
    var i, tabcontent, tablinks;
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    document.getElementById(tabId).style.display = "block";

    const buttons = document.getElementsByClassName('tablinks');
    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        if (button.getAttribute('onclick').includes(tabId))
            button.classList.add("active");
    }

    const watchlistDiv = document.getElementById('watchlistDiv');

    if (["stockListDiv", "stockDataDiv", "portfolioDiv"].includes(tabId)) {
        watchlistDiv.style.display = 'block';
    } else {
        watchlistDiv.style.display = 'none';
    }

    if (tabId == "bulkDealersDiv") {
        InitBulkDealers();
    }

    if (tabId == "stockBulkDealsDiv") {
        InitStockBulkDeals();
    }
}

document.body.addEventListener('click', function (evt) {
    if (evt.target.classList.contains('sort') || evt.target.classList.contains('sort-by')) {
        const header = evt.target.closest('th');
        if (!header) { return; } // Quit, not clicked on a cell        
        sortTable(header);
    }
}, false);

function AddWatchlistCode(value, name) {
    try {
        let input = document.createElement("input");
        input.type = "radio";
        input.name = "stockListRadio";
        input.addEventListener('change', () => UpdateWatchList());

        input.value = value;
        input.id = "w" + input.value;

        let label = document.createElement("label");
        label.innerText = name;
        label.setAttribute("for", input.id);

        const watchlistDiv = document.getElementById('watchlistDiv');
        const button = document.getElementById('addWatchlistBtn');

        watchlistDiv.insertBefore(input, button);
        watchlistDiv.insertBefore(label, button);
        return input;
    }
    catch (e) {
        return undefined;
    }
}

function RemoveWatchlistCode(watchlistId) {
    const selectedWatchList = document.getElementById(watchlistId);
    if (selectedWatchList) {
        const selectedLabel = document.querySelector('label[for=' + selectedWatchList.id + ']')
        if (selectedLabel) {
            const watchlistDiv = document.getElementById('watchlistDiv');
            watchlistDiv.removeChild(selectedWatchList);
            watchlistDiv.removeChild(selectedLabel);
            return true;
        }
    }
    return false;
}

function UpdateLoader(showLoader = true, message = undefined) {
    if (showLoader) {
        document.getElementById("loader").style.display = "block";
        document.getElementById("myDiv").style.display = "none";
        message && (document.getElementById("loaderMsg").innerText = message);
    } else {
        document.getElementById("loader").style.display = "none";
        document.getElementById("myDiv").style.display = "block";
    }
}