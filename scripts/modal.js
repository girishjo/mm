// Get the modal
var modal = document.getElementById("myModal");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

const bulkDealsTable = document.getElementById("bulkDeals");
const bulkDealHeader = document.getElementById("bulkDealHeader");

// When the user clicks the button, open the modal 
function OpenModal(stock) {
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
                if (his.HistoryDate == historyDate) {
                    bulkDeals.push(...his.BulkDeals);
                }
            });
            if (new Date(historyDate).toDateString() == today.toDateString()) {
                nseData[nseCode].BulkDeals && bulkDeals.push(...nseData[nseCode].BulkDeals);
            }
        }
        else {
            bulkDeals = nseData[nseCode].BulkDeals;
        }
    }
    if (bseData[bseCode]) {
        if (historyDate) {
            bseData[bseCode].History && bseData[bseCode].History.forEach(his => {
                if (his.HistoryDate == historyDate) {
                    bulkDeals.push(...his.BulkDeals);
                }
            });
            if (new Date(historyDate).toDateString() == today.toDateString()) {
                nseData[nseCode].BulkDeals && bulkDeals.push(...nseData[nseCode].BulkDeals);
            }
        }
        else {
            bulkDeals.push(...bseData[bseCode].BulkDeals);
        }
    }
    var total = 0;
    for (let i = 0; i < bulkDeals.length; i++) {
        const bulkDeal = bulkDeals[i];
        const newRow = addEmptyRow(bulkDealsTable);
        newRow.cells[0].innerText = i + 1;
        newRow.cells[1].innerText = bulkDeal.Date;
        newRow.cells[2].innerText = bulkDeal.ClientName;
        newRow.cells[3].innerText = bulkDeal.BuyOrSell;
        if (bulkDeal.BuyOrSell == "Buy") {
            newRow.cells[3].style.color = 'green';
            total += bulkDeal.Quantity;
        }
        else if (bulkDeal.BuyOrSell == "Sell") {
            newRow.cells[3].style.color = 'red';
            total -= bulkDeal.Quantity;
            //bulkDeal.Quantity *= -1;
        }
        newRow.cells[4].innerText = bulkDeal.Quantity.toLocaleString('en-In');
        newRow.cells[5].innerText = bulkDeal.Price.toLocaleString('en-In', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    const newRow = addEmptyRow(bulkDealsTable);
    newRow.setAttribute("frozen", true);
    newRow.cells[3].innerText = 'Total = ';
    newRow.cells[4].innerText = total.toLocaleString('en-In');
    if (total > 0) {
        newRow.cells[3].style.color = 'green';
    }
    else if (total < 0) {
        newRow.cells[3].style.color = 'red';
    }
    bulkDealHeader.innerText = "Bulk Deals: " + stock.getAttribute('title');
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    HideModal();
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    event.preventDefault();
    if (event.target == modal) {
        HideModal();
    }
}

window.onkeyup = (e => {
    if (e.key === "Escape") {
        if (modal.style.display == "block") {
            HideModal();
        }
    }
});

function HideModal() {
    modal.style.display = "none";
    resetTable(bulkDealsTable);
}