const ddlStocks = document.querySelector('#ddlStocks');
const stockBulkDealsTable = document.getElementById("stockBulkDeals");

var stockBulkDeals = {};
const flattenDeals = [];

function InitStockBulkDeals() {
    if (Object.keys(stockBulkDeals) == 0) {
        for (const stockCode of [...new Set([...Object.keys(nseData), ...Object.keys(bseData)])]) {
            nseData[stockCode] && CheckDeal(nseData[stockCode]);
            bseData[stockCode] && CheckDeal(bseData[stockCode]);
        }

        function CheckDeal(stockData) {
            if (stockData.BulkDeals) {
                for (let i = 0; i < stockData.BulkDeals.length; i++) {
                    flattenDeals.push(stockData.BulkDeals[i]);
                    if (!stockBulkDeals[stockData.BulkDeals[i].SecurityCode]) {
                        stockBulkDeals[stockData.BulkDeals[i].SecurityCode] = [];
                    }
                    stockBulkDeals[stockData.BulkDeals[i].SecurityCode].push(stockData.BulkDeals[i]);
                }
            }
            if (stockData.History) {
                for (let i = 0; i < stockData.History.length; i++) {
                    CheckDeal(stockData.History[i]);
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
        document.getElementById('lblTodayDeals').textContent += " [" + new Date(dataValidityTable.rows[2].cells[3].innerText).toDateString() + "]";

        stockBulkDealsTable.rows[0].cells[2].innerText = "Stock Name";
        stockBulkDealsTable.rows[0].cells[3].innerText = "Client Name";
    }
    txtFilterDealers.value = '';
    UpdateStockBulkDealTable();
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

    if (document.getElementById('chkTodayDeals').checked) {
        bulkDeals = FilterStockDeals(bulkDeals, new Date(document.getElementById('lblTodayDeals').textContent.match(/\[(.+)\]/)[1]).toDateString(), true);
    }

    if (filterText.length > 0) {
        bulkDeals = FilterStockDeals(bulkDeals, filterText);
    }

    bulkDeals.sort((a, b) =>
        new Date(b.Date) - new Date(a.Date)
        || a.ClientName.localeCompare(b.ClientName)
        || a.BuyOrSell.localeCompare(b.BuyOrSell)
        || a.Quantity - b.Quantity
        || a.Price - b.Price);

    ShowClientDeals(stockBulkDealsTable, bulkDeals, 'SecurityName', 'ClientName');
    UpdateLoader(false);
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