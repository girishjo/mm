var nseData = { data: {} };
var bseData = { data: {} };
var esmSurveillanceMaster = {};
var newListingsData = null;

const dataFiles = [
  ['nseOpenClose.json', 'nseDelivery.json', 'nseBulkDeal.json'],
  ['bseOpenClose.json', 'bseDelivery.json', 'bseBulkDeal.json'],
];

function RequestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function ShowNewDataNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('Money Makers - Girish Joshi', {
      body: 'Updated data is now available. Tap to refresh.',
      icon: './images/favicon.ico'
    });
    notification.onclick = function () {
      window.focus();
      location.reload();
    };
  }
}

async function LoadData() {
  RequestNotificationPermission();
  const messages = [
    ['Nse Open Close data', 'Nse Delivery data', 'Nse Bulk Deals data'],
    ['Bse Open Close data', 'Bse Delivery data', 'Bse Bulk Deals data'],
  ];

  for (let j = 0; j < dataFiles[0].length; j++) {
    for (let i = 0; i < dataFiles.length; i++) {
      UpdateLoader(true, 'Downloading ' + messages[i][j]);
      let dataJson = await GetData(dataFiles[i][j], true);
      IsUpdateData(dataValidityTable.rows[i + 1].cells[j + 1], dataJson.dateTimeStamp);
      i == 0 && (nseData = MergeData(nseData, dataJson));
      i == 1 && (bseData = MergeData(bseData, dataJson));
    }
  }

  // 1. Ingest SME Surveillance Master Dataset
  try {
    UpdateLoader(true, 'Downloading Surveillance Master', 0.4);
    const survJson = await GetData('smeSurveillanceMaster.json', true);
    esmSurveillanceMaster = (survJson && survJson.data) ? survJson.data : {};
  } catch (e) {
    esmSurveillanceMaster = {};
  }

  if (settings.configs.t2t) {
    UpdateLoader(true, "Checking for T2T stocks", 0.5);
    CheckForT10(nseData);
    CheckForT10(bseData);
  }

  const preserveTimestamp = (data) => {
    const timestamp = new Date(data.dateTimeStamp);
    const extracted = data.data;
    extracted.dateTimeStamp = timestamp;
    return extracted;
  };

  nseData = preserveTimestamp(nseData);
  bseData = preserveTimestamp(bseData);

  // 2. Await new listings data BEFORE running surveillance scans
  await MergeTodayListings();

  // 3. Run ESM Surveillance Checks
  if (typeof ESM_ENGINE !== 'undefined' && settings.configs?.esm?.enabled) {
    UpdateLoader(true, "Checking for ESM", 0.5);
    UpdateLoader(true, "Scanning ESM surveillance criteria", 0.7);
    const nseEsmSummary = ESM_ENGINE.processDataset(nseData, settings);
    const bseEsmSummary = ESM_ENGINE.processDataset(bseData, settings);

    const alertCount = nseEsmSummary.stage1Imminent.length + nseEsmSummary.stage2Imminent.length +
      bseEsmSummary.stage1Imminent.length + bseEsmSummary.stage2Imminent.length;

    if (alertCount > 0) {
      console.warn(`[ESM Surveillance Alert] ${alertCount} scrip(s) qualify for ESM Stage I / II:`, {
        NSE: nseEsmSummary,
        BSE: bseEsmSummary
      });
    }
  }

  // Reinitialize auto-complete cache with new data
  if (typeof autoCompleteCache !== 'undefined') {
    autoCompleteCache.initialized = false;
  }

  loadDataFromLocal();
  UpdateLoader(false);
  setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut * 60 * 1000);
  OpenSpecificTab();
}

