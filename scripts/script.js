const dataValidityTable = document.querySelector('#dataValidity');
const listTable = document.querySelector('#stocksList');
const dataTable = document.querySelector('#stockData');
const portfolioTable = document.querySelector('#portfolioTable');

var watchlists = {};
var activeWL;

function loadDataFromLocal() {
    if (localStorage.length > 0) {
        let storedWatchlists = localStorage.getItem("watchlists");
        if (storedWatchlists) {
            const storedData = JSON.parse(storedWatchlists);
            if (typeof storedData == "object") {
                if (Object.keys(storedData).length > 0) {
                    UpdateLoader(true, "Loading local Watchlists", 0.5);
                    watchlists = { ...storedData };
                }
                else {
                    ShowMessage('No saved Watchlist found, loading default watchlists');
                    watchlists = defaultWatchlists;
                    //saveDataOnLocal(true, true);
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
                    //saveDataOnLocal(true, true);
                }
            }
        }
        let aWL = localStorage.getItem("activeWL");
        if (aWL && watchlists[aWL]) {
            activeWL = aWL;
        }
    }
    else {
        ShowMessage('No saved Watchlist found, loading default watchlists');
        watchlists = defaultWatchlists;
        //saveDataOnLocal(true, true);
    }
    ResetWatchlist(false);
    UpdateLoader(false);
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
    // window.localStorage.removeItem("stocksList");
    if (!silentUpdate) {
        ShowMessage('Watchlists saved');
    }
    // window.location.reload();
}

function ResetWatchlist(deleteExisting = true) {
    if (deleteExisting) {
        const watchlistsRadios = document.querySelectorAll('input[name="stockListRadio"]');
        for (let i = 0; i < watchlistsRadios.length; i++) {
            RemoveWatchlistCode(watchlistsRadios[i].id);
        }
    }
    let j = 0;
    for (const wlValue in watchlists) {
        AddWatchlistCode(wlValue, watchlists[wlValue].name);
        j++;
    }
    if (j >= 9) {
        document.getElementById('addWatchlistBtn').style.display = 'none';
        document.getElementById('newWatchList').style.display = 'none';
    }
    UpdateLoader(true, "Loading Watchlists", 0.5);
    UpdateWatchList(!deleteExisting);
    UpdateLoader(false);
}

function UpdateWatchList(saveLast = true) {
    const lastSelectedWL = activeWL;
    const selectedWatchList = document.querySelector('input[name="stockListRadio"]:checked');
    if (!selectedWatchList) {
        const lastSelected = document.querySelector('input[name="stockListRadio"][value="' + activeWL + '"]');
        if (lastSelected) {
            lastSelected.checked = true;
        }
        else {
            const firstWatchlist = document.querySelector('input[name="stockListRadio"]');
            if (firstWatchlist) {
                firstWatchlist.checked = true;
                activeWL = firstWatchlist.value;
            }
            else {
                activeWL = undefined;
            }
        }
    } else {
        activeWL = selectedWatchList.value;
    }

    if (document.getElementById("stockListDiv").style.display == "block") {
        UpdateLoader(true, "Loading Watchlists", 0.5);
        if (saveLast && lastSelectedWL != activeWL) {
            watchlists[lastSelectedWL].data = toObject(listTable);
        }
        resetTable(listTable);
        updateListTable(watchlists[activeWL]);
        AddMoveToContent();
        updateRowNumber(listTable);
        UpdateLoader(false);
    }

    if (document.getElementById("stockDataDiv").style.display == "block") {
        UpdateLoader(true, "Loading stock data", 0.5);
        resetTable(dataTable);
        const stockList = watchlists[activeWL];
        if (stockList && stockList.data) {
            for (let i = 0; i < stockList.data.length; i++) {
                if (stockList.data[i][0]) {
                    updateDataTable(dataTable, stockList.data[i][0], stockList.data[i][1], stockList.data[i][2]);
                }
            }
        }
        updateRowNumber(dataTable);
        UpdateLoader(false);
    }

    if (document.getElementById("portfolioDiv").style.display == "block") {
        const portfolioDateInput = document.getElementById('portfolioDate');
        if (portfolioDateInput && portfolioDateInput.value) {
            // Use date-specific portfolio function
            UpdatePortfolioForDate();
        } else {
            // Fallback to regular portfolio function for today
            UpdateLoader(true, "Loading Portfolio data", 0.5);
            resetTable(portfolioTable);
            upadtePortfolioTable(watchlists[activeWL].data);
            updateRowNumber(portfolioTable);
            UpdateLoader(false);
        }
    }

    window.localStorage.setItem("activeWL", activeWL);
}

function AddMoveToContent() {
    const ddlMoveToWatchlist = document.getElementById('ddlMoveToWatchlist');
    ddlMoveToWatchlist.innerHTML = '';

    ddlMoveToWatchlist.appendChild(new Option("Select watchlist", "-1"));
    for (const wlValue in watchlists) {
        if (wlValue != activeWL) {
            ddlMoveToWatchlist.appendChild(new Option(watchlists[wlValue].name, wlValue));
        }
    }
}

function MoveStock() {
    var modal = document.getElementById("watchlistModal");
    const otherWatchlistsDiv = document.getElementById('otherWatchlistsDiv');
    const stockDetailsValue = otherWatchlistsDiv.getAttribute("stockDetails");

    const ddlMoveToWatchlist = document.getElementById('ddlMoveToWatchlist');
    if (stockDetailsValue != undefined && ddlMoveToWatchlist.value != -1) {
        const stockDetails = JSON.parse(stockDetailsValue);

        const newData = [
            stockDetails.stockName,
            stockDetails.stockNseCode,
            stockDetails.stockBseCode,
            stockDetails.stockQuantity,
            stockDetails.stockPrice
        ];
        if (settings.configs.moveStockTo == "top") {
            watchlists[ddlMoveToWatchlist.value].data.unshift(newData);
        } else {
            watchlists[ddlMoveToWatchlist.value].data.push(newData);
        }

        listTable.deleteRow(stockDetails.rowIndex);
        //watchlists[activeWL].data = toObject(listTable);
        if (listTable.rows.length == 2) {
            addEmptyRow(listTable);
        }
        updateRowNumber(listTable);
        ddlMoveToWatchlist.value = -1;
    }

    document.body.removeAttribute('modal-shown');
    document.body.classList.remove('modal-shown');
    modal.style.display = "none";
}

document.getElementById("watchlistModalCloser").onclick = function () {
    var modal = document.getElementById("watchlistModal");
    document.body.removeAttribute('modal-shown');
    document.body.classList.remove('modal-shown');
    modal.style.display = "none";
}

