const stockHistoryTable = document.getElementById("stockHistory");

function ShowHistory(stock) {
    if (!stock.getAttribute('historyShown')) {
        const stockCodes = stock.getAttribute('codes');
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

        const histories = [...MergeStockData({ ...nseData[nseCode] }, { ...bseData[bseCode] }).History];

        if (todayDateHour.getHours() > 15 && todayDateHour.getMinutes() >= 30) {
            let history1, history2;
            if (nseData[nseCode] && (nseData[nseCode].Total > 0 || nseData[nseCode].Open || nseData[nseCode].BulkDeals)) {
                history1 = {
                    "HistoryDate": new Date(todayDate).toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" }),
                    ...nseData[nseCode],
                }
                history1.History && delete history1.History;
            }

            if (bseData[bseCode] && (bseData[bseCode].Total > 0 || bseData[bseCode].Open || bseData[bseCode].BulkDeals)) {
                history2 = {
                    "HistoryDate": new Date(todayDate).toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" }),
                    ...bseData[bseCode],
                }
                history2.History && delete history2.History;
            }

            if (history1 || history2) {
                const todaysHistory = MergeStockData(history1, history2);
                histories.unshift(todaysHistory);
            }
        }

        const rowIndex = stock.parentElement.parentElement.rowIndex;
        for (let i = 0; i < histories.length; i++) {
            const history = histories[i];
            let newRow = updateDataTable(stockHistoryTable, stock.getAttribute('title'), nseCode, bseCode, history);
            if (newRow) {
                if ((i + rowIndex) % 2 == 0) {
                    newRow.style.background = "#dddddd";
                }
                else {
                    newRow.style.background = "#f1f1f1";
                }
            }
        }
        updateRowNumber(stockHistoryTable, stock.parentElement.parentElement.cells[0].innerText);

        const newRow = addEmptyRow(dataTable, rowIndex + 1);

        const colspan = newRow.cells.length;
        while (newRow.cells.length > 0) {
            newRow.deleteCell(0);
        }
        var newCell = newRow.insertCell(0);
        newCell.colSpan = colspan;
        newCell.style.border = "3px lightcoral dashed";
        newCell.style.padding = "0";

        newCell.innerHTML = stockHistoryTable.parentElement.innerHTML;
        resetTable(stockHistoryTable);
        stock.setAttribute('historyShown', true);
    }
    else {
        dataTable.deleteRow(stock.parentElement.parentElement.rowIndex + 1);
        stock.removeAttribute('historyShown');
    }
}