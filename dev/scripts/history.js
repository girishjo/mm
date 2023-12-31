const stockHistoryTable = document.getElementById("stockHistory");
var historyStock, historyTable;

function ShowHistory(stock) {
    if (stock.getAttribute('historyShown') != 'true') {
        HideHistory();
        historyStock = stock;
        const historyRow = historyStock.parentElement.parentElement.rowIndex;
        const stockCodes = historyStock.getAttribute('codes');
        let nseCode, bseCode;
        const codes = stockCodes.split(',');
        if (codes.length == 2) {
            nseCode = codes[0];
            bseCode = codes[1];
        }
        else {
            nseCode = nseData[stockCodes] ? stockCodes : undefined;
            bseCode = bseData[stockCodes] ? stockCodes : undefined;
        }

        const histories = [...MergeStockData({ ...nseData[nseCode] }, { ...bseData[bseCode] }).History];

        //if (todayDateHour < new Date()) 
        {
            let history1, history2;
            if (nseData[nseCode] && (nseData[nseCode].Total > 0 || nseData[nseCode].Open || nseData[nseCode].BulkDeals)) {
                history1 = {
                    "HistoryDate": todayDate.toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" }),
                    ...nseData[nseCode],
                }
                history1.History && delete history1.History;
            }

            if (bseData[bseCode] && (bseData[bseCode].Total > 0 || bseData[bseCode].Open || bseData[bseCode].BulkDeals)) {
                history2 = {
                    "HistoryDate": todayDate.toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" }),
                    ...bseData[bseCode],
                }
                history2.History && delete history2.History;
            }

            if (history1 || history2) {
                const todaysHistory = MergeStockData(history1, history2);
                histories.unshift(todaysHistory);
            }
        }

        for (let i = 0; i < histories.length; i++) {
            const history = histories[i];
            let newRow = updateDataTable(stockHistoryTable, historyStock.getAttribute('title'), nseCode, bseCode, history);
            if (newRow) {
                if ((i + historyRow) % 2 == 0) {
                    newRow.style.background = "#dddddd";
                }
                else {
                    newRow.style.background = "#f1f1f1";
                }
            }
        }
        updateRowNumber(stockHistoryTable, historyStock.parentElement.parentElement.cells[0].innerText);

        const newRow = addEmptyRow(dataTable, historyRow + 1);

        const colspan = newRow.cells.length;
        while (newRow.cells.length > 0) {
            newRow.deleteCell(0);
        }
        var newCell = newRow.insertCell(0);
        newCell.colSpan = colspan;
        newCell.style.border = "3px lightcoral dashed";
        newCell.style.padding = "0";

        //const existCellText = stockHistoryTable.rows[0].cells[1].innerHTML;
        //stockHistoryTable.rows[0].cells[1].innerHTML = historyStock.getAttribute('title') + " [" + existCellText + "]";
        newCell.innerHTML = stockHistoryTable.parentElement.innerHTML;
        resetTable(stockHistoryTable);
        //stockHistoryTable.rows[0].cells[1].innerHTML = existCellText;
        historyStock.setAttribute('historyShown', true);
        historyTable = newRow;
        //historyStock.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    else {
        HideHistory();
    }
}

function HideHistory() {
    if (historyStock && historyStock.getAttribute('historyShown')) {
        historyStock.setAttribute('historyShown', false)
    }
    if (historyTable) {
        const newRowIndex = historyTable.rowIndex;
        dataTable.deleteRow(newRowIndex);
        historyTable = undefined;
    }
}

window.addEventListener('click', function (event) {
    if (!((historyStock && historyStock.closest('tr').contains(event.target)) || (historyTable && historyTable.contains(event.target)) || modal.contains(event.target) || event.target.classList.contains("tablinks"))) {
        HideHistory();
    }
    /*
    if (((historyTable && !historyTable.contains(event.target))
        && (event.target.parentElement && !event.target.parentElement.contains(historyStock))
        && !modal.contains(event.target))
        || document.body.contains(event.target)) {
        HideHistory();
    }
    */
});
