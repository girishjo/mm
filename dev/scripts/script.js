const dataValidityTable = document.querySelector('#dataValidity');
const listTable = document.querySelector('#stocksList');
const dataTable = document.querySelector('#stockData');
var watchlists = {};
var activeWL, activeWLName;

function loadDataFromLocal() {
    if (localStorage.length > 0) {
        let storedWatchlists = localStorage.getItem("watchlists");
        if (storedWatchlists) {
            const storedData = JSON.parse(storedWatchlists);
            if (typeof storedData == "object") {
                if (Object.keys(storedData).length > 0) {
                    watchlists = { ...storedData };
                }
                else {
                    alert('No saved Watchlist found, loading default watchlists');
                    watchlists = defaultWatchlists;
                    saveDataOnLocal(true, true);
                }
            }
        }
        else {
            watchlists = defaultWatchlists;
            let stocksListValue = localStorage.getItem("stocksList");
            if (stocksListValue) {
                const storedData = JSON.parse(stocksListValue);
                if (storedData instanceof Array) {
                    watchlists[0].data = storedData;
                    saveDataOnLocal(true, true);
                }
            }
        }

        for (const wlValue in watchlists) {
            AddWatchlistCode(wlValue, watchlists[wlValue].name);
        }
        UpdateWatchList();
    }
    else {
        alert('No saved Watchlist found, loading default watchlists');
        watchlists = defaultWatchlists;
        saveDataOnLocal(true, true);
    }
}

function saveDataOnLocal(silentUpdate = false, loadDefault = false) {
    if (!silentUpdate) {
        let listTableObj = toObject(listTable);
        watchlists[activeWL].data = listTableObj;
    }

    let newWatchlists = {};
    if (loadDefault) {
        newWatchlists = watchlists;
    } else {
        const watchListRadios = document.querySelectorAll('input[name="stockListRadio"]');
        for (let i = 0; i < watchListRadios.length; i++) {
            newWatchlists[i] = watchlists[watchListRadios[i].value];
        }
    }

    window.localStorage.setItem("watchlists", JSON.stringify(newWatchlists));
    //window.localStorage.removeItem("stocksList");
    if (!silentUpdate) {
        alert('Watchlists saved');
    }
    window.location.reload();
}

function UpdateWatchList() {
    const selectedWatchList = document.querySelector('input[name="stockListRadio"]:checked');
    if (!selectedWatchList) {
        const firstWatchlist = document.querySelector('input[name="stockListRadio"]');
        if (firstWatchlist) {
            firstWatchlist.checked = true;
            activeWL = firstWatchlist.value;
            activeWLName = document.querySelector('label[for=' + firstWatchlist.id + ']').innerText;
        }
        else {
            activeWL = undefined;
            activeWLName = undefined;
        }
    } else {
        activeWL = selectedWatchList.value;
        activeWLName = document.querySelector('label[for=' + selectedWatchList.id + ']').innerText;
    }
    resetTable(listTable);
    resetTable(dataTable);
    updateListTable(watchlists[activeWL]);

    // if (document.body.clientHeight > window.innerHeight) {
    //     document.body.style.paddingRight = "0px";
    // }
    // else {
    //     document.body.style.paddingRight = "17px";
    // }
}

function AddWatchlist() {
    const watchlistName = document.getElementById('newWatchList');
    const wlName = watchlistName.value.trim();
    if (wlName != '') {
        let i = 0;
        for (let i = 0; i < Object.keys(watchlists).length; i++) {
            if (watchlists[i].name == wlName) {
                alert('Watchlist name should be unique.');
                return false;
            }
        }

        let j = 0;
        while (document.getElementById("w" + j)) {
            j++;
        }

        if (AddWatchlistCode(j + "", wlName)) {
            watchlists[j + ""] = {
                name: wlName
            }
            if (j == 9) {
                document.getElementById('addWatchlistBtn').style.display = 'none';
                document.getElementById('newWatchList').style.display = 'none';
            }
        }
        watchlistName.value = '';
    }
    else {
        alert('Watchlist name is required');
    }
}

function RemoveWatchlist() {
    if (document.querySelectorAll('input[name="stockListRadio"]').length > 1) {
        const selectedWatchList = document.querySelector('input[name="stockListRadio"]:checked');
        if (confirm("It will delete Watchlist: " + activeWLName + ".\r\nProceed?")) {
            if (RemoveWatchlistCode(selectedWatchList.id)) {
                delete watchlists[selectedWatchList.value];
                saveDataOnLocal(true, false);
            }
        }
    }
    else {
        alert('You can not delete the last list');
    }
}

function downloadWatchlists() {
    if (localStorage.length > 0) {
        let stocksListValue = localStorage.getItem("watchlists");
        var a = document.createElement("a");
        a.href = URL.createObjectURL(
            new Blob([stocksListValue], { type: "application/json" })
        );
        a.download = "watchlists.json";
        a.click();
    }
    else {
        alert('No stock in list to download');
    }
}

function loadDefaultWatchLists() {
    if (confirm("It will overwrite your existing data in watchlists. Proceed?")) {
        watchlists = defaultWatchlists;
        saveDataOnLocal(true, true);
    }
}

