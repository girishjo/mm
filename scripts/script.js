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
        UpdateLoader(true, "Loading Portfolio data", 0.5);
        resetTable(portfolioTable);
        upadtePortfolioTable(watchlists[activeWL].data);
        updateRowNumber(portfolioTable);
        UpdateLoader(false);
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
