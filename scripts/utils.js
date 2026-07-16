const Exchanges = Object.freeze({
    NSE: 'NSE',
    BSE: 'BSE'
});

const Tabs = Object.freeze({
    datavalidity: 'dataValidityDiv',
    stocklist: 'stockListDiv',
    stockdata: 'stockDataDiv',
    bulkdealers: 'bulkDealersDiv',
    bulkdeals: 'stockBulkDealsDiv',
    portfolio: 'portfolioDiv',
    circuitchanges: 'circuitChangeDiv',
    settings: 'settingsDiv',
});

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
                    if (x.getAttribute('data-sort'))
                        item1 = new Date(x.getAttribute('data-sort'));
                    else if (firstText == undefined)
                        item1 = 0;
                    else
                        item1 = new Date(firstText);

                    if (y.getAttribute('data-sort'))
                        item2 = new Date(y.getAttribute('data-sort'));
                    else if (secondText == undefined)
                        item2 = 0;
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
    var stockData;
    if ((stockData1 ? stockData1.Close : 0) > (stockData2 ? stockData2.Close : 0)) {
        stockData = { ...stockData2, ...stockData1 };
    } else {
        stockData = { ...stockData1, ...stockData2 };
    }

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

function toObject(table, col = 3) {
    const result = []
    for (let i = 0; i < table.tBodies[0].rows.length; i++) {
        const row = table.tBodies[0].rows[i];
        if (!row.classList.contains('hide')) {
            const res = [];
            for (let j = 0; j < row.cells.length; j++) {
                const cell = row.cells[j];
                j > col && res.push(cell.textContent);
            }
            res.length > 0 && res[0].trim() != "" && result.push(res);
        }
    }
    return result;
}