async function uploadWatchLists() {
    if (confirm("It will overwrite your existing data in watchlists. Proceed?")) {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = async _ => {
            const content = await input.files[0].text();
            watchlists = JSON.parse(content)
            saveDataOnLocal(true, true);
        };
        input.click();
    }
}

function updateListTable(stockList) {
    if (stockList && stockList.data) {
        for (let i = 0; i < stockList.data.length; i++) {
            if (stockList.data[i][0]) {
                const newRow = addEmptyRow(listTable);
                newRow.cells[3].innerText = stockList.data[i][0];
                newRow.cells[4].innerText = stockList.data[i][1];
                newRow.cells[5].innerText = stockList.data[i][2];
                updateDataTable(dataTable, stockList.data[i][0], stockList.data[i][1], stockList.data[i][2]);
            }
        }
    }
    if (listTable.rows.length == 2) {
        addEmptyRow(listTable);
        listTable.parentElement.style.display = 'block';
    }
    updateRowNumber(listTable);
    updateRowNumber(dataTable);
}

function updateDataTable(table, name, nseCode, bseCode, data = undefined, rowIndex = undefined) {
    const stockData = data ? data : MergeStockData(nseData[nseCode], bseData[bseCode]);
    stockData.Name = name;
    if (stockData.PrevClose != undefined && stockData.PrevClose != 0)
        stockData.Change = (stockData.Close - stockData.PrevClose) * 100 / stockData.PrevClose;
    // else
    //     stockData.Change = 'N/A';


    var newRow;
    if (stockData.Name) {
        newRow = addEmptyRow(table, rowIndex);

        if (stockData.History && stockData.History.length > 0) {
            var a = document.createElement('a');
            var linkText = document.createTextNode(stockData.Name);
            a.appendChild(linkText);
            a.title = stockData.Name;
            a.href = "#0";
            const codes = [];
            nseCode && codes.push(nseCode);
            bseCode && codes.push(bseCode);
            a.setAttribute("codes", codes);
            a.setAttribute("onclick", "ShowHistory(this);");
            newRow.cells[1].appendChild(a);
        }
        else {
            newRow.cells[1].innerText = stockData.Name;
        }

        data && (newRow.cells[1].innerText = data.HistoryDate);

        if (settings.configs.t2t && stockData["T2T"]) {
            var t2tLabel = document.createElement('label');
            t2tLabel.classList.add("highlight");
            t2tLabel.innerText = "ST => SM";
            newRow.cells[1].appendChild(t2tLabel);
        }

        if (stockData.BulkDeals && stockData.BulkDeals.length > 0) {
            var a = document.createElement('a');
            let linkTextContent = "Bulk Deal";
            if (stockData.BulkDeals.length > 1) {
                linkTextContent += "s";
            }
            var linkText = document.createTextNode(linkTextContent);
            a.appendChild(linkText);
            a.title = stockData.Name;
            a.href = "#0";
            const codes = [];
            nseCode && codes.push(nseCode);
            bseCode && codes.push(bseCode);
            a.setAttribute("codes", codes);
            a.setAttribute("onclick", "OpenModal(this);");
            data && a.setAttribute("historyDate", data.HistoryDate);
            a.classList.add("highlight");
            newRow.cells[1].appendChild(a);
        }

        if (Number(stockData.Delivery)) {
            newRow.cells[2].innerText = stockData.Delivery.toLocaleString('en-In');
        }
        if (Number(stockData.Total)) {
            newRow.cells[3].innerText = stockData.Total.toLocaleString('en-In');
        }
        if (stockData.Total > 0) {
            const deliveryPercentage = ((stockData.Delivery / stockData.Total) * 100).toFixed(2);

            newRow.cells[4].innerText = deliveryPercentage + " %";
            if (deliveryPercentage >= 75) {
                newRow.classList.add('green-row');
            }
            else if (deliveryPercentage >= 50 && deliveryPercentage < 75) {
                newRow.classList.add('orange-row');
            }
            else {
                newRow.classList.add('red-row');
            }
        }

        if (stockData.Open != undefined) {
            newRow.cells[5].innerText = stockData.Open.toLocaleString('en-In', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        if (stockData.Close != undefined) {
            newRow.cells[6].innerText = stockData.Close.toLocaleString('en-In', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        if (stockData.Change != undefined) {
            newRow.cells[7].innerText = stockData.Change;
            if (Number(stockData.Change) != NaN) {
                newRow.cells[7].innerText = stockData.Change.toFixed(2).toLocaleString('en-In') + " %";
            }
        }
    }

    return newRow;
}

listTable.addEventListener('click', function (e) {
    const cell = e.target.closest('td');
    if (!cell) { return; } // Quit, not clicked on a cell
    const row = cell.parentElement;
    if (cell.classList.contains('add')) {
        addEmptyRow(listTable, row.rowIndex + 1);
        updateRowNumber(listTable);
    }
    else if (cell.classList.contains('remove')) {
        listTable.deleteRow(row.rowIndex);
        if (listTable.rows.length == 2) {
            addEmptyRow(listTable);
        }
        updateRowNumber(listTable);
    }
});
