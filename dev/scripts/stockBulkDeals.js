const ddlStocks = document.querySelector('#ddlStocks');
const stockBulkDealsTable = document.getElementById("stockBulkDeals");

var stockBulkDeals = {};

function InitStockBulkDeals() {
    if (Object.keys(stockBulkDeals) == 0) {
        for (const stockCode of [...new Set([...Object.keys(nseData), ...Object.keys(bseData)])]) {
            nseData[stockCode] && CheckDeal(nseData[stockCode]);
            bseData[stockCode] && CheckDeal(bseData[stockCode]);
        }

        function CheckDeal(stockData) {
            if (stockData.BulkDeals) {
                for (let i = 0; i < stockData.BulkDeals.length; i++) {
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
        let tempBulkDealers = {};
        for (const stockCode of Object.keys(stockBulkDeals).sort((a, b) => stockBulkDeals[a][0].SecurityName.localeCompare(stockBulkDeals[b][0].SecurityName))) {
            tempBulkDealers[stockCode] = stockBulkDeals[stockCode];
            ddlStocks.add(new Option(stockBulkDeals[stockCode][0].SecurityName, stockCode));
        }
        stockBulkDeals = tempBulkDealers;

        if (ddlStocks.options.length > 0) {
            ddlStocks.selectedIndex = 0;
        }
        //filteredBulkDealers = stockBulkDeals;
    }
    txtFilterDealers.value = '';
    UpdateStockBulkDealTable();
}

function UpdateStockBulkDealTable() {
    if (ddlStocks.selectedIndex != -1) {
        let bulkDeals = stockBulkDeals[ddlStocks.value];
        bulkDeals = FilterStockDeals(bulkDeals);
        bulkDeals.sort((a, b) =>
            new Date(b.Date) - new Date(a.Date)
            || a.ClientName.localeCompare(b.ClientName)
            || a.BuyOrSell.localeCompare(b.BuyOrSell)
            || a.Quantity - b.Quantity
            || a.Price - b.Price);
        ShowClientDeals(stockBulkDealsTable, bulkDeals, 'ClientName');
    }
}

function FilterStockDeals(bulkDeals) {
    let result = [];
    let filter = txtFilterDealers.value.trim().toLowerCase();
    if (filter.length > 0) {
        for (let i = 0; i < bulkDeals.length; i++) {
            const bulkDeal = bulkDeals[i];
            if (bulkDeal.ClientName.toLowerCase().includes(filter)) {
                result.push(bulkDeal);
            }
        }
        return result;
    }
    else {
        return bulkDeals;
    }
}