const ddlBulkDealer = document.querySelector('#ddlBulkDealer');
const clientDealsTable = document.getElementById("clientDeals");
const txtFilterDeals = document.getElementById("txtFilterDeals");
const chkFilterDeals = document.getElementById("chkFilterDeals");
const lblFilterDeals = document.getElementById("lblFilterDeals");
const lblFilterDealsPrefix = document.getElementById("lblFilterDealsPrefix");

var bulkDealers = {};
var filteredBulkDealers = {};
function InitBulkDealers() {
    if (Object.keys(bulkDealers) == 0) {
        for (const stockCode of [...new Set([...Object.keys(nseData), ...Object.keys(bseData)])]) {
            nseData[stockCode] && CheckDeal(nseData[stockCode]);
            bseData[stockCode] && CheckDeal(bseData[stockCode]);
        }

        function CheckDeal(stockData) {
            if (stockData.BulkDeals) {
                for (let i = 0; i < stockData.BulkDeals.length; i++) {
                    if (!bulkDealers[stockData.BulkDeals[i].ClientName]) {
                        bulkDealers[stockData.BulkDeals[i].ClientName] = [];
                    }
                    bulkDealers[stockData.BulkDeals[i].ClientName].push(stockData.BulkDeals[i]);
                }
            }
            if (stockData.History) {
                for (let i = 0; i < stockData.History.length; i++) {
                    CheckDeal(stockData.History[i]);
                }
            }
        }

        ddlBulkDealer.innerHTML = '';
        let tempBulkDealers = {};
        for (const bulkDealer of Object.keys(bulkDealers).sort((a, b) => a.localeCompare(b))) {
            tempBulkDealers[bulkDealer] = bulkDealers[bulkDealer];
            ddlBulkDealer.add(new Option(bulkDealer, bulkDealer));
        }
        bulkDealers = tempBulkDealers;

        if (ddlBulkDealer.options.length > 0) {
            ddlBulkDealer.selectedIndex = 0;
        }
        filteredBulkDealers = bulkDealers;

        lblFilterDealsPrefix.style.display = 'none';
        chkFilterDeals.style.display = 'none';
        lblFilterDeals.innerText = '';
        txtFilterDeals.value = '';
        txtFilterDeals.removeAttribute('code');
    }
    UpdateBulkDealTable();
}

function UpdateBulkDealTable(clientName = undefined) {
    if (clientName) {
        ddlBulkDealer.value = clientName;
    }

    if (ddlBulkDealer.selectedIndex != -1) {
        let bulkDeals = filteredBulkDealers[ddlBulkDealer.value];
        bulkDeals = FilterDeals(bulkDeals);
        bulkDeals.sort((a, b) =>
            new Date(b.Date) - new Date(a.Date)
            || a.SecurityName.localeCompare(b.SecurityName)
            || a.BuyOrSell.localeCompare(b.BuyOrSell)
            || a.Quantity - b.Quantity
            || a.Price - b.Price);
        ShowClientDeals(clientDealsTable, bulkDeals, 'SecurityName');
    }
}

function ShowClientDeals(table, deals, fieldName) {
    resetTable(table);
    for (let i = 0; i < deals.length; i++) {
        const deal = deals[i];
        const newRow = addEmptyRow(table);
        let columnCounter = 0;
        newRow.cells[columnCounter++].innerText = i + 1;
        newRow.cells[columnCounter++].innerText = deal.Date;
        newRow.cells[columnCounter++].innerText = deal.SecurityCode;
        newRow.cells[columnCounter++].innerText = deal[fieldName];

        newRow.cells[columnCounter++].innerText = deal.BuyOrSell;
        if (deal.BuyOrSell == "Buy") {
            newRow.cells[columnCounter].style.color = 'green';
            // total += deal.Quantity;
        }
        else if (deal.BuyOrSell == "Sell") {
            newRow.cells[columnCounter].style.color = 'red';
            // total -= deal.Quantity;
            //bulkDeal.Quantity *= -1;
        }
        newRow.cells[columnCounter++].innerText = deal.Quantity.toLocaleString('en-In');
        newRow.cells[columnCounter++].innerText = deal.Price.toLocaleString('en-In', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

function FilterDeals(bulkDeals) {
    let result = [];
    let filter = txtFilterDeals.value.trim().toLowerCase();
    for (let i = 0; i < bulkDeals.length; i++) {
        const bulkDeal = bulkDeals[i];
        if (bulkDeal.SecurityCode.toLowerCase().includes(filter) || bulkDeal.SecurityName.toLowerCase().includes(filter)) {
            result.push(bulkDeal);
        }
    }
    return result;
}

function UpdateLabel() {
    if (chkFilterDeals.checked) {
        //txtFilterDeals.disabled = false;
        txtFilterDeals.value = txtFilterDeals.getAttribute('code');
    }
    else {
        //txtFilterDeals.disabled = true;
        txtFilterDeals.value = '';
    }
    UpdateBulkDealTable();
}

function ResetFilter() {

}

/*

function ShowClientDeals(clientName) {
    resetTable(clientDealsTable);
    const deals = GetClientDeals(clientName);
    for (let i = 0; i < deals.length; i++) {
        const deal = deals[i];
        const newRow = addEmptyRow(clientDealsTable);
        let columnCounter = 0;
        newRow.cells[columnCounter++].innerText = i + 1;
        newRow.cells[columnCounter++].innerText = deal.Date;
        // newRow.cells[columnCounter++].innerText = deal.SecurityCode;
        newRow.cells[columnCounter++].innerText = deal.SecurityName;

        newRow.cells[columnCounter++].innerText = deal.BuyOrSell;
        if (deal.BuyOrSell == "Buy") {
            newRow.cells[columnCounter].style.color = 'green';
            // total += deal.Quantity;
        }
        else if (deal.BuyOrSell == "Sell") {
            newRow.cells[columnCounter].style.color = 'red';
            // total -= deal.Quantity;
            //bulkDeal.Quantity *= -1;
        }
        newRow.cells[columnCounter++].innerText = deal.Quantity.toLocaleString('en-In');
        newRow.cells[columnCounter++].innerText = deal.Price.toLocaleString('en-In', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

function GetClientDeals(clientName) {
    let result = [];
    for (const stockCode of [...new Set([...Object.keys(nseData), ...Object.keys(bseData)])]) {
        nseData[stockCode] && CheckDeal(nseData[stockCode], result);
        bseData[stockCode] && CheckDeal(bseData[stockCode], result);
    }

    function CheckDeal(stockData, result) {
        if (stockData.BulkDeals) {
            for (let i = 0; i < stockData.BulkDeals.length; i++) {
                if (stockData.BulkDeals[i].ClientName == clientName) {
                    result.push(stockData.BulkDeals[i]);
                }
            }
        }
        if (stockData.History) {
            for (let i = 0; i < stockData.History.length; i++) {
                CheckDeal(stockData.History[i], result);
            }
        }
    }

    return result.sort((a, b) =>
        new Date(b.Date) - new Date(a.Date)
        || a.SecurityName.localeCompare(b.SecurityName)
        || a.BuyOrSell.localeCompare(b.BuyOrSell)
        || a.Quantity - b.Quantity
        || a.Price - b.Price);
}
*/

