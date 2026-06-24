const circuitChangeTable = document.getElementById("circuitChangeTable");
var circuitChangeStocks = [];

async function InitCircuitChange() {
    if (circuitChangeStocks.length === 0) {
        if (!newListingsData) {
            try {
                newListingsData = await GetData('newListings.json');
            } catch (e) {
                newListingsData = {};
            }
        }

        BuildCircuitChangeStocks();
    }

    RestoreCircuitChangeFilterSettings();
    UpdateCircuitChangeTable();
    scheduleAtIST(UpdateCircuitChangeColors, 16, 'circuitColor');
}

function BuildCircuitChangeStocks() {
    const t2tSMESeries = settings.configs.t2tSMESeries || [];
    const t2tMBSeries = settings.configs.t2tMBSeries || [];

    Object.keys(newListingsData).forEach(isin => {
        const entry = newListingsData[isin];
        if (!entry.listingDate) return;
        if (entry.nseCode?.includes('-RE')) return; // Skip Rights Entitlements

        // Skip stocks that are currently in NSE ESM; circuit will not change while ESM is active
        if (entry.inEsm) return;

        // Only include T2T series stocks
        const series = entry.series || '';
        if (!t2tSMESeries.includes(series) && !t2tMBSeries.includes(series)) return;

        const listingDate = new Date(entry.listingDate);
        let circuitChangeDate = GetNthDay(listingDate, 11);

        // Skip stocks whose circuit change date is more than 10 working days in the past
        const oldCutoff = GetNthDay(todayDate, 10, false);
        if (circuitChangeDate < oldCutoff) return;

        // Skip if no actual price band change confirmed by NSE
        if (entry.exchanges.includes('NSE')) {
            if (entry.bandChange) {
                if (circuitChangeDate.toDateString() != new Date(entry.bandChange.dateEffectiveFrom).toDateString()) {
                    console.warn(entry.ticker + ": " + entry.name + ": Circuit change date calculation mismatched");
                }
                circuitChangeDate = new Date(entry.bandChange.dateEffectiveFrom);
            }
            else if (circuitChangeDate < todayDate || circuitChangeDate.toDateString() == todayDate.toDateString()) {
                // mark date as null                    
                circuitChangeDate = null;
            }
        }

        const isSME = entry.type === 'SME';

        const tableEntry = {
            code: entry.ticker || entry.nseCode || entry.bseCode || '',
            name: entry.name || entry.nseCode || entry.bseCode || '',
            series: entry.series || '',
            type: isSME ? 'SME' : 'MainBoard',
            exchanges: entry.exchanges || '',
            listingDate: listingDate,
            circuitChangeDate: circuitChangeDate,
            issuePrice: entry.issuePrice
        }

        if (entry.bandChange) {
            tableEntry["bandFrom"] = entry.bandChange.bandFrom;
            tableEntry["bandTo"] = entry.bandChange.bandTo;
        }

        circuitChangeStocks.push(tableEntry);
    });

    circuitChangeStocks.sort((a, b) => {
        const ta = a.circuitChangeDate ? a.circuitChangeDate.getTime() : Infinity;
        const tb = b.circuitChangeDate ? b.circuitChangeDate.getTime() : Infinity;
        if (ta !== tb) return ta - tb;
        return a.name.localeCompare(b.name);
    });
}

