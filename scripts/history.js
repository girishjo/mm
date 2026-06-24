const stockHistoryTable = document.getElementById("stockHistory");
var historyStock, historyTable;
var tableToUpdateWithHistory;

function GetBseCodeFromTicker(ticker) {
    if (!bseData || typeof bseData !== 'object') {
        return undefined;
    }

    for (const code in bseData) {
        const stock = bseData[code];
        if (!stock) continue;

        if (stock.Ticker == ticker) {
            return code;
        }

        const historyEntries = stock.History || stock.history;
        if (historyEntries && Array.isArray(historyEntries) && historyEntries.some(entry => entry.Ticker == ticker)) {
            return code;
        }
    }

    return undefined;
}

function GetExchangeCodesFromTicker(ticker) {
    let nseCode, bseCode;
    if (ticker) {
        ticker = ticker.toUpperCase();
        if (nseData[ticker]) {
            nseCode = ticker;
        }
        bseCode = GetBseCodeFromTicker(ticker);
    }

    return [nseCode, bseCode];
}


function GetHistory(ticker, stockCodes) {
    let nseCode, bseCode;
    if (ticker) {
        [nseCode, bseCode] = GetExchangeCodesFromTicker(ticker);
    }
    else if (stockCodes) {
        const codes = stockCodes.split(',');
        if (codes.length == 2) {
            nseCode = codes[0] ? codes[0] : undefined;
            bseCode = codes[1] ? codes[1] : undefined;
        }
        else {
            nseCode = nseData[stockCodes] ? stockCodes : undefined;
            bseCode = bseData[stockCodes] ? stockCodes : undefined;
        }
    }

    if (!nseCode && !bseCode) {
        return [];
    }

    const hist = MergeStockData(nseCode && { ...nseData[nseCode] }, bseCode && { ...bseData[bseCode] })?.History;
    const histories = hist ? [...hist] : [];

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
    return { histories, nseCode, bseCode };
}

function ShowHistory(stock, tableToUpdate = dataTable) {
    tableToUpdateWithHistory = tableToUpdate;
    if (stock.getAttribute('historyShown') != 'true') {
        HideHistory(tableToUpdateWithHistory);
        historyStock = stock;
        const historyRow = historyStock.parentElement.parentElement.rowIndex;
        const stockCodes = historyStock.getAttribute('codes');

        const { histories, nseCode, bseCode } = GetHistory(undefined, stockCodes);

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
        stockHistoryTable.rows[0].cells[0].setAttribute("prefix", historyStock.parentElement.parentElement.cells[0].innerText);
        updateRowNumber(stockHistoryTable);

        const newRow = addEmptyRow(tableToUpdateWithHistory, historyRow + 1);

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
        HideHistory(tableToUpdateWithHistory);
    }
}

function HideHistory(tableToUpdate) {
    if (historyStock && historyStock.getAttribute('historyShown')) {
        historyStock.setAttribute('historyShown', false)
    }
    if (historyTable) {
        const newRowIndex = historyTable.rowIndex;
        tableToUpdate.deleteRow(newRowIndex);
        historyTable = undefined;
    }
}

window.addEventListener('click', function (event) {
    if (!((historyStock && historyStock.closest('tr').contains(event.target)) || (historyTable && historyTable.contains(event.target)) || modal.contains(event.target) || event.target.classList.contains("tablinks"))) {
        HideHistory(tableToUpdateWithHistory);
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
