// Get the modal
var modal = document.getElementById("myModal");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

const bulkDealsTable = document.getElementById("bulkDeals");
const bulkDealHeader = document.getElementById("bulkDealHeader");

// When the user clicks the button, open the modal 
function OpenModal(stock) {
    resetTable(bulkDealsTable);
    const stockCode = stock.getAttribute('code');
    let bulkDeals = [];
    if (nseData[stockCode]) {
        bulkDeals = nseData[stockCode].BulkDeals;
    } else if (bseData[stockCode]) {
        bulkDeals = bseData[stockCode].BulkDeals;
    }
    for (let i = 0; i < bulkDeals.length; i++) {
        const bulkDeal = bulkDeals[i];
        const newRow = addEmptyRow(bulkDealsTable);
        newRow.cells[0].innerText = i + 1;
        newRow.cells[1].innerText = bulkDeal.ClientName;
        newRow.cells[2].innerText = bulkDeal.BuyOrSell;
        newRow.cells[3].innerText = bulkDeal.Quantity.toLocaleString('en-In');
        newRow.cells[4].innerText = bulkDeal.Price.toLocaleString('en-In', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    bulkDealHeader.innerText = stock.getAttribute('title') + " Bulk Deals";
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}