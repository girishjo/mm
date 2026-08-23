const dataValidityTable = document.querySelector('#dataValidity');
const listTable = document.querySelector('#stocksList');
const dataTable = document.querySelector('#stockData');
const portfolioTable = document.querySelector('#portfolioTable');

var watchlists = {};
var activeWL;

function createWatchlistId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return 'wl_' + Date.now() + '_' + Math.random().toString(36).slice(2);
}

function ensureWatchlistIds() {
    const usedIds = new Set();
    for (const watchlist of Object.values(watchlists)) {
        if (!watchlist.id || usedIds.has(watchlist.id)) watchlist.id = createWatchlistId();
        usedIds.add(watchlist.id);
    }
}

function isDynamicWatchlist(watchlist) {
    return Array.isArray(watchlist?.combinedFrom);
}

function getWatchlistKeyById(id) {
    return Object.keys(watchlists).find(key => watchlists[key].id === id);
}

function aggregateWatchlistData(sourceKeys) {
    const totals = [];
    for (const watchlistKey of sourceKeys) {
        const stockList = watchlists[watchlistKey];
        for (const stock of stockList?.data || []) {
            if (!stock[0]) continue;
            const name = String(stock[0]).trim();
            const nse = String(stock[1] || '').trim();
            const bse = String(stock[2] || '').trim();
            const count = Number(String(stock[3] || '').replace(/,/g, ''));
            const price = Number(String(stock[4] || '').replace(/,/g, ''));
            let record = totals.find(existing =>
                (nse && existing.nse === nse) ||
                (bse && existing.bse === bse) ||
                (!nse && !bse && existing.name.toUpperCase() === name.toUpperCase())
            );
            if (!record) {
                record = { name, nse, bse, totalCount: 0, pricedCount: 0, priceTotal: 0 };
                totals.push(record);
            } else {
                record.nse = record.nse || nse;
                record.bse = record.bse || bse;
            }
            const effectiveCount = Number.isFinite(count) && count > 0 ? count : 1;
            record.totalCount += effectiveCount;
            if (Number.isFinite(price) && price > 0) {
                record.pricedCount += effectiveCount;
                record.priceTotal += effectiveCount * price;
            }
        }
    }
    return totals.map(record => [
        record.name,
        record.nse,
        record.bse,
        record.totalCount,
        record.pricedCount ? Number((record.priceTotal / record.pricedCount).toFixed(4)) : ''
    ]);
}

function refreshDynamicWatchlists() {
    for (const watchlist of Object.values(watchlists)) {
        if (!isDynamicWatchlist(watchlist)) continue;
        const sourceKeys = watchlist.combinedFrom
            .map(getWatchlistKeyById)
            .filter(key => key !== undefined && !isDynamicWatchlist(watchlists[key]));
        watchlist.data = aggregateWatchlistData(sourceKeys);
    }
}

function getWatchlistDataInDisplayOrder(watchlist) {
    if (!watchlist?.data) return [];
    const data = [...watchlist.data];
    if (Array.isArray(watchlist.displayOrder) && watchlist.displayOrder.length) {
        const byIdentity = new Map(data.map(stock => [getStockIdentity(stock), stock]));
        const ordered = watchlist.displayOrder.map(identity => byIdentity.get(identity)).filter(Boolean);
        return ordered.concat(data.filter(stock => !watchlist.displayOrder.includes(getStockIdentity(stock))));
    }
    if (!watchlist.sort) return data;
    const dataColumn = Number(watchlist.sort.column) - 4;
    if (dataColumn < 0 || dataColumn > 4) return data;
    const direction = watchlist.sort.direction === 'desc' ? -1 : 1;
    return data.sort((first, second) => {
        const firstValue = first[dataColumn] ?? '';
        const secondValue = second[dataColumn] ?? '';
        const firstNumber = Number(String(firstValue).replace(/,/g, ''));
        const secondNumber = Number(String(secondValue).replace(/,/g, ''));
        if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber) && firstValue !== '' && secondValue !== '') {
            return (firstNumber - secondNumber) * direction;
        }
        return String(firstValue).localeCompare(String(secondValue), undefined, { sensitivity: 'base' }) * direction;
    });
}

function getStockIdentity(stock) {
    return stock[1] ? 'NSE:' + stock[1] : stock[2] ? 'BSE:' + stock[2] : 'NAME:' + String(stock[0] || '').toUpperCase();
}

function saveDynamicDisplayOrder() {
    const watchlist = watchlists[activeWL];
    if (!isDynamicWatchlist(watchlist)) return;
    const order = [];
    for (const row of listTable.tBodies[0].rows) {
        if (row.classList.contains('hide') || !row.cells[4].innerText.trim()) continue;
        order.push(getStockIdentity([row.cells[4].innerText, row.cells[5].innerText, row.cells[6].innerText]));
    }
    watchlist.displayOrder = order;
    delete watchlist.sort;
}

function removeWatchlistFromDynamicSources(deletedId) {
    for (const watchlist of Object.values(watchlists)) {
        if (!isDynamicWatchlist(watchlist)) continue;
        watchlist.combinedFrom = watchlist.combinedFrom.filter(id => id !== deletedId);
    }
}

function updateDynamicWatchlistTitles() {
    document.querySelectorAll('.dynamic-watchlist').forEach(item => {
        const radio = item.querySelector('input[name="stockListRadio"]');
        const watchlist = radio && watchlists[radio.value];
        if (!watchlist) return;
        const sourceNames = watchlist.combinedFrom
            .map(getWatchlistKeyById)
            .filter(key => key !== undefined)
            .map(key => watchlists[key].name)
            .join(', ');
        item.title = 'Dynamic watchlist created from: ' + sourceNames;
        item.setAttribute('aria-label', item.title);
    });
}

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
    }
    ensureWatchlistIds();
    refreshDynamicWatchlists();
    ResetWatchlist(false);
    UpdateLoader(false);
}

