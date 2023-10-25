var nseData = { data: {} };
var bseData = { data: {} };

const dataFiles = [
  ['nseOpenClose.json', 'nseDelivery.json', 'nseBulkDeal.json'],
  ['bseOpenClose.json', 'bseDelivery.json', 'bseBulkDeal.json'],
];

async function LoadData() {
  const messages = [
    ['Nse Open Close data', 'Nse Delivery data', 'Nse Bulk Deals data'],
    ['Bse Open Close data', 'Bse Delivery data', 'Bse Bulk Deals data'],
  ];

  for (let j = 0; j < dataFiles[0].length; j++) {
    for (let i = 0; i < dataFiles.length; i++) {
      UpdateLoader(true, 'Downloading ' + messages[i][j]);
      let dataJson = await GetData(dataFiles[i][j]);
      IsUpdateData(dataValidityTable.rows[i + 1].cells[j + 1], dataJson.dateTimeStamp);
      i == 0 && (nseData = MergeData(nseData, dataJson));
      i == 1 && (bseData = MergeData(bseData, dataJson));
    }
  }

  if (settings.configs.t2t) {
    UpdateLoader(true, "Checking for T2T stocks", 0.5);
    CheckForT10(nseData);
    CheckForT10(bseData);
  }

  nseData = nseData.data;
  bseData = bseData.data;

  loadDataFromLocal();
  UpdateLoader(false);
  setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut * 60 * 1000);
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
    if (!(endDate.getDay() == 0 || endDate.getDay() == 6 || CheckForHoliday(endDate))) {
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
          flag = false;
          break loop1;
        }
      }
    }
    flag && setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut * 60 * 1000);
  }
};

// async function CheckForLatestData() {
//   if (document.getElementById('updatedDataAvailable').style.display != 'block') {

//     let flags = new Array(2);
//     flags[0] = new Array(3).fill(true);
//     flags[1] = new Array(3).fill(true);

//     loop1:
//     for (let j = 0; j < dataFiles[0].length; j++) {
//       for (let i = 0; i < dataFiles.length; i++) {
//         let dataJson = await GetData(dataFiles[i][j]);
//         if (new Date(dataJson.dateTimeStamp) > new Date(dataValidityTable.rows[i + 1].cells[j + 1].innerText)) {
//           document.getElementById('updatedDataAvailable').style.display = 'block';
//           flags[i][j] = false;
//           break loop1;
//         }
//         else if (new Date(dataJson.dateTimeStamp).getTime() == new Date(dataValidityTable.rows[i + 1].cells[j + 1].innerText).getTime()) {
//           flags[i][j] = false;
//         }
//       }
//     }
//     flags.flat().indexOf(true) != -1 && setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut* 60 * 1000);
//   }
// };