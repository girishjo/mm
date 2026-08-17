const circuitChangeTable = document.getElementById("circuitChangeTable");
var circuitChangeStocks = [];
var selectedCircuitDate = null;

async function InitCircuitChange() {
    if (!selectedCircuitDate) {
        selectedCircuitDate = new Date(todayDate.getTime());
    }

    const dateInput = document.getElementById('circuitChangeDateFilter');
    if (dateInput && !dateInput.value) {
        UpdateCircuitDateInput();
    }

    if (circuitChangeStocks.length === 0) {
        if (!newListingsData) {
            try {
                newListingsData = await GetData('newListings.json', true);
            } catch (e) {
                newListingsData = {};
            }
        }
        RestoreCircuitChangeFilterSettings();
    }

    BuildCircuitChangeStocks();
    UpdateCircuitChangeTable();
    scheduleAtIST(UpdateCircuitChangeColors, todayDate, 16, 'circuitColor');
}

function UpdateCircuitDateInput() {
    const dateInput = document.getElementById('circuitChangeDateFilter');
    if (!dateInput) return;

    const yyyy = selectedCircuitDate.getFullYear();
    const mm = String(selectedCircuitDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedCircuitDate.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;

    // Allow 30 days in past and 30 days in future
    const minDate = new Date(todayDate);
    minDate.setDate(minDate.getDate() - 30);
    const maxDate = new Date(todayDate);
    maxDate.setDate(maxDate.getDate() + 30);

    dateInput.min = minDate.toISOString().split('T')[0];
    dateInput.max = maxDate.toISOString().split('T')[0];
}

function BuildCircuitChangeStocks() {
    circuitChangeStocks = [];
    const t2tSMESeries = settings.configs.t2tSMESeries || ['SM', 'MT', 'ST', 'M'];
    const t2tMBSeries = settings.configs.t2tMBSeries || ['BE', 'BT'];
    const refDate = selectedCircuitDate || todayDate;

    Object.keys(newListingsData).forEach(isin => {
        const entry = newListingsData[isin];
        if (!entry.listingDate) return;

        const ticker = (entry.ticker || '').toUpperCase().trim();
        const nseCode = (entry.nseCode || '').toUpperCase().trim();
        const series = (entry.series || '').toUpperCase().trim();

        // 1. Skip Rights Entitlements (e.g. -RE, -RE1, -RE2)
        if (/-RE\d*$/i.test(ticker) || /-RE\d*$/i.test(nseCode)) return;

        // 2. Skip active ESM stocks
        if (entry.inEsm) return;

        // 3. Skip BSE Group XT (Demergers, Restructurings & Corporate Actions)
        if (series === 'XT' || series === 'T') return;

        const listingDate = new Date(entry.listingDate);

        // Avoid showing unlisted/future listing stocks relative to the selected reference date
        if (listingDate > refDate && listingDate.toDateString() !== refDate.toDateString()) return;

        const isSME = entry.type === 'SME';
        const isRefListed = listingDate.toDateString() === refDate.toDateString();
        const isT2TSeries = t2tSMESeries.includes(series) || t2tMBSeries.includes(series);
        const hasNSE = entry.exchanges?.includes('NSE');

        let circuitChangeDate = null;

        // 1. If explicit exchange bandChange exists, use confirmed date
        if (entry.bandChange?.dateEffectiveFrom) {
            circuitChangeDate = new Date(entry.bandChange.dateEffectiveFrom);
        } else {
            // 2. Projected 11th working day calculation rules:
            if (isSME || (hasNSE && isT2TSeries) || isT2TSeries) {
                circuitChangeDate = GetNthDay(listingDate, 11);
            } else {
                circuitChangeDate = null;
            }
        }

        const fallbackIssuePrice = entry.issuePrice || (circuitChangeDate && (
            entry.exchanges?.includes('NSE') && entry.nseCode ? nseData[entry.nseCode]?.History?.[nseData[entry.nseCode]?.History?.length - 1]?.PrevClose : undefined
        ) || (
                entry.exchanges?.includes('BSE') && entry.bseCode ? bseData[entry.bseCode]?.History?.[bseData[entry.bseCode]?.History?.length - 1]?.PrevClose : undefined
            ));

        const tableEntry = {
            code: (entry.ticker || entry.nseCode || entry.bseCode || '').trim(),
            name: entry.name || entry.nseCode || entry.bseCode || '',
            series: series,
            type: isSME ? 'SME' : 'MainBoard',
            exchanges: entry.exchanges || '',
            listingDate: listingDate,
            circuitChangeDate: circuitChangeDate,
            issuePrice: fallbackIssuePrice,
            lotSize: entry.lotSize || entry.marketLot || null,
            freeShares: entry.freeShares || null,
            circular: entry.circular || null,
            circularNo: entry.circularNo || null,
            refListedMBNotInT2T: isRefListed && !isSME && !isT2TSeries,
            isInT2TSeries: isT2TSeries
        };

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

    const refDate = selectedCircuitDate || todayDate;
    const showNSE = document.getElementById('chkCircuitNSE').checked;
    const showBSE = document.getElementById('chkCircuitBSE').checked;
    const showSME = document.getElementById('chkCircuitSME').checked;
    const showMB = document.getElementById('chkCircuitMB').checked;
    const showRefDay = document.getElementById('chkCircuitToday').checked;
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

        if (showRefDay) {
            // Match listing date directly with selected date
            if (stock.listingDate.toDateString() !== refDate.toDateString()) return false;
        } else {
            // Default circuit changes view
            if (!stock.circuitChangeDate) return false;
            if (!showOld && stock.circuitChangeDate < refDate) return false;
        }

        return true;
    });

    filtered.sort((a, b) => {
        const aIsRefDay = a.listingDate.toDateString() === refDate.toDateString();
        const bIsRefDay = b.listingDate.toDateString() === refDate.toDateString();

        if (aIsRefDay && bIsRefDay) {
            return b.type.localeCompare(a.type) || a.code.localeCompare(b.code);
        }

        const ta = a.circuitChangeDate ? a.circuitChangeDate.getTime() : Infinity;
        const tb = b.circuitChangeDate ? b.circuitChangeDate.getTime() : Infinity;
        if (ta !== tb) return ta - tb;
        return b.type.localeCompare(a.type) || a.code.localeCompare(b.code);
    });

    for (let i = 0; i < filtered.length; i++) {
        const stock = filtered[i];
        const row = addEmptyRow(circuitChangeTable);

        // 0. Sr No
        row.cells[0].innerText = i + 1;

        // 1. Circuit Change Date
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

        // 2. Company Name
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
            } else {
                a.setAttribute("codes", codes.join(','));
                a.setAttribute("onclick", "ShowHistory(this, circuitChangeTable);");
                row.cells[2].appendChild(a);
            }
        }
        row.cells[2].dataset.isInT2TSeries = stock.isInT2TSeries;

        // 3. Code
        row.cells[3].innerText = stock.code;

        // 4. Listing Date
        row.cells[4].innerText = stock.listingDate.toLocaleDateString('en-In', {
            day: "2-digit", month: "short", year: "numeric"
        }) + ', ' + stock.listingDate.toLocaleDateString('en-In', { weekday: "short" });
        row.cells[4].setAttribute('data-sort', stock.listingDate.toISOString());

        // 5. Series
        row.cells[5].innerText = stock.series;

        // 6. Type
        row.cells[6].innerText = stock.type;

        // 7. Exchanges
        row.cells[7].innerText = stock.exchanges;

        // 8. Issue Price
        row.cells[8].innerText = stock.issuePrice || "";

        // 9. Free Float Shares  
        if (stock.freeShares) {
            row.cells[9].innerText = stock.freeShares.toLocaleString('en-IN');
        } else {
            row.cells[9].innerText = "-";
            row.cells[9].setAttribute('data-sort', '');
        }

        // 10. Lot Size
        if (stock.type === 'SME' && stock.lotSize) {
            row.cells[10].innerText = stock.lotSize.toLocaleString('en-IN');
        } else {
            row.cells[10].innerText = "-";
            row.cells[10].setAttribute('data-sort', '');
        }

        // Row Highlighting
        if (stock.circuitChangeDate?.toDateString && stock.circuitChangeDate.toDateString() === refDate.toDateString()) {
            row.style.background = isMarketClosed() ? '#e8f5e9' : 'lightgreen';
            row.title = 'Circuit changed from selected date';
        } else if (stock.circuitChangeDate?.toDateString && stock.circuitChangeDate.toDateString() === GetNextWorkingDay(refDate).toDateString()) {
            row.style.background = 'lightyellow';
            row.title = 'Circuit will change from next trading day';
        } else if (stock.listingDate.toDateString() === refDate.toDateString()) {
            row.style.background = 'lightcyan';
            row.title = 'Listed on selected date';
        } else if (stock.circuitChangeDate && stock.circuitChangeDate < refDate) {
            row.style.background = '#f0f0f0';
        }
    }

    UpdateLoader(false);
    AutoSaveCircuitChangePreferences();
}