function AddWatchlist() {
    const watchlistName = document.getElementById('newWatchList');
    const wlName = watchlistName.value.trim();
    if (wlName != '') {
        let i = 0;
        for (const key of Object.keys(watchlists)) {
            if (watchlists[key].name == wlName) {
                alert('Watchlist name should be unique.');
                return false;
            }
        }

        let j = 0;
        while (document.getElementById("w" + j)) {
            j++;
        }

        const newWatchlist = AddWatchlistCode(j + "", wlName);
        if (newWatchlist != undefined) {
            watchlists[j + ""] = {
                name: wlName
            }
            if (j >= 9) {
                document.getElementById('addWatchlistBtn').style.display = 'none';
                document.getElementById('newWatchList').style.display = 'none';
            }
            saveDataOnLocal(true, false);
            newWatchlist.checked = true;
            UpdateWatchList();
            openTab('stockListDiv');
        }
        else {
            ShowMessage('Error in adding watchlist');
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
        if (confirm("It will delete Watchlist: " + watchlists[selectedWatchList.value].name + ".\r\nProceed?")) {
            if (RemoveWatchlistCode(selectedWatchList.id)) {
                delete watchlists[selectedWatchList.value];
                saveDataOnLocal(true, false);
                if (Object.keys(watchlists).length < 10) {
                    document.getElementById('addWatchlistBtn').style.display = '';
                    document.getElementById('newWatchList').style.display = '';
                }
                UpdateWatchList(false);
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

        if (!chkWLWithPFData.checked) {
            stocksListValue = JSON.parse(stocksListValue);
            for (let wlValue in stocksListValue) {
                for (let i = 0; i < stocksListValue[wlValue].data.length; i++) {
                    var stock = stocksListValue[wlValue].data[i];
                    stock.length > 3 && stock.splice(3, 2);
                }
            }
            stocksListValue = JSON.stringify(stocksListValue);
        }

        let a = document.createElement("a");
        a.href = URL.createObjectURL(
            new Blob([stocksListValue], { type: "application/json" })
        );
        a.download = "watchlists.json";
        a.click();
        chkWLWithPFData.checked = false;
        ShowMessage('Watchlist export successful');
    }
    else {
        alert('No stock in list to download');
    }
}

function loadDefaultWatchLists() {
    if (confirm("It will overwrite any unsaved data in watchlists. Proceed?")) {
        watchlists = defaultWatchlists;
        //saveDataOnLocal(true, true);
        ResetWatchlist(true);
    }
}

async function uploadWatchLists() {
    if (confirm("It will overwrite your existing data in watchlists. Proceed?")) {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = async _ => {
            const content = await input.files[0].text();
            watchlists = JSON.parse(content);
            saveDataOnLocal(true, true);
            ShowMessage('Watchlist import successful');
            ResetWatchlist(true);
        };
        input.click();
    }
}

function updateListTable(stockList) {
    if (stockList && stockList.data) {
        for (let i = 0; i < stockList.data.length; i++) {
            if (stockList.data[i][0]) {
                const newRow = addEmptyRow(listTable);
                newRow.cells[4].innerText = stockList.data[i][0];
                newRow.cells[5].innerText = stockList.data[i][1];
                newRow.cells[6].innerText = stockList.data[i][2];
                stockList.data[i][3] && (newRow.cells[7].innerText = stockList.data[i][3]);
                stockList.data[i][4] && (newRow.cells[8].innerText = stockList.data[i][4]);
            }
        }
    }
    if (listTable.rows.length == 2) {
        addEmptyRow(listTable);
    }
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
            codes.push(nseCode || undefined);
            codes.push(bseCode || undefined);
            a.setAttribute("codes", codes.join(','));
            a.setAttribute("onclick", "ShowHistory(this);");
            newRow.cells[1].appendChild(a);
        }
        else {
            newRow.cells[1].innerText = stockData.Name;
        }

        data && (newRow.cells[1].innerText = data.HistoryDate);

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
            codes.push(nseCode || undefined);
            codes.push(bseCode || undefined);
            a.setAttribute("codes", codes.join(','));
            a.setAttribute("onclick", "ShowBulkDeal(this);");
            data && a.setAttribute("historyDate", data.HistoryDate);
            a.classList.add("highlightDeals");
            newRow.cells[1].appendChild(a);
        }

        if (settings.configs.t2t && stockData["T2T"] != undefined) {
            var t2tLabel = document.createElement('label');
            t2tLabel.classList.add("highlight");
            t2tLabel.innerText = settings.configs.t2tTexts[stockData["T2T"]];
            t2tLabel.title = "Exit from T2T on: " + stockData["T2TExitDate"];
            newRow.cells[1].appendChild(t2tLabel);
        }

        if (Number(stockData.Total)) {
            newRow.cells[2].innerText = stockData.Total.toLocaleString('en-In');
        }
        if (Number(stockData.Delivery)) {
            newRow.cells[3].innerText = stockData.Delivery.toLocaleString('en-In');
        }
        if (stockData.Total > 0) {
            const deliveryPercentage = ((stockData.Delivery / stockData.Total) * 100).toCustomString(2);

            newRow.cells[4].innerText = deliveryPercentage + " %";
            if (deliveryPercentage >= 75) {
                newRow.cells[2].classList.add('positive');
                newRow.cells[3].classList.add('positive');
                newRow.cells[4].classList.add('positive');
            }
            else if (deliveryPercentage >= 50 && deliveryPercentage < 75) {
                newRow.cells[2].classList.add('neutral');
                newRow.cells[3].classList.add('neutral');
                newRow.cells[4].classList.add('neutral');
            }
            else {
                newRow.cells[2].classList.add('negative');
                newRow.cells[3].classList.add('negative');
                newRow.cells[4].classList.add('negative');
            }

            if (nseData[nseCode] && bseData[bseCode]) {
                if (nseData[nseCode].Total == undefined || bseData[bseCode].Total == undefined) {
                    newRow.cells[2].classList.add('attention');
                    newRow.cells[3].classList.add('attention');
                    newRow.cells[4].classList.add('attention');

                    const msg = "Delivery data from " + (nseData[nseCode].Total == undefined ? "NSE" : "BSE") + " not came yet";
                    newRow.cells[2].title = msg;
                    newRow.cells[3].title = msg;
                    newRow.cells[4].title = msg;
                }
            }
        }

        if (stockData.Open != undefined) {
            newRow.cells[5].innerText = stockData.Open.toCustomString(2);
        }
        if (stockData.Close != undefined) {
            newRow.cells[6].innerText = stockData.Close.toCustomString(2);
        }
        if (stockData.Change != undefined) {
            newRow.cells[7].innerText = stockData.Change;
            if (Number(stockData.Change) != NaN) {
                newRow.cells[7].innerText = stockData.Change.toCustomString(2) + " %";
                if (stockData.Change > 0) {
                    newRow.cells[5].classList.add('positive');
                    newRow.cells[6].classList.add('positive');
                    newRow.cells[7].classList.add('positive');
                }
                else if (stockData.Change == 0) {
                    newRow.cells[5].classList.add('neutral');
                    newRow.cells[6].classList.add('neutral');
                    newRow.cells[7].classList.add('neutral');
                }
                else {
                    newRow.cells[5].classList.add('negative');
                    newRow.cells[6].classList.add('negative');
                    newRow.cells[7].classList.add('negative');
                }
            }
            if (stockData.PrevClose != undefined) {
                newRow.cells[7].title = "from " + stockData.PrevClose.toCustomString(2);
            }
        }
    }

    return newRow;
}

