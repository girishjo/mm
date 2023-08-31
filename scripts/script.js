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
        updateDataTable();
    } else {
        if (localStorage.length > 0) {
            let stocksListValue = localStorage.getItem("stocksList");
            if (stocksListValue) {
                const stockList = JSON.parse(stocksListValue);
                updateListTable(stockList);
                updateDataTable();
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
        }
    }
    if (listTable.rows.length == 2) {
        addEmptyRow(listTable);
    }
    updateRowNumber(listTable);
}

function updateDataTable() {
    for (let i = 2; i < listTable.rows.length; i++) {
        const listRow = listTable.rows[i];
        const stockData = {
            "Name": listRow.cells[3].innerText,
            "Delivery": 0,
            "Total": 0,
            "DeliveryPercentage": 0,
            "Open": undefined,
            "Close": undefined,
            "Change": undefined,
            "BulkDeals": [],
        }

        let res = nseData[listRow.cells[4].innerText];
        if (res) {
            stockData.Delivery = res["Delivery"];
            stockData.Total = res["Total"];
            //stockData.DeliveryPercentage = res["DeliveryPercentage"];
            stockData.Open = res["Open"];
            stockData.Close = res["Close"];
            stockData.Change = (res["Close"] - res["PrevClose"]) * 100 / res["PrevClose"];
            if (res["PrevClose"] > 0) {
                stockData.Change = (res["Close"] - res["PrevClose"]) * 100 / res["PrevClose"];
            }
            else {
                stockData.Change = "NA";
            }
            if (res.BulkDeals && res.BulkDeals.length > 0) {
                stockData.BulkDeals.push(...res.BulkDeals);
            }
        }

        res = bseData[listRow.cells[5].innerText];
        if (res) {
            stockData.Delivery += res["Delivery"];
            stockData.Total += res["Total"];
            //stockData.DeliveryPercentage = res["DeliveryPercentage"];       
            if (!stockData.Open) {
                stockData.Open = res["Open"];
                stockData.Close = res["Close"];
                if (res["PrevClose"] > 0) {
                    stockData.Change = (res["Close"] - res["PrevClose"]) * 100 / res["PrevClose"];
                }
                else {
                    stockData.Change = "NA";
                }
            }
            if (res.BulkDeals && res.BulkDeals.length > 0) {
                stockData.BulkDeals.push(...res.BulkDeals);
            }
        }

        if (stockData.Name) {
            const newRow = addEmptyRow(dataTable);
            if (stockData.BulkDeals && stockData.BulkDeals.length > 0) {
                var a = document.createElement('a');
                var linkText = document.createTextNode(stockData.Name);
                a.appendChild(linkText);
                a.title = stockData.Name;
                a.href = "#0";
                a.setAttribute("code", stockData.BulkDeals[0].SecurityCode);
                a.setAttribute("onclick", "OpenModal(this);");
                newRow.cells[1].classList.add("bulkdeal");
                newRow.cells[1].appendChild(a);
            }
            else {
                newRow.cells[1].innerText = stockData.Name;
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
                if (Number(stockData.Change) != NaN) {
                    newRow.cells[7].innerText = stockData.Change.toFixed(2).toLocaleString('en-In') + " %";
                }
                else {
                    newRow.cells[7].innerText = stockData.Change;
                }
            }

            updateRowNumber(dataTable);
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