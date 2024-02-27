function addEmptyRow(table, index = undefined) {
    //const emptyRow = table.getElementsByClassName('hide')[0];
    const emptyRow = table.rows[1];
    var clone = emptyRow.cloneNode(true); // copy children too
    clone.classList.remove("hide");
    var newRow = table.insertRow(index ?? index);
    newRow.innerHTML = clone.innerHTML;
    [...clone.attributes].forEach(attr => { newRow.setAttribute(attr.nodeName, attr.nodeValue) });
    return newRow;
}

function updateRowNumber(table) {
    const prefix = table.rows[0].cells[0].getAttribute("prefix");
    for (let index = 2; index < table.rows.length; index++) {
        if (!table.rows[index].getAttribute('frozen')) {
            if (prefix) {
                table.rows[index].cells[0].innerText = prefix + "." + (index - 1);
            } else {
                table.rows[index].cells[0].innerText = index - 1;
            }
        }
    }
}

function sortTable(header) {
    UpdateLoader(true, "Sorting table");
    event.preventDefault();
    var rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    var table = header.closest('table');
    var n = header.cellIndex;
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
            if (rows[i].getAttribute('frozen') || rows[i + 1].getAttribute('frozen')) {
                continue;
            }
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /*check if the two rows should switch place,
            based on the direction, asc or desc:*/

            let firstText = x.firstChild?.nodeValue || x.innerText || x.querySelector('a')?.innerText;
            let secondText = y.firstChild?.nodeValue || y.innerText || y.querySelector('a')?.innerText;

            let item1, item2, type;
            switch (true) {
                case x.classList.contains('number'):
                    type = 'number';
                    if (firstText == undefined)
                        item1 = 0;
                    else
                        item1 = Number(firstText?.replace(/,/g, "").replace("%", ""));  //.replace(".", "")

                    if (secondText == undefined)
                        item1 = 0;
                    else
                        item2 = Number(secondText?.replace(/,/g, "").replace("%", "")); //.replace(".", "")
                    break;
                case x.classList.contains('date'):
                    type = 'date';
                    if (firstText == undefined)
                        item1 = 0;
                    else
                        item1 = new Date(firstText);

                    if (secondText == undefined)
                        item1 = 0;
                    else
                        item2 = new Date(secondText);
                    break;
                case x.classList.contains('text'):
                default:
                    type = 'text';
                    if (firstText == undefined)
                        item1 = "";
                    else
                        item1 = firstText.toLowerCase();

                    if (secondText == undefined)
                        item2 = "";
                    else
                        item2 = secondText.toLowerCase();
                    break;
            }

            if (dir == "asc") {
                if (item1 > item2) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (item1 < item2) {
                    shouldSwitch = true;
                    break;
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
        updateRowNumber(table);
    }
    UpdateLoader(false);
}

function resetTable(table) {
    if (typeof table == 'string') {
        table = document.getElementById(table);
    }
    for (let i = 2; i < table.rows.length; i) {
        table.deleteRow(i);
    }
}

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

function MergeStockData(stockData1, stockData2) {
    var stockData = { ...stockData2, ...stockData1 };

    if (!stockData1 && !stockData2)
        return stockData;
    else if (!stockData2)
        return stockData1;
    else if (!stockData1)
        return stockData2;

    stockData.Delivery = (stockData1["Delivery"] ? stockData1["Delivery"] : 0) + (stockData2["Delivery"] ? stockData2["Delivery"] : 0);
    stockData.Total = (stockData1["Total"] ? stockData1["Total"] : 0) + (stockData2["Total"] ? stockData2["Total"] : 0);
    stockData.DeliveryPercentage = stockData.Delivery / stockData.Total;

    stockData.BulkDeals = [];
    if (stockData1.BulkDeals && stockData1.BulkDeals.length > 0) {
        stockData.BulkDeals.push(...stockData1.BulkDeals);
    }

    if (stockData2.BulkDeals && stockData2.BulkDeals.length > 0) {
        stockData.BulkDeals.push(...stockData2.BulkDeals);
    }
    if (stockData.BulkDeals.length == 0)
        delete stockData.BulkDeals;

    if (!stockData1.History || !stockData2.History) {

    }
    else if (stockData1.History && stockData2.History)
        stockData.History = MergeHistory([...stockData1.History], [...stockData2.History]);
    else if (!stockData1.History)
        stockData.History = [...stockData2.History];
    else if (!stockData2.History)
        stockData.History = [...stockData1.History];

    return stockData;
}

function MergeHistory(historyData1, historyData2) {
    var History = [];

    if (historyData1) {
        while (historyData1.length) {
            const history1 = historyData1[0];
            let history2 = historyData2.find(his => his.HistoryDate == history1.HistoryDate);
            if (history2) {
                var history = MergeStockData(history1, history2);
                history.HistoryDate = history1.HistoryDate;
                History.push(history);
                historyData1.splice(0, 1);
                historyData2.splice(historyData2.findIndex(e => e.HistoryDate === history2.HistoryDate), 1);
            }
            else {
                History.push(history1);
                historyData1.splice(0, 1);
            }
        }
    }

    if (historyData2) {
        while (historyData2.length) {
            const history2 = historyData2[0];
            let history1 = historyData1.find(his => his.HistoryDate == history2.HistoryDate);
            if (history1) {
                var history = MergeStockData(history2, history1);
                history.HistoryDate = history2.HistoryDate;
                History.push(history);
                historyData2.splice(0, 1);
                historyData1.splice(historyData1.findIndex(e => e.HistoryDate === history1.HistoryDate), 1);
            }
            else {
                History.push(history2);
                historyData2.splice(0, 1);
            }
        }
    }
    if (History.length == 0)
        return;
    else
        return History;
}

async function GetData(fileName) {
    let response = await fetch('./data/' + fileName);
    let dataJson = await response.json();
    return dataJson;
}

function toObject(table) {
    const result = []
    for (let i = 0; i < table.tBodies[0].rows.length; i++) {
        const row = table.tBodies[0].rows[i];
        if (!row.classList.contains('hide')) {
            const res = [];
            for (let j = 0; j < row.cells.length; j++) {
                const cell = row.cells[j];
                j > 3 && res.push(cell.textContent);
            }
            res.length > 0 && res[0].trim() != "" && result.push(res);
        }
    }
    return result;
}

function GetPreviousWorkingDate(inputDate) {
    let refDate = new Date(inputDate);
    if (refDate.getDay() == 0)
        refDate = new Date(refDate.setDate(refDate.getDate() - 2));
    else if (refDate.getDay() == 6)
        refDate = new Date(refDate.setDate(refDate.getDate() - 1));
    else if (refDate.getDay() == 1 && refDate.getHours() < 6)
        refDate = new Date(refDate.setDate(refDate.getDate() - 3));
    else if (refDate.getHours() < 6) {
        refDate = new Date(refDate.setDate(refDate.getDate() - 1));
    }
    return refDate;
}

function GetNextWorkingDate(inputDate) {
    let refDate = new Date(inputDate);
    if (refDate.getDay() == 0)
        refDate = new Date(refDate.setDate(refDate.getDate() + 1));
    else if (refDate.getDay() == 6)
        refDate = new Date(refDate.setDate(refDate.getDate() + 2));
    else if (refDate.getDay() == 5)
        refDate = new Date(refDate.setDate(refDate.getDate() + 3));
    else {
        refDate = new Date(refDate.setDate(refDate.getDate() + 1));
    }
    return refDate;
}

function GetNextWorkingDay(inputDate) {
    inputDate = GetNextWorkingDate(inputDate)
    if (IsHoliday(inputDate)) {
        inputDate = GetNextWorkingDay(new Date(inputDate.setDate(inputDate.getDate() + 1)).setHours(6, 0, 0));
    }
    return inputDate;
}

function GetLastWorkingDay(inputDate) {
    inputDate = GetPreviousWorkingDate(inputDate)
    if (IsHoliday(inputDate)) {
        inputDate = GetLastWorkingDay(new Date(inputDate.setDate(inputDate.getDate() - 1)).setHours(23, 59, 59));
    }
    return inputDate;
}

function IsHoliday(inputDate) {
    for (let i = 0; i < settings.marketHolidays.length; i++) {
        if (new Date(settings.marketHolidays[i]).toDateString() == inputDate.toDateString()) {
            return true;
        }
    }
    return false;
}

Number.prototype.toCustomString = function (decimalPlaces = 0) {
    return this.toLocaleString('en-In', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
}

String.prototype.toCustomString = function (decimalPlaces = 0) {
    return Number(this).toLocaleString('en-In', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
}

function UpdateUpperCase() {
    event.target.textContent = event.target.textContent.toUpperCase();
}

function CheckNumber() {
    const bseCode = event.target.textContent.trim();
    if (bseCode) {
        if (isNaN(bseCode) || !/^[1-9]\d*$/.test(bseCode)) {
            alert('Not a valid BSE code');
            event.target.textContent = '';
            event.target.focus();
            return false;
        }
    }
    event.target.textContent = bseCode;
}