function upadtePortfolioTable(stockList) {
    let totalInvestment = 0, currentValue = 0, dayPnL = 0;
    let flag = false;
    let refs1 = [];
    let refs2 = [];

    for (let i = 0; i < stockList.length; i++) {
        let columnCounter = 1;
        if (stockList[i][0]) {
            const stockDetails = stockList[i];
            let newRow;
            if (stockDetails[0] && stockDetails[3] && stockDetails[3] != 0) {
                let stockData = { ...MergeStockData(nseData[stockDetails[1]], bseData[stockDetails[2]]) };
                newRow = addEmptyRow(portfolioTable);

                // name
                newRow.cells[columnCounter++].innerText = stockDetails[0];
                if (stockDetails[3] && stockDetails[3] != 0) {

                    // qty
                    newRow.cells[columnCounter++].innerText = stockDetails[3];

                    // buy avg
                    newRow.cells[columnCounter++].innerText = stockDetails[4].toCustomString(2);
                    totalInvestment += stockDetails[3] * stockDetails[4];

                    // buy value
                    newRow.cells[columnCounter++].innerText = (stockDetails[3] * stockDetails[4]).toCustomString();

                    // pf %
                    refs1.push(newRow.cells[columnCounter]);
                    newRow.cells[columnCounter++].innerText = stockDetails[3] * stockDetails[4];

                    let lastClosing = undefined;
                    if (!stockData.Close && stockData.History && stockData.History.length > 0) {
                        lastClosing = stockData.History[0].Close;
                    }
                    if (stockData.Close != undefined || lastClosing != undefined) {
                        // close
                        newRow.cells[columnCounter++].innerText = (stockData.Close || lastClosing).toCustomString(2);
                        currentValue += stockDetails[3] * (stockData.Close || lastClosing);

                        // present value
                        newRow.cells[columnCounter++].innerText = (stockDetails[3] * (stockData.Close || lastClosing)).toCustomString();

                        // pf %
                        refs2.push(newRow.cells[columnCounter]);
                        newRow.cells[columnCounter++].innerText = stockDetails[3] * (stockData.Close || lastClosing);

                        // p&l
                        newRow.cells[columnCounter++].innerText = (stockDetails[3] * ((stockData.Close || lastClosing) - stockDetails[4])).toCustomString();
                        const netChange = ((stockData.Close || lastClosing) - stockDetails[4]) * 100 / stockDetails[4];

                        // net chg %
                        newRow.cells[columnCounter++].innerText = netChange.toCustomString(2) + " %";
                        if ((netChange > 0 && stockDetails[3] > 0) || (netChange < 0 && stockDetails[3] < 0)) {
                            newRow.cells[columnCounter - 2].style.color = 'green';
                            newRow.cells[columnCounter - 1].style.color = 'green';
                        }
                        else if ((netChange < 0 && stockDetails[3] > 0) || (netChange > 0 && stockDetails[3] < 0)) {
                            newRow.cells[columnCounter - 2].style.color = 'red';
                            newRow.cells[columnCounter - 1].style.color = 'red';
                        }

                        if (stockData.PrevClose != undefined && stockData.PrevClose != 0) {
                            if (!stockData.History || stockData.History.length == 0) {
                                stockData.PrevClose = stockDetails[4];
                            }
                            stockData.Change = ((stockData.Close || lastClosing) - stockData.PrevClose) * 100 / stockData.PrevClose;
                            let dayAbsoluteChange = stockDetails[3] * ((stockData.Close || lastClosing) - stockData.PrevClose);
                            dayPnL += dayAbsoluteChange;

                            // day chg
                            newRow.cells[columnCounter++].innerText = dayAbsoluteChange.toCustomString();

                            // day chg %
                            newRow.cells[columnCounter++].innerText = stockData.Change.toCustomString(2) + " %"
                            if ((stockData.Change > 0 && stockDetails[3] > 0) || (stockData.Change < 0 && stockDetails[3] < 0)) {
                                newRow.cells[columnCounter - 2].style.color = 'green';
                                newRow.cells[columnCounter - 1].style.color = 'green';
                            }
                            else if ((stockData.Change < 0 && stockDetails[3] > 0) || (stockData.Change > 0 && stockDetails[3] < 0)) {
                                newRow.cells[columnCounter - 2].style.color = 'red';
                                newRow.cells[columnCounter - 1].style.color = 'red';
                            }
                        }
                        else {

                            // day chg
                            newRow.cells[columnCounter++].innerText = 0;

                            // day chg %
                            newRow.cells[columnCounter++].innerText = (0).toFixed(2).toLocaleString('en-In') + " %"
                        }

                        if (stockData.Close == undefined) {
                            newRow.cells[6].classList.add('attention');
                            newRow.cells[7].classList.add('attention');
                            newRow.cells[8].classList.add('attention');
                            newRow.cells[9].classList.add('attention');
                            newRow.cells[10].classList.add('attention');

                            newRow.cells[6].title = "Last closing price taken";
                            newRow.cells[7].title = "Calculated from last closing price";
                            newRow.cells[8].title = "Calculated from last closing price";
                            newRow.cells[9].title = "Calculated from last closing price";
                            newRow.cells[10].title = "Calculated from last closing price";
                            flag = true;
                        }
                    }
                }
            }
        }
    }

    if (totalInvestment != 0) {
        for (let i = 0; i < refs1.length; i++) {
            refs1[i].innerText = (refs1[i].innerText * 100 / totalInvestment).toCustomString(2) + " %";
        }

        for (let i = 0; i < refs2.length; i++) {
            refs2[i].innerText = (refs2[i].innerText * 100 / currentValue).toCustomString(2) + " %";
        }

        const newRow = addEmptyRow(portfolioTable);
        newRow.setAttribute("frozen", true);
        newRow.cells[1].innerText = "Total = ";
        newRow.cells[4].innerText = totalInvestment.toCustomString();
        newRow.cells[5].innerText = (100).toCustomString(2) + " %";
        newRow.cells[7].innerText = currentValue.toCustomString();
        newRow.cells[8].innerText = (100).toCustomString(2) + " %";
        newRow.cells[9].innerText = (currentValue - totalInvestment).toCustomString();
        newRow.cells[10].innerText = ((currentValue - totalInvestment) * 100 / totalInvestment).toCustomString(2) + " %";
        if ((currentValue - totalInvestment) > 0) {
            newRow.cells[9].style.color = 'green';
            newRow.cells[10].style.color = 'green';
        }
        else if ((currentValue - totalInvestment) < 0) {
            newRow.cells[9].style.color = 'red';
            newRow.cells[10].style.color = 'red';
        }
        newRow.cells[11].innerText = dayPnL.toCustomString();
        newRow.cells[12].innerText = (dayPnL * 100 / (currentValue - dayPnL)).toCustomString(2) + " %";

        if (dayPnL > 0) {
            newRow.cells[11].style.color = 'green';
            newRow.cells[12].style.color = 'green';
        }
        else if (dayPnL < 0) {
            newRow.cells[11].style.color = 'red';
            newRow.cells[12].style.color = 'red';
        }

        if (flag) {
            newRow.cells[7].classList.add('attention');
            newRow.cells[8].classList.add('attention');
            newRow.cells[9].classList.add('attention');
            newRow.cells[10].classList.add('attention');
            newRow.cells[11].classList.add('attention');
            newRow.cells[12].classList.add('attention');

            newRow.cells[7].title = "For some stocks, it is calculated from their last closing price";
            newRow.cells[8].title = "For some stocks, it is calculated from their last closing price";
            newRow.cells[9].title = "For some stocks, it is calculated from their last closing price";
            newRow.cells[10].title = "For some stocks, it is calculated from their last closing price";
            newRow.cells[11].title = "Partial data";
            newRow.cells[12].title = "Partial data";
        }
    }
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
    else if (cell.classList.contains('move')) {
        if (listTable.rows[row.rowIndex].cells[4].innerText.trim() != '') {
            const stockDetails = {
                rowIndex: row.rowIndex,
                stockName: listTable.rows[row.rowIndex].cells[4].innerText,
                stockNseCode: listTable.rows[row.rowIndex].cells[5].innerText,
                stockBseCode: listTable.rows[row.rowIndex].cells[6].innerText,
                stockQuantity: listTable.rows[row.rowIndex].cells[7].innerText,
                stockPrice: listTable.rows[row.rowIndex].cells[8].innerText
            };

            const otherWatchlistsDiv = document.getElementById('otherWatchlistsDiv');
            otherWatchlistsDiv.setAttribute("stockDetails", JSON.stringify(stockDetails));

            var modal = document.getElementById("watchlistModal");
            modal.style.display = "block";
            document.body.setAttribute('modal-shown', true);
            document.body.classList.add('modal-shown');
        }
    }
});