function UpdateCircuitChangeTable() {
    UpdateLoader(true, "Updating Circuit Change stocks...");
    resetTable(circuitChangeTable);

    const showNSE = document.getElementById('chkCircuitNSE').checked;
    const showBSE = document.getElementById('chkCircuitBSE').checked;
    const showSME = document.getElementById('chkCircuitSME').checked;
    const showMB = document.getElementById('chkCircuitMB').checked;
    const showToday = document.getElementById('chkCircuitToday').checked;
    const showOld = document.getElementById('chkCircuitOld').checked;

    let filtered = circuitChangeStocks.filter(stock => {
        const onNSE = stock.exchanges.includes('NSE');
        const onBSE = stock.exchanges.includes('BSE');
        if (showNSE || showBSE) {
            if (!showNSE && onNSE && !onBSE) return false;
            if (!showBSE && onBSE && !onNSE) return false;
        }
        if (showSME || showMB) {
            if (!showSME && stock.type === 'SME') return false;
            if (!showMB && stock.type === 'MainBoard') return false;
        }
        if (showToday && stock.listingDate.toDateString() !== todayDate.toDateString()) return false;
        if (!showOld && stock.circuitChangeDate && stock.circuitChangeDate < todayDate) return false;
        return true;
    });

    for (let i = 0; i < filtered.length; i++) {
        const stock = filtered[i];
        const row = addEmptyRow(circuitChangeTable);

        row.cells[0].innerText = i + 1;
        if (stock.circuitChangeDate && stock.circuitChangeDate.toLocaleDateString) {
            row.cells[1].innerText = stock.circuitChangeDate.toLocaleDateString('en-In', {
                day: "2-digit", month: "short", year: "numeric"
            }) + ', ' + stock.circuitChangeDate.toLocaleDateString('en-In', { weekday: "short" });
            row.cells[1].setAttribute('data-sort', stock.circuitChangeDate.toISOString());
            if (stock.bandFrom && stock.bandTo) {
                row.cells[1].title = "From: " + stock.bandFrom + " => To: " + stock.bandTo;
            }
        } else {
            row.cells[1].innerText = '---- N/A ----';
            row.cells[1].setAttribute('data-sort', '');
            row.cells[1].title = "may be due to Surveillance Measures like ESM, ASM, etc...";
        }
        // row.cells[2].innerText = simplifyName(stock.name);
        {
            var a = document.createElement('a');
            const simplifiedName = simplifyName(stock.name);
            var linkText = document.createTextNode(simplifiedName);
            a.appendChild(linkText);
            a.title = simplifiedName;
            a.href = "#0";
            const codes = GetExchangeCodesFromTicker(stock.code);
            if (codes.join(',') == ',') {
                row.cells[2].innerText = simplifiedName;
            }
            else {
                a.setAttribute("codes", codes.join(','));
                a.setAttribute("onclick", "ShowHistory(this, circuitChangeTable);");
                row.cells[2].appendChild(a);
            }
        }
        row.cells[3].innerText = stock.code;
        row.cells[4].innerText = stock.listingDate.toLocaleDateString('en-In', {
            day: "2-digit", month: "short", year: "numeric"
        }) + ', ' + stock.listingDate.toLocaleDateString('en-In', { weekday: "short" });
        row.cells[4].setAttribute('data-sort', stock.listingDate.toISOString());
        row.cells[5].innerText = stock.series;
        row.cells[6].innerText = stock.type;
        row.cells[7].innerText = stock.exchanges;
        row.cells[8].innerText = stock.issuePrice || "";

        if (stock.circuitChangeDate && stock.circuitChangeDate.toDateString && stock.circuitChangeDate.toDateString() === todayDate.toDateString()) {
            row.style.background = isMarketClosed() ? '#e8f5e9' : 'lightgreen';
            row.title = 'Circuit changed from today';
        } else if (stock.circuitChangeDate && stock.circuitChangeDate.toDateString && stock.circuitChangeDate.toDateString() === GetNextWorkingDay(todayDate).toDateString()) {
            row.style.background = 'lightyellow';
            row.title = 'Circuit will change from next trading day';
        } else if (stock.listingDate.toDateString() === todayDate.toDateString()) {
            row.style.background = 'lightcyan';
            row.title = 'Listed today';
        }
        else if (stock.circuitChangeDate && stock.circuitChangeDate < todayDate) {
            row.style.background = '#f0f0f0';
        }
    }

    UpdateLoader(false);
    AutoSaveCircuitChangePreferences();
}

function UpdateCircuitChangeColors() {
    const rows = circuitChangeTable.querySelectorAll('tbody tr:not(.hide)');
    rows.forEach(row => {
        const bg = row.style.backgroundColor;
        if (bg === 'lightgreen') {
            row.style.background = '#e8f5e9';
        } else if (bg === 'lightyellow') {
            row.style.background = 'lightgoldenrodyellow';
        }
    });
}

