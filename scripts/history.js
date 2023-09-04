const stockHistoryTable = document.getElementById("stockHistory");

function ShowHistory(stock) {
    if (!stock.getAttribute('historyShown')) {
        let histories = [];
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
        if (nseData[nseCode]) {
            histories = nseData[nseCode].History;
        }
        else {
            nseCode = undefined;
        }
        if (bseData[bseCode]) {
            histories.push(...bseData[bseCode].History);
        }
        else {
            bseCode = undefined;
        }

        for (let i = 0; i < histories.length; i++) {
            const history = histories[i];
            updateDataTable(stockHistoryTable, stock.getAttribute('title'), nseCode, bseCode, history);
        }
        const newRow = addEmptyRow(dataTable, stock.parentElement.parentElement.rowIndex + 1);
        const colspan = newRow.cells.length;
        while (newRow.cells.length > 0) {
            newRow.deleteCell(0);
        }
        var newCell = newRow.insertCell(0);
        newCell.colSpan = colspan;
        
        newCell.innerHTML = stockHistoryTable.parentElement.innerHTML;
        resetTable(stockHistoryTable);
        stock.setAttribute('historyShown', true);
    }
    else {
        dataTable.deleteRow(stock.parentElement.parentElement.rowIndex + 1);
        stock.removeAttribute('historyShown');
    }
}