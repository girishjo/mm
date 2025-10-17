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
        ddlBulkDealer.add(new Option("Select Bulk Dealer Name...", -1));
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

        clientDealsTable.rows[0].cells[3].innerText = "Stock Name";
    }
    UpdateBulkDealTable();
}

function UpdateBulkDealTable(clientName = undefined) {
    if (clientName) {
        ddlBulkDealer.value = clientName;
    }

    if (ddlBulkDealer.value != -1) {
        let bulkDeals = filteredBulkDealers[ddlBulkDealer.value];
        bulkDeals = FilterDeals(bulkDeals);
        bulkDeals.sort((a, b) =>
            new Date(b.Date) - new Date(a.Date)
            || a.SecurityName.localeCompare(b.SecurityName)
            || a.BuyOrSell.localeCompare(b.BuyOrSell)
            || a.Quantity - b.Quantity
            || a.Price - b.Price);
        ShowClientDeals(clientDealsTable, bulkDeals, 'SecurityCode', 'SecurityName');
    }
    else {
        resetTable(clientDealsTable);
    }
}

function ShowClientDeals(table, deals, fieldName1, fieldName2) {
    resetTable(table);
    for (let i = 0; i < deals.length; i++) {
        const deal = deals[i];
        const newRow = addEmptyRow(table);
        let columnCounter = 0;
        newRow.cells[columnCounter++].innerText = i + 1;
        newRow.cells[columnCounter++].innerText = deal.Date;
        if (fieldName2 == 'ClientName') {
            var a = document.createElement('a');
            var linkText = document.createTextNode(deal[fieldName1]);
            a.appendChild(linkText);
            a.title = deal[fieldName1];
            a.href = "#0";
            if (fieldName2 == 'ClientName') {
                a.setAttribute("onclick", "FilterDealsFromLink('" + deal.SecurityCode + "');");
            }
            newRow.cells[columnCounter++].appendChild(a);
        } else {
            newRow.cells[columnCounter++].innerText = deal[fieldName1];
        }

        // newRow.cells[columnCounter++].innerText = deal[fieldName2];
        {
            var a = document.createElement('a');
            var linkText = document.createTextNode(deal[fieldName2]);
            a.appendChild(linkText);
            a.title = deal[fieldName2];
            a.href = "#0";
            if (fieldName2 == 'ClientName') {
                a.setAttribute("onclick", "openTab('bulkDealersDiv');UpdateBulkDealTable('" + deal[fieldName2] + "');");
            } else {
                a.setAttribute("onclick", "OpenStockBulkDealsPage('" + deal[fieldName2] + "', '" + deal[fieldName1] + "','" + deal[fieldName1] + "');");
            }
            newRow.cells[columnCounter++].appendChild(a);
        }

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
        newRow.cells[columnCounter++].innerText = deal.Quantity.toCustomString();
        newRow.cells[columnCounter++].innerText = deal.Price.toCustomString(2);
    }
}

function FilterDealsFromLink(securityCode) {
    //ddlStocks.value = securityCode;
    txtFilterDealers.value = securityCode;
    UpdateStockBulkDealTable();
    document.getElementById('dateFilterDeals').value = '';
}

function FilterDeals(bulkDeals) {
    let result = [];
    let filter = txtFilterDeals.value.trim().toLowerCase();
    if (filter.length > 0) {
        for (let i = 0; i < bulkDeals.length; i++) {
            const bulkDeal = bulkDeals[i];
            if (bulkDeal.SecurityCode.toLowerCase().includes(filter) || bulkDeal.SecurityName.toLowerCase().includes(filter)) {
                result.push(bulkDeal);
            }
        }
        return result;
    }
    else {
        return bulkDeals;
    }
}

function UpdateLabel() {
    if (chkFilterDeals.checked) {
        txtFilterDeals.value = txtFilterDeals.getAttribute('code');
    }
    else {
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

