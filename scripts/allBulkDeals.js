const ddlStocks = document.querySelector('#ddlStocks');
const stockBulkDealsTable = document.getElementById("stockBulkDeals");

var stockBulkDeals = {};
const flattenDeals = [];

function InitStockBulkDeals() {
    if (Object.keys(stockBulkDeals) == 0) {
        for (const stockCode of [...new Set([...Object.keys(nseData), ...Object.keys(bseData)])]) {
            nseData[stockCode] && CheckDeal(nseData[stockCode], Exchanges.NSE, nseData[stockCode]);
            bseData[stockCode] && CheckDeal(bseData[stockCode], Exchanges.BSE, bseData[stockCode]);
        }

        function CheckDeal(stockData, exchange, root) {
            if (stockData.BulkDeals) {
                for (let i = 0; i < stockData.BulkDeals.length; i++) {
                    const deal = stockData.BulkDeals[i];
                    if (exchange === Exchanges.NSE) {
                        deal.Ticker = stockData.SecurityCode;
                    }
                    else {
                        deal.Ticker = deal.SecurityName;
                        deal.SecurityName = getSecurityName(root);
                    }
                    deal.Exchange = exchange;
                    flattenDeals.push(deal);
                    if (!stockBulkDeals[stockData.BulkDeals[i].SecurityCode]) {
                        stockBulkDeals[stockData.BulkDeals[i].SecurityCode] = [];
                    }
                    stockBulkDeals[stockData.BulkDeals[i].SecurityCode].push(stockData.BulkDeals[i]);
                }
            }
            if (stockData.History) {
                for (let i = 0; i < stockData.History.length; i++) {
                    CheckDeal(stockData.History[i], exchange, root);
                }
            }
        }

        ddlStocks.innerHTML = '';
        ddlStocks.add(new Option("Show all deals...", -1));
        let tempBulkDealers = {};
        for (const stockCode of Object.keys(stockBulkDeals).sort((a, b) => stockBulkDeals[a][0].SecurityName.localeCompare(stockBulkDeals[b][0].SecurityName))) {
            tempBulkDealers[stockCode] = stockBulkDeals[stockCode];
            ddlStocks.add(new Option(stockBulkDeals[stockCode][0].SecurityName + " [" + stockCode + "]", stockCode));
        }
        stockBulkDeals = tempBulkDealers;

        if (ddlStocks.options.length > 0) {
            ddlStocks.selectedIndex = 0;
        }
        //filteredBulkDealers = stockBulkDeals;
        const nseDate = new Date(dataValidityTable.rows[1].cells[3].innerText);
        const bseDate = new Date(dataValidityTable.rows[2].cells[3].innerText);

        stockBulkDealsTable.rows[0].cells[2].innerText = "Stock Name";
        stockBulkDealsTable.rows[0].cells[3].innerText = "Client Name";

        // Set today's date as default in the date filter
        // const today = new Date();
        const todayString = todayDate.getFullYear() + '-' +
            String(todayDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(todayDate.getDate()).padStart(2, '0');
        document.getElementById('dateFilterDeals').value = todayString;

        // Restore saved filter settings or set defaults
        RestoreBulkDealsFilterSettings();
    }
    txtFilterDealers.value = '';
    UpdateStockBulkDealTable();
}

function RestoreBulkDealsFilterSettings() {
    // Restore only checkbox filter preferences (default to true if not set)
    document.getElementById('chkNseDeals').checked = settings.bulkDealsPreferences?.nseDeals !== false;
    document.getElementById('chkBseDeals').checked = settings.bulkDealsPreferences?.bseDeals !== false;
    document.getElementById('chkMainBoardDeals').checked = settings.bulkDealsPreferences?.mainBoardDeals !== false;
    document.getElementById('chkSmeDeals').checked = settings.bulkDealsPreferences?.smeDeals !== false;
    document.getElementById('chkShareText').checked = settings.bulkDealsPreferences?.shareWithText !== false;
    document.getElementById('chkShareImage').checked = settings.bulkDealsPreferences?.shareWithImage !== false;
    document.getElementById('chkShareGrouped').checked = settings.bulkDealsPreferences?.shareGrouped !== false;
}

function AutoSaveBulkDealsPreferences() {
    // Initialize bulkDealsPreferences object if it doesn't exist
    if (!settings.bulkDealsPreferences) {
        settings.bulkDealsPreferences = {};
    }

    // Save only checkbox preferences (not date or search text)
    settings.bulkDealsPreferences.nseDeals = document.getElementById('chkNseDeals').checked;
    settings.bulkDealsPreferences.bseDeals = document.getElementById('chkBseDeals').checked;
    settings.bulkDealsPreferences.mainBoardDeals = document.getElementById('chkMainBoardDeals').checked;
    settings.bulkDealsPreferences.smeDeals = document.getElementById('chkSmeDeals').checked;
    settings.bulkDealsPreferences.shareWithText = document.getElementById('chkShareText').checked;
    settings.bulkDealsPreferences.shareWithImage = document.getElementById('chkShareImage').checked;
    settings.bulkDealsPreferences.shareGrouped = document.getElementById('chkShareGrouped').checked;

    // Save to localStorage immediately
    window.localStorage.setItem("userSettings", JSON.stringify(settings));
}

async function ShareBulkDealsTable() {
    AutoSaveBulkDealsPreferences();

    const tableClone = stockBulkDealsTable.cloneNode(true);
    tableClone.querySelectorAll('tr.hide').forEach(row => row.remove());
    tableClone.querySelectorAll('table a').forEach(link => {
        link.removeAttribute('href');
        link.removeAttribute('onclick');
    });
    const rows = tableClone.querySelectorAll('tbody tr:not(.hide)');
    if (rows.length === 0) return;

    const shareWithText = document.getElementById('chkShareText').checked;
    const shareWithImage = document.getElementById('chkShareImage').checked;
    const shareGrouped = document.getElementById('chkShareGrouped').checked;

    if (!shareWithText && !shareWithImage) {
        alert("Please select at least one format (Text or Image).");
        return false;
    }

    const includeNSE = document.getElementById('chkNseDeals').checked;
    const includeBSE = document.getElementById('chkBseDeals').checked;
    const includeMainBoard = document.getElementById('chkMainBoardDeals').checked;
    const includeSME = document.getElementById('chkSmeDeals').checked;

    let exchangeLabel = '';
    if (includeNSE && !includeBSE) {
        exchangeLabel = 'NSE';
    } else if (!includeNSE && includeBSE) {
        exchangeLabel = 'BSE';
    }

    let typeLabel = '';
    if (includeSME && !includeMainBoard) {
        typeLabel = 'SMEs';
    } else if (!includeSME && includeMainBoard) {
        typeLabel = 'MainBoards';
    }

    try {
        if (shareWithImage) {
            let heading = `${exchangeLabel ? exchangeLabel + ' ' : ''}Bulk Deals${typeLabel ? ' for ' + typeLabel : ''}, ${FormatDate(todayDate)}`.trim();
            let content = `Source:\n${window.location.href.split('#')[0]}`;
            const result = await ShareTableAsImage("stockBulkDeals", heading, shareWithText ? content : '', shareGrouped);
            if (result == null || result) return;
        }
    } catch (error) {
        console.warn('Unable to share bulk deals image:', error);
    }

    let heading = `${exchangeLabel ? exchangeLabel + ' ' : ''}Bulk Deals${typeLabel ? ' for ' + typeLabel : ''}`.trim();
    let content = GetFormattedTableText("stockBulkDeals", shareGrouped);
    content += `\n\nSource:\n${window.location.href.split('#')[0]}`;

    await ShareText(heading + '\n\n' + content);
}

function UpdateStockBulkDealTable() {
    UpdateLoader(true, "Updating Bulk deals result...");
    let bulkDeals;
    let filterText = txtFilterDealers.value.trim().toLowerCase();

    if (ddlStocks.value != -1) {
        bulkDeals = stockBulkDeals[ddlStocks.value];
    }
    else {
        bulkDeals = flattenDeals;
    }

    bulkDeals = FilterExchange(bulkDeals, document.getElementById('chkNseDeals').checked, document.getElementById('chkBseDeals').checked);

    // Apply SME/MainBoard filter
    bulkDeals = FilterStockType(bulkDeals, document.getElementById('chkMainBoardDeals').checked, document.getElementById('chkSmeDeals').checked);

    // Apply date filter if a date is selected
    let selectedDate = document.getElementById('dateFilterDeals').value;
    if (selectedDate) {
        let filterDate = new Date(selectedDate).toDateString();
        bulkDeals = FilterStockDeals(bulkDeals, filterDate, true);
    }

    if (filterText.length > 0) {
        bulkDeals = FilterStockDeals(bulkDeals, filterText);
    }

    bulkDeals.sort((a, b) =>
        new Date(b.Date) - new Date(a.Date)
        || a.SecurityName.localeCompare(b.SecurityName)
        || a.ClientName.localeCompare(b.ClientName)
        || a.BuyOrSell.localeCompare(b.BuyOrSell)
        || a.Quantity - b.Quantity
        || a.Price - b.Price);

    ShowClientDeals(stockBulkDealsTable, bulkDeals, 'SecurityName', 'ClientName');
    UpdateLoader(false);

    // Auto-save filter preferences on every change
    AutoSaveBulkDealsPreferences();
}

function FilterExchange(bulkDeals, includeNSE, includeBSE) {
    if (!includeNSE && !includeBSE) {
        return bulkDeals;
    }

    let result = [];
    for (let i = 0; i < bulkDeals.length; i++) {
        const bulkDeal = bulkDeals[i];
        if (isNaN(bulkDeal.SecurityCode)) {
            if (includeNSE) {
                result.push(bulkDeal);
            }
        }
        else if (includeBSE) {
            result.push(bulkDeal);
        }
    }
    return result;
}

function FilterStockType(bulkDeals, includeMainBoard, includeSME) {
    if (!includeMainBoard && !includeSME) {
        return bulkDeals;
    }

    let result = [];
    for (let i = 0; i < bulkDeals.length; i++) {
        const bulkDeal = bulkDeals[i];
        const stockCode = bulkDeal.SecurityCode;

        // Determine if stock is SME using settings from settings.json
        let isSME = false;

        // Check NSE data first
        if (nseData[stockCode]) {
            let series = nseData[stockCode].Series;
            if (series == undefined) {
                series = nseData[stockCode].History && nseData[stockCode].History.length > 0 && nseData[stockCode].History[0]?.Series;
            }
            if (series && settings.configs.t2tSMESeries.includes(series)) {
                isSME = true;
            }
        }

        // Check BSE data if not found in NSE or if it's a BSE stock
        if (!isSME && bseData[stockCode]) {
            let series = bseData[stockCode].Series;
            if (series == undefined) {
                series = bseData[stockCode].History && bseData[stockCode].History.length > 0 && bseData[stockCode].History[0]?.Series;
            }
            if (series && settings.configs.t2tSMESeries.includes(series)) {
                isSME = true;
            }
        }

        // If not SME, then it's MainBoard
        const isMainBoard = !isSME;

        // Include the deal if it matches the filter criteria
        if ((includeSME && isSME) || (includeMainBoard && isMainBoard)) {
            result.push(bulkDeal);
        }
    }
    return result;
}

function FilterStockDeals(bulkDeals, filter, isDateFilter = false) {
    let result = [];
    for (let i = 0; i < bulkDeals.length; i++) {
        const bulkDeal = bulkDeals[i];
        if (isDateFilter) {
            if (new Date(bulkDeal.Date).toDateString() == filter) {
                result.push(bulkDeal);
            }
        }
        else {
            if (bulkDeal.ClientName.toLowerCase().includes(filter) || bulkDeal.SecurityCode.toLowerCase().includes(filter) || bulkDeal.SecurityName.toLowerCase().includes(filter)) {
                result.push(bulkDeal);
            }
        }
    }
    return result;
}