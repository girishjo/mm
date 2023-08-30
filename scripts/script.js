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
                a.href = "#";
                a.setAttribute("code", stockData.BulkDeals[0].SecurityCode);
                a.setAttribute("onclick", "OpenModal(this);");
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

            if (stockData.Open) {
                newRow.cells[5].innerText = stockData.Open.toLocaleString('en-In', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
            if (stockData.Close) {
                newRow.cells[6].innerText = stockData.Close.toLocaleString('en-In', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
            if (stockData.Change) {
                if (Number(stockData.Change)) {
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
    console.log(cell.innerHTML, row.rowIndex, cell.cellIndex);
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

function addEmptyRow(table, index = undefined) {
    //const emptyRow = table.getElementsByClassName('hide')[0];
    const emptyRow = table.rows[1];
    var clone = emptyRow.cloneNode(true); // copy children too
    clone.classList.remove("hide");
    var newRow = table.insertRow(index ?? index);
    newRow.innerHTML = clone.innerHTML;
    return newRow;
}

function updateRowNumber(table) {
    for (let index = 2; index < table.rows.length; index++) {
        table.rows[index].cells[0].innerText = index - 1;
    }
}

function sortTable(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = dataTable;
    switching = true;
    //Set the sorting direction to ascending:
    dir = "asc";
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 2; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /*check if the two rows should switch place,
            based on the direction, asc or desc:*/
            let numX = Number(x.innerText.replace(/,/g, "").replace("%", ""));
            let numY = Number(y.innerText.replace(/,/g, "").replace("%", ""));
            if (dir == "asc") {
                if (isNaN(numX) || isNaN(numY)) {
                    if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
                else {
                    if (numX > numY) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            } else if (dir == "desc") {
                if (isNaN(numX) || isNaN(numY)) {
                    if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
                else {
                    if (numX < numY) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch
            and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            //Each time a switch is done, increase this count by 1:
            switchcount++;
        } else {
            /*If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again.*/
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
    if (n > 0) {
        updateRowNumber(dataTable);
    }
}

function resetTable(table) {
    for (let i = 2; i < table.rows.length; i) {
        table.deleteRow(i);
    }
}