function saveDataOnLocal(silentUpdate = false, loadDefault = false) {
    if (!silentUpdate && !isDynamicWatchlist(watchlists[activeWL])) {
        let listTableObj = toObject(listTable);
        watchlists[activeWL].data = listTableObj;
    }
    if (isDynamicWatchlist(watchlists[activeWL])) saveDynamicDisplayOrder();

    ensureWatchlistIds();
    refreshDynamicWatchlists();

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
    if (!silentUpdate) {
        ShowMessage('Watchlists saved');
    }
}

function ResetWatchlist(deleteExisting = true) {
    ensureWatchlistIds();
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

function hasPortfolioData(wlData) {
    if (!wlData) return false;
    return wlData.some(stock => stock[0] && stock[3] && stock[3] != 0 && stock[4] && stock[4] != 0);
}

function toggleShowAllWatchlists() {
    const chk = document.getElementById('chkShowAllWatchlists');
    localStorage.setItem('showAllWatchlists', chk.checked);
    UpdateWatchList();
}

function togglePrivacyMode() {
    const chk = document.getElementById('chkPrivacyMode');
    portfolioTable.classList.toggle('privacy-mode', chk.checked);
    localStorage.setItem('privacyMode', chk.checked);
}

function filterWatchlistsForPortfolio() {
    const isPortfolio = document.getElementById("portfolioDiv").style.display == "block";
    const showAll = document.getElementById('chkShowAllWatchlists') && document.getElementById('chkShowAllWatchlists').checked;
    const radios = document.querySelectorAll('input[name="stockListRadio"]');

    if (!isPortfolio || showAll) {
        radios.forEach(radio => {
            radio.style.display = '';
            const label = document.querySelector('label[for="' + radio.id + '"]');
            if (label) label.style.display = '';
            const item = radio.closest('.watchlist-item');
            if (item) item.style.display = '';
        });
        return;
    }

    let needsReselect = false;
    radios.forEach(radio => {
        const wl = watchlists[radio.value];
        const visible = wl && hasPortfolioData(wl.data);
        radio.style.display = visible ? '' : 'none';
        const label = document.querySelector('label[for="' + radio.id + '"]');
        if (label) label.style.display = visible ? '' : 'none';
        const item = radio.closest('.watchlist-item');
        if (item) item.style.display = visible ? '' : 'none';
        if (radio.checked && !visible) needsReselect = true;
    });

    if (needsReselect) {
        for (const radio of radios) {
            if (radio.style.display !== 'none') {
                radio.checked = true;
                activeWL = radio.value;
                break;
            }
        }
    }
}

function UpdateWatchList(saveLast = true) {
    filterWatchlistsForPortfolio();
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
            if (watchlists[lastSelectedWL] && !isDynamicWatchlist(watchlists[lastSelectedWL])) {
                watchlists[lastSelectedWL].data = toObject(listTable);
                refreshDynamicWatchlists();
            }
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
            const orderedData = getWatchlistDataInDisplayOrder(stockList);
            for (let i = 0; i < orderedData.length; i++) {
                if (orderedData[i][0]) {
                    updateDataTable(dataTable, orderedData[i][0], orderedData[i][1], orderedData[i][2]);
                }
            }
        }
        updateRowNumber(dataTable);
        UpdateLoader(false);
    }

    if (document.getElementById("portfolioDiv").style.display == "block") {
        const portfolioDateInput = document.getElementById('portfolioDate');
        if (portfolioDateInput && portfolioDateInput.value) {
            UpdatePortfolioForDate();
        } else {
            UpdateLoader(true, "Loading Portfolio data", 0.5);
            resetTable(portfolioTable);
            upadtePortfolioTable(getWatchlistDataInDisplayOrder(watchlists[activeWL]));
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
                id: createWatchlistId(),
                name: wlName,
                data: []
            }
            if (j >= 9) {
                document.getElementById('addWatchlistBtn').style.display = 'none';
                document.getElementById('newWatchList').style.display = 'none';
            }
            saveDataOnLocal(true, false);
            newWatchlist.checked = true;
            UpdateWatchList();
            openTab(Tabs.stocklist);
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

function RenameWatchlist() {
    const selectedWatchList = document.querySelector('input[name="stockListRadio"]:checked');
    if (!selectedWatchList || !watchlists[selectedWatchList.value]) return;

    const currentName = watchlists[selectedWatchList.value].name;
    const newName = prompt('Enter a new watchlist name:', currentName)?.trim();
    if (!newName || newName === currentName) return;
    if (Object.values(watchlists).some(watchlist => watchlist.name === newName)) {
        alert('Watchlist name should be unique.');
        return;
    }

    watchlists[selectedWatchList.value].name = newName;
    const label = document.querySelector('label[for="' + selectedWatchList.id + '"]');
    if (label) label.innerText = newName;
    updateDynamicWatchlistTitles();
    saveDataOnLocal(true, false);
    ShowMessage('Watchlist renamed');
}

function RemoveWatchlist() {
    const selectedWatchList = document.querySelector('input[name="stockListRadio"]:checked');
    if (!selectedWatchList || !watchlists[selectedWatchList.value]) return;

    if (confirm("It will delete Watchlist: " + watchlists[selectedWatchList.value].name + ".\r\nProceed?")) {
        if (RemoveWatchlistCode(selectedWatchList.id)) {
            const deletedId = watchlists[selectedWatchList.value].id;
            delete watchlists[selectedWatchList.value];
            removeWatchlistFromDynamicSources(deletedId);

            if (Object.keys(watchlists).length === 0) {
                watchlists['0'] = {
                    name: 'New Watchlist',
                    data: []
                };
                activeWL = '0';
            }

            saveDataOnLocal(true, false);
            if (Object.keys(watchlists).length < 10) {
                document.getElementById('addWatchlistBtn').style.display = '';
                document.getElementById('newWatchList').style.display = '';
            }
            ResetWatchlist(true);
            const replacement = document.getElementById('w' + activeWL);
            if (replacement) replacement.checked = true;
            UpdateWatchList(false);
            ShowMessage('Watchlist deleted');
        }
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
    const dynamic = isDynamicWatchlist(stockList);
    listTable.classList.toggle('dynamic-watchlist-table', dynamic);
    if (stockList && stockList.data) {
        const orderedData = getWatchlistDataInDisplayOrder(stockList);
        for (let i = 0; i < orderedData.length; i++) {
            if (orderedData[i][0]) {
                const newRow = addEmptyRow(listTable);
                newRow.cells[4].innerText = orderedData[i][0];
                newRow.cells[5].innerText = orderedData[i][1];
                newRow.cells[6].innerText = orderedData[i][2];
                orderedData[i][3] && (newRow.cells[7].innerText = orderedData[i][3]);
                orderedData[i][4] && (newRow.cells[8].innerText = orderedData[i][4]);
            }
        }
    }
    if (listTable.rows.length == 2) {
        addEmptyRow(listTable);
    }
    if (dynamic) {
        listTable.querySelectorAll('tbody tr:not(.hide) [contenteditable="true"]').forEach(cell => cell.setAttribute('contenteditable', 'false'));
        const sortState = stockList.sort;
        const sortHeader = sortState && listTable.tHead.rows[0].cells[sortState.column];
        if (sortHeader) sortTable(sortHeader, sortState.direction);
    } else {
        listTable.querySelectorAll('tbody tr.hide [contenteditable="false"]').forEach(cell => cell.setAttribute('contenteditable', 'true'));
    }
}

function updateDataTable(table, name, nseCode, bseCode, data = undefined, rowIndex = undefined) {
    const stockData = data ? data : MergeStockData(nseData[nseCode], bseData[bseCode]);
    stockData.Name = name;
    if (stockData.PrevClose != undefined && stockData.PrevClose != 0)
        stockData.Change = (stockData.Close - stockData.PrevClose) * 100 / stockData.PrevClose;

    let newRow;
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
            a.setAttribute("onclick", "ShowHistory(this, dataTable);");
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

        // Render ESM surveillance badge with comprehensive data points
        if (settings.configs.esm && stockData["ESM"] && stockData["ESM"].flag > 0) {
            var esmLabel = document.createElement('label');
            esmLabel.classList.add("highlight");

            const esmData = stockData["ESM"];
            const metrics = esmData.metrics || {};

            // 1. Color Styling by Stage/Risk
            if (esmData.flag === 3) {
                esmLabel.classList.add("esm-stage2");
            } else if (esmData.flag === 2) {
                esmLabel.classList.add("esm-stage1");
            } else {
                esmLabel.classList.add("esm-warning");
            }

            esmLabel.innerText = esmData.badge || (esmData.stage === "ESM_STAGE_2" ? "ESM Stage II" : "ESM Stage I");

            // 2. Data Points & Tooltip Construction
            const lines = [];

            if (esmData.stage === "ESM_STAGE_2") {
                lines.push("🔴 ESM STAGE II (Active)");
                lines.push("• Price Band: 2%");
                lines.push("• Margin: 100%");
                lines.push("• Settlement: Trade-for-Trade (T2T)");
                lines.push("• Trading: Periodic Call Auction (Mondays Only)");
            } else if (esmData.stage === "ESM_STAGE_1") {
                lines.push("🟠 ESM STAGE I (Active)");
                lines.push("• Price Band: 5%");
                lines.push("• Margin: 100%");
                lines.push("• Settlement: Trade-for-Trade (T2T) Daily");
                lines.push("• Trading: Normal Continuous Market");
            } else if (esmData.flag === 2) {
                lines.push("🟠 STAGE I IMMINENT (Threshold Breach)");
                lines.push("• Action: Eligible for immediate Stage I placement");
            } else if (esmData.flag === 1) {
                lines.push("🟡 EARLY WARNING ZONE (Near Threshold)");
                lines.push("• Action: Reached >85% of Stage I entry limits");
            }

            lines.push("───────────────────────────────");
            lines.push("PRICE METRICS (Lookback Period):");
            lines.push(`• Current Price: ₹${(metrics.currentPrice || stockData.Close || 0).toFixed(2)}`);
            if (metrics.periodHigh && metrics.periodLow) {
                lines.push(`• Period Range: ₹${metrics.periodLow.toFixed(2)} - ₹${metrics.periodHigh.toFixed(2)}`);
            }

            lines.push("───────────────────────────────");
            // Surveillance Data Points & Unified Listing/Trading Age
            lines.push("SURVEILLANCE DATA POINTS:");
            lines.push(`• High-Low Variation: ${(metrics.highLowVar || 0).toFixed(2)}% (Limit: ≥75%)`);
            lines.push(`• Close-to-Close (3M): ${(metrics.c2cVar || 0).toFixed(2)}% (Limit: ≥50%)`);

            if (metrics.c2c5D !== undefined && metrics.c2c5D !== 0) {
                lines.push(`• 5-Day Momentum: ${metrics.c2c5D > 0 ? '+' : ''}${metrics.c2c5D.toFixed(2)}% (Limit: ≥15%)`);
            }
            if (metrics.c2cMonthly !== undefined && metrics.c2cMonthly !== 0) {
                lines.push(`• Monthly Momentum: ${metrics.c2cMonthly > 0 ? '+' : ''}${metrics.c2cMonthly.toFixed(2)}% (Limit: ≥30%)`);
            }

            if (metrics.listingDate && metrics.listingDate !== "N/A") {
                lines.push(`• Listing Date: ${metrics.listingDate}`);
                lines.push(`• Age / Sample: ${metrics.daysSinceListing} calendar days, ${metrics.lookbackBars || metrics.expectedTradingDays} trading days`);
            } else {
                lines.push(`• Sample Size: ${metrics.lookbackBars} trading days`);
            }

            const allReasons = (esmData.breaches || []).concat(esmData.warnings || []);
            if (allReasons.length > 0) {
                lines.push("───────────────────────────────");
                lines.push("SPECIFIC TRIGGER REASONS:");
                allReasons.forEach(r => lines.push(`• ${r}`));
            }

            esmLabel.title = lines.join("\n");
            newRow.cells[1].appendChild(esmLabel);
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

                    const nseHasGlobalData = nseData && nseData.dateTimeStamp;
                    const bseHasGlobalData = bseData && bseData.dateTimeStamp;

                    const nseHasStockData = nseData[nseCode].Total !== undefined;
                    const bseHasStockData = bseData[bseCode].Total !== undefined;

                    let msg = "";

                    if (nseHasStockData && !bseHasStockData) {
                        msg = bseHasGlobalData ? "BSE delivery data not available for this stock" : "BSE delivery data not available yet";
                    } else if (!nseHasStockData && bseHasStockData) {
                        msg = nseHasGlobalData ? "NSE delivery data not available for this stock" : "NSE delivery data not available yet";
                    } else if (!nseHasStockData && !bseHasStockData) {
                        if (nseHasGlobalData && bseHasGlobalData) {
                            msg = "Delivery data not available for this stock on both exchanges";
                        } else if (nseHasGlobalData || bseHasGlobalData) {
                            msg = "Delivery data partially available - some exchange data pending";
                        } else {
                            msg = "Delivery data not available yet";
                        }
                    }

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

                newRow.cells[columnCounter++].innerText = stockDetails[0];
                if (stockDetails[3] && stockDetails[3] != 0) {
                    newRow.cells[columnCounter++].innerText = stockDetails[3];
                    newRow.cells[columnCounter++].innerText = stockDetails[4].toCustomString(2);
                    totalInvestment += stockDetails[3] * stockDetails[4];
                    newRow.cells[columnCounter++].innerText = (stockDetails[3] * stockDetails[4]).toCustomString();

                    refs1.push(newRow.cells[columnCounter]);
                    newRow.cells[columnCounter++].innerText = stockDetails[3] * stockDetails[4];

                    let lastClosing = undefined;
                    if (!stockData.Close && stockData.History && stockData.History.length > 0) {
                        lastClosing = stockData.History[0].Close;
                    }
                    if (stockData.Close != undefined || lastClosing != undefined) {
                        newRow.cells[columnCounter++].innerText = (stockData.Close || lastClosing).toCustomString(2);
                        currentValue += stockDetails[3] * (stockData.Close || lastClosing);

                        newRow.cells[columnCounter++].innerText = (stockDetails[3] * (stockData.Close || lastClosing)).toCustomString();

                        refs2.push(newRow.cells[columnCounter]);
                        newRow.cells[columnCounter++].innerText = stockDetails[3] * (stockData.Close || lastClosing);

                        newRow.cells[columnCounter++].innerText = (stockDetails[3] * ((stockData.Close || lastClosing) - stockDetails[4])).toCustomString();
                        const netChange = ((stockData.Close || lastClosing) - stockDetails[4]) * 100 / stockDetails[4];

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

                            newRow.cells[columnCounter++].innerText = dayAbsoluteChange.toCustomString();
                            newRow.cells[columnCounter++].innerText = stockData.Change.toCustomString(2) + " %";
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
                            newRow.cells[columnCounter++].innerText = 0;
                            newRow.cells[columnCounter++].innerText = (0).toFixed(2).toLocaleString('en-In') + " %";
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

    const cash = getPortfolioCash();
    if (cash !== 0) {
        addPortfolioCashRow(cash, refs1, refs2);
        totalInvestment += cash;
        currentValue += cash;
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

function getPortfolioCash() {
    const withCash = document.getElementById('chkPortfolioWithCash');
    const cashInput = document.getElementById('portfolioCash');
    if (!withCash?.checked || !cashInput) return 0;
    const cash = Number(cashInput.value);
    return Number.isFinite(cash) && cash > 0 ? cash : 0;
}

function addPortfolioCashRow(cash, refs1, refs2) {
    const newRow = addEmptyRow(portfolioTable);
    newRow.cells[1].innerText = 'Cash';
    newRow.cells[2].innerText = '1';
    newRow.cells[3].innerText = cash.toCustomString(2);
    newRow.cells[4].innerText = cash.toCustomString();
    refs1.push(newRow.cells[5]);
    newRow.cells[5].innerText = cash;
    newRow.cells[6].innerText = cash.toCustomString(2);
    newRow.cells[7].innerText = cash.toCustomString();
    refs2.push(newRow.cells[8]);
    newRow.cells[8].innerText = cash;
    newRow.cells[9].innerText = '0';
    newRow.cells[10].innerText = '0.00 %';
    newRow.cells[11].innerText = '0';
    newRow.cells[12].innerText = '0.00 %';
}

function savePortfolioPreferences() {
    if (!settings) return;
    if (!settings.configs) settings.configs = {};
    settings.configs.portfolioWithCash = document.getElementById('chkPortfolioWithCash')?.checked === true;
    settings.configs.portfolioCash = document.getElementById('portfolioCash')?.value || '';
    window.localStorage.setItem('userSettings', JSON.stringify(settings));
}

function togglePortfolioCash() {
    const withCash = document.getElementById('chkPortfolioWithCash');
    const cashInput = document.getElementById('portfolioCash');
    if (!withCash || !cashInput) return;
    cashInput.style.display = withCash.checked ? 'inline-block' : 'none';
    savePortfolioPreferences();
    updatePortfolioTable();
}

function restorePortfolioPreferences() {
    const withCash = document.getElementById('chkPortfolioWithCash');
    const cashInput = document.getElementById('portfolioCash');
    if (!withCash || !cashInput || !settings?.configs) return;
    withCash.checked = settings.configs.portfolioWithCash === true;
    cashInput.value = settings.configs.portfolioCash || '';
    cashInput.style.display = withCash.checked ? 'inline-block' : 'none';
}

function updatePortfolioTable() {
    const portfolioDateInput = document.getElementById('portfolioDate');
    if (!portfolioDateInput?.value || !watchlists?.[activeWL]) return;
    resetTable(portfolioTable);
    upadtePortfolioTableForDate(getWatchlistDataInDisplayOrder(watchlists[activeWL]), new Date(portfolioDateInput.value));
    updateRowNumber(portfolioTable);
}

listTable.addEventListener('click', function (e) {
    if (isDynamicWatchlist(watchlists[activeWL])) return;
    const cell = e.target.closest('td');
    if (!cell) return;
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

listTable.addEventListener('dragend', function () {
    if (isDynamicWatchlist(watchlists[activeWL])) saveDataOnLocal(true, false);
});

function GetLastAvailableDate() {
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

    if (!lastDate) {
        lastDate = typeof todayDateHour !== 'undefined' ? new Date(todayDateHour) : new Date();
    }

    return lastDate;
}

function SetTodayPortfolioDate() {
    const portfolioDateInput = document.getElementById('portfolioDate');
    const currentTime = new Date();
    const lastAvailableDate = GetLastAvailableDate();

    const effectiveDate = typeof todayDateHour !== 'undefined' ? new Date(todayDateHour) : currentTime;
    const isCurrentData = lastAvailableDate.toDateString() === effectiveDate.toDateString();

    if (isCurrentData) {
        portfolioDateInput.value = effectiveDate.toISOString().split('T')[0];
        UpdatePortfolioDateDisplay(effectiveDate);
    } else {
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

function IsWorkingDay(date) {
    if (typeof IsTradingDay === 'function') {
        return IsTradingDay(date);
    } else {
        const dayOfWeek = date.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

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

    if (!currentDate || isNaN(currentDate)) return;

    let previousDate = new Date(currentDate);
    let attempts = 0;
    const maxAttempts = 30;

    do {
        previousDate.setDate(previousDate.getDate() - 1);
        attempts++;
        if (attempts > maxAttempts) break;
        if (IsWorkingDay(previousDate)) break;
    } while (attempts < maxAttempts);

    portfolioDateInput.value = previousDate.toISOString().split('T')[0];
    UpdatePortfolioDateDisplay(previousDate);
    UpdatePortfolioForDate();
}

function NextWorkingDate() {
    const portfolioDateInput = document.getElementById('portfolioDate');
    const currentDate = new Date(portfolioDateInput.value);

    if (!currentDate || isNaN(currentDate)) return;

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    const currentDateString = currentDate.toISOString().split('T')[0];

    if (currentDateString >= todayDateString) return;

    let nextDate = new Date(currentDate);
    let attempts = 0;
    const maxAttempts = 30;

    do {
        nextDate.setDate(nextDate.getDate() + 1);
        attempts++;
        if (nextDate.toISOString().split('T')[0] > todayDateString) {
            nextDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            break;
        }
        if (attempts > maxAttempts) break;
        if (IsWorkingDay(nextDate)) break;
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
            upadtePortfolioTableForDate(getWatchlistDataInDisplayOrder(watchlists[activeWL]), selectedDate);
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
    let refs1 = [];
    let refs2 = [];
    let dataFoundForDate = false;

    const targetDateString = targetDate.toLocaleDateString('en-In', {
        weekday: "short", year: "numeric", month: "short", day: "2-digit"
    });

    const effectiveToday = typeof todayDateHour !== 'undefined' ? new Date(todayDateHour) : new Date();
    const isToday = targetDate.toDateString() === effectiveToday.toDateString();

    function findDataForDate(stockData, targetDateString, isToday) {
        if (!stockData) return null;
        if (stockData.History && stockData.History.length > 0) {
            const data = stockData.History.find(h => h.HistoryDate === targetDateString);
            if (data) return data;
        }
        if (isToday && stockData) return stockData;
        return null;
    }

    function getSortedHistory(stockData) {
        if (!stockData || !stockData.History) return [];
        if (!stockData._sortedHistory) {
            stockData._sortedHistory = [...stockData.History].sort((a, b) => new Date(b.HistoryDate) - new Date(a.HistoryDate));
        }
        return stockData._sortedHistory;
    }

    function findPreviousDayData(stockData, targetDateString, isToday) {
        const sortedHistory = getSortedHistory(stockData);
        if (sortedHistory.length === 0) return null;
        if (isToday) return sortedHistory[0];
        const currentIndex = sortedHistory.findIndex(h => h.HistoryDate === targetDateString);
        if (currentIndex !== -1 && currentIndex < sortedHistory.length - 1) {
            return sortedHistory[currentIndex + 1];
        }
        return null;
    }

    function calculateDayChange(priceToUse, previousClose, stockDetails, newRow, columnCounter) {
        const dayChange = (priceToUse - previousClose) * 100 / previousClose;
        const dayAbsoluteChange = stockDetails[3] * (priceToUse - previousClose);

        newRow.cells[columnCounter].innerText = dayAbsoluteChange.toCustomString();
        newRow.cells[columnCounter + 1].innerText = dayChange.toCustomString(2) + " %";

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
                const nseStockData = nseData[stockDetails[1]];
                const bseStockData = bseData[stockDetails[2]];

                const nseCurrentData = findDataForDate(nseStockData, targetDateString, isToday);
                const bseCurrentData = findDataForDate(bseStockData, targetDateString, isToday);

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

                const previousDayData = dataSource ? findPreviousDayData(dataSource, targetDateString, isToday) : null;
                newRow = addEmptyRow(portfolioTable);

                newRow.cells[columnCounter++].innerText = stockDetails[0];
                newRow.cells[columnCounter++].innerText = stockDetails[3];
                newRow.cells[columnCounter++].innerText = stockDetails[4].toCustomString(2);
                totalInvestment += stockDetails[3] * stockDetails[4];

                newRow.cells[columnCounter++].innerText = (stockDetails[3] * stockDetails[4]).toCustomString();

                refs1.push(newRow.cells[columnCounter]);
                newRow.cells[columnCounter++].innerText = stockDetails[3] * stockDetails[4];

                if (dateSpecificData && (dateSpecificData.Close || dateSpecificData.Open)) {
                    dataFoundForDate = true;
                    const priceToUse = dateSpecificData.Close || dateSpecificData.Open;

                    newRow.cells[columnCounter++].innerText = priceToUse.toCustomString(2);
                    currentValue += stockDetails[3] * priceToUse;

                    newRow.cells[columnCounter++].innerText = (stockDetails[3] * priceToUse).toCustomString();

                    refs2.push(newRow.cells[columnCounter]);
                    newRow.cells[columnCounter++].innerText = stockDetails[3] * priceToUse;

                    newRow.cells[columnCounter++].innerText = (stockDetails[3] * (priceToUse - stockDetails[4])).toCustomString();
                    const netChange = (priceToUse - stockDetails[4]) * 100 / stockDetails[4];

                    newRow.cells[columnCounter++].innerText = netChange.toCustomString(2) + " %";
                    if ((netChange > 0 && stockDetails[3] > 0) || (netChange < 0 && stockDetails[3] < 0)) {
                        newRow.cells[columnCounter - 2].style.color = 'green';
                        newRow.cells[columnCounter - 1].style.color = 'green';
                    }
                    else if ((netChange < 0 && stockDetails[3] > 0) || (netChange > 0 && stockDetails[3] < 0)) {
                        newRow.cells[columnCounter - 2].style.color = 'red';
                        newRow.cells[columnCounter - 1].style.color = 'red';
                    }

                    let dayChangeCalculated = false;

                    if (previousDayData && previousDayData.Close && priceToUse) {
                        const dayAbsoluteChange = calculateDayChange(priceToUse, previousDayData.Close, stockDetails, newRow, columnCounter);
                        dayPnL += dayAbsoluteChange;
                        dayChangeCalculated = true;
                        columnCounter += 2;
                    }
                    else if (dateSpecificData.PrevClose && dateSpecificData.PrevClose > 0 && priceToUse) {
                        const dayAbsoluteChange = calculateDayChange(priceToUse, dateSpecificData.PrevClose, stockDetails, newRow, columnCounter);
                        dayPnL += dayAbsoluteChange;
                        dayChangeCalculated = true;
                        columnCounter += 2;
                    }

                    if (!dayChangeCalculated) {
                        newRow.cells[columnCounter++].innerText = "N/A";
                        newRow.cells[columnCounter++].innerText = "N/A";
                    }
                } else {
                    newRow.cells[columnCounter++].innerText = "N/A";
                    newRow.cells[columnCounter++].innerText = "N/A";
                    newRow.cells[columnCounter++].innerText = "N/A";
                    newRow.cells[columnCounter++].innerText = "N/A";
                    newRow.cells[columnCounter++].innerText = "N/A";
                    newRow.cells[columnCounter++].innerText = "N/A";
                    newRow.cells[columnCounter++].innerText = "N/A";
                }
            }
        }
    }

    const cash = getPortfolioCash();
    if (cash !== 0) {
        addPortfolioCashRow(cash, refs1, refs2);
        totalInvestment += cash;
        currentValue += cash;
        dataFoundForDate = true;
    }

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
            newRow.cells[12].innerText = currentValue > dayPnL ? (dayPnL * 100 / (currentValue - dayPnL)).toCustomString(2) + " %" : "0.00 %";

            if (dayPnL > 0) {
                newRow.cells[11].style.color = 'green';
                newRow.cells[12].style.color = 'green';
            }
            else if (dayPnL < 0) {
                newRow.cells[11].style.color = 'red';
                newRow.cells[12].style.color = 'red';
            }
        } else {
            newRow.cells[7].innerText = "N/A";
            newRow.cells[8].innerText = "N/A";
            newRow.cells[9].innerText = "N/A";
            newRow.cells[10].innerText = "N/A";
            newRow.cells[11].innerText = "N/A";
            newRow.cells[12].innerText = "N/A";
        }
    }

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

window.addEventListener('load', () => {
    setTimeout(() => {
        const chkShowAll = document.getElementById('chkShowAllWatchlists');
        if (chkShowAll) {
            chkShowAll.checked = localStorage.getItem('showAllWatchlists') === 'true';
        }

        const chkPrivacy = document.getElementById('chkPrivacyMode');
        if (chkPrivacy) {
            chkPrivacy.checked = localStorage.getItem('privacyMode') === 'true';
            portfolioTable.classList.toggle('privacy-mode', chkPrivacy.checked);
        }

        SetSmartPortfolioDate();

        const portfolioDateInput = document.getElementById('portfolioDate');
        if (portfolioDateInput) {
            portfolioDateInput.addEventListener('keydown', function (event) {
                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    PreviousWorkingDate();
                } else if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    NextWorkingDate();
                }
            });

            portfolioDateInput.addEventListener('change', function (event) {
                const selectedDate = new Date(event.target.value);
                if (selectedDate && !isNaN(selectedDate)) {
                    UpdatePortfolioDateDisplay(selectedDate);
                }
            });
        }
    }, 1000);
});

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

function getSecurityName(stock) {
    if (stock.SecurityName) return stock.SecurityName;
    if (stock.History && Array.isArray(stock.History) && stock.History.length > 0) {
        for (const historyEntry of stock.History) {
            if (historyEntry.SecurityName) return historyEntry.SecurityName;
        }
    }
    return null;
}

function initializeAutoCompleteData() {
    if (autoCompleteCache.initialized) return;

    const stockNames = new Set();
    const nseCodes = new Set();
    const bseCodes = new Set();

    if (nseData && typeof nseData === 'object') {
        for (const code in nseData) {
            const stock = nseData[code];
            const securityName = getSecurityName(stock);
            if (securityName) stockNames.add(securityName);
            if (code) nseCodes.add(code);
        }
    }

    if (bseData && typeof bseData === 'object') {
        for (const code in bseData) {
            const stock = bseData[code];
            const securityName = getSecurityName(stock);
            if (securityName) stockNames.add(securityName);
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
            const allMatches = [];
            const allNames = autoCompleteCache.stockNames;
            const normalizedInput = normalizeCompanyName(inputValue);
            for (const name of allNames) {
                const normalizedName = normalizeCompanyName(name);
                if (normalizedName.includes(normalizedInput)) {
                    allMatches.push({ text: name, similarity: 1.0, priority: 1, type: 'name' });
                } else {
                    const similarity = calculateSimilarity(inputValue, name);
                    if (similarity > 0.6) {
                        allMatches.push({ text: name, similarity, priority: 2, type: 'name' });
                    }
                }
            }

            const matchingNSECodes = autoCompleteCache.nseCodes.filter(code => code.toLowerCase().includes(inputValue));
            for (const code of matchingNSECodes) {
                if (nseData && nseData[code]) {
                    const securityName = getSecurityName(nseData[code]);
                    if (securityName) {
                        allMatches.push({
                            text: `${securityName} (${code})`,
                            similarity: 1.0,
                            priority: 1,
                            type: 'nse',
                            originalName: securityName
                        });
                    }
                }
            }

            const matchingBSECodes = autoCompleteCache.bseCodes.filter(code => code.toLowerCase().includes(inputValue));
            for (const code of matchingBSECodes) {
                if (bseData && bseData[code]) {
                    const securityName = getSecurityName(bseData[code]);
                    if (securityName) {
                        allMatches.push({
                            text: `${securityName} (${code})`,
                            similarity: 1.0,
                            priority: 1,
                            type: 'bse',
                            originalName: securityName
                        });
                    }
                }
            }

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
            suggestions = autoCompleteCache.nseCodes.filter(code => code.toLowerCase().includes(inputValue)).slice(0, 10);
            break;
        case 'bseCode':
            suggestions = autoCompleteCache.bseCodes.filter(code => code.toLowerCase().includes(inputValue)).slice(0, 10);
            break;
    }

    if (suggestions.length === 0) {
        hideAutoComplete();
        return;
    }

    autoCompleteState.currentElement = element;
    autoCompleteState.currentType = type;
    autoCompleteState.suggestions = suggestions;
    autoCompleteState.selectedIndex = -1;

    showAutoCompleteDropdown(element, suggestions, type);
}

function normalizeCompanyName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/\s+(ltd|limited|company|corp|corporation|inc|incorporated)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function calculateSimilarity(str1, str2) {
    const normalized1 = normalizeCompanyName(str1);
    const normalized2 = normalizeCompanyName(str2);
    if (normalized1 === normalized2) return 1.0;

    const maxLength = Math.max(normalized1.length, normalized2.length);
    if (maxLength === 0) return 1.0;

    const commonLength = Math.min(normalized1.length, normalized2.length);
    let matches = 0;
    for (let i = 0; i < commonLength; i++) {
        if (normalized1[i] === normalized2[i]) matches++;
    }

    return matches / maxLength;
}

function findStockData(identifier, searchType) {
    let stockData = null;
    if (searchType === 'stockName' && identifier.includes('(') && identifier.includes(')')) {
        const nameMatch = identifier.match(/^(.*?)\s*\(([^)]+)\)$/);
        if (nameMatch) {
            const stockName = nameMatch[1].trim();
            const code = nameMatch[2].trim();
            stockData = findStockDataByCode(code) || findStockDataByName(stockName);
            return stockData;
        }
    }

    if (searchType === 'nseCode' || searchType === 'bseCode') {
        return findStockDataByCode(identifier);
    } else if (searchType === 'stockName') {
        return findStockDataByName(identifier);
    }

    return stockData;
}

function findStockDataByCode(code) {
    let foundStock = null;

    if (nseData && typeof nseData === 'object') {
        for (const nseCode in nseData) {
            const stock = nseData[nseCode];
            if (nseCode.toLowerCase() === code.toLowerCase() ||
                (stock.BSECode && stock.BSECode.toString() === code)) {
                foundStock = {
                    name: getSecurityName(stock),
                    nseCode: nseCode,
                    bseCode: stock.BSECode || '',
                    source: 'NSE'
                };
                break;
            }
        }
    }

    if (bseData && typeof bseData === 'object') {
        for (const bseCode in bseData) {
            const stock = bseData[bseCode];
            if (bseCode === code ||
                (stock.NSECode && stock.NSECode.toLowerCase() === code.toLowerCase())) {
                if (!foundStock) {
                    foundStock = {
                        name: getSecurityName(stock),
                        nseCode: stock.NSECode || '',
                        bseCode: bseCode,
                        source: 'BSE'
                    };
                } else {
                    if (!foundStock.bseCode) {
                        foundStock.bseCode = bseCode;
                    }
                }
                break;
            }
        }
    }

    if (foundStock && foundStock.source === 'NSE' && !foundStock.bseCode && foundStock.name) {
        if (bseData && typeof bseData === 'object') {
            for (const bseCode in bseData) {
                const bseStock = bseData[bseCode];
                const bseSecurityName = getSecurityName(bseStock);
                if (bseSecurityName && normalizeCompanyName(bseSecurityName) === normalizeCompanyName(foundStock.name)) {
                    foundStock.bseCode = bseCode;
                    break;
                }
            }
        }
    }

    if (foundStock && foundStock.source === 'BSE' && !foundStock.nseCode && foundStock.name) {
        if (nseData && typeof nseData === 'object') {
            for (const nseCode in nseData) {
                const nseStock = nseData[nseCode];
                const nseSecurityName = getSecurityName(nseStock);
                if (nseSecurityName && normalizeCompanyName(nseSecurityName) === normalizeCompanyName(foundStock.name)) {
                    foundStock.nseCode = nseCode;
                    break;
                }
            }
        }
    }

    if (foundStock) {
        return {
            name: foundStock.name,
            nseCode: foundStock.nseCode,
            bseCode: foundStock.bseCode
        };
    }

    return null;
}

function findStockDataByName(stockName) {
    let stockData = null;
    const allCandidates = [];

    if (nseData && typeof nseData === 'object') {
        for (const code in nseData) {
            const stock = nseData[code];
            const securityName = getSecurityName(stock);
            if (securityName) {
                const similarity = calculateSimilarity(stockName, securityName);
                if (similarity > 0.7) {
                    allCandidates.push({
                        similarity,
                        data: {
                            name: securityName,
                            nseCode: code,
                            bseCode: stock.BSECode || '',
                            source: 'NSE'
                        }
                    });
                }
            }
        }
    }

    if (bseData && typeof bseData === 'object') {
        for (const code in bseData) {
            const stock = bseData[code];
            const securityName = getSecurityName(stock);
            if (securityName) {
                const similarity = calculateSimilarity(stockName, securityName);
                if (similarity > 0.7) {
                    allCandidates.push({
                        similarity,
                        data: {
                            name: securityName,
                            nseCode: stock.NSECode || '',
                            bseCode: code,
                            source: 'BSE'
                        }
                    });
                }
            }
        }
    }

    if (allCandidates.length > 0) {
        allCandidates.sort((a, b) => b.similarity - a.similarity);
        const topMatch = allCandidates[0];

        if (topMatch.data.source === 'NSE' && !topMatch.data.bseCode) {
            for (let i = 1; i < allCandidates.length; i++) {
                const candidate = allCandidates[i];
                if (candidate.data.source === 'BSE' && candidate.similarity > 0.8) {
                    topMatch.data.bseCode = candidate.data.bseCode;
                    break;
                }
            }
        } else if (topMatch.data.source === 'BSE' && !topMatch.data.nseCode) {
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

        item.addEventListener('mouseenter', function () {
            updateSelection(index);
        });

        item.addEventListener('mouseleave', function () {
            this.style.backgroundColor = '';
        });

        item.addEventListener('mousedown', function (e) {
            e.preventDefault();
            selectSuggestion(suggestion, element, type);
        });

        dropdown.appendChild(item);
    });

    const rect = element.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.bottom) + 'px';
    dropdown.style.minWidth = rect.width + 'px';
    dropdown.style.display = 'block';

    autoCompleteState.isVisible = true;

    if (!element.hasAutoCompleteKeyListener) {
        element.addEventListener('keydown', handleAutoCompleteKeydown);
        element.hasAutoCompleteKeyListener = true;
    }
}

function updateSelection(newIndex) {
    const dropdown = document.getElementById('autoCompleteDropdown');
    const items = dropdown.children;

    for (let i = 0; i < items.length; i++) {
        items[i].style.backgroundColor = '';
    }

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
    element.textContent = suggestion;
    const row = element.closest('tr');
    if (row) {
        const stockData = findStockData(suggestion, type);
        const cells = row.cells;
        if (cells.length >= 7) {
            cells[4].textContent = '';
            cells[5].textContent = '';
            cells[6].textContent = '';

            if (stockData) {
                if (stockData.name) cells[4].textContent = stockData.name;
                if (stockData.nseCode) cells[5].textContent = stockData.nseCode;
                if (stockData.bseCode) cells[6].textContent = stockData.bseCode;
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

        autoCompleteState.isVisible = false;
        autoCompleteState.selectedIndex = -1;
        autoCompleteState.currentElement = null;
        autoCompleteState.currentType = null;
        autoCompleteState.suggestions = [];
    }, 150);
}

function toggleCombinedWatchlistForm() {
    const modal = document.getElementById('combinedWatchlistModal');
    populateCombinedWatchlistOptions();
    document.getElementById('combinedWatchlistName').value = '';
    document.getElementById('combinedWatchlistDynamic').checked = true;
    modal.style.display = 'block';
    document.body.setAttribute('modal-shown', 'true');
}

document.getElementById('combinedWatchlistModalCloser').onclick = function () {
    document.getElementById('combinedWatchlistModal').style.display = 'none';
    document.body.removeAttribute('modal-shown');
};

function populateCombinedWatchlistOptions() {
    const options = document.getElementById('combinedWatchlistOptions');
    if (!options) return;
    options.innerHTML = '';
    for (const [key, watchlist] of Object.entries(watchlists)) {
        if (isDynamicWatchlist(watchlist)) continue;
        const label = document.createElement('label');
        label.className = 'combined-watchlist-option';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = key;
        checkbox.setAttribute('aria-label', watchlist.name);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(watchlist.name));
        options.appendChild(label);
    }
}

function getSelectedWatchlistKeys() {
    return [...document.querySelectorAll('#combinedWatchlistOptions input[type="checkbox"]:checked')]
        .map(checkbox => checkbox.value);
}

function aggregateSelectedWatchlists() {
    return aggregateWatchlistData(getSelectedWatchlistKeys());
}

function combineSelectedWatchlists() {
    const selectedKeys = getSelectedWatchlistKeys();
    if (selectedKeys.length < 2) {
        alert('Select at least two watchlists to combine');
        return;
    }

    if (document.getElementById('stockListDiv').style.display === 'block' && watchlists[activeWL]) {
        watchlists[activeWL].data = toObject(listTable);
    }
    let name = document.getElementById('combinedWatchlistName').value.trim();
    if (!name) {
        alert('Combined watchlist name is required');
        return;
    }
    if (Object.values(watchlists).some(watchlist => watchlist.name === name)) {
        alert('Watchlist name should be unique.');
        return;
    }

    let newKey = 0;
    while (watchlists[newKey]) newKey++;
    const dynamic = document.getElementById('combinedWatchlistDynamic').checked;
    watchlists[newKey] = {
        id: createWatchlistId(),
        name: name,
        data: aggregateSelectedWatchlists()
    };
    if (dynamic) watchlists[newKey].combinedFrom = selectedKeys.map(key => watchlists[key].id);
    document.getElementById('combinedWatchlistModal').style.display = 'none';
    document.body.removeAttribute('modal-shown');
    ResetWatchlist(true);
    const newRadio = document.getElementById('w' + newKey);
    if (newRadio) {
        document.querySelectorAll('input[name="stockListRadio"]').forEach(radio => radio.checked = false);
        newRadio.checked = true;
        activeWL = String(newKey);
        UpdateWatchList(false);
    }
    saveDataOnLocal(true, false);
    ShowMessage('Combined watchlist created');
}