// Portfolio date functionality
function GetLastAvailableDate() {
    // Check both NSE and BSE data for the most recent timestamp
    let lastDate = null;
    
    if (nseData && nseData.dateTimeStamp) {
        const nseDate = new Date(nseData.dateTimeStamp);
        if (!lastDate || nseDate > lastDate) {
            lastDate = nseDate;
        }
    }
    
    if (bseData && bseData.dateTimeStamp) {
        const bseDate = new Date(bseData.dateTimeStamp);
        if (!lastDate || bseDate > lastDate) {
            lastDate = bseDate;
        }
    }
    
    // If no data timestamp available, use todayDateHour for proper date handling
    if (!lastDate) {
        // After midnight before market hours, use previous working day
        lastDate = typeof todayDateHour !== 'undefined' ? new Date(todayDateHour) : new Date();
    }
    
    return lastDate;
}

function SetTodayPortfolioDate() {
    const portfolioDateInput = document.getElementById('portfolioDate');
    const currentTime = new Date();
    const lastAvailableDate = GetLastAvailableDate();
    
    // Use todayDateHour to determine the appropriate date to show
    const effectiveDate = typeof todayDateHour !== 'undefined' ? new Date(todayDateHour) : currentTime;
    
    // Check if current effective date's data is available
    const isCurrentData = lastAvailableDate.toDateString() === effectiveDate.toDateString();
    
    if (isCurrentData) {
        portfolioDateInput.value = effectiveDate.toISOString().split('T')[0];
        UpdatePortfolioDateDisplay(effectiveDate);
    } else {
        // Use last available date if effective date's data is not available
        portfolioDateInput.value = lastAvailableDate.toISOString().split('T')[0];
        UpdatePortfolioDateDisplay(lastAvailableDate);
    }
    
    UpdatePortfolioForDate();
}

function SetSmartPortfolioDate() {
    const portfolioDateInput = document.getElementById('portfolioDate');
    const lastAvailableDate = GetLastAvailableDate();
    
    portfolioDateInput.value = lastAvailableDate.toISOString().split('T')[0];
    UpdatePortfolioDateDisplay(lastAvailableDate);
    UpdatePortfolioForDate();
}

// Helper function to check if a date is a working day
function IsWorkingDay(date) {
    // Use existing utility functions if available
    if (typeof IsTradingDay === 'function') {
        return IsTradingDay(date);
    } else {
        // Manual logic - check if it's not weekend and not holiday
        const dayOfWeek = date.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6); // Sunday = 0, Saturday = 6
        
        let isHoliday = false;
        if (typeof CheckForHoliday === 'function') {
            try {
                isHoliday = CheckForHoliday(date);
            } catch (e) {
                isHoliday = false;
            }
        }
        
        return !isWeekend && !isHoliday;
    }
}

function PreviousWorkingDate() {
    const portfolioDateInput = document.getElementById('portfolioDate');
    const currentDate = new Date(portfolioDateInput.value);
    
    if (!currentDate || isNaN(currentDate)) {
        return;
    }
    
    // Find previous working date
    let previousDate = new Date(currentDate);
    let attempts = 0;
    const maxAttempts = 30; // Prevent infinite loops
    
    do {
        previousDate.setDate(previousDate.getDate() - 1);
        attempts++;
        
        // Safety check to prevent infinite loops
        if (attempts > maxAttempts) {
            break;
        }
        
        if (IsWorkingDay(previousDate)) {
            break;
        }
    } while (attempts < maxAttempts);
    
    portfolioDateInput.value = previousDate.toISOString().split('T')[0];
    UpdatePortfolioDateDisplay(previousDate);
    UpdatePortfolioForDate();
}

function NextWorkingDate() {
    const portfolioDateInput = document.getElementById('portfolioDate');
    const currentDate = new Date(portfolioDateInput.value);
    
    if (!currentDate || isNaN(currentDate)) {
        return;
    }
    
    // Check if we're already at today's date
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    const currentDateString = currentDate.toISOString().split('T')[0];
    
    if (currentDateString >= todayDateString) {
        // Already at or beyond today's date, don't advance
        return;
    }
    
    // Find next working date
    let nextDate = new Date(currentDate);
    let attempts = 0;
    const maxAttempts = 30; // Prevent infinite loops
    
    do {
        nextDate.setDate(nextDate.getDate() + 1);
        attempts++;
        
        // Don't go beyond today's date
        if (nextDate.toISOString().split('T')[0] > todayDateString) {
            // If we would go beyond today, stay at today
            nextDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            break;
        }
        
        // Safety check to prevent infinite loops
        if (attempts > maxAttempts) {
            break;
        }
        
        // Use existing utility functions if available
        if (IsWorkingDay(nextDate)) {
            break;
        }
    } while (attempts < maxAttempts);
    
    portfolioDateInput.value = nextDate.toISOString().split('T')[0];
    UpdatePortfolioDateDisplay(nextDate);
    UpdatePortfolioForDate();
}

