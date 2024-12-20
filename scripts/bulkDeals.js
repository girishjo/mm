// Get the modal
const modal = document.getElementById("myModal");

// When the user clicks the button, open the modal 
function ShowBulkDeal(stock) {
    //event.preventDefault();
    let bulkDeals = [];
    const stockCodes = stock.getAttribute('codes');
    const historyDate = stock.getAttribute('historyDate');

    let nseCode, bseCode;
    const codes = stockCodes.split(',');
    if (codes.length == 2) {
        nseCode = codes[0];
        bseCode = codes[1];
    }
    else {
        nseCode = stockCodes;
        bseCode = stockCodes;
    }
    if (nseData[nseCode]) {
        if (historyDate) {
            nseData[nseCode].History && nseData[nseCode].History.forEach(his => {
                if (his.BulkDeals && his.HistoryDate == historyDate) {
                    bulkDeals.push(...his.BulkDeals);
                }
            });
            if (new Date(historyDate).toDateString() == todayDate.toDateString()) {
                nseData[nseCode].BulkDeals && bulkDeals.push(...nseData[nseCode].BulkDeals);
            }
        }
        else {
            nseData[nseCode].BulkDeals && bulkDeals.push(...nseData[nseCode].BulkDeals);
        }
    }
    if (bseData[bseCode]) {
        if (historyDate) {
            bseData[bseCode].History && bseData[bseCode].History.forEach(his => {
                if (his.BulkDeals && his.HistoryDate == historyDate) {
                    bulkDeals.push(...his.BulkDeals);
                }
            });
            if (new Date(historyDate).toDateString() == todayDate.toDateString()) {
                bseData[bseCode].BulkDeals && bulkDeals.push(...bseData[bseCode].BulkDeals);
            }
        }
        else {
            bseData[bseCode].BulkDeals && bulkDeals.push(...bseData[bseCode].BulkDeals);
        }
    }

    //a.SecurityCode.localeCompare(b.SecurityCode) ||
    bulkDeals.sort((a, b) =>
        a.ClientName.localeCompare(b.ClientName)
        || a.BuyOrSell.localeCompare(b.BuyOrSell)
        || a.Quantity - b.Quantity
        || a.Price - b.Price);

    const bulkDealsTable = document.getElementById("bulkDeals");
    var total = 0;
    for (let i = 0; i < bulkDeals.length; i++) {
        const bulkDeal = bulkDeals[i];
        const newRow = addEmptyRow(bulkDealsTable);
        newRow.cells[0].innerText = i + 1;

        //newRow.cells[1].innerText = bulkDeal.ClientName;
        {
            var a = document.createElement('a');
            var linkText = document.createTextNode(bulkDeal.ClientName);
            a.appendChild(linkText);
            a.title = bulkDeal.ClientName;
            a.href = "#0";
            a.setAttribute("onclick", "OpenClientBulkDealsPage(this.title, '" + nseCode + "','" + bseCode + "');");
            newRow.cells[1].appendChild(a);
        }

        newRow.cells[2].innerText = bulkDeal.BuyOrSell;
        if (bulkDeal.BuyOrSell == "Buy") {
            newRow.cells[3].style.color = 'green';
            total += bulkDeal.Quantity;
        }
        else if (bulkDeal.BuyOrSell == "Sell") {
            newRow.cells[3].style.color = 'red';
            total -= bulkDeal.Quantity;
            //bulkDeal.Quantity *= -1;
        }
        newRow.cells[3].innerText = bulkDeal.Quantity.toCustomString();
        newRow.cells[4].innerText = bulkDeal.Price.toCustomString(2);
    }

    const newRow = addEmptyRow(bulkDealsTable);
    newRow.setAttribute("frozen", true);
    newRow.cells[2].innerText = 'Total = ';
    newRow.cells[3].innerText = total.toLocaleString('en-In');
    if (total > 0) {
        newRow.cells[3].style.color = 'green';
    }
    else if (total < 0) {
        newRow.cells[3].style.color = 'red';
    }
    const bulkDealHeader = document.getElementById("bulkDealHeader");
    bulkDealHeader.innerText = "Bulk deals: " + stock.getAttribute('title');
    if (bulkDeals.length > 0) {
        bulkDealHeader.innerText += " [" + bulkDeals[0].Date + "]";

        {
            var a = document.createElement('a');
            var linkText = document.createTextNode('Show all deals');
            a.appendChild(linkText);
            a.title = stockCodes;
            a.href = "#0";
            a.style.marginLeft = "5px";
            a.setAttribute("onclick", "OpenStockBulkDealsPage('" + stock.getAttribute('title') + "', '" + nseCode + "','" + bseCode + "');");
            bulkDealHeader.appendChild(a);
        }
    }

    document.body.setAttribute('modal-shown', true);
    document.body.classList.add('modal-shown');
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
document.getElementById("modalCloser").onclick = function () {
    HideModal();
}

// When the user clicks anywhere outside of the modal, close it
window.addEventListener('click', function (event) {
    if (event.target == modal) {
        HideModal();
    }
});

window.addEventListener('keyup', function (event) {
    if (event.key === "Escape") {
        if (modal.style.display == "block") {
            HideModal();
        }
    }
});

function HideModal() {
    document.body.removeAttribute('modal-shown');
    document.body.classList.remove('modal-shown');
    modal.style.display = "none";
    resetTable("bulkDeals");
}

function OpenClientBulkDealsPage(clientName, nseCode, bseCode) {
    //HideModal();
    openTab('bulkDealersDiv');
    if (nseCode) {
        txtFilterDeals.setAttribute('code', nseCode);
        let stock = watchlists[activeWL].data.filter(sh => sh[1] == nseCode);
        if (stock.length > 0)
            lblFilterDeals.innerText = stock[0][0];
    }
    else {
        txtFilterDeals.setAttribute('code', bseCode);
        let stock = watchlists[activeWL].data.filter(sh => sh[1] == bseCode);
        if (stock.length > 0)
            lblFilterDeals.innerText = stock[0][0];
    }
    chkFilterDeals.style.display = 'initial';
    lblFilterDealsPrefix.style.display = 'initial';

    if (chkFilterDeals.checked) {
        txtFilterDeals.value = txtFilterDeals.getAttribute('code');
    }
    else{
        txtFilterDeals.value = "";
    }
    //chkFilterDeals.checked = true;
    UpdateBulkDealTable(clientName);
}


function OpenStockBulkDealsPage(stockName, nseCode, bseCode) {
    openTab('stockBulkDealsDiv');
    ddlStocks.value = nseCode || bseCode;
    document.getElementById('chkTodayDeals').checked = false;
    UpdateStockBulkDealTable();
}
