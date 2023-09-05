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
    const stockData = {
        "Name": name,
        "Delivery": 0,
        "Total": 0,
        "DeliveryPercentage": 0,
        "Open": undefined,
        "Close": undefined,
        "Change": undefined,
        "BulkDeals": [],
        "History": [],
    }

    let resNse = data && nseCode ? data : nseData[nseCode];
    if (resNse) {
        resNse["Delivery"] && (stockData.Delivery = resNse["Delivery"]);
        resNse["Total"] && (stockData.Total = resNse["Total"]);
        //stockData.DeliveryPercentage = resNse["DeliveryPercentage"];
        resNse["Open"] && (stockData.Open = resNse["Open"]);
        resNse["Close"] && (stockData.Close = resNse["Close"]);
        resNse["PrevClose"] && (stockData.Change = (resNse["Close"] - resNse["PrevClose"]) * 100 / resNse["PrevClose"]);
        if (resNse["PrevClose"] && resNse["PrevClose"] != 0) {
            stockData.Change = (resNse["Close"] - resNse["PrevClose"]) * 100 / resNse["PrevClose"];
        }

        if (resNse.BulkDeals && resNse.BulkDeals.length > 0) {
            stockData.BulkDeals.push(...resNse.BulkDeals);
        }

        if (resNse.History && resNse.History.length > 0) {
            stockData.History.push(...resNse.History);
        }
    }

    let resBse = data && bseCode ? data : bseData[bseCode];

    if (resBse) {
        stockData.Delivery += resBse["Delivery"];
        stockData.Total += resBse["Total"];
        //stockData.DeliveryPercentage = resBse["DeliveryPercentage"];       
        if (!stockData.Open) {
            stockData.Open = resBse["Open"];
            stockData.Close = resBse["Close"];
            if (resBse["PrevClose"] && resBse["PrevClose"] != 0) {
                stockData.Change = (resBse["Close"] - resBse["PrevClose"]) * 100 / resBse["PrevClose"];
            }
        }
        if (resBse.BulkDeals && resBse.BulkDeals.length > 0) {
            stockData.BulkDeals.push(...resBse.BulkDeals);
        }

        if (resBse.History && resBse.History.length > 0) {
            stockData.History.push(...resBse.History);
        }
    }

    if (stockData.Name) {
        const newRow = addEmptyRow(table, rowIndex);
        data && (newRow.cells[0].innerText = data.HistoryDate);

        if (stockData.History && stockData.History.length > 0) {
            var a = document.createElement('a');
            var linkText = document.createTextNode(stockData.Name);
            a.appendChild(linkText);
            a.title = stockData.Name;
            a.href = "#0";
            const codes = [];
            resNse && codes.push(nseCode);
            resBse && codes.push(bseCode);
            a.setAttribute("codes", codes);
            a.setAttribute("onclick", "ShowHistory(this);");
            newRow.cells[1].appendChild(a);
        }
        else {
            newRow.cells[1].innerText = stockData.Name;
        }

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
            resNse && codes.push(nseCode);
            resBse && codes.push(bseCode);
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