function UpdatePortfolioForDate() {
    const portfolioDateInput = document.getElementById('portfolioDate');
    const selectedDate = new Date(portfolioDateInput.value);
    
    if (!selectedDate || isNaN(selectedDate)) {
        document.getElementById('portfolioDateInfo').innerText = 'Please select a valid date';
        return;
    }
    
    // Update the date display with day of the week
    UpdatePortfolioDateDisplay(selectedDate);
    
    if (document.getElementById("portfolioDiv").style.display == "block") {
        const lastAvailableDate = GetLastAvailableDate();
        const isLatestData = selectedDate.toDateString() === lastAvailableDate.toDateString();
        
        let loadingMessage = "Loading Portfolio data for " + selectedDate.toLocaleDateString();
        if (isLatestData) {
            loadingMessage += " (Latest available data)";
        }
        
        UpdateLoader(true, loadingMessage, 0.5);
        resetTable(portfolioTable);
        const stockList = watchlists[activeWL];
        if (stockList && stockList.data) {
            upadtePortfolioTableForDate(watchlists[activeWL].data, selectedDate);
        }
        updateRowNumber(portfolioTable);
        UpdateLoader(false);
    }
}

function UpdatePortfolioDateDisplay(date) {
    const portfolioDateDisplay = document.getElementById('portfolioDateDisplay');
    if (portfolioDateDisplay && date && !isNaN(date)) {
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        portfolioDateDisplay.innerText = weekday;
    }
}