function tableToExcel(tableId, sheetName = 'Worksheet') {
    const table = document.getElementById(tableId);
    if (!table) return;

    const uri = 'data:application/vnd.ms-excel;base64,';
    const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8"/>
        </head>
        <body>
            <table>{table}</table>
        </body>
        </html>`;
    const base64 = s => window.btoa(unescape(encodeURIComponent(s)));
    const format = (s, c) => s.replace(/{(\w+)}/g, (m, p) => c[p]);

    const ctx = { worksheet: sheetName, table: table.innerHTML };
    const href = uri + base64(format(template, ctx));
    window.location.href = href;
}

function GetPreviousWorkingDate(inputDate) {
    let refDate = new Date(inputDate);

    // If current date is a special trading day, no need to adjust
    if (IsSpecialTradingDay(refDate)) {
        return refDate;
    }

    if (refDate.getDay() == 0) {
        // Sunday - check if previous Saturday was special trading day
        let prevSat = new Date(refDate.setDate(refDate.getDate() - 1));
        if (IsSpecialTradingDay(prevSat)) {
            refDate = prevSat;
        } else {
            refDate = new Date(refDate.setDate(refDate.getDate() - 1)); // Go to Friday
        }
    }
    else if (refDate.getDay() == 6) {
        refDate = new Date(refDate.setDate(refDate.getDate() - 1));
    }
    else if (refDate.getDay() == 1 && refDate.getHours() < 6) {
        // Check if Sunday was special trading day
        let prevSun = new Date(refDate.setDate(refDate.getDate() - 1));
        if (IsSpecialTradingDay(prevSun)) {
            refDate = prevSun;
        } else {
            refDate = new Date(refDate.setDate(refDate.getDate() - 2)); // Go to Friday
        }
    }
    else if (refDate.getHours() < 6) {
        refDate = new Date(refDate.setDate(refDate.getDate() - 1));
    }
    return refDate;
}

function GetNextWorkingDate(inputDate) {
    let refDate = new Date(inputDate);

    // If current date is a special trading day, no need to adjust
    if (IsSpecialTradingDay(refDate)) {
        return refDate;
    }

    if (refDate.getDay() == 0) {
        refDate = new Date(refDate.setDate(refDate.getDate() + 1));
    }
    else if (refDate.getDay() == 6) {
        // Saturday - check if Sunday is special trading day
        let nextSun = new Date(refDate.setDate(refDate.getDate() + 1));
        if (IsSpecialTradingDay(nextSun)) {
            refDate = nextSun;
        } else {
            refDate = new Date(refDate.setDate(refDate.getDate() + 1)); // Go to Monday
        }
    }
    else if (refDate.getDay() == 5) {
        // Friday - check if weekend has special trading days
        let nextSat = new Date(refDate.setDate(refDate.getDate() + 1));
        let nextSun = new Date(refDate.setDate(refDate.getDate() + 1));
        if (IsSpecialTradingDay(nextSat)) {
            refDate = nextSat;
        } else if (IsSpecialTradingDay(nextSun)) {
            refDate = nextSun;
        } else {
            refDate = new Date(refDate.setDate(refDate.getDate() + 1)); // Go to Monday
        }
    }
    else {
        refDate = new Date(refDate.setDate(refDate.getDate() + 1));
    }
    return refDate;
}

function GetNextWorkingDay(inputDate) {
    inputDate = GetNextWorkingDate(inputDate)
    if (!IsTradingDay(inputDate)) {
        inputDate = GetNextWorkingDay(new Date(inputDate.setDate(inputDate.getDate() + 1)).setHours(6, 0, 0));
    }
    return inputDate;
}

function GetLastWorkingDay(inputDate) {
    inputDate = GetPreviousWorkingDate(inputDate)
    if (!IsTradingDay(inputDate)) {
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

function IsSpecialTradingDay(inputDate) {
    if (!settings.specialTradingDays) return false;
    for (let i = 0; i < settings.specialTradingDays.length; i++) {
        if (new Date(settings.specialTradingDays[i].date).toDateString() == inputDate.toDateString()) {
            return settings.specialTradingDays[i];
        }
    }
    return false;
}

function IsTradingDay(inputDate) {
    // Check if it's a holiday first
    if (IsHoliday(inputDate)) {
        return false;
    }

    // Check if it's a special trading day (overrides weekend check)
    if (IsSpecialTradingDay(inputDate)) {
        return true;
    }

    // Regular weekend check (Saturday = 6, Sunday = 0)
    const dayOfWeek = inputDate.getDay();
    return !(dayOfWeek === 0 || dayOfWeek === 6);
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

/// Timer functions

// IST time utilities
function getISTNow() {
    const now = new Date();
    return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5.5 * 3600000));
}

function getISTHours() {
    return getISTNow().getHours();
}

function isMarketClosed() {
    return getISTHours() >= 16;
}

// Schedule a callback at a specific IST hour (e.g., 16 for 4 PM)
// If the hour has already passed, fires the callback immediately
let _scheduledTimers = {};
function scheduleAtIST(callback, hour, key) {
    key = key || callback.name || 'default';
    if (_scheduledTimers[key]) clearTimeout(_scheduledTimers[key]);
    const istNow = getISTNow();
    if (istNow.getHours() < hour) {
        const target = new Date(istNow);
        target.setHours(hour, 0, 0, 0);
        const delay = target - istNow;
        _scheduledTimers[key] = setTimeout(callback, delay);
        return true;
    } else {
        callback();
        return false;
    }
}

function callNowAndScheduleAtIST(callback, hour, key) {
    callback();
    scheduleAtIST(callback, hour, key);
}

let _scheduledIntervals = {};
function callAtInterval(callback, intervalMs, key) {
    key = key || callback.name || 'default';
    if (_scheduledIntervals[key]) clearInterval(_scheduledIntervals[key]);
    _scheduledIntervals[key] = setInterval(callback, intervalMs);
}


// Define a flag outside the function scope (e.g., in your module or global scope)
let isSharing = false;

/**
 * Captures a DOM element and opens the native system share dialog.
 * @param {string} elementId - The ID of the DOM element to share.
 */
async function ShareTableAsImage(tableId, heading = "Shared from mm.girishjoshi.com", text = "Shared from mm.girishjoshi.com", shouldGroup = false, rowsPerImage = 50) {
    if (isSharing) {
        console.warn("Share already in progress, please wait.");
        return null;
    }

    try {
        isSharing = true;
        if (!navigator.share) {
            ShowMessage("Unable to share, check browser's settings");
            return false;
        }

        const originalTable = document.getElementById(tableId);
        if (!originalTable || originalTable.tagName.toLowerCase() !== 'table') {
            console.error("Valid table element not found.");
            return null;
        }

        // 1. Group by Stock Name and prepare rows
        const rows = Array.from(originalTable.querySelectorAll('tbody tr:not(.hide)'));

        let rowGroups = []; // We will store arrays of rows here

        if (shouldGroup) {
            const grouped = rows.reduce((acc, row) => {
                const cells = Array.from(row.querySelectorAll('td'));
                const stock = cells[2]?.innerText.trim() || 'Unknown';
                if (!acc[stock]) acc[stock] = [];

                const detailRow = document.createElement('tr');
                detailRow.innerHTML = `${cells.slice(3).map(c => c.outerHTML).join('')}`;
                acc[stock].push(detailRow);
                return acc;
            }, {});

            let currentPage = [];
            let currentCount = 0;

            Object.keys(grouped).forEach(stock => {
                // 1. Prepare Header
                const header = document.createElement('tr');
                header.innerHTML = `<td colspan="100%" style="background:#bbb; font-weight:bold; padding:8px; border-bottom:1px solid #777;">${stock}</td>`;

                // 2. Prepare Data Rows
                const detailRows = grouped[stock].map((detailRow, idx) => {
                    detailRow.innerHTML = `<td>${idx + 1}</td>${detailRow.innerHTML}`;
                    detailRow.querySelectorAll('a').forEach(link => {
                        link.removeAttribute('href');
                        link.removeAttribute('onclick');
                    });
                    return detailRow;
                });

                const fullGroup = [header, ...detailRows];

                // 3. Check if we need a new page
                // If current group + header > limit, and we already have content, start new page
                if (currentCount + fullGroup.length > rowsPerImage && currentPage.length > 0) {
                    rowGroups.push(currentPage);
                    currentPage = [];
                    currentCount = 0;
                }

                currentPage.push(...fullGroup);
                currentCount += fullGroup.length;
            });

            if (currentPage.length > 0) rowGroups.push(currentPage);
        } else {
            const tableClone = originalTable.cloneNode(true);
            tableClone.querySelectorAll('tr.hide').forEach(row => row.remove());
            tableClone.querySelectorAll('table a').forEach(link => {
                link.removeAttribute('href');
                link.removeAttribute('onclick');
                link.classList.remove('sort-by');
            });

            // 1. Analyze the table structure
            let processedRows = Array.from(tableClone.querySelectorAll('tr'));

            // Standard slicing for non-grouped
            for (let i = 0; i < processedRows.length; i += rowsPerImage) {
                rowGroups.push(processedRows.slice(i, i + rowsPerImage));
            }
        }

        const filesToShare = [];
        const headingParts = heading.split(',');
        const leftText = headingParts[0]?.trim() || "";
        const rightDate = headingParts[1]?.trim() || "";

        // 3. Generate images
        for (let index = 0; index < rowGroups.length; index++) {
            // A. Container: Add margin and ensure padding is uniform
            const container = document.createElement('div');
            // Increased padding and added margin to provide space from the edge of the image
            container.style.cssText = "position:absolute; left:-9999px; background:#fff; width: max-content; padding: 20px; margin: 20px;";
            container.style.border = "1px solid grey"

            // Custom Header
            const titleHeader = document.createElement('div');
            titleHeader.style.cssText = "display:flex; justify-content:space-between; font-size:24px; font-weight:bold; padding-top:20px; border-bottom:2px solid #000;";
            titleHeader.innerHTML = `<div style="font-size:24px">${rowGroups.length === 1 ? leftText : leftText + " (Part " + (index + 1) + ")"}</div><div style="color:#555; font-size:24px">${rightDate}</div>`;
            container.appendChild(titleHeader);

            const table = document.createElement('table');
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.minWidth = "unset";
            table.style.marginBottom = "unset";
            table.style.fontWeight = 500;

            rowGroups[index].forEach(r => table.appendChild(r));
            container.appendChild(table);
            document.body.appendChild(container);

            try {
                const blob = await CreateImageBlob(container);
                const cleanName = heading.replace(/[\n,*]/g, '');
                filesToShare.push(new File([blob], rowGroups.length === 1 ? `${cleanName}.png` : `${cleanName}_${index + 1}.png`, { type: 'image/png' }));
            } finally {
                document.body.removeChild(container);
            }
        }

        // 4. Share
        if (navigator.canShare && navigator.canShare({ files: filesToShare })) {
            await navigator.clipboard.writeText(text);
            await navigator.share({ files: filesToShare, title: heading, text: text });
            return true;
        }
    } catch (error) {
        console.error("Sharing failed:", error);
    } finally {
        isSharing = false;
    }
    return false;
}

async function CreateImageBlob(container) {
    const html2canvas = await EnsureHtml2Canvas();
    const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        // Remove the 'width: 800' from here too
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight
    });
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png', 0.95));
    return blob;
}

async function ShareText(text) {
    try {
        try {
            if (navigator.canShare && navigator.canShare({ text: text })) {
                await navigator.share({ text: text });
                return;
            } else {
                console.warn("Sharing text not supported. Copying to clipboard instead.");
                await navigator.clipboard.writeText(text);
                ShowMessage("Text copied to clipboard!");
            }
        }
        catch (err) {
            console.error(err);
        }

        const url = 'https://wa.me/?text=' + encodeURIComponent(text);
        window.open(url, '_blank');
    }
    catch (error) {
        console.warn("Sharing text not supported. Copying to clipboard instead.");
        await navigator.clipboard.writeText(text);
        ShowMessage("Text copied to clipboard!");
        console.error(error);
    }
}

/**
 * @param {string} tableId - The ID of the table.
 * @param {boolean} isGrouped - Whether to return grouped data (by date/stock) or flat list.
 */
function GetFormattedTableText(tableId, isGrouped = true, addDate = true) {
    const table = document.getElementById(tableId);
    const rows = Array.from(table.querySelectorAll('tbody tr:not(.hide)'));

    const data = rows.map(row => {
        const cells = row.querySelectorAll('td');
        const type = cells[4]?.innerText.trim() || "";
        const date = cells[1]?.innerText.trim() || 'Unknown Date';
        const stock = cells[2]?.innerText.trim() || 'Unknown Stock';

        let indicator = "\u26AA";
        if (type.toLowerCase().includes("buy")) indicator = "\uD83D\uDFE2";
        if (type.toLowerCase().includes("sell")) indicator = "\uD83D\uDD34";

        const details = Array.from(cells).slice(3).map(c => c.innerText.trim()).join(' | ');
        return { date, stock, details: `${indicator} ${details}` };
    });

    // Option 1: Return as Flat List
    if (!isGrouped) {
        return data.map((item, index) => `${index + 1}. ${item.date} | *${item.stock}* | ${item.details}`).join('\n');
    }

    // Option 2: Return as Grouped Report
    const grouped = data.reduce((acc, item) => {
        if (!acc[item.date]) acc[item.date] = {};
        if (!acc[item.date][item.stock]) acc[item.date][item.stock] = [];
        acc[item.date][item.stock].push(item.details);
        return acc;
    }, {});

    let report = "";
    const dates = Object.keys(grouped);
    dates.forEach((date, dateIndex) => {
        addDate && (report += `Date: ${date},\n\n`);
        const stocks = Object.keys(grouped[date]);
        stocks.forEach((stock, stockIndex) => {
            const stockLabel = String.fromCharCode(65 + stockIndex);
            report += `${stockLabel}. *${stock}*\n`;
            grouped[date][stock].forEach((detail, dealIndex) => {
                report += `  ${dealIndex + 1}. ${detail}\n`;
            });
            if (stockIndex < stocks.length - 1) report += "\n";
        });
        if (dateIndex < dates.length - 1) report += "\n\n";
    });
    return report.trim();
}

async function EnsureHtml2Canvas() {
    if (window.html2canvas && typeof window.html2canvas === 'function') {
        return window.html2canvas;
    }

    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Unable to load html2canvas'));
        document.head.appendChild(script);
    });

    return window.html2canvas && typeof window.html2canvas === 'function' ? window.html2canvas : null;
}

function FormatDate(date = new Date()) {
    return formattedDate.format(new Date(date)).replace(/ /g, '-'); // Removes spaces to match ddMMMyyyy    
}

const formattedDate = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
})

function GetTickerFromExchangeCodes(nseCode, bseCode) {
    const normalizeCode = (code) => code ? String(code).toUpperCase() : undefined;

    const resolvedNseCode = normalizeCode(nseCode);
    if (resolvedNseCode && nseData && typeof nseData === 'object') {
        const stock = nseData[resolvedNseCode];
        if (stock && typeof stock === 'object') {
            const ticker = stock.Ticker || stock.SecurityCode;
            if (ticker) {
                return String(ticker).toUpperCase();
            }

            const historyEntries = stock.History || stock.history;
            if (Array.isArray(historyEntries)) {
                const historyTicker = historyEntries.find(entry => entry && (entry.Ticker || entry.SecurityCode));
                if (historyTicker) {
                    return String(historyTicker.Ticker || historyTicker.SecurityCode).toUpperCase();
                }
            }
        }
    }

    const resolvedBseCode = normalizeCode(bseCode);
    if (resolvedBseCode && bseData && typeof bseData === 'object') {
        const stock = bseData[resolvedBseCode];
        if (stock && typeof stock === 'object') {
            const ticker = stock.Ticker || stock.SecurityCode;
            if (ticker) {
                return String(ticker).toUpperCase();
            }

            const historyEntries = stock.History || stock.history;
            if (Array.isArray(historyEntries)) {
                const historyTicker = historyEntries.find(entry => entry && (entry.Ticker || entry.SecurityCode));
                if (historyTicker) {
                    return String(historyTicker.Ticker || historyTicker.SecurityCode).toUpperCase();
                }
            }
        }
    }

    return undefined;
}

function GetTickerFromSecurityCodes(codes) {
    if (Array.isArray(codes)) {
        return GetTickerFromExchangeCodes(codes[0], codes[1]);
    }

    if (codes && typeof codes === 'object') {
        return GetTickerFromExchangeCodes(codes.nseCode, codes.bseCode);
    }

    return GetTickerFromExchangeCodes(codes, codes);
}