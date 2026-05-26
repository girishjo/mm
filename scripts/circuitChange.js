const circuitChangeTable = document.getElementById("circuitChangeTable");
var circuitChangeStocks = [];

function InitCircuitChange() {
    if (circuitChangeStocks.length === 0) {
        FindCircuitChangeStocks(nseData, 'NSE');
        FindCircuitChangeStocks(bseData, 'BSE');

        // Sort by circuit change date ascending
        circuitChangeStocks.sort((a, b) => new Date(a.circuitChangeDate) - new Date(b.circuitChangeDate));
    }

    // Restore filter settings
    RestoreCircuitChangeFilterSettings();
    UpdateCircuitChangeTable();
}

function FindCircuitChangeStocks(data, exchange) {
    for (const stockCode of Object.keys(data)) {
        if (stockCode === 'dateTimeStamp') continue;

        const stockData = data[stockCode];
        const series = stockData.Series || (stockData.History && stockData.History.length > 0 && stockData.History[0].Series);

        if (!series) continue;

        const isT2T = settings.configs.t2tSMESeries.includes(series) || settings.configs.t2tMBSeries.includes(series);
        if (!isT2T) continue;

        // Stocks with full history (maxed out by historyDays setting) are old stocks, not new listings
        const historyLength = stockData.History ? stockData.History.length : 0;
        if (historyLength >= settings.constants.historyDays - 1) continue;

        // Determine listing date:
        // If stock has history, the oldest entry is the listing date
        // If no history (listed today), use today's date
        let listingDate;
        if (stockData.History && stockData.History.length > 0) {
            const listingDateString = stockData.History[stockData.History.length - 1].HistoryDate;
            listingDate = new Date(listingDateString);
        } else {
            listingDate = new Date(todayDate);
        }

        // Calculate 11th working day from listing (including listing day)
        const circuitChangeDate = GetNthDay(listingDate, 11);

        // Skip stocks whose circuit change date is more than 10 working days in the past
        const oldCutoff = GetNthDay(todayDate, 10, false);
        if (circuitChangeDate < oldCutoff) continue;

        const isSME = settings.configs.t2tSMESeries.includes(series);
        const stockName = getSecurityName(stockData) || stockCode;

        // Avoid duplicates (same stock from both exchanges)
        const existing = circuitChangeStocks.find(s => s.code === stockCode);
        if (existing) continue;

        circuitChangeStocks.push({
            code: stockCode,
            name: stockName,
            series: series,
            type: isSME ? 'SME' : 'MainBoard',
            listingDate: listingDate,
            circuitChangeDate: circuitChangeDate
        });
    }
}

function UpdateCircuitChangeTable() {
    UpdateLoader(true, "Updating Circuit Change stocks...");
    resetTable(circuitChangeTable);

    const showSME = document.getElementById('chkCircuitSME').checked;

    const showOld = document.getElementById('chkCircuitOld').checked;

    let filtered = circuitChangeStocks.filter(stock => {
        // MainBoard support disabled for now
        if (stock.type === 'MainBoard') return false;
        if (showSME && stock.type === 'SME') {
            // If not showing old, only include today or future
            if (!showOld && stock.circuitChangeDate < todayDate) return false;
            return true;
        }
        return false;
    });

    for (let i = 0; i < filtered.length; i++) {
        const stock = filtered[i];
        const row = addEmptyRow(circuitChangeTable);

        row.cells[0].innerText = i + 1;
        row.cells[1].innerText = stock.circuitChangeDate.toLocaleDateString('en-In', {
            weekday: "short", year: "numeric", month: "short", day: "2-digit"
        });
        row.cells[2].innerText = stock.name;
        row.cells[3].innerText = stock.code;
        row.cells[4].innerText = stock.series;
        row.cells[5].innerText = stock.type;

        // Highlight based on proximity to today
        if (stock.circuitChangeDate.toDateString() === todayDate.toDateString()) {
            row.style.background = 'lightgreen';
        } else if (stock.circuitChangeDate < todayDate) {
            row.style.background = '#f0f0f0';
        }
    }

    UpdateLoader(false);
    AutoSaveCircuitChangePreferences();
}

function OnCircuitOldChanged() {
    UpdateCircuitChangeTable();
}

function RestoreCircuitChangeFilterSettings() {
    const prefs = settings.circuitChangePreferences;
    if (prefs) {
        document.getElementById('chkCircuitMB').checked = prefs.mainBoard !== false;
        document.getElementById('chkCircuitSME').checked = prefs.sme !== false;
        document.getElementById('chkCircuitOld').checked = prefs.showOld === true;
    }
}

function AutoSaveCircuitChangePreferences() {
    if (!settings.circuitChangePreferences) {
        settings.circuitChangePreferences = {};
    }

    settings.circuitChangePreferences.mainBoard = document.getElementById('chkCircuitMB').checked;
    settings.circuitChangePreferences.sme = document.getElementById('chkCircuitSME').checked;
    settings.circuitChangePreferences.showOld = document.getElementById('chkCircuitOld').checked;

    window.localStorage.setItem("userSettings", JSON.stringify(settings));
}