function upadtePortfolioTableForDate(stockList, targetDate) {
    let totalInvestment = 0, currentValue = 0, dayPnL = 0;
    let flag = false;
    let refs1 = [];
    let refs2 = [];
    let dataFoundForDate = false;
    
    // Cache expensive operations
    const targetDateString = targetDate.toLocaleDateString('en-In', { 
        weekday: "short", year: "numeric", month: "short", day: "2-digit" 
    });
    
    // Use todayDateHour for proper date comparison instead of new Date()
    const effectiveToday = typeof todayDateHour !== 'undefined' ? new Date(todayDateHour) : new Date();
    const isToday = targetDate.toDateString() === effectiveToday.toDateString();

    // Helper function to find data for a specific date
    function findDataForDate(stockData, targetDateString, isToday) {
        if (!stockData) return null;
        
        // Check historical data first
        if (stockData.History && stockData.History.length > 0) {
            const data = stockData.History.find(h => h.HistoryDate === targetDateString);
            if (data) return data;
        }
        
        // For today, use current data if no historical data found
        if (isToday && stockData) {
            return stockData;
        }
        
        return null;
    }

    // Helper function to get sorted history (cached per stock)
    function getSortedHistory(stockData) {
        if (!stockData || !stockData.History) return [];
        
        // Cache sorted history to avoid repeated sorting
        if (!stockData._sortedHistory) {
            stockData._sortedHistory = [...stockData.History].sort((a, b) => {
                return new Date(b.HistoryDate) - new Date(a.HistoryDate);
            });
        }
        return stockData._sortedHistory;
    }

    // Helper function to find previous day data
    function findPreviousDayData(stockData, targetDateString, isToday) {
        const sortedHistory = getSortedHistory(stockData);
        if (sortedHistory.length === 0) return null;
        
        if (isToday) {
            // For today, use most recent historical data
            return sortedHistory[0];
        } else {
            // Find previous day data for historical dates
            const currentIndex = sortedHistory.findIndex(h => h.HistoryDate === targetDateString);
            if (currentIndex !== -1 && currentIndex < sortedHistory.length - 1) {
                return sortedHistory[currentIndex + 1];
            }
        }
        return null;
    }

    // Helper function to calculate and apply day change
    function calculateDayChange(priceToUse, previousClose, stockDetails, newRow, columnCounter) {
        const dayChange = (priceToUse - previousClose) * 100 / previousClose;
        const dayAbsoluteChange = stockDetails[3] * (priceToUse - previousClose);
        
        // day chg
        newRow.cells[columnCounter].innerText = dayAbsoluteChange.toCustomString();
        
        // day chg %
        newRow.cells[columnCounter + 1].innerText = dayChange.toCustomString(2) + " %";
        
        // Apply color coding
        const isPositiveChange = (dayChange > 0 && stockDetails[3] > 0) || (dayChange < 0 && stockDetails[3] < 0);
        const isNegativeChange = (dayChange < 0 && stockDetails[3] > 0) || (dayChange > 0 && stockDetails[3] < 0);
        
        if (isPositiveChange) {
            newRow.cells[columnCounter].style.color = 'green';
            newRow.cells[columnCounter + 1].style.color = 'green';
        } else if (isNegativeChange) {
            newRow.cells[columnCounter].style.color = 'red';
            newRow.cells[columnCounter + 1].style.color = 'red';
        }
        
        return dayAbsoluteChange;
    }

    for (let i = 0; i < stockList.length; i++) {
        let columnCounter = 1;
        if (stockList[i][0]) {
            const stockDetails = stockList[i];
            let newRow;
            if (stockDetails[0] && stockDetails[3] && stockDetails[3] != 0) {
                // Get individual NSE and BSE data
                const nseStockData = nseData[stockDetails[1]];
                const bseStockData = bseData[stockDetails[2]];
                
                // Find data for the target date from both sources
                const nseCurrentData = findDataForDate(nseStockData, targetDateString, isToday);
                const bseCurrentData = findDataForDate(bseStockData, targetDateString, isToday);
                
                // Determine which source to use (prefer higher close price)
                let dateSpecificData = null;
                let dataSource = null;
                
                if (nseCurrentData && bseCurrentData) {
                    const nseClose = nseCurrentData.Close || nseCurrentData.Open || 0;
                    const bseClose = bseCurrentData.Close || bseCurrentData.Open || 0;
                    if (nseClose >= bseClose) {
                        dateSpecificData = nseCurrentData;
                        dataSource = nseStockData;
                    } else {
                        dateSpecificData = bseCurrentData;
                        dataSource = bseStockData;
                    }
                } else if (nseCurrentData) {
                    dateSpecificData = nseCurrentData;
                    dataSource = nseStockData;
                } else if (bseCurrentData) {
                    dateSpecificData = bseCurrentData;
                    dataSource = bseStockData;
                }
                
                // Find previous day data from the same source
                const previousDayData = dataSource ? findPreviousDayData(dataSource, targetDateString, isToday) : null;
                // Always create a row for each stock
                newRow = addEmptyRow(portfolioTable);

                // name
                newRow.cells[columnCounter++].innerText = stockDetails[0];

                // qty
                newRow.cells[columnCounter++].innerText = stockDetails[3];

                // buy avg
                newRow.cells[columnCounter++].innerText = stockDetails[4].toCustomString(2);
                totalInvestment += stockDetails[3] * stockDetails[4];

                // buy value
                newRow.cells[columnCounter++].innerText = (stockDetails[3] * stockDetails[4]).toCustomString();

                // pf %
                refs1.push(newRow.cells[columnCounter]);
                newRow.cells[columnCounter++].innerText = stockDetails[3] * stockDetails[4];
                
                if (dateSpecificData && (dateSpecificData.Close || dateSpecificData.Open)) {
                    dataFoundForDate = true;
                    const priceToUse = dateSpecificData.Close || dateSpecificData.Open;
                    
                    // close
                    newRow.cells[columnCounter++].innerText = priceToUse.toCustomString(2);
                    currentValue += stockDetails[3] * priceToUse;

                    // present value
                    newRow.cells[columnCounter++].innerText = (stockDetails[3] * priceToUse).toCustomString();

                    // pf %
                    refs2.push(newRow.cells[columnCounter]);
                    newRow.cells[columnCounter++].innerText = stockDetails[3] * priceToUse;

                    // p&l
                    newRow.cells[columnCounter++].innerText = (stockDetails[3] * (priceToUse - stockDetails[4])).toCustomString();
                    const netChange = (priceToUse - stockDetails[4]) * 100 / stockDetails[4];

                    // net chg %
                    newRow.cells[columnCounter++].innerText = netChange.toCustomString(2) + " %";
                    if ((netChange > 0 && stockDetails[3] > 0) || (netChange < 0 && stockDetails[3] < 0)) {
                        newRow.cells[columnCounter - 2].style.color = 'green';
                        newRow.cells[columnCounter - 1].style.color = 'green';
                    }
                    else if ((netChange < 0 && stockDetails[3] > 0) || (netChange > 0 && stockDetails[3] < 0)) {
                        newRow.cells[columnCounter - 2].style.color = 'red';
                        newRow.cells[columnCounter - 1].style.color = 'red';
                    }

                    // Calculate day change if previous day data is available
                    let dayChangeCalculated = false;
                    
                    if (previousDayData && previousDayData.Close && priceToUse) {
                        const dayAbsoluteChange = calculateDayChange(priceToUse, previousDayData.Close, stockDetails, newRow, columnCounter);
                        dayPnL += dayAbsoluteChange;
                        dayChangeCalculated = true;
                        columnCounter += 2; // Skip both day change columns
                    } 
                    // Fallback: try to use PrevClose from dateSpecificData if available
                    else if (dateSpecificData.PrevClose && dateSpecificData.PrevClose > 0 && priceToUse) {
                        const dayAbsoluteChange = calculateDayChange(priceToUse, dateSpecificData.PrevClose, stockDetails, newRow, columnCounter);
                        dayPnL += dayAbsoluteChange;
                        dayChangeCalculated = true;
                        columnCounter += 2; // Skip both day change columns
                    }
                    
                    if (!dayChangeCalculated) {
                        // day chg
                        newRow.cells[columnCounter++].innerText = "N/A";
                        // day chg %
                        newRow.cells[columnCounter++].innerText = "N/A";
                    }
                } else {
                    // No data available for this date - show N/A for price-dependent columns
                    
                    // close
                    newRow.cells[columnCounter++].innerText = "N/A";

                    // present value
                    newRow.cells[columnCounter++].innerText = "N/A";

                    // pf %
                    newRow.cells[columnCounter++].innerText = "N/A";

                    // p&l
                    newRow.cells[columnCounter++].innerText = "N/A";

                    // net chg %
                    newRow.cells[columnCounter++].innerText = "N/A";

                    // day chg
                    newRow.cells[columnCounter++].innerText = "N/A";

                    // day chg %
                    newRow.cells[columnCounter++].innerText = "N/A";
                }
            }
        }
    }

    // Update portfolio percentages and totals
    if (totalInvestment != 0) {
        for (let i = 0; i < refs1.length; i++) {
            refs1[i].innerText = (refs1[i].innerText * 100 / totalInvestment).toCustomString(2) + " %";
        }

        if (dataFoundForDate) {
            for (let i = 0; i < refs2.length; i++) {
                refs2[i].innerText = (refs2[i].innerText * 100 / currentValue).toCustomString(2) + " %";
            }
        }

        const newRow = addEmptyRow(portfolioTable);
        newRow.setAttribute("frozen", true);
        newRow.cells[1].innerText = "Total = ";
        newRow.cells[4].innerText = totalInvestment.toCustomString();
        newRow.cells[5].innerText = (100).toCustomString(2) + " %";
        
        if (dataFoundForDate) {
            // Show actual values when data is available
            newRow.cells[7].innerText = currentValue.toCustomString();
            newRow.cells[8].innerText = (100).toCustomString(2) + " %";
            newRow.cells[9].innerText = (currentValue - totalInvestment).toCustomString();
            newRow.cells[10].innerText = ((currentValue - totalInvestment) * 100 / totalInvestment).toCustomString(2) + " %";
            
            // Apply color coding for P&L
            if ((currentValue - totalInvestment) > 0) {
                newRow.cells[9].style.color = 'green';
                newRow.cells[10].style.color = 'green';
            }
            else if ((currentValue - totalInvestment) < 0) {
                newRow.cells[9].style.color = 'red';
                newRow.cells[10].style.color = 'red';
            }
            
            newRow.cells[11].innerText = dayPnL.toCustomString();
            newRow.cells[12].innerText = currentValue > dayPnL ? (dayPnL * 100 / (currentValue - dayPnL)).toCustomString(2) + " %" : "0.00 %";
            
            // Apply color coding for day P&L
            if (dayPnL > 0) {
                newRow.cells[11].style.color = 'green';
                newRow.cells[12].style.color = 'green';
            }
            else if (dayPnL < 0) {
                newRow.cells[11].style.color = 'red';
                newRow.cells[12].style.color = 'red';
            }
        } else {
            // Show N/A when no data is available for the selected date
            newRow.cells[7].innerText = "N/A";  // present value
            newRow.cells[8].innerText = "N/A";  // pf %
            newRow.cells[9].innerText = "N/A";  // p&l
            newRow.cells[10].innerText = "N/A"; // net chg %
            newRow.cells[11].innerText = "N/A"; // day chg
            newRow.cells[12].innerText = "N/A"; // day chg %
        }
    }
    
    // Update info text
    const portfolioDateInfo = document.getElementById('portfolioDateInfo');
    const lastAvailableDate = GetLastAvailableDate();
    const isLatestData = targetDate.toDateString() === lastAvailableDate.toDateString();
    
    if (dataFoundForDate) {
        if (isLatestData) {
            portfolioDateInfo.innerText = 'Portfolio calculated with latest available data';
            portfolioDateInfo.style.color = '#008000';
        } else {
            portfolioDateInfo.innerText = 'Portfolio calculated for selected historical date';
            portfolioDateInfo.style.color = '#0066cc';
        }
    } else {
        portfolioDateInfo.innerText = 'No data available for selected date';
        portfolioDateInfo.style.color = '#cc0000';
    }
}