function ShareCircuitChanges() {
    const rows = circuitChangeTable.querySelectorAll('tbody tr:not(.hide)');
    if (rows.length === 0) return;

    const showSME = document.getElementById('chkCircuitSME').checked;
    const showMB = document.getElementById('chkCircuitMB').checked;
    const showToday = document.getElementById('chkCircuitToday').checked;

    let text;
    let title = '*';
    if (showToday) {
        if (rows.length > 1)
            title += 'Today\'s listings,*\n\n';
        else
            title += 'Today\'s listing,*\n\n';

        text = title;
        rows.forEach((row, i) => {
            const ticker = row.cells[3].innerText;
            const price = row.cells[8].innerText;
            const type = row.cells[6].innerText == 'SME' ? 'SME' : 'MB';
            text += (i + 1) + ". " + ticker + ' (' + type + ') ' + price + '\n';
        });

    } else {
        if (showSME && !showMB) title += 'SME ';
        else if (showMB && !showSME) title += 'MainBoard ';
        title += 'Circuit Changes*\n\n';

        text = title;
        rows.forEach((row, i) => {
            const stock = circuitChangeStocks.find(s => s.code === row.cells[3].innerText);
            let dateStr;
            if (stock && stock.circuitChangeDate && stock.circuitChangeDate.toLocaleDateString) {
                dateStr = stock.circuitChangeDate.toLocaleDateString('en-In', {
                    day: '2-digit', month: 'short', year: 'numeric'
                }).replace(/ /g, '-');
            } else {
                return;
            }
            const ticker = row.cells[3].innerText;
            const isTodayCircuit = stock.circuitChangeDate && stock.circuitChangeDate.toDateString && stock.circuitChangeDate.toDateString() === todayDate.toDateString();
            const isTodayListing = stock.listingDate && stock.listingDate.toDateString && stock.listingDate.toDateString() === todayDate.toDateString();
            if (isTodayCircuit || isTodayListing) {
                text += "*" + dateStr + ' ' + ticker + '*\n';
            } else {
                text += dateStr + ' ' + ticker + '\n';
            }
        });
    }

    if (navigator.share) {
        navigator.share({ text: text });
    } else {
        const url = 'https://wa.me/?text=' + encodeURIComponent(text);
        window.open(url, '_blank');
    }
}

function simplifyName(name) {
    return name
        .replace(/\s*\(India\)/i, '')
        .replace(/\s*(Private|Pvt\.?|India)?\s*(Limited|Ltd\.?|Limit).*$/i, '')
        .replace(/\s+(Solutions|Technologies|Technology|Industries|Services)$/i, '')
        .trim();
}

function OnCircuitFilterChanged() {
    UpdateCircuitChangeTable();
}

function OnCircuitTodayChanged() {
    if (document.getElementById('chkCircuitToday').checked) {
        document.getElementById('chkCircuitOld').checked = false;
    }
    UpdateCircuitChangeTable();
}

function OnCircuitOldChanged() {
    if (document.getElementById('chkCircuitOld').checked) {
        document.getElementById('chkCircuitToday').checked = false;
    }
    UpdateCircuitChangeTable();
}

function RestoreCircuitChangeFilterSettings() {
    const prefs = settings.circuitChangePreferences;
    if (prefs) {
        document.getElementById('chkCircuitNSE').checked = prefs.nse !== false;
        document.getElementById('chkCircuitBSE').checked = prefs.bse !== false;
        document.getElementById('chkCircuitSME').checked = prefs.sme !== false;
        document.getElementById('chkCircuitMB').checked = prefs.mainBoard !== false;
        document.getElementById('chkCircuitToday').checked = prefs.todayOnly === true;
        document.getElementById('chkCircuitOld').checked = prefs.showOld === true;
    }
}

function AutoSaveCircuitChangePreferences() {
    if (!settings.circuitChangePreferences) {
        settings.circuitChangePreferences = {};
    }

    settings.circuitChangePreferences.nse = document.getElementById('chkCircuitNSE').checked;
    settings.circuitChangePreferences.bse = document.getElementById('chkCircuitBSE').checked;
    settings.circuitChangePreferences.sme = document.getElementById('chkCircuitSME').checked;
    settings.circuitChangePreferences.mainBoard = document.getElementById('chkCircuitMB').checked;
    settings.circuitChangePreferences.todayOnly = document.getElementById('chkCircuitToday').checked;
    settings.circuitChangePreferences.showOld = document.getElementById('chkCircuitOld').checked;

    window.localStorage.setItem("userSettings", JSON.stringify(settings));
}
