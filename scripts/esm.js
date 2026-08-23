/**
 * ESM Surveillance Engine (esm.js)
 * Production Implementation for SEBI / NSE / BSE Enhanced Surveillance Measure
 */

(function (global) {
    const calcPct = (curr, base) => {
        if (!base || base <= 0 || !curr) return 0;
        return ((curr - base) / base) * 100;
    };

    const EXCLUDED_SERIES = new Set(["F", "G", "N", "P", "Y", "R", "D", "W", "IL"]);
    const SME_SERIES_NSE = new Set(["SM", "ST"]);
    const SME_SERIES_BSE = new Set(["M", "MT"]);

    function isEligibleSecurity(code, stock) {
        const sym = (code || "").toString().toUpperCase();
        const name = (stock?.SecurityName || stock?.Name || stock?.CompanyName || "").toUpperCase();
        const series = (stock?.Series || (stock?.History && stock.History[0]?.Series) || "").toUpperCase();

        // 1. Exclude Rights Entitlements (RE) & temporary settlement scrips
        if (sym.includes("-RE") || sym.endsWith(".RE") || name.includes("-RE") || name.includes("RIGHTS")) {
            return false;
        }

        // 2. Exclude BSE numeric tracking provisional/dummy codes
        if (/^75\d{4}$/.test(sym)) {
            return false;
        }

        // 3. Exclude Non-Equity Series
        if (EXCLUDED_SERIES.has(series) || name.includes("MUTUAL FUND") || name.includes("ETF")) {
            return false;
        }

        // 4. Exclude Mainboard EQ scrips (ESM specifically targets SME / micro-cap series)
        const isSme = SME_SERIES_NSE.has(series) || SME_SERIES_BSE.has(series);
        if (!isSme && series !== "") {
            return false;
        }

        return true;
    }

    /**
     * Resolves Master Entry from smeSurveillanceMaster across Code, Symbol, Ticker, or ISIN
     */
    function resolveSurveillanceMasterEntry(code, stock) {
        if (typeof esmSurveillanceMaster === "undefined" || !esmSurveillanceMaster) return null;

        const targetKeys = [
            code,
            stock?.Symbol,
            stock?.SecurityCode,
            stock?.ISIN,
            stock?.isin,
            stock?.Ticker,
            stock?.scripId
        ].filter(Boolean).map(s => String(s).trim().toUpperCase());

        for (const key of targetKeys) {
            if (esmSurveillanceMaster[key]) return esmSurveillanceMaster[key];
        }

        for (const k of Object.keys(esmSurveillanceMaster)) {
            const entry = esmSurveillanceMaster[k];
            if (!entry) continue;

            const entrySecCode = (entry.SecurityCode || "").toString().trim().toUpperCase();
            const entrySymbol = (entry.Symbol || "").toString().trim().toUpperCase();
            const entryIsin = (entry.ISIN || "").toString().trim().toUpperCase();

            if (
                (entrySecCode && targetKeys.includes(entrySecCode)) ||
                (entrySymbol && targetKeys.includes(entrySymbol)) ||
                (entryIsin && targetKeys.includes(entryIsin))
            ) {
                return entry;
            }
        }
        return null;
    }

    /**
     * Resolves Listing Date, Calendar Days, and Trading Days across all JSON datasets
     */
    function resolveListingMetadata(code, stock, config) {
        const cleanCode = (code || "").toString().trim().toUpperCase();
        let listingDateStr = null;
        let issuePrice = null;

        // 1. Check custom overrides
        const customOverrides = config?.configs?.esm?.basePriceOverrides || {};
        if (customOverrides[cleanCode]) {
            issuePrice = Number(customOverrides[cleanCode]);
        }

        // 2. Cross-reference newListings.json
        if (typeof newListingsData !== "undefined" && newListingsData) {
            const isin = stock?.ISIN || stock?.isin;
            if (isin && newListingsData[isin]) {
                listingDateStr = newListingsData[isin].listingDate || newListingsData[isin].ListingDate;
                if (!issuePrice) issuePrice = Number(newListingsData[isin].issuePrice || 0);
            }

            if (!listingDateStr || !issuePrice) {
                for (const key of Object.keys(newListingsData)) {
                    const entry = newListingsData[key];
                    if (!entry) continue;

                    const nseCode = (entry.nseCode || "").toString().trim().toUpperCase();
                    const bseCode = (entry.bseCode || "").toString().trim().toUpperCase();
                    const ticker = (entry.ticker || "").toString().trim().toUpperCase();

                    if (cleanCode === key || cleanCode === nseCode || cleanCode === bseCode || cleanCode === ticker) {
                        if (!listingDateStr) listingDateStr = entry.listingDate || entry.ListingDate;
                        if (!issuePrice && entry.issuePrice) issuePrice = Number(entry.issuePrice);
                        break;
                    }
                }
            }
        }

        // 3. Check stock object (from nseOpenClose, bseOpenClose, or smeSurveillanceMaster)
        if (!listingDateStr) {
            listingDateStr = stock?.ListingDate || stock?.listingDate;
        }
        if (!issuePrice) {
            issuePrice = stock?.issuePrice || stock?.basePrice || stock?.Low52W || stock?.YearLow || null;
        }

        // 4. Fallback: Oldest date entry in History array
        if (!listingDateStr && stock?.History && stock.History.length > 0) {
            listingDateStr = stock.History[stock.History.length - 1].HistoryDate;
        }

        // 5. Clean date string and compute exact calendar & trading days
        let daysSinceListing = 0;
        let expectedTradingDays = 0;

        if (listingDateStr && listingDateStr !== "N/A") {
            const cleanDateStr = listingDateStr.replace(/^[A-Za-z]{3},\s*/, '').replace(/,/g, '').trim();
            let listDate = new Date(cleanDateStr);
            if (isNaN(listDate.getTime())) {
                listDate = new Date(listingDateStr);
            }

            if (!isNaN(listDate.getTime())) {
                const today = typeof todayDate !== 'undefined' ? new Date(todayDate) : new Date();
                today.setHours(0, 0, 0, 0);
                listDate.setHours(0, 0, 0, 0);

                const diffTime = today.getTime() - listDate.getTime();
                daysSinceListing = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

                let iter = new Date(listDate);
                while (iter <= today) {
                    if (typeof IsWorkingDay === 'function') {
                        if (IsWorkingDay(iter)) expectedTradingDays++;
                    } else {
                        const day = iter.getDay();
                        if (day !== 0 && day !== 6) expectedTradingDays++;
                    }
                    iter.setDate(iter.getDate() + 1);
                }
            }
        }

        return {
            listingDate: listingDateStr || "N/A",
            daysSinceListing,
            expectedTradingDays,
            issuePrice: issuePrice && issuePrice > 0 ? issuePrice : null
        };
    }

    function evaluateStock(code, stock, config, meta = {}) {
        const esmCfg = config?.configs?.esm || {};
        const lookback = esmCfg.lookbackDays || 65;
        const stg1Cfg = esmCfg.stage1 || {
            highLowVarPct: { m3: 75, m6: 100, m12: 150 },
            c2cVarPct: { m3: 50, m6: 75, m12: 100 }
        };
        const stg2Cfg = esmCfg.stage2 || {
            consecutive5dC2cPct: 15,
            monthlyC2cPct: 30,
            stageDownMonthlyC2cPct: 8
        };
        const buffer = esmCfg.warningBufferPct || 0.85;

        // 1. Resolve master record across all identifiers
        const masterEntry = resolveSurveillanceMasterEntry(code, stock);

        let activeStage = "NORMAL";
        let isDirectEsmStage = false;
        let initialBadge = "";

        const stageRaw = String(masterEntry?.esmStage || stock?.esmStage || stock?.ESM?.stage || "").toLowerCase();
        if (stageRaw.includes("stage 2") || stageRaw.includes("stage ii") || stageRaw.includes("stage2")) {
            activeStage = "ESM_STAGE_2";
            isDirectEsmStage = true;
            initialBadge = "ESM Stage II";
        } else if (stageRaw.includes("stage 1") || stageRaw.includes("stage i") || stageRaw.includes("stage1")) {
            activeStage = "ESM_STAGE_1";
            isDirectEsmStage = true;
            initialBadge = "ESM Stage I";
        }

        const esmState = {
            isExempt: false,
            exemptionReason: null,
            stage: activeStage,
            status: activeStage !== "NORMAL" ? "ACTIVE_ESM" : "SAFE",
            badge: initialBadge,
            flag: activeStage === "ESM_STAGE_2" ? 3 : (activeStage === "ESM_STAGE_1" ? 2 : 0),
            breaches: [],
            warnings: [],
            metrics: {
                currentPrice: 0,
                highLowVar: 0,
                c2cVar: 0,
                c2c5D: 0,
                c2cMonthly: 0,
                periodHigh: 0,
                periodLow: 0,
                lookbackBars: 0,
                listingDate: "N/A",
                daysSinceListing: 0
            }
        };

        // 2. Base Instrument Eligibility Filters
        if (!isEligibleSecurity(code, stock)) {
            esmState.isExempt = true;
            esmState.exemptionReason = "Mainboard / Non-SME series excluded from ESM scope";
            esmState.badge = "";
            stock.ESM = esmState;
            return stock.ESM;
        }

        if (meta.isFnO || meta.isIBC) {
            esmState.isExempt = true;
            esmState.exemptionReason = meta.isFnO ? "F&O Active" : "Under IBC";
            esmState.badge = "";
            stock.ESM = esmState;
            return stock.ESM;
        }

        // 3. Short-Term ASM Exemption
        if (masterEntry && masterEntry.asmStage && masterEntry.asmStage !== "None" && !isDirectEsmStage) {
            esmState.isExempt = true;
            esmState.exemptionReason = `Security is active under ${masterEntry.asmStage} (Exempt from ESM)`;
            esmState.badge = "";
            stock.ESM = esmState;
            return stock.ESM;
        }

        // 4. Compute Full Lookback Metrics & Price History
        const rawHistory = (stock.History || []).filter(h => h && (h.Close || h.PrevClose || h.High || h.Low || h.Open));
        const history = rawHistory.slice(0, lookback);

        const currentClose = stock.Close || (history.length > 0 ? history[0].Close : stock.PrevClose) || 0;
        esmState.metrics.currentPrice = currentClose;
        const totalTradingSessions = (stock.Close || stock.Open ? 1 : 0) + history.length;
        esmState.metrics.lookbackBars = totalTradingSessions;

        const listMeta = resolveListingMetadata(code, stock, config);
        esmState.metrics.listingDate = listMeta.listingDate;
        esmState.metrics.daysSinceListing = listMeta.daysSinceListing;
        esmState.metrics.expectedTradingDays = listMeta.expectedTradingDays || history.length;

        let periodHigh = stock.High || stock.High52W || stock.High52 || stock.YearHigh || currentClose;
        let periodLow = stock.Low || stock.Low52W || stock.Low52 || stock.YearLow || stock.PrevClose || currentClose;
        let oldestClose = stock.PrevClose || currentClose;

        if (listMeta.issuePrice && listMeta.issuePrice > 0) {
            if (listMeta.issuePrice < periodLow) periodLow = listMeta.issuePrice;
            if (history.length < 60) oldestClose = listMeta.issuePrice;
        }

        if (history.length > 0) {
            oldestClose = oldestClose || history[history.length - 1]?.Close || history[history.length - 1]?.PrevClose || currentClose;
            history.forEach(bar => {
                const barHigh = bar.High || bar.Close || bar.Open;
                const barLow = bar.Low || bar.Close || bar.Open;
                if (barHigh && barHigh > periodHigh) periodHigh = barHigh;
                if (barLow && barLow > 0 && barLow < periodLow) periodLow = barLow;
            });
        }

        if (stock.Low && stock.Low > 0 && stock.Low < periodLow) periodLow = stock.Low;
        if (stock.Open && stock.Open > 0 && stock.Open < periodLow) periodLow = stock.Open;

        if (periodLow > 0 && periodHigh >= periodLow) {
            esmState.metrics.periodHigh = periodHigh;
            esmState.metrics.periodLow = periodLow;
            esmState.metrics.highLowVar = calcPct(periodHigh, periodLow);
        }
        esmState.metrics.c2cVar = calcPct(currentClose, oldestClose);

        if (history.length >= 5) {
            const close5D = history[4]?.Close || history[4]?.PrevClose || oldestClose;
            esmState.metrics.c2c5D = calcPct(currentClose, close5D);
        } else {
            esmState.metrics.c2c5D = esmState.metrics.c2cVar;
        }

        if (history.length >= 20) {
            const closeMonth = history[19]?.Close || history[19]?.PrevClose || oldestClose;
            esmState.metrics.c2cMonthly = calcPct(currentClose, closeMonth);
        } else {
            esmState.metrics.c2cMonthly = esmState.metrics.c2cVar;
        }

        // 5. Market Cap Exemption Check (Applies only if NOT already in active ESM Stage)
        const mcapCr = Number(
            meta.marketCapCr ||
            masterEntry?.MarketCapCr ||
            stock.marketCapCr ||
            stock.MarketCapCr ||
            (typeof newListingsData !== "undefined" && (newListingsData[code]?.marketCapCr || newListingsData[stock.ISIN]?.marketCapCr)) ||
            0
        );

        const maxMcapLimit = esmCfg.maxMcapCr || 500;
        if (!isDirectEsmStage && (mcapCr >= maxMcapLimit || (masterEntry && masterEntry.isEsmEligible === false))) {
            esmState.isExempt = true;
            esmState.exemptionReason = `Market Cap (₹${mcapCr.toFixed(2)} Cr) exceeds ₹${maxMcapLimit} Cr`;
            esmState.badge = "";
            stock.ESM = esmState;
            return stock.ESM;
        }

        // 6. Direct Stage Resolution for Active ESM Scrips
        if (isDirectEsmStage) {
            if (activeStage === "ESM_STAGE_2") {
                esmState.badge = "ESM Stage II";
                esmState.breaches.push("Officially under ESM Stage II");
            } else {
                esmState.badge = "ESM Stage I";
                esmState.breaches.push("Officially under ESM Stage I");

                if (
                    esmState.metrics.c2c5D >= stg2Cfg.consecutive5dC2cPct ||
                    esmState.metrics.c2cMonthly >= stg2Cfg.monthlyC2cPct
                ) {
                    esmState.flag = 3;
                    esmState.status = "STAGE_2_IMMINENT";
                    esmState.badge = "ESM Stage II Imminent";
                    esmState.breaches.push(
                        `Stage II Trigger: 5D (${esmState.metrics.c2c5D.toFixed(2)}%) or Monthly (${esmState.metrics.c2cMonthly.toFixed(2)}%) threshold reached.`
                    );
                }
            }
            stock.ESM = esmState;
            return stock.ESM;
        }

        // 7. Potential Entry Evaluations (For Non-ESM SME Scrips)
        const hlLimit = stg1Cfg.highLowVarPct?.m3 || 75;
        const c2cLimit = stg1Cfg.c2cVarPct?.m3 || 50;

        if (esmState.metrics.highLowVar >= hlLimit) {
            esmState.breaches.push(`High-Low Var: ${esmState.metrics.highLowVar.toFixed(2)}% >= ${hlLimit}%`);
        }
        if (esmState.metrics.c2cVar >= c2cLimit) {
            esmState.breaches.push(`C2C Var: ${esmState.metrics.c2cVar.toFixed(2)}% >= ${c2cLimit}%`);
        }

        if (esmState.breaches.length === 0) {
            const hlWarnLimit = hlLimit * buffer;
            const c2cWarnLimit = c2cLimit * buffer;

            if (esmState.metrics.highLowVar >= hlWarnLimit) {
                esmState.warnings.push(`High-Low near trigger: ${esmState.metrics.highLowVar.toFixed(2)}%`);
            }
            if (esmState.metrics.c2cVar >= c2cWarnLimit) {
                esmState.warnings.push(`C2C near trigger: ${esmState.metrics.c2cVar.toFixed(2)}%`);
            }
            if (esmState.metrics.c2c5D >= stg2Cfg.consecutive5dC2cPct) {
                esmState.warnings.push(`5-Day Momentum: +${esmState.metrics.c2c5D.toFixed(2)}%`);
            }
        }

        if (esmState.breaches.length > 0) {
            esmState.flag = 2;
            esmState.status = "STAGE_1_IMMINENT";
            esmState.badge = "ESM Stage I Imminent";
        } else if (esmState.warnings.length > 0) {
            esmState.flag = 1;
            esmState.status = "WARNING_ZONE";
            esmState.badge = "ESM Warning (>85%)";
        } else {
            esmState.badge = "";
        }

        stock.ESM = esmState;
        return stock.ESM;
    }

    function processDataset(dataset, config, metaLookup = {}) {
        const dataPool = dataset?.data || dataset || {};
        const summary = {
            totalScanned: 0,
            activeStage2: [],
            activeStage1: [],
            stage2Imminent: [],
            stage1Imminent: [],
            warningZone: [],
            safeCount: 0,
            exemptCount: 0
        };

        if (!config?.configs?.esm?.enabled) return summary;

        Object.keys(dataPool).forEach(code => {
            if (code === "dateTimeStamp") return;
            const stock = dataPool[code];
            const meta = metaLookup[code] || {};
            const esm = evaluateStock(code, stock, config, meta);

            summary.totalScanned++;

            if (esm.isExempt) {
                summary.exemptCount++;
                return;
            }

            const itemInfo = {
                code,
                name: stock.SecurityName || stock.CompanyName || code,
                series: stock.Series || (stock.History && stock.History[0]?.Series) || "SM",
                currentPrice: esm.metrics.currentPrice,
                highLowVar: `${esm.metrics.highLowVar.toFixed(2)}%`,
                c2cVar: `${esm.metrics.c2cVar.toFixed(2)}%`,
                badge: esm.badge,
                flag: esm.flag,
                status: esm.status,
                reasons: esm.breaches.concat(esm.warnings)
            };

            if (esm.status === "ACTIVE_ESM") {
                if (esm.stage === "ESM_STAGE_2") summary.activeStage2.push(itemInfo);
                else summary.activeStage1.push(itemInfo);
            } else if (esm.flag === 3) summary.stage2Imminent.push(itemInfo);
            else if (esm.flag === 2) summary.stage1Imminent.push(itemInfo);
            else if (esm.flag === 1) summary.warningZone.push(itemInfo);
            else summary.safeCount++;
        });

        return summary;
    }

    global.ESM_ENGINE = {
        evaluateStock,
        processDataset
    };
})(typeof window !== "undefined" ? window : globalThis);