// Initialize portfolio date to last available date when the page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        SetSmartPortfolioDate();
        
        // Add keyboard navigation for portfolio date input
        const portfolioDateInput = document.getElementById('portfolioDate');
        if (portfolioDateInput) {
            portfolioDateInput.addEventListener('keydown', function(event) {
                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    PreviousWorkingDate();
                } else if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    NextWorkingDate();
                }
            });
            
            // Update day display when user manually changes date
            portfolioDateInput.addEventListener('change', function(event) {
                const selectedDate = new Date(event.target.value);
                if (selectedDate && !isNaN(selectedDate)) {
                    UpdatePortfolioDateDisplay(selectedDate);
                }
            });
        }
    }, 1000);
});

// Auto-complete functionality for stock names and codes
let autoCompleteCache = {
    stockNames: [],
    nseCodes: [],
    bseCodes: [],
    initialized: false
};

let autoCompleteState = {
    isVisible: false,
    selectedIndex: -1,
    currentElement: null,
    currentType: null,
    suggestions: []
};

function initializeAutoCompleteData() {
    if (autoCompleteCache.initialized) return;
    
    const stockNames = new Set();
    const nseCodes = new Set();
    const bseCodes = new Set();
    
    // Collect NSE data
    if (nseData && typeof nseData === 'object') {
        for (const code in nseData) {
            const stock = nseData[code];
            if (stock.SecurityName) stockNames.add(stock.SecurityName);
            if (code) nseCodes.add(code);
        }
    }
    
    // Collect BSE data
    if (bseData && typeof bseData === 'object') {
        for (const code in bseData) {
            const stock = bseData[code];
            if (stock.SecurityName) stockNames.add(stock.SecurityName);
            if (code) bseCodes.add(code);
        }
    }
    
    autoCompleteCache.stockNames = Array.from(stockNames).sort();
    autoCompleteCache.nseCodes = Array.from(nseCodes).sort();
    autoCompleteCache.bseCodes = Array.from(bseCodes).sort();
    autoCompleteCache.initialized = true;
}

function showAutoComplete(element, type) {
    initializeAutoCompleteData();
    
    const inputValue = element.textContent.toLowerCase();
    if (inputValue.length < 1) {
        hideAutoComplete();
        return;
    }
    
    let suggestions = [];
    switch (type) {
        case 'stockName':
            // Search in stock names, NSE codes, and BSE codes
            const allMatches = [];
            
            // Search by stock names (fuzzy matching)
            const allNames = autoCompleteCache.stockNames;
            for (const name of allNames) {
                if (name.toLowerCase().includes(inputValue)) {
                    // Exact substring match gets priority
                    allMatches.push({ text: name, similarity: 1.0, priority: 1, type: 'name' });
                } else {
                    // Fuzzy match
                    const similarity = calculateSimilarity(inputValue, name);
                    if (similarity > 0.6) {
                        allMatches.push({ text: name, similarity, priority: 2, type: 'name' });
                    }
                }
            }
            
            // Search by NSE codes
            const matchingNSECodes = autoCompleteCache.nseCodes.filter(code => 
                code.toLowerCase().includes(inputValue)
            );
            for (const code of matchingNSECodes) {
                // For codes, find the corresponding stock name to display
                if (nseData && nseData[code] && nseData[code].SecurityName) {
                    allMatches.push({ 
                        text: `${nseData[code].SecurityName} (${code})`, 
                        similarity: 1.0, 
                        priority: 1, 
                        type: 'nse',
                        originalName: nseData[code].SecurityName
                    });
                }
            }
            
            // Search by BSE codes
            const matchingBSECodes = autoCompleteCache.bseCodes.filter(code => 
                code.toLowerCase().includes(inputValue)
            );
            for (const code of matchingBSECodes) {
                // For codes, find the corresponding stock name to display
                if (bseData && bseData[code] && bseData[code].SecurityName) {
                    allMatches.push({ 
                        text: `${bseData[code].SecurityName} (${code})`, 
                        similarity: 1.0, 
                        priority: 1, 
                        type: 'bse',
                        originalName: bseData[code].SecurityName
                    });
                }
            }
            
            // Remove duplicates and sort by priority, then similarity
            const uniqueMatches = [];
            const seenNames = new Set();
            
            allMatches.sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                return b.similarity - a.similarity;
            });
            
            for (const match of allMatches) {
                const key = match.originalName || match.text;
                if (!seenNames.has(key.toLowerCase())) {
                    seenNames.add(key.toLowerCase());
                    uniqueMatches.push(match);
                }
            }
            
            suggestions = uniqueMatches.slice(0, 10).map(match => match.text);
            break;
        case 'nseCode':
            suggestions = autoCompleteCache.nseCodes.filter(code => 
                code.toLowerCase().includes(inputValue)
            ).slice(0, 10);
            break;
        case 'bseCode':
            suggestions = autoCompleteCache.bseCodes.filter(code => 
                code.toLowerCase().includes(inputValue)
            ).slice(0, 10);
            break;
    }
    
    if (suggestions.length === 0) {
        hideAutoComplete();
        return;
    }
    
    // Update state
    autoCompleteState.currentElement = element;
    autoCompleteState.currentType = type;
    autoCompleteState.suggestions = suggestions;
    autoCompleteState.selectedIndex = -1;
    
    showAutoCompleteDropdown(element, suggestions, type);
}

// Helper function to normalize company names for fuzzy matching
function normalizeCompanyName(name) {
    if (!name) return '';
    
    return name
        .toLowerCase()
        .replace(/\s+(ltd|limited|company|corp|corporation|inc|incorporated)\b/g, '') // Remove common suffixes
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim();
}

// Helper function to calculate string similarity (Levenshtein distance based)
function calculateSimilarity(str1, str2) {
    const normalized1 = normalizeCompanyName(str1);
    const normalized2 = normalizeCompanyName(str2);
    
    if (normalized1 === normalized2) return 1.0; // Perfect match
    
    const maxLength = Math.max(normalized1.length, normalized2.length);
    if (maxLength === 0) return 1.0;
    
    // Simple similarity based on common characters and length
    const commonLength = Math.min(normalized1.length, normalized2.length);
    let matches = 0;
    
    for (let i = 0; i < commonLength; i++) {
        if (normalized1[i] === normalized2[i]) {
            matches++;
        }
    }
    
    // Consider both character matches and length difference
    const similarity = matches / maxLength;
    return similarity;
}

// Helper function to find stock data by any identifier
function findStockData(identifier, searchType) {
    let stockData = null;
    let searchIdentifier = identifier;
    let actualSearchType = searchType;
    
    // Handle formatted suggestions from name field (e.g., "Stock Name (CODE)")
    if (searchType === 'stockName' && identifier.includes('(') && identifier.includes(')')) {
        const nameMatch = identifier.match(/^(.*?)\s*\(([^)]+)\)$/);
        if (nameMatch) {
            const stockName = nameMatch[1].trim();
            const code = nameMatch[2].trim();
            
            // Try to find by code first (more specific)
            stockData = findStockDataByCode(code) || findStockDataByName(stockName);
            return stockData;
        }
    }
    
    // For exact code matches, search by code
    if (searchType === 'nseCode' || searchType === 'bseCode') {
        return findStockDataByCode(identifier);
    } 
    // For stock name searches, search by name
    else if (searchType === 'stockName') {
        return findStockDataByName(identifier);
    }
    
    return stockData;
}

