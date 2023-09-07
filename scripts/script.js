const dataValidityTable = document.querySelector('#dataValidity');
const listTable = document.querySelector('#stocksList');
const dataTable = document.querySelector('#stockData');

function saveDataOnLocal(data, silentUpdate = false) {
    let listTableObj;
    if (data) {
        listTableObj = data;
    } else {
        listTableObj = toObject(listTable);
    }
    let jsonStr = JSON.stringify(listTableObj);
    window.localStorage.setItem("stocksList", jsonStr);
    if (!silentUpdate) {
        alert('List saved');
    }
    window.location.reload();
}

function loadDataFromLocal(data) {
    if (data) {
        resetTable(listTable);
        resetTable(dataTable);
        const stockList = JSON.parse(data);
        updateListTable(stockList);
    } else {
        if (localStorage.length > 0) {
            let stocksListValue = localStorage.getItem("stocksList");
            if (stocksListValue) {
                const stockList = JSON.parse(stocksListValue);
                updateListTable(stockList);
            }
        }
        else {
            saveDataOnLocal(defaultStockList, true);
        }
    }
    if (listTable.rows.length == 2) {
        addEmptyRow(listTable);
        listTable.parentElement.style.display = 'block';
    }
    updateRowNumber(listTable);
}

function downloadLocalCopy(jsnData) {
    if (localStorage.length > 0) {
        let stocksListValue = localStorage.getItem("stocksList");
        var a = document.createElement("a");
        a.href = URL.createObjectURL(
            new Blob([stocksListValue], { type: "application/json" })
        );
        a.download = "stocksList.json";
        a.click();
    }
    else {
        alert('No stock in list to download');
    }
}


function loadLocalCopy(e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var contents = e.target.result;
        loadDataFromLocal(contents);
    };
    reader.readAsText(file);
}

function loadDefaultStockList() {
    if (confirm("It will overwrite your existing data. Proceed?")) {
        saveDataOnLocal(defaultStockList, true);
    }
}

function updateListTable(stockList) {
    for (let i = 0; i < stockList.length; i++) {
        if (stockList[i][0]) {
            const newRow = addEmptyRow(listTable);
            newRow.cells[3].innerText = stockList[i][0];
            newRow.cells[4].innerText = stockList[i][1];
            newRow.cells[5].innerText = stockList[i][2];
            updateDataTable(dataTable, stockList[i][0], stockList[i][1], stockList[i][2]);
        }
    }
    if (listTable.rows.length == 2) {
        addEmptyRow(listTable);
    }
    updateRowNumber(listTable);
    updateRowNumber(dataTable);
}

function updateDataTable(table, name, nseCode, bseCode, data = undefined, rowIndex = undefined) {
    const stockData = MergeStockData(data && nseCode ? data : nseData[nseCode], data && bseCode ? data : bseData[bseCode])
    stockData.Name = name;
    if (stockData.PrevClose != 0)
        stockData.Change = (stockData.Close - stockData.PrevClose) * 100 / stockData.PrevClose;

    var newRow;
    if (stockData.Name) {
        newRow = addEmptyRow(table, rowIndex);

        if (stockData.History && stockData.History.length > 0) {
            var a = document.createElement('a');
            var linkText = document.createTextNode(stockData.Name);
            a.appendChild(linkText);
            a.title = stockData.Name;
            a.href = "#0";
            const codes = [];
            nseCode && codes.push(nseCode);
            bseCode && codes.push(bseCode);
            a.setAttribute("codes", codes);
            a.setAttribute("onclick", "ShowHistory(this);");
            newRow.cells[1].appendChild(a);
        }
        else {
            newRow.cells[1].innerText = stockData.Name;
        }

        data && (newRow.cells[1].innerText = data.HistoryDate);

        if (stockData.BulkDeals && stockData.BulkDeals.length > 0) {
            var a = document.createElement('a');
            let linkTextContent = "Bulk Deal";
            if (stockData.BulkDeals.length > 1) {
                linkTextContent += "s";
            }
            var linkText = document.createTextNode(linkTextContent);
            a.appendChild(linkText);
            a.title = stockData.Name;
            a.href = "#0";
            const codes = [];
            nseCode && codes.push(nseCode);
            bseCode && codes.push(bseCode);
            a.setAttribute("codes", codes);
            a.setAttribute("onclick", "OpenModal(this);");
            data && a.setAttribute("historyDate", data.HistoryDate);
            a.classList.add("highlight");
            newRow.cells[1].appendChild(a);
        }

        if (Number(stockData.Delivery)) {
            newRow.cells[2].innerText = stockData.Delivery.toLocaleString('en-In');
        }
        if (Number(stockData.Total)) {
            newRow.cells[3].innerText = stockData.Total.toLocaleString('en-In');
        }
        if (stockData.Total > 0) {
            const deliveryPercentage = ((stockData.Delivery / stockData.Total) * 100).toFixed(2);

            newRow.cells[4].innerText = deliveryPercentage + " %";
            if (deliveryPercentage >= 75) {
                newRow.classList.add('green-row');
            }
            else if (deliveryPercentage >= 50 && deliveryPercentage < 75) {
                newRow.classList.add('orange-row');
            }
            else {
                newRow.classList.add('red-row');
            }
        }

        if (stockData.Open != undefined) {
            newRow.cells[5].innerText = stockData.Open.toLocaleString('en-In', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        if (stockData.Close != undefined) {
            newRow.cells[6].innerText = stockData.Close.toLocaleString('en-In', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        if (stockData.Change != undefined) {
            newRow.cells[7].innerText = stockData.Change;
            if (Number(stockData.Change)) {
                newRow.cells[7].innerText = stockData.Change.toFixed(2).toLocaleString('en-In') + " %";
            }
        }
    }

    return newRow;
}

listTable.addEventListener('click', function (e) {
    const cell = e.target.closest('td');
    if (!cell) { return; } // Quit, not clicked on a cell
    const row = cell.parentElement;
    if (cell.classList.contains('add')) {
        addEmptyRow(listTable, row.rowIndex + 1);
        updateRowNumber(listTable);
    }
    else if (cell.classList.contains('remove')) {
        listTable.deleteRow(row.rowIndex);
        if (listTable.rows.length == 2) {
            addEmptyRow(listTable);
        }
        updateRowNumber(listTable);
    }
});