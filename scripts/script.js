const listTable = document.querySelector('#stocksList');
const dataTable = document.querySelector('#stockData');

function loadDataFromLocal() {
    if (document.cookie.length != 0) {
        var cookieArray = document.cookie.split("=");
        const stockList = JSON.parse(cookieArray[1]);
        updateListTable(stockList);
        updateDataTable();
    }
    if (listTable.rows.length == 2) {
        addEmptyRow(listTable);
    }
}

function updateListTable(stockList) {
    for (let i = 0; i < stockList.length; i++) {
        if (stockList[i][0]) {
            const newRow = addEmptyRow(listTable);
            newRow.cells[3].innerText = stockList[i][0];
            newRow.cells[4].innerText = stockList[i][1];
            newRow.cells[5].innerText = stockList[i][2];
            newRow.cells[6].innerText = stockList[i][3];
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
            "DeliveryPercentage": 0
        }

        let res = nseData[listRow.cells[4].innerText];
        if (res) {
            stockData.Delivery = res["Delivery"];
            stockData.Total = res["Total"];
            //stockData.DeliveryPercentage = res["DeliveryPercentage"];
        }

        res = bseData[listRow.cells[5].innerText];
        if (res) {
            stockData.Delivery += res["Delivery"];
            stockData.Total += res["Total"];
            //stockData.DeliveryPercentage = res["DeliveryPercentage"];
        }

        if (stockData.Total > 0) {
            const newRow = addEmptyRow(dataTable);
            newRow.cells[1].innerText = stockData.Name;
            newRow.cells[2].innerText = stockData.Delivery.toLocaleString('en-In');
            newRow.cells[3].innerText = stockData.Total.toLocaleString('en-In');
            newRow.cells[4].innerText = ((stockData.Delivery / stockData.Total) * 100).toFixed(2) + " %";
            updateRowNumber(dataTable);
        }
    }
}

function saveDataOnLocal() {
    const jsonStr = JSON.stringify(toObject(listTable));
    document.cookie = "stocksList=" + jsonStr;
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

function BseCSVToJSON(csvString, separator) {
    const lines = csvString.split('\r\n');
    const keys = lines[0].split(separator);
    let res = lines.slice(1).map(line => {
        return line.split(separator).reduce((acc, cur, i) => {
            const toAdd = {};
            toAdd[keys[i]] = cur;
            return { ...acc, ...toAdd };
        }, {});
    });

    var a = {};
    res.forEach(itm => {
        if (itm['SCRIP CODE']) {
            a[itm['SCRIP CODE']] = {
                Delivery: Number(itm["DELIVERY QTY"]),
                Total: Number(itm["DAY'S VOLUME"]),
                DeliveryPercentage: Number(itm["DELV. PER."]),
                "Date": itm["DATE"],
            };
        }
    });
    return a;
}

function NseCSVToJSON(csvString, separator) {
    const lines = csvString.split('\n');
    const keys = lines[3].split(separator);
    keys.splice(3, 0, 'secrity_type');
    let res = lines.slice(4).map(line => {
        return line.split(separator).reduce((acc, cur, i) => {
            const toAdd = {};
            toAdd[keys[i]] = cur;
            return { ...acc, ...toAdd };
        }, {});
    });

    var a = {};
    res.forEach(itm => {
        if (itm['Name of Security']) {
            a[itm['Name of Security']] = {
                Delivery: Number(itm["Deliverable Quantity(gross across client level)"]),
                Total: Number(itm["Quantity Traded"]),
                DeliveryPercentage: Number(itm["% of Deliverable Quantity to Traded Quantity"])
            };
        }
    });
    return a;
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
    updateRowNumber(dataTable);
}

function resetTable(table) {
    for (let i = 2; i < table.rows.length; i) {
        table.deleteRow(i);
    }
}