function findStockDataByCode(code) {
    // Search in NSE data first
    if (nseData && typeof nseData === 'object') {
        for (const nseCode in nseData) {
            const stock = nseData[nseCode];
            if (nseCode.toLowerCase() === code.toLowerCase() || 
                (stock.BSECode && stock.BSECode.toString() === code)) {
                return {
                    name: stock.SecurityName,
                    nseCode: nseCode,
                    bseCode: stock.BSECode || ''
                };
            }
        }
    }
    
    // Search in BSE data
    if (bseData && typeof bseData === 'object') {
        for (const bseCode in bseData) {
            const stock = bseData[bseCode];
            if (bseCode === code ||
                (stock.NSECode && stock.NSECode.toLowerCase() === code.toLowerCase())) {
                return {
                    name: stock.SecurityName,
                    nseCode: stock.NSECode || '',
                    bseCode: bseCode
                };
            }
        }
    }
    
    return null;
}

function findStockDataByName(stockName) {
    let stockData = null;
    let bestMatch = null;
    let bestSimilarity = 0;
    
    const allCandidates = [];
    
    // Collect all potential matches from NSE
    if (nseData && typeof nseData === 'object') {
        for (const code in nseData) {
            const stock = nseData[code];
            if (stock.SecurityName) {
                const similarity = calculateSimilarity(stockName, stock.SecurityName);
                if (similarity > 0.7) { // Threshold for considering a match
                    allCandidates.push({
                        similarity,
                        data: {
                            name: stock.SecurityName,
                            nseCode: code,
                            bseCode: stock.BSECode || '',
                            source: 'NSE'
                        }
                    });
                }
            }
        }
    }
    
    // Collect all potential matches from BSE
    if (bseData && typeof bseData === 'object') {
        for (const code in bseData) {
            const stock = bseData[code];
            if (stock.SecurityName) {
                const similarity = calculateSimilarity(stockName, stock.SecurityName);
                if (similarity > 0.7) {
                    allCandidates.push({
                        similarity,
                        data: {
                            name: stock.SecurityName,
                            nseCode: stock.NSECode || '',
                            bseCode: code,
                            source: 'BSE'
                        }
                    });
                }
            }
        }
    }
    
    // Find the best match and try to merge NSE/BSE data if they're the same company
    if (allCandidates.length > 0) {
        // Sort by similarity
        allCandidates.sort((a, b) => b.similarity - a.similarity);
        
        const topMatch = allCandidates[0];
        
        // Try to find corresponding data from other exchange
        if (topMatch.data.source === 'NSE' && !topMatch.data.bseCode) {
            // Look for BSE equivalent
            for (let i = 1; i < allCandidates.length; i++) {
                const candidate = allCandidates[i];
                if (candidate.data.source === 'BSE' && candidate.similarity > 0.8) {
                    topMatch.data.bseCode = candidate.data.bseCode;
                    break;
                }
            }
        } else if (topMatch.data.source === 'BSE' && !topMatch.data.nseCode) {
            // Look for NSE equivalent
            for (let i = 1; i < allCandidates.length; i++) {
                const candidate = allCandidates[i];
                if (candidate.data.source === 'NSE' && candidate.similarity > 0.8) {
                    topMatch.data.nseCode = candidate.data.nseCode;
                    break;
                }
            }
        }
        
        stockData = topMatch.data;
    }
    
    return stockData;
}

function showAutoCompleteDropdown(element, suggestions, type) {
    const dropdown = document.getElementById('autoCompleteDropdown');
    dropdown.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;';
        item.textContent = suggestion;
        item.setAttribute('data-index', index);
        
        item.addEventListener('mouseenter', function() {
            // Clear previous selection
            updateSelection(index);
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        item.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevent blur event
            selectSuggestion(suggestion, element, type);
        });
        
        dropdown.appendChild(item);
    });
    
    // Position dropdown below the element
    const rect = element.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.bottom) + 'px';
    dropdown.style.minWidth = rect.width + 'px';
    dropdown.style.display = 'block';
    
    autoCompleteState.isVisible = true;
    
    // Add keyboard event listener
    if (!element.hasAutoCompleteKeyListener) {
        element.addEventListener('keydown', handleAutoCompleteKeydown);
        element.hasAutoCompleteKeyListener = true;
    }
}

function updateSelection(newIndex) {
    const dropdown = document.getElementById('autoCompleteDropdown');
    const items = dropdown.children;
    
    // Clear previous selection
    for (let i = 0; i < items.length; i++) {
        items[i].style.backgroundColor = '';
    }
    
    // Set new selection
    if (newIndex >= 0 && newIndex < items.length) {
        autoCompleteState.selectedIndex = newIndex;
        items[newIndex].style.backgroundColor = '#f0f0f0';
    } else {
        autoCompleteState.selectedIndex = -1;
    }
}

function handleAutoCompleteKeydown(e) {
    if (!autoCompleteState.isVisible) return;
    
    const suggestions = autoCompleteState.suggestions;
    const currentIndex = autoCompleteState.selectedIndex;
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            const nextIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
            updateSelection(nextIndex);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
            updateSelection(prevIndex);
            break;
            
        case 'Enter':
            e.preventDefault();
            if (currentIndex >= 0 && currentIndex < suggestions.length) {
                const selectedSuggestion = suggestions[currentIndex];
                selectSuggestion(selectedSuggestion, autoCompleteState.currentElement, autoCompleteState.currentType);
            }
            break;
            
        case 'Escape':
            e.preventDefault();
            hideAutoComplete();
            break;
    }
}

function selectSuggestion(suggestion, element, type) {
    // Fill the selected field
    element.textContent = suggestion;
    
    // Find the row containing this element
    const row = element.closest('tr');
    if (row) {
        // Get the stock data for this selection
        const stockData = findStockData(suggestion, type);
        
        // Always clear and update all three fields to prevent stale data
        const cells = row.cells;
        if (cells.length >= 7) {
            // Clear all fields first
            cells[4].textContent = ''; // Stock name
            cells[5].textContent = ''; // NSE code
            cells[6].textContent = ''; // BSE code
            
            if (stockData) {
                // Fill with new data
                if (stockData.name) {
                    cells[4].textContent = stockData.name;
                }
                if (stockData.nseCode) {
                    cells[5].textContent = stockData.nseCode;
                }
                if (stockData.bseCode) {
                    cells[6].textContent = stockData.bseCode;
                }
            }
        }
    }
    
    hideAutoComplete();
    element.focus();
}

function hideAutoComplete() {
    setTimeout(() => {
        const dropdown = document.getElementById('autoCompleteDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        
        // Reset state
        autoCompleteState.isVisible = false;
        autoCompleteState.selectedIndex = -1;
        autoCompleteState.currentElement = null;
        autoCompleteState.currentType = null;
        autoCompleteState.suggestions = [];
    }, 150); // Small delay to allow click events to register
}