function PreviousCircuitDate() {
    const minDate = new Date(todayDate);
    minDate.setDate(minDate.getDate() - 30);

    const prev = new Date(selectedCircuitDate);
    prev.setDate(prev.getDate() - 1);
    if (prev < minDate) return;

    selectedCircuitDate = prev;
    UpdateCircuitDateInput();
    BuildCircuitChangeStocks();
    UpdateCircuitChangeTable();
}

function NextCircuitDate() {
    const maxDate = new Date(todayDate);
    maxDate.setDate(maxDate.getDate() + 30);

    const next = new Date(selectedCircuitDate);
    next.setDate(next.getDate() + 1);
    if (next > maxDate) return;

    selectedCircuitDate = next;
    UpdateCircuitDateInput();
    BuildCircuitChangeStocks();
    UpdateCircuitChangeTable();
}

function ResetCircuitDateToToday() {
    selectedCircuitDate = new Date(todayDate.getTime());
    UpdateCircuitDateInput();
    BuildCircuitChangeStocks();
    UpdateCircuitChangeTable();
}

function OnCircuitDateChanged() {
    const val = document.getElementById('circuitChangeDateFilter').value;
    if (val) {
        selectedCircuitDate = new Date(val);
        BuildCircuitChangeStocks();
        UpdateCircuitChangeTable();
    }
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

async function ShareCircuitChanges() {
    const rows = circuitChangeTable.querySelectorAll('tbody tr:not(.hide)');
    if (rows.length === 0) return;

    const refDate = selectedCircuitDate || todayDate;
    const isToday = refDate.toDateString() === todayDate.toDateString();
    const dateFormatted = typeof FormatDate === 'function' ? FormatDate(refDate) : refDate.toLocaleDateString('en-In');

    const showSME = document.getElementById('chkCircuitSME').checked;
    const showMB = document.getElementById('chkCircuitMB').checked;
    const showToday = document.getElementById('chkCircuitToday').checked;
    const shareWithImage = document.getElementById('chkShareWithImage').checked;

    let text;
    let title = '*';
    if (showToday) {
        const listingWord = rows.length > 1 ? 'listings' : 'listing';
        const prefix = isToday ? `Today's ${listingWord}` : `${dateFormatted} ${listingWord}`;
        title += `${prefix},*\n\n`;
        text = title;
        rows.forEach((row, i) => {
            const stock = circuitChangeStocks.find(s => s.code === row.cells[3].innerText);
            const ticker = row.cells[3].innerText;
            const price = row.cells[8].innerText;
            const type = row.cells[6].innerText === 'SME' ? 'SME' : 'MB';
            const isT2TStock = row.cells[2].dataset.isInT2TSeries === 'true';
            const t2tSuffix = isT2TStock ? ', *T2T*' : '';

            let extraDetails = [];
            if (type === 'SME' && stock?.lotSize) extraDetails.push(`*Lot*: ${stock.lotSize.toLocaleString('en-IN')}`);
            if (stock?.freeShares) extraDetails.push(`*FF*: ${stock.freeShares.toLocaleString('en-IN')}`);

            const extraSuffix = extraDetails.length > 0 ? `, ${extraDetails.join(', ')}` : '';

            text += `${i + 1}. *${ticker}* (${type}${t2tSuffix}), *Price*: ${price}${extraSuffix}\n`;
        });
    } else {
        if (showSME && !showMB) title += 'SME ';
        else if (showMB && !showSME) title += 'MainBoard ';
        title += 'Circuit Changes,*\n\n';

        text = title;
        rows.forEach((row) => {
            const stock = circuitChangeStocks.find(s => s.code === row.cells[3].innerText);
            let dateStr;
            if (stock?.circuitChangeDate?.toLocaleDateString) {
                dateStr = stock.circuitChangeDate.toLocaleDateString('en-In', {
                    day: '2-digit', month: 'short', year: 'numeric'
                }).replace(/ /g, '-');
            } else {
                return;
            }
            const ticker = row.cells[3].innerText;
            const isRefCircuit = stock.circuitChangeDate?.toDateString && stock.circuitChangeDate.toDateString() === refDate.toDateString();
            const isRefListing = stock.listingDate?.toDateString && stock.listingDate.toDateString() === refDate.toDateString();
            if (isRefCircuit || isRefListing) {
                text += "*" + dateStr + ' ' + ticker + '*\n';
            } else {
                text += dateStr + ' ' + ticker + '\n';
            }
        });
    }

    try {
        if (shareWithImage) {
            await ShareTableAsImage("circuitChangeTable", title.replace(/[\n,*]/g, '') + ', ' + dateFormatted, text);
            return;
        }
    } catch (error) {
        console.warn('Unable to share circuit changes image:', error);
    }
    await ShareText(text);
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
        document.getElementById('chkShareWithImage').checked = prefs.shareWithImage !== false;
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
    settings.circuitChangePreferences.shareWithImage = document.getElementById('chkShareWithImage').checked;

    window.localStorage.setItem("userSettings", JSON.stringify(settings));
}