async function MergeTodayListings() {
  try {
    newListingsData = await GetData('newListings.json', true);
  } catch (e) {
    newListingsData = {};
  }

  if (!newListingsData) newListingsData = {};

  // Preserve all issue prices and link to bseData/nseData
  Object.keys(newListingsData).forEach(isin => {
    const entry = newListingsData[isin];
    if (!entry) return;

    if (entry.nseCode && nseData[entry.nseCode]) {
      if (!entry.issuePrice) {
        entry.issuePrice = (nseData[entry.nseCode].History && nseData[entry.nseCode].History[0]?.PrevClose) || nseData[entry.nseCode].PrevClose;
      }
    }

    const bseKey = entry.bseCode ? String(entry.bseCode) : null;
    if (bseKey && bseData[bseKey]) {
      if (!bseData[bseKey].PrevClose && entry.issuePrice) {
        bseData[bseKey].PrevClose = entry.issuePrice;
      }
    }
  });
}

function OpenSpecificTab() {
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get('tab');
  Tabs[tab] && openTab(Tabs[tab]);
}

function CheckForT10(result) {
  for (const stockCode of Object.keys(result.data)) {
    let res = result.data[stockCode];
    const series = res.Series || (res.History && res.History.length > 0 && res.History[0].Series);
    if ((settings.configs.t2tSMESeries.includes(series) || settings.configs.t2tMBSeries.includes(series)) && res.History) {
      const startDateString = res.History[res.History.length - 1].HistoryDate;
      var d = new Date(startDateString);
      d = GetNthDay(d, 10);

      const prevDate = GetNthDay(d, 2, false);
      const nextDate = GetNthDay(d, 2);
      const smDate = nextDate.toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" });

      switch (todayDate.toDateString()) {
        case prevDate.toDateString():
          res["T2T"] = 0;
          res["T2TExitDate"] = smDate;
          break;
        case d.toDateString():
          res["T2T"] = 1;
          res["T2TExitDate"] = smDate;
          break;
        case nextDate.toDateString():
          res["T2T"] = 2;
          res["T2TExitDate"] = smDate;
          break;
      }
    }
  }
}

function GetNthDay(startDate, nthDay, forward = true) {
  let counter = 1;	// considering today/listing day as 1st day
  let endDate = new Date(startDate);
  while (counter < nthDay) {
    endDate = new Date(endDate.setDate(endDate.getDate() + (forward ? 1 : -1)));

    let shouldCount = false;

    if (typeof IsSpecialTradingDay === 'function') {
      const specialDay = IsSpecialTradingDay(endDate);
      if (specialDay) {
        shouldCount = specialDay.countForNthDay !== false;
      } else {
        if (typeof IsTradingDay === 'function') {
          shouldCount = IsTradingDay(endDate);
        } else {
          shouldCount = !(endDate.getDay() == 0 || endDate.getDay() == 6 || CheckForHoliday(endDate));
        }
      }
    } else {
      if (typeof IsTradingDay === 'function') {
        shouldCount = IsTradingDay(endDate);
      } else {
        shouldCount = !(endDate.getDay() == 0 || endDate.getDay() == 6 || CheckForHoliday(endDate));
      }
    }

    if (shouldCount) {
      counter++;
    }
  }
  return endDate;
}

function CheckForHoliday(date) {
  for (let i = 0; i < settings.marketHolidays.length; i++) {
    const holiday = new Date(settings.marketHolidays[i]);
    if (date.toDateString() == holiday.toDateString()) {
      return true;
    }
  }
  return false;
}

function IsUpdateData(placeHolder, dateTimeStamp) {
  placeHolder.innerText = dateTimeStamp;
  if (new Date(dateTimeStamp).getDate() != todayDate.getDate()) {
    placeHolder.style.background = 'lightcoral';
    return false;
  }
  else {
    placeHolder.style.background = 'lightgreen';
    return true;
  }
}

async function CheckForLatestData() {
  if (document.getElementById('updatedDataAvailable').style.display != 'block') {
    let flag = true;

    loop1:
    for (let j = 0; j < dataFiles[0].length; j++) {
      for (let i = 0; i < dataFiles.length; i++) {
        let dataJson = await GetData(dataFiles[i][j]);
        if (new Date(dataJson.dateTimeStamp) > new Date(dataValidityTable.rows[i + 1].cells[j + 1].innerText)) {
          document.getElementById('updatedDataAvailable').style.display = 'block';
          ShowNewDataNotification();
          flag = false;
          break loop1;
        }
      }
    }
    flag && setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut * 60 * 1000);
  }
};